/* Geometria e pilotagem compartilhadas pelo treino e pela campanha. */
const OrbitalArena = Object.freeze({
  lanes:9, maxWidth:1600, stepMs:150,
  // Em paisagem baixa, os 140 px reservados à base não fazem parte da queda.
  // A escala encontra height/800 em 620 px, sem salto ao girar a tela.
  flightScale:viewportHeight=>Math.max(.18,Math.min(1.3,
    viewportHeight<620?(viewportHeight-140)*(.775/480):viewportHeight/800))
});

class LanePilot {
  constructor(lanes=OrbitalArena.lanes, onMove=()=>{}) {
    this.lanes=lanes; this.onMove=onMove; this.inputs=new Map();
    this.reset(Math.floor(lanes/2));
  }
  reset(lane=Math.floor(this.lanes/2)) {
    this.clear(); this.lane=Math.max(0,Math.min(this.lanes-1,lane));
    this.position=this.from=this.lane; this.elapsed=OrbitalArena.stepMs;
  }
  get moving() { return this.elapsed<OrbitalArena.stepMs; }
  clear() { this.inputs.clear(); this.queued=0; }
  move(direction) {
    if(this.moving || !direction)return false;
    const next=Math.max(0,Math.min(this.lanes-1,this.lane+Math.sign(direction)));
    if(next===this.lane)return false;
    this.from=this.position; this.lane=next; this.elapsed=0; this.onMove(next);
    return true;
  }
  press(token,direction,inverted=false) {
    if(this.inputs.has(token))return;
    this.inputs.set(token,Math.sign(direction));
    if(this.moving)this.queued=Math.sign(direction);
    else this.move(direction*(inverted?-1:1));
  }
  release(token) { this.inputs.delete(token); }
  advance(milliseconds,blocked=false,inverted=false) {
    if(blocked)return;
    let remaining=Math.max(0,milliseconds);
    while(remaining>0) {
      if(!this.moving) {
        const direction=this.queued || [...this.inputs.values()].at(-1) || 0;
        this.queued=0;
        if(!this.move(direction*(inverted?-1:1)))break;
      }
      const step=Math.min(remaining,OrbitalArena.stepMs-this.elapsed);
      this.elapsed+=step; remaining-=step;
      // Posição física contínua: desenho, colisões e disparos usam o mesmo valor.
      this.position=this.from+(this.lane-this.from)*this.elapsed/OrbitalArena.stepMs;
    }
  }
}
if(typeof module!=='undefined'&&module.exports)module.exports={OrbitalArena,LanePilot};
