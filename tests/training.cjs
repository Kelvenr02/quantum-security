const assert = require('node:assert/strict');
const { TrainingSimulation } = require('../training.js');
const results = [];
const test = (name, fn) => { fn(); results.push(name); };
const advance = (sim, ms) => { for (let elapsed = 0; elapsed < ms; elapsed += 20) sim.update(Math.min(20, ms - elapsed)); };
function intercept() { const sim = new TrainingSimulation(); sim.move(-1); advance(sim, 1000); return sim; }

test('Um único asteroide apresenta movimento e disparo automático', () => {
  const sim = intercept(); assert.equal(sim.score, 10); assert.equal(sim.asteroids.length, 0);
  assert.equal(sim.qber, 8); assert.equal(sim.complete, false); assert.match(sim.objective, /Pressione R/);
  assert.equal(sim.time, 1000);
});
test('A missão só é liberada após a intercepção e a renovação da chave', () => {
  const sim = new TrainingSimulation(); assert.equal(sim.regenerate(), false);
  sim.move(-1); advance(sim, 1000); assert.equal(sim.regenerate(), true);
  advance(sim, 1980); assert.equal(sim.complete, false); assert.equal(sim.qber, 8);
  advance(sim, 20); assert.equal(sim.qber, 0); assert.equal(sim.complete, true);
});
test('Regeneração mantém 2 s de imobilização e 10 s de recarga', () => {
  const sim = intercept(); sim.regenerate(); const lane = sim.lane, shot = sim.lastShot;
  sim.move(1); advance(sim, 1980); assert.equal(sim.lane, lane); assert.equal(sim.lastShot, shot);
  assert.equal(sim.keyReadyAt, 11000); assert.equal(sim.regenerate(), false);
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
  const old = intercept(); old.regenerate(); advance(old, 2000); assert.equal(old.complete, true);
  const fresh = new TrainingSimulation(); assert.equal(fresh.score, 0); assert.equal(fresh.qber, 0); assert.equal(fresh.time, 0); assert.equal(fresh.complete, false);
});
console.log(JSON.stringify({ passed: results.length, tests: results }, null, 2));
