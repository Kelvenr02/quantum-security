# Análise do estado atual — 14/10/2026

Base: `f3f0828`, branch `main`. Revisão posterior às correções da auditoria, ao ajuste leve de dificuldade, aos briefings em três passos e ao botão de renascimento de desenvolvedor. Esta etapa altera somente este relatório; as regras do jogo permanecem iguais.

> Registro histórico da análise inicial. Visibilidade, sorteio e feedback/treino foram tratados nas [fases 1 e 2](EVOLUCAO-POR-FASES.md); continuidade e identificação assistida foram tratadas na fase 3. Os demais itens continuam no roteiro.

## Diagnóstico

A campanha tem uma base funcional e identidades mecânicas suficientes. O próximo ganho deve vir de legibilidade, aprendizagem, continuidade e previsibilidade. Há problemas confirmados de composição visual em telas pequenas e de continuidade dos diagnósticos. Novos inimigos ou modificadores de dificuldade devem entrar depois dessas correções e de testes com iniciantes.

As antigas brechas da Tríade e da coerência não devem ser tratadas como pendências atuais: corredores distintos impedem a vitória parada conhecida; os chefes de coerência já exigem sair da zona para atacar. R, nove trilhas, três encontros, recursos persistentes e retomadas também estão integrados.

## Evidências desta revisão

- Reexecutei as 11 suítes de regras/integração: **170 verificações aprovadas**, incluindo seis campanhas completas.
- Reexecutei **576 confrontos estacionários**: zero vitórias, 560 derrotas e 16 confrontos sem conclusão no limite de 180 s. O resultado elimina a brecha examinada; não significa que toda trilha parada recebe dano.
- Conferi no Chrome seis resoluções: 1.600 × 900, 390 × 700, 320 × 568, 844 × 390, 760 × 360 e 568 × 320. As capturas são automatizadas; não são partidas humanas.
- Analisei os [58 cenários registrados na correção anterior](auditoria-correcao-resultados.json). Essa matriz inteira não foi reexecutada nesta etapa. O grupo equilibrado registrado teve 20/20 conclusões, 539–624 s de ação, 27–34 usos de R e 2–8 impactos líquidos; esses dados não medem desempenho humano.
- Executei reproduções específicas para aleatoriedade visual, marca de partida assistida e avisos diante de alvos destruídos.

## Ordem de prioridade

| Ordem | Área | Natureza | Resultado esperado |
| --- | --- | --- | --- |
| 1 | Área útil e interface em telas baixas | Defeito confirmado | Nave, avisos e ameaças visíveis antes de exigir uma reação |
| 2 | Feedback dos chefes e aprendizagem de R | Inconsistência confirmada e melhoria de usabilidade | Saber o que fazer agora e reconhecer o momento de regenerar |
| 3 | Aleatoriedade independente do desenho | Defeito confirmado de reprodução | Efeitos visuais e frequência de desenho não alteram perigos futuros |
| 4 | Continuidade, retomadas e modo desenvolvedor | Defeito confirmado na marca assistida; recursos novos | Preservar contexto e progresso entre tentativas e sessões |
| 5 | Calibração com jogadores iniciantes | Lacuna de validação | Distinguir dificuldade mecânica de falta de compreensão |
| 6 | Ritmo, variedade e recompensa | Oportunidade de design | Decisões diferentes e progresso perceptível durante a campanha |
| 7 | Ciência incorporada à ação e narrativa | Oportunidade didática | Associar ações aos conceitos, além de reconhecer símbolos |
| 8 | Acessibilidade e controles | Melhorias de acesso | Leitura, comandos e efeitos ajustáveis |
| 9 | Áudio e desempenho | Polimento com medição | Alertas reconhecíveis e estabilidade em aparelhos modestos |
| 10 | Organização técnica e testes visuais | Sustentação das demais mudanças | Menor risco de regressões entre sistemas |

## 1. Liberar e validar a área efetivamente visível

**Urgência máxima.** Em 568 × 320, a nave está em `y=180`, enquanto o painel da fase ocupa aproximadamente `y=143–204`, cobrindo sua região. Os avisos de formação aparecem por volta de `y=105`, dentro da altura dos painéis laterais. Os ajustes de paisagem dependem também de largura mínima de 600 px, deixando essa combinação com um arranjo inadequado.

