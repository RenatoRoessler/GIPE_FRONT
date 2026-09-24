# Tech Spec: Estrutura do Projeto Logado

## Referências
- PRD: ./prd.md
- Design: ./design.md (via skill claude-design)

## Design
- Telas/estados: ver `design.md` — header com boas-vindas/skeleton de carregamento, `UserMenu` (avatar + dropdown com "Editar Usuário"/"Sair"), sidebar fixa (desktop) / drawer (mobile) com 5 itens e estado ativo, dashboard estático de boas-vindas.
- Componentes do design system reaproveitados: `Text` (`heading`/`body`/`muted`), `Card`.
- Componentes novos: `AppShell`, `Header`, `UserMenu`, `Sidebar` (detalhes de props/estados abaixo, em `src/components/layout`).
- Tokens de tema usados: `colors.primary`/`primarySoft`/`surface`/`background`/`border`/`danger`, `space`, `radii`, `shadows`, `breakpoints.lg`. Nenhum token novo.

## Arquitetura da solução

### Contexto: não existe sessão real ainda
O fluxo de autenticação atual (`src/components/auth/LoginForm`) é apenas front-end (mock com `setTimeout`, sem chamada de API, sem cookie/sessão). Não existe hoje nenhum conceito de "usuário logado" persistido. Esta spec não implementa autenticação/sessão real (fora de escopo do PRD) — cria um **mock local do usuário logado**, isolado atrás de um hook (`useCurrentUser`), para que o header/dashboard tenham dado para renderizar. Quando a spec de autenticação real existir, apenas a implementação de `useCurrentUser` muda; os componentes de layout não são afetados.

### Arquivos/pastas novos

```
src/types/user.ts                                  # tipo CurrentUser
src/hooks/useCurrentUser.ts                         # hook mock (loading + user)
src/lib/nav.ts                                      # lista de itens do menu lateral (label, href, ícone)

src/components/layout/AppShell/AppShell.tsx
src/components/layout/AppShell/AppShell.styles.ts
src/components/layout/AppShell/index.ts

src/components/layout/Header/Header.tsx
src/components/layout/Header/Header.styles.ts
src/components/layout/Header/index.ts

src/components/layout/UserMenu/UserMenu.tsx
src/components/layout/UserMenu/UserMenu.styles.ts
src/components/layout/UserMenu/index.ts

src/components/layout/Sidebar/Sidebar.tsx
src/components/layout/Sidebar/Sidebar.styles.ts
src/components/layout/Sidebar/NavIcons.tsx           # ícones SVG inline dos itens de menu (sem dependência externa)
src/components/layout/Sidebar/index.ts

src/app/(app)/layout.tsx                            # route group da área logada, usa AppShell
src/app/(app)/dashboard/page.tsx                    # tela de dashboard
src/app/(app)/precos/page.tsx                       # placeholder — Gestão de Preços
src/app/(app)/usuarios/page.tsx                      # placeholder — Gestão de Usuários
src/app/(app)/veiculos/entrada/page.tsx              # placeholder — Entrada de Veículos
src/app/(app)/veiculos/saida/page.tsx                # placeholder — Saída de Veículos
src/app/(app)/relatorios/page.tsx                    # placeholder — Relatórios
src/app/(app)/usuario/editar/page.tsx                # placeholder — Editar Usuário (RF4)
```

Route group `(app)` isola o layout logado do layout raiz (`src/app/layout.tsx`), sem afetar as rotas públicas existentes (`/login`, `/recuperar-senha`, `/alterar-senha`, `/adesao`).

### Tipos/dados (`src/types/user.ts`)
```ts
export type CurrentUser = {
  id: string;
  name: string;
};
```

### Hook mock (`src/hooks/useCurrentUser.ts`)
- Client-side, retorna `{ user: CurrentUser | null; isLoading: boolean }`.
- Nesta versão: simula um pequeno delay (ex.: `useEffect` + `setTimeout` curto) e resolve para um usuário fixo, para exercitar o estado de skeleton descrito no design. Comentário no código deve deixar claro que é um mock temporário até existir sessão real — sem introduzir chamada de API ou storage.

