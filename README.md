# Operação Qubit — Defesa Orbital

Abra index.html no navegador para jogar. O jogo funciona localmente, sem instalação e sem dependências externas.

A arena agora tem **nove trilhas**, ocupa até **1.600 px** de largura e usa travessias de **150 ms por trilha**. Toque para mudar uma posição ou segure a seta/botão para continuar movendo. Disparos e colisões acompanham o trajeto da nave; o treino usa a mesma pilotagem. As seis etapas da revisão estão implementadas: veja o [histórico das alterações](docs/IMPLEMENTACAO.md) e o [balanceamento final](docs/BALANCEAMENTO.md).

O canal mantém QBER e recarga entre encontros. Os chefes anunciam perturbações douradas que afetam o canal sem consumir o escudo físico; desvie ou escolha um respiro para renovar. R também pode interromper o comprometimento quando estiver disponível.

Cada fase reúne **três encontros** com formações anunciadas, novas combinações e respiros para R. Sondas fixam a mira antes de disparar ruído; drones sustentam interferência até serem destruídos ou recuarem; meteoros rachados se dividem se não forem interceptados cedo. O chefe chega depois de limpar os três encontros.

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

| Fase | Carga acumulada | Novo desafio | Guardião final |
| --- | ---: | --- | --- |
| 1 · Órbita de treinamento | 100 | Asteroides e nuvens de ruído | Sentinela da Chave: relés e QBER |
| 2 · Escuta clandestina | 220 | Sonda rastreia/fixa/dispara; rochas rápidas | Observador Fantasma: revele a sonda |
| 3 · Janela de superposição | 340 | Drone emissor; H dispara em três trilhas | Tríade Hadamard: três núcleos |
| 4 · Pares entrelaçados | 460 | Pares conectados e blindagem | Gêmeos de Bell: dano compartilhado |
| 5 · Tempestade de decoerência | 580 | Meteoros fragmentáveis, nuvens persistentes e ruído | Devorador: zonas de coerência |
| 6 · Correção de erros | 720 | + reduz QBER e recarga; ondas triplas | Guardião da Síndrome: corrija módulos |
| 7 · Frentes de interferência | 860 | Corredores livres e frentes A/B no terceiro encontro | Interferômetro: duas salvas e uma janela |
| 8 · Última linha de defesa | 1.000 | Todos os desafios com maior intensidade | Núcleo da Nave-Mãe: três estágios |

**Carga e pontos são distintos.** A carga de 0–1.000 acompanha a resolução das ameaças dos três encontros; os pontos recompensam as destruições: rocha = 10, drone = 25, meteoro rachado interceptado cedo = 15, fragmento = 5. Cada membro de um par rende 10. Impactos na Terra e fugas não dão pontos, e o limite de 12 impactos continua valendo. Nenhuma meta apaga os perigos restantes. Depois de completar a carga, ainda é necessário vencer o oitavo guardião.

As formações usam extremos da arena, pares, blindados e rápidos 22% mais velozes. A partir da fase 6, o terceiro encontro também tem uma formação tripla. O espaçamento considera a cadência e a travessia; há limites de ameaças simultâneas. Os três encontros prolongam a defesa e pedem escolhas entre interceptar, eliminar uma fonte de ruído e renovar a chave.

Em paisagem baixa, a velocidade considera o espaço disponível acima da base. Girar a tela preserva o tempo de aproximação dos perigos. Nuvens e pulsos que já passaram completamente pela nave deixam de atrasar a limpeza do encontro; qualquer perigo ainda ativo continua impedindo o chefe.

Os confrontos substituem as ondas comuns durante a luta. Cada salva tem pelo menos 2 segundos de aviso e deixa duas ou mais trilhas livres. Os corredores mudam entre A/B e, em alguns confrontos, C. Aberturas podem coincidir com a preparação do próximo ataque: escolha entre atirar mais e iniciar a fuga. As explicações da Dr. Íris e as pausas congelam o tempo.

Os oito chefes têm padrões próprios: relés validados por ciclo; sondas com nova varredura; núcleos H com aberturas distintas; Bell alternando lados; zonas de coerência anunciadas; síndromes que mudam; rotas A/B/C; e três combinações na nave-mãe. A pressão muda com o avanço da luta, preservando avisos já emitidos.

Veja o [planejamento, as regras dos guardiões e os limites do balanceamento](docs/DESAFIOS.md).

## Controles

- Setas ou A / D: mudar de trilha; segure para continuar atravessando a arena.
- R: renovar a chave, inclusive durante o comprometimento quando disponível; imobilização de 2 s e recarga de 10 s.
- ESC: pausar ou retomar.
- ENTER: iniciar, continuar entre fases ou retomar o ponto salvo após uma derrota.
- Telas sensíveis ao toque: botões de movimento (toque ou mantenha pressionado) e regeneração.
- H e +: recolher com a nave; ativação automática.

Acima de 11% de QBER, os controles ficam invertidos por até 4 s; R disponível permite interromper essa condição. A recuperação automática deixa até 9% de QBER e oferece 2,5 s antes de outra inversão. Ela não apaga ameaças nem reinicia a duração a cada contato. Doze impactos na Terra encerram a missão. O escudo de emergência absorve um golpe físico e concede 1,4 s de proteção nas ondas ou 450 ms nos chefes; outro golpe sem escudo encerra a defesa. A renovação não protege de colisões nem das salvas físicas dos guardiões.

