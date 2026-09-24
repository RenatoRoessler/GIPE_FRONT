# Tasks: Estrutura do Projeto Logado

Referências: ./prd.md, ./techspec.md

- [x] T1 — Criar tipo `CurrentUser`
  - Arquivos: `src/types/user.ts`
  - Pronto quando: o arquivo exporta o tipo `CurrentUser` (`id`, `name`) conforme o techspec.

- [x] T2 — Criar hook mock `useCurrentUser`
  - Arquivos: `src/hooks/useCurrentUser.ts`
  - Pronto quando: o hook retorna `{ user, isLoading }`, começa com `isLoading: true`, resolve para um usuário fixo após um pequeno delay, e tem um comentário deixando claro que é mock temporário até existir sessão real.

- [x] T3 — Criar lista central de itens de navegação
  - Arquivos: `src/lib/nav.ts`
  - Pronto quando: o arquivo exporta `NavItem` e `NAV_ITEMS` com os 5 itens (Gestão de Preços, Gestão de Usuários, Entrada de Veículos, Saída de Veículos, Relatórios) e as rotas definidas no techspec.

- [x] T4 — Criar componente `Sidebar`
  - Arquivos: `src/components/layout/Sidebar/Sidebar.tsx`, `Sidebar.styles.ts`, `index.ts`
  - Pronto quando: renderiza os itens de `NAV_ITEMS`, marca o item ativo comparando com `usePathname()`, aceita `isOpen`/`onClose`, exibe como fixa em desktop (`>= breakpoints.lg`) e como drawer com overlay em telas menores, usando apenas tokens do tema (sem valores soltos).

- [x] T5 — Criar componente `UserMenu`
  - Arquivos: `src/components/layout/UserMenu/UserMenu.tsx`, `UserMenu.styles.ts`, `index.ts`
  - Pronto quando: exibe avatar (iniciais do nome via `useCurrentUser`), abre/fecha dropdown ao clicar, fecha ao clicar fora ou pressionar `Escape`, contém os itens "Editar Usuário" (`next/link` para `/usuario/editar`) e "Sair" (navega para `/login`), com "Sair" visualmente destacado em `colors.danger` e separado por divisor.

- [x] T6 — Criar componente `Header`
  - Arquivos: `src/components/layout/Header/Header.tsx`, `Header.styles.ts`, `index.ts`
  - Pronto quando: usa `useCurrentUser`, mostra skeleton enquanto `isLoading`, mostra boas-vindas com o nome do usuário quando carregado, renderiza ícone de menu (visível só abaixo de `breakpoints.lg`) que chama `onMenuClick` recebido via props, e renderiza `UserMenu` à direita.

- [x] T7 — Criar componente `AppShell`
  - Arquivos: `src/components/layout/AppShell/AppShell.tsx`, `AppShell.styles.ts`, `index.ts`
  - Pronto quando: compõe `Sidebar` + `Header` + `<main>{children}</main>` em um grid responsivo (colunas lado a lado em `>= breakpoints.lg`, coluna única com drawer abaixo disso), controlando o estado `isSidebarOpen` e repassando `onMenuClick`/`isOpen`/`onClose` corretamente.

- [x] T8 — Criar layout da área logada
  - Arquivos: `src/app/(app)/layout.tsx`
  - Pronto quando: o layout envolve `children` com `AppShell` e não introduz nenhum estado próprio (Server Component).

- [x] T9 — Criar página de Dashboard
  - Arquivos: `src/app/(app)/dashboard/page.tsx`
  - Pronto quando: renderiza um `Card` com `Text variant="heading"` de boas-vindas e `Text variant="muted"` de apoio, sem data fetching, conforme `design.md`.

- [x] T10 — Criar páginas placeholder de destino do menu e de edição de usuário
  - Arquivos: `src/app/(app)/precos/page.tsx`, `src/app/(app)/usuarios/page.tsx`, `src/app/(app)/veiculos/entrada/page.tsx`, `src/app/(app)/veiculos/saida/page.tsx`, `src/app/(app)/relatorios/page.tsx`, `src/app/(app)/usuario/editar/page.tsx`
  - Pronto quando: cada página exibe título da seção (`Text variant="heading"`) e uma mensagem `muted` indicando que será implementada em spec futura; todas navegáveis a partir do menu/dropdown.

- [x] T11 — Verificação final (lint/build) e checagem manual dos critérios de aceite
  - Arquivos: n/a
  - Pronto quando: `npm run lint` passa sem erros, `npm run build` passa, e os critérios de aceite do `prd.md` foram conferidos manualmente (dropdown, logout, navegação da sidebar com item ativo, responsividade em ~375px e desktop).
