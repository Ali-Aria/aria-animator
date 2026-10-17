#!/usr/bin/env python3
"""Render seek/fps fixtures and compare native PNG pixels; requires existing runtimes."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
from PIL import Image, ImageChops
from preview_generation import ROOT, bridge, browser_path, digest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--browser')
    parser.add_argument('--compare-only', action='store_true')
    args = parser.parse_args()
    if not args.compare_only:
        # Build the current source explicitly; never pick an unrelated cached bundle.
        inputs = [p for sub in ('src', 'public') for p in (ROOT/sub).rglob('*') if p.is_file()]
        source_hash = hashlib.sha256(''.join(digest(p) for p in sorted(inputs)).encode()).hexdigest()
        bundle = ROOT/'qc/bundles'/f'quality-{source_hash[:16]}'
        if not (bundle/'index.html').exists():
            bridge({'command': 'bundle', 'outDir': str(bundle)})
        browser = browser_path(args.browser)
        temp = ROOT/'qc/render-temp'
        temp.mkdir(parents=True, exist_ok=True)
        subprocess.run(['node', str(ROOT/'scripts/check_motion_parameters.cjs')],
                       input=json.dumps({'serveUrl': str(bundle), 'browser': browser}),
                       cwd=ROOT, text=True, encoding='utf-8', check=True,
                       env={**os.environ, 'TEMP': str(temp), 'TMP': str(temp), 'TMPDIR': str(temp)})
        out = ROOT/'qc/native-checks'
        out.mkdir(exist_ok=True)
        cases = [('MotionTechniqueReel30', [420, 444], 'ending-freeze'),
                 ('CausalProcessFixture30', [720, 744], 'ending-freeze'),
                 ('CausalProcessFixture30', [510, 570], 'fixed-evidence-reading')]
        native = []
        for name, frames, kind in cases:
            files = []
            for frame in frames:
                target = out/f'{name}-{frame}.png'
                bridge({'command': 'still', 'serveUrl': str(bundle), 'browser': browser,
                        'composition': name, 'output': str(target), 'frame': frame, 'scale': .5})
                files.append(str(target.relative_to(ROOT)))
            native.append({'composition': name, 'kind': kind, 'frames': frames,
                           'files': files, 'passed': equal_pixels(*files)})
        for name in ['MotionTechniqueReel', 'CausalProcessFixture']:
            for time in [.2, 5.1, 12.5, 14.5]:
                files = []
                for fps in [30, 60]:
                    target = out/f'{name}{fps}-{time}.png'
                    bridge({'command': 'still', 'serveUrl': str(bundle), 'browser': browser,
                            'composition': f'{name}{fps}', 'output': str(target),
                            'frame': round(time*fps), 'scale': .5})
                    files.append(str(target.relative_to(ROOT)))
                native.append({'composition': name, 'kind': 'same-second-30-60',
                               'time': time, 'files': files, 'passed': equal_pixels(*files)})
        (ROOT/'qc/native-pixel-checks.json').write_text(json.dumps(native, indent=2)+'\n', encoding='utf-8')
        (ROOT/'qc/quality-source.json').write_text(json.dumps({
            'generatedAt': datetime.now(timezone.utc).isoformat(), 'sourceSha256': source_hash,
            'browser': browser, 'method': 'native Remotion renderStill; compare decoded PNG pixels'}, indent=2)+'\n', encoding='utf-8')
    rows = json.loads((ROOT/'qc/parameter-tests.json').read_text(encoding='utf-8'))
    indexed = {(r['name'], r['variant'], r['fps'], r['index']): r for r in rows}
    comparisons = []
    def compare(a, b, kind):
        comparisons.append({'name': a['name'], 'variant': a['variant'], 'kind': kind,
                            'a': a['path'], 'b': b['path'], 'passed': equal_pixels(a['path'], b['path'])})
    for row in rows:
        if row['fps'] == 30:
            compare(row, indexed[(row['name'], row['variant'], 60, row['index'])], 'same-second-30-60')
        if row['index'] == 2:
            compare(row, indexed[(row['name'], row['variant'], row['fps'], 4)], 'repeat-after-reverse-seek')
    native = json.loads((ROOT/'qc/native-pixel-checks.json').read_text(encoding='utf-8'))
    report = {'renderedFrames': len(rows), 'comparisonCount': len(comparisons),
              'passedCount': sum(c['passed'] for c in comparisons),
              'nativeComparisonCount': len(native), 'nativePassedCount': sum(c['passed'] for c in native),
              'comparisons': comparisons}
    (ROOT/'qc/parameter-comparisons.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in report.items() if k != 'comparisons'}))
    raise SystemExit(0 if all(c['passed'] for c in comparisons + native) else 1)


def equal_pixels(a, b):
    x = Image.open(ROOT/a).convert('RGBA')
    y = Image.open(ROOT/b).convert('RGBA')
    return x.size == y.size and ImageChops.difference(x, y).convert('RGB').getbbox() is None


if __name__ == '__main__':
    main()
