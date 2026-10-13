/* História, ciência e controles em um único treinamento interativo. */
let introActive = false;
const tutorial = (() => {
  const el = id => document.getElementById(id);
  const steps = [
    { name: 'Conectar', title: 'Primeiro, proteja os comandos.', story: 'Ano 2090. Uma frota lança asteroides contra a Terra. Você pilota da base; a Dr. Íris prepara o canal da nave.', task: 'Conecte os três sistemas na ordem indicada.', science: 'Quantum Security é o programa proposto no pitch: integra equipamentos QKD, monitora erros e gerencia chaves validadas. O rádio transmite os comandos cifrados e autenticados. QKD precisa de equipamentos próprios, não de um computador quântico universal.' },
    { name: 'Qubits', title: 'Construa e observe um estado.', story: 'Íris: antes de gerar nossa chave, experimente a diferença entre um bit e um qubit no laboratório.', task: 'Alterne o bit. Aplique H duas vezes; depois aplique H e meça.', science: 'Bits têm valor 0 ou 1. Qubits admitem superposição: a medição nesta base retorna apenas 0 ou 1. Portas como H manipulam amplitudes; duas H se desfazem por interferência. Isso permite algoritmos específicos, não acelera toda tarefa.' },
    { name: 'Chave', title: 'Uma chave precisa passar no teste.', story: 'Íris: Terra e nave medem pares entrelaçados, como na ideia do protocolo E91. Compare uma amostra e teste uma sonda espiã.', task: 'Meça os pares, simule espionagem e substitua a chave rejeitada.', science: 'Nesta demonstração ideal, medições dos pares na mesma base combinam. Isso não permite mensagens instantâneas. QBER é a proporção de resultados discordantes. Amostras públicas são descartadas; chaves reais exigem outras verificações e processamento. QKD também usa comunicação clássica autenticada.' },
    { name: 'Pilotar', title: 'Assuma o interceptor.', story: 'O canal está pronto. O radar acompanha os asteroides; o disparo automático deixa você livre para escolher a trilha.', task: 'Use ← → ou A / D e intercepte três asteroides.', science: 'Cada destruição vale 10 pontos. Alinhe a nave antes de a rocha chegar. Na missão, uma colisão direta destrói a nave; 12 asteroides na Terra encerram a defesa. Aqui você pode tentar novamente.' },
    { name: 'Canal', title: 'Reconheça o sinal de perigo.', story: 'Íris: nem todo erro é espionagem. O ambiente também degrada estados quânticos: é a decoerência. Teste os efeitos no Quantum Security.', task: 'Injete ruído e espionagem até passar de 11%. Mova durante a inversão; depois pressione R.', science: 'Nuvens: +3,5 pontos de QBER. Pulsos: +7. Acima de 11%, comandos invertidos por 4 s. Depois, R renova a chave: 2 s imóvel e sem disparar, recarga de 10 s. Asteroides continuam perigosos. Este limite e estas penalidades são regras fictícias da missão.' },
    { name: 'Recursos', title: 'Use a ajuda quântica.', story: 'Íris liberou cápsulas experimentais. Recolha-as com a nave e observe os efeitos no campo de treino.', task: 'Colete H e +; destrua o par azul e a rocha blindada.', science: 'H amplia os disparos por 6 s; + reduz 5 pontos de QBER e 3 s da recarga. O par azul é destruído em conjunto; o anel dourado exige dois acertos. São analogias: entrelaçamento não transmite ações, e correção quântica usa codificação e síndromes, não cópias de um qubit.' },
    { name: 'Decolar', title: 'Escolha sua rota de saída.', story: 'A frota se aproxima. Desvie da frente de ruído e leve o treinamento para as oito fases da defesa orbital.', task: 'Procure uma trilha sem faixa violeta. Depois, inicie a missão.', science: 'As faixas avisam a frente com 1,8 s de antecedência; três trilhas ficam livres. São uma metáfora de interferência. Na missão, alcance 1.000 pontos para carregar o canhão: o disparo final é automático. Esc pausa; trocar de janela também pausa o jogo.' }
  ];
  let step = 0, frame = 0, last = 0, simulation = null, experiment = null;
  let connected = 0, pairs = null, sampleState = 'empty', spyTested = false, replaced = false, done = false;
  let feedback = '', backdrop = null, manualPause = false;
  function say(text) { feedback = text; el('trainingFeedback').textContent = text; }
  function completed() {
    if (step === 0) return connected === 3;
    if (step === 1) return experiment.complete;
    if (step === 2) return done;
    return simulation.complete;
  }
  function sync() {
    const complete = completed();
    el('trainingNext').disabled = !complete || manualPause;
    el('trainingNext').textContent = step === 6 ? 'INICIAR DEFESA →' : 'PRÓXIMO SISTEMA →';
    el('trainingObjective').textContent = complete ? '✓ Objetivo concluído' : steps[step].task;
    el('trainingProgress').value = step + (complete ? 1 : 0);
    el('trainingPause').hidden = step < 3;
    el('trainingPause').textContent = manualPause ? '▶ Retomar' : 'Ⅱ Pausar';
    el('trainingBack').disabled = step === 0;
    if (simulation) {
      el('trainingQber').textContent = simulation.qber.toFixed(1) + '%';
      el('trainingScore').textContent = simulation.score + ' pts';
      const wait = Math.max(0, simulation.keyReadyAt - simulation.time) / 1000;
      el('trainingChannel').textContent = simulation.compromised ? 'COMANDOS INVERTIDOS · ' + ((simulation.compEnd - simulation.time) / 1000).toFixed(1) + ' s' : simulation.regenerating ? 'REGENERANDO · ' + ((simulation.regenEnd - simulation.time) / 1000).toFixed(1) + ' s' : wait > 0 ? 'CHAVE EM RECARGA · ' + wait.toFixed(1) + ' s' : 'CANAL SEGURO';
      el('trainingRegen').disabled = step !== 4 || simulation.compromised || simulation.regenerating || wait > 0 || !simulation.invertedMove || manualPause || complete;
      if (simulation.message && simulation.message !== feedback) say(simulation.message);
    }
  }
  const button = (action, text, extra = '') => '<button type="button" data-training-action="' + action + '" ' + extra + '>' + text + '</button>';
  function render() {
    el('trainingStep').textContent = 'SISTEMA ' + String(step + 1).padStart(2, '0') + ' / 07';
    el('trainingTitle').textContent = steps[step].title;
    el('trainingStory').textContent = steps[step].story;
    el('trainingScience').textContent = steps[step].science;
    el('trainingRoute').innerHTML = steps.map((item, i) => '<span class="' + (i < step ? 'complete' : i === step ? 'current' : '') + '" ' + (i === step ? 'aria-current="step"' : '') + '><b>' + (i < step ? '✓' : i + 1) + '</b>' + item.name + '</span>').join('');
    const area = el('trainingExperiment');
    el('trainingFlight').hidden = step < 3; area.hidden = step >= 3;
    el('trainingNoiseControls').hidden = step !== 4;
    el('trainingFlightControls').hidden = step < 3;
    el('trainingMissionGoal').hidden = step !== 6;
    if (step === 0) {
      area.innerHTML = '<div class="connection-map"><div class="station-node">TERRA<span>BASE DE COMANDO</span></div><div class="link-path ' + (connected === 3 ? 'online' : '') + '"><span>' + (connected === 3 ? 'SISTEMAS CONECTADOS' : 'CONEXÃO PENDENTE') + '</span></div><div class="station-node">NAVE<span>INTERCEPTOR Q-07</span></div></div><div class="system-modules">' + ['QKD · gerar chaves', 'Quantum Security · monitorar', 'Rádio · cifrar e autenticar'].map((label, i) => button('connect-' + i, '<span>' + (i < connected ? '✓' : '0' + (i + 1)) + '</span><b>' + label + '</b><small>' + ['Equipamentos ópticos nos dois pontos', 'Programa de gestão e alertas', 'Canal clássico autenticado'][i] + '</small>', i < connected ? 'disabled' : '')).join('') + '</div>';
    }
    if (step === 1) {
      const superposed = '+-'.includes(experiment.state), probability = state => superposed ? 50 : experiment.state === state ? 100 : 0;
      const label = superposed ? (experiment.state === '+' ? '(|0⟩ + |1⟩) / √2' : '(|0⟩ − |1⟩) / √2') : '|' + experiment.state + '⟩';
      area.innerHTML = '<div class="qubit-lab"><div class="bit-console"><span class="panel-label">COMPUTADOR CLÁSSICO</span><div class="bit-value">' + experiment.bit + '</div>' + button('bit', 'Alternar bit · 0 / 1') + '</div><div class="qubit-console"><span class="panel-label">LABORATÓRIO QUÂNTICO</span><div class="qubit-orbit ' + (superposed ? 'superposed' : '') + '"><span>0</span><i></i><span>1</span></div><b class="state-formula">' + label + '</b><div class="probability-bars">' + ['0', '1'].map(state => '<span>' + state + ' <i style="--prob:' + probability(state) + '%"></i>' + probability(state) + '%</span>').join('') + '</div><div class="experiment-actions">' + button('h', 'Aplicar H') + button('measure', 'Medir qubit') + '</div></div></div><div class="lab-checks"><span>' + (experiment.flipped ? '✓' : '○') + ' Bit alternado</span><span>' + (experiment.interfered ? '✓' : '○') + ' H + H observadas</span><span>' + (experiment.measured ? '✓' : '○') + ' Superposição medida</span></div>';
    }
    if (step === 2) {
      const row = (title, bits) => '<div class="sample-row"><b>' + title + '</b>' + (bits || Array(8).fill('·')).map((bit, i) => '<span class="' + (pairs && pairs.earth[i] !== pairs.ship[i] ? 'mismatch' : '') + '">' + bit + '</span>').join('') + '</div>';
      area.innerHTML = '<div class="key-console"><div class="key-heading"><span>QUANTUM SECURITY <small>VERIFICAÇÃO DO CANAL</small></span><b>' + (sampleState === 'empty' ? 'AGUARDANDO AMOSTRA' : sampleState === 'noisy' ? 'REJEITAR CHAVE · QBER 25%' : done ? 'CHAVE VALIDADA' : 'QBER 0% · AMOSTRA IDEAL') + '</b></div>' + row('TERRA', pairs && pairs.earth) + row('NAVE', pairs && pairs.ship) + '<p>Amostra pública de 8 pares na mesma base. Estes bits de teste não entram na chave secreta.</p><div class="experiment-actions">' + button('pairs', 'Medir pares', sampleState !== 'empty' ? 'disabled' : '') + button('spy', 'Simular espionagem', sampleState !== 'clean' || done || replaced ? 'disabled' : '') + button('replace', 'Descartar e renovar', sampleState !== 'noisy' ? 'disabled' : '') + button('validate', 'Validar chave', sampleState === 'empty' || done ? 'disabled' : '') + '</div></div>';
    }
    sync();
  }
  function enter(index) {
    step = index; last = 0; manualPause = false; feedback = '';
    connected = 0; experiment = new QubitExperiment(); pairs = null; sampleState = 'empty'; spyTested = false; replaced = false; done = false;
    simulation = index >= 3 ? new TrainingSimulation(index) : null;
    el('trainingPauseNotice').hidden = true;
    say(index < 3 ? steps[index].task : simulation.message || steps[index].task);
    render(); el('trainingTitle').focus({ preventScroll: true });
  }
  function action(action) {
    if (!introActive || manualPause) return;
    if (step === 0 && action.startsWith('connect-')) {
      const selected = Number(action.slice(-1));
      if (selected !== connected) { say('Primeiro ' + ['conecte os equipamentos QKD.', 'ative o Quantum Security para acompanhar a chave.', 'libere os comandos cifrados pelo rádio.'][connected]); return; }
      connected++;
      say(['QKD conectado: os equipamentos estabelecem chaves entre Terra e nave.', 'Quantum Security online: erros, alertas e chaves em uma só interface.', 'Rádio liberado: comandos cifrados e autenticados com chaves gerenciadas.'][connected - 1]);
    } else if (step === 1) {
      if (action === 'bit') { experiment.flip(); say('Bit clássico: agora vale ' + experiment.bit + '. Um valor definido a cada vez.'); }
      if (action === 'h') { const before = experiment.state; experiment.hadamard(); say('+-'.includes(before) ? 'A segunda H recombinou as amplitudes e retornou a |' + experiment.state + '⟩. Isso é interferência.' : 'H preparou uma superposição: 50% para cada resultado nesta base. Experimente outra H ou meça.'); }
      if (action === 'measure') { const before = experiment.state, result = experiment.measure(); say('+-'.includes(before) ? 'Medição: ' + result + '. Saiu um único bit; prepare outra superposição para repetir.' : 'Estado definido: a medição dá ' + result + '. Aplique H antes de medir para experimentar a superposição.'); }
    } else if (step === 2) {
      const generate = () => { const bits = Array.from({ length: 8 }, () => Math.random() < .5 ? 0 : 1); pairs = { earth: bits, ship: [...bits] }; sampleState = 'clean'; };
      if (action === 'pairs' && sampleState === 'empty') { generate(); say('Mesma base, resultados correlacionados. Agora teste uma sonda espiã.'); }
      if (action === 'spy' && sampleState === 'clean' && !replaced && !done) { pairs.ship[2] = 1 - pairs.ship[2]; pairs.ship[5] = 1 - pairs.ship[5]; sampleState = 'noisy'; spyTested = true; say('Dois de oito resultados discordam: QBER = 2 / 8 = 25%. O alerta revela perturbação; ruído também pode causar erros.'); }
      if (action === 'validate' && sampleState !== 'empty' && !done) {
        if (sampleState === 'noisy') say('Quantum Security recusou a chave. Descarte a tentativa e gere outra.');
        else if (!replaced || !spyTested) say('Antes de liberar os comandos, experimente a espionagem para reconhecer uma chave rejeitada.');
        else { done = true; say('Nova chave validada neste teste ideal. QKD fornece a chave; o rádio leva comandos cifrados e autenticados.'); }
      }
      if (action === 'replace' && sampleState === 'noisy') { generate(); replaced = true; say('Tentativa descartada. Outra amostra sem discordâncias: valide a nova chave.'); }
    }
    render();
    // Rerendering replaces experiment buttons: restore keyboard focus to the action or the next available one.
    const target = el('trainingExperiment').querySelector('[data-training-action="' + action + '"]:not(:disabled)') || el('trainingExperiment').querySelector('button:not(:disabled)');
    if (target) target.focus({ preventScroll: true });
    else if (completed()) el('trainingNext').focus({ preventScroll: true });
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
    if (simulation.front) {
      const front = simulation.front, warning = simulation.time < front.releaseAt;
      for (const lane of front.lanes) { g.fillStyle = warning ? '#b588ee22' : '#b588eec0'; g.fillRect(lane * laneW + 4, warning ? 40 : front.y - 10, laneW - 8, warning ? 320 : 20); if (warning) { g.fillStyle = '#c6a4ed'; g.fillText('RUÍDO', (lane + .5) * laneW, 290); } }
    }
    for (const laser of simulation.lasers) { g.fillStyle = '#95ffe2'; g.fillRect((laser.lane + .5) * laneW - 2, laser.y - 10, 4, 20); }
    const pair = simulation.asteroids.filter(a => a.group !== null);
    if (pair.length === 2) { g.strokeStyle = '#91c7ff'; g.setLineDash([4, 5]); g.beginPath(); g.moveTo((pair[0].lane + .5) * laneW, pair[0].y); g.lineTo((pair[1].lane + .5) * laneW, pair[1].y); g.stroke(); g.setLineDash([]); }
    for (const a of simulation.asteroids) {
      const x = (a.lane + .5) * laneW, rock = g.createRadialGradient(x - 9, a.y - 9, 1, x, a.y, 25);
      rock.addColorStop(0, '#abbac3'); rock.addColorStop(1, '#354959'); g.fillStyle = rock;
      g.beginPath(); for (let i = 0; i < 9; i++) { const angle = i / 9 * Math.PI * 2, r = i % 2 ? 20 : 25; i ? g.lineTo(x + Math.cos(angle) * r, a.y + Math.sin(angle) * r) : g.moveTo(x + r, a.y); } g.closePath(); g.fill();
      if (a.armored || a.group !== null) { g.strokeStyle = a.armored ? '#e6c491' : '#91c7ff'; g.beginPath(); g.arc(x, a.y, 30, 0, Math.PI * 2); g.stroke(); }
      if (a.armored) { g.fillStyle = '#e6c491'; g.fillText(a.hp + ' / 2', x, a.y - 38); }
    }
    for (const p of simulation.pickups) {
      const x = (p.lane + .5) * laneW; g.strokeStyle = p.type === 'hadamard' ? '#6ce8cd' : '#91c7ff'; g.fillStyle = '#112632';
      g.beginPath(); g.moveTo(x, p.y - 19); g.lineTo(x + 19, p.y); g.lineTo(x, p.y + 19); g.lineTo(x - 19, p.y); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = g.strokeStyle; g.font = 'bold 18px Consolas, monospace'; g.fillText(p.type === 'hadamard' ? 'H' : '+', x, p.y + 6);
    }
    const x = (simulation.lane + .5) * laneW;
    if (simulation.time < simulation.superpositionUntil) { g.globalAlpha = .25; for (const lane of [simulation.lane - 1, simulation.lane + 1]) if (lane >= 0 && lane < 7) drawInterceptor(g, (lane + .5) * laneW, 330, 20, '#6ce8cd', simulation.time); g.globalAlpha = 1; }
    drawInterceptor(g, x, 330, 20, simulation.regenerating ? '#91c7ff' : '#6ce8cd', simulation.time, simulation.compromised);
    if (step === 3 && simulation.asteroids.length && !simulation.complete) { const targetX = (simulation.asteroids[0].lane + .5) * laneW; g.strokeStyle = '#6ce8cd88'; g.strokeRect(targetX - 40, 305, 80, 50); }
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
  el('trainingNoiseControls').addEventListener('click', event => { const target = event.target.closest('[data-noise]'); if (target && simulation) { simulation.noise(target.dataset.noise); sync(); } });
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
