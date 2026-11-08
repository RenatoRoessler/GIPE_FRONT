# Tech Spec: Menu Organizado em Grupos

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e registra as decisões de componente)

## Design
- **Telas/estados:** os de `design.md`: menu lateral recolhido e expandido com linha de título por grupo, painel "Mais" com grupos, perfis com poucos itens, perfil de conveniada sem grupo.
- **Componentes do design system reaproveitados:** `NavIcon`, e os itens e o painel que já existem (`ItemLink`, `ItemButton`, `Rotulo`, `SheetRow`, `IconTile`, `SheetList`, `Sheet`). Nada novo em `src/components/ui`.
- **Componentes novos:** nenhum arquivo de componente. Entram estilos de cabeçalho de grupo em `SideNav.styles.ts` e `BottomNav.styles.ts`.
- **Tokens de tema:** só os existentes (`textMuted`, `border`, `space`, `fontSizes`, `fontWeights`). Nenhum token novo.

## Arquitetura da solução

### Dados (`src/lib/nav.ts`): fonte única da estrutura

- **Grupos e ordem:**
  ```ts
  export const GRUPOS_NAV = [
    { id: "financeiro", titulo: "Financeiro" },
    { id: "configuracoes", titulo: "Configurações" },
    { id: "operacao", titulo: "Operação" },
  ] as const;
  export type GrupoNavId = (typeof GRUPOS_NAV)[number]["id"];
  ```
  A ordem do array é a ordem dos grupos na tela.
- **Pertença:** `NavLinkItem` e `NavActionItem` ganham `grupo?: GrupoNavId`. Os dois itens de conveniada (Carimbar ticket e Pátio da conveniada) ficam **sem** `grupo` (RF8). Cada tela nova passa a declarar o seu grupo no mesmo lugar em que declara rota, ícone e área.
- **Ordem dentro do grupo:** é a ordem de `NAV_ITEMS`. Por isso `NAV_ITEMS` é **reordenado** para a sequência do PRD, e a lista plana passa a ser a do menu agrupado (Financeiro, Configurações, Operação e, no fim, os itens sem grupo):
  1. Financeiro: Financeiro, Caixa, Faturas, Notas Fiscais
  2. Configurações: Minha Empresa, Gestão de Preços, Quadros de Chaves, Mensalistas, Gestão de Usuários, Empresas conveniadas
  3. Operação: Dashboard, Pátio, Entrada de Veículos, Saída de Veículos, Conferência de pátio
  4. Sem grupo: Carimbar ticket, Pátio da conveniada
- **Agrupamento:**
  ```ts
  export type GrupoNav = { id: GrupoNavId | null; titulo: string | null; itens: NavItem[] };
  export function agruparItens(itens: NavItem[]): GrupoNav[]
  ```
  Devolve os grupos na ordem de `GRUPOS_NAV`, só os que têm itens, e por último, se houver, o bloco sem grupo (`id` e `titulo` nulos). Dentro de cada grupo **preserva a ordem recebida**: quem chama passa listas já na ordem do menu (`navItemsPermitidos` e `ordenarPeloMenu`, ambas derivadas de `NAV_ITEMS`).
- **Não muda:** `BAR_PRIORITY`, `BARRA_FIXA`, `montarBarraFixa`, `dividirItensDaBarra`, `isNavActive` e as rotas. As barras têm a sua própria ordem e prioridade, explícitas.

### Menu lateral (`src/components/layout/SideNav`, Client Component, já é)

- `SideNav.tsx`: `const grupos = agruparItens(itens)` e renderiza, dentro de um contêiner rolável, uma lista de grupos. Cada grupo é um `<li>` com:
  - a linha de título (somente se `grupo.titulo`): `<TituloGrupo>` com `<Traco aria-hidden>` e `<TituloTexto id={…}>`;
  - a lista de itens (`<Lista aria-labelledby={id}>` quando há título; sem rótulo no bloco sem grupo), com o markup de item de hoje.
  Os ids vêm de `useId()` combinado ao `grupo.id`.
- `SideNav.styles.ts`:
  - `Grupos` (novo): `flex: 1`, `min-height: 0`, `overflow-y: auto`, barra de rolagem escondida, lista de grupos sem marcador.
  - `TituloGrupo`: altura `space[4]`, `position: relative`, sem alterar a altura com o menu expandido. `Traco`: 24px por 1px, cor `border`, centralizado na coluna dos ícones (`left` calculado do mesmo recuo de 17px dos itens). `TituloTexto`: `fontSizes.xs`, `fontWeights.bold`, `textMuted`, recuo de 17px, `opacity: 0`.
  - Na regra `&:hover, &:focus-within` do `Aside`, junto com `Rotulo { opacity: 1 }`: `TituloTexto { opacity: 1 }` e `Traco { opacity: 0 }`, com a transição de opacidade só em `prefers-reduced-motion: no-preference`.
  - `Aside` continua com `overflow: hidden`; a rolagem fica em `Grupos`. O `VersaoLink` continua fora do contêiner rolável, com `margin-top: auto`.

### Painel "Mais" (`src/components/layout/BottomNav`, Client Component, já é)

- `MenuSheet.tsx`: recebe `itens` como hoje (os que não couberam na barra, na ordem do menu) e faz `agruparItens(itens)` por dentro. Para cada grupo: `<GrupoPainel>` com `<GrupoTitulo id>` (somente se houver título) e um `<SheetList aria-labelledby>`. Cada item mantém o markup atual (ação ou link, `aria-current`, `onClick`).
- `BottomNav.styles.ts`: `GrupoPainel` (espaço de `space[3]` acima, exceto no primeiro) e `GrupoTitulo` (`fontSizes.sm`, `fontWeights.bold`, `textMuted`, `space[1]` abaixo). A regra de divisória `li + li` do `SheetList` já fica dentro de cada grupo, porque cada grupo é uma lista própria.
- `BottomNav.tsx`: **sem mudança**. A barra inferior, `useBarCapacity` e a lógica de itens visíveis e excedentes continuam como estão.

