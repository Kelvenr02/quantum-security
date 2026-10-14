# Dificuldade e guardiões quânticos

Após a ampliação para nove trilhas, as [seis fases da revisão](IMPLEMENTACAO.md) estão implementadas: arena/pilotagem/métricas, canal/renovação, encontros/ameaças, reformulação dos oito chefes, recursos/leitura/retomada e balanceamento final. Veja os [resultados e limites da validação](BALANCEAMENTO.md).

## Objetivo da revisão

Elevar a pressão e a variedade preservando tempo para observar, escolher e reagir. Antes, atingir uma meta de pontos encerrava a fase. Agora, cada setor exige resolver três encontros antes do confronto ligado ao seu conceito. Só sua vitória libera a progressão; carregar o canhão não pula o confronto final.

## Curva das ondas

Cada fase tem encontros de apresentação, combinação e pressão, com 13–16 formações no total. O roteiro oferece variantes espelhadas/alternadas por semente própria; efeitos visuais não mudam as formações. Avisos duram 900 ms; respiros após limpar o encontro duram 1,8 s. Nuvens, pulsos e frentes param de ser lançados no escoamento final, mas os existentes continuam até resolverem. Caudas de nuvens/pulsos completamente abaixo do alcance da nave não bloqueiam a limpeza. Uma frente B pendente ou o último meteoro ainda bloqueiam o avanço.

A velocidade base cresce de 3,35 para 5,05 unidades por quadro, ajustada à altura. Abaixo de 620 px, a escala considera o espaço acima dos 140 px da base; girar a tela preserva o tempo de aproximação. Intervalos de referência vão de 1.300 a 800 ms, ampliados pelos acertos e pelo percurso das formações. Há até seis rochas e um orçamento de quatro acertos pendentes nas fases 1–2/seis nas demais; a divisão pode elevar a quantidade em uma, suspendendo novos lançamentos até seus fragmentos serem resolvidos.

| Novidade | Introdução | Resposta do jogador |
| --- | --- | --- |
| Rocha rápida | Fase 2 | Antecipar a queda 22% mais veloz; não acumula blindagem ou ligação |
| Sonda | Fase 2 | Acompanha por 1,1 s, fixa a mira, avisa por 900 ms e dispara +5 pp de QBER; desviar após fixar |
| Drone emissor | Fase 3 | Destruir com 2–3 tiros para interromper +0,65–0,85 pp/s; recua após 6,5 s se ignorado |
| Par/Blindagem | Fase 4 | Um membro elimina o par; blindado exige dois tiros |
| Meteoro fragmentável | Fase 5 | Um tiro cedo evita dois fragmentos, que continuam perigosos |
| Nuvens móveis/persistentes | Fase 5 | Oscilam, coexistem até quatro e permanecem 1,2 s na passagem |
| Formação tripla | Fase 6 | Usar H, ordem de interceptação e deslocamento entre trilhas |
| Frentes A/B | Fases 7–8, terceiro encontro | Trocar entre corredores de três trilhas; passagens separadas por 1,2 s |

Pontos premiam destruições; carga acompanha a resolução do roteiro, incluindo fugas/impactos sem pontos. O chefe exige os três encontros e a arena livre de ameaças. Os limites de escudo e impactos permanecem ativos até o último perigo. Ver [valores, margens e validações da fase 3](IMPLEMENTACAO.md).

A recuperação passiva continua em 0,18 pp/s nas fases 1–4 e 0,08 nas fases 5–8. Fontes de ruído, espionagem e chefes continuam ativas. As novas ameaças são mecanismos fictícios para criar decisões, sem representar armas quânticas reais.

## Confrontos

| Fase | Guardião | Decisão principal | Relação didática |
| --- | --- | --- | --- |
| 1 | Sentinela da Chave | Validar um relé por ciclo, com QBER <8%; B aparece após o primeiro relé | Verificação e descarte de chaves inseguras |
| 2 | Observador Fantasma | Rastreio fixa a mira; escolher ✓ entre três sondas; outra varredura durante a pressão | Medição e perturbação |
| 3 | Tríade Hadamard | Laterais e centro abrem em momentos distintos; H explora 500 ms de sobreposição; formação muda durante a pressão | Superposição como recurso de jogo |
| 4 | Gêmeos de Bell | Trocar de lado no mesmo ciclo, com até três acertos por janela (dois na pressão) | Estado conjunto e correlações |
| 5 | Devorador de Coerência | Seguir a próxima zona anunciada e sustentar pelo menos 50% de coerência; faixa estreita e C na pressão | Preservação da coerência sob ruído |
| 6 | Guardião da Síndrome | Ler + a cada ciclo; preparar a próxima indicação durante a pressão | Síndromes identificam certos erros |
| 7 | Interferômetro | Alternar corredores A/B e atacar − entre salvas; C e novo deslocamento na pressão | Reforço e cancelamento de amplitudes |
| 8 | Núcleo da Nave-Mãe | Bell com QBER <9%; H com coerência; síndrome com A/B/C | Combinação de operações e controle de erros |

