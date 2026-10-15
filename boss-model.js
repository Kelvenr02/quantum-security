/* Confrontos didáticos: padrões determinísticos; as relações físicas são analogias. */
const bossArenaConfig=typeof module!=='undefined'&&module.exports?require('./arena.js').OrbitalArena:OrbitalArena;
const quantumBosses = [
  { name:'Sentinela da Chave', concept:'QKD · verificação do canal', hp:[4,4,4],
    objective:'Destrua os 3 relés, um de cada vez.',
    instructions:[
      'Fique abaixo do relé marcado ATIVO. A nave atira automaticamente.',
      'O relé só recebe dano com QBER abaixo de 8%. Se bloquear, use R no aviso RESPIRO.',
      'Depois de destruir um relé, desvie das faixas A/B e espere o próximo abrir.'
    ],
    science:'QKD usa verificações para decidir se é possível obter uma chave segura. O escudo ligado ao QBER é uma analogia: erros exigem avaliação e podem levar ao descarte dos dados.' },
  { name:'Observador Fantasma', concept:'Medição e perturbação', hp:[16],
    objective:'Destrua a sonda verdadeira, marcada com ✓.',
    instructions:[
      'A mira acompanha sua nave. Quando parar de seguir, saia das faixas marcadas com A.',
      'Espere aparecer ✓. Alinhe a nave com essa sonda quando aparecer ATIVO.',
      'Insistir em × aumenta o QBER. A sonda correta muda durante a luta: procure o novo ✓.'
    ],
    science:'Uma medição tem efeitos sobre um sistema quântico. Revelar uma sonda após a varredura representa essa ideia; não é um teste real de espionagem. QBER sozinho não identifica um espião.' },
  { name:'Tríade Hadamard', concept:'Superposição · porta H', hp:[8,8,8],
    objective:'Destrua os 3 núcleos H.',
    instructions:[
      'Mire nos núcleos ATIVOS: os dois das pontas abrem antes do núcleo do meio.',
      'Recolha a cápsula H que cai. Ela faz a nave atirar também nas duas trilhas vizinhas.',
      'Os núcleos se juntam e se separam. Siga os contornos azuis e troque de corredor entre A e B.'
    ],
    science:'H pode preparar uma superposição de estados. Três alvos e disparos simultâneos são uma metáfora de jogo, não a leitura simultânea de resultados de um qubit.' },
  { name:'Gêmeos de Bell', concept:'Entrelaçamento · H + CNOT', hp:[16,16],
    objective:'Destrua o par de núcleos conectados.',
    instructions:[
      'Mire no núcleo marcado BELL quando ele estiver ATIVO. Cada acerto danifica os dois lados.',
      'O lado BELL alterna. Acompanhe a mudança e mire no novo alvo ATIVO.',
      'Cada abertura aceita poucos acertos. Saia das faixas A/B antes de zerar, mesmo que ainda possa atirar.'
    ],
    science:'Um estado de Bell é um estado conjunto entrelaçado. Energia compartilhada e dano simultâneo são regras fictícias: entrelaçamento não permite transmitir ações instantâneas.' },
  { name:'Devorador de Coerência', concept:'Interação com o ambiente', hp:[20],
    objective:'Destrua o núcleo C com coerência de 50% ou mais.',
    instructions:[
      'Na faixa verde, carregue a coerência até perto de 100%. Abaixo de 50%, seus tiros não causam dano.',
      'Saia da faixa para mirar no C ATIVO. A coerência cai: faça uma investida e volte para recuperar.',
      'Desvie de A/B/C. O contorno azul anuncia a faixa verde do próximo ciclo.'
    ],
    science:'Interações com o ambiente podem degradar coerência. A zona de estabilização representa controle do ruído; não é uma região física que restaura automaticamente estados quânticos.' },
  { name:'Guardião da Síndrome', concept:'Correção de erros · auxiliares', hp:[5,5,5],
    objective:'Destrua os 3 módulos, mirando no símbolo +.',
    instructions:[
      'Mire no módulo + do chefe quando ele estiver ATIVO. Insistir nos módulos ○ aumenta o QBER.',
      'Quando o + mudar de módulo, alinhe a nave com o novo alvo.',
      'Recolha as cápsulas + que caem para reduzir QBER e recarga de R. Continue desviando de A/B.'
    ],
    science:'Medições de síndromes fornecem informação sobre certos erros sem medir diretamente o estado lógico. Atirar no módulo indicado é uma analogia de diagnóstico e correção, não cópia de qubits.' },
  { name:'Interferômetro', concept:'Interferência de amplitudes', hp:[20],
    objective:'Destrua o núcleo − enquanto desvia dos ataques em sequência.',
    instructions:[
      'Veja a letra da próxima salva: A, depois B e, na segunda metade, C.',
      'Antes de cada contagem zerar, vá para uma trilha sem a faixa daquela letra. O lugar seguro muda.',
      'Entre os desvios, mire no núcleo − quando estiver ATIVO. Ele também muda de trilha.'
    ],
    science:'Amplitudes podem reforçar-se ou cancelar-se. As janelas + e − e as trilhas de fuga são uma metáfora visual de interferência; os pulsos são ataques fictícios.' },
  { name:'Núcleo da Nave-Mãe', concept:'Operação quântica sob ruído', hp:[36],
    objective:'Vença os 3 estágios da nave-mãe.',
    instructions:[
      '1º estágio: mire no BELL ATIVO com QBER abaixo de 9%. Use R no RESPIRO se precisar renovar.',
      '2º estágio: recupere coerência na faixa verde; saia para atacar os H com 50% ou mais e volte. Recolha H.',
      '3º estágio: mire no módulo + ATIVO. Troque de trilha para escapar de A, B e C.'
    ],
    science:'Sistemas quânticos combinam preparação, operações, medições e controle de erros. O combate reúne analogias desses recursos; não executa um algoritmo ou protocolo quântico real.' }
];

