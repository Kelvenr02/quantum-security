/* Regressão da composição real: disparos, cápsulas, canal, escudo e recompensas ativos. */
const assert=require('node:assert/strict');
const {makeGame}=require('./gameplay.cjs');
function stationaryFight(phase,lane,shield,regen,maxMs=180000){
  level=phase;score=phaseConfig().target;missed=5;currentLane=lane;shipPilot.reset(lane);hullShield=shield;
  beginBoss();continuePhase();
  let clock=100,frames=0;
  while(isPlaying&&boss&&boss.status!=='won'&&gameTime<maxMs){
    if(regen&&qber>=6&&gameTime>=keyReadyAt&&!isRegen&&bossRecoveryAvailable())tryRegen();
    cancelAnimationFrame(rafId);clock+=FRAME_MS;update(clock);frames++;
  }
  return {phase,lane,shield,regen,won:boss?.status==='won'||bossesDefeated>0,
    outcome:isPlaying?'timeout':'defeat',seconds:Math.round(gameTime/100)/10,
    distance:campaignMetrics.data.counts.distanceLanes||0,hits:campaignMetrics.data.counts.hullHits||0,
    regens:campaignMetrics.data.counts.regenerationsStarted||0};
}
function auditStationary(){
  const rows=[];
  for(const [width,height]of [[1440,900],[390,844]])for(let phase=1;phase<=8;phase++)for(let lane=0;lane<9;lane++)
    for(const shield of [0,1])for(const regen of [false,true]){
      const g=makeGame(width,height),row=JSON.parse(JSON.stringify(g.run('('+stationaryFight.toString()+')('+[phase,lane,shield,regen].join(',')+')')));
      assert.equal(row.won,false,JSON.stringify({width,height,...row}));assert.ok(row.distance<1e-8);
      rows.push({width,height,...row});
      if(rows.length%72===0)process.stderr.write('Confrontos estacionários: '+rows.length+'/576\n');
    }
  return rows;
}
if(require.main===module){const rows=auditStationary();console.log(JSON.stringify({passed:rows.length,
  tests:['Nenhuma vitória estacionária nos oito chefes, nove posições, duas telas, com/sem escudo e R'],
  summary:{wins:rows.filter(r=>r.won).length,defeats:rows.filter(r=>r.outcome==='defeat').length,timeouts:rows.filter(r=>r.outcome==='timeout').length,maxSeconds:180}},null,2));}
module.exports={stationaryFight,auditStationary};
