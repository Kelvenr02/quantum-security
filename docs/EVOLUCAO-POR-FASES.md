# Evolução por fases — atualização de 15/10/2026

Escopo: todas as recomendações da [análise do estado atual](ANALISE-ESTADO-ATUAL.md), base f3f0828. As quatro etapas amplas foram subdivididas em oito entregas menores. Cada entrega termina com validação e autorização do usuário antes da próxima.

| Fase | Escopo e critérios de conclusão | Estado |
| --- | --- | --- |
| 1 | Área útil, HUD compacto, avisos/nomes legíveis, sorteios separados, checkpoint do sorteio e regressões de navegador/regras | Concluída |
| 2 | Feedback contextual dos oito chefes; treino breve da oportunidade/custo de R; consulta aos três passos pela pausa | Concluída |
| 3 | Identidade da campanha separada da tentativa, marca assistida e renascimentos acumulados, indicação durante a ação e no resultado; salvamento local por fase/chefe, continuar após reabrir e acesso direto a Como jogar | Concluída |
| 4 | Instrumentar primeira movimentação/R/derrota, consulta, tentativas e auxílio; preparar observação de 5–8 iniciantes com teclado/toque; medir esperas, deslocamentos vazios e ciclos; ajustes localizados, variantes planejadas mantidas nas retomadas, objetivos opcionais e resumo curto de desempenho | Entrega técnica concluída; rodada humana preparada e pendente |
| 5 | Ciência incorporada às ações: H/CNOT, medição, comparação de amostras, leitura simples de síndrome, amplitudes ilustrativas; identidade Quantum Security nas operações; visuais curtos opcionais e limites das analogias | Concluída |
| 6 | Leitura ajustável, redução de flashes/tremor/partículas, remapeamento, indicação de inversão, foco e teclado nos diálogos/pausa/campo; formas/letras consistentes além das cores | Concluída |
| 7 | Identidade sonora de rastrear/fixar/salva/ruído e transições discretas de estágio; medir inicialização, memória, decodificação e quadros; otimizar conforme evidências mantendo execução offline | Concluída tecnicamente; validação em aparelhos físicos pendente |
| 8 | Consolidar estados e parâmetros compartilhados sem migração desnecessária; cenários reais de navegador no CI com rotação/estados/teclado; relatórios com versão/configuração/campanha/tentativa/auxílio/entrada; regressão integrada final | Concluída tecnicamente; primeira execução remota após push pendente |

## Entrega da fase 1

- Painéis compactos em paisagem baixa, inclusive abaixo de 600 px de largura; contador de fase visível e detalhes extensos acima dos controles de toque.
- Limites dos painéis medidos em mudanças de dimensão/cena, sem leituras de layout em cada quadro. Avisos de formação, frentes e alvos respeitam essa faixa. Núcleos menores nas telas baixas, igualmente no desenho e nas colisões. Nove trilhas, pilotagem, vida, velocidades e regras de canal preservadas.
- Títulos longos ajustados à largura; banner transitório cede espaço ao HUD nas telas muito baixas; limiar de fragmentação abaixo dos painéis.
- Nuvens, espionagem e interferência com sorteios independentes dos efeitos e das formações. Estado versionado acompanha checkpoints; versão aparece no diagnóstico/relatório. Checkpoints antigos usam um estado inicial previsível.
- 175 verificações Node aprovadas, incluindo seis campanhas completas; 616 estados reais de Chrome em 14 resoluções e rotação sem consumir sorteio. Testes com 0/30/60/120 chamadas adicionais ao desenho preservam as próximas sequências ambientais; não comprovam equivalência de toda a física em qualquer taxa de atualização.
- Regressão estacionária: 576 confrontos, zero vitórias, 560 derrotas e 16 sem conclusão no limite de 180 s.

## Entrega da fase 2

Os briefings mantêm três passos. Durante o combate, as mensagens agora consultam os mesmos alvos/janelas usados nas colisões, sem alterar vida, tempos de ataque, resistências ou recompensas.

