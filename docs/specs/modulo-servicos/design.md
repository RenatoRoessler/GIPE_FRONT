# Design Spec: Módulo de Serviços

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. O módulo tem duas telas: **Catálogo** (administração, desktop) e **Fila** (operação, celular no pátio), mais um painel de serviços dentro do veículo no Pátio.

## Direção

Dois modos, uma linguagem.
- **Catálogo** é modo **Operate** administrativo: lista e detalhe, mesmo padrão já aprovado em Gestão de Preços, para o administrador reconhecer a tela. O objeto central é a **tabela de preços por categoria** do serviço, legível como uma lista de valores com algarismos tabulares.
- **Fila** é modo **Operate** de portão: o lavador está de pé, com a mão suja, no celular. Princípio do produto: *velocidade operacional acima de tudo*. Cartões grandes, uma ação principal por cartão ("Iniciar", "Concluir"), alvo de toque ≥ 44px e a placa como identificador dominante, na mesma `PlateDisplay` usada no pátio.

Gestos visuais, todos contidos:
- A **placa** é o único elemento de destaque do cartão da fila; o resto é tipografia e linha.
- O status é sempre dito em texto (Aguardando, Em execução, Pronto) com `StatusBadge`; a cor só reforça.
- Dinheiro em `fontFamilies`/numerais tabulares, sempre com "R$" e duas casas.
- Nada de ícones decorativos em cartões; ícone só quando troca texto por ação conhecida.

## Componentes do design system

