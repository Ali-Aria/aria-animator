# Remotion + Three.js + Shader

## Responsibility and clock

Remotion owns composition dimensions, fps, measured speech scheduling, subtitles, narration and export.
Three.js owns the authored spatial world, meshes, materials, lights and camera. Shader code owns a
specific special effect, such as particle transfer or a procedural mask. Standard Three.js materials
remain the first choice for ordinary surfaces. A Shader is not required just to call a shot advanced.

Calculate `displayFrame` once, including any approved final hold, then derive `time = displayFrame / fps`.
Use that time for every moving object, camera, particle, uniform and time-dependent subtitle. Within
a Sequence, its Remotion frame is already local; subtract a global offset only once when required.
Store semantic event starts on the choreography plan and retain the existing action-duration rules.

No requestAnimationFrame, renderer.setAnimationLoop, elapsed Clock, GSAP ticker, useFrame accumulation,
or `position += velocity` loop belongs in final rendering. Use direct functions of time, stable seeded
attributes or baked simulations. Forward, backward and out-of-order seeks must reach the same state.
Temporal motion blur, trails and simulation require an explicit subframe sampling or cache strategy;
do not assume a realtime effect is seek-safe.

## Select an integration

### Official adapter when installed

Check the local manifest, lockfile, installed peers and adapter types. If compatible `three`,
`@react-three/fiber` and `@remotion/three` are present, use the official `<ThreeCanvas>` route. Supply
composition width and height, derive poses from useCurrentFrame, and use `layout="none"` for a Sequence
inside a Three canvas. Use frame-derived uniforms rather than a live R3F animation loop.

