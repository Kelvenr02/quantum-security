/* One Node entry point for local checks and CI; preserve JSON/logs on failure. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {GameBuild}=require('../config.js');
const root=path.resolve(__dirname,'..'),out=path.join(root,'tmp/node-tests');fs.mkdirSync(out,{recursive:true});
const stationary=process.argv.includes('--stationary');
const report={build:GameBuild,kind:stationary?'stationary':'node',revision:process.env.GITHUB_SHA||cp.spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim(),workingTreeDirty:!!cp.spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout.trim(),suites:[]};
if(!stationary)for(const dir of ['.','tools','tests','tests/browser'])for(const file of fs.readdirSync(path.join(root,dir)).filter(f=>/\.(?:js|cjs)$/.test(f))){
 const target=path.join(dir,file),result=cp.spawnSync(process.execPath,['--check',target],{cwd:root,encoding:'utf8'});
 if(result.status){console.error(result.stderr);process.exit(1);}
}
for(const file of stationary?['stationary.cjs']:fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.cjs')&&f!=='stationary.cjs')){
 const result=cp.spawnSync(process.execPath,['tests/'+file],{cwd:root,encoding:'utf8',timeout:stationary?420000:240000,maxBuffer:32*1024*1024});
 fs.writeFileSync(path.join(out,file+'.log'),result.stdout+'\n'+result.stderr);let parsed=null;
 try{parsed=JSON.parse(result.stdout);}catch{}
 const passed=result.status===0&&Number.isInteger(parsed?.passed);
 report.suites.push({file,ok:passed,passed:parsed?.passed||0,error:result.error?.message||null});
 if(parsed)fs.writeFileSync(path.join(out,file+'.json'),JSON.stringify(parsed,null,2));
 console.log(`${file}: ${passed?parsed.passed+' OK':'FALHOU'}`);
}
report.passed=report.suites.reduce((s,r)=>s+r.passed,0);report.ok=report.suites.every(r=>r.ok);
fs.writeFileSync(path.join(out,stationary?'stationary-results.json':'results.json'),JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;
console.log(`TOTAL: ${report.passed} verificações; ${report.ok?'aprovado':'há falhas'}`);
