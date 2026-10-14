/* Piloto de regressão: uma mudança de trilha a cada 160 ms, disparos e colisões reais.
 * Consulta o estado interno; demonstra viabilidade, não mede dificuldade humana. */
const assert=require('node:assert/strict');
const {makeGame}=require('./gameplay.cjs');
function flyCampaign(seed,maxFrames=36000) {
  function choose() {
    let destination=currentLane;
    if(boss) {
      const m=boss.model;
      const danger=new Set(m.pulses.filter(p=>p.at-m.time<1400&&p.at-m.time>-480).flatMap(p=>p.lanes));
      const nodes=m.targets(qber).filter(n=>n.hp>0&&n.id>=0);
      const target=nodes.find(n=>n.open)||nodes.find(n=>['+','BELL'].includes(n.label))||nodes[0];
      const ideal=m.stabilizing?m.zone[0]:m.phase===3&&superpositionUntil>gameTime?3:target?.lane??3;
      const safe=[0,1,2,3,4,5,6].filter(l=>!danger.has(l));
      destination=safe.sort((a,b)=>(Math.abs(a-ideal)+Math.abs(a-currentLane)*.15)-(Math.abs(b-ideal)+Math.abs(b-currentLane)*.15))[0]??currentLane;
      if(qber>=6&&!m.pulses.some(p=>p.at-m.time>0&&p.at-m.time<2300))tryRegen();
    } else {
      const danger=new Set([...clouds,...spies].filter(h=>Math.abs(h.y-shipY)<130).map(laneOf));
      if(interferenceFront&&interferenceFront.y>shipY-160)interferenceFront.lanes.forEach(l=>danger.add(l));
      const targets=asteroids.slice().sort((a,b)=>(shipY-a.y)/a.speed-(shipY-b.y)/b.speed);
      const target=targets.find(a=>!danger.has(laneOf(a)));destination=target?laneOf(target):currentLane;
      if(danger.has(destination))destination=[0,1,2,3,4,5,6].filter(l=>!danger.has(l)).sort((a,b)=>Math.abs(a-currentLane)-Math.abs(b-currentLane))[0]??currentLane;
      if(qber>=6&&!asteroids.some(a=>(shipY-a.y)/a.speed*FRAME_MS<2500))tryRegen();
    }
    if(!isRegen&&destination!==currentLane)moveShip(Math.sign(destination-currentLane));
  }
  let rng=seed;Math.random=()=>((rng=Math.imul(rng,1664525)+1013904223>>>0)/4294967296);
  let clock=100,decision=0,frames=0,lastLevel=1;const phases=[1];
  while(isPlaying&&frames++<maxFrames) {
    if(isStageBriefing)continuePhase();
    if(gameTime>=decision){choose();decision=gameTime+160;}
    cancelAnimationFrame(rafId);clock+=FRAME_MS;update(clock);
    if(level!==lastLevel){phases.push(level);lastLevel=level;}
  }
  return {won:!!finale,phases,guardians:bossesDefeated,score,missed,seconds:Math.round(gameTime/1000)};
}
const runs=[];
for(const [width,height,seed] of [[1100,800,519],[390,700,519],[390,700,2026]]) {
  const game=makeGame(width,height);
  const run=game.run('('+flyCampaign.toString()+')('+seed+')');
  assert.equal(run.won,true,'A campanha deve ser vencível com ameaças e colisões ativas');
  assert.equal(run.guardians,8);assert.equal(run.score,1000);
  assert.deepEqual(Array.from(run.phases),[1,2,3,4,5,6,7,8]);
  assert.ok(run.seconds<600);
  runs.push({width,height,seed,seconds:run.seconds,guardians:run.guardians});
}
console.log(JSON.stringify({passed:runs.length,tests:['Campanha completa por pilotagem e disparos reais em três cenários'],runs},null,2));
