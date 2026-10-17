import {DynamicCardSwarmTimeline, DynamicProductGridWorld} from './motion/DynamicShots';
import {hasMotionOptions, type MotionOptions} from './motion/runtime';
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const overshoot = Easing.bezier(0.34, 1.56, 0.64, 1);

const progress = (
  frame: number,
  start: number,
  end: number,
  easing: (value: number) => number = easeOut,
) =>
  interpolate(frame, [start, end], [0, 1], {
    ...clamp,
    easing,
  });

const UiStage: React.FC<
  React.PropsWithChildren<{background?: string; color?: string}>
> = ({children, background = '#050608', color = '#f8fbff'}) => (
  <AbsoluteFill
    style={{
      overflow: 'hidden',
      background,
      color,
      fontFamily:
        'LXGW WenKai, sans-serif',
    }}
  >
    {children}
  </AbsoluteFill>
);

const CursorGlyph: React.FC<{size?: number; color?: string}> = ({
  size = 52,
  color = '#7fefff',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path
      d="M10 6 L53 31 L35 36 L27 56 Z"
      fill={color}
      stroke="#ffffff"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);

const SoftGlow: React.FC<{
  x: string;
  y: string;
  size: number;
  color: string;
  opacity?: number;
  blur?: number;
}> = ({x, y, size, color, opacity = 0.55, blur = 38}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      opacity,
      filter: `blur(${blur}px)`,
      translate: '-50% -50%',
      mixBlendMode: 'screen',
    }}
  />
);

export type UiAePromptAgentFlowProps = {
  prompt: string;
  agentName: string;
  features: string[];
  accent?: string;
};

