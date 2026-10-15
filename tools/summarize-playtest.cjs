/* Agrega exports locais. Não envia dados nem estima dificuldade humana por simulação. */
const fs=require('node:fs');
function summarizeAttempts(input){
  const attempts=input.attempts||[input],seen=new Set();
  return [...attempts].reverse().filter(a=>a&&typeof a==='object').filter(a=>{
    const key=JSON.stringify([a.build||null,a.configuration||null,a.arena||null,a.campaign?.id,a.campaign?.attempt]);if(!a.campaign?.id)return true;
    if(seen.has(key))return false;seen.add(key);return true;
  }).reverse().map(a=>{
    const segments=Object.entries(a.phases||{}).flatMap(([phase,modes])=>Object.entries(modes).map(([mode,s])=>({phase:Number(phase),mode,...s})));
    const sum=key=>segments.reduce((n,s)=>n+(s[key]||0),0),seconds=n=>Math.round((n||0)/100)/10;
    return {build:a.build||null,configuration:a.configuration||null,arena:a.arena||null,campaign:a.campaign?.id||null,attempt:a.campaign?.attempt||null,
      developerAssisted:a.campaign?.developerAssisted===true,developerRevives:a.campaign?.developerRevives||0,
      group:a.inputMethods?.includes('simulation')?'simulation':a.campaign?.developerAssisted?'developer-assisted':a.inputMethods?.length?'unassisted':'unknown-input',
      inputs:a.inputMethods||[],entry:a.entry||{phase:a.startPhase,kind:'unknown'},outcome:a.outcome,
      seconds:seconds(a.activeMs),firsts:a.firsts||{},failure:a.firsts?.defeat?.cause||null,
      noDecisionSeconds:seconds(sum('noDecisionMs')),emptyTravelSeconds:seconds(sum('emptyTravelMs')),
      waitingForOpeningSeconds:seconds(sum('waitingForOpeningMs')),regens:a.counts?.regenerationsStarted||0,
      consultations:a.counts?.guideConsultations||0,briefingViews:a.counts?.briefingViews||0,
      segments:segments.map(s=>({phase:s.phase,mode:s.mode,seconds:seconds(s.activeMs),bossAttempts:s.counts?.bossAttempts||0,
        rounds:s.counts?.bossRounds||0,emptyTravelSeconds:seconds(s.emptyTravelMs),noDecisionSeconds:seconds(s.noDecisionMs)}))};
  });
}
if(require.main===module){
  const files=process.argv.slice(2);if(!files.length){console.error('Uso: node tools/summarize-playtest.cjs arquivo.json [outro.json ...]');process.exitCode=1;}
  else{
    const attempts=files.flatMap(file=>{const data=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));return data.attempts||[data];});
    console.log(JSON.stringify({version:1,note:'Tempo sem decisão é um indicador geométrico; inclui respiros planejados. Observações humanas devem ser registradas separadamente.',attempts:summarizeAttempts({attempts})},null,2));
  }
}
module.exports={summarizeAttempts};
