import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrack, cubicPath, sampleAction, auditHandoff, auditOwnership} from '../src/motion-runtime.ts';
const close = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('irregular camera keys preserve position and nonzero shared velocity at passage', () => {
  const track = createTrack([{time: 0, value: [0, 4]}, {time: .7, value: [2, 5]},
    {time: 1.8, value: [4, 6]}, {time: 3, value: [5, 7]}]);
  for (const knot of [.7, 1.8]) {
    const left = track.sample(knot - 1e-7), right = track.sample(knot + 1e-7);
    for (let d = 0; d < 2; d++) {
      close(left.position[d], right.position[d], 1e-5);
      close(left.velocity[d], right.velocity[d], 1e-5);
      assert.ok(left.velocity[d] > .1);
    }
  }
});

test('endpoint holds, explicit stop, plateau and reversals resolve without overshoot', () => {
  const keys = [{time: 0, value: [0]}, {time: .2, value: [4], stop: true},
    {time: 1, value: [4]}, {time: 1.1, value: [-1]}, {time: 3, value: [1]}];
  const track = createTrack(keys);
  for (let i = 0; i < keys.length - 1; i++) for (let j = 0; j <= 100; j++) {
    const n = track.sample(keys[i].time + (keys[i + 1].time - keys[i].time) * j / 100).position[0];
    assert.ok(n >= Math.min(keys[i].value[0], keys[i + 1].value[0]) - 1e-9);
    assert.ok(n <= Math.max(keys[i].value[0], keys[i + 1].value[0]) + 1e-9);
  }
  for (const t of [-3, 0, .2, .5, 1, 1.1, 3, 8]) close(track.sample(t).velocity[0], 0);
});

test('sampling order and caller mutation cannot alter a track; equal seconds at different fps agree', () => {
  const keys = [{time: 0, value: [1, 3]}, {time: 1.2, value: [4, 2]}, {time: 2, value: [5, 4]}];
  const track = createTrack(keys), expected = track.sample(1.2);
  keys[1].value[0] = 999;
  for (const t of [2, .3, 1.8, 0, 1.2]) track.sample(t);
  assert.deepEqual(track.sample(1.2), expected);
  assert.deepEqual(track.sample(36 / 30), track.sample(72 / 60));
  const sample = track.sample(1.2); sample.position[0] = -999;
  assert.deepEqual(track.sample(1.2), expected);
});

test('analytic velocity agrees with finite differences in distinct tracks', () => {
  for (const scale of [.2, 70]) {
    const track = createTrack([{time: -.5, value: [0, 3]}, {time: .3, value: [scale, 2]},
      {time: 2.2, value: [scale * 2, -4]}, {time: 3, value: [scale * 3, 1]}]);
    for (const t of [-.3, .15, .7, 1.8, 2.7]) for (let d = 0; d < 2; d++) {
      const numerical = (track.sample(t + 1e-5).position[d] - track.sample(t - 1e-5).position[d]) / 2e-5;
      close(numerical, track.sample(t).velocity[d], 1e-5);
    }
  }
});

test('curved flight endpoints and direction use the same path', () => {
  const points = [[-3, 0, 1], [-1, 2, 1], [1, 2, 0], [3, 0, 0]];
  assert.deepEqual(cubicPath(points, 0).position, points[0]);
  assert.deepEqual(cubicPath(points, 1).position, points[3]);
  assert.ok(cubicPath(points, .5).position[1] > 1);
  assert.ok(cubicPath(points, .5).tangent[0] > 0);
});

test('anticipation, receiver response, stagger and impact occupy separate meaningful windows', () => {
  const action = {start: 1, duration: .6, anticipation: .2, settle: .4, index: 2, stagger: .1};
  const prep = sampleAction(1.1, action);
  assert.ok(prep.anticipationOffset < 0); close(prep.progress, 0);
  const approach = sampleAction(1.7, action);
  assert.ok(approach.progress < 1 && approach.response > 0);
  assert.ok(sampleAction(1.84, action).recoil > 0);
  for (const t of [0, 2.3, 10]) {
    const state = sampleAction(t, action);
    close(state.recoil, 0); close(state.anticipationOffset, 0); assert.equal(state.active, false);
  }
  assert.deepEqual(sampleAction(1.7, action), sampleAction(102 / 60, action));
});

test('handoffs detect teleports, velocity resets and moving holds; cuts need a reason', () => {
  const base = {actor: 'packet', mode: 'carry', outgoing: {position: [2, 0], velocity: [3, 0]},
    incoming: {position: [2, 0], velocity: [3, 0]}, positionTolerance: .01, velocityTolerance: .01};
  assert.equal(auditHandoff(base).passed, true);
  assert.equal(auditHandoff({...base, incoming: {position: [4, 0], velocity: [3, 0]}}).passed, false);
  assert.equal(auditHandoff({...base, incoming: {position: [2, 0], velocity: [0, 0]}}).passed, false);
  assert.equal(auditHandoff({...base, mode: 'hold'}).passed, false);
  assert.equal(auditHandoff({...base, mode: 'cut'}).passed, false);
  assert.equal(auditHandoff({...base, mode: 'cut', reason: 'Subject changes'}).passed, true);
});

test('property ownership flags competing transforms, allows adjacent owners and different properties', () => {
  const base = {actor: 'packet', property: 'position', owner: 'shotA', start: 0, end: 1};
  assert.equal(auditOwnership([base, {...base, owner: 'shotB', start: .8, end: 2}]).length, 1);
  assert.equal(auditOwnership([base, {...base, owner: 'shotB', start: 1, end: 2}]).length, 0);
  assert.equal(auditOwnership([base, {...base, owner: 'response', property: 'scale'}]).length, 0);
});

test('invalid intervals and coordinates fail before they reach the renderer', () => {
  assert.throws(() => createTrack([{time: 0, value: [0]}, {time: 0, value: [1]}]));
  assert.throws(() => createTrack([{time: 0, value: [0]}, {time: 1, value: [NaN]}]));
  assert.throws(() => sampleAction(0, {start: 0, duration: 0}));
  assert.throws(() => sampleAction(0, {start: 0, duration: 1, index: .5}));
  assert.throws(() => cubicPath([[0]], .5));
});
