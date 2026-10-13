const assert = require('node:assert/strict');
const { TrainingSimulation, QubitExperiment } = require('../training.js');
const results = [];
const test = (name, fn) => { fn(); results.push(name); };
const advance = (sim, ms) => { for (let elapsed = 0; elapsed < ms; elapsed += 20) sim.update(Math.min(20, ms - elapsed)); };
test('H duas vezes restaura o estado inicial; medir superposição produz um único bit', () => {
  for (const state of ['0', '1', '+', '-']) { const q = new QubitExperiment(); q.state = state; q.hadamard(); q.hadamard(); assert.equal(q.state, state); }
  const q = new QubitExperiment(); q.measure(); assert.equal(q.complete, false); q.flip(); q.hadamard(); q.hadamard(); q.hadamard(); assert.equal(q.measure(() => .1), '0'); assert.equal(q.complete, true);
  q.hadamard(); assert.equal(q.measure(() => .9), '1'); assert.equal(q.measure(() => .1), '1');
});
test('Pilotagem exige três intercepções reais e respeita as sete trilhas', () => {
  const sim = new TrainingSimulation(3); sim.move(-10); assert.equal(sim.lane, 0); sim.move(10); assert.equal(sim.lane, 6);
  for (let frames = 0; !sim.complete && frames < 2000; frames++) { const target = sim.asteroids[0]; if (target) sim.move(Math.sign(target.lane - sim.lane)); sim.update(20); }
  assert.equal(sim.complete, true); assert.equal(sim.score, 30);
});
test('Impactos de treinamento permitem tentar de novo sem completar o objetivo', () => {
  const sim = new TrainingSimulation(3); sim.lane = 2; sim.asteroids[0].y = 330; sim.update(0); assert.equal(sim.score, 0); assert.equal(sim.asteroids[0].y, 100); assert.match(sim.message, /colisão direta/);
  sim.lane = 0; sim.asteroids[0].y = 366; sim.update(0); assert.equal(sim.asteroids[0].y, 100); assert.equal(sim.complete, false);
});
test('Inversão dura 4 s e regeneração bloqueia movimento e novos disparos por 2 s', () => {
  const sim = new TrainingSimulation(4); sim.noise('cloud'); sim.noise('cloud'); sim.noise('spy'); assert.equal(sim.qber, 14); assert.equal(sim.regenerate(), false);
  sim.move(-1); assert.equal(sim.lane, 4); advance(sim, 4000); assert.equal(sim.compromised, false); assert.equal(sim.qber, 2);
  assert.equal(sim.regenerate(), true); const lane = sim.lane, lastShot = sim.lastShot; sim.move(1); assert.equal(sim.lane, lane);
  advance(sim, 1980); assert.equal(sim.lastShot, lastShot); assert.equal(sim.complete, false); advance(sim, 20); assert.equal(sim.qber, 0); assert.equal(sim.complete, true); assert.equal(sim.keyReadyAt, 14000);
});
test('Pausa congela relógio, entidades, inversão e entrada', () => {
  const sim = new TrainingSimulation(4); sim.noise('spy'); sim.noise('spy'); sim.paused = true; sim.move(1); sim.noise('cloud'); advance(sim, 5000);
  assert.equal(sim.time, 0); assert.equal(sim.lane, 3); assert.equal(sim.qber, 14); assert.equal(sim.compromised, true);
});
test('Cápsulas, pares e blindagem completam por coleta e colisões de disparos', () => {
  const sim = new TrainingSimulation(5); sim.move(-1); advance(sim, 1800); assert.equal(sim.collected.has('hadamard'), true);
  assert.ok(sim.superpositionUntil > sim.time); assert.equal(sim.lasers.some(l => l.lane === 1), true); assert.equal(sim.lasers.some(l => l.lane === 3), true);
  sim.move(1); sim.move(1); advance(sim, 8000);
  assert.equal(sim.collected.has('correction'), true); assert.equal(sim.qber, 3); assert.equal(sim.keyReadyAt, 7000); assert.equal(sim.connectedHit, true); assert.equal(sim.armoredHit, true); assert.equal(sim.complete, true); assert.equal(sim.score, 30);
});
test('Frente respeita o aviso; uma trilha atingida dá nova tentativa e uma livre conclui', () => {
  const sim = new TrainingSimulation(6); advance(sim, 1780); assert.equal(sim.front.y, 80); advance(sim, 1800); assert.equal(sim.complete, false); assert.ok(sim.front.releaseAt > sim.time);
  sim.move(1); advance(sim, 3500); assert.equal(sim.frontDodged, true); assert.equal(sim.complete, true);
});
test('Recomeçar cria um simulador sem recursos ou progresso da sessão anterior', () => {
  const before = new TrainingSimulation(5); before.score = 300; before.collected.add('correction'); before.qber = 15;
  const after = new TrainingSimulation(3); assert.equal(after.score, 0); assert.equal(after.qber, 0); assert.equal(after.collected.size, 0); assert.equal(after.complete, false);
});
console.log(JSON.stringify({ passed: results.length, tests: results }, null, 2));
