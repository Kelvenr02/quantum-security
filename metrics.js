/* Diagnóstico agregado em memória; não envia nem grava dados do jogador. */
class CampaignMetrics {
  constructor(arena,startPhase=1) {
    this.data={schemaVersion:2,arena:{...arena},startPhase,outcome:'playing',activeMs:0,
      counts:{},qber:{peak:0,gained:{},removed:{}},phases:{},events:[]};
    this.previousPosition=null; this.setContext(startPhase,'wave');
  }
  setContext(phase,mode) {
    this.phase=phase;this.mode=mode;
    const row=this.data.phases[phase]??(this.data.phases[phase]={});
    this.segment=row[mode]??(row[mode]={activeMs:0,movingMs:0,stationaryMs:0,alertMs:0,
      criticalMs:0,regenReadyMs:0,regeneratingMs:0,compromisedMs:0,recoveryWindowMs:0,counts:{},qber:{peak:0,gained:{},removed:{}}});
  }
  count(name,amount=1) {
    for(const counts of [this.data.counts,this.segment.counts])counts[name]=(counts[name]||0)+amount;
  }
  qberChange(source,before,after) {
    const delta=after-before;if(!delta)return;
    for(const row of [this.data.qber,this.segment.qber]) {
      const bucket=delta>0?row.gained:row.removed;
      bucket[source]=(bucket[source]||0)+Math.abs(delta);row.peak=Math.max(row.peak,after);
    }
  }
  tick(ms,state) {
    this.data.activeMs+=ms;this.segment.activeMs+=ms;
    const before=state.previousPosition??this.previousPosition;
    const moving=before!==null&&Math.abs(state.position-before)>.00001;
    if(before!==null)this.count('distanceLanes',Math.abs(state.position-before));
    this.segment[moving?'movingMs':'stationaryMs']+=ms;this.previousPosition=state.position;
    if(state.qber>=7.7)this.segment.alertMs+=ms;
    if(state.qber>11)this.segment.criticalMs+=ms;
    if(state.regenReady)this.segment.regenReadyMs+=ms;
    if(state.regenerating)this.segment.regeneratingMs+=ms;
    if(state.compromised)this.segment.compromisedMs+=ms;
    if(state.recoveryWindow)this.segment.recoveryWindowMs+=ms;
    this.data.qber.peak=Math.max(this.data.qber.peak,state.qber);
    this.segment.qber.peak=Math.max(this.segment.qber.peak,state.qber);
  }
  event(type,details={}) {
    if(this.data.events.length>=128)this.data.events.shift();
    this.data.events.push({type,phase:this.phase,mode:this.mode,atMs:this.data.activeMs,...details});
  }
  bossOpening(details,damage=0) {
    if(!details)return;
    const rows=this.segment.openings??(this.segment.openings=[]);
    let row=rows.at(-1);
    if(!row||['attempt','stage','round','window'].some(key=>row[key]!==details[key])){
      row={...details,hits:0,damage:0};rows.push(row);
    }
    if(damage>0){row.hits++;row.damage+=damage;}
  }
  finish(outcome,details={}) {
    if(this.data.outcome!=='playing')return;
    this.data.outcome=outcome;this.event(outcome,details);
  }
  snapshot(state={}) { return JSON.parse(JSON.stringify({...this.data,state})); }
}
if(typeof module!=='undefined'&&module.exports)module.exports={CampaignMetrics};