| Chefe | Feedback entregue |
| --- | --- |
| Sentinela | Espera de abertura, relé bloqueado por QBER, relé concluído e próximo relé vivo com sua trilha |
| Observador | Mira seguindo e mira fixa; nenhuma trilha da sonda real revelada antes da leitura; ✓ fechado ou disponível |
| Tríade | Somente alvos vivos e abertos indicados para ataque; espera explícita se só restam alvos fechados; formação próxima/separada e mudança azul |
| Bell | Acertos realmente restantes na abertura; cota esgotada; próximo lado e trilha |
| Coerência | Barra e valor numérico; bloqueio abaixo de 50%; recuperar, sair para atacar e retornar; faixa de recuperação verde distinta do corredor azul marcado pela letra da salva |
| Síndrome | MÓDULO + no objetivo atual, alvo concluído e próxima leitura anunciada; distinção textual em relação à cápsula + |
| Interferômetro | Contagem prioritária somente da próxima salva; marcas futuras discretas; corredor identificado pela letra, sem prometer segurança contra todos os perigos |
| Nave-mãe | Estágio 1/3–3/3 sempre no cabeçalho; feedback Bell/QBER, H/coerência e módulo/salvas conforme o estágio; barra de coerência somente quando aplicável |

No treino, a primeira intercepção apresenta uma salva fixa de 1,8 s e QBER de 8%. O jogador pode sair das faixas e renovar numa trilha livre ou esperar a salva para usar o respiro. Renovar dentro da faixa prende a nave e permite que a salva interrompa a tentativa; o treino explica o erro e oferece nova tentativa imediatamente, sem derrota. R continua com 2 s e recarga de 10 s; a dispensa de recarga após erro existe somente nesse exercício. Sons de cancelamento e sucesso são distintos. O primeiro comando de teclado traz o simulador à vista em telas pequenas.

Pausar mostra o objetivo, os mesmos três passos do briefing, o estado atual e o custo de R. A consulta não reinicia o chefe, altera recursos ou avança relógios. Retomar volta o foco ao canvas. Em telas baixas, o conteúdo pode ser rolado integralmente.

Validação da fase 2:

- 191 verificações Node aprovadas, incluindo 12 regressões específicas dos avisos/pausa, três novas situações de treino e seis campanhas completas.
- 616 estados de layout novamente aprovados no Chrome em 14 resoluções.
- Três treinos completos no navegador, incluindo erro de R, repetição, desvio por teclado ou botões de toque, pausa durante a renovação e liberação da missão.
- 30 consultas reais pela pausa (oito chefes e dois estágios adicionais da nave-mãe em três resoluções), com três instruções, relógios congelados, rolagem acessível e retomada por Enter.

As seis campanhas simuladas das duas entregas concluíram em 553–638 s, com 25–34 usos de R e 4–7 impactos líquidos. Os pilotos consultam o estado interno e não substituem validação humana. A matriz histórica completa de 58 cenários não foi refeita; resultados anteriores não devem ser apresentados como medição da nova versão de sorteio.

Os testes de layout conferem composição e limites geométricos. Leitura ajustável, navegação completa por teclado e desempenho real em aparelhos modestos continuam nas fases 6 e 7. Os scripts reais de navegador estão versionados para execução local; sua integração ao CI permanece na fase 8. Nenhuma fase seguinte será iniciada sem autorização.

## Entrega da fase 3