### Navegação (`src/lib/nav.ts`)
```ts
export type NavItem = { label: string; href: string };

export const NAV_ITEMS: NavItem[] = [
  { label: "Gestão de Preços", href: "/precos" },
  { label: "Gestão de Usuários", href: "/usuarios" },
  { label: "Entrada de Veículos", href: "/veiculos/entrada" },
  { label: "Saída de Veículos", href: "/veiculos/saida" },
  { label: "Relatórios", href: "/relatorios" },
];
```
Centralizar aqui evita duplicar a lista entre `Sidebar` e testes/outras specs que precisem referenciar as mesmas rotas.

### Componentes

- **`AppShell`** (Client Component — precisa de estado para abrir/fechar o drawer mobile)
  - Props: `children`.
  - Estado: `isSidebarOpen` (mobile).
  - Renderiza `Sidebar` (recebendo `isOpen`/`onClose`) + coluna com `Header` (recebendo `onMenuClick`) + `<main>{children}</main>`.
  - Usa CSS Grid definido em `AppShell.styles.ts` (`grid-template-columns` mudando no breakpoint `lg`, conforme `design.md`).

- **`Header`** (Client Component — usa `useCurrentUser`, `useThemeMode` e recebe callback de menu)
  - Props: `onMenuClick: () => void`.
  - Usa `useCurrentUser()`; renderiza skeleton (`Header.styles.ts`, bloco com `colors.surface`) enquanto `isLoading`, senão `Text` de boas-vindas com `user.name`.
  - Ícone de menu (mobile only, via CSS `display` no breakpoint) chama `onMenuClick`.
  - Botão de alternância de tema (sol/lua) chama `toggleThemeMode()` do `useThemeMode` (ver `src/contexts/ThemeModeContext.tsx`) — troca entre `lightTheme` ("Confiança Azul") e `darkTheme` ("Ardósia Âmbar") definidos em `src/styles/theme.ts`, persistindo a escolha em `localStorage`.
  - Renderiza `UserMenu` à direita.

- **`UserMenu`** (Client Component — estado local de aberto/fechado)
  - Sem props externas nesta versão (usa `useCurrentUser` para iniciais do avatar).
  - Estado: `isOpen`. Fecha em clique fora (listener de `mousedown` no documento, padrão React, removido no cleanup) e em `Escape`.
  - Item "Editar Usuário": `Link`/`next/link` para `/usuario/editar`.
  - Item "Sair": por ora, sem sessão real para invalidar — navega para `/login` (equivalente a "logout" nesta fase). Quando existir sessão real, este ponto é o único lugar a alterar (chamar a função de logout real antes de navegar).

- **`Sidebar`** (Client Component — precisa saber a rota ativa e o estado de hover/aberto)
  - Props: `isOpen: boolean`, `onClose: () => void`.
  - Usa `usePathname()` (`next/navigation`) para marcar item ativo comparando com `NAV_ITEMS`.
  - Estado local `isHovered` (via `onMouseEnter`/`onMouseLeave` no `<nav>`); `isExpanded = isHovered || isOpen`.
  - Desktop (`>= breakpoints.lg`): sempre visível (`position: sticky`), colapsada por padrão (~76px, só ícones) e expandida (260px, com labels) enquanto `isExpanded` é verdadeiro — efeito hover-to-expand, sem depender de `isOpen` (que fica `false` em desktop).
  - Visual integrado ao `Header`: fundo `colors.background` + `border-right`/`border-bottom` em `colors.border`, bloco de marca com altura igual à do `Header` (64px) para as bordas se encontrarem na mesma linha — em vez de tokens de cor fixos e exclusivos do componente.
  - Mobile (`< breakpoints.lg`): `isOpen` controla a transformação (`translateX`) do drawer + overlay e força `isExpanded = true` (mostra sempre com labels, já que não há hover em touch); clicar num item ou no overlay chama `onClose`.

- **`src/app/(app)/layout.tsx`** (Server Component simples)
  - Importa `AppShell` e envolve `children`. Não precisa de estado próprio — todo estado interativo fica em `AppShell`/`Header`/`Sidebar` (Client Components), mantendo o layout raiz da rota como Server Component por padrão (ver `next-best-practices`).

- **`src/app/(app)/dashboard/page.tsx`**
  - Server Component estático: `Card` com `Text variant="heading"` + `Text variant="muted"` de boas-vindas, conforme `design.md`. Sem data fetching.

- **Páginas placeholder** (`precos`, `usuarios`, `veiculos/entrada`, `veiculos/saida`, `relatorios`, `usuario/editar`)
  - Server Components mínimos: `Text variant="heading"` com o nome da seção + `Text variant="muted"` indicando que a tela será implementada em spec futura. Existem só para o menu/dropdown terem destino navegável (RF4/RF9 do PRD).

