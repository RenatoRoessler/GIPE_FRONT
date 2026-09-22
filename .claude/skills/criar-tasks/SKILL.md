---
name: criar-tasks
description: Quebra um Tech Spec já aprovado em uma lista de tasks pequenas e executáveis. Use depois que o techspec.md de uma feature existir, antes de começar a implementar código.
---

# Criar Tasks

Quarta etapa do fluxo spec-driven:

```
criar-prd → claude-design → criar-techspec → criar-tasks → executar-task
```

## Pré-requisitos
- Deve existir `docs/specs/<slug>/prd.md` e `docs/specs/<slug>/techspec.md`.

## Processo
1. Ler o Tech Spec e transformar a "Arquitetura da solução" em uma lista ordenada de tasks pequenas (cada uma implementável e verificável isoladamente — idealmente 1 task = 1 arquivo ou uma mudança coesa pequena).
2. Cada task deve ter: id, descrição objetiva, arquivos envolvidos, e critério de "pronto".
3. Ordenar por dependência (o que precisa existir antes do quê).
4. Escrever em `docs/specs/<slug>/tasks.md` usando o template abaixo. Todas começam como `[ ]` (pendente).

## Template (`tasks.md`)
```markdown
# Tasks: <Nome da Feature>

Referências: ./prd.md, ./techspec.md

- [ ] T1 — <descrição objetiva>
  - Arquivos: <paths>
  - Pronto quando: <critério verificável>

- [ ] T2 — ...
  - Arquivos: ...
  - Pronto quando: ...
```

## Próximo passo
Usar a skill `executar-task` para implementar as tasks uma a uma, marcando `[x]` no `tasks.md` conforme concluídas.
