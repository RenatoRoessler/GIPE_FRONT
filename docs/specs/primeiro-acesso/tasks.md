# Tasks: Primeiro Acesso (troca de senha obrigatória)

**PRD:** [prd.md](./prd.md)  
**Tech Spec:** [techspec.md](./techspec.md)  
**Design:** [design.md](./design.md)  
**Criado em:** 2026-10-22

## Índice

| # | Task | Status | Dependências |
|---|------|--------|--------------|
| 01 | [Serviço de login e token de troca em memória](./01_task.md) | ✅ Concluída | — |
| 02 | [Tela de primeiro acesso e rota pública](./02_task.md) | ✅ Concluída | Task 01 |
| 03 | [Login encaminha para o primeiro acesso](./03_task.md) | ✅ Concluída | Task 01, Task 02 |
| 04 | [Validação final](./04_task.md) | 🔄 Em progresso | Task 01 a Task 03 |

## Status Legend

- ⬜ Pendente
- 🔄 Em progresso
- ✅ Concluída
- ❌ Bloqueada

## Contrato com o back (a confirmar antes de liberar)

As tasks seguem as suposições do Tech Spec e precisam de confirmação do back na Task 04:
- O back aceita o `passwordChangeToken` do login como autorização de `PUT /api/v1/Usuario/senha`, com a senha temporária como `senhaAtual` (Tasks 01 e 02).
- Prazo de validade do token de troca (Task 02).

## Cobertura dos requisitos do PRD

| Requisito | Tasks |
|-----------|-------|
| RF-01 Encaminhar o primeiro acesso para a troca de senha | 03 |
| RF-02 Definir a nova senha | 02 |
| RF-03 Concluir a troca e voltar ao login | 02 |
| RF-04 Token de troca expirado, inválido ou ausente | 02, 03 |
| RF-05 Erros e feedback | 02 |