export const UiAePromptAgentFlow: React.FC<UiAePromptAgentFlowProps> = ({
  prompt,
  agentName,
  features,
  accent = '#26b9ee',
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const typed = Math.floor(interpolate(frame, [10, 60], [0, prompt.length], clamp));
  const promptCommit = progress(frame, 62, 82, easeIn);
  const specIn = progress(frame, 76, 108, easeOut);
  const appReveal = progress(frame, 132, 164, easeInOut);
  const metricBuild = progress(frame, 165, 218, easeOut);
  const cursorX = interpolate(frame, [12, 58, 72, 132, 182], [width * 0.28, width * 0.72, width * 0.79, width * 0.68, width * 0.82], {
    ...clamp,
    easing: easeInOut,
  });
  const cursorY = interpolate(frame, [12, 58, 72, 132, 182], [height * 0.68, height * 0.58, height * 0.28, height * 0.74, height * 0.46], {
    ...clamp,
    easing: easeInOut,
  });

  return (
    <UiStage background="#efede8" color="#111319">
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 70% 16%, rgba(53,202,255,.25), transparent 32%), #efede8',
          opacity: 1 - appReveal,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: width * 0.5,
          top: interpolate(promptCommit, [0, 1], [height * 0.44, height * 0.11]),
          width: interpolate(promptCommit, [0, 1], [width * 0.52, width * 0.34]),
          minHeight: interpolate(promptCommit, [0, 1], [height * 0.2, height * 0.12]),
          padding: `${height * 0.035}px ${width * 0.025}px`,
          borderRadius: interpolate(promptCommit, [0, 1], [28, 22]),
          background: interpolateColors(
            promptCommit,
            [0, 1],
            ['rgba(255,255,255,.96)', 'rgba(17,19,25,.96)'],
          ),
          color: promptCommit > 0.5 ? '#f8fbff' : '#111319',
          boxShadow: '0 24px 90px rgba(29,36,46,.16)',
          translate: '-50% 0',
          fontSize: height * 0.035,
          lineHeight: 1.35,
          zIndex: 4,
        }}
      >
        {prompt.slice(0, typed)}
        {frame < 68 ? <span style={{color: accent}}>▌</span> : null}
        <div
          style={{
            position: 'absolute',
            right: 20,
            bottom: 18,
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: promptCommit > 0.6 ? accent : '#111319',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 25,
          }}
        >
          ↑
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: width * 0.09,
          top: height * 0.19,
          width: width * 0.56,
          height: height * 0.68,
          borderRadius: 36,
          background: '#fff',
          border: '1px solid rgba(20,29,37,.09)',
          padding: `${height * 0.065}px ${width * 0.055}px`,
          boxShadow: '0 30px 110px rgba(22,31,40,.14)',
          opacity: specIn * (1 - appReveal),
          translate: `${(1 - specIn) * -120}px 0`,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: accent,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 900,
              fontSize: 26,
            }}
          >
            AI
          </div>
          <div>
            <div style={{fontSize: height * 0.052, fontWeight: 760}}>{agentName}</div>
            <div style={{fontSize: height * 0.024, color: '#d74e64', marginTop: 8}}>
              Building your reusable agent
            </div>
          </div>
        </div>
        <div style={{marginTop: height * 0.055, display: 'grid', gap: height * 0.027}}>
          {features.map((feature, index) => {
            const rowIn = progress(frame, 88 + index * 8, 103 + index * 8);
            return (
              <div
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  fontSize: height * 0.029,
                  opacity: rowIn,
                  translate: `${(1 - rowIn) * 32}px 0`,
                }}
              >
                <span style={{color: '#26a565', fontWeight: 900}}>✓</span>
                {feature}
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: height * 0.055,
            height: 2,
            background: '#e7e8e9',
            scale: `${progress(frame, 112, 128)} 1`,
            transformOrigin: '0 50%',
          }}
        />
        <div style={{marginTop: 28, color: '#5f6671', fontSize: height * 0.024}}>
          A production-ready workflow is being assembled from your instruction.
        </div>
      </div>

      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 20% 22%, #55dcff, transparent 29%), radial-gradient(circle at 80% 74%, #78a8ff, transparent 34%), linear-gradient(135deg, #b9f1ff 0%, #40c5f3 46%, #86a9ff 100%)',
          opacity: appReveal,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: width * 0.13,
          top: height * 0.12,
          width: width * 0.74,
          height: height * 0.69,
          borderRadius: 34,
          background: '#16181d',
          border: '1px solid rgba(255,255,255,.18)',
          boxShadow: '0 50px 150px rgba(6,15,32,.35)',
          opacity: appReveal,
          translate: `0 ${(1 - appReveal) * 140}px`,
          scale: `${interpolate(appReveal, [0, 1], [0.86, 1], clamp)}`,
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 72,
            padding: '0 30px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid rgba(255,255,255,.08)',
          }}
        >
          <span style={{width: 11, height: 11, borderRadius: '50%', background: '#ff6e63'}} />
          <span style={{width: 11, height: 11, borderRadius: '50%', background: '#ffc85b'}} />
          <span style={{width: 11, height: 11, borderRadius: '50%', background: '#6de183'}} />
          <span style={{marginLeft: 18, color: '#aeb5c0'}}>Contract Review · Live</span>
        </div>
        <div style={{padding: '34px 42px'}}>
          <div style={{fontSize: height * 0.036, fontWeight: 720}}>Contracts</div>
          <div
            style={{
              marginTop: 32,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 18,
            }}
          >
            {[
              ['Reviewed', 248, '#6fc7ff'],
              ['Risk clauses', 37, '#ff657d'],
              ['Needs action', 15, '#ffe36f'],
            ].map(([label, value, color], index) => (
              <div
                key={String(label)}
                style={{
                  background: '#22252b',
                  borderRadius: 20,
                  padding: '22px 24px',
                  opacity: progress(frame, 169 + index * 7, 187 + index * 7),
                  translate: `0 ${(1 - progress(frame, 169 + index * 7, 187 + index * 7)) * 28}px`,
                }}
              >
                <div style={{fontSize: height * 0.019, color: '#8e96a4'}}>{label}</div>
                <div style={{fontSize: height * 0.055, fontWeight: 780, color: String(color), marginTop: 10}}>
                  {Math.round(Number(value) * metricBuild)}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop: 26, display: 'grid', gap: 14}}>
            {['Master Service Agreement', 'Software Subscription', 'Data Processing Addendum'].map(
              (label, index) => (
                <div
                  key={label}
                  style={{
                    height: 58,
                    borderRadius: 16,
                    background: index % 2 ? '#202329' : '#1d2025',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 20px',
                    gap: 16,
                    opacity: progress(frame, 188 + index * 6, 206 + index * 6),
                  }}
                >
                  <span style={{color: index === 1 ? '#ff657d' : '#6de183'}}>●</span>
                  <span>{label}</span>
                  <span style={{marginLeft: 'auto', color: '#7b8290'}}>
                    {index === 1 ? 'review' : 'ready'}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: cursorX,
          top: cursorY,
          zIndex: 12,
          translate: '-10% -10%',
          filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.25))',
          opacity: frame < 225 ? 1 : 1 - progress(frame, 225, 235),
        }}
      >
        <CursorGlyph />
      </div>
    </UiStage>
  );
};

