import React from 'react';
import {KineticStatement, DataCounter} from '../Shots';
import {WideElasticKeyPoint} from '../VibeMotionShots';
import {UiAeCardSwarmTimeline, UiAeProductGridWorld} from '../UiAeReferenceShots';
import {AeSaasKineticType} from '../AeProjectReferenceShots';
import {WhipPanTransition} from '../GithubInspiredShots';
import {WideChapterTransition} from '../ArollBrollShots';
import type {TimelineBeat} from '../ProductionSystem';
import type {MotionOptions, MotionProfile} from './runtime';

export const MotionBeatVisual: React.FC<{beat: TimelineBeat; motionProfile: MotionProfile; fallback: React.ReactNode}> = ({beat, motionProfile, fallback}) => {
  const p = beat.visual.props ?? {};
  const text = (key: string, value: string) => typeof p[key] === 'string' ? p[key] as string : value;
  const strings = (key: string, values: string[]) => Array.isArray(p[key]) && (p[key] as unknown[]).every(v => typeof v === 'string') ? p[key] as string[] : values;
  const options: MotionOptions = {motionProfile, timingSeconds: beat.timingSeconds, timingFrames: beat.timingFrames, entryFrames: beat.lifecycle?.entryFrames, exitFrames: beat.lifecycle?.exitFrames};
  const accent = text('accent', '#c9f36a');
  switch (beat.visual.composition) {
    case 'KineticStatement': return <KineticStatement {...options} words={strings('words', [beat.text])} accent={accent} />;
    case 'DataCounter': return typeof p.value === 'number' ? <DataCounter {...options} value={p.value} values={Array.isArray(p.values) && p.values.every(v => typeof v === 'number') ? p.values as number[] : []} label={text('label', '')} accent={accent} /> : <>{fallback}</>;
    case 'WideElasticKeyPoint': return <WideElasticKeyPoint {...options} title={text('title', beat.text)} eyebrow={text('eyebrow', '')} detail={text('detail', '')} accent={accent} />;
    case 'UiAeCardSwarmTimeline': return <UiAeCardSwarmTimeline {...options} brand={text('brand', '')} title={text('title', beat.text)} cardLabels={strings('cardLabels', [])} accent={accent} />;
    case 'UiAeProductGridWorld': return <UiAeProductGridWorld {...options} brand={text('brand', '')} statement={text('statement', beat.text)} actions={strings('actions', [])} accent={accent} />;
    case 'AeSaasKineticType': return <AeSaasKineticType {...options} phrases={strings('phrases', [beat.text])} kicker={text('kicker', '')} accent={accent} />;
    case 'WhipPanTransition': return <WhipPanTransition {...options} fromTitle={text('fromTitle', '')} toTitle={text('toTitle', beat.text)} accent={accent} />;
    case 'WideChapterTransition': return <WideChapterTransition {...options} fromTitle={text('fromTitle', '')} toTitle={text('toTitle', beat.text)} chapter={text('chapter', '')} />;
    default: return <>{fallback}</>;
  }
};
