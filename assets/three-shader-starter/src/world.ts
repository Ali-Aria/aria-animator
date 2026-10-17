import THREE from './three-runtime.js';
import {vertexShader,fragmentShader} from './shaders';
export type SceneParameters={variant:'transfer'|'assembly';count:number};
export type World={setTime:(seconds:number)=>void;dispose:()=>void};
const smooth=(start:number,end:number,time:number)=>{
  const t=Math.max(0,Math.min(1,(time-start)/(end-start)));
  return t*t*t*(t*(t*6-15)+10);
};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;

export function createWorld(canvas:HTMLCanvasElement,width:number,height:number,parameters:SceneParameters):World{
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.debug.onShaderError=(gl:WebGL2RenderingContext,program:WebGLProgram,vertex:WebGLShader,fragment:WebGLShader)=>{
    throw new Error(['Shader compilation failed',gl.getProgramInfoLog(program),gl.getShaderInfoLog(vertex),gl.getShaderInfoLog(fragment)].filter(Boolean).join('\n'));
  };
  renderer.setSize(width,height,false);renderer.setPixelRatio(1);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#F0F0EE');
  const camera=new THREE.PerspectiveCamera(36,width/height,.1,80);
  camera.position.set(6,6,9);camera.lookAt(0,.3,0);
  scene.add(new THREE.HemisphereLight('#FFFFFF','#8F8E86',2.4));
  const light=new THREE.DirectionalLight('#FFFFFF',3.5);light.position.set(-3,7,4);scene.add(light);
  const resources=new Set<any>();
  const keep=<T,>(resource:T):T=>{resources.add(resource);return resource;};
  const gray=keep(new THREE.MeshStandardMaterial({color:'#8F8E86',roughness:.42,metalness:.2}));
  const black=keep(new THREE.MeshStandardMaterial({color:'#22211F',roughness:.32,metalness:.4}));
  const orange=keep(new THREE.MeshStandardMaterial({color:'#F5572F',roughness:.35,metalness:.2}));
  const floorMaterial=keep(new THREE.MeshStandardMaterial({color:'#F0F0EE',roughness:1}));
  const floor=new THREE.Mesh(keep(new THREE.PlaneGeometry(80,80)),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.y=-.22;scene.add(floor);
  const core=new THREE.Mesh(keep(new THREE.BoxGeometry(1.1,.22,1.1)),black);core.position.y=.18;scene.add(core);
  const result=new THREE.Mesh(keep(new THREE.IcosahedronGeometry(.5,1)),orange);result.position.set(2.6,.4,0);scene.add(result);
  const tileGeometry=keep(new THREE.BoxGeometry(.23,.12,.23));
  const tiles=Array.from({length:parameters.count},()=>{const m=new THREE.Mesh(tileGeometry,gray);scene.add(m);return m;});
  const n=96,phases=new Float32Array(n),lanes=new Float32Array(n);
  for(let i=0;i<n;i++){phases[i]=((i*37)%n)/n;lanes[i]=(i%3)-1;}
  const geometry=keep(new THREE.BufferGeometry());
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));
  geometry.setAttribute('phase',new THREE.BufferAttribute(phases,1));
  geometry.setAttribute('lane',new THREE.BufferAttribute(lanes,1));
  const material=keep(new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uOpacity:{value:0},uColor:{value:new THREE.Color('#22211F')},uHeight:{value:height}},vertexShader,fragmentShader}));
  const particles=new THREE.Points(geometry,material);particles.frustumCulled=false;scene.add(particles);
  let disposed=false;
  function dispose(){if(disposed)return;disposed=true;for(const r of resources)r.dispose();renderer.dispose();}
  function setTime(seconds:number){
    if(disposed)throw new Error('Cannot render a disposed world');
    const t=Math.max(0,seconds);
    for(let i=0;i<tiles.length;i++){
      const phase=smooth(.6+i*.075,1.15+i*.075,t);
      const angle=i/tiles.length*Math.PI*2;
      const startX=parameters.variant==='assembly'?Math.cos(angle)*2.9:-3.0+(i%4)*.24;
      const startZ=parameters.variant==='assembly'?Math.sin(angle)*2.0:(Math.floor(i/4)-1)*.32;
      const endX=parameters.variant==='assembly'?Math.cos(angle)*.9:1.2+(i%4)*.29;
      const endZ=parameters.variant==='assembly'?Math.sin(angle)*.9:(Math.floor(i/4)-1)*.32;
      tiles[i].position.set(mix(startX,endX,phase),.12+.35*Math.sin(phase*Math.PI),mix(startZ,endZ,phase));
      tiles[i].rotation.y=parameters.variant==='assembly'?angle*phase:0;
    }
    core.rotation.y=smooth(2.0,2.55,t)*Math.PI/2;
    const outputProgress=smooth(4.2,4.75,t);result.visible=t>=4.2;result.scale.setScalar(outputProgress);
    material.uniforms.uTime.value=Math.min(t,5.5);
    material.uniforms.uOpacity.value=smooth(2.7,3.1,t)*(1-smooth(5.0,5.5,t));
    renderer.render(scene,camera);
  }
  try{renderer.compile(scene,camera);}catch(error){dispose();throw error;}
  return {setTime,dispose};
}
