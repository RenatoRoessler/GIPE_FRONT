# Tasks: Reformulação do Layout (Modelo B — Sinalização viária)

Referências: ./prd.md, ./techspec.md, `docs/design/layouts/modelo-b-sinalizacao.html`

Observação: o repositório não tem runner de testes. "Testes" de cada task = `npm run lint`, `npm run build` e a verificação manual descrita em "Pronto quando". Consultar `node_modules/next/dist/docs/` antes de usar APIs do Next.

- [x] T1 — Temas de sinalização, tokens novos e fontes
  - Arquivos: `src/styles/theme.ts`, `src/contexts/ThemeModeContext.tsx`, `src/app/(app)/layout.tsx`
  - Fazer: adicionar ao `AppTheme` os tokens `colors.warn`, `onWarn`, `steel`, `onSign` e `typography` (`display`, `displayTransform`, `displayTracking`), com valores neutros em `lightTheme`/`darkTheme` (sem mudança visual). Criar `signageLightTheme` e `signageDarkTheme` com os valores da tabela do techspec (§5, raios `md: 10px`/`lg: 14px`). Criar `SignageThemeProvider` (ThemeProvider aninhado que escolhe a variante por `useThemeMode().mode`). Em `(app)/layout.tsx`, carregar Barlow (400/500/600/700) e Barlow Condensed (500/600/700) com `next/font/google` (`variable`, `subsets: ["latin"]`, `display: "swap"`), aplicar ao wrapper com `font-family` corpo e `font-variant-numeric: tabular-nums`, e envolver `AppShell` com o `SignageThemeProvider`.
  - Pronto quando: `lint` e `build` passam; a área logada já exibe a paleta e a fonte novas nos dois temas; `/login`, `/adesao` e `/recuperar-senha` continuam visualmente idênticas; pares de contraste do techspec (§5) validados em WCAG AA.

- [x] T2 — Item "Início", ícones e componente `NavSign`
  - Arquivos: `src/lib/nav.ts`, `src/components/layout/NavSign/NavSign.tsx`, `NavSign.styles.ts`, `NavIcons.tsx` (movido de `Sidebar/`, + ícone `home`), `index.ts`
  - Fazer: incluir `{ label: "Início", href: "/dashboard", icon: "home" }` no início de `NAV_ITEMS` e `"home"` em `NavIconId`. Criar `NavSign` (props `item`, `active`, `variant: "gantry" | "panel"`, `onNavigate?`) conforme techspec §5: `next/link` via `as={NextLink}`, placa azul com borda branca e outline, fonte display caixa alta, hastes de aço só na variante `gantry`, estado ativo invertido com `aria-current="page"`, hover com `primaryHover`, `:focus-visible` com `colors.warn`, transições só sob `prefers-reduced-motion: no-preference`. Apenas tokens do tema (sem valores visuais soltos).
  - Pronto quando: o componente compila e é exportado; `Sidebar` ainda importa `NavIcons` do novo caminho sem quebrar o build.

- [x] T3 — Pórtico (`Gantry`), nova casca e remoção da `Sidebar`
  - Arquivos: `src/components/layout/Gantry/Gantry.tsx`, `Gantry.styles.ts`, `index.ts`; `src/components/layout/AppShell/AppShell.tsx`, `AppShell.styles.ts`; remover `src/components/layout/Sidebar/*`
  - Fazer: `Gantry` = `<nav aria-label="Menu principal">` com barra de aço decorativa (`aria-hidden`) e `<ul>` rolável na horizontal com um `NavSign variant="gantry"` por item, ativo por `pathname` (`/dashboard` exato; demais `=== href` ou `startsWith(href + "/")`); visível só em `>= breakpoints.lg`. `AppShell` passa a coluna única `Header → Gantry → Main → AppFooter` sem estado de sidebar, fundo `colors.surface`, `Main` com `flex: 1` e paddings por tokens. Apagar a `Sidebar` e qualquer import dela.
  - Pronto quando: em 1280px o pórtico mostra as 7 placas, navega para todas as rotas e destaca a atual; com janela estreita (≥ lg) a lista rola horizontalmente sem gerar scroll horizontal na página; `lint` e `build` passam sem referências a `Sidebar`.

