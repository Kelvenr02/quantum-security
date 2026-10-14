# Revisão da dificuldade — execução por fases

A implementação avança uma fase por vez. Ao concluir cada fase, o trabalho para e aguarda o usuário responder **Continue** antes de iniciar a seguinte. Os parâmetros são pontos iniciais de balanceamento; simulações verificam viabilidade e partidas humanas verificam o desafio e a diversão.

## Fase 1 — Arena, controles e métricas — concluída

- Arena com nove trilhas e largura máxima de 1.600 px; altura acompanha a janela.
- Travessia física de 150 ms por trilha, compartilhada pelo treinamento e pela campanha. A posição usada no desenho também orienta disparos, colisões, coerência e contato com salvas.
- Teclado e toque aceitam comando mantido com cadência definida pela simulação. Repetição do sistema operacional não acelera a nave. Um segundo toque curto pode ficar no buffer; pausa, perda de foco e transições limpam comandos mantidos.
- Regeneração congela a posição durante a travessia; redimensionamento preserva seu progresso. A nave e os corpos se ajustam à largura das trilhas no celular.
- Chefes adaptados à geometria da arena; seus alvos, zonas e salvas permanecem dentro das trilhas. As frentes comuns continuam deixando três trilhas livres.
- Instrumentos compactados no topo; disposição em três colunas nas telas horizontais baixas para não cobrir os núcleos dos chefes. Botões de toque comportam comandos mantidos e cancelamento do gesto.
- Diagnóstico agregado por fase e por trecho (onda/chefe): tempo de ação e de movimento, distância em trilhas, QBER por fonte e recuperação, R disponível/usado/rejeitado, ameaças geradas, acertos, destruições, salvas, dano em chefes, impactos brutos e reparos.

Os dados ficam apenas na memória da página. Não há envio, armazenamento persistente nem coleta de identidade. O histórico contém até cinco partidas anteriores e cada partida mantém até 128 eventos de transição; não se grava um histórico por quadro.

No console do navegador:

```js
quantumDiagnostics.snapshot() // objeto independente com a partida atual
quantumDiagnostics.export()   // JSON para análise
quantumDiagnostics.previous() // partidas anteriores desta página
```

As contagens de impactos e reparos são independentes do contador líquido mostrado durante o jogo. Tempos excluem pausa, leitura de briefings e animação final. O tempo com R disponível é distinto de `recoveryWindowMs`, acrescentado na fase 2 para registrar os respiros dos chefes. A fase 3 também registra as oportunidades nos respiros entre encontros.

Validação: 13 casos específicos de arena/pilotagem/métricas, suítes anteriores e quatro campanhas com colisões ativas. Piloto de regressão atualizado para considerar o trajeto, antecipar contatos pelo tamanho/velocidade das rochas e aproveitar disparos já em rota; não recebe pontos, vida nem dano artificial. Quatro campanhas concluídas em 216–225 s de ação nas configurações 1.600 × 900, 1.100 × 800 e 390 × 700 (duas sementes). A simulação lê o estado interno: esses tempos não medem desempenho humano. Outras combinações podem resultar em derrota.

Conferência adicional no Chrome local: 1.920 × 1.080, 1.440 × 900, 390 × 844 e 844 × 390; abertura e treinamento completos, teclas mantidas, pausa no meio da travessia, toque mantido, oito chefes, ausência de estouro horizontal e painéis sem cobrir os núcleos.

Esta fase estabelece a nova geometria e os registros. O rebalanceamento do canal, das ondas e dos chefes será feito nas etapas seguintes.

## Fase 2 — QBER e regeneração — concluída

