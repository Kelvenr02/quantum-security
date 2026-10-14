/* Encontros com roteiro e sorteio próprio: efeitos visuais não alteram as formações. */
function encounterRandom(seed) {
  let value=seed>>>0;
  return ()=>((value=Math.imul(value,1664525)+1013904223>>>0)/4294967296);
}
function buildEncounters(phase,seed,lanes=9) {
  const random=encounterRandom(seed),mirror=random()<.5,rotation=Math.floor(random()*3);
  const route=[4,3,5,2,6,1,7,0,8];
  const map=lane=>Math.round((mirror?8-lane:lane)*(lanes-1)/8);
  let serial=0;
  return [0,1,2].map(encounter=>{
    const count=phase<=2?[4,4,5][encounter]:[5,5,6][encounter];
    return Array.from({length:count},(_,index)=>{
      const offset=encounter*2+(phase-1+rotation)%3;
      const lane=map(route[(index+offset)%route.length]);
      const actors=[];
      const drone=phase>=3&&((encounter===1&&index===0)||(encounter===2&&index===3));
      const scout=phase>=2&&((encounter===0&&index===2)||(encounter===2&&index===1));
      if(drone)actors.push({kind:'drone',lane,hp:phase>=6?3:2});
      else {
        const bell=phase>=4&&index===0;
        const triple=phase>=6&&encounter===2&&index===4;
        const pair=bell||triple||(encounter===2&&index%3===2)||(phase>=3&&index===3);
        const total=triple?3:pair?2:1;
        for(let i=0;i<total;i++){
          const target=(lane+i*(triple?2:3))%lanes;
          const split=phase>=5&&encounter>0&&index===2&&i===0;
          const armored=!bell&&!split&&phase>=4&&index%3===1&&i===0;
          const rush=!bell&&!split&&!armored&&phase>=2&&index%4===1;
          actors.push({kind:split?'split':bell?'bell':armored?'armor':rush?'rush':'rock',lane:target,hp:armored?2:1});
        }
      }
      if(scout)actors.push({kind:'scout',lane:map(4),hp:0});
      return {actors:actors.map(a=>({...a,energyId:phase+':'+(++serial)})),bell:actors.filter(a=>a.kind==='bell').length===2};
    });
  });
}

class EncounterDirector {
  constructor(phase,config,seed,lanes=9,now=0) {
    this.stepMs=typeof OrbitalArena==='undefined'?150:OrbitalArena.stepMs;
    this.shotMs=typeof shotCooldown==='undefined'?300:shotCooldown;
    this.phase=phase;this.config=config;this.seed=seed>>>0;this.plan=buildEncounters(phase,seed,lanes);
    this.totalUnits=this.plan.flat().reduce((sum,p)=>sum+p.actors.length,0);
    this.index=0;this.packetIndex=0;this.state='active';this.pending=null;
    this.nextAt=now+800;this.breatherUntil=0;this.outstanding=new Set();this.resolved=0;
    this.warningMs=900;this.started=false;
  }
  get complete() { return this.state==='complete'; }
  get progress() { return this.resolved/this.totalUnits; }
  get ambientAllowed() { return this.state==='active'&&this.packetIndex>0; }
  resolve(id) { if(this.outstanding.delete(id))this.resolved++; }
  step(now,canQueue,clear) {
    const events=[];
    if(this.complete)return events;
    if(this.state==='breather') {
      if(now<this.breatherUntil)return events;
      this.state='active';this.packetIndex=0;this.nextAt=now;this.started=false;
    }
    if(!this.started){events.push({type:'encounter',index:this.index});this.started=true;}
    if(this.pending&&now>=this.pending.releaseAt) {
      const packet=this.pending.packet;
      packet.actors.forEach(a=>this.outstanding.add(a.energyId));
      events.push({type:'spawn',packet});this.pending=null;
      if(this.packetIndex===this.plan[this.index].length)this.state='draining';
      return events;
    }
    if(this.state==='draining'&&this.outstanding.size===0&&clear) {
      events.push({type:'cleared',index:this.index});
      if(++this.index===3){this.state='complete';events.push({type:'complete'});}
      else {this.state='breather';this.breatherUntil=now+1800;}
      return events;
    }
    if(this.state==='active'&&!this.pending&&now>=this.nextAt) {
      const packet=this.plan[this.index][this.packetIndex];
      if(canQueue(packet)) {
        this.pending={packet,releaseAt:now+this.warningMs};this.packetIndex++;
        const lanes=packet.actors.filter(a=>a.kind!=='scout').map(a=>a.lane);
        const travel=(this.lastLane===undefined?0:Math.abs(lanes[0]-this.lastLane))*this.stepMs+(Math.max(...lanes)-Math.min(...lanes))*this.stepMs;
        const shots=packet.actors.reduce((n,a)=>n+(a.kind==='bell'?.5:a.hp),0)*this.shotMs;
        this.nextAt=now+Math.max(this.config.interval*(this.index===0?1.15:this.index===1?1.05:1),travel+shots+200);
        this.lastLane=lanes.at(-1);
      }else {this.nextAt=now+120;events.push({type:'deferred'});}
    }
    return events;
  }
}
if(typeof module!=='undefined'&&module.exports)module.exports={EncounterDirector,buildEncounters};