- A identidade da campanha é separada de seus checkpoints e de cada tentativa. Repetir fase, repetir chefe, continuar do menu e reabrir preservam o identificador e incrementam a tentativa. Avançar de fase mantém a tentativa. Recomeçar uma campanha cria outra identidade e zera a marca de auxílio.
- O botão vermelho continua renascendo no combate exato. A marca de desenvolvedor e o total de renascimentos atravessam repetições e reaberturas, aparecem discretamente no cabeçalho e distinguem resultados assistidos. No diagnóstico, campaign contém id, attempt, developerAssisted e developerRevives; counts.developerRevives continua contando usos naquela tentativa.
- O início de cada fase e de cada chefe é salvo automaticamente no navegador, incluindo recursos, canal, durações restantes, pilotagem e estado do sorteio. O checkpoint anterior das ondas acompanha o do chefe para permitir refazer a fase inteira. Continuar mostra o briefing e reinicia o trecho; não restaura inimigos em voo, vida parcial do chefe ou seu estágio intermediário. Retomadas não acumulam escudo, H, pontos ou reparos.
- O menu mostra CONTINUAR CAMPANHA e informa fase, trecho e auxílio usado. NOVA MISSÃO inicia a preparação; o ponto anterior só é substituído quando a nova campanha começa. Na pausa, VOLTAR AO MENU deixa explícito o retorno ao ponto de entrada. Vencer remove o ponto salvo.
- Como jogar abre uma consulta curta e independente da história. Consultar não inicia treinamento, altera campanha ou substitui o progresso salvo. Esc fecha a consulta.
- O formato local é versionado, tem limite de tamanho e valida números, posições, durações, sorteio e identidade antes de restaurar. Dados incompatíveis/corrompidos não são carregados. Se o armazenamento estiver bloqueado ou cheio, o jogo mantém os checkpoints na aba e informa que não sobreviverão ao fechamento. O jogo não envia dados de campanha; o histórico detalhado de métricas continua somente em memória.

Validação: 207 verificações Node, incluindo 16 novas verificações de continuidade; seis campanhas de regressão e uma campanha adicional verificando os salvamentos de todos os chefes e das transições de fase. No Chrome, três fluxos completos em 1600×900, 390×700 e 568×320 testaram ajuda, reabertura, retorno ao menu, marca assistida, recursos, repetição das ondas e remoção do ponto na vitória; também foram testados armazenamento bloqueado e dados corrompidos. Os 616 estados de layout e os três treinos/30 consultas de pausa da fase 2 foram reexecutados.

Limites: há um único ponto local por navegador/perfil e endereço do jogo. O salvamento é de entrada do trecho, não do instante em que a aba foi fechada. A contagem de tentativas acompanha a jornada; as métricas detalhadas de uma tentativa anterior não são reconstruídas ao reabrir. Avaliação com iniciantes e comparações de dificuldade pertencem à fase 4. Esta entrega preserva o balanceamento da campanha.

## Entrega técnica da fase 4

- Diagnóstico versão 3: primeiros marcos de deslocamento real, R aceito (QBER, entrada e respiro), derrota/causa e consulta manual da pausa. Leituras obrigatórias de briefing são contadas separadamente. Perder foco não é contado como consulta deliberada. Comandos distinguem teclado, toque, botão e simulação; a origem do comando não prova que há uma pessoa.
- Tempo sem decisão disponível, deslocamento nessa condição e espera de abertura são registrados por fase/ondas/chefe, junto aos ciclos e danos por abertura existentes. Recuperação de coerência conta como decisão; vitória não é contada como espera de abertura. Esses indicadores incluem descansos planejados e não demonstram, sozinhos, um problema de ritmo.
- Respiros entre encontros passaram de 1,8 para 3 s. O aviso de oportunidade de R exige os 2 s completos mais 400 ms de margem. Velocidades, vida, resistência, nove trilhas, alertas e regras dos chefes foram preservados.
- Fases 3–8 têm duas ordens planejadas para combinação/pressão final. A apresentação da mecânica e o conjunto de ameaças/HP de cada encontro são iguais. Primeiras duas fases mantêm seu roteiro. Roteiro versão 2 e variante são guardados no checkpoint; pontos antigos sem essa informação usam a ordem original.
- Cada fase tem um objetivo opcional de medalha: Terra sem impactos, desviar das sondas, aproveitar tiros laterais de H, acertar Bell, impedir fragmentações, destruir emissores, renovar no respiro ou evitar inversões. O objetivo pode ser consultado no briefing e na pausa. Medalhas não dão pontos, carga, escudo ou reparos, nem impedem avançar.
- Ao vencer o chefe, o próximo briefing oferece um resumo recolhido de desempenho, reparos, medalha e conceito aplicado; não há outra pausa obrigatória. A vitória final mostra o resumo e total de medalhas. Objetivos voltam ao estado de entrada na retomada e medalhas anteriores acompanham o salvamento.
- Export local de rodada: quantumDiagnostics.playtest(), com tentativa atual e até 20 anteriores. O consolidador tools/summarize-playtest.cjs separa IDs/tentativas, preserva o export mais recente duplicado e distingue simulações/auxílio/entrada desconhecida. Histórico detalhado não é enviado ou gravado automaticamente.

