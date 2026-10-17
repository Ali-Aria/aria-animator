"""Copy selected bundled sound effects to a project, reusing identical files."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import wave


SKILL_ROOT = Path(__file__).resolve().parent.parent
LIBRARY_ROOT = SKILL_ROOT / 'assets' / 'sound-effects'


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def prepare(output, ids=None):
    output = Path(output).resolve()
    if output == SKILL_ROOT or SKILL_ROOT in output.parents:
        raise ValueError('Output must be outside the installed skill directory')
    catalog = json.loads((LIBRARY_ROOT / 'catalog.json').read_text(encoding='utf-8'))
    entries = {entry['id']: entry for entry in catalog['samples']}
    selected = list(dict.fromkeys(ids)) if ids else list(entries)
    unknown = set(selected) - set(entries)
    if unknown:
        raise ValueError(f'Unknown sound IDs: {", ".join(sorted(unknown))}')

    # Validate all inputs and destinations before copying any file.
    plan = []
    for sound_id in selected:
        entry = entries[sound_id]
        filename = entry['file']
        if Path(filename).name != filename:
            raise ValueError(f'Invalid catalog filename: {filename}')
        source = LIBRARY_ROOT / filename
        if sha256(source) != entry['sha256']:
            raise ValueError(f'Bundled source checksum mismatch: {filename}')
        with wave.open(str(source), 'rb') as stream:
            actual_duration = stream.getnframes() / stream.getframerate()
            if (stream.getframerate() != catalog['sample_rate']
                    or stream.getnchannels() != catalog['channels']
                    or stream.getsampwidth() * 8 != catalog['bit_depth']
                    or abs(actual_duration - entry['duration_seconds']) > 1 / stream.getframerate()):
                raise ValueError(f'Bundled WAV metadata mismatch: {filename}')
        destination = output / filename
        if destination.exists() and sha256(destination) != entry['sha256']:
            raise FileExistsError(f'Existing project audio differs: {destination}')
        plan.append((entry, source, destination))

    output.mkdir(parents=True, exist_ok=True)
    results = []
    for entry, source, destination in plan:
        reused = destination.exists()
        if not reused:
            shutil.copyfile(source, destination)
        results.append({**entry, 'path': str(destination), 'reused': reused})
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--ids', nargs='+', help='Catalog IDs; omitted means all six samples')
    args = parser.parse_args()
    try:
        results = prepare(args.output, args.ids)
    except (ValueError, OSError, wave.Error) as error:
        parser.exit(1, f'{error}\n')
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
