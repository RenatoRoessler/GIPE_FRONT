# Design Spec: Estrutura do Projeto Logado

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Cobre a casca da área logada: header, menu lateral e dashboard inicial.

## Direção de layout

Modo **Operate** (PRODUCT.md): o usuário está em uma ferramenta de gestão operacional/financeira, usada em turno contínuo (caixa/manobrista) ou em sessões administrativas (admin/gerente). A estrutura precisa transmitir **confiança e controle** (Product Principle 3), não parecer um admin genérico de template — mas sem sacrificar escaneabilidade e velocidade (Principle 1).

Decisão de layout: **sidebar fixa em desktop + header superior fino**, em vez dos dois padrões mais óbvios (sidebar colapsável hambúrguer sempre, ou topbar com menu horizontal). Motivo:
- Menu lateral com 5 itens fixos + potencial de crescer (permissões por perfil, futuro) se beneficia de um espaço vertical estável, sempre visível em desktop — não some atrás de um hambúrguer para quem usa o sistema o turno inteiro.
- Header fica reservado só para identidade do usuário/sessão (boas-vindas + ações de conta), sem competir por espaço com navegação — reforça a leitura "o menu lateral é sobre o sistema, o header é sobre quem está logado".
- Em mobile, a sidebar recolhe para um drawer acionado por ícone de menu no header — comportamento nativo esperado, sem reinventar.

## Componentes do design system

### Reaproveitados
- **Text** (`src/components/ui/Text`) — variantes `heading` (boas-vindas do header, título do dashboard) e `body`/`muted` (subtítulos).
- **Card** (`src/components/ui/Card`) — usado no conteúdo do dashboard (bloco de boas-vindas).

### Novos (a criar em `src/components/ui`, seguindo o padrão do Button: `Component.tsx` + `Component.styles.ts` + `index.ts`, transient props `$variant`/`$active`)

- **AppShell** (layout de composição, não necessariamente um componente visual isolado, mas a estrutura que combina Header + Sidebar + área de conteúdo)
  - Estrutura: grid de duas colunas em desktop (`sidebar` fixa `240px` + `1fr` de conteúdo, com `header` ocupando o topo da coluna de conteúdo); em mobile, uma coluna só, sidebar vira drawer sobreposto.
  - Área de conteúdo com `padding: space[4]` (16px) em mobile e `space[5]`/24-32px em desktop, fundo `colors.surface` para destacar os `Card`s do dashboard sobre `colors.background`.

- **Header**
  - Barra fixa no topo da área de conteúdo, altura ~64px, fundo `colors.background`, borda inferior `colors.border`.
  - Conteúdo: à esquerda, ícone de menu (☰) visível só em mobile/tablet para abrir a sidebar; ao centro/esquerda em desktop, mensagem de boas-vindas (`Text variant="heading"`, ex.: "Olá, {nome do usuário}"); à direita, `UserMenu`.
  - Estado de carregamento do nome do usuário: skeleton/placeholder curto (largura fixa, `colors.surface`) até a sessão resolver — nunca mostrar "undefined" ou tela piscando.

- **UserMenu** (ícone de usuário + dropdown)
  - Trigger: avatar circular (`radii.full`), iniciais do nome ou ícone genérico de usuário, fundo `colors.primarySoft`, texto `colors.primary`.
  - Dropdown: painel flutuante ancorado à direita do avatar, fundo `colors.background`, borda `colors.border`, `radii.md`, sombra `shadows.md`. Duas opções:
    - "Editar Usuário" — item de menu padrão (ícone + label), navega para a rota de edição de usuário.
    - "Sair" — visualmente separado (divisor fino `colors.border` acima), texto em `colors.danger` para sinalizar ação de saída da sessão.
  - Abre ao clicar no avatar (não hover, para funcionar bem em touch/mobile), fecha ao clicar fora ou selecionar uma opção.

