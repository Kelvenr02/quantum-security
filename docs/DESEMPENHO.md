# Medições da fase 7

O jogo continua abrindo diretamente por `index.html`. Os 19 arquivos de áudio e o bundle offline foram preservados; os novos avisos são sintetizados localmente, sem novas bibliotecas ou downloads.

## Método e limites

`tests/browser/performance.cjs` usa Chrome headless, endereço `file://`, relógio real e dois confrontos de 2,4 s (chefes 2 e 8). Mede abertura, intervalos entre callbacks de animação, tarefas longas, conversão/decodificação de áudio, buffers PCM e heap informado pelo Chrome. Inclui 1600×900 sem limitação e 390×700/568×320 com CPU limitada a 4× pelo CDP. O cache do sistema operacional pode estar aquecido. Não execute outras suítes de navegador simultaneamente à medição.

Esses cenários usam o mesmo computador; resolução de celular e CPU limitada **não equivalem a um celular físico**. Heap JavaScript e armazenamento de buffers não representam toda a RAM do processo, GPU, sistema ou decodificador. PCM é calculado por `length × numberOfChannels × 4`; a instrumentação não força coleta de lixo. Um ensaio por configuração serve como diagnóstico, não como estimativa estatística de velocidade ou FPS em outros aparelhos.

O ensaio de trocas rápidas percorre oito músicas com o áudio pausado. Ele expõe retenção de faixas cujos fades não podem terminar enquanto o contexto está suspenso; **não é o consumo normal de uma campanha**. A medição final também percorre as oito faixas com áudio funcionando, aguardando os fades e as cargas terminarem. Nessa seção o combate fica congelado para isolar o mecanismo de música.

Os resultados anteriores às correções foram coletados no estado local após a fase 6; a comparação imediata usa o mesmo roteiro de estresse. A rodada final acrescenta o cenário de estabilização das faixas. O relatório distingue essas rodadas e registra suas datas e versão do Chrome. Os arquivos de origem ainda estavam pendentes de commit; não há um hash publicado correspondente à amostra anterior.

## Correções guiadas pelas medições

- A conversão de base64 usava `Uint8Array.from` com uma chamada JavaScript por byte. A cópia agora usa um laço sobre o array já alocado. O formato, os bytes comprimidos e o áudio resultante são iguais.
- Fades antigos são interrompidos e desconectados em mudanças sucessivas: no máximo música atual e predecessora durante uma transição. Em contexto suspenso, a predecessora é retirada imediatamente; não se acumulam faixas silenciosas esperando o relógio voltar.
- A próxima música é preparada durante o treino/briefing. Briefing de chefe prepara a faixa do chefe; briefing de fase prepara a da fase. Não se decodifica a fase seguinte antecipadamente durante o combate atual. Após o fade, fica somente a música em uso, mais um preparo explicitamente necessário durante a leitura.
- `gameAudio.status()` oferece bytes PCM retidos, pico observado, cargas pendentes e até 64 registros de conversão/decodificação. São dados locais e limitados em memória; não há transmissão nem gravação automática desses registros.

## Evidências e pendências

Os valores medidos estão em [FASE7-MEDICOES.json](FASE7-MEDICOES.json). O ensaio pausado caiu de nove fontes e aproximadamente 201 MiB de PCM retido para uma fonte e aproximadamente 47 MiB na última faixa. Isso corrige a retenção no cenário de estresse; não significa uma redução equivalente da RAM total do jogo.

| Configuração | Abertura, rodada final | Maior tarefa antes → primeira correção | Maior conversão, rodada final |
| --- | ---: | ---: | ---: |
| 1600×900, CPU 1× | 235 ms | 192 → 121 ms | 5,3 ms |
| 390×700, CPU 4× | 696 ms | 934 → 359 ms | 28,4 ms |
| 568×320, CPU 4× | 680 ms | 947 → 355 ms | 28,5 ms |

Na rodada final, a maior retenção PCM após estabilizar uma faixa foi 47,2 MiB; o pico observado durante sobreposição/carga foi 77,2 MiB. Os intervalos p95 entre callbacks ficaram próximos de 6,2 ms na cadência desse host, com uma entrada fria chegando a 109 ms no cenário de computador. Isso não permite prometer uma taxa de quadros em outro equipamento. As informações de heap e decodificação por arquivo constam do JSON, separadas dos bytes PCM.

As tarefas longas de conversão foram reduzidas; permanecem custos de inicialização do cenário e da decodificação. As amostras de animação incluem entradas frias em combate e podem apresentar intervalos isolados maiores. Não foi adotado um limite universal de FPS nem uma redução automática da qualidade visual: faltam medições em aparelhos modestos reais.

Antes de concluir sobre desempenho ou mixagem nesses aparelhos, repetir o roteiro em hardware físico e escutar os avisos com alto-falantes e fones. A renderização Web Audio automatizada confere sinal não silencioso e amplitude de cada novo aviso, mas não avalia percepção, conforto ou preferência humana. A rodada com iniciantes da fase 4 continua pendente.

## Reproduzir

Com Playwright e Chrome/Chromium disponíveis, executar `node tests/browser/performance.cjs`. `PLAYWRIGHT_MODULE` e `CHROME_EXECUTABLE` podem indicar instalações existentes; `PERFORMANCE_OUTPUT` define o arquivo de saída (padrão `tmp/performance.json`). Não usa relógio simulado nem servidor.

`node tests/browser/audio.cjs` confere sincronização, pausa, estágio e síntese offline em três resoluções. `node tests/audio.cjs` e `node tests/sound-events.cjs` verificam cache, prioridade, seleção de músicas e emissão única dos eventos. Os testes não exigem áudio nos alto-falantes.
