# Design Spec: Faturas otimizado para celular

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` (RF1 a RF21). Segue o design system (`src/styles/theme.ts` + `src/components/ui`), o contexto de `PRODUCT.md` e o mundo visual já estabelecido em `docs/specs/faturas/design.md`. Nenhum valor visual solto.

## Direção

Superfície de **operação** (*Operate*), com o mesmo mundo visual de hoje (asfalto, giz e amarelo faixa). Aqui a mudança é de **estrutura e de gesto**, não de identidade: a versão de celular deixa de ser a de computador encolhida e passa a ser pensada para uma mão, com o polegar, em pé.

Quatro decisões guiam tudo:

1. **A fatura é o cartão; o cartão é o toque.** Na lista e nas saídas, cada item é um cartão compacto, hierarquizado (o que importa em destaque, o resto em segundo plano), em vez de uma tabela transformada em linhas "rótulo : valor". Isso corta a altura de cada item pela metade e deixa comparar de relance.
2. **As ações moram na zona do polegar.** "Emitir fatura" na lista e "Registrar pagamento / Cancelar fatura" no detalhe ficam em elementos fixos na base da tela, acima da barra de navegação, e não no topo.
3. **Divulgação progressiva.** O que é consulta eventual (ciclo da fatura, data do pagamento) fica recolhido, com um resumo de uma linha. O que decide a ação (valor, vencimento, situação, aviso de "não entra no caixa") fica sempre à vista.
4. **O teclado é parte do desenho.** Cada formulário foi reduzido ao mínimo de campos visíveis e usa controles que dispensam teclado sempre que possível (opções tocáveis, seletor nativo, atalhos de data).

A composição de computador (≥ `breakpoints.md`) **não muda**: tabela na lista, ações no herói, saídas em tabela. Todo o novo comportamento vale abaixo de `breakpoints.md`. Tablet em retrato (768 a 1023 px) segue como hoje.

> Observação sobre o estado atual: o componente `Table` vira cartões "rótulo : valor" só abaixo de `breakpoints.sm` (480 px). Entre 480 e 767 px a lista é uma tabela de sete colunas com rolagem horizontal. A nova composição em cartões passa a valer até `breakpoints.md`, corrigindo também essa faixa.

## 1. Estrutura e navegação

Sem rotas novas: `/faturas` e `/faturas/[id]`. "Faturas" continua no painel "Mais" da barra inferior (fora do escopo mudar o menu).

Camadas fixas no celular, de baixo para cima: barra de navegação inferior (`layout.bottomNavReserved`) → barra de ações da tela (detalhe) ou botão flutuante (lista) → conteúdo. O conteúdo reserva espaço para elas (ver §8).

## 2. Lista de faturas (`/faturas`, < `md`)

```
┌ 360 px ────────────────────────────┐
│ Faturas                            │  h1
│ ┌Todas┬Abertas┬Pagas┬Canceladas┐   │  OptionGroup, 4 colunas, 44 px
│ [ Todas as conveniadas        ▾ ]  │  Select nativo, 44 px
│ ┌────────────────────────────────┐ │
│ │ #12 Auto Peças Sul   ● Aberta  │ │
│ │ R$ 1.250,00                    │ │
│ │ ⚠ Vence em 2 dias · 10/11      │ │  destaque (só aberta)
│ │ 14 saídas · emitida 08/11      │ │
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ #11 Transp. Leste    ● Paga    │ │
│ │ R$ 312,50                      │ │
│ │ Vencimento 01/12               │ │
│ │ 3 saídas · emitida 01/11       │ │
│ └────────────────────────────────┘ │
│            ‹ 1 de 3 ›              │
│                       (＋ Emitir)  │  botão flutuante, acima da nav
└────────────────────────────────────┘
```

### 2.1 Cabeçalho e filtros (RF1, RF2)
- Título "Faturas" (`Text variant="heading"`). **O botão "Emitir fatura" sai do cabeçalho no celular** e vira botão flutuante (§2.4); a partir de `md` volta ao cabeçalho, como hoje.
- **Situação** (filtro mais usado): `OptionGroup` com os quatro valores (Todas, Abertas, Pagas, Canceladas) em **uma única linha** de 4 colunas, sem rolagem horizontal. É também o indicador do filtro ativo.
- **Conveniada:** `Select` nativo numa linha só, em largura total. A opção inicial lê "Todas as conveniadas", de modo que o texto do próprio controle já diz o que ele filtra; o rótulo "Conveniada" segue disponível a leitores de tela (e visível a partir de `md`, como hoje). O seletor nativo abre a folha do sistema, que é o padrão esperado no celular. Conveniadas encerradas seguem com "(encerrado)".
- **Filtro ativo e limpar (RF2):** quando algum filtro está ativo, aparece abaixo dos controles uma linha com o texto "Filtrando: Abertas · Auto Peças Sul" e um botão de texto "Limpar" (alvo de 44 px). Com nada ativo, a linha não existe.
- Filtros e página continuam na URL (como hoje); trocar um filtro volta à página 1.
- Altura total do bloco de filtros: ~100 px (hoje, mais de 160 px). Com o cabeçalho do app, a **primeira fatura começa dentro da primeira tela** de um celular de 640 px de altura e a segunda aparece parcialmente (RF1).

### 2.2 Cartão de fatura (RF3, RF4)
O cartão inteiro é **um único link** para o detalhe (padrão de link esticado: o número da fatura é a âncora de verdade e cobre o cartão, para teclado e leitor de tela), com alvo de pelo menos `layout.touchTarget` e estado pressionado em `surfaceMuted`.

Hierarquia, de cima para baixo:
1. **Linha de identificação:** "#12" em `fontWeights.bold` e a conveniada (truncada em uma linha com reticências, nome completo disponível ao leitor de tela) à esquerda; `StatusBadge` à direita (Aberta `warn`, Paga `success`, Cancelada `neutral`, sempre com texto).
2. **Valor:** `fontSizes.lg`, `fontWeights.bold`, algarismos tabulares, em `colors.accent`. Cancelada: `textMuted` e riscado, como no detalhe.
3. **Vencimento:** em `fontSizes.sm`. Para fatura **aberta**, ver §2.3. Para paga e cancelada, texto neutro em `textMuted`: "Vencimento 01/12" (sem destaque; o vencimento deixou de importar).
4. **Apoio:** "14 saídas · emitida 08/11" em `fontSizes.xs`, `textMuted`.

Cartão: `surface`, borda `border`, `radii.lg`, espaçamento interno `space[3]`, 8 px entre cartões. Sem sombra (a borda basta). A conveniada e o número nunca competem com o valor: o olho percorre "quem → quanto → quando".

### 2.3 Destaque de vencimento (RF4)
Só para fatura **aberta**, calculado no cliente a partir da data de vencimento comparada com a data de hoje (sem criar nova situação nem regra de negócio):

| Condição | Texto | Visual |
|---|---|---|
| Vencimento antes de hoje | "Vencida há 3 dias" (ou "Vencida ontem") | Ícone de alerta + texto em `colors.danger`; cartão com fundo `dangerSoft` |
| Vence hoje | "Vence hoje" | Ícone de alerta + texto em `colors.danger`; fundo `dangerSoft` |
| Vence em 1 a 3 dias | "Vence em 2 dias · 10/11" | Ícone de relógio + texto em `text` com `fontWeights.bold`; sem fundo |
| Demais | "Vence em 10/12" | Texto `textMuted` |

O destaque nunca é só cor: o texto e o ícone dizem a mesma coisa. O limite de 3 dias é uma constante assumida (ponto em aberto do PRD). O `StatusBadge` continua dizendo "Aberta": **não existe a situação "Vencida"**. A comparação usa a data local do aparelho como texto `AAAA-MM-DD` (o vencimento é só data, sem hora).

Os mesmos textos e a mesma regra valem no detalhe (§3.1) e, em computador, numa linha de apoio discreta sob a data de vencimento na tabela (decisão do Tech Spec se valer no computador; ver pontos em aberto do PRD).

### 2.4 Botão flutuante "Emitir fatura" (RF5)
Mesmo padrão já usado em Mensalistas (`NovoFlutuante`): `Button` primário em pílula (`radii.full`), com `+` e o texto "Emitir fatura", `shadows.md`, fixo no canto inferior direito **acima da barra de navegação** (`bottomNavReserved` + área segura), `z-index` abaixo dos modais e do Toast. Altura mínima de 48 px. Oculto a partir de `md`. A página reserva um espaço no fim (§8) para o botão não cobrir o último cartão nem a paginação.

O botão permanece nos estados de erro e de vazio com filtro (emitir não depende da lista). No estado **vazio sem filtro** o `EmptyState` já traz o botão "Emitir fatura"; nesse caso o flutuante não aparece, para não duplicar.

### 2.5 Paginação e estados (RF6)
- `Pagination` existente, 20 por página. No celular mostra só anterior, "1 de 3" e próxima, com alvos de 44 px; o texto "1 a 20 de 57 faturas" fica numa linha própria em `textMuted`. Se o componente atual não couber em 320 px sem quebrar, o Tech Spec ajusta o próprio componente (melhoria compartilhada), não a feature.
- Ao trocar de página, a lista volta ao topo.

| Estado | Comportamento visual |
|---|---|
| Carregando | 4 cartões `Skeleton` com a altura do cartão real, `role="status"` "Carregando faturas". Os filtros já aparecem. |
| Lista | Cartões e paginação. |
| Atualizando (troca de filtro ou página) | Cartões anteriores com opacidade reduzida e `aria-busy`, como hoje. |
| Vazio (sem filtro) | `EmptyState` tracejado, "Nenhuma fatura emitida ainda." + `Button` "Emitir fatura". |
| Vazio (com filtro) | "Nenhuma fatura encontrada com esses filtros." + `Button secondary` "Limpar filtros". |
| Erro | `ErrorBanner role="alert"` + `Button secondary` "Tentar novamente". |
| Sem permissão (403) | `ErroSemPermissao`, sem tentar de novo. |

## 3. Detalhe da fatura (`/faturas/[id]`, < `md`)

```
┌ 360 px ────────────────────────────┐
│ ← Voltar para faturas              │
│ ┌────────────────────────────────┐ │
│ │ Fatura #12          ● Aberta   │ │
│ │ Auto Peças Sul                 │ │
│ │ R$ 1.250,00                    │ │  display
│ │ ⚠ Vence hoje · 08/12/2026      │ │
│ │ 14 saídas                      │ │
│ │ Obs.: fechamento de outubro    │ │
│ └────────────────────────────────┘ │
│ ▸ Ciclo · Emitida 08/11 · Renato   │  recolhido
│                                    │
│ Saídas desta fatura                │
│ 14 saídas · R$ 1.250,00            │
│ ┌────────────────────────────────┐ │
│ │ [ABC1D23]            R$ 15,00  │ │
│ │ Fusion · Categoria 3  conveniada│ │
│ │ 07/11 08:10 → 07/11 17:40 · 9h30│ │
│ │ Tabela X · 50%                 │ │
│ │ Total R$ 30,00 · Cliente R$ 15,00│ │
│ └────────────────────────────────┘ │
│ …                                  │
│ Total da fatura        R$ 1.250,00 │
│ ┌────────────────────────────────┐ │
│ │[Cancelar fatura][Reg. pagamento]│ │  barra fixa, acima da nav
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### 3.1 Herói (RF7)
Um cartão só (o mesmo `Cartao` de hoje), na ordem:
1. "Fatura #12" (`Text variant="heading"`) com o `StatusBadge` ao lado.
2. Conveniada em `text`.
3. **Valor total** em `typography.display`, `fontSizes.xxl`, `colors.accent` (cancelada: `textMuted` e riscado). Para valores longos o texto quebra antes de estourar a largura (`overflow-wrap: anywhere`).
4. **Vencimento** na linha de apoio, com o mesmo destaque e a mesma regra do §2.3 (só aberta). Paga: "Paga em 12/11/2026". Cancelada: sem linha de vencimento.
5. "14 saídas" em `textMuted` e a observação (quando houver) em linha própria, "Obs.: …", com no máximo 3 linhas e um "Ver mais" para a observação longa (até 500 caracteres) que a expande no lugar.

