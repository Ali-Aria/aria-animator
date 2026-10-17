export const vertexShader=`
  attribute float phase;
  attribute float lane;
  uniform float uTime;
  uniform float uHeight;
  varying float vAlpha;
  void main(){
    float progress=fract(phase+max(0.,uTime)*.28);
    vec3 point=vec3(mix(-3.1,3.1,progress),.65+.12*sin(progress*6.283),lane*.16);
    vec4 mv=modelViewMatrix*vec4(point,1.);
    gl_Position=projectionMatrix*mv;
    gl_PointSize=7.*(uHeight/720.)*(9./-mv.z);
    vAlpha=smoothstep(0.,.08,progress)*(1.-smoothstep(.9,1.,progress));
  }
`;
export const fragmentShader=`
  uniform float uOpacity;
  uniform vec3 uColor;
  varying float vAlpha;
  void main(){
    float mask=1.-smoothstep(.2,.5,length(gl_PointCoord-.5));
    gl_FragColor=vec4(uColor,mask*vAlpha*uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
