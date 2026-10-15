/* Experimentos clássicos locais. Nenhum botão do laboratório altera a campanha. */
const scienceTopics=Object.freeze({
  key:{title:'Quantum Security · comparar amostras',game:'R pede uma nova chave; renovar não elimina a fonte de ruído.',limit:'Amostra ilustrativa, publicada e descartada. QBER sozinho não prova espionagem nem valida a segurança. O produto é uma proposta acadêmica de integração e gestão de chaves QKD.'},
  hadamard:{title:'H · preparar e medir',game:'A cápsula H inspira a cobertura de três trilhas.',limit:'Tiros simultâneos são uma metáfora. Uma medição nesta base produz um resultado; as barras mostram probabilidades calculadas, não uma leitura completa de um qubit desconhecido.'},
  bell:{title:'H + CNOT · formar um par',game:'O fio azul e o dano compartilhado representam a ideia de um estado conjunto.',limit:'Destruição conjunta é ficção. Correlações não permitem enviar mensagens instantâneas. Nesta demonstração, q0 é o qubit da esquerda e ambos são medidos na mesma base.'},
  coherence:{title:'Ambiente · perder contraste',game:'A faixa RECUPERAR representa estabilização para permitir novas investidas.',limit:'Modelo simples de desfasamento. A barra C e seu limite de 50% são regras do jogo. Controlar ruído não restaura automaticamente um estado desconhecido já degradado.'},
  syndrome:{title:'Síndrome · localizar uma inversão',game:'A leitura do chefe indica M1, M2 ou M3; o + continua confirmando o alvo.',limit:'Exemplo de código de repetição com, no máximo, uma inversão X. Não corrige todos os tipos de erro e não copia um qubit desconhecido. Mede paridades com auxiliares, sem ler o bit lógico.'},
  interference:{title:'Interferência · somar amplitudes',game:'As rotas do Interferômetro evocam reforço e cancelamento.',limit:'Circuito ilustrativo H → fase → H. As faixas de ataque são ficção; amplitudes não são paredes nem trajetos da nave.'}
});
function syndromeCode(module){return ['00','10','11','01'][module];}
class ScienceExperiment {
  constructor(kind,random=Math.random){if(!scienceTopics[kind])throw Error('Experimento desconhecido');this.kind=kind;this.random=random;this.reset();}
  reset(){this.amplitudes=this.kind==='bell'?[1,0,0,0]:[1,0];this.result=null;this.noise=false;this.requested=false;this.visibility=1;this.error=0;this.phase=0;this.message='Experimente; a campanha permanece intacta.';}
  get probabilities(){
    if(this.kind==='coherence')return [(1+this.visibility)/2,(1-this.visibility)/2];
    if(this.kind==='interference')return this.phase?[0,1]:[1,0];
    return this.amplitudes.map(a=>a*a);
  }
  measure(){
    if(this.result!==null)return this.result;
    const p=this.probabilities,r=this.random();let sum=0,index=p.length-1;
    for(let i=0;i<p.length;i++){sum+=p[i];if(r<sum){index=i;break;}}
    this.result=index;
    if(['hadamard','bell'].includes(this.kind))this.amplitudes=this.amplitudes.map((_,i)=>i===index?1:0);
    return index;
  }
  operate(action,value){
    if(action==='reset'){this.reset();return;}
    if(action==='h'&&['hadamard','bell'].includes(this.kind)){
      const a=this.amplitudes,step=this.kind==='bell'?2:1,b=[...a];
      for(let i=0;i<step;i++){b[i]=(a[i]+a[i+step])/Math.SQRT2;b[i+step]=(a[i]-a[i+step])/Math.SQRT2;}
      this.amplitudes=b;this.result=null;this.message='H aplicado. Medir dará um único resultado, conforme as probabilidades.';
    }else if(action==='cnot'&&this.kind==='bell'){
      [this.amplitudes[2],this.amplitudes[3]]=[this.amplitudes[3],this.amplitudes[2]];this.result=null;
      this.message='CNOT: o segundo qubit inverte quando o primeiro é 1. Prepare |00⟩, aplique H e depois CNOT.';
    }else if(action==='measure'&&['hadamard','bell','interference'].includes(this.kind)){
      const result=this.measure();this.message='Resultado: '+(this.kind==='bell'?result.toString(2).padStart(2,'0'):result)+'. Repetir a medição sem nova operação mantém o resultado.';
    }else if(this.kind==='key'&&action==='noise'){
      this.noise=!this.noise;this.requested=false;this.message='A amostra mudou; compare os oito pares de bits.';
    }else if(this.kind==='key'&&action==='compare'){
      this.message=(this.noise?'2 divergências / 8 = 25%':'0 divergências / 8 = 0%')+' nesta amostra. Um teste isolado não valida uma chave.';
    }else if(this.kind==='key'&&action==='request'){
      this.requested=true;this.message='Quantum Security: chave descartada; nova chave solicitada aos equipamentos QKD. O ruído permanece.';
    }else if(this.kind==='coherence'&&action==='noise'){
      this.visibility=Math.max(0,this.visibility-.25);this.message='Mais desfasamento: menos contraste após recombinar com H. PREPARAR inicia outro estado.';
    }else if(this.kind==='syndrome'&&action==='inject'&&[0,1,2,3].includes(value)){
      this.error=value;this.message='Leitura das paridades q0⊕q1, q1⊕q2: '+syndromeCode(this.error)+'. Consulte a legenda.';
    }else if(this.kind==='syndrome'&&action==='correct'&&[1,2,3].includes(value)){
      if(this.error===value){this.error=0;this.message='Correção X no módulo indicado: síndrome 00. O bit lógico não foi medido.';}
      else this.message='Esse módulo não corresponde à leitura. Nenhuma correção foi aplicada; tente outro.';
    }else if(this.kind==='interference'&&action==='phase'){
      this.phase=this.phase?0:Math.PI;this.result=null;this.message='Nova preparação com fase '+(this.phase?'π':'0')+'. Some amplitudes antes de calcular probabilidades.';
    }
  }
}
const scienceCueText=Object.freeze({
  renew:'QUANTUM SECURITY · nova chave solicitada; a fonte de ruído permanece.',
  validated:'QUANTUM SECURITY · chave renovada nesta simulação; comandos seguem pelo rádio.',
  h:'CIÊNCIA · H prepara superposição; três tiros são uma analogia.',
  bell:'CIÊNCIA · par correlacionado; dano compartilhado é uma regra fictícia.',
  noise:'CIÊNCIA · erros podem vir de ruído ou espionagem; QBER não distingue sozinho.',
  syndrome:'CIÊNCIA · síndrome indica o erro; corrigir não é copiar um qubit.',
  correction:'CIÊNCIA · a cápsula + reduz QBER; não executa um código quântico completo.'
});
let scienceHintsEnabled=true;
try{const saved=JSON.parse(globalThis.localStorage?.getItem('qubit-science-v1')||'null');if(typeof saved?.hints==='boolean')scienceHintsEnabled=saved.hints;}catch{}
let scienceSeen=new Set(),sciencePending=null,scienceLastAt=-Infinity;
function resetScienceCues(){scienceSeen=new Set();sciencePending=null;scienceLastAt=-Infinity;}
function queueScienceCue(kind){if(scienceHintsEnabled&&scienceCueText[kind]&&!scienceSeen.has(level+':'+kind))sciencePending={kind,phase:level,expiresAt:gameTime+6000};}
function scienceCueUnsafe(urgent){
  const waveDanger=!boss&&(asteroids.some(a=>a.speed>0&&(shipY-a.y)/a.speed*FRAME_MS<1000&&a.y<shipY)||scout&&scout.fireAt-gameTime<1000||interferenceFront&&!interferenceFront.passed);
  return urgent||waveDanger||isCompromised||qber>=channelRules.alert&&!isRegen;
}
function flushScienceCue(urgent){
  const cue=sciencePending;if(!cue)return;
  if(cue.phase!==level||gameTime>cue.expiresAt||!scienceHintsEnabled){sciencePending=null;return;}
  if(scienceCueUnsafe(urgent)||gameTime-scienceLastAt<20000||combatNotice&&combatNotice.until>gameTime)return;
  notifyCombat(scienceCueText[cue.kind],-1);scienceSeen.add(level+':'+cue.kind);scienceLastAt=gameTime;sciencePending=null;
}
const sciencePanels={};
function defaultScienceTopic(){return boss?.model.syndrome?'syndrome':boss?.model.stabilizing?'coherence':['key','key','hadamard','bell','coherence','syndrome','interference','bell'][level-1];}
function configureSciencePanel(context){sciencePanels[context]=new ScienceExperiment(defaultScienceTopic());if(context==='phase')$('phaseLabDetails').open=false;renderSciencePanel(context);}
function renderSciencePanel(context){
  const e=sciencePanels[context],topic=scienceTopics[e.kind],button=(action,text,value)=>'<button type="button" data-science-action="'+action+'"'+(value===undefined?'':' data-science-value="'+value+'"')+'>'+text+'</button>';
  let visual='',actions='';
  if(['hadamard','bell','interference','coherence'].includes(e.kind)){
    const circuit=e.kind==='bell'?'q0: |0⟩ ─ H ─ ● ─ medir<br>q1: |0⟩ ──── ⊕ ─ medir':e.kind==='interference'?'|0⟩ ─ H ─ '+(e.phase?'Z (fase π)':'I (fase 0)')+' ─ H ─ medir':e.kind==='coherence'?'|+⟩ ─ desfasamento ─ H ─ medir':'|0⟩ ─ H ─ medir';
    visual='<small>Receita de referência; as portas não são aplicadas automaticamente nos exemplos H e Bell.</small><div class="science-circuit" aria-label="Circuito de referência">'+circuit+'</div><div class="science-bars" aria-label="Probabilidades calculadas">'+e.probabilities.map((p,i)=>'<div><span>|'+i.toString(2).padStart(e.kind==='bell'?2:1,'0')+'⟩</span><meter min="0" max="1" value="'+p+'">'+Math.round(p*100)+'%</meter><b>'+Math.round(p*100)+'%</b></div>').join('')+'</div>';
    if(e.kind==='interference')visual+='<p class="science-amplitudes">Saída 0: (+½) '+(e.phase?'−':'+' )+' (½) = '+(e.phase?'0':'1')+' · Saída 1: '+(e.phase?'1':'0')+'. Probabilidade = |amplitude|².</p>';
    if(e.kind==='coherence')visual+='<p>Contraste: '+Math.round(e.visibility*100)+'%. As barras são probabilidades após H, não o QBER ou a barra C da nave.</p>';
    actions=e.kind==='coherence'?button('noise','AUMENTAR DESFASAMENTO'):e.kind==='interference'?button('phase','TROCAR FASE E PREPARAR'):
      button('h','APLICAR H')+(e.kind==='bell'?button('cnot','APLICAR CNOT'):'');
    if(e.kind!=='coherence')actions+=button('measure','MEDIR');actions+=button('reset','PREPARAR NOVAMENTE');
  }else if(e.kind==='key'){
    const a=[0,1,1,0,1,0,0,1],b=a.map((v,i)=>e.noise&&[1,5].includes(i)?1-v:v);
    visual='<div class="science-samples"><span>TERRA · '+a.join(' ')+'</span><span>NAVE · '+b.join(' ')+'</span></div><p>Somente oito bits de amostra. A chave secreta real não é exibida.</p><div class="science-flow">Equipamentos QKD → Quantum Security → cifragem/autenticação → rádio clássico</div>';
    actions=button('noise',e.noise?'RETIRAR RUÍDO DO EXEMPLO':'ADICIONAR RUÍDO AO EXEMPLO')+button('compare','COMPARAR AMOSTRA')+button('request','DESCARTAR E SOLICITAR CHAVE');
  }else{
    visual='<div class="science-circuit">Paridades q0⊕q1, q1⊕q2: <b>'+syndromeCode(e.error)+'</b></div><p class="science-legend">00: sem X · 10: M1 · 11: M2 · 01: M3</p>';
    actions='<span>Exemplo: injetar uma inversão X</span>'+[1,2,3].map(i=>button('inject','X EM M'+i,i)).join('')+'<span>Escolher a correção indicada</span>'+[1,2,3].map(i=>button('correct','CORRIGIR M'+i,i)).join('')+button('reset','SEM ERRO');
  }
  const live=boss?.model.syndrome?'Leitura atual do chefe: '+boss.model.syndromeReading.code+' → M'+boss.model.syndromeReading.module+' +. ':'QBER da missão: '+qber.toFixed(1)+'%. ';
  const sources='<p class="science-sources">Conferir: <a href="https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/quantum-circuits/circuits" target="_blank" rel="noopener noreferrer">circuitos · IBM</a> · <a href="https://quantum.cloud.ibm.com/learning/en/courses/foundations-of-quantum-error-correction/correcting-quantum-errors/repetition-codes" target="_blank" rel="noopener noreferrer">síndromes · IBM</a> · <a href="Pitch-Quantum-Security.pdf" target="_blank" rel="noopener noreferrer">pitch do produto</a></p>';
  $(context+'ScienceLab').innerHTML='<label>EXPERIMENTO OPCIONAL <select data-science-topic>'+Object.entries(scienceTopics).map(([key,t])=>'<option value="'+key+'"'+(key===e.kind?' selected':'')+'>'+t.title+'</option>').join('')+'</select></label><p>'+topic.game+'</p>'+visual+'<div class="science-actions">'+actions+'</div><p class="science-result" role="status">'+e.message+'</p><p class="science-limit">'+topic.limit+'</p><small>'+live+'O laboratório usa dados próprios e não altera a missão.</small><label class="science-option"><input type="checkbox" data-science-hints'+(scienceHintsEnabled?' checked':'')+'> Mostrar pistas científicas curtas na arena</label>'+sources;
}
function installSciencePanels(){
  for(const context of ['phase','pause']){
    const panel=$(context+'ScienceLab');
    panel.addEventListener('click',event=>{
      const button=event.target.closest('[data-science-action]');if(!button)return;
      sciencePanels[context]?.operate(button.dataset.scienceAction,button.dataset.scienceValue===undefined?undefined:Number(button.dataset.scienceValue));renderSciencePanel(context);
      [...panel.querySelectorAll('[data-science-action]')].find(el=>el.dataset.scienceAction===button.dataset.scienceAction&&el.dataset.scienceValue===button.dataset.scienceValue)?.focus({preventScroll:true});
    });
    panel.addEventListener('change',event=>{
      if(event.target.hasAttribute('data-science-topic')&&scienceTopics[event.target.value]){sciencePanels[context]=new ScienceExperiment(event.target.value);renderSciencePanel(context);panel.querySelector('[data-science-topic]')?.focus({preventScroll:true});}
      else if(event.target.hasAttribute('data-science-hints')){
        scienceHintsEnabled=event.target.checked;if(!scienceHintsEnabled){sciencePending=null;if(combatNotice?.priority===-1)combatNotice=null;}
        try{globalThis.localStorage?.setItem('qubit-science-v1',JSON.stringify({hints:scienceHintsEnabled}));}catch{}
      }
    });
  }
}
if(typeof module!=='undefined'&&module.exports)module.exports={ScienceExperiment,scienceTopics,syndromeCode};
