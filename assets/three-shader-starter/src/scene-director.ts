import {createTrack} from './motion-runtime.ts';
export type Vec3 = readonly [number, number, number];
export type Station = {id: string; origin: Vec3};
export type Chapter = {id: string; station: string; start: number; end: number};
export type CameraKey = {time: number; position: Vec3; target: Vec3; stop?: boolean};
export type Journey = {id: string; from: string; to: string; depart: number; arrive: number; bridgeActor: string};
export type ScenePlan = {
  stations: readonly Station[]; chapters: readonly Chapter[];
  cameraKeys: readonly CameraKey[]; journeys: readonly Journey[];
};
const validVector = (v: Vec3) => v.length === 3 && v.every(Number.isFinite);

/** Organize a continuous authored passage. Chapter changes are cues, never world remounts.
 * True cuts between unrelated passages are owned by the film editor, outside this director.
 */
export function createSceneDirector(input: ScenePlan) {
  const stations = input.stations.map(s => ({id: s.id, origin: [...s.origin] as unknown as Vec3}));
  const chapters = input.chapters.map(c => ({...c}));
  const journeys = input.journeys.map(j => ({...j}));
  if (!stations.length || !chapters.length || new Set(stations.map(s => s.id)).size !== stations.length
    || stations.some(s => !s.id || !validVector(s.origin))) throw new Error('Invalid stations');
  const stationMap = new Map(stations.map(s => [s.id, s]));
  const chapterMap = new Map(chapters.map(c => [c.id, c]));
  if (chapterMap.size !== chapters.length) throw new Error('Duplicate chapters');
  chapters.forEach((c, i) => {
    if (!c.id || !stationMap.has(c.station) || ![c.start, c.end].every(Number.isFinite)
      || c.end <= c.start || (i > 0 && Math.abs(chapters[i - 1].end - c.start) > 1e-7))
      throw new Error('Chapters must form one ordered continuous passage');
  });
  if (new Set(journeys.map(j => j.id)).size !== journeys.length) throw new Error('Duplicate journeys');
  journeys.forEach((j, i) => {
    const from = chapterMap.get(j.from), to = chapterMap.get(j.to);
    if (!j.id || !j.bridgeActor || !from || !to || Math.abs(from.end - to.start) > 1e-7
      || ![j.depart, j.arrive].every(Number.isFinite) || j.arrive <= j.depart
      || j.depart < from.start || j.arrive > to.end || j.depart > to.start || j.arrive < to.start
      || (i > 0 && j.depart < journeys[i - 1].arrive)) throw new Error('Invalid journey windows');
  });
  input.cameraKeys.forEach(k => {
    if (!validVector(k.position) || !validVector(k.target)
      || Math.hypot(...k.position.map((v, i) => v - k.target[i])) < 1e-6) throw new Error('Invalid camera framing');
  });
  const track = createTrack(input.cameraKeys.map(k => ({time: k.time, value: [...k.position, ...k.target], stop: k.stop})));
  return {
    worldPoint(stationId: string, local: Vec3): [number, number, number] {
      const station = stationMap.get(stationId);
      if (!station || !validVector(local)) throw new Error('Invalid world point');
      return station.origin.map((n, i) => n + local[i]) as [number, number, number];
    },
    sample(seconds: number) {
      const camera = track.sample(seconds);
      const chapter = chapters.find(c => seconds >= c.start && seconds < c.end)
        ?? (seconds < chapters[0].start ? chapters[0] : chapters[chapters.length - 1]);
      const journey = journeys.find(j => seconds >= j.depart && seconds < j.arrive);
      return {chapter: {...chapter}, journey: journey ? {...journey} : null,
        camera: {position: camera.position.slice(0, 3), target: camera.position.slice(3),
          velocity: camera.velocity.slice(0, 3), targetVelocity: camera.velocity.slice(3)}};
    },
  };
}
