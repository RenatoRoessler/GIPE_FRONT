# Design Spec: Redesenho mobile-first da Gestão de Preços

Insumo de UI/UX a partir de `prd.md`. Esta etapa entrega **3 modelos de layout para o usuário escolher um**; só o escolhido segue para o Tech Spec. As telas dos três modelos estão em `layouts.html` (abrir no navegador: celular 360 × 640 e computador). Os valores e nomes nelas são fictícios.

## Contexto e direção

Modo **Operate** numa superfície que já tem mundo visual (tema, componentes e marca do GIPE): os três modelos herdam o tema (`src/styles/theme.ts`) e `src/components/ui`, e variam só a **estrutura** da tela. Princípio do produto que guia todos: *entender exatamente que regra de cobrança está ativa e por quê*. A **placa tarifária** (degraus e diária, azul-asfalto sobre giz) continua sendo o objeto central.

Estrutura escolhida por sorteio para liderar (`concept-seed`, chave `1ef84659`): o Modelo A. Os três são estruturas de verdade diferentes, não variações de cor.

### Regras comuns aos três modelos (resolvem o diagnóstico do PRD)
- **Menu inferior (RF11):** o `AppShell` já reserva `theme.layout.bottomNavReserved` no fim da página (a cobertura vista numa captura de página inteira era artefato do menu fixo). O que os modelos precisam garantir é que as **barras fixas do módulo** (dock, ações) fiquem **acima** do menu, a `bottomNavReserved` do rodapé, e que o fim do conteúdo ganhe folga igual à altura da barra.
- **Primeira tela do detalhe (RF12):** a 360 × 640, valores (degraus e diária) e **Editar** visíveis sem rolar.
- **Filtros (RF13):** nenhuma opção cortada pela borda; ou os chips quebram linha, ou os filtros abrem numa folha com contagem.
- **Cadastro (RF14):** ação de avançar/salvar e resumo sempre à vista ou a um toque; "Faixas: 7 degraus · diária —" deixa de contar como preenchido enquanto os valores forem o padrão não editado.
- **Alvos de toque** de 44 px (`theme.layout.touchTarget`), foco visível, estado sempre dito em texto (nunca só cor), números tabulares, estimativa sempre rotulada.
- **Título da página** não repete o rótulo do menu quando só gasta altura: o cabeçalho do módulo é uma única barra compacta com **Novo preço** à direita.

## Os 3 modelos

### A · Cockpit da tabela (sorteado)
**Ideia:** uma tabela por vez, ocupando a tela. Uma **esteira horizontal de miniplacas** (nome, tipo, 2–3 valores e a diária) troca de tabela sem sair da tela; "Ver todas (N)" abre a lista completa com busca, filtros e paginação. O **simulador** é uma barra fixa acima do menu, com o resultado sempre visível e um toque para ajustar (abre folha com categoria e permanência).

- *Consulta (celular):* barra do módulo (título, Buscar, + Novo) → esteira de miniplacas → nome, selo de situação e **Editar** → controle segmentado Tarifa / Horários / Informações → placa → dock do simulador.
- *Todas as tabelas:* tela de lista com busca, chips de situação que **quebram linha**, itens com valor-resumo ("R$ 15 a 1 h · diária R$ 100") e paginação.
- *Cadastro:* barra de 3 segmentos no lugar dos 3 cartões; formulário da etapa; **dock fixo** com o resumo ("faltam descrição e categoria") e **Avançar**; tocar no resumo abre a folha "Sua tabela" com a placa.
- *Computador:* esteira vira faixa de cartões no alto; detalhe com a placa à esquerda e o simulador numa coluna à direita.
- **Pontos fortes:** o valor e o resultado da simulação ficam na primeira tela; troca de tabela em um toque; é o que mais lembra uma ferramenta de conferência.
- **Riscos:** com muitas tabelas (dezenas) a esteira não escala, então depende de "Ver todas" e da ordem (vigentes primeiro); dock + menu inferior comem altura em telas baixas (por isso o dock é uma linha).

### B · Cartões-placa
**Ideia:** um feed vertical de cartões; cada cartão fechado já mostra o que cobra (mini-degraus + diária); tocar **expande no lugar**, com abas, placa completa, **Simular cobrança** e **Editar**. Sem tela de detalhe separada, sem "voltar", e a posição na lista nunca se perde.

