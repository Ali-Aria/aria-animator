export type MotionProfile = 'quiet' | 'process' | 'impact';
export type PhaseWindow = {start: number; duration: number};
export type MotionTiming = {
  entry?: number; action?: number; hold?: number; exit?: number; stagger?: number;
  phases?: Record<string, PhaseWindow>;
};
export type MotionOptions = {
  motionProfile?: MotionProfile;
  timingSeconds?: MotionTiming;
  timingFrames?: MotionTiming;
  entryFrames?: number; exitFrames?: number; staggerFrames?: number;
};
export const profiles = {
  quiet: {entry: .45, exit: .35, stagger: .08, amplitude: .6},
  process: {entry: .4, exit: .3, stagger: .05, amplitude: 1},
  impact: {entry: .3, exit: .25, stagger: .035, amplitude: 1.25},
} as const;
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const easeOut = (p: number) => 1 - Math.pow(1 - p, 4);
export const easeIn = (p: number) => Math.pow(p, 3);
export const easeInOut = (p: number) => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
export const easeBack = (p: number) => 1 + 2.4 * Math.pow(p - 1, 3) + 1.4 * Math.pow(p - 1, 2);
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const hasMotionOptions = (o: MotionOptions) =>
  o.motionProfile !== undefined || o.timingSeconds !== undefined || o.timingFrames !== undefined ||
  o.entryFrames !== undefined || o.exitFrames !== undefined || o.staggerFrames !== undefined;
const positive = (n: number, name: string, zero = false) => {
  if (!Number.isFinite(n) || (zero ? n < 0 : n <= 0)) throw new Error(`${name} must be ${zero ? 'nonnegative' : 'positive'} and finite`);
  return n;
};
export function motionClock(frame: number, fps: number, options: MotionOptions = {}) {
  positive(fps, 'fps');
  if (!Number.isFinite(frame)) throw new Error('frame must be finite');
  const profile = profiles[options.motionProfile ?? 'process'];
  if (!profile) throw new Error('Unknown motionProfile');
  for (const [unit, timing] of [['seconds', options.timingSeconds], ['frames', options.timingFrames]] as const) {
    for (const name of ['entry', 'action', 'hold', 'exit', 'stagger'] as const) {
      const value = timing?.[name];
      if (value !== undefined) positive(value, `${unit}.${name}`, true);
    }
    for (const [name, window] of Object.entries(timing?.phases ?? {})) {
      positive(window.start, `${unit}.${name}.start`, true);
      positive(window.duration, `${unit}.${name}.duration`, true);
    }
  }
  const duration = (name: 'entry' | 'action' | 'hold' | 'exit' | 'stagger', fallback: number) => {
    const legacy = name === 'entry' ? options.entryFrames : name === 'exit' ? options.exitFrames : name === 'stagger' ? options.staggerFrames : undefined;
    const frames = legacy ?? options.timingFrames?.[name];
    return frames !== undefined ? positive(frames, name, true) / fps : options.timingSeconds?.[name] ?? fallback;
  };
  const entry = duration('entry', profile.entry);
  const action = duration('action', .6);
  const hold = duration('hold', .7);
  const exit = duration('exit', profile.exit);
  const stagger = duration('stagger', profile.stagger);
  const window = (name: string, fallback: PhaseWindow): PhaseWindow => {
    const f = options.timingFrames?.phases?.[name];
    const s = options.timingSeconds?.phases?.[name];
    return f ? {start: f.start / fps, duration: f.duration / fps} : s ?? fallback;
  };
  const time = frame / fps;
  const progress = (name: string, fallback: PhaseWindow, ease = easeOut) => {
    const w = window(name, fallback);
    return sampleProgress(time, w.start, w.duration, ease);
  };
  const visibility = (end: number) => {
    // Exit is opt-in for standalone shots. A reading hold does not stretch their actions.
    const requested = options.exitFrames !== undefined || options.timingFrames?.exit !== undefined || options.timingSeconds?.exit !== undefined || options.timingFrames?.phases?.exit || options.timingSeconds?.phases?.exit;
    return requested ? 1 - progress('exit', {start: Math.max(0, end - exit), duration: exit}, easeIn) : 1;
  };
  return {time, profile, entry, action, hold, exit, stagger, window, progress, visibility};
}
export function sampleProgress(time: number, start: number, duration: number, ease = easeOut) {
  return duration === 0 ? (time >= start ? 1 : 0) : ease(clamp01((time - start) / duration));
}
export type SpatialPoint = {x: number; y: number};
export type StaggerOrder = 'center' | 'edges' | 'distance' | 'path';
export function spatialRanks(points: SpatialPoint[], order: StaggerOrder, origin?: SpatialPoint, path?: number[]) {
  if (order === 'path') {
    const indices = path ?? points.map((_, i) => i);
    if (indices.length !== points.length || new Set(indices).size !== points.length || indices.some(i => !Number.isInteger(i) || i < 0 || i >= points.length)) throw new Error('path must be a permutation of point indices');
    const ranks = points.map(() => 0);
    indices.forEach((i, rank) => {ranks[i] = rank;});
    return ranks;
  }
  if (!points.length) return [];
  const center = origin ?? {x: points.reduce((a, p) => a + p.x, 0) / points.length, y: points.reduce((a, p) => a + p.y, 0) / points.length};
  const distances = points.map((p, i) => ({i, d: Math.hypot(p.x - center.x, p.y - center.y)}));
  distances.sort((a, b) => (order === 'edges' ? b.d - a.d : a.d - b.d) || a.i - b.i);
  const ranks = points.map(() => 0);
  distances.forEach((p, rank) => {ranks[p.i] = rank;});
  return ranks;
}
export function receiverResponse(time: number, arrival: number, strength = .05, settle = .35) {
  positive(settle, 'settle');
  const p = (time - arrival) / settle;
  return p < 0 || p >= 1 ? 0 : Math.sin(p * Math.PI * 3) * Math.exp(-p * 5) * strength * (1 - p);
}
export const radiusMorph = (size: number, progress: number) => size * .5 * clamp01(progress);
export const strokeReveal = (length: number, progress: number) => length * (1 - clamp01(progress));
export function maskPose(progress: number, amplitude = 1, direction: 1 | -1 = 1) {
  return {yPercent: (1 - progress) * 110 * amplitude * direction, skew: (1 - progress) * 8 * amplitude * direction, opacity: clamp01(progress)};
}
export function transitionPose(p: number, kind: 'wipe' | 'slide' | 'zoom', direction: 1 | -1 = 1) {
  const q = easeInOut(clamp01(p));
  const covered = q < .5 ? q * 2 : (1 - q) * 2;
  return {
    outgoingX: kind === 'slide' ? -100 * q * direction : 0,
    incomingX: kind === 'slide' ? 100 * (1 - q) * direction : 0,
    outgoingScale: kind === 'zoom' ? mix(1, 1.15, q) : 1,
    incomingScale: kind === 'zoom' ? mix(.9, 1, q) : 1,
    outgoingOpacity: kind === 'zoom' ? 1 - q : 1,
    incomingOpacity: kind === 'zoom' ? q : 1,
    covered, incoming: q >= .5,
  };
}
