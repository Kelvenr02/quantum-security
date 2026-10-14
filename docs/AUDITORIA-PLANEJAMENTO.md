# Auditoria do plano original e da integração

## Correções aplicadas após a auditoria — 14/10/2026

O relatório abaixo é o registro histórico do commit auditado. Esta revisão, sobre a base `ae6108f`, corrige os defeitos de código apontados e preserva o ajuste leve de dificuldade e os briefings em três passos.

| Achado | Correção e evidência atual |
| --- | --- |
| Vitória parada na Tríade | A/B usam corredores distintos desde o primeiro ciclo. A formação alterna núcleos próximos e separados, com previsão azul durante a pressão. H exige sair da posição inicial para coletar. Nenhuma vitória em 576 confrontos estacionários. |
| Recuperar e atacar na mesma faixa | Chefe 5 e estágio H final têm alvos separados da faixa verde, fora até do alcance lateral de H. A faixa permanece estável durante o ciclo e anuncia a próxima posição por 2 s. Recuperação de 34 pp/s e perda de 14/16 pp/s permitem investir e retornar; dano continua exigindo pelo menos 50%. |
| Suprimentos convenientes | H e + chegam por um corredor seguro anunciado, fora da posição da nave. A seleção prefere evitar alvos e zonas de recuperação. A travessia cabe no aviso e na queda; permanece o limite de uma cápsula por ciclo. |
| Quadro da missão | A legenda inicial agora diz “1.000 de carga”. Pontos de destruição continuam separados. |
| Sinalização | Meteoros mostram a linha “DIVIDE AQUI” no limiar real de fragmentação. Nuvens móveis mostram uma seta e o contorno da projeção horizontal em 600 ms, calculados com a mesma função do movimento. |
| Áudio | Entrada de chefe usa `bossEntry`, uma sequência ascendente distinta do alerta de canal comprometido. Música, volumes e pausas preservados. |
| Métricas | Diagnóstico schema 2 guarda acertos e dano por chefe, estágio, ciclo e janela, inclusive aberturas sem dano. O golpe que troca o estágio pertence à janela anterior; retomadas ficam em novas amostras e a tentativa anterior permanece no histórico da sessão. Não há evento por quadro. |
| Estratégias | A matriz distingue não usar R de ignorar o canal, inclui renovação imediata no alerta e uma política que nunca escolhe drones. Regressões verificam essas decisões; a varredura estacionária também entrou no GitHub Actions. |

### Validação desta correção

- **167 verificações de regras e integração aprovadas**, incluindo seis campanhas completas, conservação de recursos, retomadas, pausas e 3.072 rotas físicas de fuga.
- **576 confrontos estacionários**: oito chefes × nove trilhas × duas telas × dois estados de escudo × com/sem R. Limite de 180 s por confronto, disparos/cápsulas/ruído reais: **zero vitórias, 560 derrotas e 16 confrontos sem conclusão**. Isso impede a brecha conhecida; não afirma que toda posição parada necessariamente recebe um golpe.
- **58 campanhas na matriz ampliada**, com dados e histórico por abertura em [auditoria-correcao-resultados.json](auditoria-correcao-resultados.json). Equilibrado: **20/20 vitórias**, 539–624 s de ação, 27–34 usos de R, 2–8 impactos líquidos. Tríade: 22,6–41,1 s; chefe 5: 24,8–34,7 s; final: 58,5–73 s.
- Ignorar de fato o canal perdeu os quatro casos nas fases 4–5. Renovar imediatamente no alerta perdeu os quatro casos nas fases 6–8: R imobiliza e precisa de uma oportunidade segura. Não escolher drones ainda permitiu quatro vitórias, com 8–11 drones escapando; a fonte não é um bloqueio artificial da progressão. Essas amostras não provam uma estratégia universalmente melhor.
- Chrome automatizado: reprodução antiga da Tríade derrotada sem movimento, R ou escudo em quatro telas; Tríade, chefe 5 e chefe final vencidos em **12 confrontos isolados**, com pausas e avisos conferidos. Briefings dos oito chefes, teclado e retomada conferidos em 1.440 × 900, 390 × 844, 844 × 390 e 760 × 360. Capturas inspecionadas em computador, celular e paisagem.

