/* Piloto de regressão: uma mudança de trilha a cada 160 ms, disparos e colisões reais.
 * Consulta o estado interno; demonstra viabilidade, não mede dificuldade humana. */
const assert=require('node:assert/strict');
const {makeGame}=require('./gameplay.cjs');
function flyCampaign(seed,maxFrames=42000,manageChannel=true,options={}) {
  const interval=options.decisionMs||160,reaction=options.reactionMs||0,strategy=options.strategy||'balanced';
  const ignoreChannel=options.channel==='ignore',alertRegen=options.channel==='alert';
  const useRegen=manageChannel&&!ignoreChannel;
  const stepCost=options.input==='held'?150:Math.max(150,interval);
  let choices=0,compSeenAt=-Infinity,wasCompromised=false;
  function choose() {
    let destination=currentLane;
    if(useRegen&&alertRegen&&qber>=7.7&&gameTime>=keyReadyAt&&!isRegen)tryRegen();
    if(boss) {
      const m=boss.model;
      // '?' não revela a sonda verdadeira: não consultar seu id antes da varredura.
      const nodes=m.targets(qber).filter(n=>n.hp>0&&n.id>=0&&n.label!=='?');
      const target=nodes.find(n=>n.open)||nodes.find(n=>['+','BELL'].includes(n.label))||nodes[0];
      // H requer desvio até a cápsula; coerência requer carregar, investir e retornar.
      const reserve=m.stabilizing?(m.coherence>=90||(!m.inZone&&m.coherence>=65&&m.opening)):false;
      let ideal=m.stabilizing?(reserve&&m.elapsed>=2300&&m.elapsed<4700?m.attackLane:m.zone[0]):m.hadamard&&superpositionUntil>gameTime?m.triadCenter:target?.lane??Math.floor(numLanes/2);
      const capsule=pickups.find(p=>p.y<shipY+20);
      if(capsule&&(!m.stabilizing||m.elapsed<2300)&&(capsule.type==='correction'||superpositionUntil<=gameTime+1000))ideal=laneOf(capsule);
      if(m.nextTriadCenter!==null&&m.elapsed>=4000&&superpositionUntil>gameTime)ideal=m.nextTriadCenter;
      // Usa somente avisos visíveis. Pode atacar até precisar iniciar a fuga.
      const pulses=m.pulses.filter(p=>!p.fired&&!p.tracking&&m.time>=p.announceAt+reaction);
      const safe=m.lanes.filter(l=>pulses.every(p=>{
        const escape=Math.min(...m.lanes.filter(s=>!p.lanes.includes(s)).map(s=>Math.abs(s-l)));
        const travel=Math.abs(l-currentLane)*stepCost;
        return p.at-m.time>travel+(p.lanes.includes(l)?escape*stepCost+320:40);
      }));
      destination=safe.sort((a,b)=>(Math.abs(a-ideal)+Math.abs(a-currentLane)*.15)-(Math.abs(b-ideal)+Math.abs(b-currentLane)*.15))[0]??currentLane;
      if(useRegen&&!alertRegen&&qber>=6&&bossRecoveryAvailable())tryRegen();
    } else {
      const covered=a=>[...asteroids,...drones].some(other=>(other===a||(a.group!=null&&other.group===a.group))&&lasers.filter(l=>l.y>other.y&&Math.abs(l.x-other.x)<other.radius+l.radius).length>=other.hp);
      // Prevê uma decisão e um quadro, incluindo raio e velocidade da rocha.
      const danger=new Set([...(!ignoreChannel&&qber>=8&&missed<8&&!noImpact()?clouds:[]),...(!ignoreChannel&&qber>=5&&missed<8&&!noImpact()?spies:[]),...asteroids.filter(a=>Math.abs(a.y-shipY)<a.radius+shipSize*.7+a.speed*(interval+20)/FRAME_MS)].filter(h=>Math.abs(h.y-shipY)<130).map(laneOf));
      for(const front of [interferenceFront,interferenceFront?.followUp].filter(Boolean))if(!ignoreChannel&&qber>=7&&missed<8&&!noImpact()&&front.y>shipY-180&&front.y<shipY+20)front.lanes.forEach(l=>danger.add(l));
      if(!ignoreChannel&&missed<8&&scout&&scout.state==='locked'&&scout.fireAt-gameTime<750)danger.add(scout.lane);
      // Um disparo já em rota libera a nave para defender outra trilha.
      const arrival=a=>a.speed?((a.splittable?a.splitY:shipY-a.radius-shipSize*.7)-a.y)/a.speed*FRAME_MS:Math.min(2200,a.expiresAt-gameTime);
      const targets=[...asteroids,...(strategy==='ignoreEmitters'?[]:drones)].filter(a=>!covered(a)&&(!a.speed||arrival(a)>Math.abs(laneOf(a)-currentLane)*stepCost+interval+20)).sort((a,b)=>arrival(a)-arrival(b));
      if(strategy==='noise')targets.sort((a,b)=>(a.speed?1:0)-(b.speed?1:0)||arrival(a)-arrival(b));
      if(strategy==='meteors')targets.sort((a,b)=>(a.speed?0:1)-(b.speed?0:1)||arrival(a)-arrival(b));
      const target=targets.find(a=>!danger.has(laneOf(a)));destination=target?laneOf(target):currentLane;
      if(danger.has(destination))destination=Array.from({length:numLanes},(_,i)=>i).filter(l=>!danger.has(l)).sort((a,b)=>Math.abs(a-currentLane)-Math.abs(b-currentLane))[0]??currentLane;
      if(danger.has(currentLane+Math.sign(destination-currentLane)))destination=Array.from({length:numLanes},(_,i)=>i).filter(l=>!danger.has(l)&&Math.abs(l-currentLane)<=1).sort((a,b)=>Math.abs(a-destination)-Math.abs(b-destination))[0]??currentLane;
      if(useRegen&&!alertRegen&&gameTime>=keyReadyAt&&((qber>=3&&waveRecoveryAvailable())||(qber>=7&&!asteroids.length&&!encounterDirector.pending)))tryRegen();
    }
    choices++;
    if(isCompromised&&!wasCompromised)compSeenAt=gameTime;
    wasCompromised=isCompromised;
    if(options.idle)return;
    if(options.errorEvery&&choices%options.errorEvery===0)return;
    const direction=Math.sign(destination-currentLane);
    if(options.input==='held') {
      clearMovementInput();
      const compensate=!ignoreChannel&&isCompromised&&options.compensate!==false&&gameTime-compSeenAt>=reaction;
      if(direction)pressMovement('test:pilot',direction*(compensate?-1:1));
    }else if(!isRegen&&direction) {
      // O piloto básico já compensa inversões. Variantes podem reagir tarde ou ignorá-las.
      moveShip(direction*(isCompromised&&(ignoreChannel||options.compensate===false||gameTime-compSeenAt<reaction)?-1:1));
    }
  }
  let rng=seed;Math.random=()=>((rng=Math.imul(rng,1664525)+1013904223>>>0)/4294967296);
  campaignSeed=seed;campaignRandom=new CampaignRandom(seed);campaignMetrics.data.arena.seed=seed;resetEncounters();phaseCheckpointData=captureCheckpoint('wave');
  let clock=100,decision=0,frames=0,lastLevel=1;const phases=[1];
  while(isPlaying&&frames++<maxFrames) {
    if(isStageBriefing)continuePhase();
    if(gameTime>=decision){choose();decision=gameTime+interval;}
    cancelAnimationFrame(rafId);clock+=FRAME_MS;update(clock);
    if(level!==lastLevel){phases.push(level);lastLevel=level;}
  }
  const metrics=window.quantumDiagnostics.snapshot();
  const compromisedMs=Object.values(metrics.phases).flatMap(p=>Object.values(p)).reduce((sum,p)=>sum+p.compromisedMs,0);
  const segments=Object.values(metrics.phases).flatMap(p=>Object.values(p));
  return {build:metrics.build,configuration:metrics.configuration,campaign:metrics.campaign,inputMethods:metrics.inputMethods,entry:metrics.entry,randomVersion:CampaignRandom.version,encounterVersion:EncounterDirector.version,won:!!finale,phases,guardians:bossesDefeated,score,missed,seconds:Math.round(gameTime/1000),points:combatScore,
    pacing:Object.fromEntries(['noDecisionMs','emptyTravelMs','waitingForOpeningMs'].map(key=>[key,Math.round(segments.reduce((sum,p)=>sum+(p[key]||0),0))])),
    outcome:metrics.outcome,failure:lastFailure?.cause||null,lastPhase:level,seed,options,
    hullHits:metrics.counts.hullHits||0,earthImpacts:metrics.counts.earthImpacts||0,repairs:metrics.counts.earthRepairs||0,
    dronesDestroyed:metrics.counts.dronesDestroyed||0,dronesEscaped:metrics.counts.dronesEscaped||0,
    waves:Object.fromEntries(Object.entries(metrics.phases).filter(([,p])=>p.wave).map(([phase,p])=>[phase,Math.round(p.wave.activeMs/100)/10])),
    bossSeconds:Object.fromEntries(Object.entries(metrics.phases).filter(([,p])=>p.boss).map(([phase,p])=>[phase,Math.round(p.boss.activeMs/100)/10])),
    openings:Object.fromEntries(Object.entries(metrics.phases).filter(([,p])=>p.boss).map(([phase,p])=>[phase,p.boss.openings||[]])),
    regens:metrics.counts.regenerationsStarted||0,compromises:metrics.counts.compromises||0,compromisedMs};
}
if(require.main===module){
const runs=[];
for(const [width,height,seed] of [[1600,900,519],[1100,800,519],[390,700,519],[390,700,2026],[844,390,519],[760,360,519]]) {
  const game=makeGame(width,height);
  const run=game.run('('+flyCampaign.toString()+')('+seed+')');
  assert.equal(run.won,true,'A campanha deve ser vencível com ameaças e colisões ativas');
  assert.equal(run.guardians,8);assert.equal(run.score,1000);
  assert.deepEqual(Array.from(run.phases),[1,2,3,4,5,6,7,8]);
  assert.ok(run.seconds<(height<620?660:630),'A campanha não deve acumular espera excessiva');
  assert.ok(run.regens>0,'A campanha deve exercitar a gestão do canal com R');
  const openings=Object.values(run.openings).flat();
  assert.equal(openings.reduce((sum,row)=>sum+row.damage,0),175,'Todo dano da campanha pertence a uma abertura, incluindo transições de estágio');
  assert.ok(openings.some(row=>row.damage===0),'O histórico inclui oportunidades não aproveitadas');
  runs.push({width,height,...JSON.parse(JSON.stringify(run))});
}
const withoutRegen=makeGame(1600,900).run('('+flyCampaign.toString()+')(519,42000,false)');
assert.equal(withoutRegen.regens,0);
assert.ok(withoutRegen.compromises>runs[0].compromises+3,'Não regenerar aumenta a exposição, mesmo evitando ruído e compensando inversões');
assert.ok(withoutRegen.compromisedMs>runs[0].compromisedMs);
console.log(JSON.stringify({passed:runs.length+1,tests:['Campanha completa e gestão do canal em seis cenários','Comparação com a mesma pilotagem sem regenerar'],runs,withoutRegen},null,2));

}
module.exports={flyCampaign};
