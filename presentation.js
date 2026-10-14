/* Navigation, pause and touch controls for the visual shell. */
let isPaused=false;
function openDefenseBriefing(){startIntro()}
function togglePause(){if(!arcadeActive||!isPlaying||finale||isStageBriefing)return;isPaused=!isPaused;clearMovementInput();gameAudio.setPaused('game',isPaused);document.getElementById('pauseOverlay').hidden=!isPaused;document.getElementById('pauseBtn').innerHTML=isPaused?'▶ <span>RETOMAR</span>':'Ⅱ <span>PAUSAR</span>';if(isPaused){cancelAnimationFrame(rafId)}else{lastTs=0;rafId=requestAnimationFrame(update)}}
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&arcadeActive&&isPlaying){e.preventDefault();togglePause()}});
window.addEventListener('blur',()=>{if(arcadeActive&&isPlaying&&!isPaused)togglePause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&arcadeActive&&isPlaying&&!isPaused)togglePause()});
const touchBar=document.createElement('div');touchBar.className='touch-controls';touchBar.innerHTML='<button aria-label="Mover para a esquerda" data-action="left">←</button><button aria-label="Mover para a direita" data-action="right">→</button><button aria-label="Regenerar chave" data-action="regen">R</button>';document.getElementById('screen').appendChild(touchBar);
for(const button of touchBar.querySelectorAll('button')) {
  button.addEventListener('pointerdown',e=>{
    e.preventDefault();if(!isPlaying||isPaused||isStageBriefing)return;
    button.setPointerCapture(e.pointerId);
    if(button.dataset.action==='regen'){tryRegen();return;}
    pressMovement('pointer:'+e.pointerId,button.dataset.action==='left'?-1:1);
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])
    button.addEventListener(event,e=>shipPilot.release('pointer:'+e.pointerId));
  button.addEventListener('click',e=>{
    if(e.detail)return;
    if(button.dataset.action==='regen')tryRegen();
    else {const token='button:'+button.dataset.action;pressMovement(token,button.dataset.action==='left'?-1:1);shipPilot.release(token);}
  });
}