Os botões **saem do herói** no celular (vão para a barra fixa, §3.2). A partir de `md` ficam no herói, como hoje.

### 3.2 Barra de ações fixa (RF8)
Só para fatura **aberta** (paga e cancelada não têm barra: nada desabilitado). Barra fixa na base, **acima da barra de navegação** (`bottom: bottomNavReserved + área segura`), com `surface`, borda superior `border` e a altura de `layout.actionBarHeight`:

- Esquerda, `Button secondary`: "Cancelar fatura" (flex 1).
- Direita, `Button` primário: "Registrar pagamento" (flex 2, mais largo: é a ação do caminho feliz).
- Cada botão com pelo menos `layout.touchTarget` de altura e 8 px entre eles. "Cancelar fatura" não é vermelho: a variante de perigo só existe no diálogo de confirmação, e a confirmação protege contra toque acidental.

Mesma disposição do `ActionBar` do fluxo de adesão (secundária à esquerda, principal à direita), mas ancorada acima da barra de navegação, como o rodapé de Conferência (barra `sticky` no fim do conteúdo, acima de `bottomNavReserved`). Não é preciso alterar o `ActionBar`.

Durante uma ação em andamento: botões desabilitados, com texto de carregamento no acionado.

### 3.3 Ciclo da fatura recolhido (RF9)
No celular o cartão "Ciclo da fatura" vira um item **recolhível** (`Accordion`, fechado por padrão) logo abaixo do herói. O cabeçalho fechado já responde à pergunta mais comum em uma linha de texto:

