/* Shared gameplay values. Presentation preferences never change these rules. */
const GameBuild=Object.freeze({version:'0.8.0',rulesVersion:1});
const GameRules=Object.freeze({
  phases:8,charge:1000,maxImpacts:12,frameMs:1000/60,maxStepMs:50,
  shotCooldownMs:300,regenMs:2000,regenCooldownMs:10000,compromisedMs:4000,
  channel:Object.freeze({limit:11,alert:7.7,max:16})
});
function describeRegeneration(key='R'){
  return key+': renovar ('+GameRules.regenMs/1000+' s parado e sem disparar; recarga '+GameRules.regenCooldownMs/1000+' s). Não bloqueia ataques.';
}
/* One explicit view of the existing flow; resource/channel states stay independent. */
function resolveGameMode(s){
  if(s.settings)return 'settings';
  if(s.training)return 'training';
  if(!s.arcade)return 'menu';
  if(s.finale)return 'ending';
  if(!s.playing)return s.failure?'defeat':s.victory?'victory':'standby';
  if(s.briefing)return 'briefing';
  if(s.paused)return 'paused';
  return s.boss?'boss':'wave';
}
if(typeof module!=='undefined'&&module.exports)module.exports={GameBuild,GameRules,describeRegeneration,resolveGameMode};