Os números das barras de vida foram preservados; no Bell final, cada acerto remove uma unidade, em vez de duas. A dificuldade vem de alvos, posições, limites de acertos por abertura e sobreposição entre ataque e preparação da fuga. A pressão é incorporada no próximo ciclo após a metade da vida, preservando avisos já emitidos; a Sentinela muda após o primeiro relé. A nave-mãe usa três estágios anunciados, cada um combinando duas mecânicas conhecidas. Briefings e painel explicam as regras.

As ondas comuns param durante a luta. Os guardiões usam relógio próprio que congela em pausas/briefings. Cada salva deixa pelo menos duas trilhas livres e avisa por pelo menos 2 s (o rastreio da sonda se fixa antes dessa contagem). Os corredores de salvas sucessivas podem ser distintos: não há garantia de uma posição segura durante o ciclo inteiro. A/B ficam separadas por 1,8 s; B/C por 2 s. Rotas verificadas em sete e nove trilhas admitem a travessia e 400 ms de reação.

O núcleo pode ficar vulnerável antes da próxima salva, pedindo uma escolha entre continuar atirando e antecipar a fuga. Marcas se distinguem por letras/cores, com destaque no ataque mais próximo; corredores imediatos têm sinal verde. Contagens também aparecem no painel. Zonas futuras e mudança dos núcleos têm contorno azul. H é lançado no centro útil da Tríade e do estágio de coerência final; a luta continua vencível sem coletá-lo. + continua nos confrontos de correção/finais.

Insistir parado por pelo menos 600 ms numa sonda falsa ou módulo errado pode devolver 0,8 ou 0,6 pp de QBER, com intervalo mínimo de 900 ms. O modelo considera a posição física; disparos em trânsito e tiros laterais de H não causam esse ruído de leitura. R descarta o contato, sem proteger do dano físico.

Além das salvas físicas, cada ciclo pode emitir uma perturbação do canal. Três trilhas douradas (duas nos extremos) travam a mira ao aparecer e avisam por 1,2 s. Contato acrescenta 2,5 pp de QBER nos chefes 1–4 ou 3 pp nos chefes 5–8, sem consumir o escudo físico. Desviar evita o contato; renovar descarta esses contatos durante os 2 s da operação. As fontes ambientais voltam a elevar o erro após a renovação. Ruído e relógios congelam em pausa/briefing; mudanças de estágio e vitória cancelam perturbações antigas.

O painel indica respiros 450 ms após a última salva do ciclo, quando há tempo para os 2 s de R e 400 ms de margem antes do ciclo seguinte. Parte desse período coincide com a vulnerabilidade do chefe: renovar tem custo de oportunidade em disparos. Uma entrada ou mudança de estágio causada por laser já em voo durante R preserva o tempo da travessia até um corredor livre e mais 400 ms de reação antes da nova salva, incluindo o restante de um movimento interrompido.

## Margem de erro e retomada

O escudo absorve um impacto físico e concede 1,4 s de proteção nas ondas. Nos chefes, a proteção dura 450 ms: evita contatos duplicados próximos, mas não absorve outra salva distinta. Um golpe sem escudo causa derrota. Regenerar a chave não torna a nave imune a golpes físicos.

Entrar no guardião preserva o escudo restante das ondas, H, QBER, recarga, comprometimento e renovação em andamento. Vencer restaura uma carga de escudo, reduz QBER em até 1,5 pp e repara um impacto; vencer sem dano físico durante o chefe concede mais um reparo. A recarga de R não é reiniciada nas transições. O limite de 12 impactos na Terra permanece.

H acrescenta 5 s, acumuláveis até 7 s restantes; + reduz até 4 pp de QBER e 2 s de recarga, sem curar uma inversão em andamento. Cápsulas comuns surgem a uma a três trilhas da nave; o lançamento considera tempo de chegada, percurso e contatos previstos com perigos existentes. H ainda longo adia outra cápsula. Nos chefes 3/6/8, o apoio é limitado a uma cápsula por ciclo, anunciada por 900 ms; perdê-la não gera reposição imediata.

