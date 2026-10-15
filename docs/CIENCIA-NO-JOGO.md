# Ciência incorporada às ações — fase 5

O jogo e os experimentos usam cálculo clássico local. Não há conexão com equipamento QKD, computador quântico, serviço externo ou chave real. Quantum Security continua sendo a proposta acadêmica descrita no pitch, aplicada à história como integração de equipamentos, monitoramento e gestão das chaves. Os comandos da nave continuam associados ao rádio clássico.

## Acesso e ritmo

Os briefings e a pausa oferecem experimentos opcionais, recolhidos por padrão. A seleção sugere o conceito da fase/estágio e permite consultar os demais. As operações não alteram canal, pontuação, chefe, objetivos, recursos ou sorteio dos perigos. Nenhuma resposta é exigida para avançar. Enter nos botões do laboratório mantém a interação local.

Durante a ação, pistas de baixa prioridade relacionam H, pares, cápsula +, ruído e R aos conceitos. Uma pista é mostrada no máximo uma vez por tipo/fase e respeita intervalo de 20 s; uma pendência expira em 6 s. Perigos iminentes, alertas de combate e QBER elevado têm prioridade. A opção de desligar as pistas fica nos experimentos e é guardada separadamente do salvamento da campanha. Não há novos sons ou pausas obrigatórias.

## Experimentos

| Conceito | Interação e vínculo com o jogo | Limite explicitado |
| --- | --- | --- |
| Chaves/QBER | Comparar oito bits de exemplo; adicionar divergências; descartar e solicitar outra chave ao Quantum Security | A amostra é pública e descartada. Uma comparação não comprova segurança; solicitar chave não remove o ruído |
| H | Aplicar H e medir; duas aplicações de H desfazem a preparação | Os três tiros são uma metáfora. As barras são probabilidades calculadas, sem acesso a um qubit desconhecido |
| Bell | Preparar com H seguido de CNOT e medir o par na mesma base | O resultado conjunto é único. Dano compartilhado é ficção e não permite comunicação instantânea |
| Coerência | Aumentar desfasamento e observar a perda de contraste após H | Exemplo idealizado, distinto do QBER e da barra C. Preparar novamente cria outro estado |
| Síndrome | Injetar uma inversão X e escolher o módulo indicado pela paridade | Considera até uma inversão; não representa correção completa nem clonagem |
| Interferência | Alternar fase 0/π em uma preparação H–fase–H; observar somas com sinal e probabilidades | As rotas de fuga são analogia, não paredes de amplitudes |

Os desenhos de H e Bell são receitas de referência, sem execução automática. As barras seguem as operações escolhidas. Uma medição repetida sem outra operação mantém o resultado; novas preparações reiniciam o exemplo. O modelo de desfasamento reduz apenas o contraste, sem afirmar que remover ruído recuperaria um estado desconhecido.

No chefe 6 e no terceiro estágio final, a leitura usa paridades de qubits adjacentes: 10 → M1, 11 → M2 e 01 → M3. Os módulos mostram seus nomes, e o + continua indicando o alvo. A seleção, os danos, as janelas e os ataques mantêm suas regras anteriores; a leitura não adiciona uma prova ou bloqueio.

## Fontes conferidas

- [IBM — circuitos e preparação de Bell](https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/quantum-circuits/circuits).
- [IBM — código de repetição e síndromes](https://quantum.cloud.ibm.com/learning/en/courses/foundations-of-quantum-error-correction/correcting-quantum-errors/repetition-codes).
- [IBM — tutorial e limites do código de repetição](https://quantum.cloud.ibm.com/docs/en/tutorials/repetition-codes).
- [ETSI — vocabulário QKD, incluindo canal clássico autenticado](https://www.etsi.org/deliver/etsi_gr/QKD/001_099/007/01.02.01_60/gr_qkd007v010201p.pdf).
- Pitch local: `Pitch-Quantum-Security.pdf`. A cópia do jogo e o arquivo original na pasta superior foram comparados e têm SHA-256 `F493B7C969A6B26645152D80DAB7B09DF30FA0148D6EA5583E56E89A7FFF01EF`.

As fórmulas dos pequenos modelos são verificadas por testes de normalização, resultados de medição, paridades e independência da campanha. Isso não substitui avaliação de aprendizagem com pessoas. A rodada humana da fase 4 permanece pendente.
