# Design Spec: Módulo de Faturas

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` (RF1 a RF20). Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`; nenhum valor visual solto.

## Direção

Superfície de **operação** (*Operate*) dentro do mundo visual já estabelecido (asfalto, giz e amarelo faixa). Usada por quem cuida do dinheiro, em computador na maior parte do tempo e, às vezes, no celular. O sistema visual não muda; a lista herda a composição de Empresas conveniadas e Financeiro (título com ação primária, filtros em `OptionGroup`, tabela que vira cartões no celular, estado vazio tracejado).

A única composição própria é o **detalhe da fatura**, pensado como um **extrato**: o valor a cobrar é o herói, logo abaixo vem o **ciclo de vida** da fatura (emitida, paga ou cancelada, com quem e quando) e, por fim, as saídas que a compõem, com a coluna que importa (a parte da conveniada) em destaque e as demais em segundo plano. A tela recusa o padrão "grade de KPIs": o usuário quer saber quanto cobrar, de quem, até quando e se já foi pago.

## 1. Estrutura e navegação

Duas rotas na área logada (`AppShell`):

- `/faturas`: lista, com o botão **Emitir fatura** no cabeçalho.
- `/faturas/[id]`: detalhe, com link "Voltar para faturas".

Emitir e registrar pagamento são **modais** (poucos campos, sem sair do contexto). Cancelar usa o `ConfirmDialog` existente.

**Menu (RF1):** novo item "Faturas" (`shortLabel` "Faturas") em `nav.ts`, logo depois de "Empresas conveniadas", com ícone novo (`bill`: folha com linhas e uma moeda no canto; distinto do ícone de Notas Fiscais) e área nova `faturas` nas permissões. Não entra na barra inferior do celular (ela segue com Pátio, Caixa, Entrada, Saída e Mais); fica no painel "Mais" como os demais.

## 2. Lista de faturas (`/faturas`)

```
┌ Faturas ─────────────────────────────[Emitir fatura]┐
│ Conveniada [Todas ▾]   (Todas) Abertas  Pagas  Canceladas
│                                                      │
│ Fatura  Conveniada        Emitida     Vencimento  Saídas   Valor      Situação
│ #12     Auto Peças Sul    08/11/2026  08/12/2026    14   R$ 1.250,00  ● Aberta
│ #11     Transp. Leste     01/11/2026  01/12/2026     3   R$   312,50  ● Paga
│ …                                          ‹ 1 2 3 ›    │
└──────────────────────────────────────────────────────┘
```

- Título `Text variant="heading"` "Faturas". "Emitir fatura" é `Button primary` no cabeçalho.
- **Filtros (RF11):** `Select`/`Combobox` de conveniada (opção "Todas", padrão) e `OptionGroup` de situação (Todas, Abertas, Pagas, Canceladas; "Todas" padrão). Os dois e a página ficam na URL (`?conveniada=53&situacao=aberta&pagina=2`), como em Empresas conveniadas e Financeiro, para link direto e botão voltar. Mudar um filtro volta à página 1.
- **Tabela (`Table`)**, ordem do back (mais recente primeiro). Colunas: Fatura (`#número`, `fontWeights.bold`), Conveniada, Emitida em, Vencimento, Saídas (quantidade, numérico), Valor (numérico, `fontWeights.bold`, algarismos tabulares) e Situação (`StatusBadge`). A linha inteira é clicável e leva ao detalhe (`TableRow clickable`), com o número da fatura como link de verdade, para teclado e leitor de tela.
- **Situação (RF14)**, sempre em texto no `StatusBadge`: **Aberta** em `warn`, **Paga** em `success`, **Cancelada** em `neutral`. O sistema não marca "vencida": o vencimento é só uma data (fora de escopo no PRD).
- **Paginação:** componente `Pagination`, 20 por página, mostrando "1 a 20 de N faturas".
- **Celular (< `breakpoints.md`):** a tabela vira cartões pelo próprio `Table` (`data-label`): no topo do cartão, "#12" e o `StatusBadge`; abaixo, conveniada, valor em destaque, e as demais informações em linhas rotuladas. O cartão inteiro é tocável (alvo de 44px ou mais).

