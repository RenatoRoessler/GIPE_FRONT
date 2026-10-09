# Tech Spec: Reformulação do Layout (Modelo B — Sinalização viária)

**Status:** Rascunho
**Data:** 2026-10-09
**PRD:** ./prd.md
**Referência visual:** `docs/design/layouts/modelo-b-sinalizacao.html`

## Referências
- Não há `design.md` para esta feature: o HTML do Modelo B é a spec visual (medidas, cores, estados). Se uma tarefa pedir valor não presente no modelo (ex.: painel mobile), a decisão fica registrada aqui.
- Skills de implementação: `claude-design`, `styled-components-best-practices`, `code-best-practices`, `next-best-practices`.
- Next.js deste repo tem breaking changes: consultar `node_modules/next/dist/docs/` (fontes: `01-app/01-getting-started/13-fonts.md`) antes de escrever código.

## 1. Visão técnica

A casca da área logada (`AppShell`) deixa de ser `Sidebar | (Header, Main, Footer)` e passa a ser uma coluna única: `Header → Pórtico → Main → AppFooter`. A linguagem visual do modelo é entregue por **temas novos escopados à área `(app)`**, sem tocar nas telas públicas.

Pontos centrais:
1. **Temas de sinalização** (`signageLightTheme`/`signageDarkTheme`) com o mesmo formato `AppTheme`, aplicados por um `ThemeProvider` aninhado em `src/app/(app)/layout.tsx`. As telas públicas continuam com `lightTheme`/`darkTheme`. O alternador claro/escuro segue sendo um só (`ThemeModeContext`, chave `gipe-theme-mode`) e escolhe a variante nos dois mundos.
2. Como os componentes de UI (`Button`, `Input`, `Card`, `Select`, `Text`…) já leem apenas tokens do tema, a paleta, o raio e a tipografia novos chegam a eles sem alterar os componentes, desde que os novos tokens sejam cobertos (item 3).
3. **Novos tokens** (aditivos, com valor também nos temas atuais para manter `AppTheme` único): cores `warn`, `onWarn`, `steel`, `onSign`; tipografia `typography.display` (família), `typography.displayTransform` e `typography.displayTracking`. Nos temas atuais: `warn`/`onWarn`/`steel` recebem valores neutros, `typography.display` = fonte corpo, transform `none`, tracking `normal` — comportamento visual atual inalterado.
4. **Fontes** Barlow e Barlow Condensed via `next/font/google` (self-hosted), carregadas em `(app)/layout.tsx` e expostas como CSS variables. Isso evita pedir fontes às telas públicas.
5. **Navegação**: um único componente de dados (`NAV_ITEMS` + Início) alimenta duas apresentações — `Gantry` (desktop/tablet) e `MobileNav` (placa-gatilho + painel `<dialog>`).
6. Sem novas dependências, sem chamadas de API, sem estado global novo.

## 2. Estrutura de pastas

```
src/styles/theme.ts                                  # + tokens novos, + signageLightTheme/signageDarkTheme
src/contexts/ThemeModeContext.tsx                    # + SignageThemeProvider (ThemeProvider aninhado, escolhe variante por mode)
src/lib/nav.ts                                       # + item "Início" (/dashboard), ícone "home"

src/app/(app)/layout.tsx                             # fontes next/font, SignageThemeProvider, AppShell

src/components/layout/AppShell/AppShell.tsx          # coluna única; remove estado da sidebar
src/components/layout/AppShell/AppShell.styles.ts    # fundo "ground", min-height, grid de conteúdo

src/components/layout/Header/Header.tsx              # logo + saudação + tema + UserMenu + MobileNav trigger
src/components/layout/Header/Header.styles.ts

src/components/layout/Gantry/Gantry.tsx              # NOVO: pórtico (nav desktop)
src/components/layout/Gantry/Gantry.styles.ts
src/components/layout/Gantry/index.ts

src/components/layout/MobileNav/MobileNav.tsx        # NOVO: gatilho + painel <dialog>
src/components/layout/MobileNav/MobileNav.styles.ts
src/components/layout/MobileNav/index.ts

src/components/layout/NavSign/NavSign.tsx            # NOVO: placa (link) reutilizada por Gantry e MobileNav
src/components/layout/NavSign/NavSign.styles.ts
src/components/layout/NavSign/index.ts

src/components/layout/Sidebar/NavIcons.tsx           # MOVE → src/components/layout/NavSign/NavIcons.tsx; + ícone "home"
src/components/layout/Sidebar/*                      # REMOVER (Sidebar.tsx, Sidebar.styles.ts, index.ts)

src/components/layout/UserMenu/UserMenu.styles.ts    # avatar sólido azul, dropdown no estilo novo
src/components/layout/AppFooter/AppFooter.styles.ts  # borda superior, fundo surface
src/components/ui/Logo/Logo.tsx                      # variante inline (sem align-self:center) p/ header
```

