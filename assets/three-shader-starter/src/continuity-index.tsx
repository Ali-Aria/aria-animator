import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ContinuityFixture} from './ContinuityFixture';

const Root: React.FC = () => <>
  <Composition id="ContinuousTransfer30" component={ContinuityFixture} width={1280} height={720} fps={30}
    durationInFrames={180} defaultProps={{variant: 'transfer', count: 6, holdSeconds: .6}} />
  <Composition id="CurvedAssembly60" component={ContinuityFixture} width={720} height={720} fps={60}
    durationInFrames={360} defaultProps={{variant: 'assembly', count: 8, holdSeconds: .6}} />
</>;
registerRoot(Root);
