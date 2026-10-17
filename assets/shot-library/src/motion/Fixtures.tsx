import React from 'react';
import {AbsoluteFill, Composition, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MaskReveal, SceneTransition} from './primitives';
import {clamp01, easeBack, easeInOut, mix, motionClock, radiusMorph, receiverResponse, sampleProgress, spatialRanks, strokeReveal} from './runtime';
import {DynamicKineticStatement, DynamicDataCounter, DynamicElasticKeyPoint, DynamicCardSwarmTimeline, DynamicProductGridWorld, DynamicSaasKineticType} from './DynamicShots';
import {MotionBeatVisual} from './dispatch';
import type {TimelineBeat} from '../ProductionSystem';

const bg = '#10130f', paper = '#f4f1ea', lime = '#c9f36a', purple = '#8b6dff';
const Stage: React.FC<React.PropsWithChildren> = ({children}) => <AbsoluteFill style={{background: bg, color: paper, overflow: 'hidden', fontFamily: 'LXGW WenKai, sans-serif'}}>{children}</AbsoluteFill>;
const text = (value: string, top: number, size = 150) => <div style={{position: 'absolute', left: 150, right: 150, top, fontSize: size, fontWeight: 900, lineHeight: 1.12}}>{value}</div>;

const ReelPanel: React.FC<{panel: number; time: number}> = ({panel, time}) => {
  if (panel === 0) return <Stage><div style={{position: 'absolute', left: 150, right: 150, top: 250}}><MaskReveal progress={sampleProgress(time, .1, .5)}><div style={{fontSize: 180, fontWeight: 900}}>让动作</div></MaskReveal><MaskReveal progress={sampleProgress(time, .25, .5)} direction={-1}><div style={{fontSize: 180, color: lime, fontWeight: 900}}>接上下一步</div></MaskReveal></div><div style={{position: 'absolute', left: 155, top: 750, height: 8, width: 1500 * sampleProgress(time, .45, .6), background: lime}} /></Stage>;
  if (panel === 1) {
    const points = Array.from({length: 24}, (_, i) => ({x: i % 6, y: Math.floor(i / 6)}));
    const center = spatialRanks(points, 'center'), edges = spatialRanks(points, 'edges');
    return <Stage>{points.map((p, i) => {
      const appear = sampleProgress(time, 2.85 + center[i] * .025, .45, easeBack);
      const morph = sampleProgress(time, 4 + center[i] * .014, .45, easeInOut);
      const out = sampleProgress(time, 5.3 + edges[i] * .012, .35);
      return <div key={i} style={{position: 'absolute', left: 400 + p.x * 190, top: 170 + p.y * 190, width: 150, height: 150, background: i % 4 === 2 ? purple : lime, borderRadius: radiusMorph(150, morph), transform: `scale(${appear * (1 - out)}) rotate(${(1 - appear) * 45 - out * 60}deg)`}} />;
    })}</Stage>;
  }
  if (panel === 2) return <Stage><div style={{position: 'absolute', inset: 0, perspective: 1800}}>{['文字', '数据', '结果'].map((label, i) => {
    const p = sampleProgress(time, 6.3 + i * .12, .65);
    return <div key={i} style={{position: 'absolute', left: 150 + i * 560, top: 230, width: 500, height: 620, padding: 40, border: `2px solid ${lime}`, background: '#20251e', borderRadius: 30, opacity: p, transformOrigin: 'left center', transform: `rotateY(${(1 - p) * -85}deg)`}}><div style={{fontSize: 58, fontWeight: 900}}>{label}</div>
      {i === 0 && <MaskReveal progress={sampleProgress(time, 6.75, .45)}><div style={{fontSize: 190, color: lime, marginTop: 110}}>Aa</div></MaskReveal>}
      {i === 1 && <><div style={{fontSize: 100, marginTop: 45, fontWeight: 900}}>{Math.round(87 * sampleProgress(time, 6.9, .7))}%</div><div style={{position: 'absolute', left: 40, right: 40, bottom: 50, height: 200, display: 'flex', gap: 20, alignItems: 'flex-end'}}>{[.38,.62,.46,.88,.72].map((v, j) => <div key={j} style={{flex: 1, background: lime, height: `${v * 100}%`, transformOrigin: 'bottom', transform: `scaleY(${sampleProgress(time, 7 + j * .06, .5)})`}} />)}</div></>}
      {i === 2 && <svg width="360" height="360" viewBox="0 0 360 360" style={{marginTop: 75}}><circle cx="180" cy="180" r="130" fill="none" stroke={lime} strokeWidth="15" strokeDasharray="817" strokeDashoffset={strokeReveal(817,sampleProgress(time,7,.7,easeInOut))}/><circle cx="180" cy="180" r="80" fill="none" stroke={purple} strokeWidth="15" strokeDasharray="503" strokeDashoffset={strokeReveal(503,sampleProgress(time,7.4,.5,easeInOut))}/><path d="M90 270 L270 90" stroke={paper} strokeWidth="15" strokeDasharray="255" strokeDashoffset={strokeReveal(255,sampleProgress(time,7.75,.4))}/></svg>}
    </div>;
  })}</div></Stage>;
  if (panel === 3) return <Stage><svg width="520" height="520" viewBox="0 0 520 520" style={{position:'absolute',left:240,top:260}}><circle cx="260" cy="260" r="210" fill="none" stroke={lime} strokeWidth="22" strokeDasharray="1320" strokeDashoffset={strokeReveal(1320,sampleProgress(time,9.3,.8,easeInOut))}/><circle cx="260" cy="260" r="125" fill="none" stroke={purple} strokeWidth="22" strokeDasharray="786" strokeDashoffset={strokeReveal(786,sampleProgress(time,9.7,.6,easeInOut))}/><path d="M150 370 L370 150" stroke={paper} strokeWidth="22" strokeDasharray="312" strokeDashoffset={strokeReveal(312,sampleProgress(time,10.05,.45))}/></svg><div style={{position:'absolute',left:870,top:340,right:100}}><MaskReveal progress={sampleProgress(time,9.45,.5)}><div style={{fontSize:125,fontWeight:900}}>输入到结果</div></MaskReveal><MaskReveal progress={sampleProgress(time,9.65,.5)} direction={-1}><div style={{fontSize:125,fontWeight:900,color:lime}}>有迹可循</div></MaskReveal></div></Stage>;
  return <Stage><div style={{position:'absolute',left:150,right:150,top:310}}><MaskReveal progress={sampleProgress(time,12.5,.5)}><div style={{fontSize:140,fontWeight:900}}>清楚地变化</div></MaskReveal><MaskReveal progress={sampleProgress(time,12.65,.5)} direction={-1}><div style={{fontSize:140,fontWeight:900,color:lime}}>自然地接续</div></MaskReveal></div></Stage>;
};

