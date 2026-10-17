import React from 'react';
import {Composition} from 'remotion';
import {Fixture} from './Fixture';
// Silent runtime fixtures. Replace these with measured production timing and audio.
export const Root: React.FC=()=> <>
  <Composition id="Transfer30" component={Fixture} width={1280} height={720} fps={30} durationInFrames={240} defaultProps={{variant:'transfer',count:12,holdSeconds:.6}}/>
  <Composition id="Assembly60" component={Fixture} width={720} height={720} fps={60} durationInFrames={480} defaultProps={{variant:'assembly',count:18,holdSeconds:.6}}/>
</>;