// Relógio, rotas e alvos puros: não dependem do canvas, do áudio ou de timers reais.
class QuantumBoss {
  constructor(phase,initialLane=Math.floor(bossArenaConfig.lanes/2),laneCount=bossArenaConfig.lanes) {
    this.laneCount=laneCount;this.phase=phase;this.definition=quantumBosses[phase-1];this.hp=[...this.definition.hp];
    this.maxHp=this.hp.reduce((a,b)=>a+b,0);this.time=0;this.round=0;this.roundStart=0;
    this.coherence=65;this.events=[];this.lastHits={};this.hitAt=-1000;this.playerLane=initialLane;
    this.stationaryMs=0;this.lastPosition=initialLane;this.prepareRound(initialLane);
  }
  get health(){return this.hp.reduce((a,b)=>a+b,0);}
  get complete(){return this.health<=0;}
  get stage(){return this.phase===8?(this.health>24?0:this.health>12?1:2):0;}
  get enraged(){return this.phase===1?this.health<=8:this.health<=this.maxHp/2;}
  get period(){return this.phase===8?10000:this.phase>=5?9600:9000;}
  get warning(){return this.phase===2?2650:2200;}
  get elapsed(){return this.time-this.roundStart;}
  get lanes(){return Array.from({length:this.laneCount},(_,i)=>i);}
  lane(reference){return Math.round(reference*(this.laneCount-1)/6);}
  clamp(lane){return Math.max(0,Math.min(this.laneCount-1,lane));}
  corridor(center){return this.lanes.filter(l=>Math.abs(l-center)<=1);}
  opposite(center){return this.lane(center<(this.laneCount-1)/2?5:1);}
  get stabilizing(){return this.phase===5||(this.phase===8&&this.stage===1);}
  get bell(){return this.phase===4||(this.phase===8&&this.stage===0);}
  get syndrome(){return this.phase===6||(this.phase===8&&this.stage===2);}
  get syndromeReading(){return this.syndrome?{code:['10','11','01'][this.selection],module:this.selection+1}:null;}
  get hadamard(){return this.phase===3||(this.phase===8&&this.stage===1);}
  get zone(){return [...this.zonePlans].reverse().find(z=>this.elapsed>=z.at)?.lanes||this.zonePlans[0].lanes;}
  get nextZone(){
    const plan=this.stabilizing?this.zonePlans.find(z=>this.elapsed>=z.announceAt&&this.elapsed<z.at):undefined;
    return plan&&this.enraged?{...plan,lanes:[plan.lanes[0]]}:plan;
  }
  get openingStart(){return this.windows[0][0];}
  get openingEnd(){return this.windows.at(-1)[1];}
  get windowIndex(){return this.windows.findIndex(([from,to])=>this.elapsed>=from&&this.elapsed<to);}
  get opening(){return this.windowIndex>=0;}
  get recoveryStart(){return Math.max(...this.pulses.map(p=>p.at-this.roundStart))+450;}
  get selection(){return this.pressure&&this.elapsed>=4600?this.selections[1]:this.selections[0];}
  get nextSelection(){return this.syndrome&&this.pressure&&this.elapsed>=3300&&this.elapsed<4600?this.selections[1]:null;}
  get attackLane(){
    const left=Math.min(...this.zone),right=Math.max(...this.zone);
    const gap=this.hadamard?3:2;
    return left<(this.laneCount-1)/2?Math.min(this.laneCount-2,right+gap):Math.max(1,left-gap);
  }
  get triadCenter(){return this.phase===8?this.attackLane:this.triadPlans[this.pressure&&this.elapsed>=4400?1:0];}
  get nextTriadCenter(){return this.phase===3&&this.pressure&&this.elapsed>=2400&&this.elapsed<4400?this.triadPlans[1]:null;}
  formation(center,spread){
    const step=spread?2:1,mid=Math.max(step,Math.min(this.laneCount-1-step,center));
    return [mid-step,mid,mid+step];
  }
  get triadLanes(){return this.formation(this.triadCenter,this.phase===3&&(this.round+(this.pressure&&this.elapsed>=4400?1:0))%2===1);}
  get nextTriadLanes(){return this.nextTriadCenter===null?null:this.formation(this.nextTriadCenter,(this.round+1)%2===1);}
  prepareRound(playerLane) {
    // Mudanças de comportamento ficam para o ciclo seguinte, com novos avisos.
    this.pressure=this.phase===8||this.enraged;this.slotHits={};this.lastFeedback=-1000;
    this.relay=this.hp.findIndex(h=>h>0);
    const live=[2,0,1].filter(id=>this.hp[id]>0);
    this.selections=this.phase===8?[this.round%3,(this.round+1)%3]:[live[this.round%live.length],live[(this.round+1)%live.length]];
    const first=this.lane(this.round%2?5:1),second=this.lane(this.round%2?1:5),middle=this.lane(3);
    this.centers=[first,second,middle];
    if(this.phase===1)this.centers=[this.lane([1,5,3][Math.max(0,this.relay)]),this.opposite(this.lane([1,5,3][Math.max(0,this.relay)]))];
    if(this.phase===3){
      const center=this.lane([3,2,4][this.round%3]);this.triadPlans=[center,this.clamp(center+(center<=middle?2:-2))];
      // A e B exigem corredores distintos, mesmo antes da metade da vida.
      this.centers=[first,second];
    }
    if(this.syndrome)this.centers=[this.lane([1,3,5][this.selections[0]]),this.lane([1,3,5][this.selections[1]]),middle];
    const zoneAt=round=>{
      let center=this.lane([1,4,2,5,3][round%5]);
      // Em sete trilhas, o centro não deixa espaço para três alvos separados de H.
      if(this.hadamard&&center<4&&this.laneCount-1-center<4)center--;
      return center;
    };
    const zoneCenter=zoneAt(this.round);
    const zoneLanes=center=>this.pressure?[center]:[center,this.clamp(center+(center<middle?1:-1))];
    this.zonePlans=[{at:0,announceAt:0,lanes:zoneLanes(zoneCenter)},
      {at:this.period,announceAt:this.period-2000,lanes:zoneLanes(zoneAt(this.round+1))}];
    if(this.stabilizing)this.centers=[this.zone[0],this.attackLane,this.zone[0]];
    this.windows=this.bell?[[2600,4050],[4650,6550]]:
      this.phase===7?[[2600,3650],[4450,6550]]:
      this.phase===2?(this.pressure?[[3000,4200],[4800,6700]]:[[3000,5800]]):
      this.syndrome&&this.pressure?[[2600,4250],[4850,6600]]:
      this.phase===1?(this.pressure?[[2550,3850],[4450,6500]]:[[2550,5900]]):[[2600,6500]];
    this.pulses=[];this.announcedPulses=new Set();
    // Antecipar B/C facilita a leitura sem mudar impactos, aberturas ou respiros.
    const add=(center,at,label)=>this.pulses.push({id:this.round+':'+label,label,at:this.roundStart+at,
      announceAt:this.roundStart+Math.max(0,at-2400),lanes:this.lanes.filter(l=>!this.corridor(center).includes(l)),fired:false});
    add(this.centers[0],this.warning,'A');
    if(this.phase===2){const p=this.pulses[0];p.lockAt=this.roundStart+650;p.announceAt=this.roundStart;p.lanes=this.corridor(playerLane);p.tracking=true;}
    const double=this.phase===3||this.stabilizing||this.bell||this.phase===7||this.pressure;
    if(double)add(this.centers[1],this.warning+1800,'B');
    if((this.stabilizing||this.phase===7||(this.phase===8&&this.stage===2))&&this.pressure)add(this.centers[2],this.warning+3800,'C');
    this.events.push({type:'round',pressure:this.pressure,stage:this.stage});
  }
  delayRound(ms){
    this.roundStart+=ms;
    for(const p of this.pulses){p.at+=ms;p.announceAt+=ms;if(p.lockAt!==undefined)p.lockAt+=ms;}
  }
  drainEvents(){return this.events.splice(0);}
  advance(ms,player) {
    if(this.complete)return [];
    const elapsed=Math.max(0,Math.min(50,ms)),position=player.position??player.lane;
    this.stationaryMs=Math.abs(position-this.lastPosition)<.02?this.stationaryMs+elapsed:0;this.lastPosition=position;
    this.time+=elapsed;this.playerLane=player.lane;
    if(this.elapsed>=this.period){this.roundStart+=this.period;this.round++;this.prepareRound(player.lane);}
    if(this.stabilizing){
      const position=player.position??player.lane;
      this.inZone=position>=Math.min(...this.zone)-.4&&position<=Math.max(...this.zone)+.4;
      // Reserva para uma travessia, investida e retorno; recuperar não permite atirar no alvo.
      this.coherence=Math.max(0,Math.min(100,this.coherence+(this.inZone?34:this.pressure?-16:-14)*elapsed/1000));
    }
    for(const pulse of this.pulses){
      if(!this.announcedPulses.has(pulse.id)&&this.time>=pulse.announceAt){this.announcedPulses.add(pulse.id);this.events.push({type:'telegraph',tracking:!!pulse.tracking,lanes:pulse.lanes,label:pulse.label});}
      if(pulse.tracking){pulse.lanes=this.corridor(player.lane);if(this.time>=pulse.lockAt){pulse.tracking=false;this.events.push({type:'lock',lanes:pulse.lanes});}}
      if(!pulse.fired&&this.time>=pulse.at){pulse.fired=true;this.events.push({type:'pulse',id:pulse.id,lanes:pulse.lanes,label:pulse.label});}
    }
    return this.drainEvents();
  }
  targets(qber=0) {
    const open=this.opening,coherent=!this.stabilizing||this.coherence>=50;
    let nodes;
    if(this.phase===1)nodes=this.hp.map((hp,id)=>({id,lane:this.lane([1,5,3][id]),hp,open:open&&id===this.relay&&qber<8,label:hp<=0?'✓':'R'+(id+1)}));
    else if(this.phase===2){
      const real=(this.round+(this.pressure&&this.elapsed>=4400?1:0))%3,revealed=this.elapsed>=2400;
      nodes=[1,3,5].map((lane,i)=>({id:i===real?0:-1,lane:this.lane(lane),hp:this.health,open:open&&i===real,label:revealed?(i===real?'✓':'×'):'?',decoy:revealed&&i!==real}));
    }else if(this.hadamard){
      nodes=this.triadLanes.map((lane,i)=>({id:this.phase===8?0:i,lane,hp:this.phase===8?this.health:this.hp[i],
        open:open&&coherent&&(this.phase===8||(i===1?this.elapsed>=4000:this.elapsed<4500)),label:'H'}));
    }else if(this.bell){
      const side=(this.round+(this.elapsed>=4400?1:0))%2,cap=this.pressure?2:3;
      nodes=[1,5].map((lane,i)=>({id:this.phase===8?0:i,lane:this.lane(lane),hp:this.phase===8?this.health:this.hp[i],
        open:open&&i===side&&(this.slotHits[this.windowIndex]||0)<cap&&(this.phase!==8||qber<9),label:i===side?'BELL':'◈'}));
    }else if(this.syndrome){
      nodes=[0,1,2].map(i=>({id:this.phase===8?(i===this.selection?0:-1):i,lane:this.lane([1,3,5][i]),hp:this.phase===8?this.health:this.hp[i],
        open:open&&i===this.selection&&(this.phase!==8||(this.slotHits[this.windowIndex]||0)<3),label:this.phase!==8&&this.hp[i]<=0?'✓':i===this.selection?'+':'○',decoy:i!==this.selection}));
    }else{
      const index=this.phase===7?(this.pressure&&this.elapsed>=5400?2:this.elapsed>=4200?1:0):0;
      nodes=[{id:0,lane:this.stabilizing?this.attackLane:this.centers[index],hp:this.health,open:open&&coherent,label:this.phase===7?'−':'C'}];
    }
    return nodes.map(n=>({...n,open:n.open&&n.hp>0}));
  }
  hit(id,qber,lane) {
    if(this.complete)return false;
    const node=this.targets(qber).find(n=>n.id===id&&(lane===undefined||n.lane===lane));
    if(!node?.open){
      if(node?.decoy&&this.opening&&node.lane===this.playerLane&&this.stationaryMs>=600&&this.time-this.lastFeedback>=900){this.lastFeedback=this.time;this.events.push({type:'noise',amount:this.phase===2?.8:.6,source:this.phase===2?'bossDecoy':'bossSyndrome'});}
      return false;
    }
    const key=id+':'+node.lane;
    if(this.time-(this.lastHits[key]??-1000)<180)return false;
    this.lastHits[key]=this.time;this.hitAt=this.time;this.slotHits[this.windowIndex]=(this.slotHits[this.windowIndex]||0)+1;
    const previousStage=this.stage;
    if(this.phase===4)this.hp=this.hp.map(h=>Math.max(0,h-1));else this.hp[id]=Math.max(0,this.hp[id]-1);
    if(this.stage!==previousStage&&!this.complete){this.round++;this.roundStart=this.time;this.coherence=65;this.prepareRound(this.playerLane);}
    return true;
  }
  hint(qber) {
    if(this.complete)return 'CHEFE VENCIDO · aguarde a conclusão';
    const nodes=this.targets(qber),active=nodes.filter(n=>n.open);
    const lanes=list=>list.map(n=>n.lane+1).join('/');
    const wait=this.windows.find(([from])=>from>this.elapsed)?.[0];
    const opens=wait===undefined?'no próximo ciclo':'em '+((wait-this.elapsed)/1000).toFixed(1)+' s';
    if(this.phase===1){
      if(this.hp[this.relay]<=0){const next=this.hp.findIndex(h=>h>0);return 'RELÉ VALIDADO · próximo: R'+(next+1)+' na TRILHA '+(this.lane([1,5,3][next])+1)+'. Desvie até abrir.';}
      if(qber>=8)return 'RELÉ BLOQUEADO · QBER precisa ficar abaixo de 8%. Use R no RESPIRO.';
      return active.length?'ATAQUE R'+(this.relay+1)+' · TRILHA '+lanes(active):'RELÉ FECHADO · abre '+opens+'. Desvie das salvas.';
    }
    if(this.phase===2){
      if(this.elapsed<650)return 'A mira segue você. Quando fixar, saia das faixas A.';
      if(this.elapsed<2400)return 'Mira fixa: saia de A. Depois, procure o ✓.';
      const real=this.targets(qber).find(n=>n.label==='✓');
      return (active.length?'ATAQUE ✓':'✓ FECHADO · abre '+opens)+' · TRILHA '+(real.lane+1)+
        (this.pressure&&this.elapsed<4400?' · nova varredura em '+((4400-this.elapsed)/1000).toFixed(1)+' s':'');
    }
    if(this.stabilizing){
      const recover=this.coherence<50?'SEM DANO · volte à faixa RECUPERAR.':
        this.inZone&&this.coherence<90?'RECUPERE até perto de 100%; depois saia para atacar.':
        active.length?'ATAQUE '+(this.hadamard?'H':'C')+' · TRILHA '+lanes(active)+'. Depois volte para recuperar.':
        'ALVO FECHADO · abre '+opens+'. Aproveite para recuperar.';
      return (this.phase===8?'2/3 · ':'')+'COERÊNCIA '+Math.round(this.coherence)+'% · '+recover+
        (this.nextZone?' Faixa muda em '+((this.nextZone.at-this.elapsed)/1000).toFixed(1)+' s.':'');
    }
    if(this.syndrome){
      if(this.phase!==8&&this.hp[this.selection]<=0)return 'MÓDULO CORRIGIDO · desvie até aparecer outro +.';
      const capped=this.phase===8&&this.opening&&(this.slotHits[this.windowIndex]||0)>=3;
      return (this.phase===8?'3/3 · ':'')+'LEITURA '+this.syndromeReading.code+' → M'+this.syndromeReading.module+' · '+(capped?'COTA ATINGIDA · aguarde nova abertura.':
        active.length?'ATAQUE MÓDULO + · TRILHA '+lanes(active):'MÓDULO + FECHADO · TRILHA '+(this.lane([1,3,5][this.selection])+1)+' · abre '+opens)+
        (this.nextSelection!==null?' · próximo MÓDULO +: TRILHA '+(this.lane([1,3,5][this.nextSelection])+1):'');
    }
    if(this.bell){
      const stage=this.phase===8?'1/3 · ':'';
      if(this.phase===8&&qber>=9)return stage+'QBER alto: use R no RESPIRO; precisa ficar abaixo de 9%.';
      const target=active[0],remaining=(this.pressure?2:3)-(this.slotHits[this.windowIndex]||0);
      const nextSide=(this.round+(wait===undefined||wait>=4400?1:0))%2,nextLane=this.lane([1,5][nextSide])+1;
      return stage+(target?'ATAQUE BELL · TRILHA '+(target.lane+1)+' · RESTAM '+remaining+' ACERTO(S).':
        this.opening&&remaining<=0?'COTA ATINGIDA · desvie; próximo BELL na TRILHA '+nextLane+'.':
        'BELL FECHADO · abre '+opens+'. Próximo BELL: TRILHA '+nextLane+'.');
    }
    if(this.phase===3){
      const movement=this.nextTriadCenter!==null?' · MUDANÇA: siga os contornos azuis':
        ' · '+(this.triadLanes[2]-this.triadLanes[0]>2?'SEPARADOS':'PRÓXIMOS');
      if(active.length)return 'ATAQUE H · TRILHA '+lanes(active)+movement;
      if(this.hp[1]>0&&this.elapsed>=this.openingStart&&this.elapsed<4000)return 'MEIO FECHADO · abre em '+((4000-this.elapsed)/1000).toFixed(1)+' s'+movement;
      return 'H VIVOS FECHADOS · '+(this.hp[1]<=0&&this.elapsed>=4500?'Pontas abrem no próximo ciclo.':'Abrem '+opens+'.')+' Desvie.'+movement;
    }
    return active.length?'ATAQUE − · TRILHA '+lanes(active)+' · continue desviando da próxima letra.':
      'NÚCLEO − FECHADO · abre '+opens+'. Siga o corredor da próxima salva.';
  }
  targetStatus(node,qber=0) {
    if(node.hp<=0)return 'FEITO';
    if(node.label==='?')return 'AGUARDE';
    if(node.decoy)return 'NÃO MIRAR';
    if(node.open)return this.syndrome?'+ ATIVO':'ATIVO';
    if(this.phase===1&&node.id!==this.relay)return 'AGUARDE';
    if((this.phase===1&&qber>=8)||(this.phase===8&&this.stage===0&&qber>=9))return 'QBER ALTO';
    if(this.stabilizing&&this.coherence<50)return 'C <50%';
    return this.syndrome&&node.label==='+'?'MÓD +':'FECHADO';
  }
}
if(typeof module!=='undefined'&&module.exports)module.exports={QuantumBoss,quantumBosses};
