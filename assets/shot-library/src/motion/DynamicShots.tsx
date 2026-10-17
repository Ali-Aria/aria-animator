import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {MaskReveal, SceneTransition} from './primitives';
import {clamp01, easeBack, easeInOut, mix, motionClock, radiusMorph, receiverResponse, sampleProgress, spatialRanks, strokeReveal, type MotionOptions} from './runtime';

const ink = '#161814', paper = '#f4f1ea', accentDefault = '#c9f36a';
const Stage: React.FC<React.PropsWithChildren<{dark?: boolean; opacity?: number}>> = ({children, dark, opacity = 1}) => <AbsoluteFill style={{background: dark ? ink : paper, color: dark ? paper : ink, overflow: 'hidden', fontFamily: 'LXGW WenKai, sans-serif'}}><AbsoluteFill style={{opacity}}>{children}</AbsoluteFill></AbsoluteFill>;
const useMotion = (options: MotionOptions) => {
  const frame = useCurrentFrame();
  const config = useVideoConfig();
  return {...config, frame, clock: motionClock(frame, config.fps, options)};
};
const fitFont = (text: string, available: number, preferred: number) => Math.min(preferred, available / Math.max(1, Array.from(text).reduce((sum, c) => sum + (/[\u2e80-\uffff]/.test(c) ? 1 : .56), 0)));

