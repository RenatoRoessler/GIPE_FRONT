# Design Spec: Leitor de placa pela câmera

Insumo para o Tech Spec. Baseado em `prd.md` (RF-01 a RF-06). Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto.

Três superfícies: **(A)** botão de câmera no campo de placa da entrada, **(B)** botão de câmera no campo de placa da busca manual da saída e **(C)** o modal de leitura, único e compartilhado por A e B.

## 1. Telas e estados

### A. Campo de placa da entrada (`PlateField`)

Hoje o campo é um `PlateDisplay size="lg"` com o `PlateInput` no lugar do texto. O botão de câmera entra **dentro da placa, à direita do número**, como na imagem de referência.

```
┌──────────────────────────────┐
│           BRASIL             │
│   ABC1D23              [📷]  │
└──────────────────────────────┘
```

| Estado | Comportamento visual |
|--------|----------------------|
| Padrão | Botão circular com ícone de câmera, borda `colors.border`, fundo `colors.background`. |
| Hover | Borda `colors.primary` (mesmo padrão do `ThemeToggleButton`). |
| Foco (teclado) | Outline 3px `colors.warn`, offset 2px (padrão do projeto). |
| Desabilitado (enviando) | Opacidade reduzida e `cursor: not-allowed`; não abre a câmera. |
| Erro de validação | Só o texto de erro existente abaixo da placa; o botão não muda. |

A placa mantém as cores do objeto físico (papel e tinta fixos nos dois temas), portanto o botão usa as cores do tema **sobre papel claro**, e não herda a tinta da placa. O número continua centralizado; o botão não pode empurrá-lo nem sobrepô-lo.

### B. Campo de placa da busca manual (`BuscaManualSaida`)

Aqui o campo é um `Input` comum, sem placa desenhada. Mesmo botão, posicionado **dentro do campo, à direita**, com espaço reservado no texto para não ficar por baixo dele. Só o campo "Placa" ganha o botão; token e sequencial não.

| Estado | Comportamento visual |
|--------|----------------------|
| Padrão / hover / foco / desabilitado | Iguais a A. |

### C. Modal "Ler placa" (`LeitorPlacaModal`)

Usa o `Modal` do design system (`<dialog>` nativo, foco preso, Esc fecha), `size="sm"`, tela cheia no celular (`fullScreenOnMobile` padrão). Duas etapas no mesmo modal: **leitura → conferência**.

```
Leitura                              Conferência
┌ Ler placa ─────────────── X ┐     ┌ Confirmar placa ───────── X ┐
│ ┌─────────────────────────┐ │     │        ┌──────────────┐     │
│ │ [vídeo da câmera]       │ │     │        │    BRASIL    │     │
│ │   ┌───────────────┐     │ │     │        │   ABC1D23    │     │
│ │   │  enquadre a   │     │ │     │        └──────────────┘     │
│ │   │    placa      │     │ │     │  Confira se está correto.   │
│ │   └───────────────┘     │ │     │  [ ABC1D23 ]  (editável)    │
│ └─────────────────────────┘ │     │ [Ler de novo]   [Usar placa]│
│ Aponte para a placa…        │     └─────────────────────────────┘
│            [Cancelar]       │
└─────────────────────────────┘
```

| Estado | Comportamento visual |
|--------|----------------------|
| Abrindo câmera | Visor com `colors.surface` e mensagem "Abrindo câmera…". |
| Lendo | Vídeo ocupando o visor, com **moldura de enquadramento** em proporção de placa (largura ≈ 3× a altura) centralizada. Cantos da moldura em `colors.warn`, como a mira do leitor de QR. Texto de apoio abaixo: "Aponte a câmera para a placa". |
| Reconhecido | Cantos da moldura passam a `colors.success`, vibração curta (como no QR) e vai para a etapa de conferência. |
| Conferência | `PlateDisplay size="md"` mostrando a placa lida (variante Mercosul/antiga derivada), abaixo o `Input` de placa com o valor, editável e normalizado como a digitação manual. Botões: **Usar placa** (`Button` primary) e **Ler de novo** (`Button` secondary). |
| Sem sucesso (tempo esgotado) | Moldura em `colors.danger`; mensagem "Não consegui ler a placa. Tente de novo ou digite." com botões **Tentar de novo** (primary) e **Digitar** (secondary, fecha o modal e devolve o foco ao campo). |
| Câmera negada | Visor substituído por mensagem: "Permita o acesso à câmera nas configurações do navegador e tente novamente." + botão **Tentar de novo** e **Digitar**. |
| Câmera indisponível / sem conexão segura | Mensagem: "A câmera não está disponível neste aparelho ou navegador." (ou "…exige conexão segura") + botão **Digitar**. |

