# Balanceamento final — revisão de 14/10/2026

## Fase 5 — ciência sem mudar o combate

Os experimentos locais e as pistas opcionais não alteram canal, recursos, dano ou sorteio de perigos. A leitura de síndrome mantém o módulo + e a seleção anterior. As 232 verificações passaram; seis campanhas repetiram os mesmos resultados da fase 4 (558–611 s, 25–33 usos de R, 1–6 impactos líquidos nessa regressão). A matriz completa de 58 cenários abaixo é da fase 4 e não foi refeita integralmente. Aprendizagem com pessoas continua sem validação. [Ciência e fontes](CIENCIA-NO-JOGO.md).

## Fase 4 — ritmo, variantes e observação de iniciantes

Os respiros entre encontros aumentaram de 1,8 para 3 s: a oportunidade de R agora exige sua duração real e 400 ms de margem. Duas ordens planejadas nas fases 3–8 mantêm a apresentação, o conjunto/HP de ameaças e os limites simultâneos. Velocidades, chefes e recompensas de combate foram preservados; medalhas opcionais não dão vantagens físicas.

A matriz refeita de 58 cenários está em [FASE4-RESULTADOS.json](FASE4-RESULTADOS.json). O piloto equilibrado venceu 20/20 em 558–645 s, com 25–35 renovações e 1–7 impactos líquidos. Reação de 300 ms venceu 2/4; 500 ms perdeu 2/2 no chefe 3. Ignorar o canal perdeu 4/4, e renovar assim que entra em alerta perdeu 4/4. Não usar R ainda permite 2/2 vitórias ao evitar ruído e compensar inversões; isso não equivale a ignorar o canal. Ignorar emissores venceu 4/4 com possíveis acertos incidentais. São evidências de estratégias simuladas, não taxas de sucesso humano.

219 verificações passaram, além dos testes reais de interface. Os indicadores de espera/deslocamento vazio servem para localizar trechos a observar; não justificam reduzir automaticamente a duração. A rodada de 5–8 pessoas está [preparada e pendente](TESTE-COM-INICIANTES.md). A fase 4 técnica está entregue; dificuldade percebida e diversão permanecem sem validação humana.

Os registros seguintes são históricos, anteriores ao roteiro versão 2.

## Fase 3 — continuidade sem alterar o balanceamento

A fase 3 mantém parâmetros de combate e recursos dos pontos de entrada. Identidade e marca assistida são independentes da tentativa; continuar restaura a entrada da fase/chefe, sem acumular recompensas. Foram aprovadas 207 verificações Node, incluindo as seis campanhas de regressão com os mesmos tempos, usos de R e impactos registrados na fase 2, e uma campanha adicional validando cada salvamento. Os fluxos reais de reabertura/menu/auxílio foram conferidos em três resoluções. [Detalhes e limites](EVOLUCAO-POR-FASES.md).

## Fases 1 e 2 — visibilidade, sorteio e instruções

A interface baixa e os avisos foram corrigidos. A geometria dos núcleos foi adaptada às telas baixas, igualmente no desenho e nas colisões. O sorteio ambiental é separado do desenho e identificado como versão 1; sementes anteriores não descrevem o mesmo ambiente desta versão. A fase 2 acrescenta feedback contextual dos chefes, consulta pela pausa e uma escolha jogável de R no treino, preservando os parâmetros de combate da campanha.

Registro da fase 2: 191 verificações Node, seis campanhas vencidas em 553–638 s (25–34 renovações, 4–7 impactos líquidos), 616 estados de layout no Chrome e três treinos completos/30 consultas de pausa no navegador. A regressão estacionária da fase 1 teve 576 confrontos, zero vitórias, 560 derrotas e 16 sem conclusão no limite de 180 s. Os testes são automatizados, sem avaliação humana; a matriz histórica de 58 cenários não foi refeita. [Escopo e fases restantes](EVOLUCAO-POR-FASES.md).

## Fechamento dos defeitos da auditoria

A revisão atual corrigiu a vitória parada da Tríade, separou recuperação/ataque no chefe 5 e no estágio H final e reposicionou os suprimentos. As instruções acompanham as novas regras. As velocidades reduzidas, recuperação passiva e avisos adiantados do ajuste leve continuam ativos.

Validação: **167 verificações + 576 confrontos estacionários**, sem vitória parada. A matriz ampliada agora tem **58 cenários**: equilibrado venceu 20/20, em 539–624 s, com 27–34 usos de R e 2–8 impactos líquidos. Os novos casos diferenciam ausência de R, ignorar todo o canal, renovar ao entrar no alerta e nunca escolher drones. Veja os [dados atuais](auditoria-correcao-resultados.json) e a [auditoria atualizada](AUDITORIA-PLANEJAMENTO.md), com resultados, adaptações mantidas e limites humanos. Os registros das seções seguintes são históricos.

## Ajuste leve posterior à auditoria

