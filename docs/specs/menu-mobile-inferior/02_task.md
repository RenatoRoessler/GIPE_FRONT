# Task 02: Barra inferior

**Status:** ✅ Concluída  
**Dependências:** Task 01

## Objetivo

Entregar a barra fixa com os quatro itens, isolada e testada, sem ainda estar ligada ao layout.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/layout/BottomNav/BottomNav.tsx` — `<nav aria-label="Navegação principal">` com três links e o botão Menu (`aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`). Nesta task aceita `onMenuClick` e `menuOpen` como props; o painel entra na Task 03.
- `src/components/layout/BottomNav/BottomNav.styles.ts` — barra, itens, estados, `display: none` a partir de `breakpoints.lg`, recuo `env(safe-area-inset-bottom)`.
- `src/components/layout/BottomNav/BottomNav.test.tsx`
- `src/components/layout/BottomNav/index.ts`

**Arquivos a editar:**
- Nenhum.

## Critérios de Aceite

- [ ] Quatro itens em colunas iguais, cada um com ícone de 24px e nome de 12px; alvo de toque de pelo menos 44px.
- [ ] Item da rota atual em `primary`, com pílula `primarySoft` atrás do ícone, marca de 3px no topo e `aria-current="page"`.
- [ ] Item Menu destacado quando `isMenuTabActive` for verdadeiro ou o painel estiver aberto.
- [ ] Foco visível em `warn` com anel escuro; só tokens do tema.
- [ ] Barra oculta a partir de `breakpoints.lg`; altura `bottomNavHeight` mais a área segura.

## Testes

- [ ] Componente: renderiza Início, Entrada, Saída e Menu com os endereços certos.
- [ ] Componente: `aria-current="page"` só no item da rota atual (incluindo rotas filhas).
- [ ] Componente: Menu destacado em `/caixa` e não em `/veiculos/saida`.
- [ ] Componente: botão Menu expõe `aria-expanded` conforme `menuOpen` e chama `onMenuClick`.

## Notas de Implementação

Tech Spec, "Componentes"; `design.md`, "Barra (fechada)". Mock de `usePathname` como em `Gantry.test.tsx`.