Em 760 × 360 e 844 × 390, a nave fica livre, mas os painéis laterais ainda encobrem boa parte da aproximação. Na trilha direita, para a rocha rápida da fase 8, estimei cerca de **0,22 s** e **0,26 s**, respectivamente, entre o meteoro inteiro sair de baixo do painel e o primeiro contato possível com a nave. Em 390 × 700, essa mesma estimativa foi de aproximadamente **0,98 s**. São cálculos geométricos, não tempos medidos de reação humana: existe aviso antecipado e parte da rocha pode aparecer antes de ficar inteira visível.

Alterações recomendadas:

- Definir uma área de combate protegida de sobreposição, calculada pela largura e altura disponíveis.
- Compactar os indicadores em telas baixas; priorizar QBER/R, escudo e próxima ameaça. Pontos e outros dados podem ocupar menos espaço durante a ação.
- Posicionar os avisos a partir dos limites reais dos painéis, em vez de coordenadas independentes no CSS e no canvas.
- Ajustar títulos de fase e marcadores nas bordas; alguns textos longos ainda são cortados no celular.
- Preservar nove trilhas e trajetos físicos. Aumentar a largura visual sem liberar a visibilidade não resolve esse problema.

Validação: retrato/paisagem, 568 × 320, 320 × 568, outras larguras próximas dos pontos de mudança de layout, QBER alto, H, mensagens simultâneas e todos os chefes. Nenhum indicador deve cobrir nave, alvo ou aviso indispensável.