Não há tipos de domínio nem store: nenhuma interface de API é criada.

## 3. Interfaces e tipos

```ts
// src/styles/theme.ts — acréscimos
type ThemeColors = {
  /* ...existentes... */
  warn: string;      // amarelo de advertência
  onWarn: string;    // texto sobre warn
  steel: string;     // aço (barra do pórtico, hastes)
  onSign: string;    // texto sobre primary quando for placa
};

type ThemeTypography = {
  display: string;                        // família dos títulos/placas
  displayTransform: "none" | "uppercase";
  displayTracking: string;                // letter-spacing de títulos/placas
};

export type AppTheme = typeof shared & { colors: ThemeColors; shadows: ThemeShadows; typography: ThemeTypography };
```

`shared.fontSizes` ganha `"2xl"` (38px) e `"3xl"` (52px) apenas se uma tarefa precisar (o título de página usa 38px/32px no mobile).

```ts
// src/lib/nav.ts
export type NavIconId = "home" | "pricing" | "users" | "vehicleIn" | "vehicleOut" | "reports" | "company";
// NAV_ITEMS passa a começar por { label: "Início", href: "/dashboard", icon: "home" }.
```

```ts
// NavSign
export interface NavSignProps {
  item: NavItem;
  active: boolean;
  variant: "gantry" | "panel";   // gantry: com hastes, flex 1 0 150px | panel: sem hastes, linha larga
  onNavigate?: () => void;
}

// MobileNav
export interface MobileNavProps { /* sem props: lê pathname e NAV_ITEMS internamente */ }

// Gantry
export interface GantryProps { /* sem props */ }
```

## 4. Contratos de API
Nenhum. A feature é só apresentação e navegação.

## 5. Componentes

### Temas (`theme.ts`)
Valores a partir de `modelo-b-sinalizacao.html` (`:root` e `[data-theme="dark"]`):

| Token | Claro | Escuro |
| --- | --- | --- |
| `background` (surface do modelo) | `#ffffff` | `#151c25` |
| `surface` (ground do modelo) | `#edf0f4` | `#0d1218` |
| `border` (line) | `#d5dbe3` | `#27313d` |
| `text` | `#14202e` | `#e8edf3` |
| `textMuted` (text-2) | `#4d5b6c` | `#9eabba` |
| `primary` (sign) | `#0a4aa0` | `#1768d1` |
| `primaryHover` (sign-2) | `#0d5cc4` | `#2a7be6` |
| `onPrimary` / `onSign` | `#ffffff` | `#ffffff` |
| `warn` / `onWarn` | `#ffcc00` / `#14202e` | `#ffcc00` / `#14202e` |
| `success` (ok) | `#17803f` | `#5fd08e` |
| `steel` | `#8a95a3` | `#5a6573` |
| `danger` | valor atual do tema | valor atual do tema |

`primarySoft`/`primarySofter`: derivar do `primary` (mesma regra dos temas atuais). Contraste a validar: `textMuted` sobre `background`/`surface`, `onPrimary` sobre `primary` (≥ 4.5:1, WCAG AA).
`radii` nos temas de sinalização: `md: 10px`, `lg: 14px`. `typography`: `display` = `var(--font-barlow-condensed), "Arial Narrow", sans-serif`, `displayTransform: "uppercase"`, `displayTracking: ".02em"`. Fonte de corpo: o `font-family` do wrapper do `(app)/layout.tsx` passa a Barlow.

### `SignageThemeProvider` (`ThemeModeContext.tsx`)
Client Component. Lê `useThemeMode().mode` e renderiza `<ThemeProvider theme={mode === "dark" ? signageDarkTheme : signageLightTheme}>`. Fica dentro do provider global, então herda o modo e o toggle.

### `src/app/(app)/layout.tsx`
Continua Server Component. Instancia `Barlow` (400/500/600/700) e `Barlow_Condensed` (500/600/700) com `variable` e `subsets: ["latin"]`, `display: "swap"`; aplica `className` com as duas variáveis a um wrapper e renderiza `<SignageThemeProvider><AppShell>{children}</AppShell></SignageThemeProvider>`. Dentro do wrapper, define `font-family` corpo e `font-variant-numeric: tabular-nums` (como no modelo).

