# Tech Spec: Menu Inferior no Celular

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e registra as decisões de componente)
- Protótipo aprovado: ./opcoes-layout.html (opção 2, "Barra limpa")

## Design
- Telas/estados: os de `design.md` (barra fechada, item ativo, Menu ativo, painel aberto; sem estados de carregamento, vazio ou erro).
- Componentes do design system reaproveitados: `NavIcon` (início, entrada, saída), tokens do tema, `<dialog>` nativo (mesmo mecanismo do `MobileNav` atual).
- Componentes novos necessários (em `src/components/layout`): `BottomNav` (barra e painel), ver "Arquitetura".
- Tokens de tema usados/criados: usa os existentes; cria `layout.bottomNavHeight` em `src/styles/theme.ts`.

## Arquitetura da solução

### Dados (`src/lib/nav.ts`)
- Acrescentar `BOTTOM_NAV_ITEMS`: os três atalhos da barra, derivados de `NAV_ITEMS` pelo `href` (Início `/dashboard`, Entrada `/veiculos/entrada`, Saída `/veiculos/saida`), com rótulo curto ("Início", "Entrada", "Saída"). Derivar evita duplicar endereço e ícone; um teste garante que cada atalho existe em `NAV_ITEMS`.
- Acrescentar `isMenuTabActive(pathname)`: verdadeiro quando nenhum dos atalhos está ativo (`!BOTTOM_NAV_ITEMS.some(...)`), usado para destacar o item Menu (RF6). Reaproveita `isNavItemActive`.
- `NAV_ITEMS` e `isNavItemActive` não mudam.

### Tema (`src/styles/theme.ts`)
- Em `shared`: `layout: { bottomNavHeight: "64px" }`. Entra no tipo `AppTheme` por herança (`Omit<typeof shared, "radii">`), então todos os temas o recebem.

### Componentes (`src/components/layout`)
- `BottomNav/BottomNav.tsx` (Client Component, `"use client"`: usa `usePathname`, estado do painel e `<dialog>`):
  - `<nav aria-label="Navegação principal">` com três links (`next/link`) de `BOTTOM_NAV_ITEMS` e um botão Menu (`aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`).
  - O `<dialog>` com a lista de `NAV_ITEMS` (linhas com ícone, nome e seta; a atual com `aria-current`), título "Menu" e botão de fechar. Mesma lógica de abrir/fechar do `MobileNav` atual: `showModal()`, fecha em mudança de rota, no backdrop, no Esc, devolve o foco ao botão Menu e fecha se a tela crescer até `breakpoints.lg`.
  - Item ativo e Menu ativo definidos via `isNavItemActive` e `isMenuTabActive`.
- `BottomNav/BottomNav.styles.ts`: estilos da barra, dos itens e do painel só com tokens do tema; `display: none` a partir de `breakpoints.lg`; `padding-bottom: env(safe-area-inset-bottom, 0px)`; transição do painel só sob `prefers-reduced-motion: no-preference`.
- `BottomNav/index.ts`: exporta `BottomNav`.
- `AppShell.tsx`: renderiza `<BottomNav />` depois do `AppFooter`.
- `AppShell.styles.ts`: abaixo de `lg`, `Layout` ganha `padding-bottom: calc(layout.bottomNavHeight + env(safe-area-inset-bottom, 0px))`, para o rodapé (versão) não ficar sob a barra.
- `Header.tsx`: remove `<MobileNav />`. O restante do cabeçalho não muda (o `Bar` já é flex; conferir que o logotipo ocupa o lugar do botão).
- `MobileNav/`: removido. `NavSign`: remove a variante `panel` (e o ramo de estilo correspondente), que fica sem uso; `NavSign` passa a servir só o pórtico (`variant` deixa de ser necessária e some das props).

### Ajuste em outra tela
- `src/components/mensalistas/Mensalistas.styles.ts`: o botão flutuante `NovoFlutuante` (só abaixo de `md`) sobe `layout.bottomNavHeight` para ficar acima da barra: `bottom: calc(${space[3]}px + ${bottomNavHeight} + env(safe-area-inset-bottom, 0px))`. A folga de 88px do `Page` (`$reservaFab`) continua valendo, pois a folga da barra já vem do `Layout`.

