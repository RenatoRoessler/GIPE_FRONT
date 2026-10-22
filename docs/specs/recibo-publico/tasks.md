# Tasks: Recibo Público da Saída

**PRD:** [prd.md](./prd.md)
**Tech Spec:** [techspec.md](./techspec.md)
**Design:** [design.md](./design.md)
**Criado em:** 2026-10-22

## Índice

| # | Task | Status | Dependências |
|---|------|--------|--------------|
| 01 | [Contrato e dados do recibo](./01_task.md) | ✅ Concluída | — |
| 02 | [Rota pública e proxy](./02_task.md) | ✅ Concluída | — |
| 03 | [Página do recibo](./03_task.md) | ✅ Concluída | Task 01, Task 02 |
| 04 | [PDF do recibo](./04_task.md) | ✅ Concluída | Task 03 |
| 05 | [QR no recibo da tela de saída](./05_task.md) | ✅ Concluída | Task 01 |
| 06 | [Validação final](./06_task.md) | 🔄 Em progresso | Task 01 a Task 05 |

## Status Legend

- ⬜ Pendente
- 🔄 Em progresso
- ✅ Concluída
- ❌ Bloqueada

## Contrato com o back (a confirmar antes de liberar)

A unidade do `valor` já foi confirmada: **reais** (15100.00 = R$ 15.100,00). As tasks seguem as suposições do Tech Spec nos pontos abaixo e precisam de confirmação do back na Task 06:
- Nome e presença do código do recibo (`tokenRecibo`) na resposta que registra a saída (Tasks 01 e 05).
- Campo que indica mensalista na consulta do recibo (Task 03); sem ele, valor zero mostra "Sem cobrança" sem a etiqueta.

## Cobertura dos requisitos do PRD

| Requisito | Tasks |
|-----------|-------|
| RF-01 QR code no recibo da saída | 01, 05 |
| RF-02 Abrir o recibo pelo QR, sem login | 02, 03 |
| RF-03 Dados do recibo | 01, 03 |
| RF-04 Recibo de mensalista | 03, 04, 05 |
| RF-05 Baixar e imprimir | 03, 04 |
| RF-06 Recibo indisponível e erros | 01, 02, 03 |
| RF-07 Página fora dos buscadores | 02 |
