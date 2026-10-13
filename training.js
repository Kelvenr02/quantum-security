/* Simulador independente: nunca altera o estado da campanha. */
class TrainingSimulation {
  constructor(step) {
    this.step = step; this.time = 0; this.lane = 3; this.score = 0;
    this.qber = step === 5 ? 8 : 0; this.keyReadyAt = step === 5 ? 10000 : 0;
    this.compEnd = 0; this.regenEnd = 0; this.superpositionUntil = 0; this.lastShot = -300;
    this.asteroids = []; this.lasers = []; this.pickups = []; this.collected = new Set();
    this.invertedMove = false; this.regenerated = false; this.connectedHit = false; this.armoredHit = false; this.noiseTypes = new Set();
    this.front = null; this.frontDodged = false; this.paused = false; this.message = '';
    if (step === 3) this.spawnTarget();
    if (step === 5) this.pickups.push({ type: 'hadamard', lane: 2, y: 225 });
    if (step === 6) this.spawnFront();
  }
  get compromised() { return this.compEnd > this.time; }
  get regenerating() { return this.regenEnd > this.time; }
  get complete() {
    if (this.step === 3) return this.score >= 30;
    if (this.step === 4) return this.invertedMove && this.regenerated && this.noiseTypes.size === 2;
    if (this.step === 5) return this.collected.size === 2 && this.connectedHit && this.armoredHit;
    if (this.step === 6) return this.frontDodged;
    return false;
  }
  move(direction) {
    if (this.paused || this.regenerating || this.complete) return;
    const next = Math.max(0, Math.min(6, this.lane + direction * (this.compromised ? -1 : 1)));
    if (next !== this.lane && this.compromised) this.invertedMove = true;
    this.lane = next;
  }
  noise(type) {
    if (this.step !== 4 || this.paused || this.compromised || this.regenerating || this.complete) return;
    this.noiseTypes.add(type); this.qber += type === 'spy' ? 7 : 3.5;
    this.message = type === 'spy' ? 'Pulso espião: +7 pontos de QBER.' : 'Ruído ambiental: +3,5 pontos de QBER.';
    if (this.qber > 11) { this.compEnd = this.time + 4000; this.message = 'Canal comprometido! Experimente mover: comandos invertidos por 4 s.'; }
  }
  regenerate() {
    if (this.step !== 4 || this.paused || this.compromised || this.regenerating || this.time < this.keyReadyAt || !this.invertedMove || this.complete) return false;
    this.regenEnd = this.time + 2000; this.keyReadyAt = this.time + 10000;
    this.message = 'Criando outra chave. Nave e disparos parados por 2 s; recarga de R: 10 s.';
    return true;
  }
  spawnTarget() {
    const lane = [2, 4, 1][Math.min(2, this.score / 10)];
    this.asteroids.push({ lane, y: 100, hp: 1, group: null });
    this.message = 'Alinhe a nave com o asteroide na trilha ' + (lane + 1) + '. Ela dispara sozinha.';
  }
  spawnFront() { this.front = { lanes: [0, 2, 3, 5], releaseAt: this.time + 1800, y: 80 }; this.message = 'Faixas violetas: escolha uma das três trilhas sem faixa.'; }
  update(milliseconds) {
    if (this.paused || this.complete) return;
    const dt = Math.max(0, Math.min(milliseconds, 50)), wasCompromised = this.compromised, wasRegenerating = this.regenerating;
    this.time += dt;
    if (wasCompromised && !this.compromised) { this.qber = 2; this.message = this.invertedMove ? 'Comandos recuperados. Agora pressione R para renovar a chave.' : 'Injete novas interferências e mova durante a inversão para testá-la.'; }
    if (wasRegenerating && !this.regenerating) { this.qber = 0; this.regenerated = true; this.message = 'Chave renovada! Na missão, regenere antes de ultrapassar 11% de QBER.'; }
    const seconds = dt / 1000;
    if (!this.regenerating && this.time - this.lastShot >= 300) {
      const lanes = this.time < this.superpositionUntil ? [this.lane - 1, this.lane, this.lane + 1] : [this.lane];
      lanes.filter(lane => lane >= 0 && lane < 7).forEach(lane => this.lasers.push({ lane, y: 306 })); this.lastShot = this.time;
    }
    this.lasers.forEach(l => l.y -= 380 * seconds); this.lasers = this.lasers.filter(l => l.y > 20);
    for (const a of [...this.asteroids]) {
      if (!this.asteroids.includes(a)) continue;
      a.y += 50 * seconds;
      if (a.lane === this.lane && Math.abs(a.y - 330) < 24) { this.message = 'Impacto de treino: tente de novo! Na missão, uma colisão direta encerra a defesa.'; a.y = 100; continue; }
      const shot = this.lasers.find(l => l.lane === a.lane && Math.abs(l.y - a.y) < 24);
      if (shot) {
        this.lasers.splice(this.lasers.indexOf(shot), 1); a.hp--;
        if (a.hp <= 0) {
          const victims = this.asteroids.filter(other => other === a || (a.group !== null && other.group === a.group));
          this.asteroids = this.asteroids.filter(other => !victims.includes(other)); this.score += victims.length * 10;
          if (a.group !== null) this.connectedHit = true;
          if (a.armored) this.armoredHit = true;
          this.message = a.group !== null ? 'Par destruído: +20 pontos. Na física real, entrelaçamento não transmite ações instantâneas.' : a.armored ? 'Blindagem rompida: dois acertos, +10 pontos.' : '+10 pontos. Continue interceptando!';
          if (this.step === 3 && this.score < 30) this.spawnTarget();
        }
      } else if (a.y > 365) { a.y = 100; this.message = 'O asteroide passou. Na missão, 12 impactos na Terra encerram a defesa. Tente novamente.'; }
    }
    for (const p of [...this.pickups]) {
      p.y += 65 * seconds;
      if (p.lane === this.lane && Math.abs(p.y - 330) < 26) {
        this.pickups.splice(this.pickups.indexOf(p), 1); this.collected.add(p.type);
        if (p.type === 'hadamard') {
          this.superpositionUntil = this.time + 6000; this.pickups.push({ type: 'correction', lane: 4, y: 170 });
          this.asteroids.push({ lane: 1, y: 80, hp: 1, group: 'pair' }, { lane: 3, y: 80, hp: 1, group: 'pair' }, { lane: 4, y: 90, hp: 2, armored: true, group: null });
          this.message = 'H: até três trilhas por 6 s. Recolha + na trilha 5; intercepte o par azul e o anel dourado.';
        } else { this.qber = Math.max(0, this.qber - 5); this.keyReadyAt = Math.max(this.time, this.keyReadyAt - 3000); this.message = '+ coletado: −5 pontos de QBER e −3 s na recarga. Intercepte as rochas restantes.'; }
      } else if (p.y > 365) p.y = 180;
    }
    if (this.front && this.time >= this.front.releaseAt) {
      this.front.y += 180 * seconds;
      if (this.front.y >= 330) {
        if (this.front.lanes.includes(this.lane)) { this.spawnFront(); this.message = 'Essa trilha tinha ruído. Nova tentativa: procure uma faixa livre.'; }
        else { this.frontDodged = true; this.front = null; this.message = 'Rota livre. Treinamento concluído: assuma a defesa da Terra!'; }
      }
    }
  }
}
class QubitExperiment {
  constructor() { this.state = '0'; this.bit = 0; this.flipped = false; this.measured = false; this.interfered = false; }
  flip() { this.bit = 1 - this.bit; this.flipped = true; }
  hadamard() { const before = this.state; this.state = { '0': '+', '1': '-', '+': '0', '-': '1' }[before]; if ('+-'.includes(before)) this.interfered = true; }
  measure(random = Math.random) { if ('+-'.includes(this.state)) { this.state = random() < .5 ? '0' : '1'; this.measured = true; } return this.state; }
  get complete() { return this.flipped && this.measured && this.interfered; }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { TrainingSimulation, QubitExperiment };
