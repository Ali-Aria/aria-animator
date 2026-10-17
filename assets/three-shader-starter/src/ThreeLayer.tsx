import React,{useLayoutEffect,useRef} from 'react';
import {cancelRender,continueRender,delayRender,useVideoConfig} from 'remotion';
import {createWorld} from './world';
import type {SceneParameters,World} from './world';

export const ThreeLayer:React.FC<SceneParameters & {displayFrame:number}>=({displayFrame,variant,count})=>{
  const {width,height,fps}=useVideoConfig();
  const canvas=useRef<HTMLCanvasElement>(null);
  const world=useRef<World|null>(null);
  const time=displayFrame/fps;
  const latestTime=useRef(time);latestTime.current=time;
  useLayoutEffect(()=>{
    const handle=delayRender('Initialize deterministic Three.js scene');
    let instance:World|null=null;
    try{
      instance=createWorld(canvas.current!,width,height,{variant,count});
      world.current=instance;
      instance.setTime(latestTime.current);
      continueRender(handle);
    }catch(error){
      instance?.dispose();world.current=null;
      cancelRender(error instanceof Error?error:new Error(String(error)));
    }
    return ()=>{instance?.dispose();if(world.current===instance)world.current=null;};
  },[width,height,variant,count]);
  useLayoutEffect(()=>{
    try{world.current?.setTime(time);}
    catch(error){world.current?.dispose();world.current=null;cancelRender(error instanceof Error?error:new Error(String(error)));}
  },[time]);
  return <canvas ref={canvas} width={width} height={height} style={{width:'100%',height:'100%'}}/>;
};
