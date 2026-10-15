# Testes locais e GitHub Actions

O jogo continua funcionando por `index.html`, sem instalação. `package.json` e `package-lock.json` são somente para desenvolvimento. Playwright 1.62.1 está fixado; não é uma dependência do jogo no navegador.

## Comandos

```text
npm ci --ignore-scripts --no-audit --no-fund
npx playwright install chromium
npm test
npm run test:stationary
npm run test:browser
```

`npm test` verifica sintaxe dos arquivos próprios e todas as suítes Node rápidas, incluindo seis campanhas completas simuladas. `test:stationary` é separado por seu custo: oito chefes × nove posições × duas telas × com/sem escudo × com/sem R = 576 confrontos. São estratégias com consulta ao estado interno; não são partidas humanas.

`npm run test:matrix` é a investigação ampliada opcional com 58 cenários de estratégia, reação, entrada e canal. Gera `tmp/balance-matrix.json`; não é repetida em todo push. Foi reexecutada na revisão final da fase 8.

`test:browser` executa sequencialmente dez suítes: layout padrão, layout ampliado, história/guia, treino/pausa, continuidade, medalhas, ciência, acessibilidade, áudio e integração entre fases. Os dois layouts somam 1.232 estados em 14 resoluções. A rotação deve preservar o sorteio; teclado, foco e estados simultâneos são conferidos nas suítes específicas. O relógio fica explicitamente parado e só avança quando o cenário solicita. O teste de desempenho usa relógio real e deve ser executado separadamente com `npm run measure`.

No Windows, `npm.cmd`/`npx.cmd` podem ser usados quando o PowerShell não permite os wrappers `.ps1`. Na pasta longa do Drive desta sessão, a extração de `node_modules` falhou. A instalação pelo mesmo lockfile foi validada numa pasta local curta. É possível instalar ali, definir `PLAYWRIGHT_MODULE` como o caminho do pacote Playwright e executar os scripts a partir do projeto. `CHROME_EXECUTABLE` permite escolher outro Chrome; a revisão da fase 8 usou o Chromium fornecido pelo pacote fixado, sem essa substituição.

## Relatórios e falhas

- `tmp/node-tests/`: logs e JSON individuais, resumo com versão, revisão Git e indicação de alterações locais; a execução estacionária também produz seu relatório separado.
- `tmp/browser-tests/`: resultado de cada suíte, log e resumo com versão/revisão/alterações locais. Em uma falha, `failures/` recebe captura PNG e trace ZIP do contexto ainda aberto. O mecanismo foi exercitado com uma falha controlada local.
- Layout padrão e ampliado usam `tmp/layout-check/` e `tmp/layout-check-large/` para não sobrescrever resultados.
- Capturas complementares ficam em `tmp/story-check/`, `tmp/feedback-check/`, `tmp/continuity-check/`, `tmp/progression-check/`, `tmp/science-check/` e `tmp/accessibility-check/`.

O teste de integração entre as oito fases prepara deliberadamente a conclusão das ondas/chefes para verificar transições, recursos, opções, renascimento, estágios finais e relatórios. Ele **não demonstra** que um jogador venceu os confrontos: as campanhas completas e os confrontos estacionários exercitam as regras nos testes Node.

## Execução remota

`.github/workflows/tests.yml` possui dois jobs independentes em Ubuntu: regras/estratégias e interface Chromium. O job de navegador instala o lockfile e as bibliotecas do sistema antes de executar o mesmo runner local. Ambos preservam resultados por 14 dias, inclusive quando há falhas. Actions estão fixadas por SHA. Há limite por processo de teste e por job; medições de desempenho não bloqueiam o CI por uma taxa de quadros dependente do host.

Referências oficiais para [instalação do Playwright em CI](https://playwright.dev/docs/ci) e [artefatos do GitHub Actions](https://github.com/actions/upload-artifact). A configuração foi validada localmente; sua execução nos servidores do GitHub requer que este estado seja enviado ao repositório. Não há um resultado remoto novo nesta entrega.

## Identificação dos dados

`config.js` declara a versão da aplicação (`GameBuild.version`) e das regras (`rulesVersion`). Ao modificar comportamento, atualizar essas versões e a versão correspondente de `package.json`; configuração numérica, versões dos encontros/sorteio, arena e semente acompanham os diagnósticos.

O esquema de métricas continua na versão 3: `build` e `configuration` são campos adicionais compatíveis. A configuração inicial registra regras e preferências; o snapshot também mostra preferências, modo e viewport atuais. Mudanças de preferências e viewport geram eventos locais. Identidade da campanha, tentativa, renascimentos e origens de entrada permanecem separados.

`tools/summarize-playtest.cjs` conserva versão/configuração/arena, marca de auxílio e entradas, inclusive em simulações assistidas. Deduplica somente a mesma campanha/tentativa no mesmo contexto de versão/configuração/arena; exports antigos sem esses campos continuam legíveis e são marcados como desconhecidos, sem atribuição retroativa da versão atual.
