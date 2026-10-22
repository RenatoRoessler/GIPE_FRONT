# Task 03: Painel do Menu

**Status:** ✅ Concluída  
**Dependências:** Task 02

## Objetivo

Fazer o botão Menu abrir o painel com todas as telas, com o comportamento de abrir e fechar do menu atual.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/layout/BottomNav/MenuSheet.tsx` (ou dentro do `BottomNav`) — `<dialog>` com título "Menu", botão de fechar de 44×44px e lista de `NAV_ITEMS` (ícone, nome, seta; a atual com `aria-current` e fundo `primarySoft`).
- Testes do painel (arquivo próprio ou casos no `BottomNav.test.tsx`).

**Arquivos a editar:**
- `src/components/layout/BottomNav/BottomNav.tsx` — o botão Menu abre o painel via `showModal()`; o estado do painel fica no componente.
- `src/components/layout/BottomNav/BottomNav.styles.ts` — folha que sobe da base, cantos superiores de 22px, sombra `md`, altura máxima de 82%, rolagem interna, alça `steel`, backdrop; animação só sob `prefers-reduced-motion: no-preference`.

## Critérios de Aceite

- [ ] Menu abre o painel com todas as telas do menu atual, na mesma ordem e com os mesmos nomes.
- [ ] A tela atual aparece marcada e com `aria-current="page"`.
- [ ] O painel fecha ao escolher uma tela, tocar no fundo, tocar em fechar ou pressionar Esc.
- [ ] Ao fechar sem escolher, o foco volta ao botão Menu.
- [ ] O painel fecha se a tela crescer até `breakpoints.lg` e quando a rota muda.
- [ ] Sem animação com movimento reduzido.

## Testes

- [ ] Componente: abre com Menu e lista os dez itens.
- [ ] Componente: item da rota atual marcado.
- [ ] Componente: fecha com fechar, Esc, clique no fundo e mudança de rota.
- [ ] Componente: o foco volta ao botão Menu ao fechar.
- [ ] Componente: `aria-expanded` acompanha o estado do painel.

## Notas de Implementação

Tech Spec, "Componentes" e "Decisões" (`<dialog>` nativo). Reaproveitar a lógica de `MobileNav.tsx`; jsdom não implementa `<dialog>`, usar o mesmo remendo dos testes de modais.
