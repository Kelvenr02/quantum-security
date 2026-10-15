const saveConfig=typeof module!=='undefined'&&module.exports?{...require('./config.js'),...require('./arena.js')}:{GameRules,OrbitalArena};
/* Somente pontos de entrada e identidade ficam no navegador; nenhuma telemetria é enviada. */
class CampaignSaveStore {
  static key='qubit-campaign-v1';
  static version=1;
  constructor(storage=()=>globalThis.localStorage){this.storage=storage;this.status='missing';}
  static normalize(raw){
    const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
    const integer=(v,min,max)=>Number.isInteger(v)&&number(v,min,max);
    const journey=j=>{
      if(!j||typeof j.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(j.id)||!integer(j.attempt,1,1000000)||
        !integer(j.developerRevives,0,1000000)||typeof j.developerAssisted!=='boolean'||j.developerAssisted!==(j.developerRevives>0))throw Error('Identidade inválida');
      const awards=j.awards??Array(8).fill(false);if(!Array.isArray(awards)||awards.length!==8||awards.some(v=>typeof v!=='boolean'))throw Error('Medalhas inválidas');
      return {id:j.id,attempt:j.attempt,developerAssisted:j.developerAssisted,developerRevives:j.developerRevives,awards:[...awards]};
    };
    const checkpoint=c=>{
      if(!c||!['wave','boss'].includes(c.kind)||!integer(c.level,1,saveConfig.GameRules.phases)||!integer(c.seed,0,4294967295)||
        !integer(c.score,0,saveConfig.GameRules.charge)||!integer(c.combatScore,0,10000000)||!integer(c.missed,0,saveConfig.GameRules.maxImpacts-1)||
        !integer(c.quantumCollected,0,1000000)||!integer(c.hullShield,0,1)||
        !number(c.hullGraceRemaining,0,3000)||!number(c.hadamardRemaining,0,7000))throw Error('Ponto inválido');
      const limits={qber:saveConfig.GameRules.channel.max,regenRemaining:saveConfig.GameRules.regenMs,cooldownRemaining:saveConfig.GameRules.regenCooldownMs,compromiseRemaining:saveConfig.GameRules.compromisedMs,criticalGraceRemaining:3000,contactGraceRemaining:3000};
      const channel={};for(const [key,max]of Object.entries(limits)){
        if(!number(c.channel?.[key],0,max))throw Error('Canal inválido');channel[key]=c.channel[key];
      }
      const p=c.pilot;if(!p||!integer(p.lane,0,saveConfig.OrbitalArena.lanes-1)||!number(p.position,0,saveConfig.OrbitalArena.lanes-1)||!number(p.from,0,saveConfig.OrbitalArena.lanes-1)||!number(p.elapsed,0,saveConfig.OrbitalArena.stepMs)||
        Math.abs(p.from-p.lane)>1||Math.abs(p.position-(p.from+(p.lane-p.from)*p.elapsed/150))>.001)throw Error('Posição inválida');
      if(c.random?.version!==1)throw Error('Sorteio incompatível');
      const states={};for(const key of ['clouds','spies','interference']){
        if(!integer(c.random.states?.[key],0,4294967295))throw Error('Sorteio inválido');states[key]=c.random.states[key];
      }
      const encounterVersion=c.encounterVersion??1,variant=c.variant??0;
      if(![1,2].includes(encounterVersion)||!integer(variant,0,1)||(c.level<3||encounterVersion===1)&&variant!==0)throw Error('Roteiro incompatível');
      let goals;
      if(c.goals){
        if(c.goals.phase!==c.level||typeof c.goals.eligible!=='boolean'||!c.goals.counts||typeof c.goals.counts!=='object')throw Error('Objetivos inválidos');
        const counts={};for(const key of ['earthImpacts','scoutsDodged','hadamardHits','bellHits','splitsPrevented','dronesDestroyed','regenInRecovery','compromises'])
          if(c.goals.counts[key]!==undefined){if(!integer(c.goals.counts[key],0,1000000))throw Error('Contador inválido');counts[key]=c.goals.counts[key];}
        goals={phase:c.level,eligible:c.goals.eligible,counts};
      }
      return {kind:c.kind,level:c.level,seed:c.seed,score:c.score,combatScore:c.combatScore,missed:c.missed,
        quantumCollected:c.quantumCollected,hullShield:c.hullShield,hullGraceRemaining:c.hullGraceRemaining,
        hadamardRemaining:c.hadamardRemaining,encounterVersion,variant,...(goals?{goals}:{}),channel,pilot:{lane:p.lane,position:p.position,from:p.from,elapsed:p.elapsed},random:{version:1,states}};
    };
    try{
      if(raw?.version!==CampaignSaveStore.version||!number(raw.savedAt,0,8640000000000000))return null;
      const saved=checkpoint(raw.checkpoint),wave=checkpoint(raw.wave);
      if(wave.kind!=='wave'||wave.level!==saved.level||wave.seed!==saved.seed)return null;
      return {version:1,savedAt:raw.savedAt,journey:journey(raw.journey),checkpoint:saved,wave};
    }catch{return null;}
  }
  load(){
    try{
      const text=this.storage()?.getItem(CampaignSaveStore.key);
      if(!text){this.status='missing';return null;}
      const saved=text.length<=24000?CampaignSaveStore.normalize(JSON.parse(text)):null;
      this.status=saved?'ready':'invalid';return saved;
    }catch(error){this.status=error instanceof SyntaxError?'invalid':'unavailable';return null;}
  }
  write(entry){
    const saved=CampaignSaveStore.normalize(entry);if(!saved){this.status='invalid';return false;}
    try{const storage=this.storage();if(!storage)throw Error('Sem armazenamento');storage.setItem(CampaignSaveStore.key,JSON.stringify(saved));this.status='ready';return true;}
    catch{this.status='unavailable';return false;}
  }
  clear(){try{this.storage()?.removeItem(CampaignSaveStore.key);this.status='missing';}catch{this.status='unavailable';}}
}

