/* Navigation, pause and touch controls for the visual shell. */
let isPaused=false;
function openDefenseBriefing(){document.getElementById('title').style.display='none';startDefense()}
function togglePause(){if(!arcadeActive||!isPlaying||finale||isStageBriefing)return;isPaused=!isPaused;document.getElementById('pauseOverlay').hidden=!isPaused;document.getElementById('pauseBtn').innerHTML=isPaused?'▶ <span>RETOMAR</span>':'Ⅱ <span>PAUSAR</span>';if(isPaused){cancelAnimationFrame(rafId)}else{lastTs=0;rafId=requestAnimationFrame(update)}}
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&arcadeActive&&isPlaying){e.preventDefault();togglePause()}});
window.addEventListener('blur',()=>{if(arcadeActive&&isPlaying&&!isPaused)togglePause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&arcadeActive&&isPlaying&&!isPaused)togglePause()});
const touchBar=document.createElement('div');touchBar.className='touch-controls';touchBar.innerHTML='<button aria-label="Mover para a esquerda" data-action="left">←</button><button aria-label="Mover para a direita" data-action="right">→</button><button aria-label="Regenerar chave" data-action="regen">R</button>';document.getElementById('screen').appendChild(touchBar);
for(const button of touchBar.querySelectorAll('button')){button.addEventListener('pointerdown',e=>{e.preventDefault();if(!isPlaying||isPaused||isStageBriefing)return;button.setPointerCapture(e.pointerId);const action=button.dataset.action;if(action==='regen'){tryRegen();return}if(!isRegen){const dir=(action==='left'?-1:1)*(isCompromised?-1:1);currentLane=Math.max(0,Math.min(numLanes-1,currentLane+dir))}})}
renderScene();
