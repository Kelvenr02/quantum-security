const assert = require('node:assert/strict');
const { TrainingSimulation } = require('../training.js');
const results = [];
const test = (name, fn) => { fn(); results.push(name); };
const advance = (sim, ms) => { for (let elapsed = 0; elapsed < ms; elapsed += 20) sim.update(Math.min(20, ms - elapsed)); };
function intercept() { const sim = new TrainingSimulation(); sim.move(-1); advance(sim, 1000); return sim; }
function evade(sim){sim.press('evade',1);advance(sim,320);sim.release('evade');assert.equal(sim.inDanger,false);return sim;}

test('Um único asteroide apresenta movimento e disparo automático', () => {
  const sim = intercept(); assert.equal(sim.score, 10); assert.equal(sim.asteroids.length, 0);
  assert.equal(sim.qber, 8); assert.equal(sim.complete, false); assert.match(sim.objective, /Saia das faixas A/);
  assert.equal(sim.time, 1000);
});
test('A missão só é liberada após a intercepção e a renovação da chave', () => {
  const sim = new TrainingSimulation(); assert.equal(sim.regenerate(), false);
  sim.move(-1); advance(sim, 1000);evade(sim);assert.equal(sim.regenerate(), true);
  advance(sim, 1980); assert.equal(sim.complete, false); assert.equal(sim.qber, 8);
  assert.match(sim.message,/aguarde a renovação/);assert.doesNotMatch(sim.message,/Use R agora/);
  advance(sim, 20); assert.equal(sim.qber, 0); assert.equal(sim.complete, true);
});
test('Regeneração mantém 2 s de imobilização e 10 s de recarga', () => {
  const sim = evade(intercept()); sim.regenerate(); const lane = sim.lane, shot = sim.lastShot;
  sim.move(1); advance(sim, 1980); assert.equal(sim.lane, lane); assert.equal(sim.lastShot, shot);
  assert.equal(sim.keyReadyAt, 11320); assert.equal(sim.regenerate(), false);
});
test('Pausa congela as ameaças, o relógio e a regeneração', () => {
  const sim = new TrainingSimulation(); sim.paused = true; sim.move(-1); advance(sim, 5000);
  assert.equal(sim.time, 0); assert.equal(sim.lane, 4); assert.equal(sim.asteroids[0].y, 100);
  const regen = intercept(); regen.regenerate(); regen.paused = true; advance(regen, 5000);
  assert.equal(regen.regenerating, true); assert.equal(regen.regenerated, false);
});
test('Erros permitem nova tentativa e movimento respeita as nove trilhas', () => {
  const sim = new TrainingSimulation();sim.lane=0;sim.move(-1);assert.equal(sim.lane,0);sim.lane=8;sim.move(1);assert.equal(sim.lane,8);
  sim.lane = sim.asteroids[0].lane; sim.asteroids[0].y = 330; sim.update(0); assert.equal(sim.asteroids[0].y, 100);
  sim.lane = 0; sim.asteroids[0].y = 366; sim.update(0); assert.equal(sim.asteroids[0].y, 100); assert.equal(sim.complete, false);
});
test('Recomeçar cria um treino sem progresso ou penalidades anteriores', () => {
  const old = evade(intercept()); old.regenerate(); advance(old, 2000); assert.equal(old.complete, true);
  const fresh = new TrainingSimulation(); assert.equal(fresh.score, 0); assert.equal(fresh.qber, 0); assert.equal(fresh.time, 0); assert.equal(fresh.complete, false);
});
test('R na faixa de ataque não protege; erro permite desviar e tentar novamente',()=>{
  const sim=intercept();assert.equal(sim.regenerate(),true);advance(sim,2000);
  assert.equal(sim.complete,false);assert.equal(sim.practiceHits,1);assert.equal(sim.regenerated,false);
  assert.equal(sim.regenerating,false);assert.equal(sim.qber,8);assert.match(sim.message,/R não é escudo/);
  evade(sim);assert.equal(sim.regenerate(),true);advance(sim,2000);assert.equal(sim.complete,true);
});
test('Pode renovar em uma trilha livre ou aguardar a salva para usar o respiro',()=>{
  const sim=evade(intercept());advance(sim,1800);assert.equal(sim.pulse.fired,true);
  assert.match(sim.objective,/RESPIRO/);assert.equal(sim.practiceHits,0);
  sim.regenerate();advance(sim,2000);assert.equal(sim.complete,true);
});
test('Pausa também congela a mira e não consome a oportunidade de desvio',()=>{
  const sim=intercept(),at=sim.pulse.at;sim.paused=true;advance(sim,5000);
  assert.equal(sim.pulse.at,at);assert.equal(sim.pulse.fired,false);assert.equal(sim.practiceHits,0);
});
console.log(JSON.stringify({ passed: results.length, tests: results }, null, 2));
