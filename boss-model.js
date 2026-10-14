/* Confrontos didáticos: padrões determinísticos; as relações físicas são analogias. */
const bossArenaConfig=typeof module!=='undefined'&&module.exports?require('./arena.js').OrbitalArena:OrbitalArena;
const quantumBosses = [
  { name:'Sentinela da Chave', concept:'QKD · verificação do canal', hp:[4,4,4],
    objective:'Desative um relé por ciclo com QBER abaixo de 8%. Após validar o primeiro, surge uma segunda salva: saia da marca e retorne para atacar. R renova nos respiros.',
    science:'QKD usa verificações para decidir se é possível obter uma chave segura. O escudo ligado ao QBER é uma analogia: erros exigem avaliação e podem levar ao descarte dos dados.' },
  { name:'Observador Fantasma', concept:'Medição e perturbação', hp:[16],
    objective:'Três sondas disputam sua atenção. O rastreio fixa a mira antes da salva; a varredura revela a verdadeira (✓). Atirar parado numa falsa (×) devolve ruído. Na segunda metade, a leitura muda durante o ciclo.',
    science:'Uma medição tem efeitos sobre um sistema quântico. Revelar uma sonda após a varredura representa essa ideia; não é um teste real de espionagem. QBER sozinho não identifica um espião.' },
  { name:'Tríade Hadamard', concept:'Superposição · porta H', hp:[8,8,8],
    objective:'As laterais abrem primeiro; depois, o centro. H aproveita uma breve abertura dos três. Na segunda metade, os núcleos mudam de trilha com aviso azul: acompanhe a formação.',
    science:'H pode preparar uma superposição de estados. Três alvos e disparos simultâneos são uma metáfora de jogo, não a leitura simultânea de resultados de um qubit.' },
  { name:'Gêmeos de Bell', concept:'Entrelaçamento · H + CNOT', hp:[16,16],
    objective:'Um acerto no lado aberto danifica o par. Há duas aberturas em lados opostos por ciclo, com até três acertos em cada; na segunda metade, apenas dois. Antecipe a travessia entre salvas.',
    science:'Um estado de Bell é um estado conjunto entrelaçado. Energia compartilhada e dano simultâneo são regras fictícias: entrelaçamento não permite transmitir ações instantâneas.' },
  { name:'Devorador de Coerência', concept:'Interação com o ambiente', hp:[20],
    objective:'Mantenha coerência de pelo menos 50% na faixa verde. A zona azul anuncia a próxima posição durante a abertura. Na segunda metade, a faixa estreita e uma terceira salva exige outra mudança.',
    science:'Interações com o ambiente podem degradar coerência. A zona de estabilização representa controle do ruído; não é uma região física que restaura automaticamente estados quânticos.' },
  { name:'Guardião da Síndrome', concept:'Correção de erros · auxiliares', hp:[5,5,5],
    objective:'A síndrome + aponta o módulo correto a cada ciclo. Módulos ○ devolvem ruído se você insistir neles. Na segunda metade, uma indicação azul anuncia outra síndrome durante a abertura.',
    science:'Medições de síndromes fornecem informação sobre certos erros sem medir diretamente o estado lógico. Atirar no módulo indicado é uma analogia de diagnóstico e correção, não cópia de qubits.' },
  { name:'Interferômetro', concept:'Interferência de amplitudes', hp:[20],
    objective:'Siga os corredores de A e B: as trilhas livres mudam entre as salvas. O núcleo − também muda. Na segunda metade, entra C: prepare outra travessia antes de terminar a abertura.',
    science:'Amplitudes podem reforçar-se ou cancelar-se. As janelas + e − e as trilhas de fuga são uma metáfora visual de interferência; os pulsos são ataques fictícios.' },
  { name:'Núcleo da Nave-Mãe', concept:'Operação quântica sob ruído', hp:[36],
    objective:'Três combinações: Bell com verificação de QBER (<9%); H com zonas de coerência (mínimo 50%); síndrome com rotas A/B/C. Leia os avisos e renove nos respiros. Cada estágio começa com um novo aviso.',
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
  get hadamard(){return this.phase===3||(this.phase===8&&this.stage===1);}
  get zone(){return [...this.zonePlans].reverse().find(z=>this.elapsed>=z.at)?.lanes||this.zonePlans[0].lanes;}
  get nextZone(){return this.stabilizing?this.zonePlans.find(z=>this.elapsed>=z.announceAt&&this.elapsed<z.at):undefined;}
  get openingStart(){return this.windows[0][0];}
  get openingEnd(){return this.windows.at(-1)[1];}
  get windowIndex(){return this.windows.findIndex(([from,to])=>this.elapsed>=from&&this.elapsed<to);}
  get opening(){return this.windowIndex>=0;}
  get recoveryStart(){return Math.max(...this.pulses.map(p=>p.at-this.roundStart))+450;}
  get selection(){return this.pressure&&this.elapsed>=4600?this.selections[1]:this.selections[0];}
  get nextSelection(){return this.syndrome&&this.pressure&&this.elapsed>=3300&&this.elapsed<4600?this.selections[1]:null;}
  get triadCenter(){return this.phase===8?this.zone[0]:this.pressure&&this.elapsed>=4400?this.centers[1]:this.centers[0];}
  get nextTriadCenter(){return this.phase===3&&this.pressure&&this.elapsed>=2400&&this.elapsed<4400?this.centers[1]:null;}
  prepareRound(playerLane) {
    // Mudanças de comportamento ficam para o ciclo seguinte, com novos avisos.
    this.pressure=this.phase===8||this.enraged;this.slotHits={};this.lastFeedback=-1000;
    this.relay=this.hp.findIndex(h=>h>0);
    const live=[2,0,1].filter(id=>this.hp[id]>0);
    this.selections=this.phase===8?[this.round%3,(this.round+1)%3]:[live[this.round%live.length],live[(this.round+1)%live.length]];
    const first=this.lane(this.round%2?5:1),second=this.lane(this.round%2?1:5),middle=this.lane(3);
    this.centers=[first,second,middle];
    if(this.phase===1)this.centers=[this.lane([1,5,3][Math.max(0,this.relay)]),this.opposite(this.lane([1,5,3][Math.max(0,this.relay)]))];
    if(this.phase===3){const center=this.lane([3,2,4][this.round%3]);this.centers=[center,this.clamp(center+(center<=middle?2:-2))];}
    if(this.syndrome)this.centers=[this.lane([1,3,5][this.selections[0]]),this.lane([1,3,5][this.selections[1]]),middle];
    const zoneCenter=this.lane([1,4,2,5,3][this.round%5]);
    const zoneLanes=center=>this.pressure?[center]:[center,this.clamp(center+(center<middle?1:-1))];
    this.zonePlans=[{at:0,announceAt:0,lanes:zoneLanes(zoneCenter)},
      {at:3100,announceAt:1100,lanes:zoneLanes(this.opposite(zoneCenter))}];
    if(this.pressure)this.zonePlans.push({at:5100,announceAt:3100,lanes:zoneLanes(middle)});
    if(this.stabilizing)this.centers=this.zonePlans.map(z=>z.lanes[0]);
    this.windows=this.bell?[[2600,4050],[4650,6550]]:
      this.phase===7?[[2600,3650],[4450,6550]]:
      this.phase===2?(this.pressure?[[3000,4200],[4800,6700]]:[[3000,5800]]):
      this.syndrome&&this.pressure?[[2600,4250],[4850,6600]]:
      this.phase===1?(this.pressure?[[2550,3850],[4450,6500]]:[[2550,5900]]):[[2600,6500]];
    this.pulses=[];
    const add=(center,at,label)=>this.pulses.push({id:this.round+':'+label,label,at:this.roundStart+at,
      announceAt:this.roundStart+Math.max(0,at-2200),lanes:this.lanes.filter(l=>!this.corridor(center).includes(l)),fired:false});
    add(this.centers[0],this.warning,'A');
    if(this.phase===2){const p=this.pulses[0];p.lockAt=this.roundStart+650;p.announceAt=this.roundStart;p.lanes=this.corridor(playerLane);p.tracking=true;}
    const double=this.stabilizing||this.bell||this.phase===7||this.pressure;
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
      this.coherence=Math.max(0,Math.min(100,this.coherence+(this.inZone?26:this.pressure?-26:-20)*elapsed/1000));
    }
    for(const pulse of this.pulses){
      if(pulse.tracking){pulse.lanes=this.corridor(player.lane);if(this.time>=pulse.lockAt){pulse.tracking=false;this.events.push({type:'lock'});}}
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
      const center=this.triadCenter;
      nodes=[0,1,2].map(i=>({id:this.phase===8?0:i,lane:this.clamp(center-1+i),hp:this.phase===8?this.health:this.hp[i],
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
      nodes=[{id:0,lane:this.stabilizing?this.zone[0]:this.centers[index],hp:this.health,open:open&&coherent,label:this.phase===7?'−':'C'}];
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
    if(this.complete)return 'DESAFIO SUPERADO · reparos e escudo ao concluir a retirada';
    const mode=this.pressure?'PRESSÃO · ':this.enraged?'PRÓXIMO CICLO MAIS INTENSO · ':'';
    if(this.phase===1)return mode+(qber>=8?'ESCUDO FECHADO · QBER ≥ 8% · renove com R':this.hp[this.relay]<=0?'RELÉ VALIDADO · próximo relé no novo ciclo':'RELÉ '+(this.relay+1)+'/3 · siga o iluminado');
    if(this.phase===2)return mode+(this.elapsed<2400?'RASTREIO → MIRA FIXA → VARREDURA':this.pressure&&this.elapsed<4400?'✓ VERDADEIRA · nova varredura em '+Math.max(0,(4400-this.elapsed)/1000).toFixed(1)+' s':'MIRE ✓ · × devolve ruído ao canal');
    if(this.stabilizing)return (this.phase===8?'2/3 · H + ':'')+'COERÊNCIA '+Math.round(this.coherence)+'% / mínimo 50% · '+(this.nextZone?'NOVA ZONA EM '+((this.nextZone.at-this.elapsed)/1000).toFixed(1)+' s':'sustente a faixa verde');
    if(this.syndrome)return (this.phase===8?'3/3 · ':'')+mode+'SÍNDROME + → TRILHA '+(this.lane([1,3,5][this.selection])+1)+(this.nextSelection!==null?' · PRÓXIMA '+(this.lane([1,3,5][this.nextSelection])+1):' · ○ devolve ruído');
    if(this.bell)return (this.phase===8?'1/3 · QKD + ':'')+mode+(this.phase===8&&qber>=9?'QBER ≥ 9% · renove para abrir':'BELL · '+(this.pressure?'2':'3')+' acertos por abertura · troque de lado');
    if(this.phase===3)return mode+(this.nextTriadCenter!==null?'NÚCLEOS VÃO MUDAR · siga a marca azul':'H · laterais primeiro, centro depois · sobreposição breve');
    return mode+'INTERFERÊNCIA · siga A → B'+(this.pressure?' → C':'')+' · − muda de trilha';
  }
}
if(typeof module!=='undefined'&&module.exports)module.exports={QuantumBoss,quantumBosses};
