# Task 05: Menu e barra inferior filtrados

**Status:** ✅ Concluída  
**Dependências:** Task 02

## Objetivo

> Mostrar no menu lateral, no menu mobile e na barra inferior apenas os itens permitidos ao perfil, sem piscar itens proibidos durante o carregamento (RF2 do PRD, tela 1 do `design.md`).

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/lib/nav.ts` — campo `area: Area` em cada item; `navItemsPermitidos(perfil)` e `bottomNavItemsPermitidos(perfil)` (substitui a constante `BOTTOM_NAV_ITEMS`, mantendo a derivação e os rótulos curtos).
- `src/lib/nav.test.ts` — cobrir filtro por perfil.
- `src/components/layout/Gantry/Gantry.tsx` (+ teste) — usar `useCurrentUser()` e o filtro; `Skeleton` enquanto `isLoading`.
- `src/components/layout/BottomNav/BottomBar.tsx` (+ teste) — idem; itens dividem a largura sem buracos.
- `src/components/layout/BottomNav/MenuSheet.tsx` — idem.

## Critérios de Aceite

- [x] Cada perfil vê no menu somente os itens da sua linha na matriz (ver tabela do `design.md`).
- [x] Início é sempre visível a quem está autenticado.
- [x] Perfil sem acesso ao Pátio (Financeiro) não vê Entrada, Saída nem Pátio, nem na barra inferior.
- [x] Enquanto o perfil não é conhecido, aparece `Skeleton` com a mesma altura/largura, nunca o menu completo.
- [x] Perfil `null` vê apenas Início.
- [x] Itens ocultos não ficam na árvore de acessibilidade.
- [x] A barra inferior mantém o item "Menu" sempre presente e funciona em desktop e mobile.

## Testes

- [x] Unitário (`nav.test.ts`): `navItemsPermitidos` e `bottomNavItemsPermitidos` por perfil, incluindo `null`.
- [x] Componente: `Gantry` por perfil (Manobrista sem Preços/Usuários/Empresa; Financeiro com Notas Fiscais e sem Pátio).
- [x] Componente: `BottomBar` e `MenuSheet` por perfil, e estado de carregamento com `Skeleton`.
- [x] Componente: itens de ação (Entrada/Saída) continuam abrindo seus modais para quem tem acesso.

## Notas de Implementação

> Tech Spec, seção 5. `useCurrentUser().isLoading` é `true` no servidor e na hidratação. Os testes existentes de `AppShell`/`BottomNav` precisam de um provider de usuário com perfil permitido. Hoje `BOTTOM_NAV_ITEMS` lança erro se faltar item: manter essa proteção sobre `NAV_ITEMS` (não sobre o resultado filtrado).