| Estado | Comportamento visual |
|---|---|
| Carregando | `Skeleton` em 6 linhas com a mesma contagem de colunas, `role="status"` "Carregando faturas". |
| Lista | Tabela e paginação. |
| Atualizando (troca de filtro ou página) | Tabela mantém os dados anteriores com opacidade reduzida e `aria-busy`, como em Mensalistas. |
| Vazio (sem filtro) | `EmptyState` tracejado: "Nenhuma fatura emitida ainda." + `Button primary` "Emitir fatura". |
| Vazio (com filtro) | "Nenhuma fatura encontrada com esses filtros." + `Button secondary` "Limpar filtros". |
| Erro | `ErrorBanner role="alert"` + `Button secondary` "Tentar novamente". |
| Sem permissão (403) | Mesmo bloco de erro com "Você não tem permissão para acessar esta página.", sem tentar de novo (padrão do projeto). |

## 3. Emitir fatura (modal, RF4 a RF9)

Modal `size="sm"`, tela cheia no celular (`fullScreenOnMobile`).

```
┌ Emitir fatura ───────────────────────────┐
│ Conveniada*      [Auto Peças Sul ▾]      │
│ Vencimento*      [08/12/2026]            │
│ Observação       [__________________]    │
│                                 0 / 500  │
│ ⓘ A fatura reúne todas as saídas em      │
│   aberto desta conveniada. Não dá para   │
│   escolher só algumas.                   │
│                [Cancelar] [Emitir fatura]│
└──────────────────────────────────────────┘
```

- **Conveniada:** `Select`/`Combobox` com as conveniadas do estacionamento, inclusive as de convênio encerrado (a opção mostra "(encerrado)" em `textMuted`, mas continua escolhível, RF4). Se a lista tiver uma só, vem selecionada.
- **Vencimento:** `Input type="date"` com `min` em hoje e valor inicial 30 dias à frente (ajustável). Erros no envio, sob o campo: "Informe o vencimento." / "O vencimento não pode ser antes de hoje."
- **Observação:** `Input` multilinha com contador "0 / 500", que passa para `danger` com texto "Máximo de 500 caracteres." quando excede; o botão de emitir fica desabilitado enquanto excede.
- **Aviso fixo** (`InfoCard`, ícone de informação): explica a regra de "todas as saídas em aberto" antes de confirmar (RF5), sem prometer quantidade.
- **Enviando:** botão "Emitir fatura" com estado de carregamento, campos desabilitados.
- **Sem saídas a faturar (RF9):** o modal continua aberto e mostra um `ErrorBanner role="alert"` no topo com a mensagem do sistema (algo como "Não há saídas em aberto para esta conveniada."), sem fechar nem perder o que foi digitado.
- **Outros erros:** `ErrorBanner` no topo do modal com a mensagem; 403 traz o texto de permissão.
- **Sucesso (RF8):** fecha o modal, leva ao detalhe da fatura criada e mostra `Toast` "Fatura emitida: 14 saídas, R$ 1.250,00."

## 4. Detalhe da fatura (`/faturas/[id]`)

### 4.1 Composição (desktop, ≥ `breakpoints.lg`)