let encounterDirector=null,drones=[],scout=null,combatScore=0,campaignSeed=0;
function resetEncounters(phase=level,now=gameTime) {
  drones=[];scout=null;
  encounterDirector=new EncounterDirector(phase,missionPhases[phase-1],campaignSeed^Math.imul(phase,2654435761),numLanes,now);
}
function resolveThreat(entity) {
  if(!entity.energyId||asteroids.some(a=>a.energyId===entity.energyId)||drones.some(d=>d.energyId===entity.energyId)||scout?.energyId===entity.energyId)return;
  encounterDirector?.resolve(entity.energyId);updateEncounterEnergy();
}
function updateEncounterEnergy() {
  if(!encounterDirector||encounterDirector.phase!==level)return;
  const start=level>1?missionPhases[level-2].target:0;
  score=start+Math.floor((phaseConfig().target-start)*encounterDirector.progress);
  if(encounterDirector.complete)score=phaseConfig().target;
  updateHUD();
}
function encounterFieldClear() {
  // Caudas abaixo da nave já não podem alcançá-la. Continuam desenhadas entre
  // encontros, mas não obrigam a esperar até desaparecer fora da janela.
  const cloudThreat=clouds.some(c=>c.y-(c.radius+shipSize*.7)<=shipY);
  const spyThreat=spies.some(p=>p.y-(p.radius*1.6+shipSize*.7)<=shipY);
  const frontThreat=[interferenceFront,interferenceFront?.followUp].some(f=>f&&!f.passed&&f.y<=shipY);
  return !asteroids.length&&!drones.length&&!scout&&!cloudThreat&&!spyThreat&&!frontThreat;
}
function encountersReady() {return !!encounterDirector?.complete&&encounterFieldClear();}
function formationFits(packet) {
  const rocks=packet.actors.filter(a=>!['drone','scout'].includes(a.kind));
  const liveHits=asteroids.reduce((sum,a)=>sum+a.hp,0)+drones.reduce((sum,d)=>sum+d.hp,0);
  const hits=packet.actors.reduce((sum,a)=>sum+a.hp,0);
  return !asteroids.some(a=>a.splittable||a.fragment) && asteroids.length+rocks.length<=6 && liveHits+hits<=(level<=2?4:6)
    && (!packet.actors.some(a=>a.kind==='drone')||(!drones.length&&!scout))
    && (!packet.actors.some(a=>a.kind==='scout')||(!scout&&!drones.length));
}
function updateEncounters() {
  if(!encounterDirector||encounterDirector.phase!==level)resetEncounters();
  for(const event of encounterDirector.step(gameTime,formationFits,encounterFieldClear())) {
    if(event.type==='spawn')spawnFormation(event.packet);
    else if(event.type==='encounter'){campaignMetrics?.event('encounterStart',{encounter:event.index+1,seed:encounterDirector.seed});}
    else if(event.type==='cleared'){campaignMetrics?.count('encountersCleared');gameAudio.sfx('confirm');}
    else if(event.type==='deferred')campaignMetrics?.count('formationDelays');
  }
  updateEncounterEnergy();
  if(encounterDirector.ambientAllowed){spawnClouds();spawnSpies();spawnQuantumPickup();}
}
function waveRecoveryAvailable() {
  return !boss&&!isRegen&&gameTime>=keyReadyAt&&encounterDirector?.state==='breather'&&encounterDirector.breatherUntil-gameTime>=1100;
}
function spawnFormation(packet) {
  const rockActors=packet.actors.filter(a=>!['drone','scout'].includes(a.kind));
  const group=packet.bell?++asteroidSerial:null;
  for(const [index,actor]of rockActors.entries()) {
    const radius=Math.min(32,laneWidth*.3),rush=actor.kind==='rush';
    asteroids.push({...actor,id:++asteroidSerial,x:(actor.lane+.5)*laneWidth,y:-30-index*85,radius,
      speed:flightSpeed(phaseConfig().speed*(rush?1.22:1)),armored:actor.kind==='armor',rush,
      splittable:actor.kind==='split',splitY:Math.min(shipY-90,Math.max(210,height*.45)),group});
    flashHatch(actor.lane,actor.kind==='bell'?'#91c7ff':'#eeaa72');
  }
  for(const actor of packet.actors) {
    if(actor.kind==='drone') {
      drones.push({...actor,x:(actor.lane+.5)*laneWidth,y:Math.min(shipY-60,Math.max(270,height*.36)),
        radius:Math.min(23,laneWidth*.32),activeAt:gameTime+800,expiresAt:gameTime+6500});
      campaignMetrics?.count('dronesSpawned');gameAudio.sfx('spy');
    }else if(actor.kind==='scout') {
      scout={...actor,x:shipCenterX(),y:Math.min(shipY-65,Math.max(260,height*.33)),state:'tracking',
        lockAt:gameTime+1100,fireAt:gameTime+2000,endsAt:gameTime+2350};
      campaignMetrics?.count('scoutsSpawned');gameAudio.sfx('interference');
    }
  }
  campaignMetrics?.count('asteroidsSpawned',rockActors.length);campaignMetrics?.count('wavesSpawned');phaseWaveCount++;
}
function drawFormationWarning() {
  const pending=encounterDirector?.pending;if(!pending)return;
  const compactFront=width<=900&&height>620&&!!interferenceFront;
  const y=Math.min(shipY-75,height<=620?154:width<=900?(compactFront?245:265):183);
  ctx.save();ctx.textAlign='center';ctx.font='12px Consolas,monospace';
  for(const actor of pending.packet.actors) {
    const x=(actor.lane+.5)*laneWidth;
    ctx.fillStyle=['drone','bell'].includes(actor.kind)?'#91c7ff':'#e6c491';
    ctx.fillText(({armor:'Ⅱ',rush:'»',bell:'↔',split:'✣',drone:'D',scout:'◎'})[actor.kind]||'▼',x,y);
  }
  ctx.font='9px Consolas,monospace';ctx.fillStyle='#9bb4c4';if(!compactFront)ctx.fillText('FORMAÇÃO EM '+Math.max(0,(pending.releaseAt-gameTime)/1000).toFixed(1)+' s',width/2,y+17);ctx.restore();
}

