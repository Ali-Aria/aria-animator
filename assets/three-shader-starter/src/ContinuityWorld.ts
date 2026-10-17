import THREE from './three-runtime.js';
import {createTrack, cubicPath, sampleAction, ramp} from './motion-runtime';
export type ContinuityParameters = {variant: 'transfer' | 'assembly'; count: number};
export type ContinuityWorld = {setTime: (seconds: number) => void; dispose: () => void};

// Silent technical fixtures, not production layouts or narration timings.
export function createContinuityWorld(canvas: HTMLCanvasElement, width: number, height: number,
  {variant, count}: ContinuityParameters): ContinuityWorld {
  if (!Number.isInteger(count) || count < 2 || count > 16) throw new Error('Fixture count must be 2..16');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
  const resources = new Set<any>();
  const keep = <T,>(r: T): T => {resources.add(r); return r;};
  let disposed = false;
  function dispose() {if (disposed) return; disposed = true; for (const r of resources) r.dispose(); renderer.dispose();}
  try {
    renderer.setSize(width, height, false); renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.debug.onShaderError = (gl: WebGL2RenderingContext, program: WebGLProgram,
      vertex: WebGLShader, fragment: WebGLShader) => {
      throw new Error([gl.getProgramInfoLog(program), gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment)].join('\n'));
    };
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#F0F0EE');
    const camera = new THREE.PerspectiveCamera(36, width / height, .1, 60);
    scene.add(new THREE.HemisphereLight('#FFFFFF', '#8F8E86', 2.5));
    const light = new THREE.DirectionalLight('#FFFFFF', 3.5); light.position.set(-3, 7, 4); scene.add(light);
    const material = (color: string, roughness = .42) => keep(new THREE.MeshStandardMaterial({color, roughness, metalness: .2}));
    const orange = material('#F5572F'), black = material('#22211F'), gray = material('#8F8E86');
    const floor = new THREE.Mesh(keep(new THREE.PlaneGeometry(70, 70)), material('#F0F0EE', 1));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.08; scene.add(floor);
    const mesh = (geometry: any, mat: any, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(keep(geometry), mat); m.position.set(x, y, z); scene.add(m); return m;
    };
    const platform = mesh(new THREE.CylinderGeometry(1.35, 1.4, .18, 64), black,
      variant === 'transfer' ? 2.5 : 0, .02, 0);
    const center = mesh(new THREE.IcosahedronGeometry(.45, 1), orange,
      variant === 'transfer' ? 2.5 : 0, .65, 0);
    const gate = mesh(new THREE.TorusGeometry(.75, .055, 12, 64), black, -.5, .82, 0);
    gate.rotation.y = Math.PI / 2; gate.visible = variant === 'transfer';
    const trails = new THREE.Group(); scene.add(trails); trails.visible = variant === 'transfer';
    if (variant === 'transfer') {
      for (let i = 0; i < 12; i++) {
        const dash = new THREE.Mesh(keep(new THREE.BoxGeometry(.2, .02, .035)), gray);
        dash.position.set(-3.6 + i * .48, .03, .75); trails.add(dash);
      }
    }
    const actors = Array.from({length: count}, (_, i) => mesh(
      variant === 'transfer' ? new THREE.BoxGeometry(.24, .22, .24) : new THREE.IcosahedronGeometry(.24, 0),
      i === 0 ? orange : gray, 0, 0, 0));
    const cameraTrack = variant === 'transfer' ? createTrack([
      {time: 0, value: [-1.4, .55, 12]}, {time: .4, value: [-1.4, .55, 12]},
      {time: .95, value: [-.3, .55, 12]}, {time: 1.5, value: [.8, .55, 12]},
      {time: 2, value: [1.6, .55, 12], stop: true},
      {time: 3.2, value: [1.6, .55, 12]}, {time: 4, value: [2.5, .65, 9]},
    ]) : createTrack([
      {time: 0, value: [0, .45, 12]}, {time: 2.8, value: [0, .45, 12]},
      {time: 3.6, value: [0, .65, 8.5]},
    ]);
    const flights = actors.map((_, i) => {
      const onset = .5 + i * .11, z = ((i % 3) - 1) * .27;
      return createTrack([{time: onset, value: [-3.8, .5, z]},
        {time: onset + .4, value: [-.5, 1.12, z]},
        {time: onset + .8, value: [2.5 + (i % 3 - 1) * .3, .35 + Math.floor(i / 3) * .24, z]}]);
    });
    const paths = actors.map((_, i) => {
      const angle = i / count * Math.PI * 2;
      const end = [Math.cos(angle) * .8, .55, Math.sin(angle) * .8];
      return [[Math.cos(angle) * 2.8, .3, Math.sin(angle) * 2.8],
        [Math.cos(angle) * 2.4, 1.45, Math.sin(angle) * 2.4],
        [Math.cos(angle) * 1.2, 1.25, Math.sin(angle) * 1.2], end];
    });
    function setTime(time: number) {
      if (disposed) throw new Error('Cannot render a disposed world');
      const [x, y, distance] = cameraTrack.sample(time).position;
      camera.position.set(x + distance * .22, y + distance * .42, distance * .85);
      camera.lookAt(x, y, 0);
      let recoil = 0;
      for (let i = 0; i < actors.length; i++) {
        const action = sampleAction(time, {start: .5, duration: variant === 'transfer' ? .8 : .55,
          anticipation: .16, settle: .4, index: i, stagger: .11, strength: .055});
        const p = variant === 'transfer' ? flights[i].sample(time).position : cubicPath(paths[i], action.progress).position;
        // One writer composes the primary pose, anticipation and finite impact response.
        actors[i].position.set(p[0] + action.anticipationOffset, p[1] - action.recoil, p[2]);
        actors[i].scale.set(1 + action.recoil, 1 - action.recoil, 1 + action.recoil);
        actors[i].rotation.set(0, variant === 'assembly' ? i / count * Math.PI * 2 * action.progress : 0, 0);
        recoil += action.recoil;
      }
      gate.scale.set(1, 1 + .17 * ramp(time, .55, .8), 1 + .17 * ramp(time, .55, .8));
      platform.position.y = .02 - recoil * .4;
      const finalArrival = .5 + (count - 1) * .11 + (variant === 'transfer' ? .8 : .55);
      const reveal = ramp(time, finalArrival - .1, finalArrival + .35);
      center.scale.setScalar(reveal); center.rotation.y = reveal * Math.PI / 3;
      renderer.render(scene, camera);
    }
    renderer.compile(scene, camera);
    return {setTime, dispose};
  } catch (error) {dispose(); throw error;}
}
