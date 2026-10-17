#!/usr/bin/env python3
"""Render previews from current source; cache by dependencies, props and output hash."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def browser_path(explicit=None):
    if explicit:
        path = Path(explicit).expanduser()
        if not path.is_file(): raise RuntimeError(f'Browser not found: {path}')
        return str(path.resolve())
    if os.environ.get('REMOTION_BROWSER_EXECUTABLE'): return browser_path(os.environ['REMOTION_BROWSER_EXECUTABLE'])
    for command in ('google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome', 'chrome-headless-shell'):
        found = shutil.which(command)
        if found and Path(found).is_file(): return str(Path(found).resolve())
    home = Path.home()
    local_app_data = Path(os.environ.get('LOCALAPPDATA') or home/'AppData/Local')
    candidates = [
        Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
        Path('/Applications/Chromium.app/Contents/MacOS/Chromium'),
        home/'Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        home/'Applications/Chromium.app/Contents/MacOS/Chromium',
        local_app_data/'Google/Chrome/Application/chrome.exe',
    ]
    for variable, default in [('PROGRAMFILES', 'C:/Program Files'), ('PROGRAMFILES(X86)', 'C:/Program Files (x86)')]:
        candidates.append(Path(os.environ.get(variable) or default)/'Google/Chrome/Application/chrome.exe')
    for path in candidates:
        if path.is_file(): return str(path.resolve())
    cache_bases = [local_app_data/'ms-playwright', home/'Library/Caches/ms-playwright',
                   Path(os.environ.get('XDG_CACHE_HOME') or home/'.cache')/'ms-playwright']
    playwright_path = os.environ.get('PLAYWRIGHT_BROWSERS_PATH')
    if playwright_path and playwright_path != '0': cache_bases.insert(0, Path(playwright_path).expanduser())
    cached = []
    for base in cache_bases:
        if base.exists():
            for pattern in [
                'chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell',
                'chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell.exe',
                'chromium-*/chrome-win*/chrome.exe', 'chromium-*/chrome-linux*/chrome',
                'chromium-*/chrome-mac*/Chromium.app/Contents/MacOS/Chromium',
                'chromium-*/chrome-mac*/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
            ]:
                cached.extend(base.glob(pattern))
    existing = [p for p in cached if p.is_file()]
    if not existing: raise RuntimeError('No existing Chromium found; pass --browser. Browser installation is not automatic.')
    return str(sorted(existing,key=lambda p:p.stat().st_mtime,reverse=True)[0].resolve())

def bridge(request):
    node = shutil.which('node')
    if not node: raise RuntimeError('Node.js not found')
    temp=ROOT/'qc/render-temp'; temp.mkdir(parents=True,exist_ok=True)
    environment={**os.environ,'TEMP':str(temp),'TMP':str(temp),'TMPDIR':str(temp)}
    result = subprocess.run([node,str(ROOT/'scripts/remotion_bridge.cjs')],input=json.dumps(request),cwd=ROOT,text=True,encoding='utf-8',capture_output=True,env=environment)
    if result.returncode: raise RuntimeError(result.stderr[-6000:] or result.stdout[-6000:])
    return json.loads(result.stdout)

def source_dependencies(path,found=None):
    found = set() if found is None else found; path=path.resolve()
    if path in found or not path.is_file(): return found
    found.add(path)
    if path.suffix in ('.ts','.tsx'):
        for imp in re.findall(r"(?:from\s+|import\s*)['\"]([^'\"]+)['\"]",path.read_text(encoding='utf-8')):
            if not imp.startswith('.'): continue
            base=path.parent/imp
            for candidate in [base,base.with_suffix('.ts'),base.with_suffix('.tsx'),base.with_suffix('.json'),base/'index.ts']:
                if candidate.is_file(): source_dependencies(candidate,found); break
    return found

def fingerprint(shot,composition,config):
    path=ROOT/shot['source'].split('#')[0] if 'source' in shot else ROOT/'src/motion/Fixtures.tsx'
    files=source_dependencies(path)|set((ROOT/'public').rglob('*'))
    files|={ROOT/'remotion.config.ts',ROOT/'scripts/remotion_bridge.cjs',ROOT/'scripts/preview_generation.py'}
    for name in ['remotion','react','@remotion/renderer','@remotion/bundler']: files.add(ROOT/'node_modules'/name/'package.json')
    payload={'composition':composition,'config':config,'files':{str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else str(p):digest(p) for p in sorted(files) if p.is_file()}}
    return hashlib.sha256(json.dumps(payload,sort_keys=True,ensure_ascii=False,default=str).encode()).hexdigest()

def probe(path):
    result=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,width,height,r_frame_rate,nb_frames','-of','json',str(path)],text=True,capture_output=True,encoding='utf-8')
    if result.returncode: raise RuntimeError(result.stderr)
    return json.loads(result.stdout)

def check_output(path,composition,scale):
    info=probe(path); videos=[s for s in info['streams'] if s['codec_type']=='video']
    if len(videos)!=1: raise RuntimeError('Expected one video stream')
    stream=videos[0]; expected=[round(composition['width']*scale),round(composition['height']*scale)]
    if [stream['width'],stream['height']]!=expected: raise RuntimeError(f'Wrong dimensions: {stream}')
    numerator,denominator=map(int,stream['r_frame_rate'].split('/'))
    if abs(numerator/denominator-composition['fps'])>1e-6: raise RuntimeError('Wrong fps')
    duration=composition['durationInFrames']/composition['fps']
    if abs(float(info['format']['duration'])-duration)>1/composition['fps']+.005: raise RuntimeError('Wrong duration')
    if stream.get('nb_frames') not in (None,'N/A') and int(stream['nb_frames'])!=composition['durationInFrames']: raise RuntimeError('Wrong frame count')
    decoded=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(path),'-f','null','-'],capture_output=True,text=True)
    if decoded.returncode: raise RuntimeError(decoded.stderr)
    return info

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--browser'); parser.add_argument('--scale',type=float,default=.5)
    parser.add_argument('--workers',type=int,default=2); parser.add_argument('--concurrency',type=int,default=2)
    parser.add_argument('--only',nargs='*'); parser.add_argument('--only-missing',action='store_true',help='Existing stale files are regenerated.')
    parser.add_argument('--fixtures',action='store_true'); parser.add_argument('--force',action='store_true'); args=parser.parse_args()
    if not 0<args.scale<=1 or args.workers<1 or args.concurrency<1: parser.error('Invalid scale or worker count')
    browser=browser_path(args.browser); config={'browser':browser,'scale':args.scale,'codec':'h264','crf':25,'concurrency':args.concurrency,'muted':True}
    manifest=json.loads((ROOT/'shot-library.json').read_text(encoding='utf-8'))
    bundle_inputs=[p for sub in ('src','public','scripts') for p in (ROOT/sub).rglob('*') if p.is_file() and '__pycache__' not in str(p)]
    bundle_sources={str(p.relative_to(ROOT)):digest(p) for p in sorted(bundle_inputs)}
    bundle_hash=hashlib.sha256(json.dumps(bundle_sources,sort_keys=True).encode()).hexdigest()[:16]; outdir=ROOT/'qc/bundles'/bundle_hash
    if not (outdir/'index.html').exists(): bridge({'command':'bundle','outDir':str(outdir)})
    comps=bridge({'command':'list','serveUrl':str(outdir),'browser':browser}); (ROOT/'qc').mkdir(exist_ok=True)
    (ROOT/'qc/compositions.json').write_text(json.dumps(comps,ensure_ascii=False,indent=2),encoding='utf-8'); by_id={c['id']:c for c in comps}
    shots=manifest[:]
    if args.fixtures:
        for name in ['MotionTechniqueReel30','CausalProcessFixture30','MotionTechniqueReel60','CausalProcessFixture60','MotionEdgeCases30','MotionEdgeCases60']: shots.append({'id':name,'composition':name,'preview':f'previews/validation/{name}.mp4'})
    if args.only:
        requested=set(args.only); shots=[s for s in shots if s['id'] in requested or s['composition'] in requested]
        if not shots: parser.error('No matching shots')
    current_inputs=[p for sub in ('src','public','scripts') for p in (ROOT/sub).rglob('*') if p.is_file() and '__pycache__' not in str(p)]
    if bundle_sources!={str(p.relative_to(ROOT)):digest(p) for p in sorted(current_inputs)}:
        raise RuntimeError('Source changed while preparing the bundle; rerun preview generation')
    # Freeze all signatures before dispatch; queued jobs must not claim later edits were rendered.
    signatures={s['id']:fingerprint(s,by_id[s['composition']],config) for s in shots}
    cache_path=ROOT/'qc/preview-cache.json'; cache=json.loads(cache_path.read_text(encoding='utf-8')) if cache_path.exists() else {}
    def render(shot):
        comp=by_id[shot['composition']]; target=ROOT/shot['preview']; target.parent.mkdir(parents=True,exist_ok=True)
        signature=signatures[shot['id']]; old=cache.get(shot['id'],{})
        if not args.force and target.is_file() and old.get('fingerprint')==signature and old.get('outputSha256')==digest(target): return shot['id'],{**old,'cached':True}
        bridge({'command':'render','serveUrl':str(outdir),'browser':browser,'composition':comp['id'],'output':str(target),'scale':args.scale,'concurrency':args.concurrency})
        info=check_output(target,comp,args.scale)
        return shot['id'],{'fingerprint':signature,'outputSha256':digest(target),'preview':shot['preview'],'config':config,'composition':{k:comp[k] for k in ('id','width','height','fps','durationInFrames','props')},'probe':info,'technicalStatus':'passed','visualStatus':'not-reviewed','generatedAt':datetime.now(timezone.utc).isoformat(),'cached':False}
    failures=[]
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures={executor.submit(render,s):s['id'] for s in shots}
        for i,future in enumerate(as_completed(futures),1):
            try:
                shot_id,row=future.result(); cache[shot_id]=row; cache_path.write_text(json.dumps(cache,ensure_ascii=False,indent=2),encoding='utf-8')
                print(f'[{i}/{len(shots)}] {shot_id}: '+('cached' if row['cached'] else 'rendered and decoded'),flush=True)
            except Exception as error:
                failures.append({'id':futures[future],'error':str(error)}); print(f'FAILED {futures[future]}: {error}',flush=True)
    (ROOT/'qc/render-failures.json').write_text(json.dumps(failures,ensure_ascii=False,indent=2),encoding='utf-8'); raise SystemExit(1 if failures else 0)
if __name__=='__main__': main()
