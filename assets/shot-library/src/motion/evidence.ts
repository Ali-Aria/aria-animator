import {motionClock, sampleProgress, easeBack, easeInOut, type MotionOptions} from './runtime';

export type EvidenceWindow = MotionOptions & {
  start: number; // First settled reading second in the global composition.
  end: number;   // Last settled reading second; exit starts here.
  enabled?: boolean;
};
export type EvidencePose = {
  visible: boolean; x: number; phase: 'hidden' | 'enter' | 'read' | 'exit';
  entryStart: number; exitEnd: number;
};
/** The photograph and source-aligned annotations share this single screen transform.
 * Exactly zero displacement throughout reading, independent of world camera state.
 */
export function evidencePose(time:number,width:number,fps:number,options:EvidenceWindow):EvidencePose {
  if(![time,width,fps,options.start,options.end].every(Number.isFinite)
      || width<=0 || fps<=0 || options.start<0 || options.end<=options.start)
    throw new Error('Invalid evidence reading window');
  const clock=motionClock(time*fps,fps,{...options,motionProfile:options.motionProfile??'process'});
  const entry=options.enabled===false?0:clock.entry;
  const exit=options.enabled===false?0:clock.exit;
  const entryStart=options.start-entry,exitEnd=options.end+exit;
  const hidden=time<entryStart||time>=exitEnd;
  if(hidden)return {visible:false,x:0,phase:'hidden',entryStart,exitEnd};
  if(time<options.start){
    const u=sampleProgress(time,entryStart,entry,easeBack);
    return {visible:true,x:(1-u)*width,phase:'enter',entryStart,exitEnd};
  }
  if(time>=options.end){
    const u=sampleProgress(time,options.end,exit,easeInOut);
    return {visible:true,x:-u*width,phase:'exit',entryStart,exitEnd};
  }
  return {visible:true,x:0,phase:'read',entryStart,exitEnd};
}
