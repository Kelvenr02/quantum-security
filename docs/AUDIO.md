# Plano de áudio

## Direção

Defesa espacial com linguagem sonora de arcade: lasers curtos, impactos graves, sinais eletrônicos claros e música retrô em volume baixo. O áudio informa a ação sem competir com as explicações da Dr. Íris.

## Música

Cada fase recebe uma composição diferente. As transições usam sobreposição com fades; os loops mantêm os limites originais das músicas. Menu, preparação e briefings usam uma mixagem mais discreta. O final concentra o destaque no canhão e na explosão.

| Momento | Faixa de Juhani Junkala |
| --- | --- |
| Menu | Retro Game Music Pack — Title Screen |
| História, explicação e briefings | Chiptune Adventures — Stage Select |
| Treino | Chiptune Adventures — Stage Select |
| Fase 1 | Chiptune Adventures — Stage 1 |
| Fase 2 | Retro Game Music Pack — Level 1 |
| Fase 3 | Chiptune Adventures — Stage 2 |
| Fase 4 | Retro Game Music Pack — Level 2 |
| Fase 5 | Chiptune Adventures — Boss Fight |
| Fase 6 | Chiptune Adventures — Stage Select |
| Fase 7 | Retro Game Music Pack — Level 3 |
| Fase 8 e canhão | Epic Boss Battle |
| Vitória | Retro Game Music Pack — Ending |
| Derrota | Música interrompida; sinal de encerramento |

## Efeitos e sincronização

- Disparo: um som por rajada real, incluindo H; não um som por projétil.
- Movimento: confirmação discreta, só quando a nave realmente muda de trilha.
- Impacto: sons diferentes para blindagem, destruição, colisão e dano à Terra; panorâmica moderada acompanha a posição horizontal.
- Canal: ruído e espionagem têm sinais diferentes. Um sinal avisa a transição de seguro para instável/crítico; o alerta de comprometimento ocorre na entrada da penalidade, uma vez por episódio.
- Chave: um som contínuo acompanha a regeneração e termina no mesmo evento que libera a nave. Uma confirmação indica a nova chave; outro sinal marca o término da recarga de R, sem repetir a cada quadro.
- Recursos: H e + têm confirmações distintas; o apoio do chefe sinaliza a liberação ao terminar o aviso de 900 ms. Consumo de escudo tem um sinal próprio. A frente de interferência mantém seu aviso.
- Chefes: a entrada usa uma sequência ascendente própria (`bossEntry`), diferente do som de canal comprometido. Mudanças de estágio usam o efeito de transição; a trilha mantém sua mixagem.
- Final: carga, disparo e explosão são acionados pelo relógio da animação, com marcações para impedir repetição entre frames.
- Pausa e janela inativa: o contexto de áudio é suspenso; sons e música retomam de onde pararam, sem reproduzir eventos atrasados.

## Mixagem e operação

Volume inicial: música 16%, efeitos 65%; a mixagem interna reduz mais o fundo. Alertas e eventos importantes abaixam a música temporariamente. Um compressor evita somas excessivas; limites de vozes e intervalos mínimos controlam disparos e movimentos frequentes.

O navegador libera áudio após uma interação do jogador. O controle de som oferece mute e volumes separados, salvos localmente quando o navegador permite. Sem suporte a áudio, o jogo continua funcionando.

Os arquivos são locais. Um bundle com os áudios codificados permite executar `index.html` diretamente, sem servidor, requisições externas ou bloqueios de leitura de áudio via `file://`. A decodificação mantém apenas as músicas necessárias em memória e prepara a próxima faixa durante o briefing e o treino.

## Fontes e licenças

- Efeitos: [Sci-fi Sounds — Kenney](https://kenney.nl/assets/sci-fi-sounds), CC0.
- Música: [5 Chiptunes (Action) — Juhani Junkala / SubspaceAudio](https://opengameart.org/content/5-chiptunes-action), CC0.
- Música: [4 Chiptunes (Adventure) — Juhani Junkala / SubspaceAudio](https://opengameart.org/content/4-chiptunes-adventure), CC0.
- Música: [Boss Battle Music — Juhani Junkala / SubspaceAudio](https://opengameart.org/content/boss-battle-music), CC0.

Os efeitos eletrônicos adicionais são sintetizados pelo próprio jogo. Os créditos e o manifesto de arquivos ficam em `assets/audio/`. A normalização e a conversão preservam os limites completos dos loops; nenhuma trilha é cortada para caber em uma fase.