- Recuperação passiva reduzida para 0,18 pp/s nas fases 1–4 e 0,08 pp/s nas fases 5–8. Ruído ambiental dos chefes varia de 0,24 a 0,80 pp/s; funciona mesmo sem acerto físico.
- QBER e recarga continuam na entrada do chefe e na passagem de fase. Vitória recupera até 1,5 pp, sem fornecer automaticamente uma nova chave.
- Comprometimento dura até 4 s, não prolonga a inversão a cada contato, não apaga ameaças e não dá imunidade ao ruído durante toda a penalidade. Recuperar os comandos limita QBER a 9%, respeitando correções já obtidas, com margem de 2,5 s antes de outra inversão e proteção de contato de apenas 600 ms.
- R disponível interrompe o comprometimento e preserva os 2 s de parada/ausência de disparos e 10 s de recarga. A renovação não protege de dano físico; termina sem antecipar movimento/ruído por um quadro inteiro quando cruza seu prazo no meio de um quadro.
- Perturbação dourada anuncia a mira fixa em até três trilhas por 1,2 s. Contato afeta somente QBER: 2,5 pp nos chefes 1–4 e 3 pp nos chefes 5–8. Desviar ou renovar evita o contato. Vitória e mudança de estágio cancelam a perturbação anterior.
- Respiros são indicados após as salvas quando há pelo menos 2,4 s antes do ciclo seguinte. Renovar pode consumir parte da abertura para atacar. Se um laser em voo mudar o estágio durante R, a nova salva mantém uma margem de reação de 400 ms depois da renovação.
- Briefings informam o QBER e a recarga carregados. Retomadas restauram o canal e os tempos restantes de renovação, recarga, comprometimento e proteção; não oferecem chave pronta por repetição.
- Avisos de comprometimento/renovação/canal instável ficam abaixo da nave. Introdução e documentação explicam a renovação de emergência. R continua sendo uma analogia de descarte/preparação de um novo bloco; as fontes de ruído permanecem ativas.

Validação: 22 casos específicos em `tests/channel.cjs`, suítes anteriores e quatro campanhas completas, em 257–269 s de ação, com 10–12 renovações e 1–3 comprometimentos. Em 1.600 × 900, a comparação com a mesma pilotagem sem R teve 14 comprometimentos e cerca de 56 s de inversão; com R, um comprometimento e cerca de 1,2 s. O controlador lê o estado interno e consegue vencer aquele caso sem R, compensando inversões: o resultado comprova exposição à penalidade, não dificuldade humana nem uma obrigação de renovar em momentos fixos.

Conferência no Chrome em 1.920 × 1.080, 1.440 × 900, 390 × 844 e 844 × 390: mira/contagem da perturbação, pausa, respiro indicado, comprometimento sem dano físico, R de emergência por teclado/toque, ausência de disparos durante renovação e retomada com recursos preservados. Sem erros de execução e sem alerta cobrindo a nave.

## Fase 3 — Ondas e ameaças — concluída

