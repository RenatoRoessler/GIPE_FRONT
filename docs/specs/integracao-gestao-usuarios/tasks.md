# Tasks: Integração da Gestão de Usuários

**PRD:** [prd.md](./prd.md)
**Tech Spec:** [techspec.md](./techspec.md)
**Design:** [design.md](./design.md)
**Criado em:** 2026-10-22

## Índice

| # | Task | Status | Dependências |
|---|------|--------|--------------|
| 01 | [Tipos, perfis e serviço de API](./01_task.md) | ✅ Concluída | — |
| 02 | [Esquemas de validação](./02_task.md) | ✅ Concluída | Task 01 |
| 03 | [Sessão real do usuário logado](./03_task.md) | ✅ Concluída | — |
| 04 | [Página e listagem de usuários](./04_task.md) | ✅ Concluída | Task 01, Task 03 |
| 05 | [Novo usuário em duas etapas](./05_task.md) | ✅ Concluída | Task 02, Task 04 |
| 06 | [Editar perfil e acesso](./06_task.md) | ✅ Concluída | Task 04 |
| 07 | [Alterar a própria senha](./07_task.md) | ✅ Concluída | Task 02, Task 03 |
| 08 | [Validação final](./08_task.md) | 🔄 Em progresso | Task 01 a Task 07 |

## Status Legend

- ⬜ Pendente
- 🔄 Em progresso
- ✅ Concluída
- ❌ Bloqueada

## Contrato com o back (a confirmar antes de liberar)

As tasks seguem as suposições do Tech Spec e precisam de confirmação do back na Task 08:
- Formato do erro de "senha atual incorreta" (Task 07): status e texto.
- Tamanho máximo de nome e e-mail, e se o celular aceita máscara (Tasks 02 e 05).
- Se o corpo da conferência de CPF pode levar dados diferentes dos cadastrados (Task 05).
- Vínculo do usuário logado: o e-mail do token é usado como chave (Tasks 03 e 04); o ideal é o back expor `usuarioId` no token ou um endpoint "eu".

## Decisões do PRD ainda abertas

- O Gerente também gerencia usuários? Hoje a tela é restrita ao Administrador (Task 04).
- O perfil Financeiro (8) está no `Select`, mas só deve ir a produção depois do PRD de Permissões.

## Cobertura dos requisitos do PRD

| Requisito | Tasks |
|-----------|-------|
| RF-01 Listar usuários da empresa | 04 |
| RF-02 Consultar CPF antes de cadastrar | 05 |
| RF-03 Dar acesso a pessoa já cadastrada | 05 |
| RF-04 Cadastrar usuário novo | 05 |
| RF-05 Alterar perfil | 06 |
| RF-06 Ativar e inativar usuário | 06 |
| RF-07 Alterar a própria senha | 07 |
| RF-08 Erros e feedback | 04, 05, 06, 07 |
