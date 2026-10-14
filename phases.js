/* Operação Qubit: campanha e analogias quânticas. Os efeitos são mecânicas fictícias. */
const missionPhases = [
  { name: 'Órbita de treinamento', target: 100, interval: 1300, speed: 3.35, pair: .08, armor: 0, rush: 0, cloudInterval: 4700, spyInterval: 0, drift: 0,
    concept: 'Distribuição quântica de chaves', objective: 'Intercepte asteroides e desvie das nuvens roxas. Observe o QBER e use R em um momento seguro.',
    science: 'No protocolo E91, correlações entre partículas entrelaçadas ajudam a verificar um canal e estabelecer uma chave. Os comandos ainda viajam por um canal clássico.' },
  { name: 'Escuta clandestina', target: 220, interval: 1190, speed: 3.7, pair: .18, armor: 0, rush: .15, cloudInterval: 4400, spyInterval: 6800, drift: 0,
    concept: 'Medição e espionagem', objective: 'Pulsos dourados miram sua posição: cada contato soma 7% de QBER. Rochas com rastro laranja são 22% mais rápidas; observe a aproximação e troque de trilha.',
    science: 'Medições de um espião podem alterar as correlações esperadas. O QBER elevado indica perturbação, mas não prova sozinho que houve espionagem.' },
  { name: 'Janela de superposição', target: 340, interval: 1090, speed: 4.0, pair: .26, armor: 0, rush: .18, cloudInterval: 4100, spyInterval: 6400, drift: 0,
    concept: 'Porta Hadamard · H', objective: 'Colete cápsulas H verdes para disparar também nas duas trilhas vizinhas durante 6 s. O efeito ativa ao coletar; aproveite as ondas duplas.',
    science: 'A porta H transforma |0⟩ em (|0⟩ + |1⟩)/√2. Os disparos em várias trilhas são uma analogia visual da superposição; uma medição real produz um único resultado.' },
  { name: 'Pares entrelaçados', target: 460, interval: 1010, speed: 4.25, pair: .34, armor: .14, rush: .16, cloudInterval: 3900, spyInterval: 6000, drift: 0, entangled: true,
    concept: 'Estado de Bell · H + CNOT', objective: 'Asteroides unidos por um fio azul formam um par: destrua um para eliminar os dois. Rochas com anel dourado precisam de dois disparos.',
    science: 'H seguida de CNOT pode preparar o estado de Bell (|00⟩ + |11⟩)/√2. A destruição conjunta é uma regra fictícia do jogo: entrelaçamento real não transmite ações ou mensagens instantâneas.' },
  { name: 'Tempestade de decoerência', target: 580, interval: 950, speed: 4.45, pair: .38, armor: .2, rush: .2, cloudInterval: 3400, spyInterval: 5600, drift: .45, entangled: true, movingClouds: true,
    concept: 'Decoerência e coerência', objective: 'Nuvens agora oscilam entre trilhas e o ambiente acrescenta 0,45% de QBER por segundo. A recuperação passiva fica mais lenta; planeje a nova chave.',
    science: 'Interações com o ambiente degradam a coerência e podem introduzir erros. O aumento contínuo do QBER nesta fase representa esse ruído de forma simplificada.' },
  { name: 'Correção de erros', target: 720, interval: 900, speed: 4.65, pair: .42, triple: .08, armor: .28, rush: .2, cloudInterval: 3100, spyInterval: 5200, drift: .6, entangled: true, movingClouds: true, correction: true,
    concept: 'Síndromes e qubits auxiliares', objective: 'Colete +: −5 pontos percentuais de QBER e −3 s de recarga de R. Surgem ondas triplas: use H e priorize os pares conectados para abrir espaço.',
    science: 'A correção quântica codifica informação em vários qubits. Medições de síndromes revelam certos erros sem ler diretamente a informação lógica; não se trata de copiar um qubit desconhecido.' },
  { name: 'Frentes de interferência', target: 860, interval: 850, speed: 4.85, pair: .46, triple: .1, armor: .32, rush: .22, cloudInterval: 2900, spyInterval: 4800, drift: .7, entangled: true, movingClouds: true, correction: true, interference: true,
    concept: 'Interferência de amplitudes', objective: 'Faixas violetas avisam uma frente de ruído com 1,8 s de antecedência. Procure as trilhas sem faixa antes da frente chegar. H e + continuam disponíveis.',
    science: 'Amplitudes quânticas podem se reforçar ou se cancelar. As frentes e trilhas livres são uma metáfora visual; interferência não é uma parede física no espaço.' },
  { name: 'Última linha de defesa', target: 1000, interval: 800, speed: 5.05, pair: .48, triple: .12, armor: .36, rush: .24, cloudInterval: 2700, spyInterval: 4400, drift: .8, entangled: true, movingClouds: true, correction: true, interference: true,
    concept: 'Operação sob ruído', objective: 'Combine tudo: pares conectados, H, + e rotas de fuga. Chegue a 1.000 pontos e neutralize o núcleo da nave-mãe para liberar o disparo do canhão orbital.',
    science: 'A computação quântica combina preparação, portas, medição e controle de erros. Ruído e recursos limitam a execução; vantagens quânticas dependem do problema e do algoritmo.' }
];
const phaseConfig = () => missionPhases[(level || 1) - 1];
const phaseForScore = value => Math.min(missionPhases.length, 1 + missionPhases.filter(p => value >= p.target).length);