### Adaptações preservadas e limite da conclusão

O final mantém Bell + QBER, H + coerência e síndrome + interferência; não foi acrescentado rastreamento ao primeiro estágio. O alerta de QBER permanece no painel. A música muda por fase/confronto e os estágios usam efeito de transição, sem intensificação adicional da trilha. São escolhas de integração explicitadas, não itens marcados como implementados conforme a proposta literal.

A duração atual é de aproximadamente 9–10 min e 24 s de ação nos pilotos equilibrados; leitura e pausas ficam fora desse tempo. As referências iniciais eram provisórias e não motivaram corte automático de encontros ou vida. **Partidas humanas com teclado e toque continuam pendentes**, portanto não se conclui sobre dificuldade percebida ou diversão apenas pelas simulações.

## Relatório original — preservado para comparação

Revisão de 14/10/2026 sobre o commit `ef3dc06`, branch `feat/desafios-quanticos`. A auditoria compara o plano original fornecido pelo usuário com o comportamento implementado; não altera as regras do jogo.

**Resultado: o núcleo da campanha está integrado e funcional, mas o plano não foi cumprido integralmente.** A conclusão anterior de que as seis etapas estavam implementadas descreve os blocos técnicos; não comprova todos os requisitos específicos do plano. Esta auditoria identifica brechas, adaptações e cobertura ainda incompleta.

## Verificação executada

- As 11 suítes existentes foram executadas novamente: **162 verificações aprovadas**, incluindo seis campanhas completas. Os testes de fuga abrangem 3.072 rotas defensivas.
- Foram examinados código, ordem de carregamento, transições, checkpoints, recursos, apresentação, áudio e métricas. Os 46 resultados de balanceamento já registrados foram confrontados com as estratégias que o controlador realmente executa; essa matriz não foi reexecutada nesta auditoria.
- Nova varredura: **144 confrontos isolados**, oito chefes × nove posições fixas × duas telas, com até 180 s por confronto. A nave não recebe comandos de movimento; R é permitido quando o canal e o respiro indicam oportunidade. A varredura encontrou uma exceção: o jogador parado na posição central conseguiu derrotar a Tríade nas duas telas.
- A brecha da Tríade foi repetida com R desabilitado e escudo inicial esgotado, em duas telas simuladas. Depois foi confirmada no Chrome em **1.440 × 900 e 390 × 844**, sem movimento e sem R, também com escudo inicial esgotado. Esses confrontos são isolados; não representam uma campanha inteira parada.
- Não foram realizados testes com jogadores humanos nesta auditoria. Os testes de navegador anteriores e os atuais são automatizados.

## Correspondência com os oito pontos do plano

| Ponto | Situação | Evidência e ressalva |
| --- | --- | --- |
| 1. Gestão do canal | Implementado e integrado | QBER e recarga atravessam encontros; recuperação passiva de 0,18/0,08 pp/s; vitória remove até 1,5 pp; chefes emitem ruído; R interrompe comprometimento; recuperação automática limita a 9%, com margem de 2,5 s. Não há obrigação artificial de apertar R. |
| 2. Arena ampliada | Implementado e integrado | Nove trilhas, limite de 1.600 px, 150 ms/trilha, movimento contínuo, comandos mantidos por teclado/toque. Colisão e disparos usam a posição física. Alvos e salvas são generalizados; ajustes de paisagem e rotação preservam aproximação. |
| 3. Três encontros | Implementado; duração adaptada | Apresentação, combinação e pressão sem novas telas de diálogo entre encontros. Carga acompanha resolução do roteiro; pontos remuneram destruições. Ameaças ainda ativas impedem o chefe. As durações ultrapassam algumas referências iniciais. |
| 4. Novas ameaças | Implementado; sinalização parcial | Sonda, drone e fragmentação estão introduzidos gradualmente, com limites de simultaneidade/acertos e espaçamento. O limiar de fragmentação não é desenhado como a linha prometida; a oscilação das nuvens não tem previsão explícita de trajetória. |
| 5. Reformulação dos chefes | Parcial | Os oito modelos têm identidade, pressão, avisos e janelas. Há uma vitória estacionária na Tríade; o chefe 5 não separa recuperação e ataque. As combinações do chefe 8 foram adaptadas. |
| 6. Recompensas e recuperação | Implementado; escolha nos suprimentos parcial | Um reparo básico e outro por chefe sem dano; escudo conservado na entrada e restaurado após vitória; H de 5 s, teto de 7 s; + reduz até 4 pp/2 s. Suprimentos comuns exigem desvio; suprimentos de chefes frequentemente coincidem com a posição ótima de ataque. Isso contribui para a brecha do chefe 3. |
| 7. Leitura, controles e retomada | Majoritariamente integrado | Avisos A/B/C, rastreio/fixação, estados do canal, H/escudo, mensagens e sons. Retomada do chefe e repetição das ondas restauram recursos sem acumulação. Restam texto inicial desatualizado, sinalização do limiar e detalhes sonoros. |
| 8. Validação e métricas | Parcial | Há métricas por fase/trecho, QBER por fonte, movimento, uso de R, impactos e reparos separados, além de cenários variados. Faltam dano histórico por abertura, uma estratégia que ignore realmente o canal, uma que renove imediatamente ao entrar em alerta e testes humanos. A verificação estacionária de cada chefe não existia e revelou a brecha atual. |