export const MotionTechniqueReel: React.FC = () => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig();
  const displayFrame = Math.min(frame, Math.round(14 * fps));
  const time = displayFrame / fps;
  const transitions = [{start:2.35,duration:.6,kind:'wipe' as const},{start:5.85,duration:.6,kind:'wipe' as const},{start:9.15,duration:.65,kind:'zoom' as const},{start:12.1,duration:.65,kind:'slide' as const}];
  const i = transitions.findIndex(t => time < t.start + t.duration);
  if(i === -1) return <ReelPanel panel={4} time={time}/>;
  const transition = transitions[i];
  return <SceneTransition frame={displayFrame} fps={fps} motionProfile="impact" kind={transition.kind} startSeconds={transition.start} durationSeconds={transition.duration} color={i%2?purple:lime} outgoing={<ReelPanel panel={i} time={time}/>} incoming={<ReelPanel panel={i+1} time={time}/>}/>;
};

export const causalState = (time: number) => {
  const t = Math.min(time,24);
  const camera = mix(0,1680,sampleProgress(t,4.8,.75,easeInOut)) + mix(0,1680,sampleProgress(t,12.1,.75,easeInOut));
  const signalX = mix(460,2090,sampleProgress(t,4.85,.7,easeInOut)) + mix(0,1730,sampleProgress(t,12.15,.7,easeInOut));
  return {time:t,camera,signalX,evidence:t>=16.5&&t<20.5,freeze:t>=24};
};