| Situação | Resumo do cabeçalho fechado |
|---|---|
| Aberta | "Ciclo · Emitida em 08/11 por Renato R." |
| Paga | "Ciclo · Paga em 12/11 · Pix · R$ 1.250,00" |
| Cancelada | "Ciclo · Cancelada em 15/11 por Renato R." |

Aberto, mostra a linha do tempo vertical de hoje (`CicloFatura`), sem mudança de conteúdo (incluindo "Pago R$ 1.200,00 de R$ 1.250,00" quando o valor pago difere do total). Estado aberto/fechado é local e não vai à URL. A partir de `md` o ciclo continua aberto e como cartão, como hoje.

### 3.4 Saídas em cartões compactos (RF10)
Cada saída vira um cartão de **quatro linhas** (hoje são sete linhas "rótulo : valor", ~280 px por saída; a meta é ~120 px):

1. **Placa** (`PlateDisplay` pequeno) à esquerda; à direita, o **valor da conveniada** em `fontWeights.bold`, `text` (é o que se cobra e o que soma; ver rótulo abaixo).
2. Modelo e categoria em `textMuted`; à direita, o rótulo "da conveniada" em `fontSizes.xs`, `textMuted`, sob o valor.
3. **Entrada → saída** ("07/11 08:10 → 07/11 17:40") e permanência ("9h30") separados por " · ", em algarismos tabulares.
4. **Regra:** tabela de convênio e regra da conveniada ("Tabela X · 50%"); a rotatividade, quando houver, numa linha extra em `textMuted`.
5. **Rodapé do cartão:** "Total R$ 30,00 · Cliente R$ 15,00" em `fontSizes.xs`, `textMuted`, com os rótulos escritos (não depender de posição).