let campaignJourney=null,sessionCampaignSave=null;
const campaignSaveStore=new CampaignSaveStore();
function beginCampaignJourney(checkpoint){
  const saved=checkpoint?.journey;
  const previous=checkpoint?(saved&&saved.id!==campaignJourney?.id?saved:campaignJourney||saved):null;
  campaignJourney=previous?{...previous,attempt:previous.attempt+1}:
    {id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12),attempt:1,developerAssisted:false,developerRevives:0,awards:Array(8).fill(false)};
}
function syncCampaignIdentity(){
  if(!campaignJourney)return;
  if(campaignMetrics){campaignMetrics.data.campaign={...campaignJourney};if(campaignJourney.developerAssisted)campaignMetrics.data.developerAssisted=true;}
  $('campaignBadge').hidden=!campaignJourney.developerAssisted;
  $('campaignBadge').textContent='DEV · '+campaignJourney.developerRevives+' RENASC.';
}
function readSavedCampaign(){return sessionCampaignSave||campaignSaveStore.load();}
function saveCampaignEntry(checkpoint){
  if(!campaignJourney||!checkpoint||!phaseCheckpointData)return;
  const entry=CampaignSaveStore.normalize({version:1,savedAt:Date.now(),journey:campaignJourney,checkpoint,wave:phaseCheckpointData});
  if(!entry)return;
  sessionCampaignSave=entry;campaignSaveStore.write(entry);refreshSavedCampaign();
}
function saveCampaignIdentity(){
  const entry=readSavedCampaign();
  if(entry?.journey.id!==campaignJourney?.id)return;
  sessionCampaignSave={...entry,journey:{...campaignJourney},savedAt:Date.now()};
  campaignSaveStore.write(sessionCampaignSave);refreshSavedCampaign();
}
function refreshSavedCampaign(){
  const saved=readSavedCampaign(),local=campaignSaveStore.status==='ready';
  $('titleContinue').hidden=!saved;$('continueSummary').hidden=!saved;
  $('titleStartLabel').textContent=saved?'NOVA MISSÃO':'INICIAR MISSÃO';
  if(saved){
    $('titleContinue').textContent=local?'CONTINUAR CAMPANHA →':'CONTINUAR NESTA SESSÃO →';
    $('continueSummary').textContent='Fase '+saved.checkpoint.level+'/8 · '+(saved.checkpoint.kind==='boss'?'início do chefe (vida completa)':'início da fase')+
      (saved.journey.developerAssisted?' · assistida: '+saved.journey.developerRevives+' renascimento(s)':'')+'.';
  }
  const message=campaignSaveStore.status==='unavailable'?'Salvamento local indisponível. As retomadas funcionam somente nesta aba.':
    campaignSaveStore.status==='invalid'?'O ponto local é inválido ou incompatível. Inicie uma nova missão.':'';
  $('saveNotice').textContent=message;$('saveNotice').hidden=!message;
}
function continueSavedCampaign(){
  if(isPlaying||finale)return;
  const entry=readSavedCampaign();if(!entry){refreshSavedCampaign();return;}
  if(typeof tutorial!=='undefined')tutorial.stop();
  $('title').style.display='none';startDefense();
  startGame({...entry.checkpoint,journey:entry.journey});
  if(entry.checkpoint.kind==='boss'){phaseCheckpointData=entry.wave;beginBoss(true);}
  else enterPhase(entry.checkpoint.level);
  campaignMetrics?.event('localContinue',{kind:entry.checkpoint.kind});
}
function campaignResultLabel(){
  if(!campaignJourney)return '';
  return (campaignJourney.developerAssisted?'CAMPANHA ASSISTIDA · DESENVOLVEDOR · '+campaignJourney.developerRevives+' RENASCIMENTO(S)':'CAMPANHA SEM AUXÍLIO')+
    ' · TENTATIVA '+campaignJourney.attempt;
}
function clearCompletedCampaign(){sessionCampaignSave=null;campaignSaveStore.clear();refreshSavedCampaign();}
if(typeof module!=='undefined'&&module.exports)module.exports={CampaignSaveStore};
