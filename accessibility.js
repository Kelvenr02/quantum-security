/* Presentation preferences are local and independent of campaign checkpoints. */
const AccessibilityPreferences=(()=>{
  const defaults=()=>({reading:false,effects:'system',keys:{left:'KeyA',right:'KeyD',regen:'KeyR'}});
  function validate(value){
    const fallback=defaults();if(!value||typeof value!=='object')return fallback;
    const keys=value.keys;
    if(keys&&['left','right','regen'].every(k=>(/^Key[A-Z]$|^Digit[0-9]$/.test(keys[k])&&keys[k]!=='KeyM'))&&new Set(Object.values(keys)).size===3)fallback.keys={left:keys.left,right:keys.right,regen:keys.regen};
    fallback.reading=value.reading===true;
    if(['system','reduced','full'].includes(value.effects))fallback.effects=value.effects;
    return fallback;
  }
  return {defaults,validate};
})();
let accessPreferences=AccessibilityPreferences.defaults(),settingsOpen=false;
try{accessPreferences=AccessibilityPreferences.validate(JSON.parse(localStorage.getItem('qubit-accessibility-v1')));}catch{}
function reducedEffects(){return accessPreferences.effects==='reduced'||(accessPreferences.effects==='system'&&typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);}
function movementDirection(code){return code==='ArrowLeft'?-1:code==='ArrowRight'?1:code===accessPreferences.keys.left?-1:code===accessPreferences.keys.right?1:0;}
function regenerationKey(code){return code===accessPreferences.keys.regen;}
function keyLabel(action){return accessPreferences.keys[action].replace(/^Key|^Digit/,'');}
function controlText(text){return String(text).replace(/\bR\b/g,keyLabel('regen')).replace(/A \/ D|A\/D|A D/g,keyLabel('left')+' / '+keyLabel('right'));}
function combatControlsText(){return '← → / '+keyLabel('left')+' '+keyLabel('right')+': mover · '+describeRegeneration(keyLabel('regen'))+' · Esc: pausar';}
function applyAccessPreferences(){
  const root=document.documentElement;
  if(root){root.dataset.reading=accessPreferences.reading?'large':'standard';root.dataset.effects=reducedEffects()?'reduced':'full';}
  document.querySelectorAll?.('[data-control-guide]').forEach(el=>el.textContent=combatControlsText());
  document.querySelectorAll?.('[data-regen-key]').forEach(el=>el.textContent=keyLabel('regen'));
  const left=document.getElementById('trainingLeft'),right=document.getElementById('trainingRight');
  if(left)left.innerHTML='← <small>'+keyLabel('left')+'</small>';
  if(right)right.innerHTML='→ <small>'+keyLabel('right')+'</small>';
  const regen=document.getElementById('trainingRegen');if(regen)regen.innerHTML=keyLabel('regen')+' <small>Nova chave</small>';
  for(const id of ['helpOverlay','bossControls']){const parent=document.getElementById(id);if(parent&&document.createTreeWalker){const walker=document.createTreeWalker(parent,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){node.accessOriginal??=node.nodeValue;node.nodeValue=controlText(node.accessOriginal);}}}
  const game=document.getElementById('game');game?.setAttribute?.('aria-label','Arena de nove trilhas. '+combatControlsText()+'. Disparo automático.');
  if(typeof refreshArenaBounds==='function')refreshArenaBounds();
  if(typeof qber==='number'&&typeof updateHUD==='function'){updateHUD();updateQberUI();renderChannelWarning();}
  if(typeof isPaused!=='undefined'&&isPaused)renderPauseGuide();
  if(typeof introActive!=='undefined'&&introActive)tutorial.refreshControls();
  const touch=document.querySelector?.('[data-action="regen"]');if(touch)touch.textContent=keyLabel('regen');
  window.dispatchEvent?.(new Event('resize'));
}
let settingsReturn=null,settingsTrainingResume=false;
function openSettings(){
  if(settingsOpen)return;
  settingsReturn=document.activeElement;
  if(typeof isPlaying!=='undefined'&&isPlaying&&!isPaused&&!isStageBriefing){togglePause('settings');settingsReturn=document.getElementById('pauseResume');}
  settingsTrainingResume=typeof tutorial!=='undefined'?tutorial.suspendForSettings():false;
  settingsOpen=true;
  document.getElementById('accessReading').checked=accessPreferences.reading;
  document.getElementById('accessEffects').value=accessPreferences.effects;
  for(const action of ['left','right','regen'])document.getElementById('accessKey-'+action).value=accessPreferences.keys[action];
  document.getElementById('accessStatus').textContent='As setas continuam disponíveis. Esc pausa; M controla o som; Enter confirma botões.';
  document.getElementById('settingsOverlay').hidden=false;
  document.getElementById('settingsClose').focus({preventScroll:true});
}
function closeSettings(){
  settingsOpen=false;document.getElementById('settingsOverlay').hidden=true;
  if(settingsTrainingResume)tutorial.resumeFromSettings();settingsTrainingResume=false;
  // Combat stays paused so closing preferences cannot expose the player to a hit.
  settingsReturn?.focus?.({preventScroll:true});
}
function saveAccessPreferences(){
  const keys={};for(const action of ['left','right','regen'])keys[action]=document.getElementById('accessKey-'+action).value;
  const status=document.getElementById('accessStatus');
  if(new Set(Object.values(keys)).size!==3){status.textContent='Escolha três teclas diferentes para mover e renovar.';return false;}
  accessPreferences=AccessibilityPreferences.validate({reading:document.getElementById('accessReading').checked,effects:document.getElementById('accessEffects').value,keys});
  let saved=true;try{localStorage.setItem('qubit-accessibility-v1',JSON.stringify(accessPreferences));}catch{saved=false;}
  applyAccessPreferences();if(typeof campaignMetrics!=='undefined'&&campaignMetrics?.data.outcome==='playing')campaignMetrics.event('preferencesChanged',runtimePreferences());
  status.textContent=saved?'Preferências aplicadas e salvas neste navegador.':'Preferências aplicadas nesta aba. O navegador não permitiu salvar.';return true;
}
function installAccessibility(){
  for(const action of ['left','right','regen']){
    const select=document.getElementById('accessKey-'+action);
    for(const code of [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(k=>k!=='M').map(k=>'Key'+k).concat([...'0123456789'].map(k=>'Digit'+k))){const option=document.createElement('option');option.value=code;option.textContent=code.replace(/^Key|^Digit/,'');select.appendChild(option);}
  }
  applyAccessPreferences();
  const media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  media?.addEventListener?.('change',applyAccessPreferences);
  // Capture modal navigation before gameplay/document shortcuts. Native buttons keep Enter/Space.
  document.addEventListener('keydown',event=>{
    if(settingsOpen&&event.code==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeSettings();return;}
    if(settingsOpen&&event.code!=='Tab')return;
    const modal=settingsOpen?document.getElementById('settingsOverlay'):
      [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].reverse().find(el=>!el.hidden&&el.getClientRects().length);
    if(!modal||event.code!=='Tab')return;
    const targets=[...modal.querySelectorAll('button,a[href],input,select,textarea,summary,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
    if(!targets.length){event.preventDefault();return;}
    const first=targets[0],last=targets[targets.length-1],active=document.activeElement;
    if(!modal.contains(active)||event.shiftKey&&active===first||!event.shiftKey&&active===last){event.preventDefault();(event.shiftKey?last:first).focus();}
  },true);
}