export type DynamicKineticProps = MotionOptions & {words?: string[]; accent?: string};
export const DynamicKineticStatement: React.FC<DynamicKineticProps> = (props) => {
  const {width, height, durationInFrames, fps, clock: c} = useMotion(props);
  const words = props.words ?? ['爆款', '不等于', '个人IP'];
  const accent = props.accent ?? accentDefault;
  return <Stage dark opacity={c.visibility(durationInFrames / fps)}><div style={{position: 'absolute', inset: '12% 9%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: height * .024}}>
    {words.map((word, i) => <MaskReveal key={i} progress={c.progress(`word-${i}`, {start: i * c.stagger, duration: c.entry})} amplitude={c.profile.amplitude} direction={i % 2 ? -1 : 1}><div style={{fontSize: fitFont(word, width * .81, Math.min(height * .11, width * .125)), fontWeight: 900, lineHeight: 1.15, color: i === words.length - 1 ? accent : paper, overflowWrap: 'anywhere'}}>{word}</div></MaskReveal>)}
  </div></Stage>;
};

export type DynamicDataProps = MotionOptions & {value?: number; values?: number[]; label?: string; accent?: string};
export const DynamicDataCounter: React.FC<DynamicDataProps> = (props) => {
  const {width, height, durationInFrames, fps, clock: c} = useMotion(props);
  const values = props.values ?? [.28, .44, .63, .9, .38];
  const value = props.value ?? 100000;
  if (!Number.isFinite(value) || values.some(v => !Number.isFinite(v) || v < 0)) throw new Error('DataCounter requires finite value and nonnegative bars');
  const limit = Math.max(1, ...values);
  const count = Math.round(value * clamp01(c.progress('count', {start: .08, duration: c.action})));
  return <Stage opacity={c.visibility(durationInFrames / fps)}><div style={{position: 'absolute', inset: '12% 9%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: height * .035}}>
    <div style={{fontSize: fitFont(String(value), width * .8, height * .11), fontWeight: 900, fontVariantNumeric: 'tabular-nums'}}>{count.toLocaleString('en-US')}</div>
    <div style={{fontSize: fitFont(props.label ?? '播放量', width * .8, height * .045)}}>{props.label ?? '播放量'}</div>
    <div style={{display: 'flex', alignItems: 'flex-end', height: height * .35, gap: width * .018}}>{values.map((v, i) => {
      const p = clamp01(c.progress(`bar-${i}`, {start: .14 + i * c.stagger, duration: c.entry}));
      return <div key={i} style={{flex: 1, height: `${v / limit * 100}%`, background: props.accent ?? accentDefault, borderRadius: '12px 12px 0 0', transform: `scaleY(${p})`, transformOrigin: 'bottom center'}} />;
    })}</div>
  </div></Stage>;
};

export type DynamicElasticProps = MotionOptions & {eyebrow: string; title: string; detail: string; accent?: string};
export const DynamicElasticKeyPoint: React.FC<DynamicElasticProps> = (props) => {
  const {width, height, durationInFrames, fps, clock: c} = useMotion(props);
  const accent = props.accent ?? accentDefault;
  const entry = c.window('entry', {start: .12, duration: c.entry});
  const p = sampleProgress(c.time, entry.start, entry.duration, easeBack);
  const response = receiverResponse(c.time, entry.start + entry.duration, .025, .35);
  const words = props.title.includes(' ') ? props.title.split(/\s+/) : [props.title];
  return <Stage opacity={c.visibility(durationInFrames / fps)}><div style={{position: 'absolute', left: '13%', right: '13%', top: '20%', padding: `${height * .065}px ${width * .045}px`, borderRadius: 36, background: ink, color: paper, border: `4px solid ${accent}`, opacity: clamp01(p), transform: `translateY(${(1 - p) * 110 * c.profile.amplitude}px) scale(${mix(.82, 1, p) + response})`}}>
    {props.eyebrow && <div style={{fontSize: 24, color: accent}}>{props.eyebrow}</div>}
    <div style={{marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: '12px 24px', fontSize: fitFont(props.title, width * .65, height * .09), fontWeight: 900, lineHeight: 1.15}}>{words.map((word, i) => <MaskReveal key={i} progress={c.progress(`word-${i}`, {start: entry.start + entry.duration * .55 + i * c.stagger, duration: c.entry})}><span>{word}</span></MaskReveal>)}</div>
    {props.detail && <div style={{fontSize: Math.min(32, height * .03), marginTop: 32, lineHeight: 1.5, overflowWrap: 'anywhere'}}>{props.detail}</div>}
  </div></Stage>;
};

export type DynamicSwarmProps = MotionOptions & {brand: string; title: string; cardLabels: string[]; accent?: string};
export const DynamicCardSwarmTimeline: React.FC<DynamicSwarmProps> = (props) => {
  const {width, height, durationInFrames, fps, clock: c} = useMotion(props);
  const accent = props.accent ?? accentDefault;
  const type = c.window('typeBeat', {start: 0, duration: c.entry});
  const swarm = c.window('swarm', {start: type.start + type.duration - .06, duration: c.action});
  const grid = c.window('grid', {start: swarm.start + swarm.duration + c.hold, duration: c.action});
  const timeline = c.window('timeline', {start: grid.start + grid.duration + c.hold, duration: c.entry});
  const playhead = c.window('playhead', {start: timeline.start + timeline.duration, duration: Math.max(.6, c.action)});
  const s = sampleProgress(c.time, swarm.start, swarm.duration);
  const g = sampleProgress(c.time, grid.start, grid.duration, easeInOut);
  const t = sampleProgress(c.time, timeline.start, timeline.duration, easeInOut);
  const ph = sampleProgress(c.time, playhead.start, playhead.duration, easeInOut);
  const count = props.cardLabels.length, cols = Math.min(4, Math.max(1, count)), rows = Math.max(1, Math.ceil(count / cols));
  const points = props.cardLabels.map((_, i) => ({x: i % cols, y: Math.floor(i / cols)}));
  const ranks = spatialRanks(points, 'center');
  const cardW = Math.min(width * .27, width * .66 / cols), cardH = Math.min(height * .2, height * .48 / rows);
  return <Stage dark opacity={c.visibility(durationInFrames / fps)}>
    <div style={{position: 'absolute', inset: '28% 9%', opacity: 1 - s, textAlign: 'center'}}><MaskReveal progress={sampleProgress(c.time, type.start, type.duration)}><div style={{fontSize: fitFont(props.title, width * .82, height * .15), fontWeight: 900}}>{props.title}</div></MaskReveal></div>
    <div style={{position: 'absolute', inset: '12% 8%', background: paper, color: ink, borderRadius: 24, opacity: t, border: '2px solid #d3d5ce'}}><div style={{fontSize: 30, padding: 28}}>{props.brand}</div>{Array.from({length: Math.max(1, count)}, (_, i) => <div key={i} style={{position: 'absolute', left: '8%', right: '8%', top: `${22 + i * 65 / Math.max(1, count)}%`, borderTop: '1px solid #d3d5ce'}} />)}<div style={{position: 'absolute', top: '18%', bottom: '8%', left: `${16 + ph * 69}%`, width: 3, background: '#3167d2'}} /></div>
    {props.cardLabels.map((label, i) => {
      const angle = i / Math.max(1, count) * Math.PI * 2;
      const local = c.progress(`card-${i}`, {start: swarm.start + ranks[i] * c.stagger, duration: c.entry}, easeBack);
      const gridLeft = (width - cols * cardW) / 2;
      const x = mix(width * (.5 + (count === 1 ? 0 : Math.cos(angle) * .36)), gridLeft + (i % cols + .5) * cardW, g);
      const y = mix(height * (.5 + Math.sin(angle) * .32), height * .22 + (Math.floor(i / cols) + .5) * cardH, g);
      return <div key={i} style={{position: 'absolute', left: mix(x, width * (.4 + .15 * i / Math.max(1, count - 1)), t), top: mix(y, height * (.26 + i * .62 / Math.max(1, count)), t), width: mix(cardW * .88, width * .42, t), height: mix(cardH * .84, Math.min(52, height * .55 / Math.max(1, count)), t), borderRadius: mix(20, 8, t), background: i % 3 ? accent : '#8b6dff', color: ink, transform: `translate(-50%, -50%) scale(${local}) rotate(${(1 - g) * (i % 2 ? 10 : -10)}deg)`, opacity: clamp01(local), padding: t > .5 ? '4px 14px' : '18px', fontSize: Math.max(14, Math.min(30, cardH * .16)), fontWeight: 750, overflow: 'hidden'}}>{label}</div>;
    })}
  </Stage>;
};

export type DynamicGridProps = MotionOptions & {brand: string; statement: string; actions: string[]; accent?: string};
export const DynamicProductGridWorld: React.FC<DynamicGridProps> = (props) => {
  const {width, height, durationInFrames, fps, clock: c} = useMotion(props);
  const accent = props.accent ?? accentDefault;
  const deck = c.window('deck', {start: 0, duration: c.entry});
  const tiles = c.window('tiles', {start: deck.start + deck.duration + c.hold, duration: c.action});
  const field = c.window('field', {start: tiles.start + tiles.duration + c.hold, duration: c.action});
  const ui = c.window('interfaceIn', {start: field.start + field.duration + c.hold, duration: c.entry});
  const scan = c.window('macro', {start: ui.start + ui.duration, duration: c.action});
  const a = sampleProgress(c.time, tiles.start, tiles.duration, easeInOut), b = sampleProgress(c.time, field.start, field.duration, easeInOut), d = sampleProgress(c.time, ui.start, ui.duration);
  const points = Array.from({length: 24}, (_, i) => ({x: i % 6, y: Math.floor(i / 6)}));
  const ranks = spatialRanks(points, 'center');
  return <Stage dark opacity={c.visibility(durationInFrames / fps)}>
    {points.map((point, i) => {
      const p = c.progress(`tile-${i}`, {start: deck.start + ranks[i] * c.stagger, duration: c.entry}, easeBack);
      const x = mix(width * (.15 + point.x * .13), width * (.18 + point.x * .125), a);
      const y = mix(height * (.22 + point.y * .155), height * (.25 + point.y * .14), a);
      const size = mix(width * .1, height * .035, b);
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: mix(height * .115, size, b), background: i % 5 ? accent : '#8b6dff', borderRadius: radiusMorph(size, b), transform: `perspective(1200px) rotateY(${(1 - a) * -55}deg) rotateZ(${(1 - a) * 8}deg) scale(${p})`, opacity: clamp01(p) * (1 - d), color: ink, padding: mix(12, 0, b), overflow: 'hidden', fontSize: 20}}>{b < .2 ? props.actions[i % Math.max(1, props.actions.length)] : null}</div>;
    })}
    <div style={{position: 'absolute', left: '12%', right: '12%', bottom: '14%', opacity: 1 - d, fontSize: fitFont(props.statement, width * .76, height * .05), textAlign: 'center'}}>{props.statement}</div>
    <div style={{position: 'absolute', inset: '15% 16%', padding: 42, border: `3px solid ${accent}`, borderRadius: 32, background: '#20251e', opacity: d, transform: `translateY(${(1 - d) * 100 * c.profile.amplitude}px)`}}>
      <div style={{fontSize: 36, fontWeight: 800}}>{props.brand}</div>
      <div style={{marginTop: 50, fontSize: fitFont(props.statement, width * .61, 66)}}>{props.statement}</div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 45}}>{props.actions.map((label, i) => <MaskReveal key={i} progress={c.progress(`action-${i}`, {start: ui.start + c.entry * .5 + i * c.stagger, duration: c.entry})}><div style={{padding: '18px 24px', borderRadius: 18, color: ink, background: accent, fontSize: 28}}>{label}</div></MaskReveal>)}</div>
      <svg style={{position: 'absolute', right: 36, bottom: 36}} width="100" height="100" viewBox="0 0 100 100"><path d="M15 50 L40 75 L85 20" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" strokeDasharray="105" strokeDashoffset={strokeReveal(105, sampleProgress(c.time, scan.start, scan.duration))} /></svg>
    </div>
  </Stage>;
};

