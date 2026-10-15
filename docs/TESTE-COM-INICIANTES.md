# Rodada com iniciantes — roteiro da fase 4

Estado: **preparado; nenhuma partida humana foi realizada pelo agente**. As simulações consultam o estado interno e não medem diversão, compreensão ou dificuldade humana.

Convidar 5–8 pessoas, incluindo quem quase não joga. Distribuir teclado e toque conforme disponibilidade. O jogo é a apresentação: não explicar os chefes por fora nem preparar uma fala para a pessoa. Reservar cerca de 20 minutos por participante, permitindo terminar antes ou interromper livremente. Esse grupo encontra problemas; não estima uma taxa estatística de sucesso.

1. Atribuir um código local como P01, sem nome. Anotar resolução, dispositivo, entrada, experiência anterior e versão/commit. Começar em NOVA MISSÃO. Não apagar o ponto local de outra pessoa sem usar a opção de nova missão autorizada por ela.
2. Pedir: “Jogue como achar melhor e diga o que está tentando fazer”. Observar a primeira tentativa sem dicas externas. A história, o treino, Como jogar, os briefings e a pausa fazem parte do jogo e podem ser consultados.
3. Marcar a primeira movimentação, o primeiro R, a primeira derrota e a causa que a pessoa acredita ter ocorrido. Comparar com a causa registrada pelo jogo. Observar se leu a mira fixa, distinguiu cápsula + de módulo + e percebeu a separação entre recuperar coerência e atacar.
4. Se houver dificuldade persistente, oferecer verbalmente a possibilidade de consultar a pausa. Registrar essa intervenção. Se a pessoa escolher o botão vermelho para conhecer as fases seguintes, registrar o instante e continuar: esse resultado é assistido, nunca uma conclusão normal.
5. Ao terminar, perguntar: “O que R faz e quando vale usar?”, “O que precisava fazer no chefe que mais confundiu?” e “Em que momento ficou sem saber o que fazer ou sem nada interessante para fazer?”. Anotar a resposta, sem substituir por interpretação do observador.
6. Depois da sessão, exportar localmente `quantumDiagnostics.playtest()` pelo console. Copiar o JSON para um arquivo UTF-8 em `tmp/playtests/P01.json`. O export contém a tentativa atual e até 20 anteriores na memória, com IDs de campanha/tentativa e indicação assistida. Reabrir perde o histórico detalhado anterior; exportar antes de fechar. Não há envio automático.

Consolidar exports com `node tools/summarize-playtest.cjs tmp/playtests/P01.json tmp/playtests/P02.json`. Salvar o resultado em arquivo UTF-8 se desejar. O relatório evita duplicar exports da mesma campanha/tentativa, mantém o mais recente e separa a simulação identificada do auxílio de desenvolvedor. A origem do comando não prova que houve uma pessoa: marcar execuções automatizadas nas observações.

| Código | Versão / tela / entrada | Experiência | Primeira derrota percebida / registrada | Chefe e tentativa mais difícil | Consultou guia? | Auxílio / intervenção | Trecho repetitivo ou confuso | Respostas finais |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | A preencher | A preencher | A preencher | A preencher | A preencher | A preencher | A preencher | A preencher |

Interpretar com cuidado:

- Os primeiros eventos usam tempo ativo da tentativa; leitura, treino e pausa ficam fora dele. Não comparar esse número com a duração total observada da sessão.
- `noDecisionMs` indica ausência de ameaça, alvo aberto ou R disponível em alerta; inclui respiros planejados. `emptyTravelMs` é movimento nessa condição. Esses indicadores localizam trechos para observar, sem provar que são inúteis.
- `waitingForOpeningMs` conta espera sem ameaça anunciada e sem renovação em curso. Comparar com os ciclos e com o dano de cada abertura já registrado, antes de alterar vida ou tempos.
- Comparar separadamente conclusões sem auxílio, com desenvolvedor e simulações. Agrupar tentativas pelo ID, fase e entrada no trecho; não contar cada repetição como uma pessoa diferente.
- Priorizar problemas repetidos de compreensão e legibilidade. Só ajustar dificuldade após observar a causa: ampliar aviso, melhorar a primeira apresentação ou reduzir uma combinação específica. Preservar os controles, orçamento de ameaças e rotas possíveis.

Ao fechar a rodada, registrar evidências e alterações em `docs/BALANCEAMENTO.md`. Não preencher esta tabela com resultados de bots ou alegar validação humana enquanto ela não ocorrer.