- *Consulta:* barra do módulo (título, buscar, "Filtros · 1") → resumo de situação em chips com contagem (Vigentes 2, Agendadas 1, Todas 14) → cartões; apenas um aberto por vez.
- *Filtros:* folha inferior com todas as situações e a contagem de cada uma, botão "Ver N tabelas".
- *Cadastro:* **página única com 3 seções** (O básico, Quando vale, Quanto cobra) que abrem e fecham; cada uma mostra ✓ ou ! e, fechada, um resumo de uma linha; barra fixa com **Cancelar** e **Salvar · faltam N**.
- *Computador:* grade de 3 colunas; o cartão aberto ocupa 2 colunas e mostra placa, simulador e Editar lado a lado.
- **Pontos fortes:** menor número de telas e de gestos; o gestor compara valores de várias tabelas rolando; boa para poucas tabelas.
- **Riscos:** o cartão aberto fica longo e empurra os demais; o link de uma tabela precisa abrir o feed já com o cartão aberto e rolado até ele; o simulador, dentro do cartão, concorre com a placa por altura.

### C · Mesa de simulação
**Ideia:** a tela começa pela pergunta "quanto cobra?". O topo é o **simulador** (categoria, permanência por chips e controle deslizante); a lista mostra, em cada tabela, **quanto ela cobraria** naquela situação e a regra aplicada ("Degrau até 3 h", "com 30% de desconto"). Tocar abre o detalhe completo, com a mesma simulação numa barra fixa.

- *Consulta:* barra do módulo → cartão do simulador → cabeçalho da lista com chips de situação e filtros → linhas com valor simulado (tabelas agendadas e encerradas esmaecidas, com o motivo) → aviso permanente de estimativa.
- *Detalhe:* nome, selo, **Editar** na barra do alto; placa primeiro; abas Semana / Tolerâncias / Informações; barra fixa "Mesma simulação · R$ 30,00".
- *Cadastro:* **placa fixa no topo** que muda enquanto o gestor digita; etapas em barra de 3 segmentos; última etapa fecha com **"Teste antes de salvar"** (simulador com a tabela em edição); barra fixa Voltar / Salvar.
- *Computador:* simulador fixo numa coluna à esquerda; à direita uma tabela comparativa (tabela, tipo, situação, quanto cobra) e o detalhe num painel lateral.
- **Pontos fortes:** responde direto à pergunta mais frequente ("quanto custa isto?") e permite comparar tabelas; uso do simulador deixa de ser escondido.
- **Riscos:** muda o modelo mental (hoje a lista é um catálogo, não uma comparação); precisa dos degraus de todas as tabelas para calcular cada linha (depende do ponto em aberto sobre a listagem); a estimativa por linha pode divergir do valor real, então o aviso fica sempre visível.

## Comparação

| | A · Cockpit | B · Cartões-placa | C · Mesa de simulação |
|---|---|---|---|
| Valor na primeira tela do detalhe | Sim, no alto | Sim, no cartão | Sim, após título curto |
| Resultado do simulador visível | Sempre (dock) | Dentro do cartão aberto | Sempre (topo e dock) |
| Trocar de tabela | 1 toque (esteira) | Rolar e abrir outro | Voltar à mesa e tocar |
| Comparar tabelas | Fraco | Médio (vê degraus) | Forte (mesmo cenário) |
| Escala com muitas tabelas | Média (via "Ver todas") | Média | Boa (lista longa) |
| Mudança em relação ao atual | Média | Média | Alta |
| Custo de implementar | Médio | Médio (cartão expansível, ancoragem) | Alto (cálculo por linha) |
| Cadastro | Dock + folha de resumo | Seções numa página | Placa fixa + teste final |

**Recomendação:** o **Modelo A** (também o sorteado). É o que mais resolve o diagnóstico (valor, Editar e resultado na primeira tela, cadastro com ação à vista) mudando menos o modelo mental e usando componentes já existentes (`Tabs`, `Pagination`, `StatusBadge`, `FaixasPreview`). O Modelo C é a aposta mais ousada e vale se a comparação entre tabelas for tarefa frequente; o B é o mais simples se o número de tabelas for pequeno.

