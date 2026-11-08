# Tasks: Menu Organizado em Grupos

Referências: ./prd.md, ./techspec.md (e ./design.md para a composição visual)

- [x] T1 — Estrutura de dados em `nav.ts`: criar `GRUPOS_NAV` (Financeiro, Configurações, Operação, nesta ordem) e `GrupoNavId`; acrescentar `grupo?: GrupoNavId` aos tipos de item; **reordenar `NAV_ITEMS`** para a sequência do PRD (Financeiro: Financeiro, Caixa, Faturas, Notas Fiscais; Configurações: Minha Empresa, Gestão de Preços, Quadros de Chaves, Mensalistas, Gestão de Usuários, Empresas conveniadas; Operação: Dashboard, Pátio, Entrada de Veículos, Saída de Veículos, Conferência de pátio; no fim, sem grupo: Carimbar ticket e Pátio da conveniada) e preencher o `grupo` de cada item; criar `agruparItens(itens): GrupoNav[]` (ordem de `GRUPOS_NAV`, só grupos com itens, bloco sem grupo no fim, ordem interna preservada). Não mexer em `BAR_PRIORITY`, `BARRA_FIXA`, `montarBarraFixa` nem `dividirItensDaBarra`. Atualizar `nav.test.ts`: `NAV_ITEMS` na nova ordem e com o `grupo` certo (sem grupo só os dois itens de conveniada), testes novos de `agruparItens` (ordem dos grupos, omissão de grupo vazio, bloco sem grupo no fim, ordem interna preservada, lista vazia) e as listas de ordem de `navItemsPermitidos` (Gerente, Caixa, Financeiro, conveniada), `navItemsPorPrioridade`, `dividirItensDaBarra` e `ordenarPeloMenu`.
  - Arquivos: `src/lib/nav.ts`, `src/lib/nav.test.ts`
  - Pronto quando: `tsc` e os testes de `nav.test.ts` passam; a lista plana de `NAV_ITEMS` coincide com a ordem agrupada; a prioridade da barra (Pátio, Entrada, Saída, Caixa) e a barra de cinco posições continuam como antes.

- [x] T2 — Ajustar os testes de componentes que dependem da ordem plana, sem mudar ainda a tela: `SideNav.test.tsx` (lista de nomes na nova ordem), `BottomNav.test.tsx` (`TODOS_DO_PAINEL`, a lista do painel do Administrador e a do Gerente, e a barra adaptativa do Financeiro, que passa a começar por "Financeiro") e `BottomBar.test.tsx` se algum caso depender da ordem.
  - Arquivos: `src/components/layout/SideNav/SideNav.test.tsx`, `src/components/layout/BottomNav/BottomNav.test.tsx`, `src/components/layout/BottomNav/BottomBar.test.tsx`
  - Pronto quando: a suíte de `src/components/layout` passa com `NAV_ITEMS` na nova ordem.
  - Depende de: T1

- [x] T3 — Menu lateral agrupado: em `SideNav.tsx`, `agruparItens(itens)` e render de uma lista de grupos dentro de um contêiner rolável; cada grupo é um `<li>` com a linha de título (só se houver título: `Traco` decorativo com `aria-hidden` e `TituloTexto` com `id` de `useId()` + `grupo.id`) e a lista de itens com `aria-labelledby` (sem rótulo no bloco sem grupo), mantendo o markup de item atual (Entrada e Saída como botão que abre o modal, link com `aria-current`). Em `SideNav.styles.ts`: `Grupos` (`flex: 1`, `min-height: 0`, `overflow-y: auto`, barra de rolagem escondida), `TituloGrupo` (altura `space[4]` nos dois estados), `Traco` (24px por 1px, cor `border`, centralizado na coluna dos ícones) e `TituloTexto` (`fontSizes.xs`, `fontWeights.bold`, `textMuted`, recuo de 17px, `opacity: 0`); na regra `hover`/`focus-within` do `Aside`, `TituloTexto` visível e `Traco` apagado, com a transição só sob `prefers-reduced-motion: no-preference`; `VersaoLink` fica fora do contêiner rolável. Só tokens do tema.
  - Arquivos: `src/components/layout/SideNav/SideNav.tsx`, `src/components/layout/SideNav/SideNav.styles.ts`
  - Pronto quando: `tsc` e lint passam; o menu lateral renderiza os três grupos em ordem, cada um como lista nomeada pelo título; nenhum valor visual solto.
  - Depende de: T1

