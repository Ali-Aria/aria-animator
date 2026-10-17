import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

// Execute the actual pure helper, resolving its extensionless bundler import for Node.
const runtime=new URL('../src/motion/runtime.ts',import.meta.url).href;
const source=fs.readFileSync(new URL('../src/motion/evidence.ts',import.meta.url),'utf8').replace("from './runtime'",`from '${runtime}'`);
const moduleUrl='data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64');
const {evidencePose}=await import(moduleUrl);

test('complete plate is stationary throughout reading in landscape and portrait cases',()=>{
  for(const [width,window]of [[1920,{start:1,end:3}],[1080,{start:4,end:9,timingSeconds:{entry:.55,exit:.4}}]]){
    for(let frame=Math.ceil(window.start*60);frame<window.end*60;frame++){
      const pose=evidencePose(frame/60,width,60,window);
      assert.equal(pose.phase,'read');assert.equal(pose.x,0);assert.equal(pose.visible,true);
    }
  }
});
test('entry starts outside the viewport, overshoots and lands; exit leaves to the left',()=>{
  const window={start:1,end:3,motionProfile:'process'};
  assert.equal(evidencePose(.59,1920,30,window).visible,false);
  assert.equal(evidencePose(.6,1920,30,window).x,1920);
  assert.ok(evidencePose(.9,1920,30,window).x<0);
  assert.equal(evidencePose(1,1920,30,window).x,0);
  assert.ok(evidencePose(3.15,1920,30,window).x<0);
  assert.equal(evidencePose(3.3,1920,30,window).visible,false);
});
test('reverse/repeated seeks and 30/60 fps preserve the same second state',()=>{
  for(const window of [{start:1,end:3},{start:4,end:9,timingSeconds:{entry:.55,exit:.4}}]){
    for(const time of [.7,.9,1,3.15,.9,3.15,4.2,9.2,4.2]){
      const a=evidencePose(time,1920,30,window),b=evidencePose(time,1920,60,window);
      assert.deepEqual(a,b);assert.deepEqual(a,evidencePose(time,1920,30,window));
    }
  }
});
test('static opt-out and invalid reading windows are handled explicitly',()=>{
  assert.equal(evidencePose(.9,1920,30,{start:1,end:3,enabled:false}).visible,false);
  assert.equal(evidencePose(1.2,1920,30,{start:1,end:3,enabled:false}).x,0);
  assert.equal(evidencePose(3,1920,30,{start:1,end:3,enabled:false}).visible,false);
  for(const window of [{start:2,end:1},{start:-1,end:1},{start:0,end:Infinity}])assert.throws(()=>evidencePose(1,1920,30,window));
  assert.throws(()=>evidencePose(1,0,30,{start:1,end:3}));
});
