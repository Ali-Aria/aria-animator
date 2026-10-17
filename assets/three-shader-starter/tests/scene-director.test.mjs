import test from 'node:test';
import assert from 'node:assert/strict';
import {createSceneDirector} from '../src/scene-director.ts';
const plan = () => ({stations: [{id: 'input', origin: [0, 0, 0]}, {id: 'process', origin: [5, 0, -1]}],
  chapters: [{id: 'a', station: 'input', start: 0, end: 4}, {id: 'b', station: 'process', start: 4, end: 8}],
  cameraKeys: [{time: 0, position: [0, 4, 10], target: [0, 0, 0]},
    {time: 3.6, position: [0, 4, 10], target: [0, 0, 0]},
    {time: 4, position: [2, 4, 10], target: [2, 0, 0]},
    {time: 4.4, position: [5, 4, 10], target: [5, 0, -1]},
    {time: 8, position: [5, 4, 10], target: [5, 0, -1]}],
  journeys: [{id: 'a-b', from: 'a', to: 'b', depart: 3.6, arrive: 4.4, bridgeActor: 'packet'}]});

test('the same director carries a camera through a chapter boundary without resetting velocity', () => {
  const director = createSceneDirector(plan());
  const before = director.sample(4 - 1e-7), after = director.sample(4 + 1e-7);
  assert.equal(before.chapter.id, 'a'); assert.equal(after.chapter.id, 'b');
  assert.equal(before.journey.bridgeActor, 'packet'); assert.equal(after.journey.bridgeActor, 'packet');
  assert.ok(after.camera.velocity[0] > 1);
  assert.ok(Math.abs(before.camera.position[0] - after.camera.position[0]) < 1e-5);
  assert.ok(Math.abs(before.camera.velocity[0] - after.camera.velocity[0]) < 1e-5);
});
test('world coordinates survive cue changes, seeks and caller mutation', () => {
  const input = plan(), director = createSceneDirector(input);
  input.stations[1].origin[0] = 999;
  for (const time of [7, 0, 4, 3.9, 4.1]) director.sample(time);
  assert.deepEqual(director.worldPoint('process', [1, 2, 3]), [6, 2, 2]);
  assert.deepEqual(director.sample(120 / 30), director.sample(240 / 60));
});
test('reading holds are stable and a final hold samples exactly the resolved framing', () => {
  const director = createSceneDirector(plan());
  assert.deepEqual(director.sample(1).camera, director.sample(3).camera);
  assert.deepEqual(director.sample(8).camera, director.sample(12).camera);
  assert.equal(director.sample(4.5).journey, null);
});
test('station and chapter mistakes fail before a scene is mounted', () => {
  const invalid = plan(); invalid.chapters[1].station = 'missing';
  assert.throws(() => createSceneDirector(invalid));
  const gap = plan(); gap.chapters[1].start = 4.5;
  assert.throws(() => createSceneDirector(gap));
  const noBridge = plan(); noBridge.journeys[0].bridgeActor = '';
  assert.throws(() => createSceneDirector(noBridge));
  const backwards = plan(); backwards.journeys[0].arrive = 3.7;
  assert.throws(() => createSceneDirector(backwards));
});
