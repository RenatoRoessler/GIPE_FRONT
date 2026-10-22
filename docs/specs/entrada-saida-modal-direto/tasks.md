# Tasks: Entrada e Saída Direto no Modal

**PRD:** [prd.md](./prd.md)
**Tech Spec:** [techspec.md](./techspec.md)
**Design:** [design.md](./design.md)
**Criado em:** 2026-10-22

## Índice

| # | Task | Status | Dependências |
|---|------|--------|--------------|
| 01 | [Host dos modais](./01_task.md) | ✅ Concluída | — |
| 02 | [Dados de navegação](./02_task.md) | ✅ Concluída | — |
| 03 | [Menus abrem o modal](./03_task.md) | ✅ Concluída | Task 01, Task 02 |
| 04 | [Botões e Pátio](./04_task.md) | ✅ Concluída | Task 01 |
| 05 | [Remover páginas e redirecionar](./05_task.md) | ✅ Concluída | Task 03, Task 04 |
| 06 | [Validação final](./06_task.md) | 🔄 Em progresso | Task 01 a Task 05 |

## Status Legend

- ⬜ Pendente
- 🔄 Em progresso
- ✅ Concluída
- ❌ Bloqueada

## Cobertura dos requisitos do PRD

| Requisito | Tasks |
|-----------|-------|
| RF1 Entrada e Saída do menu abrem o modal direto | 01, 02, 03 |
| RF2 Vale no pórtico, na barra inferior e no painel do Menu | 03 |
| RF3 O painel fecha e só o modal fica à vista | 03 |
| RF4 Modal igual a hoje; usuário continua na mesma tela | 01, 03 |
| RF5 A tela atual se atualiza depois de registrar | 04, 06 |
| RF6 Páginas removidas e endereços antigos levam ao Início | 05 |
| RF7 Botões e link que levavam às páginas abrem o modal | 04 |
| RF8 Entrada e Saída não ficam como página atual | 02, 03 |
