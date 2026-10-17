import THREE from './three-runtime.js';
import {createSceneDirector} from './scene-director.ts';
import type {CameraKey, Vec3} from './scene-director.ts';
import {createTrack, ramp} from './motion-runtime.ts';
export type OrganizedParameters = {variant: 'linear' | 'corner'; count: number};
export type OrganizedWorld = {setTime: (seconds: number) => void; dispose: () => void};

// A whole continuous passage, with three chapter stations and one persistent bundle.
// Fixture times are illustrative. Production uses the measured approved narration.
export function createOrganizedWorld(canvas: HTMLCanvasElement, width: number, height: number,
  {variant, count}: OrganizedParameters): OrganizedWorld {
  if (!Number.isInteger(count) || count < 3 || count > 12) throw new Error('Invalid fixture count');
  const origins: Vec3[] = variant === 'linear' ? [[-5, 0, 0], [0, 0, 0], [5, 0, 0]]
    : [[-4, 0, 1], [0, 0, 0], [3, 0, -3]];
  const keys: CameraKey[] = [];
  const key = (time: number, origin: Vec3, distance = 10, stop = false) => {
    keys.push({time, target: [origin[0], .8, origin[2]],
      position: [origin[0] + distance * .25, 5, origin[2] + distance], stop});
  };
  key(0, origins[0]); key(3.6, origins[0]);
  key(4, [(origins[0][0] + origins[1][0]) / 2, 0, (origins[0][2] + origins[1][2]) / 2]);
  key(4.4, origins[1]); key(7.6, origins[1]);
  key(8, [(origins[1][0] + origins[2][0]) / 2, 0, (origins[1][2] + origins[2][2]) / 2]);
  key(8.4, origins[2]); key(10, origins[2]);
  key(10.8, [0, 0, 0], variant === 'linear' ? 17 : 15); key(12, [0, 0, 0], variant === 'linear' ? 17 : 15);
  const director = createSceneDirector({stations: origins.map((origin, i) => ({id: `station-${i}`, origin})),
    chapters: [{id: 'gather', station: 'station-0', start: 0, end: 4},
      {id: 'process', station: 'station-1', start: 4, end: 8}, {id: 'retain', station: 'station-2', start: 8, end: 12}],
    cameraKeys: keys, journeys: [{id: 'gather-process', from: 'gather', to: 'process', depart: 3.6, arrive: 4.4, bridgeActor: 'bundle'},
      {id: 'process-retain', from: 'process', to: 'retain', depart: 7.6, arrive: 8.4, bridgeActor: 'bundle'}]});
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
  const resources = new Set<any>();
  const keep = <T,>(r: T): T => {resources.add(r); return r;};
  let disposed = false;
  function dispose() {if (disposed) return; disposed = true; for (const r of resources) r.dispose(); renderer.dispose();}
  try {
    renderer.setSize(width, height, false); renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#F0F0EE');
    const camera = new THREE.PerspectiveCamera(36, width / height, .1, 80);
    scene.add(new THREE.HemisphereLight('#FFFFFF', '#8F8E86', 2.5));
    const light = new THREE.DirectionalLight('#FFFFFF', 3.5); light.position.set(-3, 8, 5); scene.add(light);
    const mat = (color: string, roughness = .5) => keep(new THREE.MeshStandardMaterial({color, roughness, metalness: .15}));
    const paper = mat('#DBDAD3'), ink = mat('#22211F'), orange = mat('#F5572F');
    const floor = new THREE.Mesh(keep(new THREE.PlaneGeometry(70, 70)), mat('#F0F0EE', 1));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.15; scene.add(floor);
    const add = (parent: any, geometry: any, material: any, point: Vec3) => {
      const mesh = new THREE.Mesh(keep(geometry), material); mesh.position.set(...point); parent.add(mesh); return mesh;
    };
    // Stations coexist. Their spacing comes from the narrative layout, not one screen per paragraph.
    const stations = origins.map(origin => {const group = new THREE.Group(); group.position.set(...origin); scene.add(group); return group;});
    stations.forEach((s, i) => {
      add(s, new THREE.CylinderGeometry(1.55, 1.65, .22, 48), ink, [0, -.03, 0]);
      if (i === 0) {
        for (let k = 0; k < 3; k++) add(s, new THREE.BoxGeometry(.65, .12, .9), paper, [-.9 + k * .9, .22, .95]);
      }
      if (i === 1) {
        const hoop = add(s, new THREE.TorusGeometry(1.2, .07, 12, 64), ink, [0, 1, -.7]);
        hoop.rotation.y = .1;
      }
      if (i === 2) add(s, new THREE.BoxGeometry(1.5, .25, .18), paper, [0, .2, -.9]);
    });
    // Contextual connecting geometry is visible during travel and remains in the same world.
    for (let j = 0; j < 2; j++) {
      const a = origins[j], b = origins[j + 1];
      for (let i = 0; i < 8; i++) {
        const u = (i + 1) / 9;
        const dash = add(scene, new THREE.BoxGeometry(.22, .02, .055), paper,
          [a[0] + (b[0] - a[0]) * u, -.02, a[2] + (b[2] - a[2]) * u + .85]);
        dash.rotation.y = -Math.atan2(b[2] - a[2], b[0] - a[0]);
      }
    }
    const bundle = new THREE.Group(); scene.add(bundle);
    const hero = add(bundle, new THREE.BoxGeometry(1.15, .18, 1.35), orange, [0, 0, 0]);
    const pages = Array.from({length: count}, () => add(bundle, new THREE.BoxGeometry(1.03, .045, 1.2), paper, [0, 0, 0]));
    const bundleKeys = [
      {time: 0, value: [origins[0][0], .45, origins[0][2]]},
      {time: 3.6, value: [origins[0][0], .45, origins[0][2]]},
      {time: 4, value: [(origins[0][0] + origins[1][0]) / 2, .85, (origins[0][2] + origins[1][2]) / 2]},
      {time: 4.4, value: [origins[1][0], .45, origins[1][2]]},
      {time: 7.6, value: [origins[1][0], .45, origins[1][2]]},
      {time: 8, value: [(origins[1][0] + origins[2][0]) / 2, .85, (origins[1][2] + origins[2][2]) / 2]},
      {time: 8.4, value: [origins[2][0], .45, origins[2][2]]},
      {time: 12, value: [origins[2][0], .45, origins[2][2]]},
    ];
    const bundleTrack = createTrack(bundleKeys);
    function setTime(seconds: number) {
      if (disposed) throw new Error('Cannot render a disposed passage');
      const state = director.sample(seconds), pose = bundleTrack.sample(seconds);
      camera.position.set(...state.camera.position); camera.lookAt(...state.camera.target);
      bundle.position.set(...pose.position);
      const compressed = ramp(seconds, 5.3, 5.9), retained = ramp(seconds, 8.7, 9.2);
      hero.scale.set(1 + .08 * retained, 1, 1 + .08 * retained);
      for (let i = 0; i < pages.length; i++) {
        const gather = ramp(seconds, .55 + i * .11, 1.05 + i * .11);
        pages[i].visible = gather > 0;
        pages[i].position.set((1 - gather) * ((i % 3) - 1) * 1.05,
          .15 + i * (.1 - compressed * .045) + (1 - gather) * .8, (1 - gather) * ((i % 2) * 2 - 1) * .7);
        pages[i].rotation.y = (1 - gather) * ((i % 3) - 1) * .2;
      }
      renderer.render(scene, camera);
      // Fixture-only observations: read identities and transforms; never drive animation with these counters.
      Object.assign(canvas.dataset, {chapter: state.chapter.id, journey: state.journey?.id ?? '',
        heroId: String(hero.id), cameraId: String(camera.id), sceneId: String(scene.id),
        heroWorld: JSON.stringify(pose.position), cameraWorld: JSON.stringify(state.camera.position)});
    }
    renderer.compile(scene, camera);
    return {setTime, dispose};
  } catch (error) {dispose(); throw error;}
}