Validação: 219 verificações Node aprovadas; 616 estados de layout em 14 resoluções; três treinos/30 consultas de pausa; três fluxos completos de continuidade; três fluxos de objetivos, medalhas, resumo e reabertura no Chrome. A matriz de 58 cenários foi refeita: 20/20 vitórias do piloto equilibrado em 558–645 s, com 25–35 usos de R e 1–7 impactos líquidos. Ignorar completamente o canal e renovar imediatamente no alerta perderam os quatro casos de cada política; os controladores lentos ainda apresentam derrotas. [Resultados reproduzíveis](FASE4-RESULTADOS.json).

**Pendente humano:** o [roteiro para 5–8 iniciantes](TESTE-COM-INICIANTES.md) está preparado. Não foram realizadas partidas humanas pelo agente. A calibração perceptiva, a compreensão dos chefes e a diversão não estão validadas; ajustes adicionais dependentes dessas observações devem permanecer em aberto na revisão final. Nenhum resultado de bot foi usado como se fosse uma pessoa.

## Entrega da fase 5

- Seis experimentos clássicos e opcionais no briefing e na pausa: amostra/QBER, H/medição, Bell/H+CNOT, desfasamento, síndrome e interferência. O conceito da fase/estágio é sugerido; os demais podem ser consultados. O laboratório começa recolhido, sem ação ou resposta obrigatória.
- Barras de probabilidades e circuitos de referência acompanham interações curtas. Medições repetidas mantêm o resultado até outra operação/preparação. A amostra pública não revela chave real nem valida segurança; renovar não remove o ruído. O exemplo de síndrome limita-se a uma inversão X. Os limites das metáforas permanecem junto ao experimento.
- Chefe 6 e terceiro estágio final mostram leitura → M1/M2/M3 e mantêm + no alvo. A leitura é didática, sem alterar seleção, janelas, danos ou ataques; nenhuma memorização é exigida.
- Quantum Security aparece no painel do canal e nas pistas de solicitação/renovação. O fluxo separa equipamentos QKD, gestão de chaves, cifragem/autenticação e rádio clássico, conforme o pitch local conferido.
- Pistas científicas discretas usam o espaço de feedback existente e cedem imediatamente a ameaças/alertas. Repetição limitada por tipo/fase e intervalo de 20 s; podem ser desligadas, com preferência local independente do checkpoint. Nenhum novo áudio ou pausa foi imposto.
- Enter e seleção por teclado no laboratório não encerram o briefing; o foco retorna ao controle usado após atualizar a demonstração. Todos os controles de combate permanecem disponíveis ao continuar.

Validação: 232 verificações Node, incluindo 13 casos científicos/matemáticos e de isolamento. Seis campanhas de regressão mantiveram exatamente resultados de duração, impactos e R da fase 4. No Chrome, os seis experimentos foram exercitados em três resoluções, incluindo teclado, pausa, persistência da preferência e leitura do chefe. Também foram reexecutados os 616 estados de layout, treino/consulta, continuidade e medalhas. As 58 simulações da fase 4 não foram integralmente refeitas; as regras de combate não mudaram.

[Conceitos, limites e fontes](CIENCIA-NO-JOGO.md). A avaliação humana de aprendizagem/dificuldade da fase 4 continua pendente. A fase 6 só começa após autorização.

## Entrega da fase 6

