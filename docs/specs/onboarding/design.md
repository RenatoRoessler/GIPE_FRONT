# Design Spec: Tour de onboarding

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue `claude-design` (tokens em `src/styles/theme.ts`, componentes em `src/components/ui`) e `PRODUCT.md`.

## Direção

O tour aparece quando a pessoa acabou de entrar e quer **começar a trabalhar**: modo **Do**, com um toque de acolhida. Ele precisa ser curto de ler, fácil de dispensar e nunca parecer uma barreira. É **interativo**: cada passo de módulo **destaca o item no próprio menu** (menu lateral no computador, barra inferior no celular) com um **balão** ao lado, e a pessoa pode abrir o módulo clicando no item destacado. O balão não é um modal (`<dialog>`), porque um modal bloquearia o menu.

Os itens do menu são marcados com `data-tour-id` (o `navItemKey` do item, igual ao `id` do passo). Passos sem item visível usam um **balão centrado** sobre a cortina: boas-vindas, fechamento e módulos que no celular ficam no "Mais".

A memória visual de cada módulo é o **ícone do próprio menu** (`NavIcon`), em um medalhão, para a pessoa reconhecer depois, no menu, o que viu no tour. A conveniada recebe o mesmo tour, com os seus dois módulos.

## Interação com o menu

- **Cortina**: escurece a tela, com um recorte no item do passo; bloqueia cliques no resto da página. O item recebe um contorno `primary` (3px).
- **Links** (Pátio, Caixa etc.): o clique passa pelo recorte. Ao abrir o módulo, o tour avança para o passo seguinte e continua aberto (vive no `AppShell`, que não desmonta na navegação). O balão mostra a dica "Toque no item destacado para abrir X; o tour continua."
- **Ações** (Entrada e Saída): são destacadas, mas o clique fica bloqueado, pois abrem um modal por cima do tour.
- **Posição do balão**: à direita do item no menu lateral; acima do item na barra inferior; abaixo se sobrar; sempre dentro da janela, com margem de 16px.
- **Acompanhamento**: o retângulo do item é reconferido a cada quadro (o menu lateral expande ao passar o mouse; a janela pode rolar ou girar). O item é levado para a vista com `scrollIntoView`.

## Passos

Sequência do tour da equipe: **Boas-vindas** → um passo por módulo disponível ao perfil, na ordem do menu (Visão Geral, Pátio, Entrada, Saída, Conferência, Financeiro, Caixa, Faturas, Notas Fiscais, Minha Empresa, Configurações, Preços, Quadros de Chaves, Mensalistas, Usuários, Empresas conveniadas) → **Pronto**. Conveniada: Boas-vindas → Carimbar ticket → Pátio da conveniada → Pronto. Só entram os módulos que o perfil acessa.

Anatomia de um passo de módulo:
- Medalhão com o `NavIcon` do módulo (fundo `primarySoft`, ícone `accent`).
- Sobretítulo "Módulo 3 de 8" (texto pequeno `textMuted`).
- Título: o nome do módulo, como no menu.
- Explicação: 2 a 3 frases curtas, para que serve e o que se faz nele.
- Onde encontrar: uma linha em `textMuted` ("No menu, em Operação."), só quando o item não está destacado (balão centrado).

Boas-vindas: título "Bem-vindo ao Murel", uma frase dizendo que o tour leva cerca de 2 minutos e que dá para sair ou revê-lo depois pela Home. Pronto: título "Tudo certo", lembra onde está o "Repetir tour".

## Estados

