import React, {useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile} from 'remotion';

let fontPromise: Promise<void> | undefined;
const loadFonts = () => {
  if (!fontPromise) {
    fontPromise = Promise.all([
      ['LXGWWenKai-Regular.ttf', '400'],
      ['LXGWWenKai-Medium.ttf', '500'],
    ].map(async ([file, weight]) => {
      const font = new FontFace('LXGW WenKai', `url("${staticFile(`fonts/LxgwWenKai/${file}`)}")`, {weight});
      document.fonts.add(await font.load());
    })).then(() => undefined);
  }
  return fontPromise;
};

export const LxgwFont: React.FC<React.PropsWithChildren> = ({children}) => {
  const [handle] = useState(() => delayRender('Loading local LXGW WenKai fonts', {timeoutInMilliseconds: 60000}));
  useEffect(() => {
    loadFonts().then(() => continueRender(handle)).catch((error) => cancelRender(error));
  }, [handle]);
  return <AbsoluteFill style={{fontFamily: '"LXGW WenKai", sans-serif', fontWeight: 500, fontSynthesis: 'none'}}>{children}</AbsoluteFill>;
};