### Reaproveitados
`Button` (`primary` para a ação do status e "Novo serviço", `secondary` para "Editar", `danger` no cancelamento, `sm` nos controles de lista), `Input`, `Textarea` (motivo do cancelamento e descrição), `NumberStepper` (minutos), `Select`, `Switch` (ativo/inativo), `Tabs` (colunas da fila no celular), `Modal` (desktop) e `BottomSheet` (celular) para formulário e cancelamento, `ConfirmDialog` (inativar), `StatusBadge`, `PlateDisplay`, `Pagination`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`, `Combobox` (escolher serviços a acrescentar).

### Novos
Todos de feature (`components/servicos`), nenhum de design system:
- **`ServicosMasterDetail`**: contêiner de duas colunas (e alternância para tela cheia no celular), no mesmo molde de preços.
- **`ServicoListItem`**: item da lista (nome, duração, situação).
- **`ServicoDetalhe`**: cabeçalho, tabela de preços e informações.
- **`ServicoFormModal`**: cadastro e edição.
- **`PrecosPorCategoria`**: campos de valor por categoria, com o modo "mesmo valor para todas".
- **`FilaServicos`** e **`FilaCard`**: a fila e o cartão de serviço de um veículo.
- **`ServicosDoVeiculo`**: painel de serviços dentro do detalhe do veículo no Pátio.
- **`CancelarServicoDialog`**: motivo obrigatório.

Se `PlateDisplay` não oferecer tamanho compacto para o cartão, a variante `size` entra no design system, não solta na feature.

## Tokens usados

Nenhum token novo. Reaproveita `colors.primary`, `primarySoft`, `accent`, `success`, `warn`/`onWarn`, `danger`/`dangerSoft`, `surface`, `surfaceMuted`, `background`, `border`, `borderStrong`, `text`, `textMuted`, `focus`; `space`, `radii`, `fontSizes`, `fontWeights`; `typography.display*` nos títulos e no valor; `shadows.sm` no cartão; `layout.touchTarget` nos botões da fila e `layout.stickyTop` no cabeçalho fixo.

Tons de status (via `StatusBadge`): Aguardando `neutral`, Em execução `warn`, Pronto `success`, Cancelado `danger`; Ativo `success` e Inativo `neutral` no catálogo. Confirmar os nomes de `StatusBadgeTone` no Tech Spec.

## Tela 1: Catálogo (desktop)

Rota do menu **Serviços**. Cabeçalho: "Serviços" à esquerda e **Novo serviço** (`primary`) à direita. Moldura de duas colunas, lista (~320px) e detalhe, cada uma rolando sozinha.

### Lista
1. **Busca** por nome (`Input type="search"`, rótulo oculto "Buscar serviço"), filtro local na lista carregada (a API não expõe busca).
2. **Filtro** Ativos / Inativos / Todos (`Select` compacto; padrão Ativos) com a contagem em `aria-live="polite"`.
3. **Itens**: nome em `medium`; abaixo, duração ("45 min") e `StatusBadge` de situação. Selecionado: fundo `background` + barra de 4px `primary` à esquerda.

Estados: *Carregando* (oito `Skeleton`), *Sem resultado* ("Nenhum serviço encontrado" + **Limpar busca**), *Vazio* ("Nenhum serviço cadastrado." + **Novo serviço**), *Erro* (`ErrorBanner` + **Tentar novamente**). Sem paginação: a API devolve a lista completa.

### Detalhe
**Cabeçalho**: nome em `display`; `StatusBadge`; à direita **Editar** (`secondary`) e **Inativar** (`secondary`, tom de perigo só no diálogo). Para serviço inativo, **Inativar** some e aparece o aviso "Serviço inativo: não pode ser acrescentado a veículos".

**Descrição** em texto corrido.

**Tempos**: duas linhas rótulo/valor: "Duração estimada" e "Tempo permitido", em minutos com equivalência ("90 min · 1 h 30").

**Preços por categoria**: lista rótulo/valor com as seis categorias (Moto, Carro pequeno, Carro médio, Caminhonete, Caminhão, Carro grande), valores alinhados à direita em algarismos tabulares. Categoria sem preço mostra "—" e o texto "Não atende" em `textMuted`. Quando o serviço tem preço único ("Todas"), uma única linha "Todas as categorias".

Estados do detalhe: *Carregando* (`Skeleton`), *Erro* (`ErrorBanner` sem derrubar a lista), *Não encontrado* ("Este serviço não existe mais." + ir ao primeiro).

### Formulário (cadastro e edição)
`Modal` no desktop, `BottomSheet` em tela cheia no celular. Campos:
1. **Nome** (obrigatório).
2. **Descrição** (`Textarea`, opcional).
3. **Duração estimada (min)** e **Tempo permitido (min)** (`NumberStepper`/`Input numeric`, lado a lado ≥ `sm`).
4. **Preços**: `Switch` "Mesmo valor para todas as categorias". Ligado: um campo de valor. Desligado: seis campos, um por categoria; campos vazios significam "não atende". Pelo menos um valor é exigido.

Validação no envio e ao sair do campo, mensagem junto do campo (nunca só cor). Botões: **Salvar** (`primary`) e **Cancelar**. Erro 400 do servidor mostra `ErrorBanner` no topo do formulário. Ao salvar: `Toast` "Serviço criado." / "Serviço atualizado." e o serviço fica selecionado.

### Inativar
`ConfirmDialog`: "Inativar {nome}?" com o texto "Ele deixa de aparecer ao acrescentar serviços a veículos. O histórico é mantido." Confirma em `danger`. `Toast` "Serviço inativado.".

## Tela 2: Fila (celular primeiro)

Rota própria dentro do módulo Serviços, pensada para o lavador. Cabeçalho com título "Fila de serviços" e contagem total.

### Estrutura
- **Celular (< `md`)**: `Tabs` fixas no topo com as três colunas, cada aba com a contagem: **Aguardando (3)**, **Em execução (1)**, **Pronto (2)**. A aba escolhida fica no endereço (`?status=`). Abre em Aguardando.
- **Desktop (≥ `md`)**: três colunas lado a lado (kanban simples, sem arrastar), cada uma com título, contagem e rolagem própria. Mesmos cartões.

### Cartão (`FilaCard`)
De cima para baixo:
1. **Placa** (`PlateDisplay`, compacta) e, à direita, o horário de entrada do veículo ("entrou 14:20").
2. **Serviço**: nome em `semibold`.
3. **Veículo**: modelo, cor e categoria em uma linha de `textMuted`; **prisma** quando houver, com rótulo em texto ("Prisma 12").
4. **Ação principal**, largura total no celular, ≥ 44px:
   - Aguardando → **Iniciar** (`primary`)
   - Em execução → **Marcar como pronto** (`primary`)
   - Pronto → **Voltar para em execução** (`secondary`, para desfazer engano)
5. **Cancelar** como link secundário discreto no rodapé do cartão (abre `CancelarServicoDialog`).

Ordenação: por chegada do veículo (mais antigo primeiro), como a API entrega. O cartão mais antigo de Aguardando não ganha destaque artificial.

### Interação
- Ao tocar na ação, o cartão muda de coluna imediatamente (atualização otimista), com `Toast` "Serviço em execução." e opção **Desfazer** por alguns segundos. Se a API falhar, o cartão volta e aparece `Toast` de erro.
- A fila se atualiza sozinha em intervalo curto e ao voltar o foco para a aba, sem perder a posição de rolagem. Mostrar "Atualizado há 12 s" em `textMuted`.
- Alvos de toque ≥ `layout.touchTarget`; espaçamento entre cartões suficiente para evitar toque errado com luva.

Estados: *Carregando* (três `Skeleton` de cartão), *Coluna vazia* ("Nenhum serviço aguardando." em `textMuted`, sem ilustração), *Fila toda vazia* ("Nenhum serviço na fila. Os serviços acrescentados aos veículos aparecem aqui."), *Erro* (`ErrorBanner` + **Tentar novamente**, mantendo os cartões já carregados), *Sem permissão* (tela de acesso negado existente).

### Cancelar (`CancelarServicoDialog`)
`BottomSheet` no celular, `Modal` no desktop. Título "Cancelar serviço", resumo (placa e serviço), `Textarea` **Motivo** obrigatório com contador, botões **Cancelar serviço** (`danger`, desabilitado até haver motivo) e **Voltar**. Sucesso: `Toast` "Serviço cancelado." e o cartão sai da fila.

## Tela 3: Serviços do veículo (dentro do Pátio)

Seção "Serviços" no detalhe do veículo no pátio, abaixo dos dados do veículo.
- **Lista** dos serviços do veículo: nome, valor da categoria do veículo, `StatusBadge` e, para quem tem permissão, o mesmo controle de status e **Cancelar** do cartão da fila.
- Interruptor "Mostrar cancelados": os cancelados aparecem esmaecidos, com o motivo em `textMuted`.
- **Acrescentar serviços**: botão `secondary` que abre `Modal`/`BottomSheet` com a lista de serviços ativos como caixas de seleção (`Checkbox`), cada uma com o valor para a categoria do veículo; serviço sem preço para a categoria aparece desabilitado com "Não atende esta categoria". Rodapé fixo com o total selecionado ("2 serviços · R$ 80,00") e **Acrescentar** (`primary`). Sucesso: `Toast` "Serviços acrescentados.".
- Estados: *Sem serviços* ("Nenhum serviço neste veículo." + **Acrescentar serviços**), *Carregando* (`Skeleton`), *Erro* (`ErrorBanner`).

## Navegação

- Item **Serviços** no menu, respeitando permissão por perfil; no celular entra no grupo de menus existente (sem competir com o botão central de Entrada).
- Dentro do módulo, duas abas de topo: **Fila** e **Catálogo**. Lavador cai em Fila e não vê Catálogo; administrador e gerente caem em Catálogo.
- Seleção e filtros no endereço (`?servico=`, `?status=`) para o botão Voltar do navegador funcionar.
- Celular, Catálogo: lista em tela cheia; tocar num item abre o detalhe em tela cheia com **Voltar** e **Editar**.

## Acessibilidade

- Lista do catálogo como lista de botões com `aria-current="true"` no selecionado; busca com rótulo; contagem em `aria-live`.
- Fila: cada coluna é uma região com nome e contagem ("Aguardando, 3 serviços"). A mudança de coluna é anunciada em `aria-live="polite"` ("Serviço de lavagem, placa ABC1D23, em execução").
- Placa sempre com texto acessível; status sempre em texto.
- Foco: após mudar o status de um cartão, o foco vai para o próximo cartão da mesma coluna (ou para a coluna, se esvaziou); ao fechar diálogos, volta ao botão que os abriu.
- Contraste AA nos quatro temas; foco visível com `colors.focus`.
- Respeita `prefers-reduced-motion` (sem animação de troca de coluna).

## Responsividade

- **≥ `lg` (1024px)**: catálogo em duas colunas; fila em três colunas.
- **≥ `md` (768px)**: idem, com listas mais estreitas.
- **< `md`**: uma coluna por vez; catálogo em lista → detalhe; fila em abas.
- **`sm` (480px)**: formulário em tela cheia, campos de tempo empilhados, ação do cartão em largura total.
- Sem rolagem horizontal da página em nenhum tamanho; respeitar `layout.bottomNavReserved` no fim do conteúdo para a barra inferior não cobrir o último cartão.