Todos os dados do RF13 do PRD de Faturas continuam presentes. Os cartões não são tocáveis (não há detalhe de saída) e por isso **não** têm estado pressionado nem aparência de botão.

- **Cabeçalho da seção:** "Saídas desta fatura" + resumo "14 saídas · R$ 1.250,00" em uma linha, para quem rola uma lista longa saber quanto deve somar.
- **Rodapé da seção:** cartão com "14 saídas" à esquerda e "Total da fatura R$ 1.250,00" à direita em negrito (a conferência da soma), no fim do conteúdo e **sem barra fixa própria** (a barra fixa do §3.2 já ocupa a base).
- **Lista longa:** todas as saídas são exibidas (o back devolve a lista inteira); sem paginação. O resumo do cabeçalho da seção cobre a orientação.
- **Fatura cancelada:** aviso tracejado no lugar da lista, como hoje.

### 3.5 Voltar (RF11)
Mantém o `BackButton` "Voltar para faturas" no topo; ele usa o histórico (`router.back()`), então volta à lista com os mesmos filtros e página (que estão na URL). O gesto de voltar do sistema se comporta igual. Sem histórico (link direto), vai para `/faturas`.

### 3.6 Estados do detalhe
| Estado | Comportamento visual |
|---|---|
| Carregando | `Skeleton` do herói (cartão), de uma linha do ciclo e de 3 cartões de saída; `role="status"` "Carregando fatura". Sem barra de ações. |
| Fatura aberta | Herói, ciclo recolhido, saídas, barra fixa. |
| Fatura paga | Sem barra fixa; herói com "Paga em"; ciclo recolhido com o resumo do pagamento. |
| Fatura cancelada | Sem barra fixa; valor riscado; aviso no lugar das saídas. |
| Erro | `ErrorBanner role="alert"` + "Tentar novamente" e "Voltar para faturas". |
| Não encontrada (404) | "Fatura não encontrada." + link "Ver todas as faturas". |
| Sem permissão (403) | `ErroSemPermissao`. |

