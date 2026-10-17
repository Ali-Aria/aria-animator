# GSAP in Remotion

Status: legacy compatibility. Read only for an existing GSAP implementation or an explicit user request. New films follow the minimal 2D architecture in [SKILL.md](../SKILL.md). This reference does not change the default production architecture or authorize shared dependency changes.

For a legacy scene, the official `@remotion/gsap` adapter can support
overlapping entrances, staggered assembly, multi-stage changes and explicit timeline positions.
Use native Remotion for numeric values, geometry, paths and other React-rendered state when that is
clearer; mixed implementations are valid. Neither GSAP nor the example below defines a visual style.
The existing palette, text, evidence-image, camera and action-duration rules still apply.

## Verify the runtime

Check the installed adapter's types/source and the authoritative documentation before unfamiliar APIs:

- [Package and installation](https://www.remotion.dev/docs/gsap)
- [useGsapTimeline API and restrictions](https://www.remotion.dev/docs/gsap/use-gsap-timeline)

`@remotion/gsap` starts at Remotion 4.0.517. Match its exact version to the project's other Remotion
packages and use the declared compatible `gsap` peer. Read the current project's manifest, lock and
installed versions instead of copying a version number from a web example. Follow
[project dependency setup](shared-dependencies.md); do not install from a junction-linked project.
Resolve missing packages in the current project's independent dependency tree before using this route.

## Clock, targets and property ownership

`useGsapTimeline()` builds a paused timeline, seeks it from the current Remotion frame and returns
a scope ref. Attach the ref, use its scoped selector and add all tweens to its supplied timeline.
Do not start GSAP's ticker or call play/resume/restart/reverse/seek/progress/timeScale to control
the composition. Schedule semantic events using positions; do not scale a timeline to fill the explanation.

The documented adapter rejects asynchronous builders, animation callbacks, freestanding animations,
plain-object tween targets and unseeded GSAP randomness. Use DOM/SVG targets. Derive numeric state
in React from frames and stable inputs. Use seeded data for variation; do not hide wall-clock or
Math.random dependencies in function-valued tween properties. The current adapter does not support
external GSAP plugins; do not promise MorphSVG/MotionPath/ScrollTrigger/Draggable behavior. Re-check
support against the installed version before changing that assumption.

Assign each animated property one owner. For example, GSAP can own an actor wrapper's transform and
opacity while Remotion owns a separate SVG path's geometry or reveal value. Do not have React write
the same transform/opacity on each frame. Keep evidence images and their focus overlays outside animated parents during reading. For user-requested brief entrance or exit motion, follow [the evidence-image rules](code-motion-design.md). Load assets/data before the synchronous builder.

## Global cue scheduling inside a Sequence

Plan event starts on the project timeline and durations independently of explanation length. Inside a
Sequence starting at `sceneStartFrame`, use `(event.startFrame - sceneStartFrame) / fps` as the GSAP
position and `event.durationInFrames / fps` as the duration. The hook already uses the Sequence-local
frame; do not seek it yourself or subtract the offset twice. For nested Sequences, sceneStartFrame
is their total global start. Own an event in a scope mounted before it starts; carry a cross-beat
actor in a shared owner rather than resetting it at each sentence.

Rebuild on relevant prop/fps changes through `dependencies`. Do not put the current frame in that
list: the adapter performs frame seeks without rebuilding. A 20-second scene can have a half-second
entrance, later supported changes and observation intervals; event lengths do not expand to 20 seconds.

## Minimal copyable hybrid example

This is an API example, not a shot preset. Supply actor content and positions appropriate to the
new film. The separate path demonstrates frame-derived state; omit it when it has no explanatory job.
The component owns one event. Compose events/actors according to the visual argument; do not use
this one entrance as the entire motion of every long passage.

```tsx
import React from 'react';
import {useGsapTimeline} from '@remotion/gsap';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export type MotionEvent = {
  cueId: string;
  actor: string;
  action: string;
  motionType: string;
  startFrame: number;
  durationInFrames: number;
};

type Props = {
  event: MotionEvent;
  sceneStartFrame: number;
  distance: number;
  color: string;
  children: React.ReactNode;
};

export const EventActor: React.FC<Props> = ({
  event, sceneStartFrame, distance, color, children,
}) => {
  const localFrame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localStart = event.startFrame - sceneStartFrame;
  if (localStart < 0 || event.durationInFrames <= 0 || distance <= 0) {
    throw new Error('Mount the event owner before its start; use positive duration and distance.');
  }
  const scope = useGsapTimeline<HTMLDivElement>(
    ({timeline, selector}) => {
      const actor = selector('[data-moving]');
      timeline
        .set(actor, {x: -distance, opacity: 0}, 0)
        .to(actor, {
          x: 0, opacity: 1,
          duration: event.durationInFrames / fps,
          ease: 'power3.out',
        }, localStart / fps);
    },
    {dependencies: [localStart, event.durationInFrames, distance, fps]},
  );
  const progress = interpolate(
    localFrame, [localStart, localStart + event.durationInFrames], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  return (
    <div ref={scope}>
      <div data-moving style={{display: 'inline-block'}}>{children}</div>
      <svg width={distance} height={16} viewBox={`0 0 ${distance} 16`}>
        <path d={`M 0 8 H ${distance}`} fill="none" stroke={color}
          strokeWidth={3} pathLength={1} strokeDasharray={1}
          strokeDashoffset={1 - progress}/>
      </svg>
    </div>
  );
};
```

Mount with `<Sequence from={sceneStartFrame}>` and a child EventActor. Convert intended seconds to
integer frames at that project's fps (for example, a 0.5-second entrance is 15 frames at 30fps and
30 frames at 60fps). Store `cueId` from verified speech alignment; use explicitly provisional timing only during planning. Validate
ordinary movement duration against motion-production-patterns.md; a custom motionType string does
not bypass those rules. On prop changes, replace the event object/values normally and let the declared
dependencies rebuild. The SVG path has a separate property owner from the GSAP wrapper.

## Validation and production use

Type-check copied code and actually render it. Compare forward, backward and repeated seeks,
different offsets, fps and meaningful parameter fixtures. Inspect the event boundary, a moving
frame, its result and a late observation frame. Ensure an event has finished before an ending hold;
all frame-driven children must also settle/freeze on the declared display frame.

Test longer explanations with multiple short events, a genuine continuous process, a single-fact
hold and fixed complete image evidence. Inspect contiguous motion as well as stills; reject timing
stretching, property conflicts, resets across sentences, stale actors and decorative filler. Record
technical evidence separately from visual judgments, including playback limits. Treat the
current production pilot as a case study; only promote a reusable mechanism after two distinct fixtures.

For a new direction, follow production-and-qc.md: prefer a representative approximately 30-second
low-resolution passage using the approved narration and subtitle timing, with user-specified ranges
taking priority. Visual experiments do not regenerate speech; mute unrelated source-media sound.
