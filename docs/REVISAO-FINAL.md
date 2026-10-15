# Revisão integrada das oito fases

As entregas técnicas estão integradas. O jogo continua offline, usa os mesmos oito setores/guardiões e mantém o ajuste leve de dificuldade anterior. Esta revisão consolida regras e estados; não acrescenta outra camada de dificuldade. **Aprendizagem, diversão e desempenho em celulares físicos continuam sem validação humana.**

## Cobertura do planejamento

| Fase | Entrega integrada | Evidência |
| --- | --- | --- |
| 1 | Arena e painéis em telas baixas; sorteios de ambiente independentes do desenho | Layout padrão/ampliado, rotação e testes de sorteio/checkpoint |
| 2 | Objetivos dos chefes, feedback de alvos/janelas, coerência/estágio e ensino de R | Treino completo, 30 consultas de chefe e testes de feedback/canal |
| 3 | Continuidade local, identidade de campanha/tentativa e auxílio persistente | Reabertura, retomada de fase/chefe, marca assistida, vitória e armazenamento indisponível |
| 4 | Instrumentação, respiros, variantes planejadas, medalhas e resumos opcionais | Campanhas de regressão, comparação de políticas e fluxos de medalhas; rodada humana preparada e pendente |
| 5 | Experimentos científicos opcionais, leitura de síndrome e contexto Quantum Security | Seis modelos, isolamento do combate, consulta por teclado e limites científicos documentados |
| 6 | Leitura ampliada, efeitos reduzidos, teclas, inversão e foco | 1.232 estados de layout, controles no treino/campanha e navegação nos painéis |
| 7 | Identidades sonoras, estágios sem reinício da faixa e otimização de áudio | Eventos únicos, pausa, síntese Web Audio e medições locais; hardware/escuta humana pendentes |
| 8 | Regras compartilhadas, consulta explícita do estado, relatórios contextualizados e CI de navegador | 253 verificações Node, 576 confrontos estacionários e nove suítes Chromium |

## Integração entre áreas

- `config.js` concentra os valores centrais de carga/impactos, quadro, disparo, R, comprometimento e limiares de canal. Combate, treino, normalização dos salvamentos e métricas consultam essas regras. `arena.js`, `phases.js`, `resources.js` e os modelos continuam responsáveis por seus parâmetros específicos. Descrições comuns dos controles também consultam a configuração.
- `resolveGameMode` dá nomes explícitos aos estados existentes: menu, treino, espera, briefing, ondas, chefe, pausa, configurações, final, derrota e vitória. Atualização e comandos de combate consultam essa visão compartilhada. Os indicadores já usados pelas transições foram preservados; não houve migração para outro motor ou framework.
- Preferências de leitura/efeitos/teclas ficam separadas do checkpoint e da identidade. Configurar congela o combate; fechar retorna à pausa. As teclas e o áudio do estágio acompanham renascimento e transições sem criar benefícios duplicados.
- Canal, recarga, recursos, sorteio e variante atravessam as transições. Pontos de entrada continuam compatíveis com a versão 1 do salvamento; não se salva um chefe parcialmente derrotado numa retomada normal. O botão de desenvolvedor continua preservando o combate exato e marcando a jornada como assistida.
- A ciência permanece opcional, sem bônus de combate, mudanças de sorteio ou pausas obrigatórias. A história e o tutorial continuam sendo a própria apresentação do jogo.
- Relatórios da aplicação 0.8.0 incluem configuração, arena/semente, versões dos encontros/sorteio, campanha, tentativa, auxílio e entradas. Snapshots mostram modo, viewport e preferências atuais. O consolidador preserva esses contextos; dados antigos sem versão continuam explicitamente desconhecidos.

## Validação final

Foram aprovadas 253 verificações Node. As seis campanhas e a comparação sem R mantiveram todos os resultados de combate da fase 7, excluindo os metadados novos: campanhas de 558–611 s, 25–33 renovações e 1–6 impactos líquidos nos seis cenários fixos.

Os 576 confrontos isolados tiveram **zero vitórias estacionárias**, 560 derrotas e 16 casos sem conclusão em 180 s. Os casos com e sem R foram incluídos; sobreviver até o limite da simulação não é vencer o chefe.

A matriz de 58 cenários também foi refeita: todos os campos históricos e resumos coincidiram com a fase 4. O piloto equilibrado venceu 20/20 casos em 558–645 s; ignorar o canal e renovar imediatamente no alerta perderam 4/4 cada. Reação de 300 ms venceu 2/4; reação de 500 ms perdeu 2/2. Os dois casos sem R ainda venceram porque esse piloto evita ruído e compensa inversões; não equivalem a ignorar o canal. Priorizar somente fontes de ruído ou meteoros e ignorar emissores como alvo também foram comparados. Esses resultados reforçam a necessidade da observação humana, sem justificar outro rebalanceamento automático nesta etapa.

As nove suítes de navegador passaram no Chromium 151.0.7922.34, fornecido pelo Playwright 1.62.1 fixado no lockfile. Incluem 616 estados padrão + 616 ampliados em 14 resoluções, rotação, treino/pausa, continuidade, medalhas, experimentos, acessibilidade, áudio e um fluxo integrado das oito fases em três telas. Esse último fluxo prepara deliberadamente as vitórias para testar as transições; não é apresentado como uma campanha humana ou uma vitória do piloto de combate.

O workflow foi validado como YAML e configura os mesmos comandos em dois jobs Ubuntu, com relatórios e artefatos de falha. Captura PNG e trace ZIP foram exercitados em uma falha controlada. A execução local foi no Windows; **o novo workflow ainda não foi executado nos servidores do GitHub**, pois depende do envio deste estado ao repositório.

Resultados consolidados e comparação de estratégias são registrados em `FASE8-RESULTADOS.json`. Os relatórios detalhados da execução local ficam em `tmp/`, ignorado pelo Git. A revisão foi feita com alterações locais pendentes: a referência Git é a base f3f0828, não um commit publicado contendo as oito fases.

## Pendências reconhecidas

1. Realizar a observação prevista com 5–8 iniciantes, teclado e toque. Não há evidência humana para afirmar que a compreensão e a diversão melhoraram na proporção esperada.
2. Medir desempenho em aparelhos modestos físicos e avaliar a mixagem com alto-falantes/fones. CPU limitada no Chrome não reproduz todo o aparelho.
3. Executar o workflow no GitHub após o próximo push e acompanhar o resultado Ubuntu. A execução local não substitui esse registro remoto.

Os chefes finais mantêm as combinações adotadas (Bell/QBER, H/coerência, síndrome/interferência); não foi acrescentado rastreamento ao primeiro estágio final. A duração de referência continua provisória. Essas adaptações e os limites das simulações permanecem documentados, sem serem convertidos retroativamente em requisitos já validados por pessoas.

[Comandos, CI e formatos dos relatórios](TESTES-E-CI.md) · [Desempenho](DESEMPENHO.md) · [Roteiro humano pendente](TESTE-COM-INICIANTES.md) · [Histórico das entregas](EVOLUCAO-POR-FASES.md).
