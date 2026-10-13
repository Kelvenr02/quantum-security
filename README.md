# Operação Qubit — Defesa Orbital

Abra index.html no navegador para jogar. O jogo funciona localmente, sem instalação e sem dependências externas.

## Treinamento interativo

Antes da campanha, a história, os conceitos e os controles são apresentados em sete desafios curtos, sem uma sequência de diálogos para avançar:

1. Conectar equipamentos QKD, o programa Quantum Security e o rádio com cifragem e autenticação.
2. Alternar um bit, aplicar a porta H, observar interferência e medir um qubit.
3. Comparar amostras de pares entrelaçados, simular espionagem e substituir uma chave rejeitada.
4. Movimentar a nave nas sete trilhas e interceptar três asteroides com disparo automático.
5. Experimentar ruído, QBER, inversão de comandos e regeneração da chave.
6. Recolher cápsulas H e + e interceptar pares conectados e asteroides blindados.
7. Escapar de uma frente de interferência e iniciar diretamente a campanha.

As etapas avançam somente após a ação proposta. Os botões também funcionam por toque; setas/A/D, R e Esc funcionam no simulador. A pausa congela a simulação e é ativada ao trocar de janela. Voltar e Recomeçar permitem repetir os exercícios; impactos de treino dão outra tentativa. Pontos, erros e recursos do treinamento não são transferidos para a missão.

O Quantum Security segue o pitch do produto: uma proposta de software para integrar equipamentos QKD, acompanhar o canal e gerenciar chaves validadas. QKD não exige um computador quântico universal. O experimento de amostras é didático: seus bits públicos são descartados, e um protocolo real precisa de verificações adicionais, comunicação clássica autenticada e processamento das chaves.

A apresentação orbital, o diálogo com a Dr. Íris, a defesa da Terra, os disparos automáticos, o QBER e o final com o canhão foram preservados. A campanha agora contém oito fases:

| Fase | Objetivo acumulado | Novo desafio |
| --- | ---: | --- |
| 1 · Órbita de treinamento | 100 | Asteroides e nuvens de ruído |
| 2 · Escuta clandestina | 220 | Pulsos espiões e ondas duplas |
| 3 · Janela de superposição | 340 | Cápsulas H: disparos em até três trilhas por 6 s |
| 4 · Pares entrelaçados | 460 | Pares conectados e blindagem de dois acertos |
| 5 · Tempestade de decoerência | 580 | Nuvens oscilantes e ruído ambiental |
| 6 · Correção de erros | 720 | Cápsulas +: −5 pontos percentuais de QBER e −3 s de recarga |
| 7 · Frentes de interferência | 860 | Frentes anunciadas com 1,8 s de antecedência; três trilhas livres |
| 8 · Última linha de defesa | 1.000 | Todos os desafios com maior intensidade |

Cada destruição vale 10 pontos. A frequência, a velocidade e a chance de ondas duplas aumentam progressivamente. A Dr. Íris apresenta as novas regras entre as fases; o tempo fica congelado durante esses briefings e nas pausas.

## Controles

- Setas ou A / D: mudar de trilha.
- R: regenerar a chave; imobilização de 2 s e recarga de 10 s.
- ESC: pausar ou retomar.
- ENTER: iniciar, continuar entre fases ou jogar novamente.
- Telas sensíveis ao toque: botões de movimento e regeneração.
- H e +: recolher com a nave; ativação automática.

Acima de 11% de QBER, os controles ficam invertidos por 4 s. Doze impactos na Terra ou uma colisão direta encerram a missão. A regeneração e os recursos quânticos não protegem contra colisões com asteroides.

## Organização

- phases.js: objetivos, parâmetros de dificuldade e conceitos das oito fases.
- script.js: defesa orbital, colisões, pontuação e animação final.
- quantum.js: briefings de fase, cápsulas, pares conectados e frentes de interferência.
- training.js: modelos independentes do laboratório de qubits e do simulador de treino.
- story.js: sequência interativa, narrativa, explicações e transição para a campanha.
- graphics.js, presentation.js e styles.css: arte, controles e apresentação.

## Verificação

Execute: node tests/gameplay.cjs

Execute também: node tests/training.cjs

Os testes do treinamento verificam estados quânticos simplificados, intercepções, novas tentativas, inversão, regeneração, pausa, cápsulas e interferência. As duas suítes são executadas no GitHub Actions.

Os testes usam as funções reais de jogo e uma interface simulada para verificar progressão, colisões, regeneração, recursos, pausa, redimensionamento e a campanha completa. A interface também foi conferida no Chrome em tamanho de computador e em 390 × 844.

## Contexto científico

Os efeitos são analogias didáticas, não simulações físicas. A superposição não permite ler todos os resultados em uma medição; o entrelaçamento não transmite ações instantâneas; a correção quântica utiliza codificação e síndromes, não cópias de um qubit desconhecido. O limite de QBER de 11% e a inversão de comandos pertencem ao protocolo fictício da missão.

Referências: [Portas e circuitos — IBM Quantum](https://learning.quantum.ibm.com/course/basics-of-quantum-information/quantum-circuits), [Entrelaçamento — IBM Quantum](https://learning.quantum.ibm.com/course/basics-of-quantum-information/entanglement-in-action), [Correção de erros — IBM Quantum](https://learning.quantum.ibm.com/course/foundations-of-quantum-error-correction/correcting-quantum-errors).