export type DynamicSaasProps = MotionOptions & {phrases: string[]; kicker: string; accent?: string};
export const DynamicSaasKineticType: React.FC<DynamicSaasProps> = (props) => {
  const {width, height, durationInFrames, fps, clock: c} = useMotion(props);
  const period = c.entry + c.hold;
  const configured = props.phrases.map((_, i) => c.window(`phrase-${i}`, {start: i * period, duration: c.entry}));
  const active = configured.reduce((last, w, i) => c.time >= w.start ? i : last, 0);
  const index = active;
  const w = configured[index] ?? {start: 0, duration: c.entry};
  const p = sampleProgress(c.time, w.start, w.duration);
  return <Stage dark opacity={c.visibility(durationInFrames / fps)}>{props.phrases.map((word, i) => {
    const window = configured[i];
    if (c.time < window.start) return null;
    const enter = sampleProgress(c.time, window.start, window.duration);
    const next = configured[i + 1];
    const out = next ? sampleProgress(c.time, next.start + Math.min(window.duration, c.exit) * .2, c.exit) : 0;
    if (out === 1) return null;
    const chars = Array.from(word), split = Math.max(1, Math.floor(chars.length / 2));
    return <div key={i} style={{position: 'absolute', inset: '30% 10%', opacity: 1 - out, transform: `translateY(${((i === 0 ? 0 : 1 - enter) - out) * height * .35}px)`, fontSize: fitFont(word, width * .8, height * .145), fontWeight: 900, textAlign: 'center', lineHeight: 1.15, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap'}}><MaskReveal progress={enter} amplitude={c.profile.amplitude}><span style={{display: 'inline-block', transform: `translateX(${(1 - enter) * -120 * c.profile.amplitude}px)`}}>{chars.slice(0, split).join('')}</span><span style={{color: props.accent ?? accentDefault, display: 'inline-block', transform: `translateX(${(1 - enter) * 120 * c.profile.amplitude}px)`, filter: `blur(${(1 - enter) * 12}px)`}}>{chars.slice(split).join('')}</span></MaskReveal></div>;
  })}{props.kicker && <div style={{position: 'absolute', left: '10%', right: '10%', bottom: '18%', fontSize: 24, opacity: p, textAlign: 'center'}}>{props.kicker}</div>}</Stage>;
};

export type DynamicTransitionProps = MotionOptions & {fromTitle?: string; toTitle?: string; chapter?: string; accent?: string; outgoing?: React.ReactNode; incoming?: React.ReactNode; startSeconds?: number; durationSeconds?: number; kind?: 'wipe' | 'slide' | 'zoom'; direction?: 1 | -1};
export const DynamicTransition: React.FC<DynamicTransitionProps> = (props) => {
  const {width, height} = useVideoConfig();
  const panel = (text: string, dark: boolean) => <Stage dark={dark}><div style={{position: 'absolute', inset: '20% 10%', display: 'flex', alignItems: 'center', fontSize: fitFont(text, width * .8, height * .12), fontWeight: 900, lineHeight: 1.15}}>{text}</div></Stage>;
  return <SceneTransition {...props} color={props.accent ?? accentDefault} outgoing={props.outgoing ?? panel(props.fromTitle ?? '问题是什么', true)} incoming={props.incoming ?? panel(props.toTitle ?? '真正的解法', false)} />;
};