- Cada setor tem três encontros: apresentação, combinação e pressão. São 13 formações nas fases 1–2 e 16 nas demais, com aviso de 900 ms, rotas espelhadas/alternadas por semente e respiros de 1,8 s após limpar o setor. O painel indica encontro, carga e oportunidade de R.
- O chefe exige os três encontros e a resolução de meteoros, fragmentos, drones, sondas, nuvens, pulsos e frentes. Pontos ou carga na meta não apagam perigos; o último impacto na Terra continua podendo causar derrota.
- A carga conserva a escala acumulada de 0–1.000, mas acompanha a resolução das ameaças do roteiro. Pontos ficam separados: rocha comum/blindada/rápida ou membro de par = 10; drone = 25; rachado interceptado cedo = 15; fragmento = 5. Impactos e fugas resolvem a ameaça para a carga, sem dar pontos; o limite de 12 impactos continua valendo. A carga representa o avanço da defesa enquanto o canhão se prepara.
- Sonda a partir da fase 2: rastreia a posição física por 1,1 s, fixa uma trilha, avisa por mais 900 ms e emite um pulso de +5 pp de QBER. Desviar depois da fixação evita o contato. Não recebe tiros e não consome escudo físico.
- Drone a partir da fase 3: aquecimento de 800 ms, 2 acertos (3 nas fases 6–8) e emissão de 0,65 pp/s (0,85 nas últimas fases). Destruí-lo interrompe a fonte; se ignorado, permanece até 6,5 s e recua sem pontos. Não aparece junto de outra sonda/drone ativo.
- Meteoro rachado a partir da fase 5: um tiro antes do limiar evita a divisão. Caso contrário, origina dois fragmentos em trilhas distintas, com abertura contínua em 500 ms e separação vertical de 75 px. O primeiro oferece pelo menos 1,6 s até o contato nas quatro geometrias verificadas. Ambos compartilham uma unidade de carga; não há divisão recursiva.
- O diretor considera acertos, cadência de 300 ms e percurso de 150 ms/trilha para espaçar formações. Adia lançamentos acima de seis rochas simultâneas ou de quatro acertos pendentes nas fases iniciais/seis nas demais. A divisão pode acrescentar uma rocha; novas formações aguardam sua resolução. Isso preserva escolhas entre ruído, posicionamento e proteção da Terra.
- Rápidos não acumulam blindagem/ligação/divisão; pares conservam a destruição conjunta. Rochas de uma formação chegam escalonadas em 85 px. Lasers usam colisão varrida para não atravessar alvos entre quadros.
- Nuvens oscilantes podem coexistir até quatro e permanecem na passagem por 1,2 s. Frentes deixam corredor contíguo de três trilhas. No terceiro encontro das fases 7–8, A/B mudam o corredor com 1,2 s entre passagens; a travessia mínima exige no máximo seis trilhas. Avisos e contagens de A/B aparecem separados.
- Retomar restaura semente e pontos do início da fase, além do canal e dos recursos existentes. Métricas acrescentam encontros, adiamentos, drones, sondas, fragmentações e tipo/trilha dos impactos. Não há gravação externa.

Validação: 19 novos casos em `tests/encounters.cjs`, incluindo repetibilidade, progressão sem apagar ameaças, último impacto fatal, ruído versus dano físico, fragmentação, orçamento, fuga, respiros, pausa, redimensionamento e retomada. As quatro campanhas de regressão concluíram os oito chefes em 446–469 s de ação, com 26–29 renovações, 10–14 comprometimentos e 3–8 impactos líquidos após reparos. O controlador prioriza fontes de ruído e rachados, aproveita respiros e aceita alguns contatos de ruído para proteger a Terra. Consulta o estado interno e compensa inversões: comprova viabilidade, não dificuldade humana. Na comparação de 1.600 × 900 sem R, perdeu na fase 7 com 22 comprometimentos e cerca de 84 s de inversão.

Conferência no Chrome em 1.920 × 1.080, 1.440 × 900, 390 × 844 e 844 × 390: aviso/lançamento real da primeira formação, drone ativo, sonda fixando e permitindo desvio, fragmentos, pausa e pontos separados; sem erros de execução nem estouro horizontal. A duração aumentou porque os três encontros precisam ser resolvidos. O ajuste final de duração, taxa de sucesso humana e diversão permanece na fase 6.

## Fase 4 — Oito chefes — concluída

