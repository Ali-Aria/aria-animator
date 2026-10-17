import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {createOrganizedWorld} from './OrganizedWorld';
import type {OrganizedParameters, OrganizedWorld} from './OrganizedWorld';

export const OrganizedFixture: React.FC<OrganizedParameters & {holdSeconds: number}> = ({variant, count, holdSeconds}) => {
  const frame = useCurrentFrame(), {width, height, fps, durationInFrames} = useVideoConfig();
  const seconds = Math.min(frame, durationInFrames - 1 - Math.ceil(holdSeconds * fps)) / fps;
  const canvas = useRef<HTMLCanvasElement>(null), world = useRef<OrganizedWorld | null>(null);
  const latest = useRef(seconds); latest.current = seconds;
  // Only structural inputs rebuild the world. Chapter id and frame are deliberately absent.
  useLayoutEffect(() => {
    const handle = delayRender('Build the shared chapter world');
    let instance: OrganizedWorld | null = null;
    try {
      instance = createOrganizedWorld(canvas.current!, width, height, {variant, count});
      world.current = instance; instance.setTime(latest.current); continueRender(handle);
    } catch (error) {instance?.dispose(); world.current = null; cancelRender(error);}
    return () => {instance?.dispose(); if (world.current === instance) world.current = null;};
  }, [width, height, variant, count]);
  useLayoutEffect(() => {
    try {world.current?.setTime(seconds);} catch (error) {cancelRender(error);}
  }, [seconds]);
  return <AbsoluteFill><canvas ref={canvas} style={{width: '100%', height: '100%'}} /></AbsoluteFill>;
};
