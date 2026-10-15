/* Diálogo original antes da preparação, ciência opcional e guia rápido. */
let introActive = false;
const openingDialogue = [
  [
    "DR. ÍRIS · CIENTISTA QUÂNTICA",
    "Tenente! Ainda bem que chegou. A frota alienígena acabou de atacar a Terra, e a nossa nave defensora já está em órbita."
  ],
  [
    "TENENTE · VOCÊ",
    "Me avisaram no caminho. Pelo que entendi, eu vou pilotar essa nave, certo?"
  ],
  [
    "DR. ÍRIS · CIENTISTA QUÂNTICA",
    "Certo, mas daqui da base, por rádio. Você comanda tudo à distância."
  ],
  [
    "TENENTE · VOCÊ",
    "Por rádio? Isso me preocupa, Doutora. E se os alienígenas escutarem os comandos ou mandarem ordens falsas para a nave?"
  ],
  [
    "DR. ÍRIS · CIENTISTA QUÂNTICA",
    "É exatamente a preocupação certa: eles podem tentar. Por isso cada comando precisa ser trancado com uma chave secreta, que só a Terra e a nave conheçam. E a física quântica permite criar essa chave."
  ],
  [
    "TENENTE · VOCÊ",
    "Física quântica? Confesso que sempre achei isso coisa de filme."
  ],
  [
    "DR. ÍRIS · CIENTISTA QUÂNTICA",
    "Calma, é mais simples do que parece. Pense numa moeda: um bit comum é uma moeda parada na mesa, cara ou coroa. Um qubit é uma moeda girando no ar: só sabemos o lado quando ela cai e é medida."
  ],
  [
    "TENENTE · VOCÊ",
    "Até aí eu acompanho. E como isso vira uma chave?"
  ],
  [
    "DR. ÍRIS · CIENTISTA QUÂNTICA",
    "Com partículas entrelaçadas. Imagine duas moedas que sempre caem iguais, mesmo muito longe uma da outra. Cada uma, sozinha, parece sorteio, mas os resultados combinam. Esses resultados iguais e aleatórios formam a nossa chave. É só uma analogia: a física real é mais sutil."
  ],
  [
    "TENENTE · VOCÊ",
    "Então ninguém precisa mandar a chave pelo rádio."
  ],
  [
    "DR. ÍRIS · CIENTISTA QUÂNTICA",
    "Exatamente: ela nasce nos dois lados ao mesmo tempo."
  ],
  [
    "TENENTE · VOCÊ",
    "E se um espião tentar espiar essas partículas?"
  ],
  [
    "DR. ÍRIS · CIENTISTA QUÂNTICA",
    "Aí a física nos ajuda: espiar é medir, e medir perturba, como parar a moeda no ar. Os resultados deixam de combinar, e a gente percebe. Vamos testar tudo isso no console?"
  ],
  [
    "TENENTE · VOCÊ",
    "Vamos nessa, estou pronto!"
  ]
];
const tutorial = (() => {
  const el = id => document.getElementById(id);
  const steps = [
    {name:'A missão',title:'Antes da primeira onda.',story:'Conversa concluída · Prepare a conexão e confira os controles.',lines:[],task:'Defenda a Terra pelos oito setores e vença seus guardiões para carregar o canhão orbital.',science:'A conversa original usa analogias: um qubit não é uma moeda em rotação. As correlações não criam uma chave instantaneamente nem transmitem informação à distância; são necessárias muitas medições, comparações pelo canal clássico e processamento.',next:'PREPARAR A CHAVE →'},
    {name:'A chave',title:'Uma demonstração do canal.',story:'Equipamentos QKD · Um par ilustrativo antes de preparar a conexão.',lines:[],task:'Meça o par de demonstração e observe os resultados.',science:'Um bit vale 0 ou 1. Um qubit pode estar em superposição, mas cada medição fornece um resultado. O par mostrado é uma ilustração de correlações em uma configuração compatível. E91 envolve muitos pares, verificações e processamento; este par sozinho não gera uma chave segura.',next:'ATIVAR A CONEXÃO →'},
    {name:'Quantum Security',title:'Conexão com o Q-07.',story:'Quantum Security · Monitoramento e gestão das chaves da missão.',lines:[],task:'Ative o Quantum Security para liberar os comandos do interceptor.',science:'QBER mede os erros dos bits comparados. Espionagem e ruído podem elevar essa taxa; um alerta não identifica sozinho a causa. Quantum Security é uma proposta acadêmica de monitoramento e gestão das chaves produzidas por equipamentos QKD. As ordens continuam viajando por rádio clássico, cifradas e autenticadas. Uma chave nova não elimina a fonte de ruído.',next:'GUIA RÁPIDO E TREINO →'},
    {name:'Guia rápido',title:'Teste antes de assumir a defesa.',story:'Simulador conectado · Intercepte, desvie e renove sem risco.',lines:[],task:'',science:'H, Bell, coerência, síndrome e interferência são explicados nos briefings e experimentos opcionais. As cápsulas, a inversão e os poderes da nave são analogias jogáveis, não um equipamento quântico real.',next:'INICIAR DEFESA →'}
  ];
  const flightStep = steps.length - 1;
  let step = 0, frame = 0, last = 0, simulation = null, dialogueIndex = -1;
  let activated = false, measured = null, feedback = '', backdrop = null, manualPause = false, flightFocused=false;
  function say(text) { feedback = text; el('trainingFeedback').textContent = controlText(text); }
  function completed() { return step === 0 || (step === 1 ? measured !== null : step === 2 ? activated : !!simulation?.complete); }
  function sync() {
    const complete = completed();
    el('trainingNext').disabled = !complete || manualPause;
    el('trainingNext').textContent = steps[step].next;
    el('trainingObjective').textContent = controlText(simulation ? simulation.objective : steps[step].task);
    el('trainingProgress').value = step + (complete ? 1 : 0);
    el('trainingPause').hidden = step !== flightStep;
    el('trainingPause').textContent = manualPause ? '▶ Retomar' : 'Ⅱ Pausar';
    el('trainingBack').disabled = step === 0;
    if (simulation) {
      el('trainingQber').textContent = simulation.qber.toFixed(1) + '%';
      el('trainingScore').textContent = simulation.score + ' pts';
      el('trainingChannel').textContent = simulation.regenerating ? 'RENOVANDO · ' + ((simulation.regenEnd - simulation.time) / 1000).toFixed(1) + ' s' : simulation.pulse&&!simulation.pulse.fired?'A FIXA · '+Math.max(0,(simulation.pulse.at-simulation.time)/1000).toFixed(1)+' s':simulation.qber>0?'RESPIRO · '+keyLabel('regen')+' PRONTA':'CANAL SEGURO';
      el('trainingRegen').disabled = simulation.score === 0 || simulation.regenerating || manualPause || complete;
      if (simulation.message !== feedback) say(simulation.message);
    }
  }
  function render() {
    el('trainingStep').textContent = 'CENA ' + String(step + 1).padStart(2,'0') + ' / 04';
    el('trainingTitle').textContent = steps[step].title;
    el('trainingStory').textContent = steps[step].story;
    const conversation = el('trainingDialogue');
    conversation.replaceChildren();conversation.hidden=!steps[step].lines.length;
    for (const [speaker, text] of steps[step].lines) {
      const turn = document.createElement('div');
      turn.className = 'story-turn' + (speaker === 'Tenente' ? ' story-pilot' : '');
      const name = document.createElement('b'), line = document.createElement('p');
      name.textContent = speaker === 'Tenente' ? 'TENENTE / VOCÊ' : 'DR. ÍRIS / COMANDO'; line.textContent = controlText(text);
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
    el('trainingQuickGuide').hidden = step !== flightStep;
    el('trainingQuickSteps').innerHTML = [
      'Mova com ← → ou A / D; segure para atravessar as nove trilhas. A nave atira sozinha.',
      'Saia das faixas A/B/C antes de zerar. Nuvens e pulsos elevam QBER; acima de '+GameRules.channel.limit+'%, os comandos podem inverter. H amplia tiros; + ajuda o canal.',
      describeRegeneration('R')+' Procure uma posição livre ou o RESPIRO.',
      'Resolva três encontros e vença o guardião de cada setor. '+GameRules.maxImpacts+' impactos na Terra encerram a missão; o escudo absorve um golpe. Esc pausa. Na derrota, tente novamente.'
    ].map(text=>'<li>'+controlText(text)+'</li>').join('');
    if (step === 0) area.innerHTML = '<div class="mission-scene" aria-label="Uma nave-mãe ameaça a Terra; o interceptor a protege"><div class="mission-mothership"><span>NAVE-MÃE</span></div><i class="incoming-rock rock-one"></i><i class="incoming-rock rock-two"></i><div class="mission-interceptor">▲<span>VOCÊ / INTERCEPTOR</span></div><div class="mission-earth"></div><span class="mission-earth-label">TERRA / ÚLTIMA LINHA DE DEFESA</span></div>';
    if (step === 1) area.innerHTML = '<div class="story-pair"><div class="panel-label">UM PAR ENTRELAÇADO / ILUSTRAÇÃO</div><div class="pair-stations ' + (measured !== null ? 'measured' : '') + '"><div><span>TERRA</span><b>' + (measured ?? '?') + '</b><small>' + (measured !== null ? 'Resultado local' : 'Qubit A') + '</small></div><i aria-hidden="true">⟷</i><div><span>Q-07</span><b>' + (measured ?? '?') + '</b><small>' + (measured !== null ? 'Resultado local' : 'Qubit B') + '</small></div></div><p class="pair-caption">' + (measured !== null ? 'Nesta ilustração, o par produz bits iguais. Uma chave exige muitos pares, testes e processamento.' : 'Cada medição dará 0 ou 1. O “?” indica que ainda não medimos; não representa o estado completo do qubit.') + '</p><button type="button" data-training-action="measure" ' + (measured !== null ? 'disabled' : '') + '>' + (measured !== null ? '✓ PAR MEDIDO' : 'MEDIR UM PAR') + '</button><p class="security-note">Medições e correlações são ilustradas pelo jogo. Entrelaçamento não transmite mensagens instantâneas.</p></div>';
    if (step === 2) area.innerHTML = '<div class="security-overview"><div class="connection-map"><div class="station-node">TERRA<span>BASE DE COMANDO</span></div><div class="link-path ' + (activated ? 'online' : '') + '"><span>' + (activated ? 'CANAL PREPARADO' : 'CANAL EM ESPERA') + '</span></div><div class="station-node">NAVE<span>INTERCEPTOR Q-07</span></div></div><div class="security-flow"><span><b>QKD</b>Cria as chaves</span><i>→</i><span><b>Quantum Security</b>Monitora e gerencia</span><i>→</i><span><b>Rádio</b>Leva os comandos</span></div><div class="story-channel-status ' + (activated ? 'online' : '') + '"><span>' + (activated ? '✓ CHAVE VALIDADA' : 'AGUARDANDO ATIVAÇÃO') + '</span><b>' + (activated ? 'QBER 3,2% · EXEMPLO' : 'CONEXÃO BLOQUEADA') + '</b></div><button type="button" data-training-action="activate" ' + (activated ? 'disabled' : '') + '>' + (activated ? '✓ QUANTUM SECURITY ATIVO' : 'ATIVAR QUANTUM SECURITY') + '</button><p class="security-note">QKD usa equipamentos quânticos próprios. Esta comunicação não exige um computador quântico universal.</p></div>';
    sync();
  }
  function enter(index) {
    el('trainingScienceDetails').open=false;
    step = index; last = 0; manualPause = false; feedback = ''; activated = false; measured = null;flightFocused=false;
    gameAudio.stopEffects(); gameAudio.setPaused('training', false); gameAudio.setScene(index === flightStep ? 'tutorial' : 'story');
    simulation = index === flightStep ? new TrainingSimulation((name, options) => {
      if (name === 'regenStart') gameAudio.startLoop('regen');
      else if(name==='regenCancel'){gameAudio.stopLoop('regen');gameAudio.sfx('shieldHit');}
      else { if (name === 'regenReady') gameAudio.stopLoop('regen'); gameAudio.sfx(name, options); }
    }) : null;
    el('trainingPauseNotice').hidden = true;
    say(['Íris: segure a defesa até o canhão completar a carga. Eu acompanho o canal com você.', 'Íris: confira a demonstração. Depois liberamos a conexão com o Q-07.', 'Íris: Quantum Security aguardando ativação. O Q-07 está pronto para receber suas ordens.', simulation?.message][index]);
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
    if(simulation.pulse&&!simulation.pulse.fired){
      for(const lane of simulation.pulse.lanes){g.fillStyle='#ef79762a';g.fillRect(lane*laneW+3,45,laneW-6,315);g.strokeStyle='#ef7976';g.strokeRect(lane*laneW+3,45,laneW-6,315);g.fillStyle='#efaaa2';g.font='12px Consolas,monospace';g.fillText('A FIXA',(lane+.5)*laneW,65);}
    }
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
    if(dialogueIndex>=0){frame=requestAnimationFrame(loop);return;}
    if (!document.hidden && simulation && !manualPause) simulation.update(last ? timestamp - last : 0);
    last = timestamp; draw(); sync(); frame = requestAnimationFrame(loop);
  }
  function pause() { if (!introActive || !simulation) return; manualPause = !manualPause; simulation.clearInput();simulation.paused = manualPause; gameAudio.setPaused('training', manualPause); last = 0; el('trainingPauseNotice').hidden = !manualPause; sync(); }
  function move(direction) { if (simulation && introActive) { simulation.move(direction); sync(); draw(); } }
  function revealFlight(){
    if(!flightFocused&&!manualPause&&window.innerWidth<=700){el('trainingFlight').scrollIntoView({block:'center'});flightFocused=true;}
  }
  function next() { if(dialogueIndex>=0)return; if (!introActive || !completed() || manualPause) return; if (step < steps.length - 1) { enter(step + 1); gameAudio.sfx('ui'); } else { stop(); startDefense(); startGame(); } }
  function stop() { simulation?.clearInput();dialogueIndex=-1;el('storyPrelude').hidden=true;introActive = false; cancelAnimationFrame(frame); frame = 0; last = 0; gameAudio.stopEffects(); gameAudio.setPaused('training', false); }
  function start() {
    if (typeof isPlaying !== 'undefined' && (isPlaying || finale)) return;
    stop(); arcadeActive = false;
    el('title').style.display = 'none'; el('arcade').style.display = 'none'; el('intro').hidden = false; el('intro').style.display = 'flex';
    introActive = true; simulation=null;showDialogue(0);el('openingLine').focus({preventScroll:true}); frame = requestAnimationFrame(loop);
  }
  function showDialogue(index){
    dialogueIndex=Math.max(0,Math.min(openingDialogue.length-1,index));simulation=null;
    el('storyPrelude').hidden=false;el('trainingPreparation').hidden=true;
    const [speaker,line]=openingDialogue[dialogueIndex];
    el('openingSpeaker').textContent=speaker;el('openingLine').textContent=line;
    el('openingCount').textContent=(dialogueIndex+1)+' / '+openingDialogue.length;
    el('openingProgress').max=openingDialogue.length;el('openingProgress').value=dialogueIndex+1;
    el('openingBack').disabled=dialogueIndex===0;
    el('openingNext').textContent=dialogueIndex===openingDialogue.length-1?'IR PARA A PREPARAÇÃO →':'PRÓXIMA FALA →';
    el('storyPrelude').dataset.speaker=speaker.startsWith('TENENTE')?'pilot':'scientist';
    gameAudio.setScene('story');
  }
  function beginPreparation(){if(!introActive)return;dialogueIndex=-1;el('storyPrelude').hidden=true;el('trainingPreparation').hidden=false;enter(0);}
  function advanceDialogue(){if(!introActive||dialogueIndex<0)return;gameAudio.sfx('ui');if(dialogueIndex===openingDialogue.length-1)beginPreparation();else showDialogue(dialogueIndex+1);}
  function returnHome(){stop();gameAudio.setScene('menu');el('intro').hidden=true;el('intro').style.display='none';el('title').style.display='';window.dispatchEvent(new Event('resize'));el('titleBtn').focus();}
  el('openingNext').addEventListener('click',advanceDialogue);
  el('openingBack').addEventListener('click',()=>{if(introActive&&dialogueIndex>0)showDialogue(dialogueIndex-1);});
  el('openingHome').addEventListener('click',returnHome);
  el('trainingExperiment').addEventListener('click', event => { const target = event.target.closest('[data-training-action]'); if (target && !target.disabled) action(target.dataset.trainingAction); });
  el('trainingNext').addEventListener('click', next);
  el('trainingBack').addEventListener('click', () => { if (introActive && step > 0) enter(step - 1); });
  el('trainingRestart').addEventListener('click', () => { if (introActive) {dialogueIndex=-1;enter(0);} });
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
    if(typeof settingsOpen!=='undefined'&&settingsOpen)return;
    if(event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,select,textarea'))return;
    if(typeof quickGuideOpen!=='undefined'&&quickGuideOpen)return;
    if (!introActive) { if (event.code === 'Enter' && el('title').style.display !== 'none' && !event.defaultPrevented && !event.target.closest('button, a')) { event.preventDefault(); start(); } return; }
    if(dialogueIndex>=0){
      if(event.code==='Enter'){
        if(event.repeat)event.preventDefault();
        else if(!event.target.closest('button,a,summary')){event.preventDefault();advanceDialogue();}
      }
      return;
    }
    if (event.target.closest('summary')&&(event.code==='Enter'||event.code==='Space'))return;
    if (event.target.closest('button, a') && (event.code === 'Enter' || event.code === 'Space')) return;
    if (event.code === 'Escape' && !event.repeat) { event.preventDefault(); pause(); }
    if (movementDirection(event.code) && simulation) { event.preventDefault();revealFlight();simulation.press('key:'+event.code,movementDirection(event.code)); }
    if (regenerationKey(event.code) && simulation) { event.preventDefault();revealFlight();simulation.regenerate(); sync(); }
    if (event.code === 'Enter' && !event.repeat) { event.preventDefault(); next(); }
  });
  document.addEventListener('keyup',event=>simulation?.release('key:'+event.code));
  window.addEventListener('blur', () => { if (introActive && simulation && !manualPause) pause(); });
  document.addEventListener('visibilitychange', () => { last = 0; if (document.hidden && introActive && simulation && !manualPause) pause(); });
  return { start, stop, beginPreparation, refreshControls(){if(dialogueIndex>=0)return;render();el('trainingFeedback').textContent=controlText(feedback);}, suspendForSettings(){const resume=!!(introActive&&simulation&&!manualPause);if(resume)pause();return resume;},resumeFromSettings(){if(introActive&&simulation&&manualPause)pause();} };
})();
function startIntro() { tutorial.start(); }
function restartStory() { startIntro(); }
