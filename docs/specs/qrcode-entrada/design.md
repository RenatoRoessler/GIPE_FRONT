# Design Spec: QR Code do comprovante de entrada

Insumo para o Tech Spec. Baseado em `prd.md` (RF1 a RF7). Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto.

Duas superfícies: **(A)** etapa de comprovante no modal de entrada (operador) e **(B)** página pública de consulta (cliente, no celular).

## 1. Telas e estados

### A. Comprovante no `EntradaVeiculoModal`

Hoje o modal fecha e mostra um toast ao registrar. Passa a ter uma segunda etapa, no mesmo padrão do fluxo de saída (`ReciboSaidaStep`): **formulário → comprovante**.

```
┌ Entrada registrada ─────────────┐
│ ✓ Entrada registrada            │
│ ┌ - - - - - - - - - - - - - - ┐ │
│ │     Nome da empresa         │ │
│ │  Comprovante de entrada     │ │
│ │ - - - - - - - - - - - - - - │ │
│ │         GPV3543             │ │
│ │ Veículo      Fusca · verde  │ │
│ │ Categoria          Carro    │ │
│ │ Ticket                2828  │ │
│ │ Entrada   15/10/26 19:21    │ │
│ │ Tabela   valores padrões    │ │
│ │ - - - - - - - - - - - - - - │ │
│ │        ▛▀▀▜ QR ▛▀▀▜         │ │
│ │  Escaneie para ver os dados │ │
│ └ - - - - - - - - - - - - - - ┘ │
│        [Concluir] [Imprimir]    │
└─────────────────────────────────┘
```

| Estado | Comportamento visual |
|--------|----------------------|
| Formulário | Como hoje (sem o campo de ticket). |
| Enviando | Como hoje: campos e botão desabilitados. |
| Sucesso | Troca o formulário pelo comprovante; faixa `Success` (`colors.success`, ícone de check) acima. O modal **não fecha** sozinho. |
| Erro ao registrar | Como hoje: `ErrorBanner` no formulário; nada de comprovante. |
| Fechar (X / Concluir) | Fecha sem confirmação: a entrada já foi registrada (o diálogo "Descartar entrada?" só vale na etapa do formulário). Dispara o `onSuccess` de hoje. |
| Imprimir | `window.print()`; só o comprovante sai impresso (mesmo mecanismo `PrintStyles` do recibo de saída). QR em preto sobre branco, sem fundo/sombra. |

O QR é calculado no cliente a partir do link, então não há loading nem falha de geração separada da entrada.

### B. Página pública da entrada

Rota fora do `(app)`, sem login nem menu; usa `PageBackground` + `Card` + `Logo` (mesmo chassi das telas de auth, via `AuthCard` ou equivalente). Mobile first: coluna única.

```
        [Logo]
  Comprovante de entrada
┌─────────────────────────┐
│        GPV3543          │
│  Fusca · verde          │
│  ───────────────────    │
│  Categoria      Carro   │
│  Ticket          2828   │
│  Entrada  15/10/26 19:21│
│  Tabela  valores padrão │
│  Mensalista       Não   │
└─────────────────────────┘
```

| Estado | Comportamento visual |
|--------|----------------------|
| Loading | `Skeleton` no lugar da placa e das linhas (mesma altura do conteúdo final, sem pulo de layout). |
| Sucesso | Dados do RF4. Placa em destaque (mesmo estilo de `ReceiptPlaca`). Sem IDs internos e sem operador (RF5). |
| Não encontrada (RF6) | `Text variant="heading"` "Entrada não encontrada" + `Text variant="muted"` "Confira o QR code do seu comprovante." Sem dados parciais. |
| Erro de rede / servidor | `ErrorBanner` com mensagem genérica e botão "Tentar novamente" (`Button variant="secondary"`). Distinto de "não encontrada". |
| Dados opcionais ausentes | Modelo/cor/tabela nulos: omite a linha (mesmo critério do `ReciboConteudo`). |

## 2. Componentes

**Reaproveitados:** `Modal`, `Button`, `Text`, `ErrorBanner`, `Skeleton`, `Card`, `Logo`, `PageBackground`, `AuthCard`. Do recibo de saída: `Receipt`, `ReceiptHeader`, `Divider`, `Rows`, `ReceiptPlaca`, `Actions`, `PrintStyles`, `Success` (hoje em `ReciboSaidaStep.styles.ts`).

**Novos:**
- `ReciboEntradaStep` (etapa do modal) e `ReciboEntradaConteudo` (corpo do comprovante), em `src/components/veiculos`, espelhando `ReciboSaidaStep`/`ReciboConteudo`.
- `QrCode` em `src/components/ui/QrCode`: recebe `value: string`, `size?: number` e `label` (texto alternativo). Renderiza SVG inline (nítido na impressão), margem de silêncio de 4 módulos, cores de contraste máximo (módulos `colors.text`, fundo branco fixo, independente do tema escuro, para o leitor funcionar).
- `EntradaPublica` (conteúdo da página B), reaproveitando as linhas `Rows`.

**Refatoração sugerida (decidir no Tech Spec):** extrair `Receipt`, `Divider`, `Rows`, `ReceiptPlaca`, `PrintStyles` do `ReciboSaidaStep.styles.ts` para um módulo compartilhado de recibo, em vez de duplicar estilos entre entrada e saída.

## 3. Tokens usados

Nenhum token novo.
- Cores: `colors.text`, `textMuted`, `border`, `background`, `success`, `danger` (erro). O fundo do QR é branco fixo por exigência de leitura, não um token de tema.
- Espaçamento: `space[1]` a `space[4]` (mesmos do recibo de saída); QR com padding `space[3]`.
- Tipografia: `fontSizes.sm` (linhas), `lg` (empresa), `xl` + `fontWeights.bold` (placa).
- Raios: `radii.md` no comprovante; `radii.sm` no contêiner do QR.
- Sombras: nenhuma no comprovante (impressão).

## 4. Responsividade e acessibilidade

- **Modal (A)**: comprovante com `max-width: 360px` centralizado. `Actions` empilhadas e invertidas no mobile (`column-reverse`), em linha a partir de `breakpoints.sm`, como no recibo de saída.
- **Página pública (B)**: `Card` com largura máxima do `AuthCard`; funciona de 320px para cima, sem rolagem horizontal. QR não aparece na página pública (só no comprovante).
- **QR**: tamanho mínimo 160px na tela e 3 cm impresso; SVG com `role="img"` e `aria-label="QR code do comprovante de entrada"`. O link não é exibido como texto no comprovante, para não poluir a impressão.
- **Foco**: ao abrir a etapa de sucesso, foco no título/faixa de sucesso (`role="status"`), não no botão Imprimir.
- **Contraste**: textos e valores seguem as combinações já usadas no recibo de saída; erros usam `colors.danger` com ícone, nunca só cor.
- **Impressão**: apenas o comprovante, preto sobre branco, sem bordas decorativas além do tracejado.