## 4. Emitir fatura (modal em tela cheia, RF12 a RF18)

Mantém o `Modal` `fullScreenOnMobile` (cabeçalho e rodapé fixos, só o corpo rola). O que muda no celular:

```
┌ Emitir fatura ───────────────── × ┐
│ Conveniada*  [ Auto Peças Sul ▾ ] │  select nativo
│ Vencimento*  [ 08/12/2026 ]       │  input date nativo
│   (7 dias)(15 dias)(30 dias)      │  atalhos tocáveis
│ Observação   [               ]    │  3 linhas
│                         0 / 500   │
│ ⓘ A fatura reúne todas as saídas…│
├───────────────────────────────────┤
│ [ Emitir fatura ]                 │  rodapé fixo
│ [ Cancelar ]                      │
└───────────────────────────────────┘
```

- **Conveniada:** `Select` nativo (a folha do sistema é o padrão no celular). Se houver uma só, já vem selecionada.
- **Vencimento:** `Input type="date"` com `min` em hoje e valor inicial a 30 dias. **Atalhos** logo abaixo: `OptionGroup` de 3 opções ("7 dias", "15 dias", "30 dias") que preenchem o campo com hoje + N dias; escolher uma data à mão desmarca o atalho. Os atalhos são apenas conveniência de preenchimento e não mudam a regra (o campo continua obrigatório e validado como hoje).
- **Observação:** `Textarea` com 3 linhas iniciais e contador "0 / 500"; excedendo, o contador vira `danger` com "Máximo de 500 caracteres." e o botão de emitir se desabilita.
- **Aviso fixo (`InfoCard`)** sobre "todas as saídas em aberto", como hoje, depois dos campos.
- **Rodapé:** na ordem de leitura do celular o botão **primário em cima** e "Cancelar" embaixo (é o `column-reverse` atual do `Modal`), em largura total, cada um com ≥ `touchTarget`. O rodapé ganha o **espaço da área segura** (`env(safe-area-inset-bottom)`) para o botão não ficar sob o indicador do aparelho.
- **Teclado (RF13, RF15):** a data usa o seletor nativo (sem teclado), a conveniada também; só a observação abre o teclado de texto. Ao focar um campo, ele rola para a vista (`scroll-margin` acima do campo) e o rodapé continua visível: o `Modal` já reduz a altura com a altura do teclado de toque do app (`--teclado-altura`); para o teclado nativo, o Tech Spec confirma o comportamento de `100dvh` em iOS e Android e, se preciso, adota o ajuste de viewport adequado.
- **Erros (RF17):** sob o campo (`aria-describedby`); erros gerais, como "sem saídas a faturar", num `ErrorBanner role="alert"` no topo do corpo, que **rola até a vista** quando aparece. O modal fica aberto e nada do que foi digitado se perde.
- **Sucesso (RF18):** fecha o modal, leva ao detalhe e mostra o `Toast` "Fatura emitida: 14 saídas, R$ 1.250,00."