### Server vs Client

Todas as peças alteradas já são Client Components (`usePathname`, estado, `<dialog>`); `nav.ts` é módulo puro.

## Decisões técnicas e trade-offs

1. **Estrutura em `nav.ts`, junto da lista de itens, e não em um mapa à parte.** Um único lugar define rota, ícone, área e grupo; o menu lateral e o painel não têm como divergir. O custo é que uma tela nova precisa declarar o grupo; o tipo opcional deixa o item de conveniada de fora de propósito, e o teste de `nav.ts` falha se um item novo ficar sem grupo sem ter sido pensado (ver testes).
2. **Reordenar `NAV_ITEMS`, em vez de ordenar por grupo na hora.** A ordem dentro do grupo pedida no PRD é diferente da de hoje; ordenar por uma lista paralela de chaves duplicaria a informação. Com `NAV_ITEMS` na ordem do menu, a lista plana e a agrupada coincidem. A consequência (abaixo, em riscos) é que a ordem das listas planas muda.
3. **`agruparItens` preserva a ordem de entrada.** Não reordena por dentro; assim o painel, que recebe os excedentes já ordenados, e o menu lateral usam o mesmo caminho e a função continua trivial e testável.
4. **Linha de título de altura fixa nos dois estados** (decisão do design): os itens não se movem ao expandir, ao custo de 24px por grupo no menu recolhido.
5. **Título não é cabeçalho** (`h2`/`h3`): cada grupo é uma lista nomeada por `aria-labelledby`, para não poluir a navegação por títulos da página.
6. **Rolagem em `Grupos`, não no `Aside`.** O `Aside` tem `overflow: hidden` para a expansão sobre o conteúdo; mover a rolagem para um contêiner interno mantém isso e deixa a versão fixa no pé. O foco por teclado rola o item para a vista pelo navegador.
7. **`BottomNav` e as barras não mudam**, porque a ordem e a prioridade delas são explícitas (`BAR_PRIORITY`, `BARRA_FIXA`).

## Riscos / pontos de atenção

- **Ordem das listas planas muda.** `navItemsPermitidos`, `ordenarPeloMenu` e o desempate de `navItemsPorPrioridade` passam a seguir a ordem agrupada. Efeito visível: na **barra adaptativa** (perfis sem pátio, como o Financeiro), os itens passam de "Dashboard, Faturas, Notas, Financeiro" para "Financeiro, Faturas, Notas, Dashboard". A tela inicial não é afetada (`telaInicial.ts` é independente da lista). Os testes que listam ordens precisam ser atualizados (abaixo).
- **Altura do menu lateral.** Com três títulos o menu de um Administrador cresce uns 60px; a rolagem interna resolve, mas é preciso conferir o foco por teclado e a expansão em telas baixas (por exemplo, 720px de altura).
- **Barra de rolagem escondida** reduz a pista visual de que há mais itens; o design a pediu assim. Se for um problema, mostrar uma barra fina é ajuste de estilo.
- **Pontos em aberto do PRD** (nome "Faturamento", posição do item "Financeiro", ordem dos grupos e grupo da conveniada): a estrutura está toda em `GRUPOS_NAV` e no campo `grupo` de cada item, então mudar qualquer um é editar dados, sem tocar nos componentes.
- **Painel sem Pátio, Caixa, Entrada e Saída:** o grupo Operação do painel pode ficar só com Dashboard e Conferência, e Financeiro sem o Caixa; o agrupamento já omite grupo vazio.
- **Identificadores duplicados:** cada instância (menu lateral e painel) usa `useId()`, para os `aria-labelledby` não colidirem.

## Fora de escopo técnico
- Grupos que recolhem e expandem e a lembrança do que o usuário abriu.
- Mudar a barra inferior, `BAR_PRIORITY`, `BARRA_FIXA` ou a lógica de capacidade.
- Mudar permissões, rotas ou o conteúdo das telas.
- Ordem de grupos por perfil ou personalizável.

## Testes e verificação
- **`nav.test.ts`:**
  - `NAV_ITEMS` na nova ordem, com `grupo` correto em cada item e sem `grupo` só nos dois itens de conveniada.
  - `agruparItens`: ordem dos grupos, omissão de grupo vazio, bloco sem grupo no fim, ordem interna preservada, lista vazia.
  - Atualizar as listas de ordem de `navItemsPermitidos` (Gerente, Caixa, Financeiro, conveniada), `navItemsPorPrioridade`, `dividirItensDaBarra` e `ordenarPeloMenu`.
- **`SideNav.test.tsx`:** os três títulos na ordem certa para o Administrador; cada item dentro do grupo certo (lista nomeada); perfil com poucos itens sem grupo vazio; conveniada sem títulos; item atual marcado; Entrada e Saída abrindo o modal.
- **`BottomNav.test.tsx` e um teste do `MenuSheet`:** o painel mostra os grupos com título, sem repetir os quatro itens da barra e sem grupo vazio; conveniada sem títulos; as listas esperadas do painel na nova ordem.
- **Sem regressão:** `BottomBar.test.tsx`, `useBarCapacity` e a barra de cinco posições seguem passando sem mudança de comportamento.
- **Verificação manual** (skill `run`), em 720px e 1080px de altura (menu lateral) e 375px e 768px (painel), nos temas claro e escuro: menu recolhido com traços, expansão sem os itens se moverem, rolagem e foco por teclado, painel com grupos.
- `npm run lint` e `npm run build` antes de fechar.
