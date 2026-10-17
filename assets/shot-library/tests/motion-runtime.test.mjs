import test from 'node:test';
import assert from 'node:assert/strict';
import {motionClock, hasMotionOptions, sampleProgress, spatialRanks, receiverResponse, maskPose, radiusMorph, strokeReveal, transitionPose, profiles} from '../src/motion/runtime.ts';

test('profiles keep approved timing and displacement defaults', () => {
  assert.deepEqual(profiles.process,{entry:.4,exit:.3,stagger:.05,amplitude:1});
  assert.equal(motionClock(0,30,{motionProfile:'quiet'}).profile.amplitude,.6);
  assert.equal(motionClock(0,60,{motionProfile:'impact'}).stagger,.035);
  assert.equal(hasMotionOptions({}),false);
  assert.equal(hasMotionOptions({entryFrames:0}),true);
});

test('same seconds produce the same states at 30 and 60 fps, including reverse and repeat seeks', () => {
  for(const options of [{motionProfile:'process'}, {motionProfile:'impact',timingSeconds:{entry:.3,stagger:.08,phases:{travel:{start:.5,duration:.8}}}}]) {
    const times=[0,.2,.5,.8,1.1,2,1.1,.5,.5,0];
    for(const time of times) {
      const a=motionClock(time*30,30,options), b=motionClock(time*60,60,options);
      const pa=a.progress('travel',{start:.2,duration:.8}), pb=b.progress('travel',{start:.2,duration:.8});
      assert.equal(pa,pb); assert.deepEqual(maskPose(pa,a.profile.amplitude),maskPose(pb,b.profile.amplitude));
      assert.equal(radiusMorph(160,pa),radiusMorph(160,pb));
      assert.equal(strokeReveal(817,pa),strokeReveal(817,pb));
    }
  }
});

test('explicit frame windows and old frame fields override second windows', () => {
  const c=motionClock(30,30,{entryFrames:6,exitFrames:0,staggerFrames:3,timingFrames:{entry:9,phases:{travel:{start:15,duration:15}}},timingSeconds:{entry:2,exit:2,stagger:2,phases:{travel:{start:10,duration:5}}}});
  assert.equal(c.entry,.2); assert.equal(c.exit,0); assert.equal(c.stagger,.1);
  assert.deepEqual(c.window('travel',{start:0,duration:1}),{start:.5,duration:.5});
  assert.equal(c.progress('travel',{start:0,duration:1}),1);
});

test('extending observation does not stretch action progress and exit is independent', () => {
  const a=motionClock(30,30,{timingSeconds:{hold:.2}}), b=motionClock(30,30,{timingSeconds:{hold:4}});
  assert.equal(a.progress('count',{start:.1,duration:a.action}),b.progress('count',{start:.1,duration:b.action}));
  assert.equal(a.visibility(5),1);
  const early=motionClock(45,30,{timingSeconds:{phases:{exit:{start:1,duration:.2}}}});
  assert.equal(early.visibility(5),0);
});

test('bars start empty, finish once and never reset during a long hold', () => {
  for(const value of [.28,.9]) {
    const states=[0,.1,.4,.8,1,3,5].map(t=>value*sampleProgress(t,.14,.4));
    assert.equal(states[0],0); assert.equal(states.at(-1),value);
    states.slice(1).forEach((v,i)=>assert.ok(v>=states[i]));
  }
});

test('spatial stagger handles empty, single, center, edges, distance and explicit path', () => {
  assert.deepEqual(spatialRanks([],'center'),[]);
  assert.deepEqual(spatialRanks([{x:0,y:0}],'center'),[0]);
  const points=[{x:-1,y:0},{x:0,y:0},{x:1,y:0}];
  assert.deepEqual(spatialRanks(points,'center'),[1,0,2]);
  assert.deepEqual(spatialRanks(points,'edges'),[0,2,1]);
  assert.deepEqual(spatialRanks(points,'distance',{x:1,y:0}),[2,1,0]);
  assert.deepEqual(spatialRanks(points,'path',undefined,[2,0,1]),[1,2,0]);
  assert.throws(()=>spatialRanks(points,'path',undefined,[0,0,2]));
});

test('receiver feedback is causal, bounded and settles to exactly zero', () => {
  assert.equal(receiverResponse(.8,1),0); assert.equal(receiverResponse(1.4,1),0);
  assert.ok(Math.abs(receiverResponse(1.1,1))<=.05);
  assert.equal(receiverResponse(1.35,1),0);
});

test('wipe swaps under complete cover, slides stay adjacent, zoom holds clean endpoints', () => {
  const mid=transitionPose(.5,'wipe'); assert.equal(mid.covered,1); assert.equal(mid.incoming,true);
  for(const p of [0,.2,.5,.8,1]) {
    const pose=transitionPose(p,'slide'); assert.ok(Math.abs(pose.incomingX-pose.outgoingX-100)<1e-9);
  }
  assert.equal(transitionPose(0,'zoom').incomingOpacity,0);
  assert.equal(transitionPose(1,'zoom').outgoingOpacity,0);
  assert.equal(transitionPose(1,'zoom').incomingScale,1);
});

test('invalid timing fails explicitly and zero-duration events remain seek-safe', () => {
  assert.throws(()=>motionClock(0,0));
  assert.throws(()=>motionClock(0,30,{timingSeconds:{action:-1}}));
  assert.throws(()=>motionClock(0,30,{timingSeconds:{phases:{bad:{start:0,duration:NaN}}}}));
  assert.equal(sampleProgress(.9,1,0),0); assert.equal(sampleProgress(1,1,0),1);
  assert.equal(motionClock(0,30,{timingSeconds:{entry:0}}).progress('entry',{start:0,duration:0}),1);
});