### `AppShell`
Server-compatível o bastante, mas permanece Client por conter `Header`/`Gantry`. Remove `isSidebarOpen`. Estrutura: `Layout` (coluna, `min-height: 100vh`, fundo `colors.surface`) → `Header`, `Gantry` (visível `≥ lg`), `Main`, `AppFooter`. `Main`: `flex: 1`, padding 22px/32px (16px no mobile, `space` mais próximo se não houver token exato — não hardcodar), `align-content: start`.

### `Header`
`Bar` flex, padding 14px 32px (12px 16px mobile), fundo `colors.background`, borda inferior `colors.border`. Ordem: `Logo` (margin-right: auto) → saudação (`display: none` abaixo de `md`) → `ThemeToggleButton` → `UserMenu`. `MobileNav` (gatilho) aparece só abaixo de `lg` e ocupa o lugar do início da barra, antes da logo. Skeleton da saudação mantido. A saudação usa `Text` (`heading` atual) — se o estilo `heading` mudar para a fonte display, trocar aqui para `body`: a saudação no modelo é texto corrido 15px, `textMuted`.
No mobile o header é `position: sticky; top: 0; z-index` abaixo do dialog, para o gatilho continuar acessível ao rolar (decisão em §11).

### `Gantry` (desktop, `≥ breakpoints.lg`)
`<nav aria-label="Menu principal">` com a barra de aço (`::before` ou elemento decorativo `aria-hidden`, 10px, `colors.steel`, `border-radius` 5px, `left/right` 32px, `top` 18px) e uma lista (`<ul>`) rolável horizontalmente (`overflow-x: auto`, `scrollbar-width: thin`) com `gap: 14px`, `padding-top: 22px`. Cada `<li>` envolve um `NavSign` `variant="gantry"`. A rolagem fica contida na lista (a página não ganha scroll horizontal — `globals.css` já usa `overflow-x: clip`).

### `NavSign`
`next/link` estilizado (`as={NextLink}`, padrão atual do `NavItemLink`). Placa: `flex: 1 0 150px`, `min-height: 92px`, coluna `space-between`, padding 12px 14px, `colors.primary`, `colors.onSign`, borda 3px branca (`#fff` claro / `colors.text` escuro) + `outline: 2px solid colors.primary`, radius 10px, sombra `0 6px 10px -4px` azul-escuro, fonte `typography.display` 600/24px, caixa alta, `line-height: 1`. Hastes (`::before`/`::after`, 5×26px, `colors.steel`, `top:-26px`, `left:22%`/`right:22%`) só em `variant="gantry"`. Ativa (`$active` → `aria-current="page"`): fundo branco/`colors.text`, texto `colors.primary`, borda `colors.primary`. Hover: `colors.primaryHover`. Foco: `outline: 3px solid colors.warn; outline-offset: 2px` + anel `0 0 0 5px #14202e` (`:focus-visible`). Transição de `background-color/border-color` 0.15s só sob `prefers-reduced-motion: no-preference`. `$active` calculado por `pathname === item.href` (igual hoje); para rotas aninhadas futuras, usar `pathname === href || pathname.startsWith(href + "/")` exceto `/dashboard`. Ícone via `NavIcon` (34px, stroke 2.4).

### `MobileNav` (`< lg`)
Client Component com estado `isOpen` e `ref` do `<dialog>`.
- **Gatilho**: botão em formato de placa pequena (retângulo azul arredondado com borda branca, ícone de "sinal de direção" + texto "Menu" em fonte display), `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`. Altura ≥ 44px.
- **Painel**: `<dialog>` aberto com `showModal()` (foco preso, `Esc` fecha nativamente, restaura foco ao gatilho, fundo inerte). Posicionado no topo, largura total, `max-height: 100dvh`, rolável. Fundo do painel `colors.surface` com barra de aço no topo e as opções como placas largas (`NavSign variant="panel"`: uma por linha, ≥ 56px de altura, ícone + rótulo, a atual invertida). Cabeçalho do painel com título "Menu" em fonte display e botão de fechar (44×44). `::backdrop` escuro (`rgba(20,32,46,.6)`).
- **Fechamento**: botão fechar, clique no backdrop (compara `event.target === dialog`), `Esc` (evento `close` sincroniza `isOpen`) e ao navegar (`onNavigate` + efeito em `pathname`). Sem `matchMedia`: ao crescer para `≥ lg` o gatilho some por CSS; um `useEffect` com `matchMedia("(min-width: lg)")` fecha o dialog se estiver aberto.
- Animação de entrada/saída opcional (translateY) apenas sob `prefers-reduced-motion: no-preference`.

