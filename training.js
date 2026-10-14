/* Treino rápido e independente da campanha: um asteroide e uma nova chave. */
class TrainingSimulation {
  constructor(onSound = () => {}) {
    this.onSound = onSound;
    this.time = 0; this.lane = 3; this.score = 0; this.qber = 0;
    this.keyReadyAt = 0; this.regenEnd = 0; this.lastShot = -300;
    this.regenerated = false; this.paused = false;
    this.asteroids = [{ lane: 2, y: 100 }]; this.lasers = [];
    this.message = 'Mova para a trilha marcada. A nave dispara automaticamente.';
  }
  get regenerating() { return this.regenEnd > this.time; }
  get complete() { return this.score === 10 && this.regenerated; }
  get objective() {
    if (this.complete) return '✓ Pronto para defender a Terra!';
    if (this.regenerating) return 'Aguarde a nova chave: 2 segundos.';
    return this.score === 0 ? 'Mova com ← → ou A / D e destrua um asteroide.' : 'Pressione R para zerar o erro do canal.';
  }
  move(direction) {
    if (this.paused || this.regenerating || this.complete) return;
    const previous = this.lane;
    this.lane = Math.max(0, Math.min(6, this.lane + direction));
    if (previous !== this.lane) this.onSound('move', { pan: this.lane / 6 * 1.2 - .6 });
  }
  regenerate() {
    if (this.paused || this.regenerating || this.time < this.keyReadyAt || this.score === 0 || this.complete) return false;
    this.regenEnd = this.time + 2000; this.keyReadyAt = this.time + 10000;
    this.onSound('regenStart');
    this.message = 'Renovando a chave: a nave fica parada e sem disparar por 2 s.';
    return true;
  }
  update(milliseconds) {
    if (this.paused || this.complete) return;
    const dt = Math.max(0, Math.min(milliseconds, 50)), wasRegenerating = this.regenerating;
    this.time += dt;
    if (wasRegenerating && !this.regenerating) {
      this.qber = 0; this.regenerated = true;
      this.onSound('regenReady');
      this.message = 'Canal seguro! Você já sabe mover, interceptar e renovar a chave.';
    }
    const seconds = dt / 1000;
    if (!this.regenerating && this.time - this.lastShot >= 300) {
      this.onSound('shot', { pan: this.lane / 6 * 1.2 - .6 });
      this.lasers.push({ lane: this.lane, y: 306 }); this.lastShot = this.time;
    }
    this.lasers.forEach(l => l.y -= 380 * seconds);
    this.lasers = this.lasers.filter(l => l.y > 20);
    for (const asteroid of [...this.asteroids]) {
      asteroid.y += 50 * seconds;
      if (asteroid.lane === this.lane && Math.abs(asteroid.y - 330) < 24) {
        asteroid.y = 100;
        this.message = 'Tente de novo: alinhe a nave antes de a rocha chegar.';
        continue;
      }
      const shot = this.lasers.find(l => l.lane === asteroid.lane && Math.abs(l.y - asteroid.y) < 24);
      if (shot) {
        this.lasers.splice(this.lasers.indexOf(shot), 1); this.asteroids = [];
        this.score = 10; this.qber = 8;
        this.onSound('explosion', { pan: asteroid.lane / 6 * 1.2 - .6 }); this.onSound('noise');
        this.message = 'Boa! +10 pontos. Um ruído simulado elevou o QBER para 8%. Pressione R.';
      } else if (asteroid.y > 365) {
        asteroid.y = 100; this.message = 'A rocha passou. Tente outra vez; aqui não há derrota.';
      }
    }
  }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { TrainingSimulation };