## Decisões técnicas e trade-offs
- **Route group `(app)`** em vez de colocar tudo direto em `src/app`: mantém o layout logado isolado do layout raiz e das rotas públicas de autenticação, sem precisar de lógica condicional dentro de um único `layout.tsx` para decidir se mostra o shell ou não.
- **Mock de usuário via hook isolado** em vez de esperar a spec de autenticação real: permite entregar a estrutura de navegação (o que o PRD pede) sem bloquear em uma dependência que ainda não existe; a troca futura fica contida em um arquivo.
- **Sidebar como Client Component** mesmo em desktop (onde não há interação de abrir/fechar): necessário porque `usePathname()` (item ativo) e o comportamento de drawer mobile vivem no mesmo componente; dividir em dois componentes (um Server "burro" para desktop, um Client para mobile) foi descartado por duplicar a lista de itens e a lógica de item ativo sem ganho real.
- **Sem gerenciamento de permissões por perfil no menu** (fora de escopo do PRD): todos os 5 itens aparecem para qualquer usuário autenticado nesta versão.
- **Sem proteção de rota (middleware/redirect se não autenticado)**: como não existe sessão real ainda, não há o que checar; isso é responsabilidade de uma spec de autenticação/sessão futura, não desta.

## Atualização: tema claro/escuro global

Arquivos novos:
```
src/contexts/ThemeModeContext.tsx   # ThemeModeProvider (client) + useThemeMode()
src/components/layout/Header/ThemeIcons.tsx   # ícones sol/lua inline
```

- `src/styles/theme.ts` passa a exportar `lightTheme` ("Confiança Azul") e `darkTheme` ("Ardósia Âmbar") — mesma forma (`AppTheme`), valores diferentes. Novo token `colors.onPrimary` (texto/ícone sobre `colors.primary`) evita baixo contraste quando o primary é um amarelo/âmbar claro (tema escuro).
- `ThemeModeProvider` (Client Component) guarda o modo atual (`"light" | "dark"`) em estado, inicia em `"light"` (evita mismatch de hidratação SSR) e sincroniza com `localStorage` (`gipe-theme-mode`) em um `useEffect` após montar. Envolve `children` com o `ThemeProvider` do styled-components, escolhendo `lightTheme`/`darkTheme` conforme o modo.
- `src/lib/registry.tsx` trocou o `ThemeProvider` fixo por `ThemeModeProvider`, então toda a árvore (rotas públicas de auth e a área logada) passa a reagir ao tema escolhido — a troca é global, não só da área `(app)`.
- `Header` consome `useThemeMode()` e renderiza um botão (ícone sol/lua) que chama `toggleThemeMode()`.
- Componentes que tinham `color: white` fixo sobre `colors.primary` (`Button` variant padrão, `Stepper` passo concluído, item ativo da `Sidebar`) foram trocados para `colors.onPrimary`, para continuar legíveis nos dois temas.

## Riscos / pontos de atenção
- Como o modo inicial no cliente é sempre `"light"` até o `useEffect` rodar, quem tiver escolhido `dark` verá um flash rápido de tema claro no primeiro carregamento — aceitável para este escopo, mas vale revisitar se virar incômodo real.
- O mock de `useCurrentUser` precisa ficar claramente isolado e comentado como temporário, para não ser confundido com autenticação real por quem for implementar a spec de sessão depois.
- `usePathname()` em `Sidebar` exige que o componente seja Client — atenção para não vazar isso desnecessariamente para `AppShell`/páginas que poderiam continuar Server Components.
- Ao criar as páginas placeholder, evitar acoplar qualquer lógica de negócio nelas — são só destinos de navegação; a implementação real virá com PRDs próprios (Gestão de Preços, Gestão de Usuários, etc., já listados em `docs/specs/`).
- Testar o comportamento do drawer mobile (overlay, fechar ao clicar fora, `Escape` no `UserMenu`) manualmente, já que não há testes de interação configurados nesta spec.

## Fora de escopo técnico
- Autenticação/sessão real (login persistido, cookies, verificação de token) — cobre apenas o mock necessário para exibir nome do usuário.
- Middleware de proteção de rotas para usuários não autenticados.
- Controle de permissões por perfil sobre itens do menu.
- Implementação funcional das telas de destino do menu e de "Editar Usuário" (apenas placeholders de navegação).