## 5. Registrar pagamento (modal em tela cheia, RF12 a RF16)

```
┌ Registrar pagamento · #12 ─────── × ┐
│ Valor da fatura         R$ 1.250,00 │
│ ⓘ Este pagamento não entra no caixa.│  logo no topo
│ Forma de pagamento*                 │
│ ┌Dinheiro┬ Pix ┐                     │
│ └Crédito─┴Débito┘                    │  OptionGroup, 2 colunas
│ Valor pago (R$)  [ 1.250,00 ]       │
│   Em branco: o valor total.         │
│ Data: agora · Alterar               │  recolhido
├─────────────────────────────────────┤
│ [ Registrar pagamento ]             │
│ [ Cancelar ]                        │
└─────────────────────────────────────┘
```

- **Resumo no topo:** `Resumo` existente (valor da fatura).
- **Aviso "não entra no caixa" sobe para logo abaixo do resumo** (hoje está no fim do formulário e pode ficar abaixo da dobra). Assim é visto antes de qualquer decisão (RF16). Texto: "Este pagamento não entra no caixa. Registre aqui só o recebimento da fatura."
- **Forma de pagamento:** `OptionGroup` com as formas já usadas no Caixa (`FORMA_PAGAMENTO_OPTIONS`) em **2 colunas** de botões tocáveis, em vez do `Select`: um toque em vez de dois. Obrigatória; erro "Escolha a forma de pagamento." sob o grupo.
- **Valor pago:** continua com o teclado numérico de toque do app (`TECLADO_DECIMAL`) e máscara monetária; dica "Em branco: o valor total da fatura." e `placeholder` com o total. Valor diferente do total: aviso informativo abaixo do campo, como hoje.
- **Data do pagamento:** **recolhida** por padrão como a linha "Data: agora · Alterar" (botão de texto com alvo de 44 px). Ao tocar, aparece o `Input type="date"` com `max` em hoje; vazia significa agora. Quem não precisa mexer na data vê um campo a menos.
- **Rodapé e teclado:** iguais ao §4. O teclado de toque do app é uma folha própria; o botão de confirmar e o campo em edição continuam visíveis acima dela (comportamento já existente do `Modal`).
- **Sucesso:** fecha o modal, o detalhe se atualiza (selo Paga, barra fixa some, ciclo com o resumo do pagamento) e o `Toast` "Pagamento registrado." aparece no topo da tela.
- **Erro:** `ErrorBanner` no topo do corpo, rolando até a vista; modal aberto.

## 6. Cancelar fatura (RF12, RF16, RF18)

