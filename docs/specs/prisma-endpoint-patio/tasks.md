# Tasks: Endpoint de alteração do prisma no pátio

Referências: ./prd.md, ./techspec.md

- [x] T1 — `atualizarPrisma` envia `0` para apagar o prisma e documenta o contrato
  - Arquivos: `src/lib/api/services/patio.ts`, `src/lib/api/services/patio.test.ts`
  - Pronto quando: `atualizarPrisma(54, 45)` chama `PUT /Patio/54/prisma` com `{ prisma: 45 }`; `atualizarPrisma(54, null)` envia `{ prisma: 0 }`; `not_found` e erros de validação seguem; comentário sem `[A CONFIRMAR]` da rota (verbo segue a confirmar); testes atualizados.

- [x] T2 — Cobrir leitura de `0` e permissão por perfil
  - Arquivos: `src/lib/api/services/patio.list.test.ts` (ou `patio.test.ts`), `src/lib/permissoes.test.ts`
  - Nota: já coberto por testes existentes (`patio.list.test.ts` com prisma 0; `permissoes.test.ts` com os quatro perfis em `AREA.Patio`), sem código novo.
  - Pronto quando: `fromPatioResponse` com `prisma: 0` resulta em `prisma: null`; teste confirma que Administrador, Gerente, Caixa e Manobrista acessam `AREA.Patio`.

- [x] T3 — Validação final
  - Arquivos: —
  - Pronto quando: lint sem erros, `tsc` e testes das áreas tocadas passam; `EditarPrismaModal.test.tsx` segue verde; pendência de verbo registrada.