Check [the official integration](https://www.remotion.dev/docs/three) before unfamiliar APIs. The
adapter version must match the project's Remotion version. WebGPU is an explicit compatibility and
effect decision; do not migrate engines to obtain quality without checking the render environment.

### Direct canvas with pinned local modules

When the adapter packages are absent, copy `assets/three-shader-starter/src`, `tsconfig.json` and
`remotion.config.ts` into an initialized independent Remotion project. The starter
includes Three.js r180 (`0.180.0`) and its MIT license in src/vendor. Do not npm-install into a shared
junction project. Local vendored modules are project source, not a new dependency tree.

From that scaffolded project, verify the fixture with:

```powershell
npx --no-install tsc --noEmit
npx --no-install remotion compositions src/index.ts
npx --no-install remotion render src/index.ts Transfer30 out/transfer-preview.mp4 --scale=0.5 --codec=h264 --crf=26 --concurrency=2
```

The fixture root registers Transfer30 and Assembly60, not Main. For production, register the actual
film composition and match its id to the project's render scripts; set its duration from the measured
approved audio rather than retaining the eight-second fixture timing.

The separate `src/continuity-index.tsx` entry registers ContinuousTransfer30 and CurvedAssembly60.
Read continuous-motion.md for its reusable runtime, tests and motion-specific validation evidence.
The original Shader fixtures retain their entry and validation scope.

For the shared-world chapter structure, read scene-organization.md and use `src/organization-index.tsx`.
It registers SharedWorldLinear30 and SharedWorldCorner60, with one persistent world through three
chapters and two spatial handoffs. Chapter changes must not be dependencies of renderer/Scene creation.

The starter's ThreeLayer builds a renderer in a layout effect, renders the latest frame synchronously
before continuing readiness, updates from frame time and disposes the world on unmount or dimension/
fixture changes. Its renderer interface is typed; the vendored third-party binding has an explicit
untyped boundary in three-runtime.d.ts. Do not claim full Three.js API type coverage for this route.
When compatible official type packages are available, use their types instead of that boundary.

In a project with async model/texture loads, keep the readiness gate pending until the necessary
assets and initial Shader compilation complete. Render the latest requested frame before releasing
it. Abort or ignore stale completions after unmount; clean up partially constructed GPU resources
on failure. Report loading/Shader errors via cancelRender. Do not release a gate merely after
starting a fetch or use a timer as proof that the scene is ready.

Use a real WebGL-backed render to verify the selected backend. The bundled config uses `angle`;
programmatic renderer calls also need `chromiumOptions: {gl: 'angle'}`. Local browser support alone
does not establish headless rendering support.

## Adapt the technical fixture to the film

The starter's Transfer30 and Assembly60 compositions are silent technical fixtures for clock,
dimensions, Shader and resource behavior. Their block layout, count, camera and action schedule are
not narrative defaults. Use the approved production narration/subtitles and replace the fixture
world. Mute unrelated source-media sound; do not inherit fixture soundtracks.

Design a meaningful hero still, the densest mechanism and the result before filling the timeline.
Choose models, surface roughness, reflection sources, light size/direction and camera perspective
to express the subject. Procedural studio reflections or licensed HDR assets are useful when a
material needs them. Add bevels and contact shadows where they improve silhouette and weight.
Avoid replacing every existing flat card with an extruded flat card.

Keep real screenshots complete and fixed in an evidence layer outside moving camera groups. Keep
subtitles in a readable DOM layer. Diagram topology, measured values and actual UI are preserved;
original 3D illustrations are recorded as illustrative geometry, not actual product internals.
Apply the existing active palette to authored colors; standard lights may use neutral illumination.

## Shader and simulation controls

Use uniforms for frame time, event progress, seed, palette roles, opacity and effect-specific
parameters. Build geometry and stable attributes once per relevant input change. Assign uniforms
and transforms directly on every sampled frame, including inactive and final states; no leftover
values from a previous seek. Compute legitimate continuous transport during its active window,
and remove or freeze it when its semantic job ends.

Apply motion-production-patterns.md for secondary motion. Combine primary poses and bounded offsets
under one transform owner; return offsets to zero outside their active intervals. Derive envelopes
and noise from displayFrame so seeks agree and declared holds freeze the complete state. Keep
screenshot layers outside these transforms.

Check the actual local Three.js source and
[ShaderMaterial documentation](https://threejs.org/docs/pages/ShaderMaterial.html) when changing
Shader integration. GLSL ShaderMaterial targets WebGLRenderer; a WebGPU/TSL graph is a separate
implementation. Match defines, attributes and uniforms to the compiled version. Handle tone
mapping and output color conversion explicitly when mixing custom Shaders with standard materials.
Inspect transparent depth writes, sorting and premultiplied alpha when an effect disappears or halos.

Check effect visibility at the requested preview resolution. Particles that look fine at 1080p
can vanish at 540p. Size, density and color contrast are content controls; do not amplify glow to
hide a weak silhouette. Seed initial data or bake genuinely stateful simulation to a reproducible
cache and record that cache's origin. Standard camera movement does not provide motion blur by itself.

## Verification and delivery

Keep the existing choreography and QC manifests. Add the integration route, Three.js version,
backend, logical/buffer/output dimensions, scale, concurrency and render duration. Separate export
time from scene preparation/iteration time; do not generalize a pilot's export speed to every film.

For a new bridge, Shader or reusable mechanism, verify two different fixtures with different
parameters and fps. In one persistent page, seek forward, backward and repeatedly; compare the
same target state's lossless pixels. Also check equal seconds under different fps values when the
scene is meant to have the same time curve. Check a frame where the special effect is active so
a blank canvas cannot pass determinism. Compile and render a short actual video, and inspect its
consecutive motion frames and ending.

Freeze the complete visual composition at one display frame after the last claim resolves. A
subtitle that disappears during a supposed hold violates pixel equality even if the 3D camera is
frozen. Compare decoded lossless stills during the hold, and report unavailable realtime playback
honestly. Preserve editable visual layers, final narration and measured timing; confirm the export contains
the approved narration.

Save validation evidence from the current machine in the project's `qc/` directory. Historical
machine-specific reports are excluded from the distribution. Fixture checks validate the render
bridge and demonstration mechanisms; they do not certify a new production's visual timing,
facts, assets or shot design.
