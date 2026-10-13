/* Operação Qubit: campanha e analogias quânticas. Os efeitos são mecânicas fictícias. */
const missionPhases = [
  { name: 'Órbita de treinamento', target: 100, interval: 1550, speed: 3.0, pair: 0, armor: 0, cloudInterval: 5200, spyInterval: 0, drift: 0,
    concept: 'Distribuição quântica de chaves', objective: 'Intercepte asteroides e desvie das nuvens roxas. Observe o QBER e use R em um momento seguro.',
    science: 'No protocolo E91, correlações entre partículas entrelaçadas ajudam a verificar um canal e estabelecer uma chave. Os comandos ainda viajam por um canal clássico.' },
  { name: 'Escuta clandestina', target: 220, interval: 1400, speed: 3.3, pair: .1, armor: 0, cloudInterval: 4800, spyInterval: 7800, drift: 0,
    concept: 'Medição e espionagem', objective: 'Pulsos dourados entram no radar: cada contato soma 7% de QBER. As primeiras ondas duplas exigem mudanças rápidas de trilha.',
    science: 'Medições de um espião podem alterar as correlações esperadas. O QBER elevado indica perturbação, mas não prova sozinho que houve espionagem.' },
  { name: 'Janela de superposição', target: 340, interval: 1250, speed: 3.6, pair: .22, armor: 0, cloudInterval: 4400, spyInterval: 7000, drift: 0,
    concept: 'Porta Hadamard · H', objective: 'Colete cápsulas H verdes para disparar também nas duas trilhas vizinhas durante 6 s. O efeito ativa ao coletar; aproveite as ondas duplas.',
    science: 'A porta H transforma |0⟩ em (|0⟩ + |1⟩)/√2. Os disparos em várias trilhas são uma analogia visual da superposição; uma medição real produz um único resultado.' },
  { name: 'Pares entrelaçados', target: 460, interval: 1150, speed: 3.8, pair: .3, armor: .1, cloudInterval: 4200, spyInterval: 6500, drift: 0, entangled: true,
    concept: 'Estado de Bell · H + CNOT', objective: 'Asteroides unidos por um fio azul formam um par: destrua um para eliminar os dois. Rochas com anel dourado precisam de dois disparos.',
    science: 'H seguida de CNOT pode preparar o estado de Bell (|00⟩ + |11⟩)/√2. A destruição conjunta é uma regra fictícia do jogo: entrelaçamento real não transmite ações ou mensagens instantâneas.' },
  { name: 'Tempestade de decoerência', target: 580, interval: 1050, speed: 4.0, pair: .35, armor: .18, cloudInterval: 3600, spyInterval: 6000, drift: .45, entangled: true, movingClouds: true,
    concept: 'Decoerência e coerência', objective: 'Nuvens agora oscilam entre trilhas e o ambiente acrescenta 0,45% de QBER por segundo. A recuperação passiva fica mais lenta; planeje a nova chave.',
    science: 'Interações com o ambiente degradam a coerência e podem introduzir erros. O aumento contínuo do QBER nesta fase representa esse ruído de forma simplificada.' },
  { name: 'Correção de erros', target: 720, interval: 950, speed: 4.2, pair: .4, armor: .3, cloudInterval: 3300, spyInterval: 5500, drift: .6, entangled: true, movingClouds: true, correction: true,
    concept: 'Síndromes e qubits auxiliares', objective: 'Colete cápsulas + azuis: reduzem o QBER em 5 pontos percentuais e antecipam a recarga de R em 3 s. Mais blindagem e ruído pressionam sua defesa.',
    science: 'A correção quântica codifica informação em vários qubits. Medições de síndromes revelam certos erros sem ler diretamente a informação lógica; não se trata de copiar um qubit desconhecido.' },
  { name: 'Frentes de interferência', target: 860, interval: 880, speed: 4.4, pair: .45, armor: .35, cloudInterval: 3000, spyInterval: 5000, drift: .7, entangled: true, movingClouds: true, correction: true, interference: true,
    concept: 'Interferência de amplitudes', objective: 'Faixas violetas avisam uma frente de ruído com 1,8 s de antecedência. Procure as trilhas sem faixa antes da frente chegar. H e + continuam disponíveis.',
    science: 'Amplitudes quânticas podem se reforçar ou se cancelar. As frentes e trilhas livres são uma metáfora visual; interferência não é uma parede física no espaço.' },
  { name: 'Última linha de defesa', target: 1000, interval: 800, speed: 4.6, pair: .5, armor: .4, cloudInterval: 2800, spyInterval: 4600, drift: .8, entangled: true, movingClouds: true, correction: true, interference: true,
    concept: 'Operação sob ruído', objective: 'Combine tudo: priorize pares conectados, use H contra a blindagem, recolha + e mantenha a chave segura. Chegue a 1.000 pontos para disparar o canhão orbital.',
    science: 'A computação quântica combina preparação, portas, medição e controle de erros. Ruído e recursos limitam a execução; vantagens quânticas dependem do problema e do algoritmo.' }
];
const phaseConfig = () => missionPhases[(level || 1) - 1];
const phaseForScore = value => Math.min(missionPhases.length, 1 + missionPhases.filter(p => value >= p.target).length);
