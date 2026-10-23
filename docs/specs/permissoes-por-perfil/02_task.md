# Task 02: Matriz de permissões

**Status:** ✅ Concluída  
**Dependências:** Task 01

## Objetivo

> Criar a fonte única da matriz de permissões padrão e as funções que o proxy, o menu e as telas vão consultar (RF2 a RF4, RF6, RF7 do PRD).

## Contexto Técnico

**Arquivos a criar:**
- `src/lib/permissoes.ts` — `AREA`, tipo `Area`, `PERMISSOES_PADRAO`, `podeAcessar(perfil, area, overrides?)`, `areaDaRota(pathname)`, tipo `PermissoesPorModulo` (gancho, sem uso por enquanto).
- `src/lib/permissoes.test.ts`

**Arquivos a editar:**
- Nenhum.

## Critérios de Aceite

- [x] A matriz reproduz exatamente a tabela do PRD (Caixa/turnos/movimentos, Sangria, Histórico, Pátio, Preços, Mensalistas, Notas fiscais, Empresa, Usuários).
- [x] Provisórios documentados em comentário: `Relatorios` e `Mensalistas` = Administrador e Gerente.
- [x] `podeAcessar(null, area)` só libera `Inicio`.
- [x] Perfis de conveniada sem regra definida (Gerente/Usuário Conveniada) só acessam `Inicio`; Administrador Conveniada acessa `Usuarios`.
- [x] `areaDaRota` mapeia por prefixo e devolve `null` para `/usuario/editar`, `/atualizacoes` e `/acesso-negado`, sem confundir `/usuario` com `/usuarios`.
- [x] O parâmetro `overrides` é aceito e, quando presente, substitui a regra padrão da área; ninguém o passa ainda.

## Testes

- [x] Unitário: uma asserção por área × perfil (Administrador, Gerente, Caixa, Manobrista, Financeiro, Administrador Conveniada, `null`).
- [x] Unitário: `areaDaRota` para cada rota de `src/app/(app)` e para rotas filhas (`/precos/novo`, `/precos/123/editar`).
- [x] Unitário: teste que lê as pastas de `src/app/(app)` e falha se alguma rota não tiver área nem estiver numa lista explícita de rotas abertas.
- [x] Unitário: `overrides` sobrescreve o padrão.

## Notas de Implementação

> Tech Spec, seção 2. Sem `if (perfil === ...)` fora deste arquivo. Importar `PERFIL_USUARIO` de `@/types/usuario`. Sem dependência de browser (será usado no proxy).
