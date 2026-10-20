// Resolve Python 3.10+ without relying on a platform-specific command alias.
const {spawnSync} = require('node:child_process');
const probe = 'import json,sys; print(json.dumps({"version": list(sys.version_info[:2]), "executable": sys.executable}))';

function resolvePython({env = process.env, platform = process.platform, run = spawnSync} = {}) {
  const explicitName = env.ARIA_ANIMATOR_PYTHON ? 'ARIA_ANIMATOR_PYTHON' : 'MOTION_EXPLAINER_PYTHON';
  const explicit = env[explicitName];
  const candidates = explicit ? [[explicit]] : [['python'], ['python3'], ...(platform === 'win32' ? [['py', '-3']] : [])];
  for (const [command, ...prefix] of candidates) {
    const result = run(command, [...prefix, '-c', probe], {env, encoding: 'utf8', timeout: 10000, windowsHide: true, shell: false});
    if (result.error || result.status !== 0) continue;
    try {
      const {version, executable} = JSON.parse(result.stdout);
      if (Array.isArray(version) && version[0] === 3 && version[1] >= 10 && typeof executable === 'string' && executable) return executable;
    } catch { /* Skip launchers that did not return Python's version record. */ }
  }
  throw new Error(explicit
    ? `${explicitName} must name a working Python 3.10+ executable (path only, no arguments).`
    : 'Python 3.10+ not found. Install Python, or set ARIA_ANIMATOR_PYTHON to its executable path.');
}

function main(args = process.argv.slice(2)) {
  if (!args.length) throw new Error('Usage: node run-python.cjs <script.py> [arguments]');
  const result = spawnSync(resolvePython(), args, {stdio: 'inherit', windowsHide: true, shell: false});
  if (result.error) throw result.error;
  return result.status ?? 1;
}

module.exports = {resolvePython, main};
if (require.main === module) {
  try { process.exitCode = main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
