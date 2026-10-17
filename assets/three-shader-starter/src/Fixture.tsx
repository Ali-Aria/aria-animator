import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeLayer} from './ThreeLayer';
import type {SceneParameters} from './world';
export type FixtureProps=SceneParameters & {holdSeconds:number};
export const Fixture:React.FC<FixtureProps>=({variant,count,holdSeconds})=>{
  const frame=useCurrentFrame();
  const {durationInFrames,fps}=useVideoConfig();
  const holdFrame=Math.max(0,durationInFrames-1-Math.ceil(holdSeconds*fps));
  const displayFrame=Math.min(frame,holdFrame);
  // In a film, use this same displayFrame for the subtitle/evidence layer too.
  return <AbsoluteFill style={{background:'#F0F0EE'}}>
    <ThreeLayer displayFrame={displayFrame} variant={variant} count={count}/>
  </AbsoluteFill>;
};