- **Sidebar** (revisão 2 — integrada ao Header, usando as cores do tema ativo em vez de um fundo escuro fixo)
  - Faixa vertical colada na borda esquerda, sem cartão flutuante/sombra: mesma cor de fundo do Header (`colors.background`) e mesma `colors.border` como divisória (`border-right`), para ler como uma extensão do Header — "quase o mesmo componente" — em vez de um bloco visualmente destacado.
  - O bloco da marca ("GIPE") tem altura fixa de 64px, igual à altura do Header, com `border-bottom` na mesma `colors.border` — a linha do Header e a linha do bloco de marca se encontram na mesma altura, reforçando a leitura de uma única peça em "L".
  - Marca: indicador circular bicolor (metade `colors.primary`, metade `colors.danger`) + texto "GIPE" em `colors.text`.
  - Itens do menu (5, na ordem do PRD) com ícone próprio (sem biblioteca externa) + label, em pílula (`radii.md`).
  - Estado ativo: pílula preenchida com `colors.primary` sólido (azul no tema claro, âmbar no escuro) e texto/ícone em `colors.onPrimary` — sempre legível nos dois temas.
  - Estado padrão: texto/ícone em `colors.textMuted`; hover/foco: fundo `colors.surface` + texto `colors.text`, outline `colors.primary` no foco por teclado.
  - Como usa os tokens compartilhados do tema (não mais uma paleta própria fixa), a Sidebar muda de cor junto com o restante do sistema ao alternar claro/escuro pelo botão do Header.
  - Comportamento em desktop (`>= breakpoints.lg`): colapsada por padrão (só ícones, ~76px de largura), expande para 260px ao passar o mouse por cima (mostrando marca por extenso e labels dos itens) e recolhe ao tirar o mouse — padrão "rail" hover-to-expand, sem precisar de clique.
  - Mobile/tablet (`< breakpoints.lg`): sem hover, então a faixa vira um drawer que desliza a partir da esquerda (sempre expandido, com labels) sobre um overlay semi-transparente (`rgba` sobre `colors.text`), fechado por padrão, aberto pelo ícone de menu do header.
  - Os tokens dedicados `sidebarBackground`/`sidebarText`/`sidebarTextActive`/`sidebarItemHover` criados na revisão anterior foram removidos do tema — a Sidebar agora reaproveita `background`/`border`/`text`/`textMuted`/`surface`/`primary`/`onPrimary`, que já existem nos dois temas.

### Tokens
Header/UserMenu reaproveitam a paleta existente (`primary`, `primarySoft`, `surface`, `background`, `border`, `danger`) sem token novo. A Sidebar (fundo escuro flutuante) precisou de 4 tokens novos em `colors`: `sidebarBackground`, `sidebarText`, `sidebarTextActive`, `sidebarItemHover` — ver seção Sidebar acima. Se o avatar de usuário precisar de mais variação de cor (múltiplas cores por iniciais), isso fica fora de escopo desta versão — usar sempre `primarySoft`/`primary`.

### Tema claro/escuro (atualização)
`src/styles/theme.ts` agora exporta dois temas completos — `lightTheme` ("Confiança Azul") e `darkTheme` ("Ardósia Âmbar") — em vez de um único `theme`. Um token novo, `colors.onPrimary`, define a cor de texto/ícone correta sobre `colors.primary` em cada tema (branco no claro, quase-preto no escuro, já que o âmbar do tema escuro é claro demais para texto branco) — usado em `Button` (variant padrão), `Stepper` (passo concluído) e no item ativo da `Sidebar`. A troca entre os dois temas é global (`ThemeModeProvider`, ver techspec) e persiste em `localStorage`; um botão de sol/lua no `Header` alterna entre eles.

## Telas e estados

### Header + UserMenu
- **Padrão**: boas-vindas com nome do usuário + avatar.
- **Carregando sessão**: skeleton no lugar do nome; avatar com estado neutro (ícone genérico) até os dados do usuário resolverem.
- **Dropdown aberto**: overlay leve para capturar clique fora (fecha o menu); duas opções conforme acima.
- **Ação "Sair"**: sem tela de confirmação (fora de escopo) — logout imediato e redirecionamento para fora da área logada.

### Sidebar
- **Padrão (desktop)**: sempre visível, item ativo destacado.
- **Padrão (mobile)**: fechada; abre como drawer sobre o conteúdo ao tocar no ícone de menu do header; fecha ao selecionar um item ou tocar fora.
- **Item para tela ainda não implementada**: navega normalmente para a rota (RF9 do PRD) — a tela de destino sendo placeholder é responsabilidade da spec daquela feature, não desta.

### Dashboard
- **Padrão único desta versão**: um `Card` centralizado ou no topo da área de conteúdo com `Text variant="heading"` de boas-vindas (ex.: "Bem-vindo ao GIPE") e `Text variant="muted"` de apoio curto (ex.: "Mais informações aparecerão aqui em breve"). Sem loading/erro/vazio adicionais — é conteúdo estático nesta fase.

## Responsividade
- Breakpoint relevante: `breakpoints.lg` (1024px) — acima dele, sidebar fixa lado a lado com o conteúdo; abaixo, sidebar vira drawer.
- Header mantém a mesma altura (~64px) em todas as resoluções; em mobile, ícone de menu aparece à esquerda e o texto de boas-vindas pode truncar (`text-overflow: ellipsis`) para não colidir com o avatar.
- Área de conteúdo do dashboard: `Card` ocupa largura total até um máximo confortável de leitura (ex.: 640px) e centraliza em telas muito largas, evitando texto esticado de ponta a ponta.
- Drawer da sidebar em mobile ocupa até ~80% da largura da viewport (nunca tela cheia), para deixar visível que há conteúdo atrás e permitir fechar tocando fora.