O alerta do canal fica dentro do painel de QBER, junto da informação de R; escudo e duração de H compartilham a faixa de recursos. Salvas físicas iminentes ocultam mensagens temporárias de recursos. Entrada em canal instável, recarga concluída, consumo de escudo e liberação de suprimento têm sinais sonoros próprios, emitidos uma vez por evento.

Ultrapassar 11% inicia até 4 s de comandos invertidos. R pode interromper o comprometimento respeitando a recarga. Novos contatos não estendem a inversão e não limpam a tela. Ao recuperar os comandos sem R, o QBER é limitado a 9% (sem elevar um valor já corrigido) e há 2,5 s de margem antes de outra inversão; contatos têm somente 600 ms de proteção. O QBER é exibido e limitado a 16% nesta simulação. Atingir o teto não prolonga a penalidade.

Há pontos em memória no início da fase e na entrada do chefe. Guardam fase, carga, pontos, semente, impactos, cápsulas coletadas, escudo, proteção restante, H, posição e movimento intermediário, além do canal e seus tempos restantes. Derrota no chefe oferece Retomar no chefe como opção principal, inclusive por Enter: o confronto reinicia com vida inteira e no primeiro estágio, restaurando os recursos da entrada. Refazer a fase inteira continua disponível e preserva apenas os guardiões anteriores. Repetir não acumula pontos, recursos ou reparos. As mensagens de derrota distinguem salvas, colisões e impactos na Terra, e mostram o estado que será restaurado. Recomeçar campanha volta à fase 1; fechar a página apaga as retomadas.

## Ciência e ficção

Os briefings identificam os combates como analogias. QKD não é um escudo físico; QBER não prova espionagem; entrelaçamento não transmite dano ou mensagens; uma superposição não permite ler vários resultados simultaneamente; correção não copia um estado desconhecido. As zonas de coerência e salvas de interferência são mecânicas fictícias. Os limites fictícios de 8% da Sentinela, 9% do estágio Bell final e 11% da inversão são regras deste jogo, sem representar um critério universal para segurança QKD.

R representa descartar o bloco anterior e preparar/validar outro no protocolo fictício. Não conserta a fonte de ruído nem restaura fisicamente qubits: a pressão continua após a operação. A recuperação parcial e a inversão são recursos de balanceamento.

## Verificação e alcance do balanceamento

`tests/bosses.cjs` tem 27 casos e cobre vulnerabilidades, escudos, salvas, janelas, coerência, fases do núcleo, pausa, retomada e ausência de ondas comuns durante confrontos. `tests/resources.cjs` acrescenta 21 casos de duração/coleta, escudo e reparos, restauração exata após derrotas repetidas, estágios finais, Enter, retorno às ondas, sinais sonoros e prioridade visual. Os testes anteriores continuam cobrindo colisões, campanha, treinamento, narrativa e áudio.

A validação final soma **162 verificações**. `tests/balance.cjs` conclui seis campanhas com colisões ativas, incluindo 844 × 390 e 760 × 360; `tests/fairness.cjs` cobre a geometria, limpeza de encontros, rotação e 3.072 rotas com leitura em 400/600 ms a 30/60 fps. O piloto não identifica a sonda verdadeira antes da varredura.

A matriz de 46 cenários compara cinco telas, quatro sementes, prioridades de alvos, atraso na leitura, decisões mais espaçadas, comandos perdidos, imobilidade e uso/ausência de R. O piloto equilibrado concluiu as 20 combinações em 540–604 s de ação, usando R 27–33 vezes. Priorizar meteoros ou drones também produziu caminhos viáveis; atrasos e comandos perdidos provocaram derrotas em parte das amostras. Ficar parado perdeu na primeira fase.

Na comparação pareada com compensação precisa de inversões, ainda foi possível vencer sem R. Isso custou 48 comprometimentos e aproximadamente 192 s de inversão, contra 10 episódios e 22–27 s com R. O chefe final passou de aproximadamente 104 s sem R para 63–64 s com R. O jogo não exige uma tecla para autorizar a vitória: a estratégia tem um custo observável.

Esses pilotos consultam o estado interno e não representam jogadores humanos. A dificuldade sentida e a diversão ainda dependem de partidas de pessoas. O [relatório completo](BALANCEAMENTO.md) registra metodologia, resultados de derrota, durações e limites das conclusões; os [dados por cenário](balanceamento-resultados.json) permitem conferir as comparações.
