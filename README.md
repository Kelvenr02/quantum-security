# Operação Qubit — Defesa Orbital

Abra index.html no navegador para jogar. O jogo funciona localmente, sem instalação e sem dependências externas.

## Som e música

O áudio começa após o primeiro toque ou tecla. O botão **Som**, disponível em todas as telas, permite silenciar e ajustar separadamente música e efeitos. **M** também alterna o som; as preferências são salvas localmente quando possível.

Cada fase tem uma composição diferente, em volume baixo e com transições suaves. Disparos, impactos, cápsulas, interferências e regeneração acompanham os eventos reais do jogo. A pausa congela o áudio; o canhão usa as mesmas marcações da animação para carga, disparo e explosão.

Efeitos de Kenney e músicas de Juhani Junkala / SubspaceAudio, publicados com licença CC0, estão em `assets/audio/`. Os [créditos e fontes](assets/audio/CREDITS.md) identificam os arquivos utilizados; o [plano de áudio](docs/AUDIO.md) descreve a distribuição das trilhas e a mixagem. O bundle local mantém o funcionamento direto por `index.html`, sem servidor ou download durante a partida.

## História e preparação

Antes da campanha, quatro cenas retomam a conversa entre a Dr. Íris e o Tenente:

1. **O chamado:** o ataque, a pilotagem remota e a defesa até o canhão carregar.
2. **A chave:** o risco de interceptação leva à explicação de bits, qubits, superposição, medição e E91. Medir um par ilustrativo mostra um resultado por lado.
3. **O canal:** QBER, espionagem e ruído dentro da história; ativação do Quantum Security e distinção entre QKD, gestão das chaves e rádio.
4. **Decolagem:** mover a nave, destruir um asteroide com disparo automático e pressionar R para renovar a chave.

Cada cena mostra uma conversa curta completa. Não há avanço por fala, espera de animação ou questionário. O par é uma ilustração em software, não uma simulação física ou geração real de chaves. A leitura segue o ritmo do jogador, com Voltar e Recomeçar disponíveis. Veja as escolhas narrativas em [docs/ABERTURA.md](docs/ABERTURA.md).

O treino permite novas tentativas, pausa e controles por toque. Sua pontuação e seus erros não passam para a campanha. Recursos avançados são explicados nos briefings das fases. Informações adicionais sobre a ciência e o pitch ficam em uma seção opcional.

A Dr. Íris acompanha a preparação e apresenta as novidades das oito fases:

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
- training.js: simulador independente do treino rápido.
- audio.js: mixagem, trilhas por fase, efeitos, pausa e controles de volume.
- story.js: sequência interativa, narrativa, explicações e transição para a campanha.
- graphics.js, presentation.js e styles.css: arte, controles e apresentação.

## Verificação

Execute: node tests/gameplay.cjs

Execute também: node tests/training.cjs

Abertura e transição: node tests/story.cjs

Áudio: node tests/audio.cjs

Reconstruir o bundle offline a partir dos arquivos preparados: node tools/build-audio.cjs

Os testes do treinamento verificam intercepção, novas tentativas, regeneração, pausa e reinício. Os da abertura cobrem ações obrigatórias, releitura, medição com resultado zero, retorno ao menu e início único da campanha. Todas as suítes são executadas no GitHub Actions.

Os testes usam as funções reais de jogo e uma interface simulada para verificar progressão, colisões, regeneração, recursos, pausa, redimensionamento e a campanha completa. A interface também foi conferida no Chrome em tamanho de computador e em 390 × 844.

## Contexto científico

Os efeitos são analogias didáticas, não simulações físicas. A superposição não permite ler todos os resultados em uma medição; o entrelaçamento não transmite ações instantâneas; a correção quântica utiliza codificação e síndromes, não cópias de um qubit desconhecido. O limite de QBER de 11% e a inversão de comandos pertencem ao protocolo fictício da missão.

Referências: [Portas e circuitos — IBM Quantum](https://learning.quantum.ibm.com/course/basics-of-quantum-information/quantum-circuits), [Entrelaçamento — IBM Quantum](https://learning.quantum.ibm.com/course/basics-of-quantum-information/entanglement-in-action), [Correção de erros — IBM Quantum](https://learning.quantum.ibm.com/course/foundations-of-quantum-error-correction/correcting-quantum-errors).
