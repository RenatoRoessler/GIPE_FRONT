---
description: Commita (se necessário), faz push e abre um Pull Request no padrão do projeto
---

Prepare e abra um Pull Request da branch atual seguindo o padrão do projeto.

## Passos

1. Rode `git status` para ver o estado. Se houver mudanças não commitadas, siga o fluxo do `/commit` (padrão `<tipo>(FID-XXXX): <descrição>`) para commitar antes de abrir o PR — confirmando a mensagem com o usuário.
2. Extraia o `FID-XXXX` da branch atual (`git branch --show-current`).
3. Faça `git push -u origin <branch>` da branch atual.
4. Determine a branch base. O default do projeto é `dev` — confirme com o usuário se deve ser outra.
5. Abra o PR com `gh pr create` usando:
   - **Título**: mesmo padrão do commit → `<tipo>(FID-XXXX): <descrição resumida da entrega>`.
   - **Body**: resumo objetivo do que foi entregue (bullet points do que mudou, baseado nos commits/diff da branch), em PT-BR. **Não** adicione assinaturas nem rodapés gerados por ferramenta.
6. Mostre o link do PR ao usuário.

$ARGUMENTS

## Regras

- Confirme o título e o body do PR com o usuário **antes** de criar.
- Se a branch atual for a base (`dev`), **não** abra PR — avise o usuário e sugira criar uma feature branch primeiro.
- Use `gh` para operações com o GitHub. Se `gh` não estiver autenticado, avise o usuário.
- **Nunca** use `--force` no push sem o usuário pedir explicitamente.