- Acessibilidade no menu e no treinamento; Leitura e controles na pausa. Leitura ampliada aumenta instruções, conversas e informações táticas. Em paisagem muito baixa o painel usa uma ampliação menor para preservar alvos, avisos e nave; as instruções completas continuam ampliadas na pausa e no briefing. Os painéis continuam medidos pelo limite real da arena.
- Efeitos seguem a preferência de movimento do sistema por padrão, com escolha explícita entre reduzidos e completos. O modo reduzido retira partículas de destruição, oscilação decorativa, piscadas da nave, clarão e tremor do final; preserva deslocamento, ameaças, faixas, contagens e demais sinais necessários ao combate. A nave protegida continua visível e mantém sua transparência de proteção.
- Três teclas configuráveis: esquerda, direita e renovação. Letras (exceto M, reservado para som) e números, sem duplicação. As setas permanecem como alternativa; Esc pausa e Enter ativa controles. Treino e campanha usam a mesma resolução de teclas. Instruções, diálogo de pilotagem, painel e botão de renovação acompanham a escolha. Inversão mostra também o sentido efetivo de cada comando, com texto e setas.
- Configurações locais em qubit-accessibility-v1, separadas do salvamento de campanha e validadas antes do uso. Falha de armazenamento mantém a opção na aba e informa que não foi salva. Não há coleta nem envio das preferências.
- Canvas focável com contorno visível; Tab/Shift+Tab ficam dentro das janelas abertas, incluindo briefing, pausa, ajuda, configurações e resultado. Botões e seletores preservam o comportamento nativo de teclado. Abrir configurações congela o combate; ao fechar, ele permanece pausado até Retomar. O treino retoma apenas se não estava previamente pausado. Esc repetido não alterna a pausa continuamente.
- Os avisos conservam letras A/B/C, faixas delimitadas, leitura numérica de coerência/síndrome, H, + e símbolos de escudo; cor continua sendo um reforço. Esta fase não constitui certificação de acessibilidade nem oferece uma alternativa não visual para o combate em canvas.

Validação: 238 verificações Node aprovadas, incluindo seis casos de preferências, isolamento e remapeamento. As seis campanhas e a comparação sem R produziram resultados idênticos aos da fase 5. Foram testados 616 estados de layout padrão e outros 616 com leitura ampliada/efeitos reduzidos, em 14 resoluções. No Chrome, três fluxos específicos cobrem configuração, persistência, teclado, foco, duplicação de teclas, inversão e treino; foram reexecutados os três treinos/30 consultas, continuidade, medalhas e seis experimentos em três resoluções. O teste de pausa usa relógio explicitamente parado para impedir que o próprio teste avance alguns milissegundos entre Retomar e sua leitura de estado.

Limites: teclas por posição física (KeyboardEvent.code), sem combinações com Ctrl/Alt/Meta. A redução de movimento preserva animações necessárias para prever ataques. A campanha estacionária de 576 confrontos e a matriz de 58 estratégias não foram refeitas nesta fase; as regras de combate não foram rebalanceadas. A avaliação com iniciantes da fase 4 permanece pendente. A fase 7 aguarda autorização.

## Entrega da fase 7

- Sons próprios para rastrear, fixar, anunciar/disparar salva física e anunciar/liberar ruído. Eventos dos modelos e da sonda comandam os sons no mesmo relógio do ataque; emissão única, sem depender da quantidade de desenhos. O ruído soa também quando o jogador desvia. Eventos de contato continuam distintos.
- Nave-mãe usa confirmação discreta por mudança real de estágio, com aumento relativo de 6%/12% da mixagem musical e sem reiniciar a faixa. Renascimento restaura o estágio sonoro sem anunciar outra mudança. Os volumes escolhidos, mute, pausa e inatividade continuam sendo respeitados.
- Limite de 18 efeitos com prioridade: tiros/movimentos/UI cedem; sinais de fixação, salvas, escudo, comprometimento e impactos importantes são preservados. Nenhum novo asset externo: sinais sintetizados localmente, bundle e licenças mantidos.
- Conversão de base64 sem callback por byte; fades antigos limitados, com retirada imediata se o relógio de áudio estiver suspenso. Briefing prepara o combate correto (fase ou chefe); não há mais decodificação antecipada de uma fase distante durante a ação.
- Instrumentação local de conversão/decodificação e buffers PCM. Roteiro de medição real do Chrome mede abertura, tarefas longas, intervalos RAF, heap e áudio, incluindo CPU limitada. O teste pausado deixou de reter nove fontes/201 MiB e passou a uma fonte/47 MiB na última música. São buffers PCM, não RAM total. As medições e seus limites estão em [DESEMPENHO.md](DESEMPENHO.md) e [FASE7-MEDICOES.json](FASE7-MEDICOES.json).