- Modelo separado em `boss-model.js`, independente de canvas/áudio, com ciclos de 9–10 s, posições e janelas próprias. Os números das barras de vida foram preservados; no Bell final, cada acerto remove uma unidade, em vez de duas. Limites por janela e combinações impedem resolver o combate apenas ficando parado e disparando numa abertura longa.
- Sentinela: um relé validado por ciclo, QBER <8% e segunda salva após o primeiro relé. Observador: três sondas, rastreio por 650 ms seguido de mira fixa por 2 s; nova varredura durante a pressão. Hadamard: laterais antes do centro, sobreposição de 500 ms e mudança anunciada da formação na pressão.
- Bell: dois lados por ciclo, até três acertos por abertura; dois na pressão. Devorador: coerência mínima de 50%, anúncio da zona seguinte e deslocamento durante a abertura; faixa de uma trilha e terceira mudança/salva na pressão. Síndrome: indicação por ciclo e uma segunda indicação anunciada durante a pressão.
- Interferômetro: corredores distintos A/B, núcleo que muda e abertura antes da próxima salva; C e novo deslocamento na pressão. Nave-mãe: Bell + verificação de QBER <9%; H + zonas de coerência; síndrome + rotas A/B/C. Cada estágio reinicia os avisos sem apagar a situação do canal.
- A pressão entra no ciclo seguinte após metade da vida, sem reescrever salvas anunciadas. A Sentinela muda após o primeiro relé; o confronto final usa as combinações desde o início de cada estágio. Indicadores azuis antecipam zonas, deslocamentos de H e a próxima síndrome.
- Cada salva física tem pelo menos 2 s após anunciar/fixar a mira e deixa ao menos duas trilhas livres. A/B têm 1,8 s entre impactos; B/C, 2 s. Os corredores podem exigir deslocamento: não se conserva uma trilha segura durante o ciclo todo. Rotas em sete e nove trilhas verificadas com travessia de 150 ms e reação de 400 ms.
- Respiro indicado somente 450 ms após a última salva do ciclo, quando cabem R e 400 ms de margem. A entrada ou troca de estágio durante R adia o ciclo quando necessário para preservar essa margem; todos os avisos acompanham o adiamento. Canal/QBER/recarga continuam entre encontros.
- Proteção física após consumir o escudo reduzida a 450 ms nos chefes; nas ondas continua em 1,4 s. Salvas são aplicadas uma vez por evento e a vitória cancela ataques pendentes. Recompensas, escudo renovado e retomada no início da fase permanecem para a revisão de recursos da fase 5.
- Insistir parado por 600 ms numa sonda falsa ou módulo errado pode devolver 0,8/0,6 pp ao canal, com intervalo mínimo de 900 ms. Tiros durante movimento e disparos laterais de H não são penalizados dessa forma. H chega ao centro útil da Tríade/estágio de coerência final, conservando a alternativa de vencer sem a cápsula.

Validação: 27 casos específicos de chefes e 129 verificações no total, com rotas alcançáveis, alvos, pressão sem alteração retroativa, sobreposição de aberturas, coerência pela posição física, ruído, proteção, vitória, pausa, apoio H e transições durante R. As quatro campanhas com colisões ativas concluíram os oito chefes em 553–575 s de ação, com 28–32 renovações e 3–7 impactos líquidos. Chefes 1–7: 13,5–36,3 s; final: 58,3–64,7 s. H eficiente permite terminar a Tríade antes da referência de 20 s; o final pode ultrapassar ligeiramente 60 s. Ajustes finais de ritmo e dificuldade humana pertencem à fase 6.

O piloto de regressão consulta o estado interno, segue avisos visíveis, compensa inversões e prioriza a defesa da Terra quando perto do limite de impactos. Na comparação em 1.600 × 900 sem R, ainda venceu, mas sofreu 47 comprometimentos e cerca de 187 s de inversão, contra 10 e cerca de 26 s com R. O chefe final levou aproximadamente 95 s sem R e 64 s com R. São evidências de viabilidade e custo da estratégia nesse caso, não uma obrigação artificial de renovar nem uma estimativa da taxa de sucesso humana.

Conferência no Chrome local: os oito chefes foram concluídos isoladamente nas quatro configurações 1.920 × 1.080, 1.440 × 900, 390 × 844 e 844 × 390, com piloto de regressão e QBER inicial de 4%. Foram conferidos pressão, pausa, três estágios finais, transição e vitória, sem erros de execução ou estouro horizontal. Os confrontos comuns ficaram em 15,9–42,9 s e o final em 61,9–65,9 s nesses cenários de interface. Inspeções adicionais verificaram previsões de H, zona e síndrome, alerta C, rotação pausada e painéis sem cobrir núcleos. Rótulos em telas baixas ficam em linhas distintas e acima dos núcleos, preservando a nave. As campanhas completas acima verificam separadamente os recursos/canal efetivamente carregados entre fases.

## Fase 5 — Recursos, leitura e retomada — concluída

