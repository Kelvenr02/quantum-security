/* Matriz reproduzível de estratégias. Não representa uma amostra de jogadores. */
const fs=require('node:fs');
const {makeGame}=require('../tests/gameplay.cjs');
const {flyCampaign}=require('../tests/balance.cjs');
const controllerPolicies=Object.freeze({
  balanced:'Evita ruído conforme QBER, compensa inversões e usa R nos respiros.',
  'canal-sem-R':'Desativa somente R; ainda evita ruído e compensa inversões.',
  'ignora-canal':'Não usa R, não evita nuvens/sondas/frentes por risco ao canal e não compensa inversões. Ainda desvia de dano físico.',
  'renova-no-alerta':'Usa R na primeira decisão com QBER >= 7.7 e recarga disponível, mesmo fora dos respiros.',
  'ignora-emissores':'Nunca escolhe drones como alvo, mesmo sem meteoros. Disparos incidentais continuam possíveis.'
});

function scenarios() {
  const cases=[];
  const add=(name,width,height,seed,options={},manageChannel=true)=>cases.push({name,width,height,seed,options,manageChannel});
  for(const [width,height]of [[1600,900],[1100,800],[390,700],[844,390],[760,360]])
    for(const seed of [1,42,519,2026])add('equilibrado',width,height,seed);
  for(const strategy of ['meteors','noise'])for(const [width,height]of [[1600,900],[390,700]])
    for(const seed of [42,519])add(strategy,width,height,seed,{strategy});
  for(const [width,height]of [[1600,900],[390,700]])for(const seed of [42,519])
    add('leitura-300ms',width,height,seed,{decisionMs:240,reactionMs:300,input:'held'});
  for(const seed of [42,519]) {
    add('leitura-500ms',1600,900,seed,{decisionMs:320,reactionMs:500,input:'held'});
    add('comando-perdido',1600,900,seed,{reactionMs:300,errorEvery:13});
    for(const manage of [true,false])add(manage?'canal-com-R':'canal-sem-R',1600,900,seed,{},manage);
    for(const manage of [true,false])add(manage?'inversao-com-R':'inversao-sem-R',1600,900,seed,{reactionMs:300,compensate:false},manage);
  }
  for(const [width,height]of [[1600,900],[390,700]])add('imovel',width,height,519,{idle:true});
  for(const [width,height]of [[1600,900],[390,700]])for(const seed of [42,519]){
    add('ignora-canal',width,height,seed,{channel:'ignore'});
    add('renova-no-alerta',width,height,seed,{channel:'alert'});
    add('ignora-emissores',width,height,seed,{strategy:'ignoreEmitters'});
  }
  return cases;
}
function runScenario(config) {
  const {width,height,seed,options,manageChannel}=config;
  const game=makeGame(width,height);
  return {...config,...JSON.parse(JSON.stringify(game.run('('+flyCampaign.toString()+')('+[seed,54000,manageChannel,JSON.stringify(options)].join(',')+')')))};
}
function summarize(rows) {
  return [...new Set(rows.map(r=>r.name))].map(name=>{
    const group=rows.filter(r=>r.name===name),wins=group.filter(r=>r.won);
    const range=key=>wins.length?[Math.min(...wins.map(r=>r[key])),Math.max(...wins.map(r=>r[key]))]:null;
    return {name,cases:group.length,wins:wins.length,seconds:range('seconds'),regens:range('regens'),missed:range('missed'),
      losses:group.filter(r=>!r.won).map(r=>({seed:r.seed,width:r.width,height:r.height,phase:r.lastPhase,cause:r.failure,timeout:r.outcome==='playing'}))};
  });
}
if(require.main===module) {
  const args=process.argv.slice(2),output=args[0]==='--output'?args[1]:null;
  if(args.length&&(!output||args.length!==2))throw Error('Uso: node tools/analyze-balance.cjs [--output arquivo.json]');
  const rows=[];
  for(const config of scenarios()) {
    const row=runScenario(config);rows.push(row);
    process.stderr.write(`${rows.length}: ${row.name} ${row.width}×${row.height} seed=${row.seed}: ${row.won?'vitória':'fase '+row.lastPhase+' / '+(row.failure?.kind||'limite de tempo')} (${row.seconds}s)\n`);
  }
  const report={schemaVersion:3,build:rows[0]?.build,randomVersion:rows[0]?.randomVersion,encounterVersion:rows[0]?.encounterVersion,description:'Controladores determinísticos com acesso ao estado interno; resultados não estimam habilidade ou sucesso humano.',controllerPolicies,
    maxActionSeconds:900,summary:summarize(rows),runs:rows};
  if(output){fs.mkdirSync(require('node:path').dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary,null,2));}
  else console.log(JSON.stringify(report,null,2));
}
module.exports={scenarios,runScenario,summarize,controllerPolicies};
