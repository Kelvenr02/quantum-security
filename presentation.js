/* Navigation, pause and touch controls for the visual shell. */
let isPaused=false;
let quickGuideOpen=false,quickGuideReturn=null;
function openDefenseBriefing(){
  if(isPlaying||introActive||finale)return;
  quickGuideReturn=document.activeElement;quickGuideOpen=true;$('helpOverlay').hidden=false;
  $('helpOverlay').scrollTop=0;$('helpClose').focus({preventScroll:true});
}
function closeDefenseBriefing(){quickGuideOpen=false;$('helpOverlay').hidden=true;quickGuideReturn?.focus?.({preventScroll:true});}
function renderPauseGuide(){
  const m=boss?.model,d=m?.definition;
  $('pauseGuideTitle').textContent=d?d.name:'Fase '+level+' · '+phaseConfig().name;
  $('pauseGuideObjective').textContent=d?d.objective:'Proteja a Terra, resolva os três encontros e enfrente o guardião.';
  const instructions=d?d.instructions:[
    'Alinhe a nave para interceptar meteoros. Priorize os mais próximos da Terra.',
    'Destrua drones de ruído e saia das faixas de ataque. H amplia os tiros; a cápsula + reduz o QBER.',
    'Com QBER alto, procure uma rota livre antes de usar R. Você ficará parado e sem atirar por 2 s.'
  ];
  $('pauseGuideSteps').innerHTML=instructions.map(text=>'<li>'+controlText(text)+'</li>').join('');
  $('pauseGuideState').textContent=m?(m.phase===8?'ESTÁGIO '+(m.stage+1)+'/3 · ':'')+m.hint(qber):channelBriefingStatus();
  $('pauseGuideState').textContent=controlText($('pauseGuideState').textContent);
  $('pauseOptional').textContent=optionalGoalText();
  $('pauseScienceDetails').open=false;configureSciencePanel('pause');
  const saved=readSavedCampaign();
  $('pauseSaveStatus').textContent='Continuar volta ao início '+(saved?.checkpoint.kind==='boss'?'do chefe, com vida completa':'da fase')+
    '. O combate em andamento não é salvo.'+(campaignSaveStore.status==='unavailable'?' Disponível somente nesta aba.':' Salvo neste navegador.');
}
function returnToCampaignMenu(){
  if(!isPlaying||!isPaused)return;
  saveCampaignIdentity();campaignMetrics?.finish('interrupted',{reason:'menu'});
  clearMovementInput();cancelAnimationFrame(rafId);isPlaying=false;isPaused=false;isStageBriefing=false;arcadeActive=false;
  boss=null;lastFailure=null;developerReviveState=null;
  gameAudio.stopEffects();gameAudio.setPaused('game',false);gameAudio.setScene('menu');
  $('pauseOverlay').hidden=true;$('phaseOverlay').hidden=true;$('arcade').style.display='none';$('title').style.display='';
  refreshSavedCampaign();$('titleContinue').focus({preventScroll:true});
}
function togglePause(reason='manual'){
  if(!arcadeActive||!isPlaying||finale||isStageBriefing)return;
  isPaused=!isPaused;clearMovementInput();gameAudio.setPaused('game',isPaused);
  $('pauseOverlay').hidden=!isPaused;$('pauseBtn').innerHTML=isPaused?'▶ <span>RETOMAR</span>':'Ⅱ <span>PAUSAR</span>';
  if(isPaused){if(reason==='manual'){campaignMetrics?.milestone('consultation',{guide:'pause'});campaignMetrics?.count('guideConsultations');campaignMetrics?.event('guideConsulted',{guide:'pause'});}cancelAnimationFrame(rafId);renderPauseGuide();$('pauseOverlay').scrollTop=0;$('pauseResume').focus({preventScroll:true});}
  else{canvas.focus({preventScroll:true});lastTs=0;rafId=requestAnimationFrame(update);}
}
window.addEventListener('keydown',e=>{if(settingsOpen||e.repeat)return;if(e.code==='Escape'&&quickGuideOpen){e.preventDefault();closeDefenseBriefing();return;}if(e.code==='Escape'&&arcadeActive&&isPlaying){e.preventDefault();togglePause()}});
window.addEventListener('blur',()=>{if(arcadeActive&&isPlaying&&!isPaused)togglePause('blur')});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&arcadeActive&&isPlaying&&!isPaused)togglePause('hidden')});
const touchBar=document.createElement('div');touchBar.className='touch-controls';touchBar.innerHTML='<button aria-label="Mover para a esquerda" data-action="left">←</button><button aria-label="Mover para a direita" data-action="right">→</button><button aria-label="Regenerar chave" data-action="regen">R</button>';document.getElementById('screen').appendChild(touchBar);
for(const button of touchBar.querySelectorAll('button')) {
  button.addEventListener('pointerdown',e=>{
    e.preventDefault();if(!combatRunning())return;
    button.setPointerCapture(e.pointerId);
    const source=e.pointerType==='touch'?'touch':'button';
    if(button.dataset.action==='regen'){tryRegen(source);return;}
    pressMovement('pointer:'+e.pointerId,button.dataset.action==='left'?-1:1,source);
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])
    button.addEventListener(event,e=>shipPilot.release('pointer:'+e.pointerId));
  button.addEventListener('click',e=>{
    if(e.detail)return;
    if(button.dataset.action==='regen')tryRegen('button');
    else {const token='button:'+button.dataset.action;pressMovement(token,button.dataset.action==='left'?-1:1);shipPilot.release(token);}
  });
}
refreshSavedCampaign();
installSciencePanels();
if(document.querySelectorAll)installAccessibility();