## Achados prioritários

### 1. A Tríade Hadamard ainda pode ser vencida sem movimentação

**Prioridade alta.** Na trilha central, a combinação de salvas, deslocamento dos núcleos e cápsula H inicial permite eliminar os 24 pontos de vida sem mudar de trilha. Os núcleos continuam sendo um grupo de três posições adjacentes que muda de lugar, em vez de alternar sua proximidade conforme a proposta original.

Reprodução no Chrome, sem R e com escudo inicial zero:

| Tela | Resultado | Tempo de ação | Deslocamento | Golpes físicos | Uso de R |
| --- | --- | ---: | ---: | ---: | ---: |
| 1.440 × 900 | Chefe vencido; avançou à fase 4 | 22,16 s | 0 trilhas | 0 | 0 |
| 390 × 844 | Chefe vencido; avançou à fase 4 | 22,197 s | 0 trilhas | 0 | 0 |

Nos dois casos, a cápsula H foi coletada automaticamente. Começando com cinco impactos, a vitória terminou com três: o sistema concedeu os dois reparos e restaurou o escudo por ser uma vitória sem dano. Isso mostra uma falha de composição: padrões, suprimento e recompensa funcionam individualmente, mas juntos premiam uma estratégia que o plano pretendia eliminar.

Fontes: [formação e corredores](../boss-model.js#L65), [alvos H](../boss-model.js#L126), [suprimentos](../bosses.js#L40), [recompensa](../bosses.js#L119). Os testes antigos de imobilidade não cobriam todos os chefes: a campanha parada perdia nas ondas iniciais, antes de chegar à Tríade.

Correção recomendada: revisar conjuntamente corredores, posições dos núcleos e local/momento da cápsula. A estratégia central parada deve falhar sem eliminar a utilidade de H. Validar todas as nove posições, nas duas situações de escudo e com/sem R; depois repetir a campanha completa.

### 2. O chefe 5 mantém recuperação e ataque na mesma posição

**Prioridade alta para aderência ao plano.** A coerência aumenta dentro da faixa verde, e o alvo aparece justamente em `zone[0]`, dentro dessa faixa. Seguir o alvo oferece também recuperação. Há mudança de zona e salvas exigentes, mas não a escolha explicitamente proposta entre recuperar, sair para atacar e voltar.

Fonte: [recuperação de coerência](../boss-model.js#L108) e [posição do alvo](../boss-model.js#L139).

Correção recomendada: separar a zona de recuperação da posição útil de ataque, com reserva de coerência suficiente para uma investida e retorno. Revalidar o segundo estágio final, que reutiliza estabilização; não aplicar a mudança apenas ao quinto chefe sem verificar seu efeito no confronto final.

### 3. A abertura ainda confunde pontos com carga

**Prioridade média.** O quadro da primeira cena exibe “1.000 pontos”, mas a regra atual exige 1.000 unidades de carga e oito guardiões. O diálogo principal e o painel da campanha já fazem a distinção. Trata-se de um texto residual da versão anterior.

Fontes: [quadro da missão](../index.html#L26), [exibição na primeira cena](../story.js#L61), [carga por resolução](../encounters.js#L99).

Correção recomendada: trocar a legenda por “1.000 de carga” e conferir os demais resumos da missão.

### 4. A validação de estratégias está incompleta

**Prioridade média.** Desabilitar R não equivale a ignorar completamente o canal. Mesmo com `manageChannel=false`, o piloto usa QBER para decidir se evita nuvens, pulsos e frentes, e pode compensar inversões. A comparação registrada comprova o custo de não regenerar com esse controlador, não o comportamento de alguém que ignora QBER.

Também não existe uma opção que regenere assim que o canal entra em alerta: a política atual espera respiros ou determinadas condições do campo. Priorizar meteoros mantém drones como alvos quando não há rochas; não significa ignorar todas as fontes de ruído.

Fontes: [decisões do piloto](../tests/balance.cjs#L26) e [cenários disponíveis](../tools/analyze-balance.cjs#L6).

Correção recomendada: acrescentar variantes separadas e declaradas para ignorar o canal, renovar no alerta e ignorar emissores; manter a comparação pareada com a mesma pilotagem. Incluir a varredura estacionária de cada chefe na regressão. Testes com pessoas continuam necessários para avaliar clareza, dificuldade sentida e diversão.

### 5. Sinalização e áudio têm diferenças em relação à proposta

- O meteoro tem rachadura e legenda “FRAGMENTÁVEL”, mas o campo `splitY` não é desenhado como linha ou marcador de aproximação. O jogador reconhece o tipo, sem ver exatamente o limiar prometido. Fontes: [limiar](../encounters.js#L144), [desenho](../quantum.js#L165).
- Nuvens oscilam e permanecem na passagem; há identificação visual e avisos de lançamento, mas não uma previsão explícita do movimento lateral. Fonte: [movimento](../script.js#L626).
- O alerta de QBER existe no painel e tem sinal sonoro; foi integrado ao painel superior, em vez de ficar próximo à nave como inicialmente sugerido. É uma adaptação de layout para evitar obstrução da arena, não ausência total de alerta.
- Música muda por fase e entre exploração/chefe. Mudanças de estágio acionam um efeito `phase`, mas não intensificam a trilha ou sua mixagem. Essa intensificação era uma possibilidade do plano, não um requisito indispensável. Fontes: [estágio](../bosses.js#L99), [seleção/mixagem](../audio.js#L72).
- A entrada do chefe reutiliza o som `compromised`, também usado para comprometimento real do canal. Diferenciar esses sinais melhoraria sua interpretação. Fonte: [início do confronto](../bosses.js#L55).

### 6. As métricas não guardam dano por abertura

Há acertos/dano agregados por fase e chefe, contagem de ciclos e eventos de padrão. O modelo mantém `slotHits` para limitar algumas janelas, mas não exporta um histórico de dano por abertura nas métricas. Isso limita a avaliação de quanto cada oportunidade ofensiva foi aproveitada.

Fontes: [métricas agregadas](../metrics.js#L8), [registro de dano](../bosses.js#L97), [limites internos de janela](../boss-model.js#L155).

Correção recomendada: registrar dano agregado por chefe/estágio/ciclo/janela, sem gravar um evento por quadro. Continuar separando impactos brutos e reparos, como já está implementado.

## Conferência dos oito chefes

| Chefe | Comparação com o plano |
| --- | --- |
| 1. Sentinela | Relés, QBER <8%, ruído independente e mudança após o primeiro relé estão presentes. O relé segue a ordem dos sobreviventes; não é uma alternância livre. É possível sobreviver parado em algumas trilhas sem causar dano, mas isso não resolve o chefe. |
| 2. Observador | Rastreia, fixa a mira, revela a sonda verdadeira e muda a leitura na pressão. Ruído por leitura errada considera permanência e evita penalizar o simples trânsito de tiros automáticos. |
| 3. Hadamard | Aberturas distintas, H e mudança de formação presentes; a vitória estacionária e a formação sempre adjacente deixam o objetivo de posicionamento parcial. |
| 4. Bell | Lados alternados, dano compartilhado, limite por abertura e salvas coordenadas presentes. |
| 5. Coerência | Faixa móvel, coerência mínima e pressão presentes; recuperação e ataque não foram separados. |
| 6. Síndrome | Módulo +, mudança entre ciclos, nova leitura na pressão e ruído de módulo incorreto presentes. |
| 7. Interferômetro | Corredores distintos A/B, C na pressão, núcleo móvel e abertura sobreposta presentes. |
| 8. Nave-mãe | Três estágios e canal persistente presentes. Implementado: Bell + QBER, H + coerência, síndrome + A/B/C. O primeiro estágio não traz o rastreamento proposto; é uma combinação alternativa funcional, que precisa ser reconhecida como adaptação. |

## Integrações que estão funcionando

1. **Treino → campanha:** compartilham a pilotagem de nove trilhas/150 ms; estado do treino não vaza para a campanha. O treino ensina disparo automático, R de 2 s e recarga de 10 s. História e briefings distinguem analogias de operações quânticas reais.
2. **Ondas → chefe:** não há reset gratuito de QBER, recarga ou escudo. H e tempos restantes são preservados. O chefe só entra quando o roteiro termina e não há perigo ativo pendente. Caudas abaixo do alcance não atrasam a transição.
3. **Estágios → próximo estágio:** avisos são reiniciados; QBER e recursos não são zerados. Mudança durante R considera imobilização, percurso até uma rota livre e margem de reação.
4. **Chefe → fase seguinte:** recompensa é aplicada uma vez, QBER recebe recuperação parcial e o novo ponto de retomada guarda os recursos resultantes.
5. **Derrota → retomada:** voltar ao chefe restaura seu estado de entrada e vida inteira; refazer a fase restaura o início das ondas. Não se acumulam pontos, cápsulas, escudos ou reparos entre tentativas.
6. **Pausa/rotação:** relógios e comandos mantidos são tratados de forma compartilhada; colisões e desenho usam posição física. A revisão das telas baixas está coberta por testes.

## Ritmo: metas iniciais versus dados registrados

| Trecho | Referência original | Grupo equilibrado registrado |
| --- | --- | --- |
| Ondas iniciais | 20–30 s | 27,1–38,4 s |
| Ondas posteriores | 30–40 s | 36,9–62,4 s |
| Chefes comuns | 20–45 s, conforme a fase | 13,3–51,6 s |
| Chefe final | 45–60 s | 58,9–86,7 s |
| Campanha | Aproximadamente 6–9 min de ação | 9–10 min e 4 s de ação |

As referências eram provisórias; ultrapassá-las não constitui, por si só, um erro. Entretanto, não se pode afirmar que o ritmo planejado foi atingido. Leitura e pausas ficam fora desses tempos. Os dados são de controladores automáticos; a experiência humana ainda não foi medida.

Na matriz já registrada, as dez derrotas foram sete por impactos na Terra e três por salvas físicas. Isso mostra diversidade de desfechos, mas não permite atribuir toda a derrota a uma única decisão: QBER pode contribuir indiretamente para impactos por meio de controles invertidos.

## Ordem recomendada para fechar o plano

1. Eliminar a vitória estacionária da Tríade e acrescentar regressão para todos os chefes/posições, com e sem R.
2. Implementar ou renegociar explicitamente a separação entre recuperação e ataque no chefe 5, conferindo também o estágio final que compartilha essa lógica.
3. Corrigir a legenda de carga na abertura e sinalizar o limiar de fragmentação.
4. Completar as estratégias de validação e a métrica por abertura; revisar a oportunidade de escolha nos suprimentos dos chefes.
5. Consolidar as adaptações do chefe final, do alerta de QBER e do ritmo na documentação; avaliar sinais sonoros e previsão de nuvens.
6. Complementar com partidas humanas de teclado e toque antes de concluir sobre diversão e dificuldade percebida.

Esta auditoria não aplica essas correções nem modifica o balanceamento. As pendências acima permanecem abertas no commit analisado.