A pedido do usuário, foram alterados somente parâmetros para oferecer um pouco mais de margem ao iniciante:

- Velocidades base dos meteoros reduzidas em aproximadamente 6%, de 3,35–5,05 para 3,15–4,75. Progressão, formações e resistências preservadas; lasers e pilotagem mantêm suas velocidades.
- Recuperação passiva de QBER de 0,18/0,08 para 0,20/0,10 pp/s. R continua com 2 s de imobilização e 10 s de recarga; ruído, limites e comprometimento mantêm suas regras.
- Avisos de salvas secundárias antecipados em até 200 ms, com 2,4 s de antecedência. Horários de impacto, corredores, aberturas e respiros não mudaram. A primeira salva e o rastreamento do Observador mantêm seus tempos.

As 162 verificações passaram, incluindo seis campanhas completas em 541–598 s de ação, com 26–32 usos de R e 5–7 impactos líquidos. Dez cenários foram comparados antes/depois com a mesma configuração e semente: houve seis vitórias em cada grupo; a variante que perde uma decisão a cada 13 passou de uma para duas vitórias em duas sementes. Outras variantes ainda perderam, e algumas trajetórias pioraram: a amostra não comprova ganho universal nem mede a experiência humana. O objetivo do ajuste é aumentar a margem física de reação, sem garantir sucesso automático. No Chrome, foram conferidos os avisos adiantados, desvio de A/B e pausa em computador, celular e paisagem, sem erros de execução.

Os números de 46 cenários e os tempos nas seções abaixo são o registro histórico **anterior a esse ajuste**, preservado para comparação. A ferramenta de análise executa os parâmetros atuais.

## Registro da revisão em seis fases

As seis etapas da revisão estão implementadas. A campanha mantém nove trilhas, movimento contínuo, três encontros por setor, oito guardiões e o limite de 12 impactos na Terra. Não há ajuste oculto da dificuldade conforme o desempenho do jogador.

## Ajustes da fase 6

- **Paisagem baixa:** abaixo de 620 px, a velocidade passa a considerar os 140 px reservados à base. A escala encontra a regra anterior em 620 px, sem salto. Telas mais altas conservam suas velocidades. Nos cinco tamanhos verificados, a rocha mais rápida oferece pelo menos 1,4 s entre lançamento e possível contato, além do aviso de formação de 900 ms. Isso não equivale a 1,4 s de visibilidade completa: painéis e casco podem cobrir parte da aproximação; o aviso antecipado informa as trilhas.
- **Rotação:** em transições envolvendo telas baixas, distância até a nave e velocidade mudam na mesma proporção. Frentes já passadas continuam abaixo da nave; nuvens em permanência conservam a posição de contato e seu prazo. Drones e sondas estáticos voltam às posições previstas para a nova geometria. Pausa, posição horizontal, QBER e relógios continuam preservados.
- **Ritmo:** nuvens e pulsos completamente abaixo do alcance da nave deixam de bloquear a limpeza do encontro. Entre encontros continuam desenhados até sair; o chefe descarta essas caudas já inofensivas. Meteoros, drones, sondas, nuvens em contato e uma frente B ainda pendente continuam bloqueando o avanço. O último impacto na Terra continua podendo causar derrota.
- **Validação:** o piloto passou a distinguir cadência de decisão, atraso para ler avisos, comando mantido, perda periódica de comando e reação à inversão. Na fase 2, não consulta qual sonda é verdadeira enquanto o jogo mostra `?`.

Não foram acrescentadas novas exigências de vida ou dano aos chefes nesta etapa. As mudanças anteriores já criaram pressão, deslocamentos e escolhas de ataque; a etapa final corrigiu diferenças de geometria e esperas sem decisão.

## Método e resultados

Foram executados **46 cenários**, todos com disparos, colisões, recursos, ruído e reparos reais do jogo. Sementes: 1, 42, 519 e 2026. Telas: 1.600 × 900, 1.100 × 800, 390 × 700, 844 × 390 e 760 × 360. Os resultados por cenário estão em [balanceamento-resultados.json](balanceamento-resultados.json).

Os controladores consultam posições e relógios internos e antecipam contatos com precisão. O piloto básico decide a cada 160 ms e compensa inversões. As variantes atrasam a leitura de salvas, mudam o intervalo de decisão ou deixam de compensar os comandos. Isso permite comparar regras e detectar regressões; **os resultados não são uma taxa de sucesso humana nem uma medição da diversão**. O atraso configurado não é uma simulação completa da percepção humana.