O escudo começa com uma carga e só é restaurado após vencer um guardião. Entrar no chefe preserva o escudo restante das ondas. Cada vitória repara um impacto na Terra, com mais um de bônus se o chefe for vencido sem dano físico; reduz também o QBER em até 1,5 ponto percentual. A recarga e as condições do canal continuam entre encontros.

H acrescenta **5 s** de disparos em três trilhas, com duração restante limitada a 7 s. A cápsula **+** remove até **4 pontos percentuais de QBER** e **2 s da recarga**, sem encerrar automaticamente uma inversão. Nas ondas, os suprimentos aparecem a uma a três trilhas de distância, considerando tempo de travessia e perigos já visíveis. Nos chefes 3, 6 e 8, há no máximo uma cápsula por ciclo, anunciada 900 ms antes de cair. O painel informa escudo, duração de H e canal; avisos de salvas iminentes têm prioridade sobre mensagens de recursos.

Na derrota durante o chefe, **Retomar no chefe** restaura o estado da entrada: impactos, escudo, canal, recarga, H, posição e pontos. O chefe reinicia inteiro, incluindo seus estágios; novas tentativas não acumulam recursos ou reparos. **Refazer a fase inteira** restaura o início das ondas. Enter escolhe a retomada disponível; **Recomeçar campanha** volta ao início. Esses pontos ficam somente na memória da sessão, sem gravação após fechar a página.

## Organização

- arena.js: geometria das nove trilhas e pilotagem compartilhada.
- channel.js: pressão do canal, comprometimento, renovação, respiros e perturbações dos chefes.
- resources.js: regras de recursos, pontos de retomada, alertas e feedback de combate.
- encounters.js: roteiro dos três encontros, orçamento de ameaças, drones, sondas e fragmentação.
- metrics.js: diagnóstico agregado da partida, apenas em memória.
- phases.js: objetivos, parâmetros de dificuldade e conceitos das oito fases.
- script.js: defesa orbital, colisões, pontuação e animação final.
- quantum.js: briefings de fase, cápsulas, pares conectados e frentes de interferência.
- boss-model.js: relógio, rotas, alvos, mudanças de comportamento e vulnerabilidades dos oito guardiões.
- bosses.js: integração dos confrontos com pilotagem, desenho, áudio, escudo e retomada.
- training.js: simulador independente do treino rápido.
- audio.js: mixagem, trilhas por fase, efeitos, pausa e controles de volume.
- story.js: sequência interativa, narrativa, explicações e transição para a campanha.
- graphics.js, presentation.js e styles.css: arte, controles e apresentação.

## Verificação

Execute: node tests/gameplay.cjs

Arena, movimento físico e diagnóstico: node tests/arena.cjs

Canal, renovação de emergência e continuidade entre encontros: node tests/channel.cjs

Encontros, novas ameaças e carga/pontos: node tests/encounters.cjs

Recursos, prioridade dos avisos e retomada no chefe: node tests/resources.cjs

Execute também: node tests/training.cjs

Abertura e transição: node tests/story.cjs

Áudio: node tests/audio.cjs

Guardiões e retomada: node tests/bosses.cjs

Campanha com pilotagem simulada e colisões reais: node tests/balance.cjs

Margens de reação, rotação e ritmo: node tests/fairness.cjs

Matriz de 46 cenários e comparação de estratégias: node tools/analyze-balance.cjs --output tmp/balanceamento.json

Reconstruir o bundle offline a partir dos arquivos preparados: node tools/build-audio.cjs

Os testes do treinamento verificam intercepção, novas tentativas, regeneração, pausa e reinício. Os da abertura cobrem ações obrigatórias, releitura, medição com resultado zero, retorno ao menu e início único da campanha. Todas as suítes são executadas no GitHub Actions.

As suítes somam 162 verificações e incluem seis campanhas de regressão. A matriz ampliada teve 20 conclusões em 20 combinações de tela/semente com o piloto equilibrado; atrasos, perdas de comando e outras estratégias também foram comparados. Os controladores consultam o estado interno: demonstram viabilidade e detectam regressões, sem medir a dificuldade ou a diversão para uma pessoa. Consulte [resultados, durações e limites da análise](docs/BALANCEAMENTO.md).

Para analisar uma partida no console: `quantumDiagnostics.snapshot()` ou `quantumDiagnostics.export()`. O diagnóstico distingue impactos recebidos de reparos e registra QBER, regeneração, movimento e ameaças por fase/chefe. Os registros não são enviados nem persistidos. Consulte o [detalhamento das métricas e validações](docs/IMPLEMENTACAO.md).

## Contexto científico

Os efeitos são analogias didáticas, não simulações físicas. A superposição não permite ler todos os resultados em uma medição; o entrelaçamento não transmite ações instantâneas; a correção quântica utiliza codificação e síndromes, não cópias de um qubit desconhecido. O limite de QBER de 11% e a inversão de comandos pertencem ao protocolo fictício da missão.

Referências: [Portas e circuitos — IBM Quantum](https://learning.quantum.ibm.com/course/basics-of-quantum-information/quantum-circuits), [Entrelaçamento — IBM Quantum](https://learning.quantum.ibm.com/course/basics-of-quantum-information/entanglement-in-action), [Correção de erros — IBM Quantum](https://learning.quantum.ibm.com/course/foundations-of-quantum-error-correction/correcting-quantum-errors).
