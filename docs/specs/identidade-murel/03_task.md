# Task 03: Dados de navegação

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

> Preparar a lógica pura da barra adaptável: rótulos curtos, ordem de prioridade e divisão entre itens visíveis e excedentes, sem mexer ainda na interface.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/lib/nav.ts`
  - `shortLabel` em `NavLinkItem` e `NavActionItem` (Início, Entrada, Saída, Preços, Usuários, Mensalistas, Pátio, Caixa, Notas, Relatórios, Empresa).
  - `navItemsPorPrioridade(perfil)`: filtra por permissão e ordena Início, Entrada, Saída e depois a ordem de `NAV_ITEMS`.
  - `dividirItensDaBarra(itens, capacidade)`: tudo visível se couber; senão `capacidade - 1` itens (mínimo de 3 slots) e o resto em excedentes.
  - `isMaisAtivo(pathname, excedentes)` reaproveitando `isNavActive`.
  - Manter `BOTTOM_NAV_ITEMS`, `BOTTOM_NAV_LABELS`, `bottomNavItemsPermitidos` e `isMenuTabActive` até a Task 05 (a barra atual ainda os usa).
- `src/lib/nav.test.ts`

## Critérios de Aceite

- [x] Todo item de `NAV_ITEMS` tem `shortLabel`.
- [x] Início, Entrada e Saída sempre vêm primeiro na ordem de prioridade.
- [x] Com capacidade ≥ total, não há excedentes (e portanto não há "Mais").
- [x] Com capacidade menor, `visiveis.length + 1` slots são usados; nunca menos de 3 slots.
- [x] Item ativo entre os excedentes torna `isMaisAtivo` verdadeiro.
- [x] A barra e o app atuais continuam funcionando (nada removido ainda).

## Testes

- [x] `dividirItensDaBarra` com capacidades 1, 2, 3, 5 e 11, e total menor que a capacidade.
- [x] `navItemsPorPrioridade` para perfis com menos itens permitidos.
- [x] `isMaisAtivo` com rota em item visível, em excedente e fora do menu.
- [x] Ordem de prioridade estável entre chamadas.

## Notas de Implementação

> Techspec seção 3 (Dados). A prioridade corrige a suposição do PRD (ordem atual do menu): registrar no ponto em aberto do PRD ao concluir.

## Registro da execução

- `dividirItensDaBarra` é genérica (`<T>`) e trata o mínimo de três espaços assim: com até três itens (ou capacidade menor que três) a barra mostra tudo; acima disso mostra `max(capacidade, 3) - 1` itens e o resto vai para os excedentes. Isso evita um "Mais" que esconderia um único item.
- `isMaisAtivo` só olha a rota. O estado "painel aberto" continua no componente (Task 05), como no `isMenuTabActive` atual.
- `shortLabel` ficou com até 11 caracteres; "Mensalistas" e "Relatórios" são os maiores e precisam caber em 64px na Task 05 (conferir lá, com reticências se preciso).
- Mantidos até a Task 05: `BOTTOM_NAV_ITEMS`, `BOTTOM_NAV_LABELS`, `bottomNavItemsPermitidos` e `isMenuTabActive`.
- Verificado: `npx tsc --noEmit` sem erros, ESLint sem avisos nos dois arquivos, 47 testes de `nav.test.ts` passam e os 649 testes de `src/components/layout` e `src/lib` passam.
- Ordem de prioridade (Início, Entrada, Saída e depois a ordem do menu) é a que o design.md definiu; falta ainda atualizar o ponto em aberto do PRD (feito na Task 11).
