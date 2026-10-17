const fs = require('node:fs');
const path = require('node:path');
const {openBrowser, getCompositions, renderStill} = require('@remotion/renderer');
const root = path.resolve(__dirname, '..');
const names = ['KineticStatement','DataCounter','WideElasticKeyPoint','UiAeCardSwarmTimeline','UiAeProductGridWorld','AeSaasKineticType','WhipPanTransition','WideChapterTransition'];
const variants = {
  KineticStatement: {words: ['同一个主体', '跨过多个过程', '身份始终可见'], motionProfile:'impact'},
  DataCounter: {value:42, values:[0,.25,.5,1], label:'已保留',motionProfile:'quiet',timingSeconds:{hold:4}},
  WideElasticKeyPoint: {eyebrow:'',title:'同一个主体如何穿过多个过程并保留可以识别的身份与结果',detail:'结果完成后继续参与下一步。',motionProfile:'quiet'},
  UiAeCardSwarmTimeline: {brand:'项目',title:'资料进入时间线',cardLabels:['唯一主体'],motionProfile:'impact',timingSeconds:{hold:.2}},
  UiAeProductGridWorld: {brand:'归档',statement:'有依据地保留输入',actions:['收集','检验','保留'],motionProfile:'quiet'},
  AeSaasKineticType: {phrases:['最后一个结果保持可读'],kicker:'',motionProfile:'impact',timingSeconds:{hold:4}},
  WhipPanTransition: {fromTitle:'输入已确认',toTitle:'准备执行下一步',accent:'#c9f36a',motionProfile:'quiet',timingSeconds:{phases:{transition:{start:.2,duration:.6}}}},
  WideChapterTransition: {fromTitle:'条件成立',toTitle:'结果进入下一环节',chapter:'',motionProfile:'impact',timingSeconds:{phases:{transition:{start:.2,duration:.5}}}},
};
async function main() {
  const req=JSON.parse(fs.readFileSync(0,'utf8'));
  const out=path.join(root,'qc/parameter-tests'); fs.mkdirSync(out,{recursive:true});
  const browser=await openBrowser('chrome',{browserExecutable:req.browser,chromiumOptions:{gl:'angle'},logLevel:'error'});
  const common={serveUrl:req.serveUrl,puppeteerInstance:browser,browserExecutable:req.browser,logLevel:'error',chromiumOptions:{gl:'angle'},timeoutInMilliseconds:120000};
  const base=await getCompositions({...common,inputProps:{}});
  const rows=[];
  try {
    for(const name of names) {
      const original=base.find(c=>c.id===name);
      for(const [variant,props] of [['a',original.props],['b',{...original.props,...variants[name]}]]) {
        const seconds=original.durationInFrames/original.fps;
        // Deliberately seek backward and repeat a moving frame.
        const times=[Math.min(1.5,seconds-.1),.2,.6,seconds-.2,.6];
        for(const fps of [30,60]) {
          const composition={...original,fps,durationInFrames:Math.round(seconds*fps),props};
          for(let index=0;index<times.length;index++) {
            const time=times[index], frame=Math.round(time*fps);
            const output=path.join(out,`${name}-${variant}-${fps}-${index}.png`);
            await renderStill({...common,composition,inputProps:props,output,frame,scale:.5,imageFormat:'png',overwrite:true});
            rows.push({name,variant,fps,index,time,frame,path:path.relative(root,output),props});
          }
        }
      }
      console.log(`${name}: two contents, 30/60 fps, reverse/repeated seeks rendered`);
    }
  } finally {await browser.close({silent:true});}
  fs.writeFileSync(path.join(root,'qc/parameter-tests.json'),JSON.stringify(rows,null,2));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
