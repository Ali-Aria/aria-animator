import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {createContinuityWorld} from './ContinuityWorld';
import type {ContinuityParameters, ContinuityWorld} from './ContinuityWorld';

export const ContinuityFixture: React.FC<ContinuityParameters & {holdSeconds: number}> = ({variant, count, holdSeconds}) => {
  const frame = useCurrentFrame(), {width, height, fps, durationInFrames} = useVideoConfig();
  // The whole world, including camera and responses, receives the same frozen clock.
  const displayFrame = Math.min(frame, durationInFrames - 1 - Math.ceil(holdSeconds * fps));
  const time = displayFrame / fps;
  const canvas = useRef<HTMLCanvasElement>(null), world = useRef<ContinuityWorld | null>(null);
  const latest = useRef(time); latest.current = time;
  useLayoutEffect(() => {
    const handle = delayRender('Initialize continuous motion fixture');
    let instance: ContinuityWorld | null = null;
    try {
      instance = createContinuityWorld(canvas.current!, width, height, {variant, count});
      world.current = instance; instance.setTime(latest.current); continueRender(handle);
    } catch (error) {instance?.dispose(); world.current = null; cancelRender(error);}
    return () => {instance?.dispose(); if (world.current === instance) world.current = null;};
  }, [width, height, variant, count]);
  useLayoutEffect(() => {
    try {world.current?.setTime(time);}
    catch (error) {world.current?.dispose(); world.current = null; cancelRender(error);}
  }, [time]);
  return <AbsoluteFill><canvas ref={canvas} width={width} height={height} style={{width: '100%', height: '100%'}} /></AbsoluteFill>;
};
