import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {evidencePose,type EvidenceWindow} from './evidence';

export type EvidenceTransitionProps = React.PropsWithChildren<EvidenceWindow & {
  time?:number; background?:string;
}>;
export const EvidenceTransition:React.FC<EvidenceTransitionProps>=({children,time,background='#FFFFFF',...window})=>{
  const frame=useCurrentFrame(),{fps,width}=useVideoConfig();
  const pose=evidencePose(time??frame/fps,width,fps,window);
  if(!pose.visible)return null;
  return <AbsoluteFill data-evidence-phase={pose.phase} style={{background,transform:`translateX(${pose.x}px)`}}>
    {children}
  </AbsoluteFill>;
};
