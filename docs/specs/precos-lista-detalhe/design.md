# Design Spec: Gestão de Preços em lista e detalhe

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` e do modelo "3 · Lista e detalhe" aprovado na avaliação de layouts. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. A tela substitui a tabela de `/precos` e passa a ser também a visualização somente leitura. O wizard de cadastro e edição não muda.

## Direção

Modo **Operate** para quem administra preços. O princípio do produto que guia a tela: *entender exatamente que regra de cobrança está ativa e por quê*. Por isso a **placa tarifária** (degraus de tempo e valor) é o objeto central do detalhe, grande e legível, e a lista ao lado serve para escolher qual placa olhar.

Gestos visuais, todos contidos:
- A placa tarifária em azul de sinalização domina o detalhe e é o único bloco de cor cheia; o resto é tipografia e linhas.
- O simulador tem borda forte (`text`) e o resultado em fonte `display`, para parecer uma ferramenta de conferência e não mais um campo de formulário.
- A situação (Vigente, Agendada, Encerrada, Inativa) e o tipo de regra ficam sempre juntos, nos itens da lista e no cabeçalho do detalhe, para ler "o que é" e "se vale agora" no mesmo olhar.

Dado financeiro pede clareza e confiança: algarismos tabulares, estado sempre dito em texto, a estimativa sempre rotulada como estimativa.

## Componentes do design system

### Reaproveitados
`Button` (`primary` em "Novo preço", `secondary` em "Editar", `sm` nos controles da lista), `Input` (busca e permanência), `Select` (categoria e filtro de situação), `StatusBadge`, `Tabs` (acessível, com setas, Home e End), `Pagination`, `Skeleton`, `ErrorBanner`, `Text`, `Toast`, `Table` não é mais usado nesta tela.

Reaproveitados da feature: `FaixasPreview` (a placa tarifária), formatadores de `components/precos/format.ts` e `situacao.ts` (rótulos e tons das situações).

### Novos
Todos de feature (`components/precos`), nenhum de design system:
- **`PrecosMasterDetail`**: o contêiner de duas colunas e a lógica de alternar para tela cheia no celular.
- **`PrecoListItem`**: o item da lista (descrição, tipo e situação), como botão de seleção.
- **`PrecoDetalhe`**: cabeçalho, abas e simulador do detalhe.
- **`PrecoSemana`**: a grade de horários da semana (sete linhas com trilho de 24 h).
- **`SimuladorCobranca`**: categoria, permanência, resultado e explicação.

## Tokens usados

Nenhum token novo. Reaproveita: `colors.primary`, `primarySoft`, `onSign`, `signEdge`, `warn`/`onWarn` (diária na placa), `success`, `danger`, `surface`, `background`, `border`, `text`, `textMuted`; `space`, `radii`, `fontSizes`, `fontWeights`; `typography.display*` para o título da tabela, o valor da estimativa e o título da seção; `shadows.sm` na placa.

Cores de **tipo de regra** (marcador de 10 px no item): Padrão `primary`, Convênio `success`, Promocional `warn`, Evento `steel`. São só um reforço; o nome do tipo sempre aparece em texto.

## Tela (desktop)

Cabeçalho: título "Gestão de Preços" à esquerda e **Novo preço** à direita, como hoje. Abaixo, uma moldura de duas colunas: lista (largura fixa de ~320px) e detalhe (restante), separadas por uma borda. A moldura tem altura própria e cada coluna rola sozinha, para a lista e o detalhe não se arrastarem juntos.

### Coluna da lista
De cima para baixo:
1. **Busca**: `Input` com rótulo oculto "Buscar tabela de preço", `type="search"`, placeholder "Buscar tabela de preço"; limpa com Esc.
2. **Filtro de situação**: `Select` compacto (Todas, Vigente, Agendada, Encerrada, Inativa) com a contagem do filtro atual abaixo ("7 tabelas" / "3 vigentes"), em `aria-live="polite"`.
3. **Itens**: cada item mostra a descrição em peso `medium` e, na linha de baixo, o tipo (marcador colorido + nome em caixa alta pequena) e o `StatusBadge` da situação. O item selecionado tem fundo `background` com barra de 4px em `primary` à esquerda, em contraste com o fundo `surface` da coluna.
4. **Paginação** no rodapé da coluna (`Pagination`), compacta: "1–20 de 134" e Anterior/Próxima.

Estados da lista:
- *Carregando*: oito `Skeleton` de altura de item.
- *Trocando de página*: itens atuais esmaecidos (mantém a altura), com `aria-busy`.
- *Sem resultado da busca/filtro*: "Nenhuma tabela encontrada" com botão **Limpar busca**.
- *Vazio de verdade*: "Nenhuma tabela de preço cadastrada." com **Novo preço**.
- *Erro*: `ErrorBanner` com a mensagem e **Tentar novamente**.

### Coluna do detalhe
**Cabeçalho**: título da tabela em `display`, abaixo o tipo, a `StatusBadge` e a vigência ("06/06/2026 → sem fim", algarismos tabulares); à direita **Editar** (`secondary`).

**Abas** (`Tabs`): Tarifa, Horários, Informações. A aba escolhida é lembrada ao trocar de tabela.
- **Tarifa**: em duas colunas a partir de `md`. À esquerda, `FaixasPreview` em tamanho grande (degraus em `display`, diária em destaque `warn`, e "Conveniada −30%" no topo da placa quando houver). À direita, uma lista rótulo/valor com tolerância de entrada, tolerância de alteração de faixa e categorias (chips de texto; "Todas" quando 99).
- **Horários**: régua de 0h a 24h no topo e sete linhas (Dom a Sáb): nome do dia, trilho de 24 h com o segmento de cobrança em `primary`, e o texto do intervalo à direita ("06:00–22:00", "Dia inteiro" ou "Sem cobrança"). Regra inativa fica esmaecida com o texto "Inativa"; regra com período específico mostra "de 01/12 a 31/01" em texto pequeno.
- **Informações**: lista rótulo/valor em duas colunas (uma no celular): tipo de regra, vigência, situação, período e valor da diária, valor adicional. Empresa conveniada fica oculta enquanto vazia.

**Simulador de cobrança** (abaixo das abas, em todas elas): bloco com borda de 2px em `text`, título "Simular cobrança" em `display` caixa alta pequena.
- Controles: `Select` de **Categoria** e **Permanência** com um controle deslizante (de 0 a 15 h, passo de 5 min) ligado a um `Input` numérico em minutos, com a equivalência em texto ("2 h 30 min").
- Resultado: valor grande em `display` (R$) e, ao lado, a explicação em texto ("Degrau até 3 h", "Dentro da tolerância de entrada (10 min)", "Diária mais 2 h de adicional", "com desconto de 30% da conveniada"). Se a tabela não atende a categoria, no lugar do valor: "Esta tabela não se aplica a {categoria}." em `textMuted`.
- Aviso fixo em `textMuted`, `fontSizes.xs`: "Estimativa. O valor real é calculado no momento da saída."
- Mudança de resultado anunciada em `aria-live="polite"`, sem repetir a cada passo do controle deslizante (anuncia ao soltar ou ao parar de digitar).

Estados do detalhe:
- *Carregando*: `Skeleton` no cabeçalho, na placa e nas linhas.
- *Erro*: `ErrorBanner` com **Tentar novamente**, sem derrubar a lista.
- *Tabela não encontrada*: "Esta tabela de preço não existe mais." com botão para ir à primeira da lista.
- *Nenhuma selecionada* (lista vazia): o detalhe mostra o vazio da lista, sem placa fantasma.

## Navegação e interações
- Clicar num item seleciona e atualiza o endereço (`?preco=...&q=...&situacao=...&pagina=...`); não abre a edição.
- **Editar** abre o wizard existente; ao salvar, volta para esta tela com a tabela salva selecionada e o `Toast` "Tabela de preço atualizada." (como hoje).
- **Novo preço** abre o cadastro; ao salvar, volta com a nova tabela selecionada e o `Toast` "Tabela de preço criada.".
- Teclado: na lista, setas cima/baixo movem a seleção entre itens, Enter confirma; Tab sai da lista para as abas. Nas abas valem setas, Home e End do componente `Tabs`.
- Foco: ao selecionar um item com o teclado, o foco permanece no item; o detalhe é anunciado por região `aria-live` ("Tarifa padrão rotativo selecionada").

## Celular (< `md`)
- Mostra só a **lista** (busca, filtro, itens e paginação) em tela cheia, com o botão "Novo preço" abaixo do título.
- Ao tocar num item, abre o **detalhe** em tela cheia com cabeçalho fixo: botão **Voltar** (seta e texto "Preços"), título da tabela e **Editar**. A lista volta como estava (busca, filtro, página e posição).
- Nas abas, "Tarifa" mostra a placa em largura total, depois as tolerâncias; "Horários" mantém as sete linhas com o trilho e o texto abaixo do nome do dia; o simulador desce para o fim, com controle deslizante em largura total.
- Alvos de toque ≥ 44px nos itens da lista, nas abas e nos controles do simulador.
- O botão Voltar do navegador também volta para a lista (a seleção está no endereço).

## Acessibilidade
- Lista como `listbox`/lista de botões com `aria-current="true"` no item selecionado; busca com rótulo; contagem em `aria-live`.
- Abas com padrão WAI-ARIA já implementado em `Tabs`; painel com `aria-labelledby`.
- Trilho de horário com texto equivalente em cada linha; o segmento colorido é redundante com o texto.
- A estimativa nunca depende só de cor; o aviso "Estimativa" é texto visível e lido junto do resultado.
- Contraste AA nos quatro temas, inclusive a placa em azul com texto `onSign` e a diária em `warn`/`onWarn`.
- Respeita `prefers-reduced-motion` (sem transições na troca de seleção e de aba).

## Responsividade
- **≥ `md` (768px)**: duas colunas (lista de ~320px e detalhe); cada uma rola sozinha dentro da moldura.
- **< `md`**: uma coluna por vez (lista, depois detalhe) como descrito acima.
- **`sm` (480px)**: o simulador empilha categoria e permanência; a lista usa itens de duas linhas sem truncar a descrição (quebra de linha).
- Sem rolagem horizontal da página em nenhum tamanho; a régua e as linhas de horário se ajustam à largura.