```
← Voltar para faturas
┌ Fatura #12 ─────────────────────── ● Aberta ┐ ┌ Ciclo ──────────────────┐
│ Auto Peças Sul                              │ │ ● Emitida                │
│                                             │ │   08/11/2026 · Renato R. │
│ R$ 1.250,00                  ← display      │ │ ○ Aguardando pagamento   │
│ 14 saídas · vence em 08/12/2026             │ │   vence 08/12/2026       │
│ Obs.: fechamento de outubro                 │ │                          │
│                                             │ │                          │
│ [Registrar pagamento]  [Cancelar fatura]    │ └──────────────────────────┘
└─────────────────────────────────────────────┘
┌ Saídas desta fatura ─────────────────────────────────────────────────────┐
│ Placa     Entrada → Saída        Perm.  Regra          Total  Cliente  CONVENIADA │
│ ABC1D23   07/11 08:10 → 07/11 17:40  9h30  Tabela X · 50%  R$ 30   R$ 15   R$ 15,00 │
│   Fusion · Categoria 3                                                       │
│ …                                                                            │
│ ───────────────────────────────────────────────────────────────────────────  │
│ 14 saídas                                           Total da fatura R$ 1.250,00 │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Blocos

**Cabeçalho do extrato (herói).**
- "Fatura #12" em `Text variant="heading"`, `StatusBadge` ao lado (mesmos tons da lista) e a conveniada em `text`.
- **Valor total** em `typography.display` com `colors.accent` (nunca `primary` como texto, pelo contraste no tema claro), algarismos tabulares. Cancelada: valor em `textMuted` e riscado, para não parecer uma cobrança viva; o texto "Cancelada" já está no selo.
- Linha de apoio em `textMuted`: "14 saídas · vence em 08/12/2026". Paga: "paga em 12/11/2026". Observação (quando houver) em uma linha própria, com o rótulo "Obs.:".
- **Ações (RF15, RF18):** `Button primary` "Registrar pagamento" e `Button secondary` "Cancelar fatura", **só quando a fatura está aberta**; em fatura paga ou cancelada os botões não existem (nada desabilitado e sem explicação). "Cancelar fatura" usa a variante de perigo só no `ConfirmDialog`, não no botão de abertura.

**Ciclo de vida (RF12).** Cartão ao lado do herói (embaixo, no celular) com uma linha do tempo vertical curta:
- Passo **Emitida** (sempre cumprido): data e hora e nome de quem emitiu.
- Segundo passo, conforme a situação:
  - **Aberta:** "Aguardando pagamento", com o vencimento. Marcador vazio.
  - **Paga:** "Paga" com data, nome de quem registrou, forma de pagamento e valor pago. Marcador cheio em `success`.
  - **Cancelada:** "Cancelada" com data e nome de quem cancelou. Marcador cheio em `textMuted`.
- Valor pago diferente do total: a linha do pagamento mostra os dois ("Pago R$ 1.200,00 de R$ 1.250,00"), sem alterar o selo.
- O marcador nunca é o único sinal: cada passo é texto.

**Saídas da fatura (RF13).** `Table` com as saídas, da mais antiga para a mais recente:
- **Placa** em `PlateDisplay` pequeno, com modelo e categoria em linha secundária `textMuted`.
- **Entrada e saída** (data e hora, "07/11 08:10 → 07/11 17:40") e **permanência** ("9h30").
- **Regra:** nome da tabela de convênio e a regra da conveniada ("50%" ou "R$ 12,00 fixo"), em linha secundária quando faltar espaço.
- **Total**, **Cliente** e **Conveniada**: três colunas numéricas, alinhadas à direita. **Conveniada** em `fontWeights.bold`, `text`, com o cabeçalho em destaque (é o que se cobra e o que soma na fatura); **Total** e **Cliente** em `textMuted`.
- **Rodapé da tabela:** "14 saídas" à esquerda e "Total da fatura R$ 1.250,00" à direita, em negrito, igual ao valor do herói (o usuário confere a soma).
- **Celular:** cada saída vira cartão: placa e valor da conveniada na primeira linha; abaixo, modelo e categoria, entrada e saída, permanência, regra, total e cliente em linhas rotuladas. O total fica abaixo da lista, em cartão fixo ao fim do conteúdo (sem barra fixa, para não brigar com a barra de navegação).
- **Fatura cancelada:** a resposta do sistema traz a lista de saídas vazia. A tabela é trocada por um aviso em `textMuted`: "As saídas desta fatura voltaram a ficar em aberto e entram na próxima fatura." (RF20). Nenhuma tabela vazia, nenhum cabeçalho solto.

| Estado | Comportamento visual |
|---|---|
| Carregando | `Skeleton` do herói, do ciclo e de 5 linhas da tabela; `role="status"` "Carregando fatura". |
| Fatura | Composição acima. |
| Erro | `ErrorBanner role="alert"` + "Tentar novamente" e link "Voltar para faturas". |
| Não encontrada (404) | "Fatura não encontrada." + link "Voltar para faturas", sem tentar de novo. |
| Sem permissão (403) | Texto de permissão, sem tentar de novo. |
| Ação em andamento | Botões da fatura desabilitados com carregamento no que foi acionado. |

## 5. Registrar pagamento (modal, RF15 a RF17)

Modal `size="sm"`, tela cheia no celular.

```
┌ Registrar pagamento · Fatura #12 ────────┐
│ Valor da fatura                R$ 1.250,00│
│ Forma de pagamento*   [Pix ▾]            │
│ Valor pago            [R$ ________]      │
│   Em branco: o valor total da fatura.    │
│ Data do pagamento     [08/11/2026]       │
│   Em branco: agora.                      │
│ ⓘ Este pagamento não entra no caixa.     │
│   Registre aqui só o recebimento da      │
│   fatura.                                │
│          [Cancelar] [Registrar pagamento]│
└──────────────────────────────────────────┘
```

- **Resumo no topo:** valor da fatura em `typography.display` menor, para o usuário conferir o que está baixando.
- **Forma de pagamento:** `Select` com as formas já usadas no Caixa; obrigatória. Erro: "Escolha a forma de pagamento."
- **Valor pago:** `Input` monetário com máscara, opcional, com ajuda "Em branco: o valor total da fatura." Zero ou negativo: "O valor pago precisa ser maior que zero." Valor diferente do total: aviso não bloqueante abaixo do campo, em `warn` com ícone e texto: "Diferente do valor da fatura (R$ 1.250,00)." (aguarda a decisão do ponto em aberto do PRD).
- **Data do pagamento:** `Input type="date"` com `max` em hoje, opcional, com ajuda "Em branco: agora." Data futura: "A data não pode ser depois de hoje."
- **Aviso fixo (RF17):** `InfoCard` visível o tempo todo, antes do botão de confirmar: "Este pagamento não entra no caixa."
- **Sucesso:** fecha o modal, o detalhe atualiza (selo Paga, ciclo preenchido, botões somem) e `Toast` "Pagamento registrado."
- **Erro:** `ErrorBanner` no topo do modal (por exemplo, fatura que deixou de estar aberta); o modal fica aberto.

## 6. Cancelar fatura (RF18 a RF20)

`ConfirmDialog` existente, aberto por "Cancelar fatura":

- Título: "Cancelar fatura #12?"
- Texto: "As 14 saídas voltam a ficar em aberto e entram na próxima fatura de Auto Peças Sul. A fatura continua na lista como cancelada. Esta ação não pode ser desfeita."
- Botões: "Manter fatura" (secundário, foco inicial) e "Cancelar fatura" (variante de perigo).
- **Sucesso:** fecha, o detalhe atualiza (selo Cancelada, ciclo com quem cancelou, aviso no lugar da tabela) e `Toast` "Fatura cancelada. As saídas voltaram a ficar em aberto."
- **Erro:** `ErrorBanner` dentro do diálogo, que permanece aberto.

## 7. Componentes

### Reaproveitados (`src/components/ui`)
`Table`, `StatusBadge`, `OptionGroup`, `Select`/`Combobox`, `Pagination`, `Modal`, `ConfirmDialog`, `Button`, `Input`, `Text`, `Skeleton`, `ErrorBanner`, `InfoCard`, `Toast`, `BackButton`, `PlateDisplay`. Formatadores de data, valor e permanência já existentes (por exemplo, `src/components/financeiro/format.ts`), sem duplicar.

### Novos
- Em `src/components/faturas`: `FaturasPage` (lista com filtros), `FaturaDetalhe`, `ItensFatura` (tabela das saídas), `CicloFatura` (linha do tempo), `EmitirFaturaModal`, `PagarFaturaModal` e o ícone `bill` do menu.
- Em `src/components/ui`: nada novo por enquanto. `CicloFatura` fica na feature por ser específico; se `StageTrack` ou `Stepper` resolverem a linha do tempo vertical sem forçar, o Tech Spec decide reaproveitar um deles em vez de criar o desenho.

## 8. Tokens

Existentes: `colors.accent`, `text`, `textMuted`, `success`, `warn`, `danger`, `border`, `surface`, `surfaceMuted`, `space`, `radii`, `fontSizes`, `fontWeights`, `typography.display`, `breakpoints.md` e `lg`, `layout.touchTarget`. Tons de `StatusBadge`: `warn`, `success`, `neutral`. **Nenhum token novo.**

## 9. Responsividade e acessibilidade

- **Desktop (≥ `lg`):** detalhe em duas colunas (herói e ciclo lado a lado), tabela completa.
- **Tablet (`md` a `lg`):** ciclo abaixo do herói, tabela com rolagem horizontal contida só se necessário; a coluna Conveniada nunca sai da tela.
- **Celular (< `md`):** lista e saídas viram cartões; botões de ação em largura total, empilhados; modais em tela cheia.
- Alvos de toque de pelo menos 44px, foco visível em todos os controles, ordem de tabulação igual à visual.
- Situação sempre em texto; o valor negativo ou de alerta nunca é só cor.
- Modais devolvem o foco ao botão que os abriu; erros de campo ligados ao campo (`aria-describedby`) e erros gerais em `role="alert"`.
- Temas claro e escuro pelos tokens; sem animação nova além da dos modais já existentes (que respeita `prefers-reduced-motion`).

## 10. Pontos para o Tech Spec

- **Lista de conveniadas** para o filtro e para o modal de emissão: reaproveitar a consulta de Empresas conveniadas (sem filtro de situação), pois a lista inclui encerradas.
- **Número da fatura** exibido como "#" mais o identificador numérico da fatura; o identificador único (GUID) não aparece na tela nesta versão.
- **Valor pago diferente do total:** o aviso do modal é só informativo até o PRD decidir a regra.
- **Pagamento:** o caminho da chamada de pagamento não consta no pedido; confirmar com o back antes de implementar.
