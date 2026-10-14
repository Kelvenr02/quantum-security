/* Quatro cenas: a ameaça dá sentido à ciência e a ciência prepara a pilotagem. */
let introActive = false;
const tutorial = (() => {
  const el = id => document.getElementById(id);
  const steps = [
    { name: 'O chamado', title: 'Tenente, a Terra está sob ataque.', story: '2090 · Base de Comando Orbital. O radar acaba de detectar a primeira onda.',
      lines: [['Íris', 'A nave-mãe está lançando asteroides contra a Terra. Nosso interceptor Q-07 já está em órbita. Precisamos de você nos controles.'], ['Tenente', 'Vou pilotar daqui da base? E o piloto automático?'], ['Íris', 'Sim, por rádio. Eles mudam de tática; precisamos das suas decisões. O sistema cuida dos disparos, e você escolhe onde interceptar. O canhão carrega enquanto você resolve três encontros em cada setor; cada destruição rende pontos. Vença os oito guardiões para liberar o disparo final.']],
      task: 'Sua missão: proteger a Terra e sobreviver até o canhão carregar.', science: '', next: 'ASSUMIR O COMANDO →' },
    { name: 'A chave', title: 'E se o inimigo ouvir?', story: 'Q-07 aguardando conexão · Antes de pilotar, precisamos proteger as ordens.',
      lines: [['Tenente', 'Se os comandos vão pelo rádio, os invasores podem escutar ou mandar ordens falsas?'], ['Íris', 'Por isso usamos cifragem e autenticação com chaves secretas. Um bit vale 0 ou 1. Um qubit pode combinar os estados de 0 e 1 numa superposição; ao medir, sai apenas um resultado.'], ['Íris', 'Nossa distribuição quântica de chaves, ou QKD, usa a ideia do protocolo E91: partículas entrelaçadas compartilham um estado e têm resultados correlacionados. Testamos parte das medições e processamos o restante para obter uma chave compartilhada. Veja um par no painel.']],
      task: 'Meça o par de demonstração e observe os resultados na Terra e na nave.', science: '', next: 'PROTEGER O CANAL →' },
    { name: 'O canal', title: 'Uma chave. Dois lados seguros.', story: 'Quantum Security · Central de gestão e monitoramento das chaves.',
      lines: [['Tenente', 'E como vamos perceber uma tentativa de roubar a chave?'], ['Íris', 'Espionar as partículas pode alterar suas correlações. Verificamos os erros pelo QBER, a taxa de erro dos bits comparados. Ruído e decoerência — perda de propriedades quânticas pela interação com o ambiente — também geram erros. Um alerta não prova espionagem.'], ['Íris', 'O Quantum Security monitora o canal e gerencia as chaves produzidas pelos equipamentos QKD. Se as verificações falham, descartamos aquela chave. A chave validada protege seus comandos, que continuam viajando pelo rádio.']],
      task: 'Ative o Quantum Security para liberar a conexão com o Q-07.', science: '', next: 'TESTAR A NAVE →' },
    { name: 'Decolagem', title: 'A última checagem é sua.', story: 'Simulador conectado · Um único alvo antes de assumir a defesa real.',
      lines: [['Íris', 'Mova nas nove trilhas com ← → ou A / D; segure para continuar. A nave atira sozinha. Desvie das nuvens roxas e dos pulsos espiões amarelos: eles elevam o QBER e não podem ser destruídos.'], ['Tenente', 'E, se o canal piorar, uso R para renovar a chave. Preciso escolher um momento seguro.'], ['Íris', 'Exato: por 2 s você fica parado e sem disparar; a recarga leva 10 s. No protocolo fictício do jogo, passar de 11% de QBER inverte os controles por até 4 s; R pode interromper se estiver disponível. Intercepte o alvo e teste uma renovação.']],
      task: '', science: 'Na missão: três encontros por fase, carga de 1.000 e 8 guardiões. O escudo absorve um golpe; outro sem escudo encerra a defesa, assim como 12 impactos na Terra. Esc pausa. Após uma derrota, você pode repetir a fase.', next: 'INICIAR DEFESA →' }
  ];
  const flightStep = steps.length - 1;
  let step = 0, frame = 0, last = 0, simulation = null;
  let activated = false, measured = null, feedback = '', backdrop = null, manualPause = false;
  function say(text) { feedback = text; el('trainingFeedback').textContent = text; }
  function completed() { return step === 0 || (step === 1 ? measured !== null : step === 2 ? activated : !!simulation?.complete); }
  function sync() {
    const complete = completed();
    el('trainingNext').disabled = !complete || manualPause;
    el('trainingNext').textContent = steps[step].next;
    el('trainingObjective').textContent = simulation ? simulation.objective : steps[step].task;
    el('trainingProgress').value = step + (complete ? 1 : 0);
    el('trainingPause').hidden = step !== flightStep;
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
    el('trainingStep').textContent = 'CENA ' + String(step + 1).padStart(2,'0') + ' / 04';
    el('trainingTitle').textContent = steps[step].title;
    el('trainingStory').textContent = steps[step].story;
    const conversation = el('trainingDialogue');
    conversation.replaceChildren();
    for (const [speaker, text] of steps[step].lines) {
      const turn = document.createElement('div');
      turn.className = 'story-turn' + (speaker === 'Tenente' ? ' story-pilot' : '');
      const name = document.createElement('b'), line = document.createElement('p');
      name.textContent = speaker === 'Tenente' ? 'TENENTE / VOCÊ' : 'DR. ÍRIS / COMANDO'; line.textContent = text;
      turn.append(name, line); conversation.append(turn);
    }
    el('trainingProgress').max = steps.length;
    el('trainingScience').textContent = steps[step].science;
    el('trainingScience').parentElement.hidden = !steps[step].science;
    el('trainingRoute').innerHTML = steps.map((item,i) => '<span class="' + (i < step ? 'complete' : i === step ? 'current' : '') + '" ' + (i === step ? 'aria-current="step"' : '') + '><b>' + (i < step ? '✓' : i + 1) + '</b>' + item.name + '</span>').join('');
    const area = el('trainingExperiment');
    el('trainingFlight').hidden = step !== flightStep; area.hidden = step === flightStep;
    el('trainingFlightControls').hidden = step !== flightStep;
    el('trainingMissionGoal').hidden = step !== 0;
    if (step === 0) area.innerHTML = '<div class="mission-scene" aria-label="Uma nave-mãe ameaça a Terra; o interceptor a protege"><div class="mission-mothership"><span>NAVE-MÃE</span></div><i class="incoming-rock rock-one"></i><i class="incoming-rock rock-two"></i><div class="mission-interceptor">▲<span>VOCÊ / INTERCEPTOR</span></div><div class="mission-earth"></div><span class="mission-earth-label">TERRA / ÚLTIMA LINHA DE DEFESA</span></div>';
    if (step === 1) area.innerHTML = '<div class="story-pair"><div class="panel-label">UM PAR ENTRELAÇADO / ILUSTRAÇÃO</div><div class="pair-stations ' + (measured !== null ? 'measured' : '') + '"><div><span>TERRA</span><b>' + (measured ?? '?') + '</b><small>' + (measured !== null ? 'Resultado local' : 'Qubit A') + '</small></div><i aria-hidden="true">⟷</i><div><span>Q-07</span><b>' + (measured ?? '?') + '</b><small>' + (measured !== null ? 'Resultado local' : 'Qubit B') + '</small></div></div><p class="pair-caption">' + (measured !== null ? 'Nesta ilustração, o par produz bits iguais. Uma chave exige muitos pares, testes e processamento.' : 'Cada medição dará 0 ou 1. O “?” indica que ainda não medimos; não representa o estado completo do qubit.') + '</p><button type="button" data-training-action="measure" ' + (measured !== null ? 'disabled' : '') + '>' + (measured !== null ? '✓ PAR MEDIDO' : 'MEDIR UM PAR') + '</button><p class="security-note">Medições e correlações são ilustradas pelo jogo. Entrelaçamento não transmite mensagens instantâneas.</p></div>';
    if (step === 2) area.innerHTML = '<div class="security-overview"><div class="connection-map"><div class="station-node">TERRA<span>BASE DE COMANDO</span></div><div class="link-path ' + (activated ? 'online' : '') + '"><span>' + (activated ? 'CANAL PREPARADO' : 'CANAL EM ESPERA') + '</span></div><div class="station-node">NAVE<span>INTERCEPTOR Q-07</span></div></div><div class="security-flow"><span><b>QKD</b>Cria as chaves</span><i>→</i><span><b>Quantum Security</b>Monitora e gerencia</span><i>→</i><span><b>Rádio</b>Leva os comandos</span></div><div class="story-channel-status ' + (activated ? 'online' : '') + '"><span>' + (activated ? '✓ CHAVE VALIDADA' : 'AGUARDANDO ATIVAÇÃO') + '</span><b>' + (activated ? 'QBER 3,2% · EXEMPLO' : 'CONEXÃO BLOQUEADA') + '</b></div><button type="button" data-training-action="activate" ' + (activated ? 'disabled' : '') + '>' + (activated ? '✓ QUANTUM SECURITY ATIVO' : 'ATIVAR QUANTUM SECURITY') + '</button><p class="security-note">QKD usa equipamentos quânticos próprios. Esta comunicação não exige um computador quântico universal.</p></div>';
    sync();
  }
  function enter(index) {
    step = index; last = 0; manualPause = false; feedback = ''; activated = false; measured = null;
    gameAudio.stopEffects(); gameAudio.setPaused('training', false); gameAudio.setScene(index === flightStep ? 'tutorial' : 'story');
    simulation = index === flightStep ? new TrainingSimulation((name, options) => {
      if (name === 'regenStart') gameAudio.startLoop('regen');
      else { if (name === 'regenReady') gameAudio.stopLoop('regen'); gameAudio.sfx(name, options); }
    }) : null;
    el('trainingPauseNotice').hidden = true;
    say(['Íris: segure a defesa até o canhão completar a carga. Eu acompanho o canal com você.', 'Íris: superposição e entrelaçamento também são recursos da computação quântica. Aqui os usamos para distribuir chaves.', 'Íris: a física ajuda a verificar a chave; cifragem e autenticação protegem as ordens.', simulation?.message][index]);
    render(); el('trainingTitle').focus({ preventScroll: true });
    if (window.innerWidth <= 700) el('trainingStep').scrollIntoView({ block: 'start' });
  }
  function action(action) {
    if (!introActive || manualPause) return;
    if (step === 1 && action === 'measure' && measured === null) {
      measured = Math.random() < .5 ? 0 : 1;
      say('Tenente: um resultado por lado. Íris: isso! Os padrões de correlação aparecem ao comparar muitos pares, não ao ler todos os resultados de um qubit.');
    } else if (step === 2 && action === 'activate' && !activated) {
      activated = true;
      say('Íris: chave validada neste exemplo. Quantum Security online. Agora vamos conferir os controles antes da primeira onda.');
    } else return;
    gameAudio.sfx('confirm');
    render(); el('trainingNext').focus({ preventScroll: true });
  }
  function draw() {
    if (!simulation) return;
    const canvas = el('trainingCanvas'), g = canvas.getContext('2d'), w = 700, laneW = w/simulation.lanes, dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== 700 * dpr || canvas.height !== 400 * dpr) { canvas.width = 700 * dpr; canvas.height = 400 * dpr; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!backdrop) backdrop = makeSpaceBackdrop(w, 400);
    g.drawImage(backdrop, 0, 0, w, 400); g.strokeStyle = '#7895a825'; g.lineWidth = 1;
    for (let i = 0; i < simulation.lanes; i++) { g.beginPath(); g.moveTo(i * laneW, 35); g.lineTo(i * laneW, 360); g.stroke(); g.fillStyle = '#7d99ac'; g.font = '11px Consolas, monospace'; g.textAlign = 'center'; g.fillText(String(i + 1), (i + .5) * laneW, 25); }
    g.fillStyle = '#163746'; g.fillRect(0, 365, w, 35); g.strokeStyle = '#83ddcb'; g.beginPath(); g.moveTo(0, 365); g.lineTo(w, 365); g.stroke();
    g.fillStyle = '#b4cecc'; g.font = '10px Consolas, monospace'; g.fillText('TERRA / SIMULAÇÃO · TENTATIVAS LIVRES', w / 2, 388);
    for (const laser of simulation.lasers) { g.fillStyle = '#95ffe2'; g.fillRect((laser.lane + .5) * laneW - 2, laser.y - 10, 4, 20); }
    for (const a of simulation.asteroids) {
      const x = (a.lane + .5) * laneW, rock = g.createRadialGradient(x - 9, a.y - 9, 1, x, a.y, 25);
      rock.addColorStop(0, '#abbac3'); rock.addColorStop(1, '#354959'); g.fillStyle = rock;
      g.beginPath(); for (let i = 0; i < 9; i++) { const angle = i / 9 * Math.PI * 2, r = i % 2 ? 20 : 25; i ? g.lineTo(x + Math.cos(angle) * r, a.y + Math.sin(angle) * r) : g.moveTo(x + r, a.y); } g.closePath(); g.fill();
    }
    const x = (simulation.position + .5) * laneW;
    drawInterceptor(g, x, 330, 20, simulation.regenerating ? '#91c7ff' : '#6ce8cd', simulation.time, false);
    if (simulation.asteroids.length && !simulation.complete) { const targetX = (simulation.asteroids[0].lane + .5) * laneW; g.strokeStyle = '#6ce8cd88'; g.strokeRect(targetX - 40, 305, 80, 50); }
  }
  function loop(timestamp) {
    if (!introActive) return;
    if (!document.hidden && simulation && !manualPause) simulation.update(last ? timestamp - last : 0);
    last = timestamp; draw(); sync(); frame = requestAnimationFrame(loop);
  }
  function pause() { if (!introActive || !simulation) return; manualPause = !manualPause; simulation.clearInput();simulation.paused = manualPause; gameAudio.setPaused('training', manualPause); last = 0; el('trainingPauseNotice').hidden = !manualPause; sync(); }
  function move(direction) { if (simulation && introActive) { simulation.move(direction); sync(); draw(); } }
  function next() { if (!introActive || !completed() || manualPause) return; if (step < steps.length - 1) { enter(step + 1); gameAudio.sfx('ui'); } else { stop(); startDefense(); startGame(); } }
  function stop() { simulation?.clearInput();introActive = false; cancelAnimationFrame(frame); frame = 0; last = 0; gameAudio.stopEffects(); gameAudio.setPaused('training', false); }
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
  el('trainingHome').addEventListener('click', event => { event.preventDefault(); stop(); gameAudio.setScene('menu'); el('intro').hidden = true; el('intro').style.display = 'none'; el('title').style.display = ''; window.dispatchEvent(new Event('resize')); el('titleBtn').focus(); });
  el('trainingPause').addEventListener('click', pause);
  for(const [id,direction] of [['trainingLeft',-1],['trainingRight',1]]) {
    const button=el(id);
    button.addEventListener('pointerdown',event=>{
      event.preventDefault();button.setPointerCapture?.(event.pointerId);
      if(introActive)simulation?.press('pointer:'+event.pointerId,direction);
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>simulation?.release('pointer:'+event.pointerId));
    button.addEventListener('click',event=>{if(!event.detail)move(direction);});
  }
  el('trainingRegen').addEventListener('click', () => { if (simulation) { simulation.regenerate(); sync(); } });
  document.addEventListener('keydown', event => {
    if (!introActive) { if (event.code === 'Enter' && el('title').style.display !== 'none' && !event.defaultPrevented && !event.target.closest('button, a')) { event.preventDefault(); start(); } return; }
    if (event.target.closest('button, a') && (event.code === 'Enter' || event.code === 'Space')) return;
    if (event.code === 'Escape') { event.preventDefault(); pause(); }
    if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(event.code) && simulation) { event.preventDefault(); simulation.press('key:'+event.code,['ArrowLeft', 'KeyA'].includes(event.code) ? -1 : 1); }
    if (event.code === 'KeyR' && simulation) { event.preventDefault(); simulation.regenerate(); sync(); }
    if (event.code === 'Enter' && !event.repeat) { event.preventDefault(); next(); }
  });
  document.addEventListener('keyup',event=>simulation?.release('key:'+event.code));
  window.addEventListener('blur', () => { if (introActive && simulation && !manualPause) pause(); });
  document.addEventListener('visibilitychange', () => { last = 0; if (document.hidden && introActive && simulation && !manualPause) pause(); });
  return { start, stop };
})();
function startIntro() { tutorial.start(); }
function restartStory() { startIntro(); }
