# Task 02: Dados de navegação

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

Fazer a lista de navegação distinguir itens de link e itens de ação, com Entrada e Saída como ações, sem alterar nenhuma tela ainda.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/lib/nav.ts` — `NavItem` vira união de item de link (`label`, `href`, `icon`) e item de ação (`label`, `acao: "entrada" | "saida"`, `icon`); `isNavAction(item)`; `NAV_ITEMS` com Entrada e Saída como ações (mesma ordem, rótulos e ícones); `isNavActive(pathname, item)` (falso para ações); `BOTTOM_NAV_ITEMS` derivados por `href` ou `acao`; `isMenuTabActive` verdadeiro em toda tela que não seja o Início.
- `src/lib/nav.test.ts` — ajusta e acrescenta casos.
- Consumidores que usam `item.href` como chave ou destino (`Gantry`, `BottomBar`, `MenuSheet`, `NavSign`) — só o necessário para compilar; o comportamento dos botões vem na Task 03.

## Critérios de Aceite

- [ ] `NAV_ITEMS` mantém dez itens, na mesma ordem e com os mesmos rótulos e ícones.
- [ ] Entrada e Saída são itens de ação; os demais, de link.
- [ ] `isNavActive` é falso para ações e igual a `isNavItemActive` para links.
- [ ] `isMenuTabActive` é falso em `/dashboard` e rotas filhas, e verdadeiro nas demais rotas.
- [ ] A chave de lista de cada item é única (`href` ou `acao`).

## Testes

- [ ] Unitário: Entrada e Saída são ações e os outros oito são links.
- [ ] Unitário: não repete chave nem ícone.
- [ ] Unitário: `isNavActive` para link atual, link filho, link parecido e ação.
- [ ] Unitário: `isMenuTabActive` em `/dashboard`, `/caixa` e `/patio`.
- [ ] Unitário: `BOTTOM_NAV_ITEMS` é Início (link), Entrada e Saída (ações).

## Notas de Implementação

Tech Spec, "Dados de navegação". Os tipos obrigam cada consumidor a tratar os dois casos.
