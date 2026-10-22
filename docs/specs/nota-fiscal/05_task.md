# Task 05: Tela de notas e menu

**Status:** ✅ Concluída  
**Dependências:** Task 01

## Objetivo

Entregar a tela "Notas Fiscais" com as abas Pendentes e Lançadas e o item no menu.

## Contexto Técnico

**Arquivos a criar:**
- `src/app/(app)/notas-fiscais/page.tsx` — `metadata` "Notas Fiscais — GIPE" e `Suspense`.
- `src/components/notas/NotasFiscaisPage/` (página com `Tabs` e aba na URL), `NotasList/` (tabela/cartões, carregando, vazio, erro, resumo), `FiltroPeriodo/` (De, Até e Filtrar), `useNotas.ts` (`useNotasPendentes`, `useNotasLancadas`, chaves de consulta), com testes.

**Arquivos a editar:**
- `src/lib/nav.ts` — item `{ label: "Notas Fiscais", href: "/notas-fiscais", icon: "invoice" }` depois de Caixa; `NavIconId` ganha `"invoice"`.
- `src/components/layout/NavSign/NavIcons.tsx` — ícone de documento no traço 2,4.
- `src/lib/nav.test.ts`, `src/components/layout/BottomNav/BottomNav.test.tsx` — de 10 para 11 itens.

## Critérios de Aceite

- [ ] O menu (pórtico e painel do celular) mostra "Notas Fiscais" depois de Caixa, e a barra inferior continua com quatro itens.
- [ ] Pendentes: lista as solicitações, mais antigas primeiro, com resumo de quantidade e total.
- [ ] Lançadas: filtro De/Até começando no mês atual, mais recentes primeiro, com resumo; período inválido mostra o erro e não consulta.
- [ ] Estados: carregando (anunciado), vazio nas duas abas, erro com "Tentar novamente"; 403 mostra só o aviso de permissão.
- [ ] A aba ativa fica na URL; celular mostra cartões.
- [ ] Só as colunas com dado aparecem, sem "null".

## Testes

- [ ] Componente: cada aba com lista, vazio, carregando, erro e 403.
- [ ] Componente: filtro de período (padrão, aplicar, inválido).
- [ ] Componente: resumo (contagem e total) e ordem das linhas.
- [ ] Unitário: `nav.ts` com 11 itens, ícones únicos e `isMenuTabActive` em `/notas-fiscais`.
- [ ] Verificação: o build lista `/notas-fiscais`.

## Notas de Implementação

Tech Spec, "Tela da empresa" e `design.md`. Mesmo padrão das listas de Mensalistas (`ListError`, `EmptyState`, `TableArea`). Colunas **[A DEFINIR]** conforme a resposta real das listas.