- [x] T4 — Header no estilo do modelo
  - Arquivos: `src/components/layout/Header/Header.tsx`, `Header.styles.ts`; `src/components/layout/UserMenu/UserMenu.styles.ts`; `src/components/ui/Logo/Logo.tsx`, `Logo.styles.ts`
  - Fazer: `Header` com `Logo` à esquerda (altura 40px, nova prop `align?: "center" | "start"`, padrão `center` para não afetar o `AuthCard`), saudação "Olá, <nome>" (texto corrido `textMuted`, oculta abaixo de `md`, skeleton mantido), `ThemeToggleButton` 40px circular e `UserMenu`. Remover a prop `onMenuClick` e o botão ☰ (o gatilho mobile vem na T5). `UserMenu`: avatar 38px sólido (`primary`/`onPrimary`), dropdown e foco no novo estilo; lógica (clique fora, `Esc`, "Editar Usuário", "Sair") inalterada.
  - Pronto quando: logo, saudação, tema e avatar aparecem como no modelo nos dois temas; "Editar Usuário" leva a `/usuario/editar` e "Sair" limpa o token e vai a `/login`; a logo é legível no tema escuro; telas públicas com `Logo` inalteradas.

- [x] T5 — Navegação mobile (`MobileNav`)
  - Arquivos: `src/components/layout/MobileNav/MobileNav.tsx`, `MobileNav.styles.ts`, `index.ts`; `src/components/layout/Header/Header.tsx`, `Header.styles.ts`
  - Fazer: gatilho em forma de placa ("Menu", `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`, alvo ≥ 44px) visível só abaixo de `lg`, posicionado antes da logo. Painel com `<dialog>` + `showModal()`: cabeçalho com título "Menu" e botão fechar (44×44), barra de aço no topo, `NavSign variant="panel"` (uma por linha, ≥ 56px, atual invertida), `::backdrop` escuro, `max-height: 100dvh` com rolagem. Fecha por botão, clique no backdrop (`event.target === dialog`), `Esc` (sincronizando via evento `close`), ao navegar (`onNavigate`/mudança de `pathname`) e ao passar de `lg` (`matchMedia`). Animação de entrada só sob `prefers-reduced-motion: no-preference`. Header `position: sticky; top: 0` apenas abaixo de `lg`.
  - Pronto quando: em 375px o painel abre, lista os 7 itens, destaca o atual, fecha pelas 4 vias, devolve o foco ao gatilho e prende o foco enquanto aberto; sem scroll horizontal da página.

- [x] T6 — Rodapé e títulos de página
  - Arquivos: `src/components/layout/AppFooter/AppFooter.styles.ts`; `src/components/ui/Text/Text.styles.ts` (e `Text.tsx` se criar `variant="title"`); páginas em `src/app/(app)/**/page.tsx` e telas de `minha-empresa`/`atualizacoes` que tenham título de página
  - Fazer: `AppFooter` com borda superior `colors.border`, fundo `colors.background`, padding por tokens e link da versão em `colors.primary` 600 (garantir contraste AA no escuro). Ler `Text.styles.ts`: se `heading` for usado em contextos que não são título de página, criar `variant="title"` (display, caixa alta, ~38px / 32px no mobile, `displayTransform` e `displayTracking` do tema) e aplicá-lo nos títulos das páginas `(app)`; senão, fazer `heading` ler `typography.display*`. Nos temas atuais o resultado visual das telas públicas não pode mudar.
  - Pronto quando: todas as páginas de `(app)` exibem título e rodapé no padrão do modelo; o link do rodapé segue levando a `/atualizacoes#v…`; telas públicas sem mudança.

- [x] T7 — Auditoria dos componentes de UI e das telas logadas
  - Arquivos: `src/components/ui/**/*.styles.ts`, `src/components/empresa/**`, `src/components/atualizacoes/**`, placeholders em `src/app/(app)/**`
  - Fazer: procurar `#hex`, `rgba(...)` e `px` visuais fixos nos estilos e trocar por tokens; revisar `Button`, `Input`, `Select`, `Switch`, `Card`, `Accordion`, `Toast`, `ErrorBanner`, `Skeleton` e `Stepper` e as telas `minha-empresa`, `atualizacoes` e placeholders sob `signageLightTheme` e `signageDarkTheme`. Adotar `colors.warn` no `:focus-visible` apenas dentro do tema de sinalização (por token), sem alterar o foco das telas públicas.
  - Pronto quando: nenhuma tela de `(app)` parece pertencer ao layout antigo nem apresenta quebra visual nos dois temas, em 375px e 1280px; telas públicas inalteradas.

- [ ] T8 — Verificação final (lint/build e critérios de aceite)
  - Arquivos: n/a
  - Pronto quando: `npm run lint` e `npm run build` passam; os critérios de aceite do `prd.md` foram conferidos manualmente em 375px, 768px e 1280px, nos temas claro e escuro: pórtico e placa atual, `aria-current`, rolagem horizontal contida, painel mobile (toque fora, botão, `Esc`, retorno de foco), navegação só por teclado com foco visível, header, rodapé, ausência de scroll horizontal da página, contraste WCAG AA e telas públicas sem regressão.