Anúncios (leitor de tela): região `role="status"` `aria-live="polite"` com a mensagem corrente, igual ao `LeitorQrSaida` (texto visual `aria-hidden`, anúncio em `VisuallyHidden`).

## 2. Componentes

| Componente | Ação | Observação |
|-----------|------|------------|
| `Modal`, `Button`, `Input`, `PlateDisplay` (`src/components/ui`) | **Reaproveitar** | Sem alteração. |
| Visor, mira em cantos, mensagem e `VisuallyHidden` do `LeitorQrSaida.styles.ts` | **Reaproveitar o padrão** | A moldura de placa é variante do visor/mira de QR; extrair o que for comum em vez de copiar. A decisão de onde mora fica no Tech Spec. |
| `ThemeToggleButton` (botão circular 40px) | **Padrão a seguir** | O botão de câmera repete seu visual (borda, hover, foco). Em A é menor (ver tokens). |
| `CameraButton` (botão com ícone de câmera) | **Criar** em `src/components/ui` | Props: `onClick`, `disabled`, `aria-label` (padrão "Ler placa pela câmera"). Ícone SVG inline, `currentColor`, `aria-hidden`, no padrão de `ThemeIcons.tsx`. |
| `LeitorPlacaModal` | **Criar** em `src/components/veiculos` | Contém as etapas de leitura e conferência. |
| `PlateField` e `Input` | **Estender** | Aceitam uma ação à direita (botão de câmera) sem quebrar usos atuais. |

## 3. Tokens usados

Nenhum token novo.

| Uso | Token |
|-----|-------|
| Borda do botão / hover / foco | `colors.border` / `colors.primary` / `colors.warn` |
| Fundo do botão e ícone | `colors.background`, `colors.text` |
| Formato do botão | `radii.full` |
| Tamanho do botão | 36px na placa (A) e 32px no `Input` (B), ambos acima do alvo mínimo de toque de 24px da WCAG 2.2; no celular o botão da placa sobe para 40px (igual ao `ThemeToggleButton`) |
| Espaçamento (botão ↔ borda, entre botões do modal) | `space[2]` e `space[3]` |
| Moldura de leitura | `colors.warn` (lendo), `colors.success` (lido), `colors.danger` (falha) |
| Visor | `colors.surface`, `radii.lg` |
| Texto de apoio e mensagens | `Text` `muted`; `fontSizes.sm` |
| Placa na conferência | `PlateDisplay` (cores fixas da placa) |

## 4. Responsividade

- **Celular (< `breakpoints.md`)**: modal em tela cheia; vídeo ocupa a largura toda com a moldura centralizada; botões da conferência empilhados, largura total, com **Usar placa** primeiro. Câmera traseira preferida.
- **Tablet/desktop**: modal `size="sm"` centralizado; vídeo com proporção fixa (≈ 4:3) dentro do modal; botões lado a lado, alinhados à direita (padrão do `Footer` do `Modal`).
- **Campo A em telas estreitas**: o número da placa reduz junto com a fonte do `PlateDisplay` antes de o botão ser removido ou cortado; o botão nunca sai da placa.
- Orientação paisagem no celular: a moldura se ajusta à altura disponível, sem rolagem dentro do modal durante a leitura.

## 5. Acessibilidade (WCAG 2.2 AA)

- Botão de câmera com `aria-label` "Ler placa pela câmera" e `title`; alcançável por Tab logo após o campo de placa.
- Modal: título "Ler placa" / "Confirmar placa"; foco inicial no visor (leitura) e no campo de conferência (etapa 2); ao fechar, o foco volta ao botão que abriu (já feito pelo `Modal`).
- Contraste: cantos e mensagens sobre vídeo precisam manter 3:1 (cantos) e 4.5:1 (texto); texto de mensagem fica fora do vídeo, no fundo do tema.
- O estado nunca depende só de cor: a moldura muda de cor **e** há mensagem textual anunciada.
- Tudo o que a câmera faz tem alternativa por digitação ("Digitar").