Validação: 248 verificações Node aprovadas, incluindo quatro novas verificações de cache/mixagem/prioridade e seis de sincronização dos eventos. As seis campanhas e a comparação sem R produziram resultados idênticos aos da fase 6. No Chrome, três fluxos verificaram relógio de fixação/disparo, pausa, estágios, ausência de downloads e renderização Web Audio dos sete sinais, com sinal não silencioso e amplitude limitada. Foram reexecutados os 616 estados de layout padrão, os três fluxos de acessibilidade, os três treinos/30 consultas e a continuidade com reabertura. Não foi necessário refazer a matriz estacionária de 576 confrontos nem as 58 estratégias: não houve rebalanceamento.

Limites: medições em Chrome headless no computador disponível, com cache de sistema possivelmente aquecido; CPU 4× não emula RAM/GPU/alto-falantes de celular. Permanece pendente medir em aparelhos modestos físicos e avaliar a mixagem por escuta humana; renderização automatizada não demonstra conforto ou distinguibilidade percebida. A rodada com iniciantes da fase 4 também permanece pendente. A fase 8 só será iniciada após autorização.

## Entrega da fase 8

- Configuração central dos valores compartilhados por combate, treino, canal, métricas e validação dos salvamentos. Estado atual com nomes explícitos, consultado pela atualização e pelos comandos; sem migração de motor ou mudança deliberada do balanceamento.
- Aplicação 0.8.0/regras 1; diagnósticos e consolidação preservam versão/configuração/arena, campanha, tentativa, marca de auxílio e entradas. Preferências iniciais e atuais são separadas, assim como viewport inicial e atual; mudanças geram eventos. Métricas seguem esquema 3 com campos adicionais, e checkpoints versão 1 continuam compatíveis. Exports antigos não recebem uma versão inventada.
- Dependência Playwright fixada em package-lock, somente para desenvolvimento. Runners comuns para Node e navegador, relógio determinístico nos testes de interface, capturas/traces em falhas e resultados separados para leitura padrão/ampliada.
- GitHub Actions com jobs de regras/estratégias e Chromium, instalação por lockfile e artefatos por 14 dias. YAML conferido; npm ci e Chromium fornecido pelo pacote foram usados localmente. A instalação no caminho longo do Drive falhou; a mesma instalação foi validada em uma pasta local curta. O jogo não passou a depender dessa instalação.
- 253 verificações Node, 576 confrontos estacionários sem vitória e nove suítes Chromium aprovadas. As seis campanhas de regressão e a comparação sem R mantiveram os resultados da fase 7. O fluxo de integração entre oito fases foi verificado em três telas, incluindo recursos, R, configurações, pausa, renascimento, estágios finais, rotação, relatório assistido e remoção do ponto salvo na vitória.
- A matriz ampliada de 58 cenários foi reexecutada: todos os campos históricos e resumos coincidiram com a fase 4; 20/20 conclusões do piloto equilibrado, 0/4 ignorando o canal e 0/4 renovando imediatamente no alerta. Os pilotos seguem sendo simulações com consulta ao estado interno. [Resultados finais](FASE8-RESULTADOS.json).

A [revisão final](REVISAO-FINAL.md) distingue cobertura técnica de validação humana e o que foi executado localmente do que ainda precisa executar no GitHub. A rodada com iniciantes (fase 4), as medições/escuta em aparelhos físicos (fase 7) e a primeira execução remota deste workflow permanecem pendentes. Não existe uma nona fase técnica planejada nesta sequência.