| Estratégia/configuração | Cenários | Vitórias | Observação |
| --- | ---: | ---: | --- |
| Equilibrado, cinco telas × quatro sementes | 20 | 20 | 540–604 s de ação; 27–33 usos de R; 1–7 impactos líquidos |
| Priorizar meteoros | 4 | 4 | 544–570 s; 5–8 impactos líquidos |
| Priorizar drones emissores | 4 | 4 | 543–563 s; 4–7 impactos líquidos |
| Leitura de avisos atrasada 300 ms; decisão 240 ms; comando mantido | 4 | 3 | Uma derrota por impactos na fase 8 |
| Leitura atrasada 500 ms; decisão 320 ms; comando mantido | 2 | 0 | Derrotas nas fases 1 e 5; combina atraso com pilotagem agressiva |
| Perder uma decisão a cada 13; leitura atrasada 300 ms | 2 | 1 | Outra tentativa perdeu no chefe final |
| Comparação pareada: com R / sem R, compensando inversões | 2 + 2 | 2 + 2 | Ignorar R aumenta muito a inversão e prolonga o chefe final |
| Comparação pareada: com R / sem R, sem compensar inversões | 2 + 2 | 0 + 0 | Com R chegou à fase 8; sem R perdeu na fase 5 |
| Ficar parado, com tiro automático e R permitido | 2 | 0 | Derrota por 12 impactos, ainda na primeira fase |

Na comparação pareada com compensação, R reduziu os comprometimentos de **48 para 10** e o tempo invertido de aproximadamente **192 s para 22–27 s**. O chefe final passou de cerca de **104 s para 63–64 s**. É possível vencer sem R com esse controlador preciso: o jogo cobra o custo da estratégia, sem exigir uma tecla como condição artificial de vitória.

As simulações com atraso maior perderem não significa que esse tempo de reação torne a fase impossível. O controlador continua tentando atacar até perto do limite e pode fazer escolhas ruins. Separadamente, **3.072 rotas** de sete/nove trilhas, todos os guardiões, pressão, estágios finais e posições iniciais foram percorridas com movimento de 150 ms/trilha, leitura em 400/600 ms e quadros a 30/60 fps. Todas evitaram as salvas. Esse teste de fuga não garante ataque, coleta ou pontuação ao mesmo tempo: abrir mão de uma janela ofensiva é parte da decisão.

## Duração e margem de erro

No grupo equilibrado, os setores iniciais tiveram ondas de 27,1–38,4 s e os posteriores, 36,9–62,4 s. Chefes comuns ficaram entre 13,3 e 51,6 s; o confronto final, entre 58,9 e 86,7 s. Os tempos excluem leitura, pausa e animação final. São referências observadas de controladores, sem limite imposto a uma partida humana.

As metas iniciais de 20–40 s por onda, 20–45 s por chefe e 45–60 s no final eram provisórias. H bem usado encurta a Tríade; limpar combinações nas telas baixas ou perder aberturas pode ultrapassar esses intervalos. A campanha preserva os três encontros e os três estágios finais, em vez de apagar perigos ou encerrar a luta por um cronômetro. As retomadas no início das ondas ou na entrada do chefe evitam repetir toda a campanha após um erro.

Uma carga de escudo continua permitindo um erro físico; outro golpe sem escudo encerra a tentativa. Vitória restaura uma carga e repara um impacto, com outro reparo por chefe vencido sem dano físico. Esses recursos são restaurados ao estado salvo em novas tentativas, sem acumular recompensas. A pressão aumenta pelas combinações, pelos corredores e pela gestão do canal.

## Reprodução e manutenção

A conferência final no Chrome concluiu duas campanhas completas após a abertura e o treinamento, em 1.440 × 900 e 390 × 844, incluindo os oito chefes, os três estágios finais, animação do canhão e tela de vitória. Foram cerca de 553/548 s de ação, 28 usos de R em cada uma e 1/0 impactos líquidos. A pilotagem automatizada acionou eventos de teclado; a campanha móvel também passou por pausa e rotação no quinto chefe. Essas partidas são verificações de integração, não testes humanos.

Conferências de interface em cinco resoluções cobriram alertas, suprimentos, derrota e duas retomadas por cenário. Gestos de toque do navegador verificaram movimento mantido, soltura/cancelamento e R nas duas orientações. Rotação com meteoros, frente e nuvem em permanência preservou estado e tempo de aproximação. Não houve erros de execução ou estouro horizontal; capturas de interface e vitória foram inspecionadas.

```powershell
node tests/fairness.cjs
node tests/balance.cjs
node tools/analyze-balance.cjs --output tmp/balanceamento.json
```

A matriz completa é uma ferramenta de análise manual; a integração contínua executa as suítes e seis campanhas de regressão, incluindo paisagem baixa. Ao alterar velocidades, colisões, salvas, recursos ou padrões, compare também a matriz completa. Mantenha os resultados de derrota: selecionar apenas partidas vencidas esconderia os limites do controle testado.

O ajuste da dificuldade sentida e da diversão depende de partidas de pessoas. Os registros em `quantumDiagnostics.export()` permitem confrontar esse relato com impactos, deslocamento, fontes de QBER, tempo nos chefes e uso de R, sem enviar ou persistir dados do jogador.
