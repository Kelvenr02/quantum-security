# Dificuldade e guardiões quânticos

## Objetivo da revisão

Elevar a pressão e a variedade preservando tempo para observar, escolher e reagir. Antes, atingir uma meta de pontos encerrava a fase. Agora, cada meta abre um confronto ligado ao conceito apresentado naquela fase. Só sua vitória libera a progressão; carregar o canhão não pula o confronto final.

## Curva das ondas

- Intervalos de 1.300 ms a 800 ms, com variação de ±10%. A primeira fase já pede mais movimento; a campanha mantém aumento gradual de velocidade e densidade.
- Velocidade base de 3,35 a 5,05 unidades por quadro de referência, escalada à altura da tela. O disparo permanece em 300 ms; regeneração permanece com 2 s de imobilização e 10 s de recarga.
- Rochas rápidas, com rastro laranja e velocidade 22% maior, surgem na fase 2. Não acumulam blindagem nem a ligação de pares.
- Pulsos espiões têm 60% de chance de priorizar a posição ocupada no lançamento, quando aquela trilha está disponível; nos outros casos, sorteiam uma trilha livre. Não perseguem a nave durante a queda.
- Ondas triplas entram na fase 6, com chance de 8%, 10% e 12% nas fases finais. O lançamento limita a quantidade para reservar espaço de manobra entre as trilhas disponíveis.
- A recuperação passiva do QBER cai de 0,8 para 0,55 ponto percentual por segundo nas fases iniciais; as tempestades mantêm recuperação de 0,2 e seus ruídos ambientais anteriores.

## Confrontos

| Fase | Guardião | Decisão principal | Relação didática |
| --- | --- | --- | --- |
| 1 | Sentinela da Chave | Eliminar relés em sequência; renovar se o QBER chegar a 8% | Verificação e descarte de chaves inseguras |
| 2 | Observador Fantasma | Esperar a varredura revelar a sonda com ✓; escapar de uma salva que marca a posição inicial | Medição e perturbação |
| 3 | Tríade Hadamard | Usar H para atingir três núcleos; também pode ser vencida sem coletar a cápsula | Superposição como recurso de jogo |
| 4 | Gêmeos de Bell | Trocar entre os dois lados vulneráveis; um acerto danifica o par | Estado conjunto e correlações |
| 5 | Devorador de Coerência | Permanecer na zona verde móvel; recuperar coerência acima de 35% para atacar | Preservação da coerência sob ruído |
| 6 | Guardião da Síndrome | Ler a indicação + e corrigir o módulo apontado até concluir os três | Síndromes identificam certos erros |
| 7 | Interferômetro | Evitar duas salvas A/B e atacar na janela − após ambas | Reforço e cancelamento de amplitudes |
| 8 | Núcleo da Nave-Mãe | Adaptar-se a três estágios: par entrelaçado, coerência e síndrome com dupla salva | Combinação de operações e controle de erros |

Todos têm uma janela protegida, ataque anunciado e abertura para contra-atacar. Não são oito barras de vida com apenas nomes diferentes: as condições para aplicar dano e os recursos de apoio mudam. As regras completas aparecem num briefing curto antes de cada confronto e as condições principais permanecem no painel.

As ondas comuns param durante a luta. Os guardiões usam seu próprio relógio de simulação, atualizado apenas durante jogo ativo. Os avisos duram ao menos 2 s e o conjunto das salvas deixa no mínimo duas trilhas fora das marcas. As salvas A/B usam rótulos em alturas diferentes para continuar legíveis quando atingem as mesmas trilhas. Cápsulas de apoio surgem na Tríade, na Síndrome e no confronto final.

## Margem de erro e retomada

O escudo absorve um impacto físico e concede 1,4 s de proteção, evitando que dois contatos quase simultâneos consumam toda a chance de recuperação. Um golpe sem escudo causa derrota. Regenerar a chave não torna a nave imune a golpes físicos.

Antes de cada guardião, o escudo é restaurado, a recarga de R fica pronta e o QBER é limitado a 5%. Isso dá uma condição inicial utilizável sem apagar os impactos acumulados na Terra. Vencer restaura o escudo, zera o QBER e repara dois impactos.

Um ponto de retomada em memória guarda fase, pontuação inicial, impactos e cápsulas coletadas. Repetir a fase restaura esse estado e preserva a conclusão dos guardiões anteriores; o guardião atual precisa ser vencido novamente. A opção de recomeçar toda a campanha continua disponível. Fechar a página apaga a retomada.

## Ciência e ficção

Os briefings identificam os combates como analogias. QKD não é um escudo físico; QBER não prova espionagem; entrelaçamento não transmite dano ou mensagens; uma superposição não permite ler vários resultados simultaneamente; correção não copia um estado desconhecido. As zonas de coerência e salvas de interferência são mecânicas fictícias. O limite de 8% da Sentinela e os 11% da inversão são regras deste jogo, sem representar um critério universal para segurança QKD.

## Verificação e alcance do balanceamento

`tests/bosses.cjs` cobre vulnerabilidades, escudos, salvas, janelas, coerência, fases do núcleo, pausa, retomada e ausência de ondas comuns durante confrontos. Os testes anteriores continuam cobrindo colisões, campanha, treinamento, narrativa e áudio.

`tests/balance.cjs` conclui a campanha através de movimento, disparo automático e colisões reais, mantendo todas as ameaças ativas. Há três cenários reproduzíveis: 1.100 × 800 e dois em 390 × 700. O controlador decide a cada 160 ms e move uma trilha por decisão; não injeta dano, pontos, vidas ou conclusões de guardiões. Os três cenários de regressão chegam aos oito guardiões e ao final em aproximadamente 212 s de ação, sem contar a leitura dos briefings e a animação final.

Esse piloto consulta o estado interno e reage com precisão. Outras sementes exploradas também causaram derrotas: os resultados demonstram que existe um caminho viável e detectam regressões, mas não estimam a taxa de sucesso de jogadores humanos. O ritmo final pode ser ajustado após partidas reais, especialmente no celular. Os oito confrontos, a pausa, a interface e a passagem para o final também foram verificados no Chrome, com teclado e toque.
