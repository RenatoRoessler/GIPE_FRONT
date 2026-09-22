---
name: criar-tasks
description: Creates a detailed, incremental task list from a PRD and Tech Spec. Each task must be a functional deliverable with tests. Shows high-level task list for approval before generating files. Use after PRD and Tech Spec are approved. Do not use without both documents, do not implement anything, and do not generate files before user approval.
argument-hint: '[feature-name]'
---

# Criar Tasks

## Pré-condições

- Requer `docs/spec/[slug]/prd.md`
- Requer `docs/spec/[slug]/techspec.md`
- **MOSTRAR lista high-level para aprovação ANTES de gerar qualquer arquivo**
- Não implementar nada — apenas criar documentos de planejamento

## Step 1: Ler os Documentos Base

1. Leia o PRD: `docs/spec/[slug]/prd.md`.
2. Leia a Tech Spec: `docs/spec/[slug]/techspec.md`.
3. Identifique todos os entregáveis funcionais distintos derivados dos requisitos.

## Step 2: Planejar as Tasks (High-Level)

Crie uma lista de tasks seguindo estes princípios:

- **Cada task é um entregável funcional e incremental** — ao final de cada task, o código deve funcionar
- **Ordem de dependência**: infra/tipos → serviços/API → store/hooks → componentes → testes → integração
- **Granularidade**: nem tão pequena (um arquivo só) nem tão grande (uma task por módulo)
- **Cobertura de testes**: cada task deve incluir os testes que a validam

**Formato da lista high-level:**

```
Task 01: [Título] — [entregável e critério de conclusão]
Task 02: [Título] — [entregável e critério de conclusão]
...
```

**Apresente esta lista ao usuário e aguarde aprovação antes de prosseguir.**

## Step 3: Gerar os Arquivos de Tasks

Após aprovação do usuário:

1. Leia `assets/tasks-index-template.md` e `assets/task-template.md`.
2. Gere `docs/spec/[slug]/tasks.md` com o índice de todas as tasks.
3. Para cada task, gere `docs/spec/[slug]/[num]_task.md` com:
   - Título e objetivo
   - Contexto técnico (arquivos a criar/editar)
   - Critérios de aceite (lista de checkboxes)
   - Testes necessários (lista de checkboxes)
   - Dependências (tasks anteriores)

## Step 4: Revisão Final

Verifique o checklist antes de entregar:

- [ ] Todas as tasks são entregáveis funcionais e incrementais
- [ ] Cada task tem conjunto de testes definido
- [ ] Ordem respeita dependências técnicas
- [ ] Cobertura completa de todos os requisitos do PRD
- [ ] Nenhuma task requer outra não-listada como pré-requisito

Informe o usuário que o próximo passo é implementar com `/executar-task`.

## Error Handling

- Se o PRD ou TechSpec estiverem incompletos, sinalize quais seções faltam antes de prosseguir.
- Se uma task ficar muito grande, quebre em sub-tasks menores com dependência explícita.