export const CausalProcessFixture: React.FC = () => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig();
  const state = causalState(frame/fps), t=state.time;
  const accepted = [true,false,true,true,false];
  return <AbsoluteFill style={{background:paper,color:bg,fontFamily:'LXGW WenKai, sans-serif',overflow:'hidden'}}>
    <div data-world-owner="causal-process" style={{position:'absolute',inset:0,transform:`translateX(${-state.camera}px)`,opacity:state.evidence?.16:1}}>
      {[0,1680,3360].map((origin,i)=><section key={i} style={{position:'absolute',left:origin+200,top:220,width:1500,height:650,border:'3px solid #d4d8cd',borderRadius:36}}><div style={{position:'absolute',left:70,top:50,fontSize:52,fontWeight:800}}>{['收集输入','保留有效项','输出结果'][i]}</div></section>)}
      {accepted.map((ok,i)=>{
        const entry=sampleProgress(t,.15+i*.45,.4);
        const travel=sampleProgress(t,5.8+i*.9,.5,easeInOut);
        const route=sampleProgress(t,6.35+i*.9,.45,easeInOut);
        const output=sampleProgress(t,13+i*.55,.4);
        const x=mix(300+i*175,1900+i*135,travel)+ (ok?mix(0,1640,output):0);
        const y=mix(500+(i%2)*100, ok?440:740,route);
        return <div data-actor={`document-${i}`} key={i} style={{position:'absolute',left:x,top:y,width:130,height:170,borderRadius:16,background:ok?lime:'#e3a99c',border:'3px solid #33402b',transform:`translateY(${(1-entry)*100}px) scale(${entry})`,opacity:!ok?1-sampleProgress(t,11.7,.3):1}}><div style={{height:12,margin:20,background:'#33402b'}}/>{[0,1,2].map(n=><div key={n} style={{height:6,margin:'16px 20px',background:'#52634a'}}/>)}</div>;
      })}
      <div data-actor="input-bundle" style={{position:'absolute',left:state.signalX,top:375,width:56,height:56,borderRadius:14,background:purple,transform:`scale(${sampleProgress(t,.05,.35)})`}}/>
      <div style={{position:'absolute',left:2070,top:370,width:160,height:300,border:`8px solid ${purple}`,borderRadius:30,transform:`scale(${1+receiverResponse(t,5.55,.045,.35)})`}}/>
      <div style={{position:'absolute',left:3480,top:730,width:1200,fontSize:54,fontWeight:800,opacity:sampleProgress(t,14.5,.4)}}>5 项输入 → 3 项保留</div>
      <svg style={{position:'absolute',left:3990,top:470}} width="180" height="180" viewBox="0 0 100 100"><path d="M15 50 L40 75 L85 20" fill="none" stroke="#3c8334" strokeWidth="8" strokeLinecap="round" strokeDasharray="105" strokeDashoffset={strokeReveal(105,sampleProgress(t,15.15,.5))}/></svg>
    </div>
    {state.evidence&&<div style={{position:'absolute',inset:'8% 12%',display:'flex',justifyContent:'center',alignItems:'center',background:paper,borderRadius:24}}><Img src={staticFile('motion-fixture-evidence.svg')} style={{width:'100%',height:'100%',objectFit:'contain'}}/></div>}
    {t>=21&&<div style={{position:'absolute',left:180,right:180,top:150,fontSize:64,fontWeight:800,opacity:sampleProgress(t,21,.4)}}>保留主体，结果接入下一步</div>}
  </AbsoluteFill>;
};

export const MotionEdgeCases: React.FC = () => {
  const {fps}=useVideoConfig();
  const common={motionProfile:'process' as const,timingSeconds:{entry:.3,action:.5,exit:.25}};
  const beat = (composition: string, props: Record<string, unknown>): TimelineBeat => ({
    id: 'silent-dispatch-check', text: '', startMs: 0, endMs: 1000, from: 0, duration: fps, end: fps,
    semantic: {tags: []}, ...common, visual: {composition, props}, audio: {},
    transition: {in: 'none', out: 'none', durationFrames: 0},
    lifecycle: {entryFrames: Math.round(.3*fps), holdFrames: 0, exitFrames: 0},
    caption: {text: '', startMs: 0, endMs: 1000, timestampMs: null, confidence: null},
  });
  return <AbsoluteFill>
    <Sequence from={0} durationInFrames={fps}><MotionBeatVisual beat={beat('KineticStatement', {words: []})} motionProfile="process" fallback={null}/></Sequence>
    <Sequence from={fps} durationInFrames={fps}><MotionBeatVisual beat={beat('DataCounter', {value: 0, values: [], label: ''})} motionProfile="process" fallback={null}/></Sequence>
    <Sequence from={2*fps} durationInFrames={fps}><DynamicElasticKeyPoint {...common} eyebrow="" title="同一个主体如何穿过多个过程并保留可以识别的身份与结果" detail=""/></Sequence>
    <Sequence from={3*fps} durationInFrames={fps}><DynamicCardSwarmTimeline {...common} brand="" title="" cardLabels={['唯一主体']} timingSeconds={{entry:.2,action:.3,hold:0,phases:{timeline:{start:.6,duration:.2}}}}/></Sequence>
    <Sequence from={4*fps} durationInFrames={fps}><DynamicProductGridWorld {...common} brand="" statement="空列表保持可渲染" actions={[]}/></Sequence>
    <Sequence from={5*fps} durationInFrames={2*fps}><DynamicSaasKineticType {...common} phrases={['最后一个结果保持可读']} kicker="" timingSeconds={{entry:.2,hold:3}}/></Sequence>
  </AbsoluteFill>;
};

export const MotionFixtures: React.FC = () => <>
  {[30,60].map(fps=><Composition key={`reel-${fps}`} id={`MotionTechniqueReel${fps}`} component={MotionTechniqueReel} fps={fps} durationInFrames={15*fps} width={1920} height={1080}/>) }
  {[30,60].map(fps=><Composition key={`causal-${fps}`} id={`CausalProcessFixture${fps}`} component={CausalProcessFixture} fps={fps} durationInFrames={25*fps} width={1920} height={1080}/>) }
  {[30,60].map(fps=><Composition key={`edge-${fps}`} id={`MotionEdgeCases${fps}`} component={MotionEdgeCases} fps={fps} durationInFrames={7*fps} width={1920} height={1080}/>) }
</>;
