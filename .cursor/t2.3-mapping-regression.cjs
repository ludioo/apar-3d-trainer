const fs=require('node:fs');
const path=require('node:path');
const name=process.argv.includes('--effects')?'t2.2-check.cjs':process.argv.includes('--training')?'t2.1-check.cjs':'t2.3-check.cjs';
let source=fs.readFileSync(path.join(__dirname,name),'utf8');
if(name==='t2.1-check.cjs')source=source.replace("const prefix = production ? 't2.1-production' : 't2.1';","const prefix = production ? 't2.3-mapping-training' : 't2.3-mapping-training-dev';");
else if(name==='t2.2-check.cjs')source=source.replaceAll('t2.2','t2.3-mapping-effects');
else source=source.replace("const prefix = origin.includes('5183') ? 't2.3-dev' : 't2.3';","const prefix = origin.includes('5183') ? 't2.3-mapping-quiz-dev' : 't2.3-mapping-quiz';");
module._compile(source,path.join(__dirname,name));