### `UserMenu`
Lógica inalterada (fecha em clique fora e `Esc`, "Editar Usuário" e "Sair"). Estilo: `Avatar` 38px, fundo `colors.primary`, texto `colors.onPrimary`, 700/14px. Dropdown, itens e foco passam a usar `colors.warn` no `:focus-visible` como o restante.

### `ThemeToggleButton`
40×40, `border-radius: full`, borda `colors.border`, fundo `colors.background` (modelo). Foco amarelo.

### `AppFooter`
Mantém o link para `/atualizacoes#v…`. Estilo: padding 14px 32px, borda superior `colors.border`, fundo `colors.background`, fonte 14px, link `colors.primary` 600 (no escuro, azul claro `#7db3ff` via token `colors.primary` do tema escuro ou token dedicado se contraste < 4.5:1).

### `Logo`
Mantém `LogoWrapper $onDark`; adicionar prop `align?: "center" | "start"` (padrão `center` para não afetar `AuthCard`) e usar altura de 40px no header. No escuro, a base clara permanece (modelo: `#fff`, padding 4px 8px, radius 8px) — já coberto por `colors.text`... validar: no tema escuro de sinalização `text` é `#e8edf3`, quase branco, aceitável.

### Títulos de página
O modelo usa h1 em display caixa alta, 38px/700. Em vez de alterar cada página: o componente `Text` com `variant="heading"` passa a ler `typography.display*` do tema. Nos temas atuais o valor é o mesmo de hoje (sem mudança); no escopo logado vira display/caixa alta. Conferir `Text.styles.ts` antes: se `heading` for usado também para subtítulos de card, criar `variant="title"` (h1 de página, 38px) e aplicá-lo nas páginas `(app)`.

### Componentes de UI existentes (RF16)
Revisar `Button`, `Input`, `Select`, `Switch`, `Card`, `Accordion`, `Toast`, `ErrorBanner`, `Skeleton`, `Stepper` (e as telas `minha-empresa`, `atualizacoes`, placeholders) sob o tema de sinalização. Esperado: nenhuma alteração além de ajustar valores fixos (se houver `rgba`/`#hex`/`px` hardcoded) para tokens; `focus-visible` com `colors.warn` pode ser adotado como regra geral via tema nos dois temas de sinalização, **sem** alterar o foco das telas públicas.

## 6. Gerenciamento de estado
**Local.** `MobileNav.isOpen` (useState + ref do dialog). O modo de tema continua no `ThemeModeContext` existente. Não há Zustand nem Context novo.

## 7. Fluxo de dados
```
usePathname() ─┐
NAV_ITEMS ─────┴→ Gantry / MobileNav → NavSign (active) → UI
useThemeMode().mode → SignageThemeProvider → theme (tokens) → todos os styled-components do (app)
useCurrentUser() → Header (saudação) / UserMenu (iniciais)
```

## 8. Estratégia de testes
O repositório não tem runner de testes configurado (`package.json` só tem `lint`/`build`). Nesta feature:

| Camada | Como | O que verificar |
| --- | --- | --- |
| Estática | `npm run lint`, `npm run build` | tipos do `AppTheme` completos nos 4 temas, imports de `Sidebar` removidos |
| Manual/visual | `npm run dev` em 375px, 768px, 1280px, claro e escuro | pórtico, placa ativa, rolagem horizontal contida, painel mobile, header, footer, ausência de scroll horizontal da página |
| Acessibilidade | teclado + leitor | ordem de foco, `aria-current="page"`, foco visível amarelo, `Esc`/backdrop/botão fecham o painel, foco volta ao gatilho |
| Contraste | cálculo WCAG AA | pares texto/fundo dos dois temas (ver §5 Temas) |
| E2E (opcional, na etapa de QA) | skill `executar-qa` (Playwright) | critérios de aceite do PRD |

Se for decidido adicionar `vitest` + RTL depois, os candidatos são: `NavSign` (aria-current) e `MobileNav` (abrir/fechar).