- Escudo com uma carga na campanha e após cada vitória; entrar no chefe preserva o restante das ondas. Vitória repara um impacto, com mais um se não houver dano físico durante o confronto. Recompensas são aplicadas uma única vez e não passam por derrotas. O limite da Terra permanece em 12 impactos.
- H acrescenta 5 s de disparos triplos, até 7 s restantes. A correção + reduz até 4 pp de QBER e 2 s de recarga, sem encerrar sozinha o comprometimento. A mensagem mostra o benefício efetivo quando algum limite é atingido.
- Suprimentos das ondas exigem deslocamento de uma a três trilhas, com tempo para a travessia e previsão de contatos com perigos já presentes. H com mais de 2 s restantes adia outro H. Intervalos de referência de 8,5 s nas fases iniciais e 8 s nas últimas. O cálculo não prevê ameaças ainda não lançadas; recolher continua sendo uma decisão.
- Chefes 3/6/8 oferecem no máximo uma cápsula por ciclo, próxima da área útil, com anúncio de 900 ms antes da queda. Perder uma cápsula não cria reposição no mesmo ciclo. Coleta usa o trajeto físico da nave entre quadros; um quadro que cruza a liberação move apenas o trecho de tempo liberado. Cápsulas dos chefes são desenhadas à frente do casco.
- Alerta do canal integrado ao painel de QBER; faixa de recursos informa escudo e duração de H. Salvas físicas têm contagens separadas e recebem prioridade sobre mensagens temporárias quando faltam menos de 900 ms. Painéis compactados em telas horizontais baixas, sem ocupar os núcleos.
- Sinais próprios para entrada em canal instável/crítico, R pronto, escudo consumido e suprimento liberado. São disparados nas transições reais; pausas e briefings congelam os relógios. As músicas e preferências de volume existentes são preservadas.
- Pontos de retomada imutáveis no início da fase e na entrada do chefe. Guardam impactos, pontos, carga, cápsulas, escudo/proteção, H, semente, posição e movimento, QBER e durações de R/recarga/comprometimento/proteção. Retomar no chefe reinicia o confronto inteiro, sem repetir ondas nem acumular recursos; Refazer a fase inteira e Recomeçar campanha permanecem disponíveis. Não há persistência após fechar a página.
- Derrota identifica o tipo de dano, explica a ação útil e mostra os recursos que serão restaurados. Enter retoma o ponto salvo; repetição da tecla não pula o briefing. Ações de reinício ficam bloqueadas por 800 ms para evitar acionamento acidental. Na entrada/troca de estágio durante R, a nova salva considera também a travessia até uma rota livre e 400 ms de reação.

Validação: 21 novos casos em `tests/resources.cjs`; 150 verificações aprovadas no total. Incluem derrotas repetidas sem ganho de recursos, retorno após estágio final, alternativa de refazer ondas, campanha nova, restauração durante R no meio de um movimento, escape após R, reparos, duração/coleta de cápsulas, sinais por evento e prioridade visual. Sintaxe e integração dos novos arquivos também integram o GitHub Actions.

As quatro campanhas com colisões ativas concluíram os oito chefes em 554–583 s de ação, com 27–31 renovações, 9–12 comprometimentos e 5–7 impactos líquidos após reparos. Chefes 1–7: 13,4–42,9 s; final: 62,2–65,8 s. No cenário de 1.600 × 900 sem R, o controlador ainda vence, mas sofre 48 comprometimentos e cerca de 191 s de inversão; com R, 12 e cerca de 32 s. O final durou cerca de 103 s sem R e 66 s com R. O piloto consulta o estado interno e compensa inversões: esses dados comprovam viabilidade e custo da estratégia, sem estimar dificuldade humana. A comparação de estratégias, reações e erros pertence à fase 6.

Conferência no Chrome local em 1.920 × 1.080, 1.440 × 900, 390 × 844, 844 × 390 e 760 × 360: alerta contido no painel, R por teclado/toque, pausa dos relógios, suprimento anunciado, duas retomadas por cenário com estado idêntico ao salvo, Enter, pressão/síndrome, rotação pausada e ausência de estouro horizontal/erros de execução. Capturas inspecionadas no computador e celular, incluindo tela de derrota e a geometria horizontal curta. Painéis ficam acima dos núcleos e os avisos preservam a área da nave.