`ConfirmDialog` existente, sem mudar de conteúdo (título "Cancelar fatura #12?", texto sobre as saídas voltarem a ficar em aberto, "Manter fatura" com foco inicial e "Cancelar fatura" em perigo). No celular:
- Os dois botões ficam **empilhados em largura total**, cada um com ≥ `touchTarget`, o de perigo **separado** do "Manter fatura" por 8 px e **abaixo** dele (o foco inicial e o dedo natural caem no "Manter").
- Diálogo curto, centralizado (sem `fullScreenOnMobile`), com margens laterais de `space[3]`.
- Sucesso: `Toast` "Fatura cancelada. As saídas voltaram a ficar em aberto." Erro: `ErrorBanner` dentro do diálogo, que permanece aberto.

## 7. Componentes

### Reaproveitados (`src/components/ui`)
`Modal`, `ConfirmDialog`, `Button`, `Select`, `Input`, `Textarea`, `OptionGroup`, `Accordion`, `StatusBadge`, `PlateDisplay`, `InfoCard`, `ErrorBanner`, `Skeleton`, `Pagination`, `Toast`, `BackButton`, `Text`. Formatadores de data, valor e permanência existentes, sem duplicar.

### Novos, na feature (`src/components/faturas`)
- `FaturaCard`: cartão da lista no celular (link esticado, hierarquia do §2.2).
- `VencimentoAviso` (ou função + componente de apresentação): o texto e o ícone do destaque de vencimento (§2.3), usado no cartão, no herói e, se o Tech Spec decidir, na tabela.
- `SaidaCard`: cartão compacto de cada saída (§3.4). `ItensFatura` escolhe entre tabela (≥ `md`) e cartões (< `md`).
- Barra de ações do detalhe (§3.2), local da feature (estilo `sticky`, como o rodapé de Conferência).
- Atalhos de vencimento (§4) e o recolhimento da data do pagamento (§5): pequenos pedaços locais dos modais.

### Alterados no design system (melhorias compartilhadas, a validar no Tech Spec)
- `Modal`: rodapé com `padding-bottom` somando `env(safe-area-inset-bottom)` (beneficia todos os modais em tela cheia).
- `Pagination`: botões com alvo de 44 px em telas de toque; o layout já cabe em 320 px.
- `Select`: opção de ocultar o rótulo visualmente (continua para leitores de tela), usada no filtro de conveniada.
- `Toast`: sem mudança; já aparece no topo da tela, longe das barras da base.

Nada disso muda o visual em computador.

## 8. Tokens e camadas

Existentes (sem criar cores): `colors.accent`, `text`, `textMuted`, `success`, `warn`, `danger`, `dangerSoft`, `border`, `surface`, `surfaceMuted`, `space`, `radii`, `fontSizes`, `fontWeights`, `typography.display`, `breakpoints.md`, `layout.touchTarget`, `layout.actionBarHeight`, `layout.bottomNavReserved`, `shadows.md`. Tons de `StatusBadge`: `warn`, `success`, `neutral`.

**Um token novo** (`layout`): a folga que o conteúdo reserva para o botão flutuante (hoje o valor `88px` está escrito à mão em Mensalistas). Sugestão: `layout.fabClearance`, usado por Faturas e, depois, por Mensalistas. Não é necessário criar nenhum outro.

Reserva de espaço no fim do conteúdo, no celular (o `AppShell` já reserva a folga da barra de navegação):
- **Lista:** `fabClearance` (botão flutuante).
- **Detalhe de fatura aberta:** nenhuma reserva extra: a barra de ações é `sticky` no fim do conteúdo, então ocupa o seu próprio lugar no fluxo.

Ordem das camadas (de baixo para cima): conteúdo → barra de ações / botão flutuante → barra de navegação inferior → teclado de toque → modais → `Toast` (no topo da tela, sem disputar espaço com as barras da base).

## 9. Responsividade e acessibilidade

| Faixa | Lista | Detalhe | Fluxos |
|---|---|---|---|
| < `md` (celular) | Filtros compactos, cartões, botão flutuante | Herói, ciclo recolhido, saídas em cartões, barra de ações fixa | Modais em tela cheia |
| `md` a `lg` (tablet) | Tabela, botão no cabeçalho (como hoje) | Ciclo abaixo do herói, tabela de saídas, botões no herói (como hoje) | Modais centralizados |
| ≥ `lg` (desktop) | Como hoje | Herói e ciclo lado a lado (como hoje) | Como hoje |

