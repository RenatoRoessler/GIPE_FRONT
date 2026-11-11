# Tech Spec: Endpoint de alteração do prisma no pátio

## Referências
- PRD: ./prd.md
- Design: ./design.md (sem mudança visual)

## Design
Sem alterações de tela, componente ou token.

## Arquitetura da solução
O contrato novo difere do assumido em um ponto: "sem prisma" é `0`, não `null`.
- `src/lib/api/services/patio.ts`: `atualizarPrisma(patioId, prisma: number | null)` mantém a assinatura (o modal segue trabalhando com `null` = vazio) e converte na borda: `api.put(`/Patio/${patioId}/prisma`, { prisma: prisma ?? 0 })`. Remove o `[A CONFIRMAR]` da rota e documenta que `0` significa "sem prisma". `not_found` continua virando `ApiError("not_found", "O veículo não está no pátio.", 404)`.
- Leitura: `lerPrisma` já trata `0` (fora de 1 a 999) como `null`; só ganha teste explícito.
- Permissão: `AREA.Patio` já libera Administrador, Gerente, Caixa e Manobrista em `src/lib/permissoes.ts`, e a permissão por módulo já filtra a rota. Nenhuma mudança; apenas conferir em teste.
- Server vs Client: nada novo; tudo existente.

## Decisões técnicas e trade-offs
- Conversão `null → 0` só no serviço: a UI e o schema não conhecem a convenção do back, que fica isolada em um ponto.
- Verbo mantido em `PUT` (não informado no `input.md`); trocar é uma linha em `atualizarPrisma`.

## Riscos / pontos de atenção
- Verbo HTTP não confirmado.
- Se o back também exigir `0` na entrada de veículos, é outro ajuste (fora de escopo).

## Fora de escopo técnico
Entrada de veículos, validação do campo, histórico e unicidade.