## Componentes do design system

### Reaproveitados (todos os modelos)
`Button`, `Input`, `Select`, `StatusBadge`, `Tabs` (vira controle segmentado no celular, mantendo a semântica de abas), `Pagination`, `Skeleton`, `ErrorBanner`, `Toast`, `Stepper` (versão compacta), `Switch`, `Checkbox`, `OptionGroup` (cartões de tipo); da feature, `FaixasPreview`, `PrecoSemana`, `GradeHorarios`, `SimuladorCobranca` e os formatadores.

### Novos (a confirmar no Tech Spec, conforme o modelo escolhido)
- **Comuns:** folha inferior (`BottomSheet`) para filtros e para o simulador; barra fixa de ação/resumo que respeita `bottomNavReserved` (hoje cada tela reserva à mão).
- **A:** `EsteiraPlacas` (miniplaca + rolagem com encaixe), `DockSimulador`, `DockResumoCadastro`.
- **B:** `CartaoPreco` expansível (um aberto por vez, ancoragem por endereço), `SecaoCadastro` recolhível com resumo e estado ✓/!.
- **C:** `MesaSimulacao` (simulador de topo compartilhado entre lista e detalhe), `LinhaPrecoSimulada`, `PlacaFixaCadastro`.

## Tokens usados
Nenhum token de cor ou tipografia novo. Reaproveita `colors.primary`, `onPrimary`, `accent`, `background`, `surface`, `surfaceMuted`, `border`, `borderStrong`, `text`, `textMuted`, `success`, `warn`, `danger`; `space`, `radii`, `fontSizes`, `fontWeights`; `typography.display*`; `shadows`. Tokens de layout já existentes: `layout.bottomNavReserved`, `layout.touchTarget`, `layout.actionBarHeight`, `layout.fabClearance`, `layout.stickyTop`. **Possível token novo:** `layout.dockHeight` (altura da barra fixa de simulador/resumo nos modelos A e C). Cores do tipo de regra seguem o marcador atual (Padrão `primary`, Convênio `success`, Promocional `warn`, Evento `steel`), sempre acompanhadas do nome.

## Estados (todos os modelos)
- *Carregando:* `Skeleton` com a forma do bloco (miniplacas, cartões ou linhas), `aria-busy`.
- *Erro:* `ErrorBanner` com **Tentar novamente**; no cadastro, mensagens junto de cada campo.
- *Vazio:* "Nenhuma tabela de preço cadastrada." com **Novo preço**; busca sem resultado com **Limpar busca**.
- *Tabela inexistente / sem permissão:* mesmos avisos de hoje.
- *Salvo:* `Toast` ("Tabela de preço criada/atualizada") e retorno com a tabela selecionada (A), o cartão aberto (B) ou a linha em destaque (C).

## Responsividade
- **Celular (< 768 px):** composição de cada modelo como descrita; sem rolagem horizontal a partir de 360 px (a esteira do A rola por design, com a próxima placa parcialmente à vista como pista).
- **Tablet e computador (≥ 768 px):** A e C passam a duas áreas lado a lado (esteira/placa + simulador; simulador + comparação); B vira grade de 3 colunas. O menu lateral substitui o inferior, então as barras fixas viram barras de rodapé do painel.
- Orientação vertical mantida, como no restante do aplicativo.

## Acessibilidade
- Abas e controle segmentado com setas, Home e End; cartão expansível (B) com `aria-expanded`; folhas com foco preso e Esc.
- Resultado do simulador em região `aria-live="polite"`; estado de cada etapa do cadastro anunciado ("completa", "com pendência").
- Contraste do tema (3:1 em bordas de controle); alvos de 44 px; nada depende só de cor.

## Pontos em aberto para a escolha
- A listagem de tabelas traz os degraus? (impacta o resumo por item nos três modelos e é indispensável no C).
- Quantas tabelas um cliente costuma ter? (poucas favorecem B; dezenas favorecem A com "Ver todas" ou C).
- A comparação entre tabelas num mesmo cenário é uma tarefa real do gestor? (se sim, C).

## Decisão
**Modelo escolhido: A · Cockpit da tabela** (decisão do usuário em 2026-11-08). Os modelos B e C ficam registrados como alternativas descartadas.
