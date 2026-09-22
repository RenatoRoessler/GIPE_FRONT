---
name: executar-task
description: Executa (implementa) uma ou mais tasks pendentes de docs/specs/<slug>/tasks.md, marcando-as como concluídas. Use quando o usuário pedir para "executar as tasks" ou implementar uma feature que já tem tasks.md.
---

# Executar Task

Última etapa do fluxo spec-driven:

```
criar-prd → claude-design → criar-techspec → criar-tasks → executar-task
```

## Pré-requisitos
- Deve existir `docs/specs/<slug>/tasks.md` com pelo menos uma task `[ ]` pendente.

## Processo
1. Abrir `tasks.md` e pegar a próxima task pendente (`[ ]`) respeitando a ordem/dependências.
2. Implementar exatamente o que a task descreve — nada além do escopo da task (evita "aproveitar e já fazer mais coisa").
3. Seguir as skills de qualidade aplicáveis ao código escrito: `code-best-practices`, `styled-components-best-practices`, e `claude-design` para qualquer decisão visual (nunca inventar cor/espaçamento fora do tema).
4. Validar a task (rodar lint/build quando fizer sentido, conferir o "Pronto quando" do tasks.md).
5. Marcar a task como `[x]` em `tasks.md` só depois de validada.
6. Repetir para a próxima task pendente, ou parar se o usuário pediu para executar só uma.

## Ao final de todas as tasks de uma feature
- Rodar `npm run build` e `npm run lint` no projeto.
- Conferir que todos os critérios de aceite do `prd.md` foram atendidos.
