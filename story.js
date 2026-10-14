/* Uma história curta, o canal quântico e um treino rápido antes da missão. */
let introActive = false;
const tutorial = (() => {
  const el = id => document.getElementById(id);
  const steps = [
    { name: 'História', title: 'A Terra precisa de você.', story: 'Ano 2090. Uma frota alienígena lança asteroides contra a Terra. Da base, você pilota a nave defensora enquanto a Dr. Íris cuida da comunicação.', task: 'Intercepte os asteroides e carregue o canhão para deter a nave-mãe.', science: '' },
    { name: 'Quantum Security', title: 'Uma chave protege a missão.', story: 'A nave usa Quantum Security para monitorar o canal e gerenciar chaves criadas por equipamentos QKD. O rádio leva seus comandos cifrados e autenticados.', task: 'Ative o Quantum Security para preparar a comunicação.', science: 'Qubits podem estar em superposição; ao medir, obtemos um resultado. No protocolo E91, partículas entrelaçadas ajudam a gerar chaves compartilhadas. Ruído ou espionagem elevam o QBER, a taxa de erros do canal.' },
    { name: 'Treino rápido', title: 'Mova. Intercepte. Renove.', story: 'Íris: o disparo é automático. Você só precisa escolher a trilha e cuidar da chave. Vamos testar uma vez antes da missão.', task: 'Destrua um asteroide e pressione R para renovar a chave.', science: 'Setas ou A / D: mover. R: renovar a chave; 2 s parado e 10 s de recarga. Esc: pausar. Acima de 11% de QBER, os comandos se invertem por 4 s. As novidades das fases serão explicadas durante a missão.' }
  ];
  let step = 0, frame = 0, last = 0, simulation = null;
  let activated = false, feedback = '', backdrop = null, manualPause = false;
  function say(text) { feedback = text; el('trainingFeedback').textContent = text; }
  function completed() { return step === 0 || (step === 1 ? activated : simulation.complete); }
  function sync() {
    const complete = completed();
    el('trainingNext').disabled = !complete || manualPause;
    el('trainingNext').textContent = ['ENTENDER A PROTEÇÃO →', 'TESTAR OS CONTROLES →', 'INICIAR DEFESA →'][step];
    el('trainingObjective').textContent = simulation ? simulation.objective : steps[step].task;
    el('trainingProgress').value = step + (complete ? 1 : 0);
    el('trainingPause').hidden = step !== 2;
    el('trainingPause').textContent = manualPause ? '▶ Retomar' : 'Ⅱ Pausar';
    el('trainingBack').disabled = step === 0;
    if (simulation) {
      el('trainingQber').textContent = simulation.qber.toFixed(1) + '%';
      el('trainingScore').textContent = simulation.score + ' pts';
      el('trainingChannel').textContent = simulation.regenerating ? 'RENOVANDO CHAVE · ' + ((simulation.regenEnd - simulation.time) / 1000).toFixed(1) + ' s' : simulation.qber > 0 ? 'RUÍDO DETECTADO' : 'CANAL SEGURO';
      el('trainingRegen').disabled = simulation.score === 0 || simulation.regenerating || manualPause || complete;
      if (simulation.message !== feedback) say(simulation.message);
    }
  }
  function render() {
    el('trainingStep').textContent = 'PREPARAÇÃO ' + String(step + 1).padStart(2,'0') + ' / 03';
    el('trainingTitle').textContent = steps[step].title;
    el('trainingStory').textContent = steps[step].story;
    el('trainingScience').textContent = steps[step].science;
    el('trainingScience').parentElement.hidden = !steps[step].science;
    el('trainingRoute').innerHTML = steps.map((item,i) => '<span class="' + (i < step ? 'complete' : i === step ? 'current' : '') + '" ' + (i === step ? 'aria-current="step"' : '') + '><b>' + (i < step ? '✓' : i + 1) + '</b>' + item.name + '</span>').join('');
    const area = el('trainingExperiment');
    el('trainingFlight').hidden = step !== 2; area.hidden = step === 2;
    el('trainingFlightControls').hidden = step !== 2;
    el('trainingMissionGoal').hidden = step !== 0;
    if (step === 0) area.innerHTML = '<div class="mission-scene" aria-label="Uma nave-mãe ameaça a Terra; o interceptor a protege"><div class="mission-mothership"><span>NAVE-MÃE</span></div><i class="incoming-rock rock-one"></i><i class="incoming-rock rock-two"></i><div class="mission-interceptor">▲<span>VOCÊ / INTERCEPTOR</span></div><div class="mission-earth"></div><span class="mission-earth-label">TERRA / ÚLTIMA LINHA DE DEFESA</span></div>';
    if (step === 1) area.innerHTML = '<div class="security-overview"><div class="connection-map"><div class="station-node">TERRA<span>BASE DE COMANDO</span></div><div class="link-path ' + (activated ? 'online' : '') + '"><span>' + (activated ? 'CANAL PREPARADO' : 'CANAL EM ESPERA') + '</span></div><div class="station-node">NAVE<span>INTERCEPTOR Q-07</span></div></div><div class="security-flow"><span><b>QKD</b>Cria as chaves</span><i>→</i><span><b>Quantum Security</b>Monitora e gerencia</span><i>→</i><span><b>Rádio</b>Leva os comandos</span></div><button type="button" data-training-action="activate" ' + (activated ? 'disabled' : '') + '>' + (activated ? '✓ QUANTUM SECURITY ATIVO' : 'ATIVAR QUANTUM SECURITY') + '</button><p class="security-note">A física quântica ajuda a proteger a chave. Seus comandos continuam viajando pelo rádio.</p></div>';
    sync();
  }
  function enter(index) {
    step = index; last = 0; manualPause = false; feedback = ''; activated = false;
    simulation = index === 2 ? new TrainingSimulation() : null;
    el('trainingPauseNotice').hidden = true;
    say(index === 0 ? 'Meta: 1.000 pontos. Evite colisões com a nave e 12 impactos na Terra.' : index === 1 ? 'O Quantum Security acompanha os erros para ajudar a decidir quando uma nova chave é necessária.' : simulation.message);
    render(); el('trainingTitle').focus({ preventScroll: true });
    if (window.innerWidth <= 700) el('trainingStep').scrollIntoView({ block: 'start' });
  }
  function action(action) {
    if (!introActive || manualPause || step !== 1 || action !== 'activate' || activated) return;
    activated = true;
    say('Quantum Security ativo. Na missão, observe o QBER e use R quando precisar renovar a chave.');
    render(); el('trainingNext').focus({ preventScroll: true });
  }
  function draw() {
    if (!simulation) return;
    const canvas = el('trainingCanvas'), g = canvas.getContext('2d'), w = 700, laneW = 100, dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== 700 * dpr || canvas.height !== 400 * dpr) { canvas.width = 700 * dpr; canvas.height = 400 * dpr; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!backdrop) backdrop = makeSpaceBackdrop(w, 400);
    g.drawImage(backdrop, 0, 0, w, 400); g.strokeStyle = '#7895a825'; g.lineWidth = 1;
    for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(i * laneW, 35); g.lineTo(i * laneW, 360); g.stroke(); g.fillStyle = '#7d99ac'; g.font = '11px Consolas, monospace'; g.textAlign = 'center'; g.fillText(String(i + 1), (i + .5) * laneW, 25); }
    g.fillStyle = '#163746'; g.fillRect(0, 365, w, 35); g.strokeStyle = '#83ddcb'; g.beginPath(); g.moveTo(0, 365); g.lineTo(w, 365); g.stroke();
    g.fillStyle = '#b4cecc'; g.font = '10px Consolas, monospace'; g.fillText('TERRA / SIMULAÇÃO · TENTATIVAS LIVRES', w / 2, 388);
    for (const laser of simulation.lasers) { g.fillStyle = '#95ffe2'; g.fillRect((laser.lane + .5) * laneW - 2, laser.y - 10, 4, 20); }
    for (const a of simulation.asteroids) {
      const x = (a.lane + .5) * laneW, rock = g.createRadialGradient(x - 9, a.y - 9, 1, x, a.y, 25);
      rock.addColorStop(0, '#abbac3'); rock.addColorStop(1, '#354959'); g.fillStyle = rock;
      g.beginPath(); for (let i = 0; i < 9; i++) { const angle = i / 9 * Math.PI * 2, r = i % 2 ? 20 : 25; i ? g.lineTo(x + Math.cos(angle) * r, a.y + Math.sin(angle) * r) : g.moveTo(x + r, a.y); } g.closePath(); g.fill();
    }
    const x = (simulation.lane + .5) * laneW;
    drawInterceptor(g, x, 330, 20, simulation.regenerating ? '#91c7ff' : '#6ce8cd', simulation.time, false);
    if (step === 2 && simulation.asteroids.length && !simulation.complete) { const targetX = (simulation.asteroids[0].lane + .5) * laneW; g.strokeStyle = '#6ce8cd88'; g.strokeRect(targetX - 40, 305, 80, 50); }
  }
  function loop(timestamp) {
    if (!introActive) return;
    if (!document.hidden && simulation && !manualPause) simulation.update(last ? timestamp - last : 0);
    last = timestamp; draw(); sync(); frame = requestAnimationFrame(loop);
  }
  function pause() { if (!introActive || !simulation) return; manualPause = !manualPause; simulation.paused = manualPause; last = 0; el('trainingPauseNotice').hidden = !manualPause; sync(); }
  function move(direction) { if (simulation && introActive) { simulation.move(direction); sync(); draw(); } }
  function next() { if (!introActive || !completed() || manualPause) return; if (step < steps.length - 1) enter(step + 1); else { stop(); startDefense(); startGame(); } }
  function stop() { introActive = false; cancelAnimationFrame(frame); frame = 0; last = 0; }
  function start() {
    if (typeof isPlaying !== 'undefined' && (isPlaying || finale)) return;
    stop(); arcadeActive = false;
    el('title').style.display = 'none'; el('arcade').style.display = 'none'; el('intro').hidden = false; el('intro').style.display = 'flex';
    introActive = true; enter(0); frame = requestAnimationFrame(loop);
  }
  el('trainingExperiment').addEventListener('click', event => { const target = event.target.closest('[data-training-action]'); if (target && !target.disabled) action(target.dataset.trainingAction); });
  el('trainingNext').addEventListener('click', next);
  el('trainingBack').addEventListener('click', () => { if (introActive && step > 0) enter(step - 1); });
  el('trainingRestart').addEventListener('click', () => { if (introActive) enter(0); });
  el('trainingHome').addEventListener('click', event => { event.preventDefault(); stop(); el('intro').hidden = true; el('intro').style.display = 'none'; el('title').style.display = ''; window.dispatchEvent(new Event('resize')); el('titleBtn').focus(); });
  el('trainingPause').addEventListener('click', pause);
  el('trainingLeft').addEventListener('click', () => move(-1)); el('trainingRight').addEventListener('click', () => move(1));
  el('trainingRegen').addEventListener('click', () => { if (simulation) { simulation.regenerate(); sync(); } });
  document.addEventListener('keydown', event => {
    if (!introActive) { if (event.code === 'Enter' && el('title').style.display !== 'none' && !event.defaultPrevented && !event.target.closest('button, a')) { event.preventDefault(); start(); } return; }
    if (event.target.closest('button, a') && (event.code === 'Enter' || event.code === 'Space')) return;
    if (event.code === 'Escape') { event.preventDefault(); pause(); }
    if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(event.code) && simulation) { event.preventDefault(); move(['ArrowLeft', 'KeyA'].includes(event.code) ? -1 : 1); }
    if (event.code === 'KeyR' && simulation) { event.preventDefault(); simulation.regenerate(); sync(); }
    if (event.code === 'Enter' && !event.repeat) { event.preventDefault(); next(); }
  });
  window.addEventListener('blur', () => { if (introActive && simulation && !manualPause) pause(); });
  document.addEventListener('visibilitychange', () => { last = 0; if (document.hidden && introActive && simulation && !manualPause) pause(); });
  return { start, stop };
})();
function startIntro() { tutorial.start(); }
function restartStory() { startIntro(); }