### Área segura (`src/app/layout.tsx`)
- `viewport` ganha `viewportFit: "cover"` para `env(safe-area-inset-bottom)` funcionar no iOS (PWA e Safari). Sem isso o recuo vale 0 e a barra pode ficar sob a barra de gestos.

### Server vs Client
- `BottomNav`: Client Component (hooks, `<dialog>`). `AppShell` já é Client Component. `nav.ts` é módulo puro (sem diretiva).

## Decisões técnicas e trade-offs
- **Um componente para barra e painel** (como já era o `MobileNav`): o botão Menu controla o `<dialog>`, e o estado do painel não precisa subir para o `AppShell`. Alternativa descartada: dois componentes ligados por contexto, mais código para o mesmo resultado.
- **`<dialog>` nativo** para o painel, em vez de uma folha própria: dá foco preso, Esc, camada superior (por cima de tudo) e inércia do fundo sem biblioteca; é o que o menu atual já usa e está testado em uso.
- **Atalhos derivados de `NAV_ITEMS`**: uma só fonte de verdade para endereços e ícones; se um endereço mudar, a barra acompanha.
- **Token `layout.bottomNavHeight`** em vez de um número solto em três arquivos (shell, botão flutuante, painel): o botão flutuante e a folga do conteúdo dependem do mesmo valor.
- **Mesmo ponto de corte (`lg`)** do pórtico: de `lg` para cima o computador tem o pórtico; abaixo, a barra. Evita ter dois menus ou nenhum em tablets.
- **Sem filtro por permissão** agora: o menu atual não filtra, e o PRD deixa isso fora de escopo.

## Desvios na implementação
- O `BottomNav` ficou em três arquivos: `BottomBar` (a barra, só apresentação), `MenuSheet` (o painel) e `BottomNav` (o contêiner, que guarda o estado do painel e liga os dois). O comportamento é o previsto.
- A barra usa os ícones do protótipo aprovado (casa, entrada, saída e menu, traço de 2,4), em `BottomBarIcons.tsx`, e não os do pórtico (`NavIcon`, traço de 1,8). O pórtico do computador e o painel do Menu continuam com os ícones atuais.
- Além de `viewportFit: "cover"`, o `body` ganhou recuo lateral com `env(safe-area-inset-left/right)` em `globals.css`, para o celular deitado não deixar o conteúdo sob o entalhe.
- `NavSign` perdeu também a prop `onNavigate`, que só o painel antigo usava.

## Riscos / pontos de atenção
- **`viewportFit: "cover"`** vale para o sistema todo (inclui a página pública do comprovante e do contrato): em celulares com entalhe, em paisagem, o conteúdo pode chegar à borda. Mitigação: conferir as telas públicas e, se preciso, aplicar `padding` com `env(safe-area-inset-*)` nelas.
- **Teclado virtual**: em alguns celulares a barra fixa sobe junto com o teclado e cobre campos. Mitigação: conferir os formulários (entrada, saída, caixa); usar `position: fixed` simples, sem truques de altura, e a barra some atrás de modais (camada superior).
- **Outras peças fixas na base**: hoje só o `NovoFlutuante` de mensalistas; conferir se há mais algum antes de concluir (varredura por `position: fixed` com `bottom`).
- **Botão de instalar o app** (`InstallPwaButton`) fica no cabeçalho; não é afetado.
- **Tablet em paisagem** abaixo de `lg` (por exemplo, 1000px): a barra ocupa a largura toda, com quatro colunas largas. Aceitável; se ficar estranho, limitar a largura útil.
- **Roteamento**: `/veiculos/entrada` e `/veiculos/saida` já existem; um teste cobre que os atalhos apontam para itens existentes.

## Fora de escopo técnico
- Mudanças no pórtico (`Gantry`) e no menu do computador.
- Quinto item na barra, permissões por item, gestos, notificações nos itens.
- Revisão geral de safe area em todas as telas além da checagem das públicas.
