/* Treino rápido: interceptar, desviar de uma salva e escolher onde renovar. */
const trainingControls=typeof module!=='undefined'&&module.exports?require('./arena.js'):{OrbitalArena,LanePilot};
const trainingRules=typeof module!=='undefined'&&module.exports?require('./config.js').GameRules:GameRules;
class TrainingSimulation {
  constructor(onSound = () => {}) {
    this.onSound = onSound;
    this.pilot=new trainingControls.LanePilot(trainingControls.OrbitalArena.lanes,lane=>this.onSound('move',{pan:lane/(this.pilot.lanes-1)*1.2-.6}));
    this.time = 0; this.score = 0; this.qber = 0;
    this.keyReadyAt = 0; this.regenEnd = 0; this.lastShot = -trainingRules.shotCooldownMs;
    this.regenerated = false; this.paused = false;
    this.pulse=null;this.practiceHits=0;
    this.asteroids = [{ lane: Math.floor(this.lanes/2)-1, y: 100 }]; this.lasers = [];
    this.message = 'Mova para a trilha marcada. A nave dispara automaticamente.';
  }
  get regenerating() { return this.regenEnd > this.time; }
  get lanes() { return this.pilot.lanes; }
  get lane() { return this.pilot.lane; }
  set lane(value) { this.pilot.reset(value); }
  get position() { return this.pilot.position; }
  get complete() { return this.score === 10 && this.regenerated; }
  get objective() {
    if (this.complete) return '✓ Pronto para defender a Terra!';
    if (this.regenerating) return 'Aguarde a nova chave: 2 segundos.';
    if(this.score===0)return 'Mova com ← → ou A / D e destrua um asteroide.';
    if(this.pulse&&!this.pulse.fired)return this.inDanger?
      'Saia das faixas A antes de usar R: a nave ficará parada por 2 s.':
      'Fora de A! Pressione R aqui ou espere o RESPIRO após a salva.';
    return 'RESPIRO · Pressione R para renovar: 2 s parado e sem disparar.';
  }
  get inDanger(){return !!this.pulse?.lanes.some(l=>Math.abs(this.position-l)<.7);}
  preparePulse(){
    const center=Math.round(this.position);
    this.pulse={at:this.time+1800,lanes:[center-1,center,center+1].filter(l=>l>=0&&l<this.lanes),fired:false};
  }
  move(direction) {
    if (this.paused || this.regenerating || this.complete) return;
    this.pilot.move(direction);
  }
  press(token,direction) { if(!this.paused&&!this.regenerating&&!this.complete)this.pilot.press(token,direction); }
  release(token) { this.pilot.release(token); }
  clearInput() { this.pilot.clear(); }
  regenerate() {
    if (this.paused || this.regenerating || this.time < this.keyReadyAt || this.score === 0 || this.complete) return false;
    this.regenEnd = this.time + trainingRules.regenMs; this.keyReadyAt = this.time + trainingRules.regenCooldownMs;
    this.pilot.clear();
    this.onSound('regenStart');
    this.message = this.inDanger&&!this.pulse.fired?'Cuidado: R não protege da salva A. Você ficou parado na faixa marcada.':
      'Boa escolha! Renovando: 2 s parado e sem disparar. A fonte de ruído não é eliminada pela chave.';
    return true;
  }
  update(milliseconds) {
    if (this.paused || this.complete) return;
    const dt = Math.max(0, Math.min(milliseconds, trainingRules.maxStepMs)), wasRegenerating = this.regenerating;
    this.time += dt;
    this.pilot.advance(dt,wasRegenerating);
    if(this.pulse&&!this.pulse.fired&&this.time>=this.pulse.at){
      this.pulse.fired=true;this.onSound('spy');
      if(this.inDanger){
        this.practiceHits++;this.regenEnd=0;this.keyReadyAt=this.time;
        this.onSound('regenCancel');this.preparePulse();
        this.message='A salva atingiu a nave. Aqui você pode repetir: saia de A e só então renove. R não é escudo.';
        return;
      }
      this.message=this.regenerating?'DESVIO CERTO · aguarde a renovação terminar; a nave continua parada.':
        'DESVIO CERTO · RESPIRO! Use R agora: o canal precisa de uma nova chave.';
    }
    if (wasRegenerating && !this.regenerating) {
      this.qber = 0; this.regenerated = true;
      this.onSound('regenReady');
      this.message = 'Canal seguro! Você já sabe mover, interceptar e renovar a chave.';
    }
    const seconds = dt / 1000;
    if (!this.regenerating && this.time - this.lastShot >= trainingRules.shotCooldownMs) {
      this.onSound('shot', { pan: this.position / (this.lanes-1) * 1.2 - .6 });
      this.lasers.push({ lane: this.position, y: 306 }); this.lastShot = this.time;
    }
    this.lasers.forEach(l => l.y -= 380 * seconds);
    this.lasers = this.lasers.filter(l => l.y > 20);
    for (const asteroid of [...this.asteroids]) {
      asteroid.y += 50 * seconds;
      if (Math.abs(asteroid.lane-this.position)<.35 && Math.abs(asteroid.y - 330) < 24) {
        asteroid.y = 100;
        this.message = 'Tente de novo: alinhe a nave antes de a rocha chegar.';
        continue;
      }
      const shot = this.lasers.find(l => Math.abs(l.lane-asteroid.lane)<.28 && Math.abs(l.y - asteroid.y) < 24);
      if (shot) {
        this.lasers.splice(this.lasers.indexOf(shot), 1); this.asteroids = [];
        this.score = 10; this.qber = 8;
        this.preparePulse();
        this.onSound('explosion', { pan: asteroid.lane / (this.lanes-1) * 1.2 - .6 }); this.onSound('noise');
        this.message = 'Boa! QBER em 8%. A salva A está marcada: saia dessas faixas e escolha onde usar R.';
      } else if (asteroid.y > 365) {
        asteroid.y = 100; this.message = 'A rocha passou. Tente outra vez; aqui não há derrota.';
      }
    }
  }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { TrainingSimulation };
