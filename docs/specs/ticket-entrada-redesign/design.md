# Design Spec: Redesenho do ticket de entrada

Insumo para o Tech Spec. Baseado em `prd.md` (RF1 a RF15) e no protótipo `prototipo-v5.html`. Segue o design system (`src/styles/theme.ts` + `src/components/ui`). Substitui a seção "Detalhe do ticket" de `docs/specs/patio-layout-ticket/design.md`; as regras de comportamento daquele documento (saída, chave, prisma, serviços, foco) continuam valendo.

## Direção

O protótipo é uma pilha de leitura de cima para baixo: **qual é o carro → quanto deve → detalhes → serviços → agir**. Cada degrau tem um peso visual diferente:

- **Cartão do veículo**: contorno, sem preenchimento. A placa é o rosto.
- **Cartão de valor**: o único bloco com cor. O âmbar do protótipo vira o par `warnSoft` (fundo) + `warn` (borda) do tema. É o que o olho encontra primeiro depois da placa.
- **Detalhes**: contorno, tipografia pequena, linhas tracejadas. Apoio.
- **Serviços**: preenchimento `surfaceMuted`, sem borda. Uma área de trabalho separada da leitura.
- **Rodapé**: fixo, separado por uma linha, sempre ao alcance do polegar.

Todas as cores do protótipo são substituídas por tokens existentes (decisão do PRD). **Nenhum token novo é criado.**

O que **não** fazer: pintar outro bloco com cor de destaque (o âmbar perde a força); usar o âmbar quando não há cobrança (mensalista, erro); esconder ações atrás de rolagem; mostrar o tipo só pela cor do selo.

---

## 1. Telas e estados

### A. Ticket (celular, < `breakpoints.md`)