## Fase 6 — Balanceamento e validação final — concluída

- Escala de queda corrigida abaixo de 620 px, considerando os 140 px da base e encontrando a regra anterior sem salto. Velocidades das telas altas preservadas. As cinco geometrias verificadas oferecem ao menos 1,4 s do lançamento da rocha mais rápida ao contato, além do aviso de formação de 900 ms; visibilidade pode ser parcialmente coberta por painéis/casco.
- Rotação envolvendo telas baixas preserva tempo de aproximação, posição das frentes já passadas e contato/prazo de nuvens em permanência. Drones e sondas estáticos são reposicionados conforme a nova geometria. Pausa, QBER e movimento horizontal não avançam ao girar.
- Limpeza de encontros deixa de aguardar caudas de nuvens/pulsos completamente abaixo do alcance da nave. Continuam desenhadas entre encontros; perigos ainda ativos, frente B pendente, emissores e o último meteoro continuam bloqueando o avanço. Não se remove uma ameaça por alcançar a meta de carga.
- Piloto parametrizado para comparar prioridades de alvos, leitura atrasada, cadência de decisão, comando mantido, comandos perdidos e compensação de inversão. Não consulta a sonda verdadeira enquanto a varredura ainda mostra interrogação. A matriz completa é reproduzível por `tools/analyze-balance.cjs`, sem dependências externas.

Validação: **162 verificações aprovadas**, incluindo seis campanhas completas e dez casos novos em `tests/fairness.cjs`. Foram percorridas 3.072 rotas físicas de fuga, em sete/nove trilhas, todas as posições iniciais, padrões/pressão/estágios e leitura em 400/600 ms a 30/60 fps. São rotas defensivas: não garantem atirar e coletar simultaneamente. A integração contínua inclui as novas verificações.

A matriz de **46 cenários** teve 20 vitórias nas 20 combinações de tela/semente do piloto equilibrado, em 540–604 s de ação, com 27–33 usos de R e 1–7 impactos líquidos. Priorizar meteoros ou drones também produziu caminhos viáveis. Leitura atrasada 300 ms com decisão a cada 240 ms concluiu três de quatro cenários; atraso maior, comandos perdidos e inversões sem compensação provocaram derrotas. Imobilidade perdeu na fase 1. Não se interpreta esses números como taxa de sucesso humana.

Comparação pareada com compensação precisa: ignorar R ainda permite vencer, mas causa 48 comprometimentos e cerca de 192 s de inversão; usar R limita a 10 episódios e 22–27 s. O final levou aproximadamente 104 s sem R e 63–64 s com R. Não foi criada uma obrigação artificial de renovar. Referências iniciais de duração eram provisórias: o grupo equilibrado teve chefes comuns de 13,3–51,6 s e final de 58,9–86,7 s. Os encontros e estágios são preservados; não há corte de perigos por cronômetro.

No Chrome, duas campanhas completas após a abertura/treino chegaram à animação e tela de vitória em 1.440 × 900 e 390 × 844, vencendo todos os chefes e os três estágios finais: cerca de 553/548 s de ação, com 28 usos de R e 1/0 impactos líquidos, respectivamente. A pilotagem automatizada acionou os eventos de teclado da interface. A campanha móvel incluiu pausa e rotação durante o quinto chefe. Conferências adicionais em cinco resoluções validaram alertas, suprimentos e duas retomadas por cenário. Gestos de toque reais do navegador verificaram comando mantido, soltura/cancelamento, R e rotação com perigos em movimento nas duas orientações. Sem erros de execução ou estouro horizontal; capturas de interface e vitória inspecionadas.

As seis fases técnicas estão concluídas. A dificuldade sentida e a diversão dependem de partidas de pessoas; o diagnóstico local permite orientar ajustes posteriores sem envio ou persistência de dados. Consulte a metodologia, durações, comandos de reprodução e dados completos em [BALANCEAMENTO.md](BALANCEAMENTO.md) e [balanceamento-resultados.json](balanceamento-resultados.json).
