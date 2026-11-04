# Design Spec: Pátio da Conveniada

Insumo para o Tech Spec, a partir de `prd.md` (RF1 a RF10). Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto.

**Direção:** tela de consulta (*Monitor*) usada no balcão da conveniada, quase sempre em celular. A pergunta que ela responde é "quais dos meus clientes ainda estão lá, e há quanto tempo?". Por isso a **permanência** é o dado de maior peso em cada cartão, e a **placa** vem logo ao lado, como na visão do lojista (`PatioCard`). O que muda é o que a conveniada precisa saber: quem carimbou, qual tabela de convênio vale e em qual estacionamento o veículo está. A conveniada não tem ticket nem ações de saída, então o cartão **não é um link**: é só informação, lida de relance.

## 1. Telas e estados

Uma rota na área logada: `/patio-conveniada` (menu "Pátio", ao lado de "Carimbar ticket"). Para a conveniada, "Pátio" é o nome do item; o item do operador continua só para os perfis do estacionamento.

```
┌ Pátio ───────────────────── 14:32 ─┐
│ Veículos carimbados em aberto       │
│                                     │
│ ┌ Resumo ─────────────────────────┐ │
│ │ 2 veículos no pátio             │ │
│ │ teste 2 · 2                     │ │
│ └─────────────────────────────────┘ │
│ [🔍 Placa            ] [Atualizar]  │
│ 2 veículos · Atualizado às 14:32    │
│                                     │
│ ┌ OLG7Z94 ────────── 5d 22h 51min ┐ │
│ │ HB20S · Prata          permanência│ │
│ │ teste 2                         │ │
│ │ ⟨Convênio⟩ Entrada 29/10 18:44  │ │
│ │ Carimbo 29/10 18:44 · teste login│ │
│ │ Tabela: convenio mercado 1      │ │
│ └─────────────────────────────────┘ │
│ ┌ TEP6I32 ─── …                   ┐ │
└─────────────────────────────────────┘
```

| Estado | Comportamento visual |
|--------|----------------------|
| Carregando | Esqueleto no formato final (`Skeleton`): resumo, busca e seis cartões, dentro de `role="status"` com `aria-label="Carregando o pátio"`. |
| Lista | Cartões do carimbo mais recente para o mais antigo. Linha de contagem e hora da última atualização acima da lista. |
| Vazia | Bloco central com ícone, **"Nenhum veículo carimbado em aberto"** e "Os tickets que você carimbar aparecem aqui até o veículo sair." Botão primary "Carimbar ticket" leva a `/carimbo`. |
| Sem resultado | **"Nenhum carro encontrado"**, "Nada encontrado para “ABC1D23”. Confira a placa." e botão secondary "Limpar busca". Anunciado em `role="status"`. |
| Placa inválida | O campo mostra o erro "Placa inválida" (`Input error`) e **a lista continua como estava**; nada é enviado ao servidor enquanto a placa estiver incompleta ou inválida. |
| Atualizando | Botão "Atualizar" vira "Atualizando…" e fica desabilitado; a lista atual continua visível (sem piscar). |
| Erro ao carregar | `ListError` (o mesmo da visão do lojista) com "Tentar novamente"; se já havia lista, ela fica na tela e o erro é só um aviso. |
| Sem permissão (403) | `ErroSemPermissao` com "Você não tem permissão para ver o pátio da conveniada.", sem tentar de novo. |

### 1.1 Cartão do veículo

- **Linha 1:** placa em destaque (a mesma tipografia do `PatioCard`) à esquerda e permanência à direita em peso forte, com a legenda "permanência" abaixo, igual ao cartão do lojista.
- **Linha 2:** "modelo · cor" (cor por extenso, via `corDoVeiculo`) e o nome do estacionamento. Com um único estacionamento o nome ainda aparece, porque a conveniada precisa saber onde o carro está.
- **Rodapé:** `StatusBadge tone="conveniado"` com o texto "Convênio", a entrada ("Entrada 29/10 18:44") e, abaixo, "Carimbo 29/10 18:44 · por teste login" e "Tabela convenio mercado 1" em `textMuted`.
- **Categoria:** nome da categoria (Carro, Moto…) como `Text` pequeno junto da cor, nunca o número.
- **Permanência longa** (3 dias ou mais, a mesma regra `PERMANENCIA_LONGA_MINUTOS` da visão do lojista): a permanência ganha o tom `warn` **e** o texto "mais de 3 dias" por extenso para o leitor de tela. A cor não é a única pista.
- Cartão não é interativo: sem hover de link, sem foco. A lista é uma `ul` de `li`, e o cartão fala em uma frase só: "OLG7Z94, HB20S prata, em teste 2, 5d 22h 51min no pátio".

### 1.2 Resumo e busca

