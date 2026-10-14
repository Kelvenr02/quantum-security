# Balanceamento final — revisão de 14/10/2026

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
