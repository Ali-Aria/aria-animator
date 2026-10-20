const test = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {resolvePython} = require('../scripts/run-python.cjs');
const ok = (executable, version = [3, 12]) => ({status: 0, stdout: JSON.stringify({executable, version})});
const missing = {status: null, error: new Error('ENOENT')};

test('falls back from missing python to python3', () => {
  const calls = [];
  const executable = resolvePython({env: {}, platform: 'linux', run: (command) => {
    calls.push(command);
    return command === 'python3' ? ok('/usr/bin/python3') : missing;
  }});
  assert.equal(executable, '/usr/bin/python3');
  assert.deepEqual(calls, ['python', 'python3']);
});

test('skips old interpreters and non-Python command aliases', () => {
  assert.equal(resolvePython({env: {}, platform: 'linux', run: (command) =>
    command === 'python' ? ok('/old/python', [3, 9]) : ok('/new/python', [3, 10])}), '/new/python');
  assert.equal(resolvePython({env: {}, platform: 'linux', run: (command) =>
    command === 'python' ? {status: 0, stdout: 'Open the app store'} : ok('/new/python')}), '/new/python');
});

test('Windows launcher receives -3 and returns the actual executable', () => {
  const calls = [];
  const expected = 'C:\\Python Folder\\python.exe';
  assert.equal(resolvePython({env: {}, platform: 'win32', run: (command, args, options) => {
    assert.equal(options.shell, false);
    calls.push([command, args]);
    return command === 'py' ? ok(expected) : missing;
  }}), expected);
  assert.equal(calls[2][1][0], '-3');
});

test('explicit executable with spaces is passed as one command', () => {
  const executable = '/home/user/Python Env/bin/python';
  assert.equal(resolvePython({env: {ARIA_ANIMATOR_PYTHON: executable}, run: (command, args) => {
    assert.equal(command, executable);
    assert.equal(args[0], '-c');
    return ok(executable);
  }}), executable);
});

test('invalid explicit configuration fails without choosing another environment', () => {
  let calls = 0;
  assert.throws(() => resolvePython({env: {ARIA_ANIMATOR_PYTHON: '/missing/python'}, run: () => {
    calls++; return missing;
  }}), /ARIA_ANIMATOR_PYTHON/);
  assert.equal(calls, 1);
});

test('missing interpreters produce an actionable error', () => {
  assert.throws(() => resolvePython({env: {}, platform: 'linux', run: () => missing}), /Python 3.10\+ not found/);
});

test('legacy Python override remains supported and new name takes precedence', () => {
  const legacy = '/legacy/python';
  const current = '/current/python';
  assert.equal(resolvePython({env: {MOTION_EXPLAINER_PYTHON: legacy}, run: (command) => ok(command)}), legacy);
  assert.equal(resolvePython({env: {ARIA_ANIMATOR_PYTHON: current, MOTION_EXPLAINER_PYTHON: legacy}, run: (command) => ok(command)}), current);
  assert.throws(() => resolvePython({env: {ARIA_ANIMATOR_PYTHON: current, MOTION_EXPLAINER_PYTHON: legacy}, run: () => missing}), /ARIA_ANIMATOR_PYTHON/);
});

test('real CLI preserves argument boundaries and Python exit status', (t) => {
  const python = resolvePython();
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'motion python '));
  const script = path.join(folder, 'argument check.py');
  t.after(() => { fs.rmSync(script, {force: true}); fs.rmdirSync(folder); });
  fs.writeFileSync(script, 'import json, sys\nprint(json.dumps(sys.argv[1:]))\nsys.exit(7)\n');
  const args = ['path with spaces', '中文', '$(literal)', 'a;b'];
  const result = spawnSync(process.execPath, [path.resolve(__dirname, '../scripts/run-python.cjs'), script, ...args], {
    env: {...process.env, ARIA_ANIMATOR_PYTHON: python}, encoding: 'utf8', shell: false,
  });
  assert.equal(result.status, 7, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), args);
});
