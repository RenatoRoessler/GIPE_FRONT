# Tasks: Gestão de Mensalistas

**PRD:** [prd.md](./prd.md)  
**Tech Spec:** [techspec.md](./techspec.md)  
**Design:** [design.md](./design.md)  
**Criado em:** 2026-10-15

## Índice

| # | Task | Status | Dependências |
|---|------|--------|--------------|
| 01 | [Base de testes e tipos](./01_task.md) | ✅ Concluída | — |
| 02 | [Documento, celular e esquemas de validação](./02_task.md) | ✅ Concluída | Task 01 |
| 03 | [Serviço de API e mapeadores](./03_task.md) | ✅ Concluída | Task 01, Task 02 |
| 04 | [Componente Tabs no design system](./04_task.md) | ✅ Concluída | Task 01 |
| 05 | [Menu e página de mensalistas (esqueleto)](./05_task.md) | ✅ Concluída | Task 04 |
| 06 | [Aba Tipos de mensalidade: listagem](./06_task.md) | ✅ Concluída | Task 03, Task 05 |
| 07 | [Aba Tipos de mensalidade: cadastro e edição](./07_task.md) | ✅ Concluída | Task 02, Task 03, Task 06 |
| 08 | [Aba Mensalistas: listagem, busca e paginação](./08_task.md) | ✅ Concluída | Task 03, Task 05 |
| 09 | [Aba Mensalistas: cadastro e edição](./09_task.md) | ✅ Concluída | Task 02, Task 03, Task 07, Task 08 |
| 10 | [Validação final](./10_task.md) | 🔄 Em progresso | Task 01 a Task 09 |

## Status Legend

- ⬜ Pendente
- 🔄 Em progresso
- ✅ Concluída
- ❌ Bloqueada

## Cobertura dos requisitos do PRD

| Requisito | Tasks |
|-----------|-------|
| RF-01 Acessar a gestão | 05 |
| RF-02 Listar mensalistas | 08 |
| RF-03 Buscar por documento | 08 |
| RF-04 Cadastrar mensalista | 09 |
| RF-05 Editar e ativar/desativar mensalista | 09 |
| RF-06 Listar tipos | 06 |
| RF-07 Cadastrar tipo | 07 |
| RF-08 Editar e ativar/desativar tipo | 07 |
| RF-09 Feedback e erros | 06, 07, 08, 09 |