## 9. Dependências
Nenhuma nova. Usa `next/font/google` (já presente no Next), `styled-components`, `<dialog>` nativo.

## 10. Riscos técnicos

| Risco | Probabilidade | Mitigação |
| --- | --- | --- |
| Vazamento do tema de sinalização para telas públicas | Baixa | `ThemeProvider` aninhado só em `(app)/layout.tsx`; conferir `/login`, `/adesao`, `/recuperar-senha` ao final |
| Componentes de UI com valores fixos quebram no tema novo | Média | Auditar `*.styles.ts` por `#hex`/`rgba`/`px` visuais; trocar por tokens |
| Dois `ThemeProvider` aninhados e flash de tema claro na hidratação (`mode` inicia em `"light"`) | Média | Já é comportamento existente (ver tech spec de estrutura logada); não piorar |
| `Text variant="heading"` mudar em contextos não-título | Média | Ler `Text.styles.ts` antes; criar `variant="title"` se necessário |
| Placas com `flex: 1 0 150px` + 7 itens ≥ 1050px estouram em tablet | Média | Rolagem horizontal na lista; `lg` (1024px) como corte para o pórtico; abaixo disso, painel mobile |
| Contraste: texto `textMuted` e `onPrimary` nos dois temas, azul do link do footer no escuro | Média | Validar WCAG AA e ajustar token se necessário |
| `<dialog>` sem polyfill em navegadores antigos | Baixa | Suporte amplo atual; sem polyfill |
| Header sticky no mobile cobrir âncoras/foco | Baixa | `scroll-padding-top` no `Main`/html se necessário |
| Fontes extras aumentam peso da área logada | Baixa | Subconjunto `latin`, só pesos usados, `display: swap` |

## 11. Decisões de arquitetura

| Decisão | Alternativas consideradas | Motivo |
| --- | --- | --- |
| Tema de sinalização escopado a `(app)` via `ThemeProvider` aninhado | Trocar tema global; classes CSS por área | Cumpre o fora de escopo do PRD (telas públicas intactas); reaproveita todos os componentes que já leem tokens |
| Novos tokens aditivos no `AppTheme` (também nos temas antigos) | Segundo tipo de tema só para sinalização | Um único tipo mantém `theme` tipado em todos os componentes; nada quebra |
| Mesmo toggle claro/escuro para as duas áreas | Preferência separada por área | Menos surpresa para o usuário; estado já existe |
| `NavSign` compartilhado por pórtico e painel mobile | Dois componentes de link independentes | Estado ativo, ícones e foco ficam em um lugar só |
| Painel mobile com `<dialog>` + `showModal()` | Drawer próprio com overlay; barra inferior | Foco preso, `Esc`, inert e restauração de foco prontos; atende RF9 com menos código |
| Mobile: placa-gatilho + painel de placas | Pórtico rolável; barra inferior (escolha do usuário) | Escolhido pelo usuário; identidade de placas e alvos grandes |
| Header sticky só no mobile; pórtico/header rolam no desktop (como o modelo) | Header + pórtico fixos em todos os tamanhos | Segue o modelo e economiza altura útil no desktop; no mobile o gatilho precisa seguir acessível |
| `next/font/google` no layout `(app)` | `<link>` do Google Fonts como no HTML do modelo | Self-hosted, sem layout shift, sem requisição externa, só na área logada |
| Início = novo item de `NAV_ITEMS` (`/dashboard`) | Link só pela logo | Pedido no PRD (RF2); o Header não tinha atalho para o dashboard |
| Remover a Sidebar | Manter oculta | PRD RF5; evita código morto |

## Ordem sugerida para as tasks
1. Tokens e temas de sinalização + `SignageThemeProvider` + fontes em `(app)/layout.tsx`.
2. `nav.ts` (Início) + mover `NavIcons` + `NavSign`.
3. `Gantry` + novo `AppShell` + remover `Sidebar`.
4. `Header` (logo, saudação, tema, avatar) + `UserMenu` e `Logo` ajustados.
5. `MobileNav` (dialog) integrado ao `Header`.
6. `AppFooter` e títulos (`Text`/`title`).
7. Auditoria dos componentes de UI e telas `(app)` nos dois temas; verificação nas telas públicas.
8. Lint, build, verificação manual 375/768/1280, claro/escuro, teclado.

## Fora de escopo técnico
- Telas públicas e de autenticação; blocos de dados do modelo no dashboard; novas rotas, permissões ou API; framework de testes novo.