- **Resumo (RF6):** um cartão no topo com o total ("2 veículos no pátio") e, quando há mais de um estacionamento, a contagem por estacionamento em linhas. Com um só estacionamento, só o total. Sem gráficos nesta entrega.
- **Busca por placa (RF5):** um campo único "Placa" (`Input type="search"`, maiúsculas automáticas, sem corretor), com o mesmo teclado de placa já usado no sistema no celular. A busca vai ao servidor depois de uma pausa e só quando a placa está completa; placa parcial filtra a lista **no navegador** pelos caracteres digitados, para a resposta ser imediata.
- **Estacionamento (RF9):** só aparece quando a conveniada tem mais de um estacionamento na lista. São chips `aria-pressed` ("Todos", "teste 2", …) com a contagem, como os chips de categoria da visão do lojista. Tocar de novo no ativo volta a "Todos". Com um único estacionamento, o bloco não existe.
- **Atualizar (RF8):** botão secondary pequeno "Atualizar" e atualização automática a cada 30 s com a aba visível (a permanência cresce). "Atualizado às HH:MM" fica ao lado da contagem. A atualização automática não rouba o foco nem rola a lista.

### 1.3 Volta do veículo que saiu

Quando uma atualização traz uma lista sem um veículo que estava na tela, o cartão some sem aviso e a contagem se atualiza (`role="status"`). Se o foco estava nele, vai para o cartão que ocupa o lugar, ou para a busca se a lista esvaziou.

## 2. Componentes

**Reaproveitados do design system:** `Text` (título e textos de apoio), `Input` (placa, com `error`), `Button` (Atualizar, Limpar busca, Carimbar ticket, Tentar novamente), `StatusBadge` (selo "Convênio"), `Skeleton` (carregando), `ErrorBanner`/`ListError` e `ErroSemPermissao` (erros), `Toast` (se houver aviso).

**Da visão do lojista, em `src/components/patio`:** `corDoVeiculo`, `rotuloCategoria` e `PERMANENCIA_LONGA_MINUTOS` (regras puras de exibição) e o comportamento de "Mostrar mais". Os componentes de tela (`PatioCard`, `PatioFiltros`, `PatioResumo`) **não** são reaproveitados: são acoplados a ticket, tipo avulso/mensal, ocupação, gráficos e operador.

**Novos:**
- `PatioConveniadaPage` (tela): topo com título, subtítulo e relógio; resumo; busca e chips de estacionamento; lista e estados.
- `VeiculoConveniadaCard`: o cartão da seção 1.1. Fica ao lado da tela, em `src/components/patio-conveniada/`, porque só faz sentido nela.
- Nenhum componente novo para o design system: o selo, a busca e os chips já existem.

## 3. Tokens

Somente os do tema (`src/styles/theme.ts`):
- **Cores:** `surface`/`background` para fundo e cartões, `border` para divisórias, `text`/`textMuted` para texto e rótulos, `warn` para a permanência longa, `danger` para o erro de placa, e a cor `cliente.conveniado` do selo "Convênio" (a mesma do carimbo).
- **Espaçamento:** escala `space`; cartões separados por `space` médio e rodapé interno por `space` pequeno.
- **Tipografia:** placa e permanência com o peso forte do cartão do lojista; rótulos e legendas pequenos; título com `Text heading`.
- **Raios e sombras:** os mesmos dos cartões da visão do lojista.
- Se faltar token para o tom da permanência longa, adicioná-lo ao tema; nunca um valor solto.

## 4. Responsividade

- **Mobile (320 px em diante):** uma coluna; resumo, busca e atualizar empilhados; chips de estacionamento rolam na horizontal dentro do próprio bloco (sem rolagem da página); cartão usa a largura inteira e quebra linha longa de estacionamento e tabela. Nenhuma rolagem horizontal.
- **Tablet (`md`):** busca e "Atualizar" na mesma linha; resumo ao lado dos chips.
- **Desktop (`lg`):** lista em **duas colunas** de cartões; resumo à esquerda e busca à direita no topo.
- O teclado de placa do sistema aparece só em dispositivo de toque, como nas outras telas.
- Respeita `prefers-reduced-motion`: nada anima além da transição curta de cor dos chips.

## 5. Acessibilidade (WCAG 2.2 AA)

- Título `h1` "Pátio"; resumo e lista com cabeçalhos legíveis; lista em `ul`/`li`.
- A contagem e a mudança dela ficam em `role="status"` (educado, sem repetir a cada atualização automática quando nada mudou).
- A placa tem rótulo visível "Placa" (o placeholder não substitui o rótulo); o erro é anunciado e ligado ao campo.
- Chips `aria-pressed` e operáveis por teclado; "Atualizar" desabilitado só enquanto atualiza.
- Contraste de texto e dos selos conferido nos dois temas; a permanência longa tem texto além da cor.
- Alvo de toque de pelo menos 44 px nos botões e chips.

## 6. A confirmar na implementação

- Se o back aceita placa parcial no filtro (hoje diz que placa inválida é 400); o design assume que só a placa completa vai ao servidor.
- Se a lista pode ser grande o bastante para pedir "Mostrar mais" (paginação); o design assume o mesmo corte de 100 itens da visão do lojista.
- O nome da rota e do item de menu (`/patio-conveniada`, "Pátio"), com o item de menu logo depois de "Carimbar ticket".