export type UiAeCardSwarmTimelineProps = MotionOptions & {
  brand: string;
  title: string;
  cardLabels: string[];
  accent?: string;
};

const LegacyUiAeCardSwarmTimeline: React.FC<UiAeCardSwarmTimelineProps> = ({
  brand,
  title,
  cardLabels,
  accent = '#45ee9b',
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const typeBeat = progress(frame, 0, 42, easeInOut);
  const swarm = progress(frame, 38, 105, easeOut);
  const grid = progress(frame, 92, 132, easeInOut);
  const timeline = progress(frame, 133, 174, easeInOut);
  const playhead = progress(frame, 172, 222, easeInOut);
  const colors = ['#7b63ff', '#ff6d86', '#45ee9b', '#ffb547', '#64b5ff', '#eee8df'];

  return (
    <UiStage
      background={timeline > 0.45 ? '#f4f3ef' : '#07090c'}
      color={timeline > 0.45 ? '#111318' : '#f9fbff'}
    >
      <SoftGlow
        x={`${55 - grid * 15}%`}
        y={`${60 - grid * 18}%`}
        size={700}
        color={accent}
        opacity={(1 - timeline) * 0.4}
        blur={80}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          opacity: 1 - swarm,
        }}
      >
        <div
          style={{
            fontSize: height * 0.16,
            fontWeight: 640,
            letterSpacing: '-0.07em',
            translate: `${interpolate(typeBeat, [0, 0.5, 1], [-width * 0.12, 0, width * 0.12], clamp)}px 0`,
            scale: `${interpolate(typeBeat, [0, 0.55, 1], [0.74, 1.06, 0.84], clamp)}`,
            filter: `blur(${interpolate(typeBeat, [0, 0.4, 1], [16, 0, 6], clamp)}px)`,
          }}
        >
          {title}
        </div>
      </div>

      {cardLabels.map((label, index) => {
        const angle = (index / Math.max(1, cardLabels.length)) * Math.PI * 2 - 0.7;
        const targetCol = index % 4;
        const targetRow = Math.floor(index / 4);
        const targetX = width * (0.25 + targetCol * 0.17);
        const targetY = height * (0.31 + targetRow * 0.22);
        const orbitX = width * 0.5 + Math.cos(angle) * width * 0.34;
        const orbitY = height * 0.52 + Math.sin(angle) * height * 0.32;
        const x = interpolate(grid, [0, 1], [orbitX, targetX]);
        const y = interpolate(grid, [0, 1], [orbitY, targetY]);
        const local = progress(frame, 39 + index * 4, 65 + index * 4, overshoot);
        return (
          <div
            key={label}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: width * 0.145,
              height: height * 0.2,
              borderRadius: 24,
              background: `linear-gradient(145deg, ${colors[index % colors.length]}, #12151b 72%)`,
              border: '1px solid rgba(255,255,255,.34)',
              boxShadow: '0 28px 70px rgba(0,0,0,.35)',
              translate: '-50% -50%',
              rotate: `${interpolate(grid, [0, 1], [Math.sin(index * 2.3) * 16, 0], clamp)}deg`,
              scale: `${local * interpolate(grid, [0, 1], [0.72 + (index % 3) * 0.12, 1], clamp)}`,
              opacity: local * (1 - timeline),
              padding: 22,
              display: 'flex',
              alignItems: 'flex-end',
              fontSize: height * 0.029,
              fontWeight: 720,
            }}
          >
            {label}
          </div>
        );
      })}

      <div
        style={{
          position: 'absolute',
          left: width * 0.5,
          top: height * 0.5,
          translate: '-50% -50%',
          opacity: swarm * (1 - timeline),
          scale: `${interpolate(swarm, [0, 0.6, 1], [0.4, 1.1, 1], clamp)}`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 86,
            height: 86,
            borderRadius: 24,
            margin: '0 auto',
            display: 'grid',
            placeItems: 'center',
            background: accent,
            color: '#07110c',
            fontWeight: 950,
            fontSize: 42,
            boxShadow: `0 0 50px ${accent}88`,
          }}
        >
          M
        </div>
        <div style={{fontSize: height * 0.055, marginTop: 22, fontWeight: 680}}>{brand}</div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: width * 0.1,
          top: height * 0.14,
          width: width * 0.8,
          height: height * 0.7,
          borderRadius: 24,
          background: '#ffffff',
          border: '1px solid #d8d9dc',
          boxShadow: '0 34px 100px rgba(24,28,34,.18)',
          opacity: timeline,
          translate: `0 ${(1 - timeline) * 90}px`,
          overflow: 'hidden',
          color: '#181b21',
        }}
      >
        <div
          style={{
            height: 78,
            display: 'flex',
            alignItems: 'center',
            padding: '0 32px',
            borderBottom: '1px solid #e1e2e4',
            gap: 12,
          }}
        >
          <span style={{width: 13, height: 13, borderRadius: '50%', background: '#ff6961'}} />
          <span style={{width: 13, height: 13, borderRadius: '50%', background: '#ffc860'}} />
          <span style={{width: 13, height: 13, borderRadius: '50%', background: '#5dd477'}} />
          <strong style={{marginLeft: 20}}>Motion timeline</strong>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 78,
            bottom: 0,
            width: '28%',
            background: '#f6f7f8',
            borderRight: '1px solid #dedfe2',
            padding: '32px 28px',
          }}
        >
          {['Card swarm', 'Hero title', 'Brand mark', 'Color field'].map((label, index) => (
            <div
              key={label}
              style={{
                height: 48,
                borderRadius: 12,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                background: index === 1 ? '#e5fdf1' : 'transparent',
                color: index === 1 ? '#18754a' : '#68707c',
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', left: '28%', right: 0, top: 78, bottom: 0}}>
          {Array.from({length: 5}, (_, row) => (
            <div
              key={row}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 32 + row * 76,
                height: 2,
                background: '#eceef1',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 28 + row * 44,
                  top: -10,
                  width: width * (0.17 + row * 0.032) * playhead,
                  height: 22,
                  borderRadius: 7,
                  background: row === 1 ? accent : colors[row % colors.length],
                  opacity: 0.84,
                }}
              />
              {[0.22, 0.58, 0.86].map((point, index) => (
                <div
                  key={point}
                  style={{
                    position: 'absolute',
                    left: `${point * 100}%`,
                    top: -7,
                    width: 15,
                    height: 15,
                    background: '#fff',
                    border: `3px solid ${index === 1 ? accent : '#58606d'}`,
                    rotate: '45deg',
                    scale: `${progress(frame, 179 + row * 3 + index * 2, 188 + row * 3 + index * 2)}`,
                  }}
                />
              ))}
            </div>
          ))}
          <div
            style={{
              position: 'absolute',
              top: 18,
              bottom: 22,
              left: `${interpolate(playhead, [0, 1], [7, 92], clamp)}%`,
              width: 3,
              background: '#278cff',
              boxShadow: '0 0 12px rgba(39,140,255,.45)',
            }}
          />
        </div>
      </div>
    </UiStage>
  );
};

export type UiAeProductGridWorldProps = MotionOptions & {
  brand: string;
  statement: string;
  actions: string[];
  accent?: string;
};

const LegacyUiAeProductGridWorld: React.FC<UiAeProductGridWorldProps> = ({
  brand,
  statement,
  actions,
  accent = '#4dff9b',
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const deck = progress(frame, 0, 56, easeInOut);
  const tiles = progress(frame, 48, 92, easeOut);
  const field = progress(frame, 88, 130, easeInOut);
  const interfaceIn = progress(frame, 128, 172, easeOut);
  const macro = progress(frame, 176, 230, easeInOut);
  const tileCols = 10;
  const tileRows = 5;

  return (
    <UiStage background="#050907">
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 112%, rgba(51,255,130,.5), transparent 42%), linear-gradient(#030705, #06100b)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: width * 0.11,
          right: width * 0.11,
          top: height * 0.16,
          height: height * 0.54,
          perspective: 1200,
          opacity: 1 - tiles,
        }}
      >
        {Array.from({length: 15}, (_, index) => {
          const column = index % 5;
          const row = Math.floor(index / 5);
          const local = progress(frame, index * 2, 22 + index * 2);
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${column * 17 + 7}%`,
                top: `${row * 27 + 4}%`,
                width: '23%',
                height: '42%',
                borderRadius: 20,
                background:
                  index % 3 === 0
                    ? `linear-gradient(155deg, ${accent}, #163522)`
                    : 'linear-gradient(155deg, #d9f5df, #194a2d)',
                border: '1px solid rgba(255,255,255,.3)',
                boxShadow: '0 24px 70px rgba(0,0,0,.42)',
                translate: `${interpolate(deck, [0, 1], [index * 8, -column * 13], clamp)}px ${interpolate(local, [0, 1], [100, row * -12], clamp)}px`,
                rotate: `${interpolate(deck, [0, 1], [-7 + index * 0.7, 0], clamp)}deg`,
                scale: `${local}`,
                opacity: local,
                padding: 18,
                color: index % 3 === 0 ? '#07130c' : '#edf9f0',
                fontWeight: 760,
              }}
            >
              <div style={{fontSize: height * 0.018, opacity: 0.72}}>Analysis {index + 1}</div>
              <div style={{fontSize: height * 0.034, marginTop: 14}}>
                {actions[index % actions.length]}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: width * 0.12,
          right: width * 0.12,
          top: height * 0.19,
          height: height * 0.48,
          display: 'grid',
          gridTemplateColumns: `repeat(${tileCols}, 1fr)`,
          gridTemplateRows: `repeat(${tileRows}, 1fr)`,
          gap: 4,
          opacity: tiles * (1 - field),
          scale: `${interpolate(tiles, [0, 1], [1.25, 1], clamp)}`,
        }}
      >
        {Array.from({length: tileCols * tileRows}, (_, index) => (
          <div
            key={index}
            style={{
              borderRadius: 5,
              background:
                index % 7 === 0
                  ? accent
                  : `rgba(${24 + (index % 4) * 7}, ${67 + (index % 5) * 12}, ${
                      40 + (index % 3) * 10
                    }, .94)`,
              opacity: progress(frame, 48 + (index % 10) * 2, 72 + (index % 10) * 2),
              scale: `${interpolate(
                progress(frame, 48 + (index % 10) * 2, 72 + (index % 10) * 2),
                [0, 1],
                [0.45, 1],
              )}`,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontSize: height * 0.09,
            fontWeight: 760,
            letterSpacing: '-0.05em',
            textShadow: '0 12px 50px #000',
          }}
        >
          {brand}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: field * (1 - interfaceIn),
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '13%',
            right: '13%',
            top: '20%',
            bottom: '24%',
            display: 'grid',
            gridTemplateColumns: 'repeat(34, 1fr)',
            gap: 7,
            maskImage: 'radial-gradient(ellipse at center, #000 35%, transparent 75%)',
          }}
        >
          {Array.from({length: 34 * 14}, (_, index) => {
            const x = index % 34;
            const y = Math.floor(index / 34);
            const wave = Math.sin(x * 0.5 + field * 9) + Math.cos(y * 0.78 - field * 7);
            return (
              <span
                key={index}
                style={{
                  width: 4 + Math.max(0, wave) * 2,
                  height: 4 + Math.max(0, wave) * 2,
                  borderRadius: '50%',
                  background: index % 9 === 0 ? accent : '#b7ffd4',
                  opacity: 0.12 + Math.max(0, wave) * 0.16,
                  translate: `0 ${wave * 9}px`,
                }}
              />
            );
          })}
        </div>
        <div style={{fontSize: height * 0.055, letterSpacing: '-0.04em'}}>
          {statement}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: width * 0.2,
          right: width * 0.2,
          top: height * 0.15,
          height: height * 0.7,
          borderRadius: 38,
          background:
            'linear-gradient(180deg, rgba(16,22,19,.96), rgba(5,9,7,.98))',
          border: '1px solid rgba(132,255,184,.28)',
          boxShadow: `0 0 0 1px rgba(255,255,255,.04), 0 60px 140px rgba(0,0,0,.48), 0 0 80px ${accent}22`,
          opacity: interfaceIn,
          translate: `0 ${(1 - interfaceIn) * 110}px`,
          scale: `${interpolate(interfaceIn, [0, 1], [0.88, 1], clamp)}`,
          overflow: 'hidden',
        }}
      >
        <div style={{padding: '34px 38px', borderBottom: '1px solid rgba(255,255,255,.08)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <strong style={{fontSize: height * 0.028}}>{brand}</strong>
            <span style={{color: '#9aa89f'}}>Online · Secure</span>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: interpolate(macro, [0, 1], [38, -width * 0.08]),
            right: 38,
            top: 112,
            bottom: 38,
            scale: `${interpolate(macro, [0, 1], [1, 1.38], clamp)}`,
            transformOrigin: '72% 66%',
          }}
        >
          <div style={{fontSize: height * 0.045, fontWeight: 650}}>How can I help?</div>
          <div style={{marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 14}}>
            {actions.map((label, index) => (
              <div
                key={label}
                style={{
                  border: '1px solid rgba(255,255,255,.17)',
                  background: 'rgba(255,255,255,.035)',
                  borderRadius: 999,
                  padding: '16px 24px',
                  fontSize: height * 0.021,
                  opacity: progress(frame, 145 + index * 5, 162 + index * 5),
                  translate: `${(1 - progress(frame, 145 + index * 5, 162 + index * 5)) * 30}px 0`,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 92,
              borderRadius: 22,
              border: '1px solid rgba(255,255,255,.16)',
              background: '#0c110e',
              display: 'flex',
              alignItems: 'center',
              padding: '0 28px',
              color: '#75827a',
            }}
          >
            Ask anything…
            <div
              style={{
                marginLeft: 'auto',
                width: 52,
                height: 52,
                borderRadius: 16,
                background: accent,
                color: '#061009',
                display: 'grid',
                placeItems: 'center',
                fontSize: 28,
              }}
            >
              ↑
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${interpolate(macro, [0, 1], [0, 100], clamp)}%`,
          height: 3,
          background: accent,
          boxShadow: `0 0 18px 5px ${accent}`,
          opacity: macro * (1 - progress(frame, 224, 234)),
        }}
      />
    </UiStage>
  );
};

export const UiAeCardSwarmTimeline: React.FC<UiAeCardSwarmTimelineProps> = (props) => (hasMotionOptions(props)) ? <DynamicCardSwarmTimeline {...props} /> : <LegacyUiAeCardSwarmTimeline {...props} />;

export const UiAeProductGridWorld: React.FC<UiAeProductGridWorldProps> = (props) => (hasMotionOptions(props)) ? <DynamicProductGridWorld {...props} /> : <LegacyUiAeProductGridWorld {...props} />;