Fontes: [regras responsivas](../styles.css#L321), [geometria](../script.js#L74), [avisos de formação](../encounters.js#L160).

## 2. Mostrar a decisão atual durante o combate

Os briefings melhoraram e podem ser preservados. A próxima camada deve estar na arena: alvo correto, motivo de proteção, próxima oportunidade e custo de R.

Reprodução confirmada: na Tríade, com o núcleo central destruído e os laterais vivos, aos 5 s do ciclo nenhum alvo está aberto, mas o painel continua dizendo “Mire nos H ATIVOS: pontas primeiro, meio depois”. É uma espera prevista pelas regras; falta explicá-la naquele estado.

Também há um salto de aprendizagem: o treino ensina R depois de destruir o único asteroide, com o campo livre. Na campanha, o jogador precisa decidir enquanto existem ameaças. Nos registros, a política que renova imediatamente no alerta perdeu os quatro casos. Isso sugere investigar como o jogo ensina o momento da renovação; não prova que todo iniciante teria esse resultado.

| Chefe | Melhoria específica |
| --- | --- |
| 1 — Sentinela | Distinguir relé protegido por QBER, espera de abertura e relé já destruído; indicar o relé vivo seguinte. |
| 2 — Observador | Tornar muito legível a passagem de rastreamento para mira fixa; manter a identidade oculta antes da revelação. |
| 3 — Tríade | Explicar quando só restam núcleos fechados; tornar visíveis os alvos vivos e a mudança próximo/separado. |
| 4 — Bell | Exibir quantos acertos restam na abertura e anunciar a troca de lado. |
| 5 — Coerência | Acrescentar barra de coerência e diferenciar visualmente “recuperar” de “corredor seguro contra a próxima salva”. |
| 6 — Síndrome | Separar visualmente módulo +, cápsula + e módulo já concluído; indicar a próxima leitura. |
| 7 — Interferômetro | Reduzir competição entre linhas de A/B/C; a próxima salva deve ter leitura imediata. |
| 8 — Nave-mãe | Manter estágio 1/3, 2/3 ou 3/3 e objetivo atual sempre visíveis; destacar a troca sem apagar canal ou recursos. |

Melhorar R com uma demonstração jogável breve de escolha de oportunidade, lembrete do custo de ficar imóvel e consulta aos três passos do chefe pela pausa. As mensagens devem responder a estados concretos; acrescentar parágrafos aos briefings teria menor utilidade.

## 3. Separar o sorteio do combate e dos efeitos

**Problema confirmado.** As formações têm sorteio próprio, mas nuvens, pulsos e frentes ainda usam `Math.random()`, assim como efeitos visuais do canal e partículas. Portanto, nem toda a campanha é reproduzível a partir da semente de formações.

Reprodução isolada, com mesma semente, mesmo estado e sem mover a nave:

| Chamadas extras ao desenho do canal | Trilhas das próximas nuvens |
| ---: | --- |
| 0 | 5 e 9 |
| 1 | 3 e 6 |
| 10 | 4 e 7 |

A frequência de desenho pode consumir números que depois seriam usados para criar perigos. Isso também limita o rigor de algumas comparações de estratégias: mesma semente não garante ambiente inteiro idêntico.

Recomendação: sorteios separados para formações, ambiente e efeitos; guardar o estado necessário no checkpoint; registrar versão/semente nos relatórios. Testar a mesma sequência de comandos a 30/60/120 fps e com mais/menos efeitos, comparando a sequência de perigos.

Fonte: [desenho do canal](../script.js#L538), [perigos ambientais](../script.js#L407), [frentes](../quantum.js#L205).

## 4. Melhorar continuidade e preservar a identificação assistida

O botão vermelho atende ao objetivo de permitir testes e deve continuar disponível. Há, porém, uma perda confirmada de identificação: renascer, avançar para a fase seguinte, morrer e repetir a fase cria outro diagnóstico sem `developerAssisted`, embora a jornada já tenha usado o auxílio. O campo não é transportado pelo checkpoint. A tela final também não distingue essa situação.

Recomendação: identificação da campanha independente da tentativa, marca assistida persistente até recomeçar a campanha e contagem acumulada de renascimentos; indicação discreta durante a partida e no resultado. Preservar os recursos das retomadas normais e o botão pedido pelo usuário.

Outras melhorias: salvar localmente no início de fase/chefe, oferecer “Continuar campanha” após reabrir e incluir “Como jogar” na pausa. Hoje, as retomadas ficam só em memória, e “Como jogar” no menu inicia a mesma sequência da história. A preparação de quatro cenas é uma base adequada; quem retorna precisa de acesso mais direto à consulta e à continuação.

Fontes: [renascimento](../resources.js#L59), [checkpoint](../resources.js#L8), [novo diagnóstico](../script.js#L183), [Como jogar](../presentation.js#L3).

## 5. Calibrar com iniciantes e localizar as dificuldades

Vitórias de pilotos precisos demonstram viabilidade, não compreensão ou diversão. Um exemplo atual de 1.600 × 900, semente 519, concluiu em 596 s, com 34 renovações, 68 s regenerando e 10 comprometimentos, somando aproximadamente 27 s de comandos invertidos. A gestão do canal está presente; a pergunta agora é se a frequência e as explicações produzem decisões compreensíveis para uma pessoa.

Executar uma rodada diagnóstica com cinco a oito pessoas, incluindo iniciantes, teclado e toque, sem explicações externas durante a primeira tentativa. Observar primeira movimentação, interpretação dos símbolos, primeiro R, motivo percebido da primeira derrota, consulta ao briefing, tentativas por chefe e uso do renascimento. É um grupo para encontrar problemas, não para estimar uma taxa estatística de sucesso.

Ajustes seguintes devem ser localizados: visibilidade, tempo de leitura, combinação de perigos, primeira aparição de uma regra ou retomada assistida oferecida de forma explícita. Separar resultados normais, assistidos e do desenvolvedor.

## 6. Melhorar ritmo, variedade e recompensa

Os registros têm ondas de 27,1–59 s e campanha equilibrada de 539–624 s de ação. Leitura, treino, pausas e tentativas adicionais ficam fora desse tempo. Medir esperas sem decisão, deslocamentos vazios e repetição de ciclos antes de alterar a duração total.

As sementes variam principalmente espelhamento e posições; os tipos e principais eventos dos encontros seguem um roteiro. Acrescentar poucas variantes planejadas por fase pode gerar decisões diferentes: interceptar cedo um fragmentável, escolher entre emissor e meteoro urgente ou aproveitar um alinhamento de pares. Manter a mesma variante nas retomadas favorece a aprendizagem.

Recompensas opcionais de desempenho podem valorizar uso de H, antecipação de fragmentação e proteção do canal. Um resumo curto após o chefe pode mostrar domínio e um conceito aplicado. Carga continua representando resolução do roteiro; pontos continuam representando desempenho.

## 7. Fortalecer a ciência dentro das ações

A história distingue QKD, gestão de chaves pelo Quantum Security e comunicação clássica. As limitações das analogias também estão explícitas. A melhoria está em ligar mais a ação ao conceito, com visuais curtos e opcionais: circuito H/CNOT, medição de um resultado, comparação de amostras e diagnóstico por síndrome.

O chefe 6 hoje identifica diretamente o módulo com +. Uma variação posterior pode associar uma leitura simples de síndrome a um módulo, com legenda, preservando a fluidez do combate. Trata-se de expansão didática, não de um defeito que impeça jogar.

O Interferômetro pode associar suas rotas a uma representação de amplitudes que se reforçam/cancelam, explicitamente ilustrativa. A apresentação desses conceitos pode se apoiar nas explicações de [fundamentos da IBM](https://quantum.cloud.ibm.com/learning/en/courses/quantum-business-foundations/quantum-computing-fundamentals) e [correção de erros](https://quantum.cloud.ibm.com/learning/en/courses/foundations-of-quantum-error-correction/correcting-quantum-errors/introduction).

O Quantum Security pode permanecer identificado no painel do canal e nas operações de validação/renovação. Interações de uma linha e resultados visuais têm mais utilidade aqui do que repetir longos diálogos.

## 8. Ampliar acessibilidade e consulta de controles

- Aumentar a leitura das informações críticas, hoje frequentemente entre 8 e 11 px nos painéis.
- Oferecer redução de flashes, tremor e partículas durante a campanha. A preferência de movimento reduzido atualmente aparece na ilustração do menu.
- Permitir remapear controles e revisar a indicação visual durante inversões.
- Consolidar foco e navegação por teclado dos diálogos, pausa e área jogável.
- Manter distinções por forma/letra e não depender da cor: recuperação, vulnerabilidade, suprimento e corredor seguro precisam de significados consistentes.

## 9. Refinar áudio e medir desempenho

O áudio já tem volume baixo, controles separados, pausa, fontes identificadas e música por fase. O refinamento mais útil é o reconhecimento de ameaças: distinguir melhor rastreamento, fixação, salvas e ruído, mantendo os sinais visuais completos. Chefes 1–6 compartilham uma faixa de confronto, 7–8 outra; mudanças de estágio podem ganhar variações discretas se ajudarem a leitura.

O bundle offline de áudio tem aproximadamente 10,9 MB. Isso não comprova um problema de desempenho: medir início, memória, decodificação e quadros em aparelhos modestos antes de otimizar. Preservar a execução local; uma distribuição web pode usar carregamento separado, se necessário.

## 10. Sustentar as mudanças com organização e testes reais de interface

Os modelos puros de chefe, encontros e pilotagem já são boas separações. Evoluir gradualmente para estados explícitos de campanha e parâmetros compartilhados entre regra, instrução e painel reduz a quantidade de rotinas que cada mudança precisa tocar. Evitar uma migração de tecnologia sem necessidade demonstrada.

Os testes Node usam uma interface simulada. Eles não enxergam que o painel cobriu a nave em 568 × 320. As conferências de navegador desta sessão foram temporárias; a automação de integração contínua deve ganhar cenários visuais reproduzíveis, incluindo resoluções pequenas, rotação, estados simultâneos e navegação por teclado.

Os relatórios devem identificar versão, configuração, campanha, tentativa, auxílio usado e entrada por teclado/toque. Agregar tentativas sem perder o contexto da campanha torna os dados de dificuldade mais úteis.

## Sequência sugerida

1. Corrigir área útil, visibilidade dos avisos e sorteio independente do desenho; acrescentar regressões.
2. Melhorar feedback durante chefes, ensino de R, identificação assistida e consulta pela pausa.
3. Implementar continuidade local e realizar testes com iniciantes; ajustar combinações e ritmo com os resultados.
4. Acrescentar variantes de encontros e visuais científicos; finalizar acessibilidade, áudio e desempenho conforme medições.

As correções confirmadas podem ser feitas primeiro. Aumentar conteúdo antes de resolver visibilidade e entendimento ampliaria a quantidade de elementos que o jogador precisa interpretar, sem resolver as causas identificadas.
