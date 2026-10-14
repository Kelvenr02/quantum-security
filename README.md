# Operação Qubit — Defesa Orbital

Abra index.html no navegador para jogar. O jogo funciona localmente, sem instalação e sem dependências externas.

## Som e música

O áudio começa após o primeiro toque ou tecla. O botão **Som**, disponível em todas as telas, permite silenciar e ajustar separadamente música e efeitos. **M** também alterna o som; as preferências são salvas localmente quando possível.

Cada fase tem uma composição diferente, em volume baixo e com transições suaves. Os guardiões usam trilhas de confronto; avisos e impactos acompanham seus eventos reais. A pausa congela o áudio; o canhão usa as mesmas marcações da animação para carga, disparo e explosão.

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

| Fase | Objetivo acumulado | Novo desafio | Guardião final |
| --- | ---: | --- | --- |
| 1 · Órbita de treinamento | 100 | Asteroides e nuvens de ruído | Sentinela da Chave: relés e QBER |
| 2 · Escuta clandestina | 220 | Espiões miram sua posição; rochas rápidas | Observador Fantasma: revele a sonda |
| 3 · Janela de superposição | 340 | H dispara em até três trilhas por 6 s | Tríade Hadamard: três núcleos |
| 4 · Pares entrelaçados | 460 | Pares conectados e blindagem | Gêmeos de Bell: dano compartilhado |
| 5 · Tempestade de decoerência | 580 | Nuvens oscilantes e ruído ambiental | Devorador: zonas de coerência |
| 6 · Correção de erros | 720 | + reduz QBER e recarga; ondas triplas | Guardião da Síndrome: corrija módulos |
| 7 · Frentes de interferência | 860 | Frentes anunciadas; três trilhas livres | Interferômetro: duas salvas e uma janela |
| 8 · Última linha de defesa | 1.000 | Todos os desafios com maior intensidade | Núcleo da Nave-Mãe: três estágios |

Cada destruição vale 10 pontos, limitada à meta da fase atual. Atingir a meta inicia seu guardião; vencê-lo libera a próxima fase. Aos 1.000 pontos, ainda é necessário neutralizar o oitavo guardião para disparar o canhão.

As ondas ficaram mais frequentes e rápidas. Rochas com rastro laranja são 22% mais rápidas; ondas triplas surgem nas três últimas fases. Espiões podem mirar a trilha ocupada no lançamento. O disparo automático e os controles continuam iguais.

Os confrontos substituem as ondas comuns durante a luta. Salvas têm pelo menos 2 segundos de aviso; os padrões deixam duas ou mais trilhas fora de todas as marcas. Procure os núcleos iluminados e aproveite as janelas após os ataques. As explicações da Dr. Íris e as pausas congelam o tempo.

Veja o [planejamento, as regras dos guardiões e os limites do balanceamento](docs/DESAFIOS.md).

## Controles

- Setas ou A / D: mudar de trilha.
- R: regenerar a chave; imobilização de 2 s e recarga de 10 s.
- ESC: pausar ou retomar.
- ENTER: iniciar, continuar entre fases ou jogar novamente.
- Telas sensíveis ao toque: botões de movimento e regeneração.
- H e +: recolher com a nave; ativação automática.

Acima de 11% de QBER, os controles ficam invertidos por 4 s. Doze impactos na Terra encerram a missão. O escudo de emergência absorve um golpe físico e concede 1,4 s de proteção; outro golpe sem escudo encerra a defesa. A regeneração não protege de colisões nem das salvas dos guardiões.

O escudo é restaurado no início da campanha, antes de cada guardião e após vencê-lo. Cada vitória também repara dois impactos na Terra e prepara uma nova chave. Na derrota, **Repetir fase** restaura o estado salvo no início daquela fase; **Jogar novamente** recomeça toda a campanha. A retomada vale para a sessão atual, sem gravação após fechar a página.

## Organização

- phases.js: objetivos, parâmetros de dificuldade e conceitos das oito fases.
- script.js: defesa orbital, colisões, pontuação e animação final.
- quantum.js: briefings de fase, cápsulas, pares conectados e frentes de interferência.
- bosses.js: oito guardiões, avisos, vulnerabilidades, escudo e pontos de retomada.
- training.js: simulador independente do treino rápido.
- audio.js: mixagem, trilhas por fase, efeitos, pausa e controles de volume.
- story.js: sequência interativa, narrativa, explicações e transição para a campanha.
- graphics.js, presentation.js e styles.css: arte, controles e apresentação.

## Verificação

Execute: node tests/gameplay.cjs

Execute também: node tests/training.cjs

Abertura e transição: node tests/story.cjs

Áudio: node tests/audio.cjs

Guardiões e retomada: node tests/bosses.cjs

Campanha com pilotagem simulada e colisões reais: node tests/balance.cjs

Reconstruir o bundle offline a partir dos arquivos preparados: node tools/build-audio.cjs

Os testes do treinamento verificam intercepção, novas tentativas, regeneração, pausa e reinício. Os da abertura cobrem ações obrigatórias, releitura, medição com resultado zero, retorno ao menu e início único da campanha. Todas as suítes são executadas no GitHub Actions.

Os testes usam as funções reais de jogo e uma interface simulada para verificar progressão, colisões, regeneração, recursos, pausa, redimensionamento e a campanha completa. O piloto de regressão consulta o estado interno e faz uma mudança de trilha por decisão: demonstra viabilidade, sem medir a dificuldade para uma pessoa. A interface e os oito guardiões também foram conferidos no Chrome em tamanho de computador e em 390 × 844.

## Contexto científico

Os efeitos são analogias didáticas, não simulações físicas. A superposição não permite ler todos os resultados em uma medição; o entrelaçamento não transmite ações instantâneas; a correção quântica utiliza codificação e síndromes, não cópias de um qubit desconhecido. O limite de QBER de 11% e a inversão de comandos pertencem ao protocolo fictício da missão.

Referências: [Portas e circuitos — IBM Quantum](https://learning.quantum.ibm.com/course/basics-of-quantum-information/quantum-circuits), [Entrelaçamento — IBM Quantum](https://learning.quantum.ibm.com/course/basics-of-quantum-information/entanglement-in-action), [Correção de erros — IBM Quantum](https://learning.quantum.ibm.com/course/foundations-of-quantum-error-correction/correcting-quantum-errors).
