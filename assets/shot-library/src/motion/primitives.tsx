import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {maskPose, motionClock, sampleProgress, transitionPose, type MotionOptions} from './runtime';

export const MaskReveal: React.FC<React.PropsWithChildren<{progress: number; amplitude?: number; direction?: 1 | -1; style?: React.CSSProperties}>> = ({children, progress, amplitude = 1, direction = 1, style}) => {
  const pose = maskPose(progress, amplitude, direction);
  return <div style={{overflow: 'hidden', ...style}}><div style={{opacity: pose.opacity, transform: `translateY(${pose.yPercent}%) skewY(${pose.skew}deg)`}}>{children}</div></div>;
};
export type SceneTransitionProps = MotionOptions & {
  outgoing: React.ReactNode; incoming: React.ReactNode;
  kind?: 'wipe' | 'slide' | 'zoom'; direction?: 1 | -1;
  startSeconds?: number; durationSeconds?: number; color?: string;
  frame?: number; fps?: number;
};
export const SceneTransition: React.FC<SceneTransitionProps> = (props) => {
  const currentFrame = useCurrentFrame();
  const config = useVideoConfig();
  const {outgoing, incoming, kind = 'wipe', direction = 1, color = '#c9f36a'} = props;
  const clock = motionClock(props.frame ?? currentFrame, props.fps ?? config.fps, props);
  const window = clock.window('transition', {start: props.startSeconds ?? .5, duration: props.durationSeconds ?? clock.exit * 2});
  const p = sampleProgress(clock.time, window.start, window.duration, n => n);
  const pose = transitionPose(p, kind, direction);
  // Wipe swaps underneath a fully covering panel; slide stays adjacent; zoom mixes only while moving.
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    {(kind !== 'wipe' || !pose.incoming) && <AbsoluteFill style={{transform: `translateX(${pose.outgoingX}%) scale(${pose.outgoingScale})`, opacity: pose.outgoingOpacity}}>{outgoing}</AbsoluteFill>}
    {(kind !== 'wipe' || pose.incoming) && <AbsoluteFill style={{transform: `translateX(${pose.incomingX}%) scale(${pose.incomingScale})`, opacity: pose.incomingOpacity}}>{incoming}</AbsoluteFill>}
    {kind === 'wipe' && pose.covered > 0 && <AbsoluteFill style={{background: color, transform: `scaleX(${pose.covered})`, transformOrigin: p < .5 ? (direction === 1 ? 'left center' : 'right center') : (direction === 1 ? 'right center' : 'left center')}} />}
  </AbsoluteFill>;
};
