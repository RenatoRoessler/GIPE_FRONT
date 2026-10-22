# Tasks: Nota Fiscal

**PRD:** [prd.md](./prd.md)
**Tech Spec:** [techspec.md](./techspec.md)
**Design:** [design.md](./design.md)
**Criado em:** 2026-10-23

## Índice

| # | Task | Status | Dependências |
|---|------|--------|--------------|
| 01 | [Dados e API de notas](./01_task.md) | ✅ Concluída | — |
| 02 | [Modal de solicitação](./02_task.md) | ✅ Concluída | Task 01 |
| 03 | [Botão no recibo da saída](./03_task.md) | ✅ Concluída | Task 02 |
| 04 | [Botão no recibo público](./04_task.md) | ✅ Concluída | Task 02 |
| 05 | [Tela de notas e menu](./05_task.md) | ✅ Concluída | Task 01 |
| 06 | [Validação final](./06_task.md) | 🔄 Em progresso | Task 01 a Task 05 |

## Status Legend

- ⬜ Pendente
- 🔄 Em progresso
- ✅ Concluída
- ❌ Bloqueada

## Contrato com o back (a confirmar antes de liberar)

As tasks seguem as suposições do Tech Spec e precisam de confirmação do back na Task 06:
- Formato das respostas de pendentes e lançadas (Tasks 01 e 05): as colunas da tela são provisórias.
- Formato aceito das datas de lançadas (Task 01): `AAAA/MM/DD`, como no exemplo.
- Como chega o erro de nota já solicitada: código ou texto (Task 02).
- Código do recibo (`tokenRecibo`) na resposta que registra a saída (Task 03).

## Cobertura dos requisitos do PRD

| Requisito | Tasks |
|-----------|-------|
| RF1 Gerar nota depois da saída | 03 |
| RF2 Solicitar nota na página pública do recibo | 04 |
| RF3 Campos do modal (e-mail, documento, valor travado) | 01, 02 |
| RF4 Solicitação pendente e confirmação | 01, 02 |
| RF5 Nota já solicitada | 02, 03, 04 |
| RF6 Sem cobrança e sem código não oferecem a nota | 03, 04 |
| RF7 Erros claros no modal | 02 |
| RF8 Tela com abas Pendentes e Lançadas, e filtro de período | 01, 05 |
| RF9 Dados mostrados de cada nota | 01, 05 |
| RF10 Tela só de consulta | 05 |
| RF11 Estados da tela | 05 |
| RF12 Acesso e permissão | 05 |