// Segmento relativo: um tiro rápido não atravessa um alvo entre dois quadros.
function laserTouchesEntity(l,e,previousY=e.y,previousX=e.x) {
  const x=l.x-previousX,y=(l.previousY??l.y)-previousY;
  const dx=previousX-e.x,dy=(l.y-e.y)-y;
  const t=Math.max(0,Math.min(1,-(x*dx+y*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(x+dx*t,y+dy*t)<e.radius+l.radius;
}
function splitAsteroid(parent) {
  const center=laneOf(parent),lanes=center===0?[0,1]:center===numLanes-1?[numLanes-2,numLanes-1]:[center-1,center+1];
  const radius=parent.radius*.58;
  const speed=Math.min(parent.speed*.78,Math.max(.1,(shipY-parent.y-radius-shipSize*.7-12)/(1600/FRAME_MS)));
  asteroids.splice(asteroids.indexOf(parent),1);
  lanes.forEach((lane,i)=>asteroids.push({id:++asteroidSerial,energyId:parent.energyId,kind:'fragment',fragment:true,
    x:parent.x,fromX:parent.x,toX:(lane+.5)*laneWidth,y:parent.y-i*75,born:gameTime,
    radius,speed,hp:1,group:null,armored:false,rush:false}));
  campaignMetrics?.count('fragmentations');campaignMetrics?.count('fragmentsSpawned',2);
  gameAudio.sfx('impact',{pan:audioPan(parent.x)});
}
function updateEncounterActors(dt) {
  for(const d of [...drones]) {
    if(gameTime>=d.expiresAt) {
      drones.splice(drones.indexOf(d),1);resolveThreat(d);campaignMetrics?.count('dronesEscaped');continue;
    }
    for(let i=lasers.length-1;i>=0;i--)if(laserTouchesEntity(lasers[i],d)) {
      lasers.splice(i,1);d.hp--;campaignMetrics?.count('droneHits');
      gameAudio.sfx('impact',{pan:audioPan(d.x)});
      if(d.hp<=0){drones.splice(drones.indexOf(d),1);combatScore+=25;resolveThreat(d);campaignMetrics?.count('dronesDestroyed');emitDebris(d.x,d.y,d.radius);break;}
    }
    if(d.hp<=0)continue;
    // Só conta o trecho ativo deste quadro, inclusive quando cruza o aquecimento.
    const activeMs=Math.max(0,gameTime-Math.max(gameTime-dt*FRAME_MS,d.activeAt));
    if(activeMs&&!noImpact())addQber(activeMs/1000*(level>=6?.85:.65),'droneEmitter');
    ctx.save();ctx.translate(d.x,d.y);ctx.strokeStyle='#91c7ff';ctx.fillStyle='#162c3d';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,-d.radius);ctx.lineTo(d.radius,0);ctx.lineTo(0,d.radius);ctx.lineTo(-d.radius,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,6+Math.sin(gameTime/160)*2,0,Math.PI*2);ctx.stroke();
    ctx.textAlign='center';ctx.font='10px Consolas,monospace';ctx.fillStyle='#b2d4ef';
    const labelX=Math.max(66,Math.min(width-66,d.x))-d.x;
    const compactFront=width<=900&&height>620&&!!interferenceFront;
    ctx.fillText('DRONE · '+d.hp+' PV',labelX,compactFront?d.radius+17:-d.radius-12);
    ctx.fillText(gameTime<d.activeAt?'ATIVANDO':'QBER +'+(level>=6?'0,85':'0,65')+'/s',labelX,d.radius+(compactFront?30:17));ctx.restore();
  }
  if(!scout)return;
  const s=scout;
  if(s.state==='tracking') {
    s.x=shipCenterX();
    if(gameTime>=s.lockAt){s.state='locked';s.lane=occupiedShipLane();s.x=(s.lane+.5)*laneWidth;gameAudio.sfx('spy',{pan:audioPan(s.x)});}
  }
  if(s.state==='locked'&&gameTime>=s.fireAt) {
    s.state='fired';gameAudio.sfx('noise',{pan:audioPan(s.x)});
    if(!noImpact()&&shipOverlapsLanes([s.lane])){addQber(5,'scout');campaignMetrics?.count('scoutContacts');}
  }
  if(gameTime>=s.endsAt){scout=null;resolveThreat(s);return;}
  ctx.save();ctx.strokeStyle='#e6c491';ctx.fillStyle='#e6c491';ctx.textAlign='center';ctx.font='10px Consolas,monospace';
  if(s.state!=='tracking') {
    ctx.fillStyle=s.state==='fired'?'#e6c49165':'#e6c49112';ctx.fillRect(s.lane*laneWidth+3,s.y,laneWidth-6,earthTop-s.y);
    ctx.setLineDash(s.state==='fired'?[]:[4,7]);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x,earthTop);ctx.stroke();ctx.setLineDash([]);
  }
  ctx.beginPath();ctx.arc(s.x,s.y,13,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#e6c491';
  ctx.fillText(s.state==='tracking'?'SONDA · RASTREANDO':s.state==='locked'?'MIRA FIXA · DESVIE':'PULSO DE RUÍDO',s.x<100?100:s.x>width-100?width-100:s.x,(width<=900&&height>620&&interferenceFront?s.y+35:s.y-24));ctx.restore();
}
