const scenes = [
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Tenente! Que bom que chegou. A frota alienígena lançou uma chuva de asteroides contra a Terra, e a nossa nave defensora já está em órbita, pronta para agir. Você vai pilotá-la."],
 ["TENENTE · VOCÊ", "Pilotá-la daqui, da base? Mas ela está lá no espaço, Doutora."],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Isso mesmo: é pilotagem remota. Você controla a nave daqui da Terra, em segurança, por ondas de rádio. Como ela fica em órbita perto do planeta, o sinal leva só alguns milésimos de segundo para ir e voltar, então você reage quase em tempo real. Para uma nave mais distante, o atraso seria maior: até a Lua, por exemplo, o sinal leva cerca de 1,3 segundo só na ida."],
 ["TENENTE · VOCÊ", "E por que não deixar um piloto automático fazer o serviço?"],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Porque os alienígenas mudam de tática o tempo todo, e queremos uma pessoa decidindo a cada situação. Um sistema totalmente automático também seria mais fácil de enganar. Só que pilotar de longe tem um custo: todos os seus comandos viajam pelo ar, e esse é o nosso ponto fraco."],
 ["TENENTE · VOCÊ", "Os alienígenas poderiam escutar os nossos comandos?"],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Poderiam tentar escutá-los e até enviar ordens falsas à nave, inclusive inverter os seus controles. Por isso as ordens precisam ser cifradas com uma chave secreta, conhecida só pela Terra e pela nave. O difícil é criar essa chave e ter certeza de que ninguém a copiou."],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "É aí que entra a física quântica: ela nos dá um jeito de criar essa chave e ainda perceber se alguém tentou espiá-la. Mas, para entender isso, precisamos começar pelo básico."],
 ["TENENTE · VOCÊ", "Meu treinamento é de pilotagem e defesa, não de física. Pode começar do zero?"],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Claro. Toda matéria é feita de átomos, e os átomos têm partículas como elétrons. Em escalas muito pequenas, a natureza segue regras diferentes das nossas intuições do dia a dia: esse é o domínio da física quântica."],
 ["TENENTE · VOCÊ", "Diferentes como? Uma partícula é só uma bolinha minúscula, certo?"],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Não exatamente. Objetos quânticos podem apresentar propriedades de onda e de partícula, e o resultado de certas medições é probabilístico. A teoria prevê as probabilidades com enorme precisão, mas não funciona como a física clássica dos objetos grandes."],
 ["TENENTE · VOCÊ", "E como isso se conecta à computação? Um computador quântico é apenas um computador comum mais rápido?"],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Não. Um computador clássico guarda e processa informação usando bits, e cada bit tem um valor definido: 0 ou 1. Pense numa moeda parada sobre a mesa: está em cara (0) ou coroa (1), e basta olhar para saber qual."],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Um computador quântico usa qubits, e um qubit é mais parecido com uma moeda girando no ar. Enquanto gira, ela tem uma chance de cair em cada lado: essa combinação é a superposição. Quando a moeda cai, medimos, e o resultado é um só: 0 ou 1, com probabilidades determinadas pelo estado do qubit."],
 ["TENENTE · VOCÊ", "Então a moeda é cara e coroa ao mesmo tempo, e eu consigo ler os dois resultados de uma vez?"],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Não, e aqui a analogia chega ao limite: ao cair, só aparece um resultado. Além disso, o acaso de uma moeda comum vem de detalhes do lançamento, enquanto no qubit o acaso é da própria natureza. O estado do qubit é descrito por amplitudes que podem interferir entre si, e os algoritmos quânticos usam essa interferência para aumentar a chance das respostas úteis."],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Qubits também podem ficar entrelaçados. Imagine duas moedas especiais: cada uma, sozinha, cai em cara ou coroa ao acaso, mas os resultados das duas sempre combinam, mesmo com elas muito distantes. Olhando só uma, tudo parece aleatório; a ligação aparece quando comparamos as duas. Isso não serve para mandar mensagens mais rápido que a luz. E o entrelaçamento real é mais sutil do que moedas combinadas: as correlações aparecem mesmo medindo de maneiras diferentes, algo que moedas comuns não conseguem imitar."],
 ["TENENTE · VOCÊ", "Entendi a ideia das moedas. Mas como isso protege as ordens da nave?"],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Pela distribuição quântica de chaves. A Terra e a nave medem partículas entrelaçadas e depois comparam publicamente só uma parte dos resultados. Se as verificações forem boas, os resultados restantes viram uma chave secreta compartilhada. O rádio continua levando os dados cifrados; a física quântica protege a chave."],
 ["TENENTE · VOCÊ", "E se uma sonda alienígena tentar medir as partículas para roubar a chave?"],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Medir perturba o sistema. É como alguém que segura a moeda no meio do giro para espiar: só de olhar, ele muda o resultado. Essa perturbação aumenta os erros que observamos ao comparar as amostras, e assim percebemos que algo está errado."],
 ["TENENTE · VOCÊ", "Esse sinal é o QBER que aparece no painel?"],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Exatamente. QBER é a taxa de erro de bits quânticos: a proporção de resultados comparados que não concordam. Quando ele sobe, algo está perturbando o canal, seja um espião, seja ruído. Em qualquer caso, o aviso é o mesmo: a chave está ficando pouco confiável."],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "As nuvens roxas do radar representam ruído e decoerência. A decoerência acontece quando um sistema quântico interage com o ambiente e perde as características quânticas úteis. Radiação, calor e outras perturbações também fazem o QBER subir."],
 ["TENENTE · VOCÊ", "Então eu só preciso vigiar o QBER e mantê-lo abaixo do limite."],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Isso mesmo. Neste jogo, 11% é o limite crítico definido pelo nosso protocolo fictício. Acima dele, a chave é considerada insegura e os invasores podem inverter os comandos por quatro segundos."],
 ["TENENTE · VOCÊ", "E a tecla R regenera a chave, mas deixa o canal vulnerável durante a operação. Preciso escolher o momento certo."],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Correto. Lembre-se: bits são como moedas paradas, 0 ou 1; qubits seguem as regras quânticas de superposição, medição e, em sistemas com várias partículas, entrelaçamento. Computadores quânticos podem oferecer vantagens em problemas específicos, mas não são melhores para toda tarefa."],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Agora, a missão: a nave alienígena está lançando asteroides, os projéteis do ataque, em direção à Terra. Intercepte cada um antes que atinja a superfície! Enquanto você os destrói, nosso canhão orbital estará carregando."],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "A defesa tem oito etapas. A frota vai mudar de tática: surgirão blindagens, pares conectados e frentes de ruído. Entre as fases, eu explicarei a novidade enquanto os sistemas ficam em espera."],
 ["TENENTE · VOCÊ", "E teremos alguma ajuda para enfrentar esses ataques?"],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Sim. A partir da terceira fase, recolha as cápsulas H para ampliar o disparo às trilhas vizinhas. Mais adiante, as cápsulas + reduzem o QBER e antecipam a recarga da chave. Os efeitos são automáticos e representam, como analogias de jogo, superposição e correção de erros."],
 ["TENENTE · VOCÊ", "E quando o canhão estiver carregado?"],
 ["DR. ÍRIS · CIENTISTA QUÂNTICA", "Você terá uma janela para disparar contra a nave-mãe e acabar com o ataque. Monitore o QBER, regenere a chave quando necessário e não deixe nenhum asteroide atingir a Terra. A defesa começa agora!"]
]
let sceneIndex=0;
function renderScene(){document.getElementById('speaker').textContent=scenes[sceneIndex][0];document.getElementById('line').textContent=scenes[sceneIndex][1];document.getElementById('sceneCount').textContent=String(sceneIndex+1).padStart(2,'0')+' / '+scenes.length;document.getElementById('bar').style.width=((sceneIndex+1)/scenes.length*100)+'%';document.getElementById('nextBtn').textContent=sceneIndex===scenes.length-1?'ABRIR BRIEFING ▶':'PRÓXIMA FALA ▶';}
document.getElementById('nextBtn').addEventListener('click',()=>{if(sceneIndex<scenes.length-1){sceneIndex++;renderScene()}else{document.getElementById('dialogue').style.display='none';document.getElementById('learn').style.display='block';}});
function restartStory(){sceneIndex=0;document.getElementById('learn').style.display='none';document.getElementById('dialogue').style.display='block';renderScene();}
renderScene();

// ---------- Tela inicial e transição entre os jogos ----------
let introActive = false;
function startIntro() { document.getElementById('title').style.display = 'none'; introActive = true; }
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (!introActive) {
    if (document.getElementById('title').style.display !== 'none') { e.preventDefault(); startIntro(); }
    return;
  }
  if (document.getElementById('dialogue').style.display !== 'none') { e.preventDefault(); document.getElementById('nextBtn').click(); }
});
