/* Medalhas opcionais: não concedem carga, proteção ou recursos de combate. */
const phaseChallenges=Object.freeze([
  {title:'Terra protegida',task:'Termine a fase sem impactos na Terra.',key:'earthImpacts',minimum:0,avoid:true},
  {title:'Leitura da mira',task:'Desvie dos dois pulsos das sondas.',key:'scoutsDodged',minimum:2},
  {title:'Cobertura H',task:'Acerte três disparos laterais de H.',key:'hadamardHits',minimum:3},
  {title:'Par coordenado',task:'Acerte quatro tiros no BELL ativo.',key:'bellHits',minimum:4},
  {title:'Intercepção antecipada',task:'Destrua os dois meteoros antes de fragmentarem.',key:'splitsPrevented',minimum:2},
  {title:'Fonte interrompida',task:'Destrua os dois drones emissores.',key:'dronesDestroyed',minimum:2},
  {title:'Renovação planejada',task:'Renove com QBER acima de zero em um RESPIRO.',key:'regenInRecovery',minimum:1},
  {title:'Canal estável',task:'Termine a fase sem inversão dos controles.',key:'compromises',minimum:0,avoid:true}
]);
const phaseGoalKeys=Object.freeze(['earthImpacts','scoutsDodged','hadamardHits','bellHits','splitsPrevented','dronesDestroyed','regenInRecovery','compromises']);
class PhaseGoals {
  constructor(phase,saved=null,eligible=true){this.phase=phase;this.eligible=saved?.eligible??eligible;this.counts={...saved?.counts};}
  count(key){if(phaseGoalKeys.includes(key))this.counts[key]=(this.counts[key]||0)+1;}
  get definition(){return phaseChallenges[this.phase-1];}
  get achieved(){const d=this.definition,n=this.counts[d.key]||0;return this.eligible&&(d.avoid?n===0:n>=d.minimum);}
  get status(){const d=this.definition;return !this.eligible?'Não avaliado nesta retomada antiga.':d.avoid?(this.achieved?'Sem ocorrência até agora.':'Objetivo perdido; a missão continua.'):
    Math.min(d.minimum,this.counts[d.key]||0)+' / '+d.minimum;}
  snapshot(){return {phase:this.phase,eligible:this.eligible,counts:{...this.counts}};}
}
let phaseGoals=null,lastPhaseReport=null;
function recordPhaseGoal(key){if(phaseGoals?.phase===level)phaseGoals.count(key);}
function optionalGoalText(){return phaseGoals?'OPCIONAL · '+phaseGoals.definition.task+' '+phaseGoals.status:'';}
function settlePhaseProgress(repair){
  if(!phaseGoals||phaseGoals.phase!==level)return;
  const won=phaseGoals.achieved;
  campaignJourney.awards??=Array(8).fill(false);campaignJourney.awards[level-1]=won;
  const rows=Object.values(campaignMetrics?.data.phases[level]||{});
  const count=key=>rows.reduce((sum,row)=>sum+(row.counts[key]||0),0);
  lastPhaseReport={phase:level,medal:won,title:phaseGoals.definition.title,
    text:'Fase '+level+' concluída · '+(won?'MEDALHA: '+phaseGoals.definition.title:phaseGoals.eligible?'objetivo opcional não concluído':'objetivo não avaliado')+
      ' · impactos nesta tentativa: '+count('earthImpacts')+' · renovações: '+count('regenerationsStarted')+
      ' · reparos: '+repair+' · conceito: '+missionPhases[level-1].concept+'.'};
  campaignMetrics?.event('phaseSummary',{...lastPhaseReport,goals:phaseGoals.snapshot()});syncCampaignIdentity();
}
function showPhaseReport(){
  const report=lastPhaseReport;
  $('phaseDebrief').hidden=!report;$('phaseDebrief').open=false;
  if(report){$('phaseDebriefTitle').textContent='FASE '+report.phase+' CONCLUÍDA · '+(report.medal?'MEDALHA CONQUISTADA':'VER RESUMO');$('phaseDebriefText').textContent=report.text;}
}
if(typeof module!=='undefined'&&module.exports)module.exports={PhaseGoals,phaseChallenges};