```
┌──────────────────────────────────┐
│     Ticket Entrada - 7895      ✕ │  ← cabeçalho do Modal, título centralizado
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ ABC1T32  [Avulso]            │ │  ← placa mono xl + StatusBadge
│ │ ONIX · VERMELHO · CAMINHONETE│ │
│ │ - - - - - - - - - - - - - -  │ │
│ │ ◷ Permanência    3d 19h 3min │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Valor até agora   R$ 500,00  │ │  ← warnSoft + borda warn
│ │        R$ 450 estadia + R$ 50│ │  ← só com serviços
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Entrada     14/11/2026, 12:20│ │
│ │ - - - - - - - - - - - - - -  │ │
│ │ Tabela de preço Final de Sem.│ │
│ │ - - - - - - - - - - - - - -  │ │
│ │ Registrado por Everton Olive.│ │
│ │ (Ticket · Prisma · Chave)    │ │  ← condicionais, mesma lista
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ SERVIÇOS ADICIONAIS          │ │  ← surfaceMuted
│ │ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │ │
│ │   + Adicionar serviço        │ │
│ │ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤  ← rodapé fixo (footer do Modal)
│ (!) 1 serviço ainda não pronto   │  ← só com pendentes
│ ┌──────────────────────────────┐ │
│ │ ▣ Comprovante cliente        │ │  ← secondary
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Registrar saída · R$ 500,00  │ │  ← primary (amarelo)
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

O conteúdo fica no corpo do `Modal` (que já rola) e o rodapé usa a prop `footer` do `Modal`, que fica fora da área de rolagem. Isso substitui o truque atual de `position: sticky` com margens negativas em `Acoes`.

### B. Ticket (computador, ≥ `breakpoints.md`)

```
┌──────────────────────────────────────────────────────────────┐
│                  Ticket Entrada - 7895                      ✕ │
├──────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────┐  ┌───────────────────────────┐ │
│ │ ABC1T32 [Avulso]          │  │ Entrada  14/11/2026, 12:20│ │
│ │ ONIX · VERMELHO · ...     │  │ Tabela de preço ...       │ │
│ │ ◷ Permanência  3d 19h 3min│  │ Registrado por  ...       │ │
│ └───────────────────────────┘  │ Quadro de chaves  [A1]    │ │
│ ┌───────────────────────────┐  └───────────────────────────┘ │
│ │ Valor até agora  R$ 500,00│  ┌───────────────────────────┐ │
│ └───────────────────────────┘  │ SERVIÇOS ADICIONAIS       │ │
│                                │ + Adicionar serviço       │ │
│                                └───────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ (!) aviso de pendentes                                        │
│ [▣ Comprovante cliente]          [Registrar saída · R$ 500,00]│
└──────────────────────────────────────────────────────────────┘
```

- `Modal size="lg"`, duas colunas iguais (`minmax(0, 1fr)`), gap `space[4]`. Esquerda: veículo e valor (o que se lê). Direita: detalhes e serviços (o que se consulta e altera).
- Rodapé: as duas ações lado a lado, cada uma com `flex: 1`; "Comprovante cliente" à esquerda, "Registrar saída" à direita (ação principal no fim, padrão do sistema). O aviso de pendentes ocupa a linha inteira acima delas.

### C. Estados

| Estado | Corpo | Rodapé |
|---|---|---|
| **Padrão (avulso, com valor)** | Como em A/B. Cartão de valor em âmbar. | "Comprovante cliente" + "Registrar saída · R$ x". |
| **Valor carregando** | Cartão de valor neutro (ver §2.2) com `Skeleton` 96×28px no lugar do número. | "Registrar saída" sem valor. |
| **Valor com erro** | Cartão neutro: "—" e o link "Tentar novamente" (`TentarValor`, alvo de 44px). | "Registrar saída" sem valor. |
| **Valor zero** | Cartão neutro com "R$ 0,00". | "Registrar saída" sem valor. |
| **Mensalista** | Cartão neutro com "Mensal" (`text`). | "Registrar saída" sem valor. |
| **Sem comprovante** (sem token) | Igual ao padrão. | No lugar do botão de comprovante, o texto "Comprovante indisponível para este veículo." (`Aviso`, `sm`, `textMuted`), com o `id` referenciado hoje. |
| **Serviços pendentes** | Igual. | Linha de aviso (`Pendencia`, ícone em `warn`) acima dos botões. |
| **Serviços desligados** | A seção de serviços não aparece. | Igual. |
| **Carregando o ticket** | `role="status"`, "Carregando o ticket": skeleton do cartão do veículo (120px, `radii.lg`), do cartão de valor (64px, `radii.lg`) e da lista (150px, `radii.lg`). Título "Ticket Entrada". | Sem rodapé. |
| **Erro ao carregar** | `ListError` como hoje. | Sem rodapé. |
| **Carro não está mais no pátio** | `Estado` como hoje: título, explicação e "Voltar ao pátio". | Sem rodapé. |

Regra do âmbar: o cartão só fica âmbar quando há **um valor maior que zero a cobrar**, a mesma condição (`cobrando`) que põe o valor no botão de saída. Assim a cor sempre significa "este carro deve isto agora".

---

## 2. Componentes

### 2.1 Cabeçalho (RF1)

- Reaproveita o cabeçalho do `Modal`. Título: `Ticket Entrada - ${codigo}` (ou `Ticket Entrada - Seq. ${sequencial}`); durante o carregamento, só "Ticket Entrada".
- **Centralizar o título** exige uma variação no design system: nova prop `titleAlign?: "start" | "center"` no `Modal` (padrão `"start"`, nenhum outro modal muda). Com `"center"`, o `Header` vira um grid `36px 1fr 36px` (largura do `CloseButton`), com o título centralizado na coluna do meio e truncado com reticências se não couber.

### 2.2 Cartão de valor (RF4 a RF6)

Componente local do ticket (`ValorCartao`), `dl` com uma linha:

- Layout: `flex`, `justify-content: space-between`, `align-items: center`, `gap: space[3]`, padding `space[3]` vertical / `space[3]` horizontal (16px), `radii.lg`.
- **Com cobrança (`$destaque`)**: fundo `colors.warnSoft`, borda `inset 0 0 0 1px colors.warn`. Rótulo "Valor até agora" em `colors.accent` (amarelo no escuro, asfalto no claro), `sm`, `semibold`.
- **Neutro**: fundo transparente, borda `colors.border`, rótulo em `textMuted`. Mesmas medidas, para o layout não pular quando o valor chega.
- Valor: `fontSizes.xl`, `extrabold`, `letter-spacing: -0.03em`, `tabular-nums`, cor `text`, alinhado à direita.
- Divisão estadia + serviços (`Apoio`): segunda linha, alinhada à direita, `xs`, `textMuted`, ocupando a largura toda (`flex-wrap: wrap`; a linha de apoio com `flex-basis: 100%`).
- "Tentar novamente": abaixo do valor, dentro do cartão.

### 2.3 Cartão do veículo (RF2, RF3)

Substitui `VeiculoBloco`. `section` com `aria-label="Veículo"`:

- Contêiner: fundo transparente, borda `inset 0 0 0 1px colors.border`, `radii.lg`, padding `space[3]`.
- Linha 1: `PlacaGrande` (mono, `xl`, `bold`, `letter-spacing: 0.06em`) + `StatusBadge` com `tone` do tipo (`avulso`, `mensal`, `conveniado`, que já usam `colors.cliente.*`). `flex`, `align-items: center`, `gap: space[2]`, `flex-wrap: wrap`.
- Linha 2: `Descricao` (`sm`, `medium`, caixa alta, `letter-spacing: 0.02em`, cor `text`), margem superior `space[1]`.
- Linha 3: `dl` de permanência, com `border-top: 1px dashed colors.border`, `margin-top: space[3]`, `padding-top: space[3]`, `flex` com `space-between`.
  - `dt`: ícone de relógio (SVG inline 16px, `aria-hidden`, `currentColor`) + "Permanência", `sm`, `textMuted`.
  - `dd`: `lg`, `bold`, `tabular-nums`, cor `text`.

### 2.4 Lista de detalhes (RF7, RF8)

Reaproveita `Itens`/`Item`/`TicketItens` quase sem mudança. Ajustes:

- `Itens`: fundo transparente (era `background`) com a borda `border`, igual aos outros cartões de contorno.
- Ordem: Entrada, Tabela de preço, Registrado por, e então Ticket, Prisma e Quadro de chaves (hoje o Ticket vem em segundo; vai para o fim porque o código já está no título).
- `dd` passa de `bold` para `semibold`; a entrada continua em mono. As ações "Informar/Alterar/Guardar chave" (`LinkBotao`) não mudam.

### 2.5 Serviços adicionais (RF9)

Reaproveita `ServicosDoVeiculo`, com ajuste de estilo da `Secao` e do `Titulo` (valem para todo uso do componente, que hoje só existe no ticket):

- `Secao`: fundo `surfaceMuted` (já é), **sem a borda** atual, `radii.lg` (era `xl`), padding `space[3]`.
- `Titulo`: `fontFamilies.mono`, `xs`, `letter-spacing: 0.12em`, caixa alta, `textMuted` (já é); **sem o ícone de gota**. Texto: "Serviços adicionais" sem serviços; "Serviços · 2" com serviços.
- `BotaoVazio` ("+ Adicionar serviço"): já é largura total com borda `1px dashed colors.borderStrong`; muda para `radii.md` (era `lg`) e texto `sm`, `medium`.
- Lista, subtotal, folhas e permissões não mudam.

### 2.6 Rodapé de ações (RF10, RF11)

Conteúdo passado em `footer` do `Modal`, dentro de um único contêiner (`AcoesRodape`) para controlar a ordem e a largura:

- Celular: coluna, `gap: space[2]`; ordem visual de cima para baixo: aviso de pendentes, "Comprovante cliente", "Registrar saída". Os botões ocupam a largura toda.
- Computador (≥ `md`): aviso numa linha; os dois botões em linha, `flex: 1` cada.
- **Comprovante cliente**: `Button variant="secondary"`, `min-height: 48px`, borda `borderStrong` (como `QrBotao` hoje), ícone de QR Code (SVG inline 18px, `aria-hidden`) antes do texto, `gap: space[2]`. Mantém o `id` `ticket-qr-botao` exportado hoje (`QR_BOTAO_ID`).
- **Registrar saída**: `Button` primário (`primary`/`onPrimary`), `min-height: 56px`, `md`, `extrabold`, como `SaidaBotao` hoje. Texto "Registrar saída · R$ 500,00" com cobrança, "Registrar saída" sem.
- `Acoes` e o `position: sticky` atual saem: o `Footer` do `Modal` já fica fixo e já respeita `safe-area-inset-bottom`. O `Footer` hoje usa `column-reverse` e vira `row` a partir de `sm`; o `AcoesRodape` é filho único e ocupa a largura toda (`flex: 1`), então controla o próprio layout.

### Resumo de reaproveitamento

| Peça | Origem | Mudança |
|---|---|---|
| Janela, cabeçalho, rodapé fixo | `ui/Modal` | Nova prop `titleAlign` (design system); uso de `footer`. |
| Selo do tipo | `ui/StatusBadge` | Nenhuma. |
| Botões | `ui/Button` | Nenhuma. |
| Skeleton, Toast, ListError | existentes | Nenhuma. |
| Cartão do veículo | `TicketView.styles` | Reescrito (contorno, linha de permanência). |
| Cartão de valor | `TicketView.styles` | Novo (`ValorCartao`, com `$destaque`). Substitui `Destaques`/`Destaque`. |
| Detalhes | `TicketItens` | Ordem e peso da fonte. |
| Serviços | `servicos/ServicosDoVeiculo` | Estilo da seção, do título e do botão vazio. |
| Ações | `TicketView.styles` | `Acoes` sai; entra `AcoesRodape` no `footer`. |

---

## 3. Tokens usados

| Uso | Token |
|---|---|
| Fundo da janela | `colors.background` (do `Modal`) |
| Borda dos cartões de contorno, linhas tracejadas, divisor do rodapé | `colors.border` |
| Cartão de valor (com cobrança) | `colors.warnSoft` (fundo), `colors.warn` (borda), `colors.accent` (rótulo) |
| Seção de serviços | `colors.surfaceMuted` |
| Botão "+ Adicionar serviço", borda do botão secundário | `colors.borderStrong` |
| Texto principal / apoio | `colors.text` / `colors.textMuted` |
| Selo do tipo | `colors.cliente.avulso / mensal / conveniado` (via `StatusBadge`) |
| Registrar saída | `colors.primary`, `colors.onPrimary` (via `Button`) |
| Aviso de pendentes, ponto "Fora do quadro" | `colors.warn` |
| Foco | `colors.focus` |
| Placa, entrada, rótulo de serviços | `fontFamilies.mono` |
| Tamanhos | placa e valor `xl`; permanência `lg`; ação de saída `md`; rótulos e linhas `sm`; rótulo de serviços e apoio `xs` |
| Pesos | valor e saída `extrabold`; placa e permanência `bold`; detalhes e rótulo do valor `semibold`; descrição e botão vazio `medium` |
| Raios | cartões e seção `radii.lg`; botão vazio `radii.md`; selo `radii.full` (do `StatusBadge`) |
| Espaçamento | entre blocos `space[3]`; padding dos cartões `space[3]`; colunas no computador `space[4]`; dentro de linhas `space[1]`–`space[2]` |
| Alvos de toque | `layout.touchTarget` (44px) mínimo; comprovante 48px; saída 56px |

---

## 4. Responsividade

- **320px a < `md` (768px)**: coluna única, `Modal` em tela cheia (padrão `fullScreenOnMobile`). Placa `xl` cabe em 320px (7 caracteres mono); o selo quebra para a linha de baixo se faltar espaço (`flex-wrap`). No cartão de valor, se valor e rótulo não couberem lado a lado, o valor quebra para baixo, alinhado à direita. Sem rolagem horizontal.
- **≥ `md`**: `Modal size="lg"`, duas colunas; rodapé com os botões em linha.
- O rodapé fixo nunca cobre conteúdo: o corpo do `Modal` rola por cima dele.

## 5. Acessibilidade (WCAG 2.2 AA)

- Tipo sempre em texto no selo; o âmbar reforça o valor, mas o rótulo "Valor até agora" e o número carregam a informação.
- Contraste: rótulo `accent` sobre `warnSoft` (amarelo sobre asfalto no escuro; asfalto sobre amarelo claro no claro) e valor `text` passam de 4,5:1. A borda `warn` é decorativa (no tema claro fica abaixo de 3:1 contra o fundo; o cartão não depende dela para ser entendido). Validar com a ferramenta de contraste na implementação.
- Permanência e valor se atualizam sozinhos **sem** `aria-live`, para não interromper o leitor de tela a cada minuto.
- Ícones de relógio e QR com `aria-hidden`; o nome dos botões vem do texto.
- Ordem de foco: fechar → ações dos detalhes (prisma, chave) → serviços → Comprovante cliente → Registrar saída. Foco visível com o anel padrão (`colors.focus`).
- A volta do comprovante ao ticket segue como hoje (navegação de rota); este redesenho não muda o foco nesse caminho.