- **Passo (padrão)**: como descrito. Progresso na parte de cima do corpo: `ProgressBar` + texto "Passo 3 de 10".
- **Primeiro passo**: sem "Voltar".
- **Último passo**: "Concluir" no lugar de "Avançar".
- **Registrando** (após "Não mostrar mais" ou "Concluir"): o botão fica "Salvando..." e desabilitado; o resto fica travado até responder.
- **Erro ao registrar**: o tour fecha mesmo assim (não prende a pessoa) e um `Toast` discreto avisa "Não foi possível salvar. O tour pode aparecer de novo no próximo acesso." Sem `ErrorBanner` bloqueante.
- **Consulta falhou ou carregando**: nada aparece; o sistema segue normal. Sem esqueleto: o tour só abre quando a resposta chegar.
- **Repetir tour**: mesmo componente, aberto pelo botão; "Não mostrar mais" fica oculto (não faz sentido) e "Concluir" não registra nada.

## Ações e comportamento

Rodapé do balão:
- À esquerda, ações de saída: **Sair** (`secondary`) e **Não mostrar mais** (`secondary`, texto mais discreto por ser a ação permanente). Os dois ficam disponíveis em todos os passos.
- À direita, navegação: **Voltar** (`secondary`) e **Avançar** / **Concluir** (`primary`, a ação principal).
- O "×" do cabeçalho e a tecla Esc (ouvida no documento) equivalem a **Sair** (não registram). Clique na cortina não fecha, para um toque sem querer não descartar o tour.
- O foco vai para **Avançar** a cada passo; Enter avança. Setas esquerda/direita também navegam enquanto o foco está no balão. Não há trava de foco, pois o menu precisa continuar acessível.
- Mudança de passo anuncia o título para leitores de tela (região `aria-live="polite"` no conteúdo do passo).

**Repetir tour** (Home): botão `secondary` na linha de ações da Home, junto de Entrada, Saída e Gerar Cartaz, com o ícone de ajuda/play e o texto "Repetir tour". Na conveniada, o mesmo botão na tela do Carimbo, acima do formulário, alinhado à direita do título.

## Componentes do design system

### Reaproveitados
`Button` (`primary`, `secondary`), `ProgressBar`, `Toast`, `NavIcon` (`src/components/layout/NavIcons`), `Text`. Conteúdo dos módulos: nomes e ícones vindos de `NAV_ITEMS` (`src/lib/nav.ts`), para o tour e o menu não divergirem.

### Novos
- **`OnboardingTour`** (`src/components/onboarding`): cortina, contorno e balão do tour (passos, progresso, ações). Apoio: `useAlvoTour` (localiza e mede o item do menu) e `posicao.ts` (posição do balão).
- **`RepetirTourButton`**: o botão da Home e do Carimbo.
- Nenhum componente vai para `src/components/ui`: são específicos desta feature.

## Tokens usados
Sem tokens novos. `colors.primary` (contorno do item), `colors.primarySoft` (medalhão), `colors.accent` (ícone; `primary` nunca como cor de texto), `colors.textMuted` (sobretítulo, "onde encontrar", contagem), `colors.border` (divisória do rodapé), `space`, `radii.full` (medalhão), `fontSizes` (`xs` sobretítulo, `lg` título, `md` texto), `fontWeights`, `layout.touchTarget` (alvos dos botões no celular). Cores do tema claro e escuro vêm do `Modal`.

## Responsividade
- **Celular**: o balão ocupa a largura da tela (menos 16px de margem) e fica acima da barra inferior, apontando para o item. O rodapé vira duas linhas: navegação (Voltar, Avançar) em cima, em largura total, e as saídas (Sair, Não mostrar mais) embaixo, lado a lado. Alvos de 44px (`touchTarget`).
- **Computador**: balão de até 380px ao lado do item do menu lateral, rodapé em uma linha (saídas à esquerda, navegação à direita).
- **Movimento**: a troca de passo é um fade curto e a cortina, o contorno e o balão deslizam até o novo item; respeita `prefers-reduced-motion` (sem animação).

## Acessibilidade
Balão com `role="dialog"`, `aria-modal="false"` e nome "Tour de boas-vindas"; progresso com nome acessível ("Progresso do tour"); texto "Passo X de N" visível (a barra não carrega a informação sozinha); botões com nome por texto; contraste e foco herdados do tema.