- **Uma só implementação, dois arranjos:** o mesmo conjunto de dados e as mesmas funções de formatação alimentam tabela e cartões; o Tech Spec evita duplicar o DOM de forma que leitores de tela leiam tudo duas vezes (apenas um dos dois arranjos fica no fluxo de leitura).
- **Toque:** todo controle com altura/largura ≥ `layout.touchTarget`; 8 px entre alvos adjacentes; nenhuma informação ou ação depende de passar o mouse (RF21); estado pressionado (não só `:hover`) nos cartões da lista.
- **Texto:** mínimo de 14 px no corpo e 12 px só em apoio; sem rolagem horizontal em nenhuma tela, de 320 px para cima; nome longo de conveniada trunca com reticências, valor longo quebra.
- **Área segura:** barras fixas e rodapés de modal somam `env(safe-area-inset-bottom)`.
- **Leitor de tela e teclado:** o cartão da lista tem nome acessível completo ("Fatura 12, Auto Peças Sul, R$ 1.250,00, aberta, vence em 2 dias"); o destaque de vencimento é texto, não só cor ou ícone; foco visível em todos os controles; modais devolvem o foco a quem os abriu; erros ligados ao campo (`aria-describedby`) e gerais em `role="alert"`.
- **Movimento:** sem animação nova além da abertura dos modais e do recolhimento do `Accordion`, ambos com `prefers-reduced-motion` respeitado.
- **Temas claro e escuro** só pelos tokens; o fundo `dangerSoft` do destaque de vencimento garante contraste de texto nos dois.

## 10. Mapa PRD → design

| Requisito | Onde |
|---|---|
| RF1, RF2 | §2.1 (filtros em ~100 px; linha "Filtrando" com "Limpar") |
| RF3, RF4 | §2.2, §2.3 (cartão e destaque de vencimento) |
| RF5 | §2.4 (botão flutuante) |
| RF6 | §2.5 (paginação e estados) |
| RF7 | §3.1 (herói) |
| RF8 | §3.2 (barra de ações fixa) |
| RF9 | §3.3 (ciclo recolhido) |
| RF10 | §3.4 (saídas em cartões compactos, total conferível) |
| RF11 | §3.5 (voltar mantém filtros e página) |
| RF12 a RF18 | §4, §5, §6 (fluxos em tela cheia, teclado, controles tocáveis, aviso antes de confirmar, erros e sucesso) |
| RF19 | Direção: nada deixa de existir; computador não muda |
| RF20, RF21 | §9 (toque, texto, rolagem, temas) |

## 11. Pontos para o Tech Spec

- **Detecção de largura:** preferir CSS (media queries) para a troca tabela/cartões e para mostrar/ocultar o botão flutuante e a barra de ações; se for preciso um hook de largura (por exemplo para não montar dois DOMs), definir um único hook no projeto.
- **Constante e função de vencimento:** `diasParaVencer(vencimento, hoje)` pura e testável, com a constante de "perto de vencer" (3 dias) em um só lugar; comparação por texto de data local, sem horário.
- **Teclado nativo em celulares:** confirmar o comportamento de `100dvh` com teclado aberto no iOS e no Android; se o campo em edição ou o rodapé ficarem cobertos, ajustar a estratégia de viewport do `Modal`.
- **`Accordion` do ciclo:** confirmar se o componente atual aceita um resumo no cabeçalho fechado; senão, estender o componente.
- **Barra de ações acima da navegação:** resolvido como `sticky` local (padrão de Conferência), sem tocar no `ActionBar`.
- **Melhorias compartilhadas** (`Modal`, `Pagination`, `Select`): cada uma tem testes próprios; Faturas só consome.
- **Valor pago diferente do total e demais pontos em aberto do PRD** seguem como estão (aviso informativo).