- [x] T4 — Testes do menu lateral: os três títulos na ordem certa para o Administrador, cada item dentro da lista do seu grupo; perfil com poucos itens (Caixa, Financeiro) sem título de grupo vazio; perfil de conveniada sem títulos nem traços; item atual com `aria-current`; Entrada e Saída abrem o modal; o título continua no DOM com o menu recolhido (lido pelo leitor de tela).
  - Arquivos: `src/components/layout/SideNav/SideNav.test.tsx`
  - Pronto quando: os testes novos e os existentes de `SideNav.test.tsx` passam.
  - Depende de: T3

- [x] T5 — Painel "Mais" agrupado: em `MenuSheet.tsx`, `agruparItens(itens)` por dentro e, para cada grupo, `GrupoPainel` com `GrupoTitulo` (com `id` de `useId()` + `grupo.id`, só se houver título) e um `SheetList` com `aria-labelledby`; cada item mantém o markup atual (ação ou link, `aria-current`, `onClick` que fecha o painel). Em `BottomNav.styles.ts`: `GrupoPainel` (`space[3]` acima, exceto o primeiro) e `GrupoTitulo` (`fontSizes.sm`, `fontWeights.bold`, `textMuted`, `space[1]` abaixo). `BottomNav.tsx` não muda.
  - Arquivos: `src/components/layout/BottomNav/MenuSheet.tsx`, `src/components/layout/BottomNav/BottomNav.styles.ts`
  - Pronto quando: `tsc` e lint passam; o painel mostra os grupos com título, sem repetir Pátio, Caixa, Entrada e Saída e sem grupo vazio; a divisória fica só dentro de cada grupo.
  - Depende de: T1

- [x] T6 — Testes do painel: títulos e itens por grupo na ordem certa para o Administrador (Financeiro: Financeiro, Faturas, Notas Fiscais; Configurações completo; Operação: Dashboard e Conferência de pátio), perfil de conveniada sem títulos, grupo omitido quando todos os seus itens estão na barra, Entrada e Saída no painel (barra adaptativa) abrindo o modal, e cada grupo como lista nomeada. A barra inferior, a barra de cinco posições e o foco ao fechar seguem sem mudança (testes existentes passando).
  - Arquivos: `src/components/layout/BottomNav/BottomNav.test.tsx` (e um `MenuSheet.test.tsx` se a cobertura isolada ficar mais clara)
  - Pronto quando: os testes novos e os de `BottomNav`, `BottomBar` e `useBarCapacity` passam.
  - Depende de: T2, T5

- [ ] T7 — Verificação final: `npm run lint`, a suíte de testes e `npm run build`; conferir os critérios de aceite do `prd.md`; conferir visualmente (skill `run`), em 720px e 1080px de altura (menu lateral) e em 375px e 768px (painel), nos temas claro e escuro: menu recolhido com os traços, expansão sem os itens se moverem, rolagem interna e foco por teclado em tela baixa, painel com os grupos e a barra inferior igual, perfil de conveniada sem títulos. Anotar no `tasks.md` o que não pôde ser conferido.
  - Arquivos: nenhum novo (ajustes pontuais conforme a conferência)
  - Pronto quando: lint, testes e build passam sem erros; os critérios de aceite do PRD foram conferidos; o que ficou sem conferência está anotado.
  - Depende de: T4, T6
  - Andamento: `tsc`, lint (0 erros), build e testes de menu passam (T1 a T6 feitas). **Não conferido**: a verificação visual do menu lateral em 720px e 1080px de altura (traços, expansão sem os itens se moverem, rolagem interna e foco por teclado) e do painel em 375px e 768px, nos dois temas, porque o app exige login no back. A suíte completa tem as mesmas 4 falhas de 403 de antes (MinhaEmpresa, UsuariosList, CaixaPage, PrecosMasterDetail), em módulos que esta feature não toca.
