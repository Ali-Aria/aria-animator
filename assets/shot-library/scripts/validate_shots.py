#!/usr/bin/env python3
"""Keep structural, technical-render and visual-review results independent."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess
import sys
from preview_generation import ROOT, check_output, digest, fingerprint

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--require-previews',action='store_true')
    parser.add_argument('--render',action='store_true',help='Render the existing SRT production examples.')
    args=parser.parse_args()
    if args.render:
        subprocess.run([sys.executable,str(ROOT/'scripts/render_previews.py'),'--only','WideKnowledgeWorld','SrtDrivenVideo'],check=True)
    manifest=json.loads((ROOT/'shot-library.json').read_text(encoding='utf-8'))
    timeline=json.loads((ROOT/'public/data/srt-timeline.json').read_text(encoding='utf-8'))
    root_text=(ROOT/'src/Root.tsx').read_text(encoding='utf-8')
    registered=set(re.findall(r'id="([^"]+)"',root_text))
    errors=[]; warnings=[]; ids=set()
    if timeline.get('authority')!='srt' or timeline.get('fps',0)<=0: errors.append('Invalid SRT authority or fps')
    previous_end=0; cue_ids=set()
    for beat in timeline.get('beats',[]):
        if beat.get('id') in cue_ids: errors.append('Duplicate SRT cue')
        cue_ids.add(beat.get('id'))
        if beat.get('caption',{}).get('text')!=beat.get('text'): errors.append(f'{beat["id"]}: caption differs from source')
        if beat.get('from',-1)<previous_end or beat.get('duration',0)<=0: errors.append(f'{beat["id"]}: invalid time')
        previous_end=beat.get('end',previous_end)
    if previous_end>timeline.get('durationInFrames',0): errors.append('SRT duration is too short')
    schema_status='not-checked'
    try:
        from jsonschema import Draft202012Validator
        schema=json.loads((ROOT/'schemas/shot-intent.schema.json').read_text(encoding='utf-8'))
        Draft202012Validator.check_schema(schema)
        validator=Draft202012Validator(schema)
        for options in [{'motionProfile':'process','timingSeconds':{'entry':.4,'hold':2,'phases':{'travel':{'start':.5,'duration':.6}}}}, {'motionProfile':'impact','motion':{'entryFrames':9},'timingFrames':{'entry':12,'exit':0}}]:
            validator.validate({'id':'check','sourceBeatId':'cue-1','fromFrame':0,'durationInFrames':90,'visualRole':'overlay','composition':'KineticStatement',**options})
        invalid={'id':'check','sourceBeatId':'cue-1','fromFrame':0,'durationInFrames':90,'visualRole':'overlay','composition':'KineticStatement','motionProfile':'unknown'}
        if validator.is_valid(invalid): raise RuntimeError('Schema accepts unknown motionProfile')
        schema_status='passed'
    except ImportError:
        warnings.append('jsonschema unavailable: schema validation not executed')
    except Exception as error:
        schema_status='failed'; errors.append(f'Schema validation failed: {error}')
    structure_errors=errors[:]
    compositions=json.loads((ROOT/'qc/compositions.json').read_text(encoding='utf-8')) if (ROOT/'qc/compositions.json').exists() else []
    comp_map={c['id']:c for c in compositions}
    cache=json.loads((ROOT/'qc/preview-cache.json').read_text(encoding='utf-8')) if (ROOT/'qc/preview-cache.json').exists() else {}
    review=json.loads((ROOT/'qc/visual-review.json').read_text(encoding='utf-8')) if (ROOT/'qc/visual-review.json').exists() else {}
    reviews=review.get('shots',{})
    rows=[]
    for shot in manifest:
        structure_start=len(errors)
        shot_id=shot.get('id')
        if not shot_id or shot_id in ids: errors.append(f'Duplicate or missing ID: {shot_id}')
        ids.add(shot_id)
        if shot.get('composition') not in registered: errors.append(f'{shot_id}: not registered')
        if not shot.get('category') or not shot.get('tags'): errors.append(f'{shot_id}: missing classification')
        source=ROOT/shot.get('source','').split('#')[0]
        if not source.is_file(): errors.append(f'{shot_id}: missing source')
        if shot.get('production_status')=='生产版':
            for field in ('parameters','supported_inputs','transition_contract','version'):
                if not shot.get(field): errors.append(f'{shot_id}: missing {field}')
        shot_structure_errors=errors[structure_start:]
        structure_errors.extend(shot_structure_errors)
        target=ROOT/shot.get('preview','')
        row={'id':shot_id,'composition':shot.get('composition'),'structureStatus':'failed' if shot_structure_errors else 'passed','technicalStatus':'not-rendered','visualStatus':'not-reviewed'}
        saved=cache.get(shot_id,{})
        comp=comp_map.get(shot.get('composition'))
        if target.is_file() and saved and comp:
            try:
                if saved.get('fingerprint')!=fingerprint(shot,comp,saved['config']): raise RuntimeError('Preview source/props/config fingerprint is stale')
                if saved.get('outputSha256')!=digest(target): raise RuntimeError('Preview checksum changed')
                check_output(target,comp,saved['config']['scale'])
                row['technicalStatus']='passed'
            except Exception as error:
                row['technicalStatus']='failed'; row['error']=str(error)
        elif target.is_file():
            row['technicalStatus']='unverified'
        if row['technicalStatus']!='passed':
            message=f'{shot_id}: {row.get("error",row["technicalStatus"])}'
            (errors if args.require_previews else warnings).append(message)
        visual=reviews.get(shot_id,{})
        if visual.get('outputSha256')==saved.get('outputSha256') and saved.get('outputSha256'):
            row['visualStatus']=visual.get('status','not-reviewed')
        rows.append(row)
    report={'generatedAt':datetime.now(timezone.utc).isoformat(),'ok':not errors,'structureStatus':'failed' if structure_errors else 'passed','schemaStatus':schema_status,'manifestCount':len(manifest),'registeredCompositions':len(compositions) if compositions else len(registered),'renderPassedCount':sum(r['technicalStatus']=='passed' for r in rows),'visualReviewedCount':sum(r['visualStatus']!='not-reviewed' for r in rows),'errors':errors,'warnings':warnings,'shots':rows}
    (ROOT/'qc').mkdir(exist_ok=True)
    (ROOT/'qc/shot-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=['# 镜头库检查','','- 结构检查：'+report['structureStatus'],f'- 当前源码渲染并解码：{report["renderPassedCount"]}/{len(rows)}',f'- 有视觉检查记录：{report["visualReviewedCount"]}/{len(rows)}','- 未观看的镜头保留 not-reviewed。','','## 错误']+[f'- {e}' for e in errors]+['','## 提醒']+[f'- {w}' for w in warnings]
    (ROOT/'qc/shot-validation.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='shots'},ensure_ascii=False))
    raise SystemExit(0 if report['ok'] else 1)
if __name__=='__main__': main()
