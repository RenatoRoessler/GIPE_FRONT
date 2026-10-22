# Tasks: Fluxo de Entrada e Saída de Veículos para Mensalista

**PRD:** [prd.md](./prd.md)  
**Tech Spec:** [techspec.md](./techspec.md)  
**Design:** [design.md](./design.md)  
**Criado em:** 2026-10-22

## Índice

| # | Task | Status | Dependências |
|---|------|--------|--------------|
| 01 | [Tipos e utilitários de mensalista](./01_task.md) | ✅ Concluída | — |
| 02 | [InfoCard e CardMensalista](./02_task.md) | ✅ Concluída | — |
| 03 | [Entrada com identificação automática](./03_task.md) | ✅ Concluída | Task 01, Task 02 |
| 04 | [Recibo de entrada](./04_task.md) | ✅ Concluída | Task 01 |
| 05 | [Saída sem cobrança no fluxo](./05_task.md) | ✅ Concluída | Task 01 |
| 06 | [Saída: telas do modal](./06_task.md) | ✅ Concluída | Task 02, Task 05 |
| 07 | [Recibo de saída](./07_task.md) | ✅ Concluída | Task 05 |
| 08 | [Validação final](./08_task.md) | 🔄 Em progresso | Task 01 a Task 07 |

## Status Legend

- ⬜ Pendente
- 🔄 Em progresso
- ✅ Concluída
- ❌ Bloqueada

## Contrato com o back (provisório)

- **Confirmado (Task 03):** `GET /Veiculo/{placa}` devolve `mensalista` e `dadosMensalista` (nome, tipo, situação, horário e dias contratados). Com `dadosMensalista` e `mensalista: false` o cliente é mensalista fora do plano e entra como rotativo, com aviso.
- **Ainda provisório (Task 05), precisa de confirmação do back:** `POST /Patio/{id}/saida` aceita `valor: 0` com a forma padrão (Dinheiro) para mensalista, sem lançar valor no caixa (Task 05).

Se algum ponto não se confirmar, marcar a task como ❌ Bloqueada e ajustar o Tech Spec antes de continuar.

## Cobertura dos requisitos do PRD

| Requisito | Tasks |
|-----------|-------|
| RF1 Remover o checkbox na entrada | 03 |
| RF2 Card de mensalista na entrada | 02, 03 |
| RF3 Sem card quando não é mensalista | 03 |
| RF4 Entrada registrada como mensalista | 01, 03, 04 |
| RF5 Card de mensalista na saída | 02, 06 |
| RF6 Saída de mensalista sem cobrança | 01, 05, 06, 07 |
| RF7 Saída de avulso inalterada | 05, 06, 07, 08 |
