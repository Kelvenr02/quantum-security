const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'tmp/browser-tests');fs.mkdirSync(out,{recursive:true});
const suites=[['layout',''],['layout','1'],...['feedback','continuity','progression','science','accessibility','audio','integration'].map(name=>[name,''])];
const report={build:require('../config.js').GameBuild,revision:process.env.GITHUB_SHA||cp.spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim(),workingTreeDirty:!!cp.spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout.trim(),suites:[]};
for(const [name,large]of suites){
 const label=name+(large?'-large':''),result=cp.spawnSync(process.execPath,['tests/browser/'+name+'.cjs'],{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024,env:{...process.env,LARGE_READING:large,BROWSER_SUITE:label}});
 fs.writeFileSync(path.join(out,label+'.log'),result.stdout+'\n'+result.stderr);
 const row={suite:label,ok:result.status===0,error:result.error?.message||null};report.suites.push(row);console.log(`${label}: ${row.ok?'OK':'FALHOU'}`);if(!row.ok)console.error(result.stderr);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
}
if(report.suites.some(r=>!r.ok))process.exitCode=1;
