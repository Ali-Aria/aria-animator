import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const project=path.resolve(process.argv[2]??'.');
let parser;
try { parser=createRequire(path.join(project,'package.json'))('@babel/parser'); }
catch { console.error('Project @babel/parser is unavailable. Use the existing dependency store; this audit does not install packages.');process.exit(2); }

function discardedCalls(source,file='source.tsx') {
  const tree=parser.parse(source,{sourceType:'unambiguous',plugins:['typescript','jsx']});
  const names=new Set(['motionClock']),namespaces=new Set(),errors=[];
  for(const node of tree.program.body){
    if(node.type!=='ImportDeclaration')continue;
    for(const item of node.specifiers){
      if(item.type==='ImportSpecifier'&&item.imported.name==='motionClock')names.add(item.local.name);
      if(item.type==='ImportNamespaceSpecifier')namespaces.add(item.local.name);
    }
  }
  function visit(node,ancestors=[]){
    if(!node||typeof node!=='object')return;
    if(node.type==='CallExpression'||node.type==='OptionalCallExpression'){
      const expr=node.callee;
      const clock=expr.type==='Identifier'&&names.has(expr.name)
        || expr.type==='MemberExpression'&&expr.property.name==='motionClock'
          &&expr.object.type==='Identifier'&&namespaces.has(expr.object.name);
      if(clock){
        let i=ancestors.length-1,parent=ancestors[i];
        while(parent&&(parent.type==='ParenthesizedExpression'||parent.type==='TSAsExpression'
          ||parent.type==='UnaryExpression'&&parent.operator==='void'))parent=ancestors[--i];
        if(parent?.type==='ExpressionStatement')errors.push({file,line:node.loc.start.line,message:'motionClock return value is discarded; connect its parameters to actor controllers.'});
      }
    }
    for(const [key,value]of Object.entries(node)){
      if(['loc','start','end','extra','comments','tokens'].includes(key))continue;
      if(Array.isArray(value)){
        for(const child of value)if(child?.type)visit(child,[...ancestors,node]);
      }else if(value?.type)visit(value,[...ancestors,node]);
    }
  }
  visit(tree);return errors;
}

if(process.argv.includes('--self-test')){
  const cases=[
    ["import {motionClock} from './runtime'; motionClock(frame,fps,{motionProfile:'process'});",1],
    ["import {motionClock as clock} from './runtime'; void clock(frame,fps);",1],
    ["import * as M from './runtime'; (M.motionClock(frame,fps));",1],
    ["import {motionClock} from './runtime'; const c=motionClock(frame,fps); const pose=c.entry;",0],
    ["import {motionClock} from './runtime'; const get=()=>motionClock(frame,fps);",0]
  ];
  for(const [input,expected]of cases)if(discardedCalls(input).length!==expected)throw Error('Motion audit regression failed');
  console.log('Motion audit regression: direct, aliased and namespace discard rejected; consumed/returned calls accepted.');
}

const planFile=path.join(project,'src/data/choreography-plan.json');
const errors=[],warnings=[];
let plan;
try{plan=JSON.parse(fs.readFileSync(planFile,'utf8'));}catch{errors.push({file:planFile,message:'Missing or invalid choreography plan.'});}
if(plan){
  if(!['process','quiet','impact'].includes(plan.motionProfile))errors.push({file:planFile,message:'Declare a valid motionProfile.'});
  if(!Array.isArray(plan.runtimeBindings)||!plan.runtimeBindings.length)errors.push({file:planFile,message:'Record runtimeBindings with source file, symbol and consumed parameters or implemented events.'});
  else for(const binding of plan.runtimeBindings){
    const file=path.resolve(project,binding.file??'');
    if(!file.startsWith(project+path.sep)||!fs.existsSync(file)||!binding.symbol)
      errors.push({file:planFile,message:'Invalid runtime binding: '+JSON.stringify(binding)});
  }
  for(const ev of plan.events??[]){
    if(!Number.isInteger(ev.startFrame)||ev.startFrame<0||!Number.isInteger(ev.durationInFrames)||ev.durationInFrames<=0)
      errors.push({file:planFile,message:'Invalid integer-frame event: '+ev.id});
  }
  for(const win of plan.fixedEvidence?.windows??[]){
    if(!Number.isFinite(win.start)||!Number.isFinite(win.end)||win.start<0||win.end<=win.start)
      errors.push({file:planFile,message:'Invalid evidence reading window: '+win.file});
  }
}
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(/\.[cm]?tsx?$/.test(file)&&!file.endsWith('.d.ts'))files.push(file);}}
if(fs.existsSync(path.join(project,'src')))walk(path.join(project,'src'));
for(const file of files)errors.push(...discardedCalls(fs.readFileSync(file,'utf8'),path.relative(project,file)));
warnings.push('This static audit cannot certify semantic motion, complete parameter consumption, actual playback or screenshot lifecycle. Review rendered events and all evidence transition phases.');
const report={status:errors.length?'failed':'static-audit-passed',project,filesChecked:files.length,errors,warnings};
const output=path.join(project,'qc/motion-integration-audit.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
