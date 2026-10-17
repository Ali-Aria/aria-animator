import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {OrganizedFixture} from './OrganizedFixture';
const Root: React.FC = () => <>
  <Composition id="SharedWorldLinear30" component={OrganizedFixture} width={1280} height={720} fps={30}
    durationInFrames={360} defaultProps={{variant: 'linear', count: 6, holdSeconds: .6}} />
  <Composition id="SharedWorldCorner60" component={OrganizedFixture} width={1280} height={720} fps={60}
    durationInFrames={720} defaultProps={{variant: 'corner', count: 9, holdSeconds: .6}} />
</>;
registerRoot(Root);
