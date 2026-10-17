// Pure seconds-based choreography. No dependency on React, Three.js or a live ticker.
export type Key = {time: number; value: readonly number[]; stop?: boolean};
export type Pose = {position: number[]; velocity: number[]};
const finite = (n: number) => Number.isFinite(n);
const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const smooth01 = (n: number) => {
  const u = clamp(n);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
export function ramp(time: number, start: number, end: number): number {
  if (![time, start, end].every(finite) || end <= start) throw new Error('Invalid ramp interval');
  return smooth01((time - start) / (end - start));
}

/** Piecewise Hermite track with shared shape-preserving tangents. Endpoints hold.
 * Intermediate keys pass through; stop:true, plateaus and reversals stop that axis.
 * Tangents are computed once per whole track, never independently per segment.
 */
export function createTrack(input: readonly Key[]) {
  if (input.length < 2) throw new Error('A track needs at least two keys');
  const dimensions = input[0].value.length;
  if (!dimensions) throw new Error('A track needs coordinates');
  const keys = input.map(k => ({...k, value: [...k.value]}));
  keys.forEach((k, i) => {
    if (!finite(k.time) || k.value.length !== dimensions || !k.value.every(finite)
      || (i > 0 && k.time <= keys[i - 1].time)) throw new Error('Invalid track keys');
  });
  const gaps = keys.slice(1).map((k, i) => k.time - keys[i].time);
  const slopes = gaps.map((h, i) => keys[i].value.map((v, d) => (keys[i + 1].value[d] - v) / h));
  const tangents = keys.map(() => Array<number>(dimensions).fill(0));
  for (let i = 1; i < keys.length - 1; i++) {
    if (keys[i].stop) continue;
    for (let d = 0; d < dimensions; d++) {
      const a = slopes[i - 1][d], b = slopes[i][d];
      if (a * b <= 0) continue;
      const w1 = 2 * gaps[i] + gaps[i - 1], w2 = gaps[i] + 2 * gaps[i - 1];
      tangents[i][d] = (w1 + w2) / (w1 / a + w2 / b);
    }
  }
  // Limit both ends together. Any reduction also updates the neighboring segment.
  for (let i = 0; i < gaps.length; i++) {
    for (let d = 0; d < dimensions; d++) {
      const slope = slopes[i][d];
      if (slope === 0) {tangents[i][d] = tangents[i + 1][d] = 0; continue;}
      const a = tangents[i][d] / slope, b = tangents[i + 1][d] / slope;
      const length = Math.hypot(a, b);
      if (length > 3) {
        tangents[i][d] *= 3 / length;
        tangents[i + 1][d] *= 3 / length;
      }
    }
  }
  return {
    sample(time: number): Pose {
      if (!finite(time)) throw new Error('Invalid sample time');
      if (time <= keys[0].time) return {position: [...keys[0].value], velocity: Array(dimensions).fill(0)};
      const last = keys[keys.length - 1];
      if (time >= last.time) return {position: [...last.value], velocity: Array(dimensions).fill(0)};
      let i = 0;
      while (time > keys[i + 1].time) i++;
      const h = gaps[i], u = (time - keys[i].time) / h, u2 = u * u, u3 = u2 * u;
      const constant = (p: number, d: number) => p === keys[i + 1].value[d]
        && tangents[i][d] === 0 && tangents[i + 1][d] === 0;
      const position = keys[i].value.map((p, d) => constant(p, d) ? p :
        (2 * u3 - 3 * u2 + 1) * p + (u3 - 2 * u2 + u) * h * tangents[i][d]
        + (-2 * u3 + 3 * u2) * keys[i + 1].value[d] + (u3 - u2) * h * tangents[i + 1][d]);
      const velocity = keys[i].value.map((p, d) => constant(p, d) ? 0 :
        ((6 * u2 - 6 * u) * p + (3 * u2 - 4 * u + 1) * h * tangents[i][d]
        + (-6 * u2 + 6 * u) * keys[i + 1].value[d] + (3 * u2 - 2 * u) * h * tangents[i + 1][d]) / h);
      return {position, velocity};
    },
  };
}

export function cubicPath(points: readonly (readonly number[])[], progress: number): {position: number[]; tangent: number[]} {
  if (points.length !== 4 || !points[0].length || !finite(progress)
    || points.some(p => p.length !== points[0].length || !p.every(finite))) throw new Error('Invalid cubic path');
  const u = clamp(progress), v = 1 - u;
  return {
    position: points[0].map((p, d) => v ** 3 * p + 3 * v * v * u * points[1][d]
      + 3 * v * u * u * points[2][d] + u ** 3 * points[3][d]),
    // Derivative with respect to progress, not seconds. Multiply by progress/sec if needed.
    tangent: points[0].map((p, d) => 3 * v * v * (points[1][d] - p)
      + 6 * v * u * (points[2][d] - points[1][d]) + 3 * u * u * (points[3][d] - points[2][d])),
  };
}

export type Action = {
  start: number; duration: number; anticipation?: number; settle?: number;
  index?: number; stagger?: number; strength?: number;
};
/** Different actors may overlap. Compose offsets once in the actor's transform owner. */
export function sampleAction(time: number, action: Action) {
  const {start, duration, anticipation = .16, settle = .45, index = 0, stagger = 0, strength = .08} = action;
  if (![time, start, duration, anticipation, settle, index, stagger, strength].every(finite)
    || duration <= 0 || anticipation < 0 || settle <= 0 || index < 0 || !Number.isInteger(index)
    || stagger < 0 || strength < 0) throw new Error('Invalid action');
  const onset = start + index * stagger, arrival = onset + duration;
  const prep = anticipation === 0 ? 0 : clamp((time - onset + anticipation) / anticipation);
  const anticipationOffset = time >= onset ? 0 : -strength * Math.sin(Math.PI * prep) ** 2;
  const progress = ramp(time, onset, arrival);
  const response = ramp(time, onset + duration * .7, arrival + duration * .15);
  const age = time - arrival, tail = clamp(age / settle);
  const recoil = age <= 0 || age >= settle ? 0
    : strength * Math.sin(3 * Math.PI * tail) * Math.exp(-4 * tail) * (1 - smooth01(tail));
  return {onset, arrival, progress, anticipationOffset, response, recoil,
    active: time >= onset - anticipation && time < arrival + Math.max(settle, duration * .15)};
}

export type Handoff = {
  actor: string; mode: 'carry' | 'hold' | 'cut'; reason?: string;
  outgoing: Pose; incoming: Pose; positionTolerance: number; velocityTolerance: number;
};
/** Pose comparisons are in authored units. Check rendered focus, rotation and camera too. */
export function auditHandoff(handoff: Handoff) {
  const {outgoing: a, incoming: b, mode} = handoff;
  if (![handoff.positionTolerance, handoff.velocityTolerance].every(n => finite(n) && n >= 0)
    || !a.position.length || a.position.length !== b.position.length
    || a.position.length !== a.velocity.length || a.position.length !== b.velocity.length
    || ![...a.position, ...b.position, ...a.velocity, ...b.velocity].every(finite)
    || !['carry', 'hold', 'cut'].includes(mode)) throw new Error('Invalid handoff');
  const positionError = Math.hypot(...a.position.map((n, i) => n - b.position[i]));
  const velocityError = Math.hypot(...a.velocity.map((n, i) => n - b.velocity[i]));
  const stopped = Math.max(Math.hypot(...a.velocity), Math.hypot(...b.velocity)) <= handoff.velocityTolerance;
  const passed = mode === 'cut' ? Boolean(handoff.reason?.trim())
    : positionError <= handoff.positionTolerance && velocityError <= handoff.velocityTolerance
      && (mode !== 'hold' || stopped);
  return {actor: handoff.actor, mode, passed, positionError, velocityError, stopped, reason: handoff.reason};
}

export type OwnerWindow = {actor: string; property: string; owner: string; start: number; end: number};
export function auditOwnership(windows: readonly OwnerWindow[]) {
  windows.forEach(w => {
    if (![w.start, w.end].every(finite) || w.end <= w.start || !w.actor || !w.property || !w.owner)
      throw new Error('Invalid owner window');
  });
  const conflicts: {actor: string; property: string; owners: string[]; overlap: number[]}[] = [];
  windows.forEach((a, i) => windows.slice(i + 1).forEach(b => {
    const start = Math.max(a.start, b.start), end = Math.min(a.end, b.end);
    if (a.actor === b.actor && a.property === b.property && a.owner !== b.owner && end > start)
      conflicts.push({actor: a.actor, property: a.property, owners: [a.owner, b.owner], overlap: [start, end]});
  }));
  return conflicts;
}
