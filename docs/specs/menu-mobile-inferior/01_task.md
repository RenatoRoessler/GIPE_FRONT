# Task 01: Tema e dados de navegação

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

Preparar o token de altura da barra e as regras puras de navegação, usados pelas demais tasks, sem alterar nenhuma tela.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/styles/theme.ts` — `layout: { bottomNavHeight: "64px" }` em `shared` (todos os temas herdam).
- `src/lib/nav.ts` — `BOTTOM_NAV_ITEMS` (Início, Entrada, Saída, derivados de `NAV_ITEMS` por `href`, com rótulo curto) e `isMenuTabActive(pathname)`.
- `src/lib/nav.test.ts` — novos casos.

## Critérios de Aceite

- [ ] O token existe nos quatro temas e o tipo `AppTheme` o reconhece.
- [ ] `BOTTOM_NAV_ITEMS` tem os três atalhos, na ordem Início, Entrada, Saída, com `href` e ícone vindos de `NAV_ITEMS`.
- [ ] `isMenuTabActive` é falso em `/dashboard`, `/veiculos/entrada` e `/veiculos/saida` (e rotas filhas) e verdadeiro nas demais rotas.
- [ ] Nada mais muda de comportamento; lint e tipos passam.

## Testes

- [ ] Unitário: cada atalho de `BOTTOM_NAV_ITEMS` existe em `NAV_ITEMS` (mesmo `href` e ícone).
- [ ] Unitário: `isMenuTabActive` para `/dashboard`, `/veiculos/entrada/x`, `/caixa`, `/patio`, `/mensalistas`.
- [ ] Unitário: o token de altura está presente nos quatro temas.

## Notas de Implementação

Tech Spec, "Dados" e "Tema". Reaproveitar `isNavItemActive`.
