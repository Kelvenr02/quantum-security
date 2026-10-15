const assert=require('node:assert/strict');
const {QuantumBoss}=require('../boss-model.js');
const {makeGame}=require('./gameplay.cjs');
const results=[];
function test(name,fn){fn();results.push(name);}
function at(m,time){while(m.elapsed<time)m.advance(Math.min(20,time-m.elapsed),{lane:0,position:0});return m;}
function game(phase){const g=makeGame();g.run('level='+phase+';beginBoss();continuePhase();cancelAnimationFrame(rafId)');return g;}

test('Sentinela distingue espera, bloqueio, alvo vivo e relé destruído',()=>{
  const m=new QuantumBoss(1);assert.match(m.hint(0),/FECHADO/);at(m,2800);
  assert.match(m.hint(8),/BLOQUEADO/);assert.match(m.hint(0),/ATAQUE R1/);
  const n=m.targets(8)[0];assert.equal(m.targetStatus(n,8),'QBER ALTO');
  m.hp[0]=0;assert.match(m.hint(0),/RELÉ VALIDADO.*R2.*TRILHA 8/);
  assert.equal(m.targetStatus(m.targets()[0]),'FEITO');
});
test('Observador não revela a sonda antes da leitura; distingue seguir, fixar e abrir',()=>{
  const g=game(2);assert.match(g.elements.get('bossThreat').textContent,/SEGUE VOCÊ/);
  assert.doesNotMatch(g.elements.get('bossHint').textContent,/TRILHA/);
  g.run('for(let i=0;i<35;i++)boss.model.advance(20,{lane:4});updateBossHUD()');
  assert.match(g.elements.get('bossThreat').textContent,/A FIXA/);
  g.run('boss.model.time=2500;updateBossHUD()');assert.match(g.elements.get('bossHint').textContent,/✓ FECHADO/);
  g.run('boss.model.time=3100;updateBossHUD()');assert.match(g.elements.get('bossHint').textContent,/ATAQUE ✓/);
});
test('Tríade explica a espera quando apenas núcleos fechados continuam vivos',()=>{
  const m=at(new QuantumBoss(3),5000);m.hp=[8,0,8];
  assert.equal(m.targets().some(n=>n.open),false);
  assert.match(m.hint(0),/VIVOS FECHADOS.*Pontas abrem no próximo ciclo/);
  assert.doesNotMatch(m.hint(0),/ATAQUE/);
  const center=at(new QuantumBoss(3),3000);center.hp=[0,8,0];assert.match(center.hint(0),/MEIO FECHADO.*1\.0 s/);
});
test('Tríade informa alvos vivos e antecipa a mudança de formação',()=>{
  const m=at(new QuantumBoss(3),3000);m.hp[0]=0;
  assert.match(m.hint(0),/ATAQUE H · TRILHA 6/);assert.doesNotMatch(m.hint(0),/TRILHA 4\//);
  const pressure=new QuantumBoss(3);pressure.hp=[4,4,4];pressure.prepareRound(4);at(pressure,2500);
  assert.match(pressure.hint(0),/MUDANÇA.*contornos azuis/);
});
test('Bell conta acertos restantes e anuncia o próximo lado após esgotar a abertura',()=>{
  const m=at(new QuantumBoss(4),2800);let n=m.targets().find(n=>n.open);
  assert.match(m.hint(0),/RESTAM 3/);
  for(let i=0;i<3;i++){assert.equal(m.hit(n.id,0,n.lane),true);if(i<2)at(m,m.elapsed+200);}
  assert.match(m.hint(0),/COTA ATINGIDA.*TRILHA 8/);assert.equal(m.targets().some(n=>n.open),false);
  at(m,4500);assert.match(m.hint(0),/Próximo BELL: TRILHA 8/);
  at(m,4700);assert.match(m.hint(0),/TRILHA 8.*RESTAM 3/);
});
test('Coerência informa recuperação, saída para atacar e bloqueio abaixo de 50%',()=>{
  for(const phase of [5,8]){
    const g=game(phase);g.run('if(level===8){boss.model.hp=[24];boss.model.prepareRound(4);}boss.model.time=3000;boss.model.coherence=45;updateBossHUD()');
    assert.equal(g.elements.get('bossCoherence').hidden,false);assert.equal(g.elements.get('bossCoherence').value,45);
    assert.match(g.elements.get('bossHint').textContent,/SEM DANO.*RECUPERAR/);
    g.run('boss.model.coherence=80;boss.model.inZone=true;updateBossHUD()');assert.match(g.elements.get('bossHint').textContent,/RECUPERE/);
    g.run('boss.model.coherence=95;updateBossHUD()');assert.match(g.elements.get('bossHint').textContent,/ATAQUE.*Depois volte/);
  }
});
test('Síndrome distingue módulo correto, módulo concluído e próxima leitura',()=>{
  const m=at(new QuantumBoss(6),2800),selected=m.targets().find(n=>n.open);
  assert.match(m.hint(0),/ATAQUE MÓDULO \+/);assert.equal(m.targetStatus(selected),'+ ATIVO');
  m.hp[selected.id]=0;assert.match(m.hint(0),/MÓDULO CORRIGIDO/);
  assert.equal(m.targetStatus(m.targets().find(n=>n.id===selected.id)),'FEITO');
  m.hp=[2,2,2];m.prepareRound(4);at(m,3500);assert.match(m.hint(0),/próximo MÓDULO \+/);
});
test('Interferômetro prioriza só a próxima salva e atualiza A para B para C',()=>{
  const g=game(7);g.run('boss.model.hp=[10];boss.model.prepareRound(4);boss.model.time=1800;updateBossHUD()');
  assert.match(g.elements.get('bossThreat').textContent,/A FIXA/);assert.doesNotMatch(g.elements.get('bossThreat').textContent,/B.*s/);
  g.run('boss.model.time=2300;boss.model.pulses[0].fired=true;updateBossHUD()');assert.match(g.elements.get('bossThreat').textContent,/B FIXA/);
  g.run('boss.model.time=4100;boss.model.pulses[1].fired=true;updateBossHUD()');assert.match(g.elements.get('bossThreat').textContent,/C FIXA/);
});
test('Nave-mãe mantém estágio, objetivo e barra de coerência consistentes',()=>{
  const g=game(8);
  for(const [hp,stage,pattern]of [[36,1,/BELL/],[24,2,/COERÊNCIA/],[12,3,/MÓDULO/]]){
    g.run('boss.model.hp=['+hp+'];boss.model.prepareRound(4);boss.model.time=boss.model.roundStart+3000;updateBossHUD()');
    assert.match(g.elements.get('bossHealth').textContent,new RegExp(stage+'/3'));
    assert.match(g.elements.get('bossHint').textContent,pattern);
    assert.equal(g.elements.get('bossCoherence').hidden,stage!==2);
  }
});
test('Respiro lembra o custo de R; recarga e vitória não anunciam ações indisponíveis',()=>{
  const g=game(1);g.run('boss.model.time=6000;boss.model.pulses.forEach(p=>p.fired=true);qber=8;updateBossHUD()');
  assert.match(g.elements.get('bossThreat').textContent,/RESPIRO.*2 s parado/);
  g.run('keyReadyAt=gameTime+2000;updateBossHUD()');assert.match(g.elements.get('bossThreat').textContent,/R em 2\.0 s/);
  g.run('boss.model.hp=[0,0,0];updateBossHUD()');assert.match(g.elements.get('bossThreat').textContent,/VITÓRIA/);
});
test('Pausa consulta os mesmos três passos sem alterar chefe, recursos ou relógios',()=>{
  for(let phase=1;phase<=8;phase++){
    const g=game(phase);g.run('qber=8;gameTime=1000;keyReadyAt=5000');
    const before=g.run('JSON.stringify({m:boss.model,gameTime,qber,keyReadyAt,hullShield,pickups})');
    g.press('Escape');assert.equal(g.run('isPaused'),true);
    assert.equal(g.elements.get('pauseGuideTitle').textContent,g.run('boss.model.definition.name'));
    assert.equal((g.elements.get('pauseGuideSteps').innerHTML.match(/<li>/g)||[]).length,3);
    assert.equal(g.elements.get('pauseGuideState').textContent.replace(/^ESTÁGIO 1\/3 · /,''),g.run('boss.model.hint(qber)'));
    g.run('update(5000)');g.press('Escape');
    assert.equal(g.run('JSON.stringify({m:boss.model,gameTime,qber,keyReadyAt,hullShield,pickups})'),before);
    assert.equal(g.frames.size,1);
  }
});
test('Consultar os avisos não muda o modelo nem o sorteio da campanha',()=>{
  const g=game(8),before=g.run('JSON.stringify({m:boss.model,r:campaignRandom.snapshot()})');
  g.run('for(let i=0;i<100;i++){updateBossHUD();renderPauseGuide();drawBoss()}');
  assert.equal(g.run('JSON.stringify({m:boss.model,r:campaignRandom.snapshot()})'),before);
});
console.log(JSON.stringify({passed:results.length,tests:results},null,2));
