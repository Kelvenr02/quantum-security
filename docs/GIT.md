# Controle de versão

O repositório preserva o jogo original antes da reformulação da introdução.

- Repositório: https://github.com/Kelvenr02/quantum-security
- Branch principal: `main`.
- Ponto de referência original: tag `v0.1.0-original`.
- A tag registra o código, testes, pitch e materiais existentes em `output/`.
- `.pitch-build/` contém arquivos temporários de produção das apresentações e permanece apenas no computador.
- O GitHub Actions verifica a sintaxe e executa os testes em pushes para `main` e em pull requests.

## Alterações futuras

Crie uma branch para cada conjunto de alterações:

```sh
git switch main
git pull --ff-only
git switch -c feat/introducao-interativa
```

Após editar e verificar o jogo:

```sh
node tests/gameplay.cjs
git add <arquivos-alterados>
git commit -m "feat: adicionar treinamento interativo"
git push -u origin feat/introducao-interativa
```

## Consultar o estado original

```sh
git log --oneline --decorate
git diff v0.1.0-original
git switch --detach v0.1.0-original
```

O último comando serve para consultar a versão original. Execute com a árvore de trabalho limpa e retorne à branch de trabalho antes de editar. Para desenvolver a partir da versão original, crie outra branch com `git switch -c nome-da-branch v0.1.0-original`.

As credenciais são gerenciadas pelo Git Credential Manager do Windows. Não inclua tokens ou senhas nos arquivos nem na URL do remoto.
