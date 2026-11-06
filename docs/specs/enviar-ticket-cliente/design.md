# Design Spec: Enviar link do ticket ao cliente

Insumo para o Tech Spec. Baseado em `prd.md` (RF1 a RF8) e no design system (`src/styles/theme.ts` + `src/components/ui`). Nenhum token novo e nenhum componente base novo: a feature é um popup curto montado com `Modal`, `OptionGroup`, `Input` e `Button`.

## Direção

É uma ação de passagem: o operador está com o cliente ao lado, quer mandar o link e voltar ao balcão. Por isso:

- **Dois toques até o campo.** Abrir o popup já deixa o canal padrão (WhatsApp) escolhido e o foco no contato.
- **Um campo só.** O canal troca o campo, não soma campos.
- **O botão diz o que vai acontecer.** "Abrir WhatsApp" / "Abrir e-mail", porque o envio termina no aplicativo do operador, não no sistema.
- **Sem surpresa de dados.** O popup mostra a placa para o operador conferir que está mandando o ticket do carro certo.

---

## 1. Telas e estados

### A. Ponto de entrada (RF1)

Botão `Button variant="secondary"`, com ícone de envio (seta de papel, `currentColor`, `aria-hidden`) e o texto **"Enviar ao cliente"**.

| Onde | Posição |
|---|---|
| Comprovante de entrada (`ReciboEntradaStep`, após "Entrada registrada") | Na linha de ações, entre "Concluir" e "Imprimir". Fica fora da área de impressão (`#recibo-print-root` não o inclui). |
| Detalhe do ticket no Pátio (`TicketView`) | Nas ações do detalhe, ao lado de "Mostrar QR do ticket ao cliente". Mesma hierarquia (secundário, 48px). Registrar saída continua sendo o único primário. |

- Alvo de toque mínimo de 44px (48px no detalhe, como as demais ações).
- Sem token/link do ticket (`token` ausente): o botão **não** aparece no comprovante da entrada, onde o QR já some pelo mesmo motivo. No detalhe do pátio fica visível, mas desabilitado, com `aria-describedby` apontando para o texto "Link do ticket indisponível." (RF8), `xs`, `textMuted`.

### B. Popup "Enviar ticket ao cliente" (RF2, RF3, RF7)

`Modal` `size="sm"`, `fullScreenOnMobile={false}` (diálogo curto), título **"Enviar ticket ao cliente"**, `closeOnBackdrop` ligado enquanto nada foi digitado.

```
┌ Enviar ticket ao cliente ─────────── × ┐
│ Ticket de FLP3C88                      │  placa em mono, sm, textMuted
│                                        │
│ Enviar por                             │
│ [ ● WhatsApp ]  [ ○ E-mail ]           │  OptionGroup tile, 2 colunas
│                                        │
│ WhatsApp do cliente                    │
│ [ (11) 91234-5678                    ] │  Input
│ Informe o DDD e o número.              │  hint
│                                        │
│ ┌ prévia da mensagem ────────────────┐ │
│ │ Olá! Segue o ticket do veículo     │ │  cartão surfaceMuted, sm
│ │ FLP3C88 no Estacionamento Central: │ │
│ │ murel.app/comprovante/…            │ │
│ └────────────────────────────────────┘ │
│                                        │
│            [Cancelar] [Abrir WhatsApp] │  footer
└────────────────────────────────────────┘
```

- **Cabeçalho do corpo:** linha "Ticket de" + placa (`fontFamilies.mono`, `bold`, `colors.text`); `sm`, resto em `textMuted`. Ajuda a conferir o veículo.
- **Canal:** `OptionGroup` (`legend` "Enviar por", `variant="tile"`, `columns={2}`) com WhatsApp e E-mail, cada um com ícone e texto. Padrão: WhatsApp.
- **Campo de contato:** `Input`, com `data-autofocus` no abrir e ao trocar de canal.

  | Canal | label | tipo/teclado | placeholder | hint |
  |---|---|---|---|---|
  | WhatsApp | "WhatsApp do cliente" | `type="tel"`, `inputMode="tel"`, `autoComplete="off"`, máscara `(00) 00000-0000` via `formatPhone` | `(11) 91234-5678` | "Informe o DDD e o número." |
  | E-mail | "E-mail do cliente" | `type="email"`, `inputMode="email"`, `autoComplete="off"`, `autoCapitalize="none"` | `cliente@exemplo.com` | "Ex.: nome@dominio.com" |

  No celular, o campo de WhatsApp usa o teclado numérico do navegador (`inputMode="tel"`), sem abrir o teclado próprio de placa.
- **Validação (RF3):** o erro só aparece após o campo ser tocado e perder o foco, ou ao tentar enviar. Mensagens (`Input error`, `colors.danger`, texto, nunca só cor): "Informe o WhatsApp com DDD." / "Informe um e-mail válido, como nome@dominio.com." Enquanto inválido, o botão de envio fica desabilitado (`disabled`) e o motivo está no hint/erro do campo.
- **Prévia da mensagem:** cartão `surfaceMuted`, `radii.md`, `space[3]` de padding, texto `sm`. Mostra a mensagem que será aberta no aplicativo (RF5), com o link em mono, truncado com reticências no meio se longo. Não é editável nesta versão. `aria-label="Prévia da mensagem"`.
- **Rodapé (`footer`):** `Button variant="secondary"` "Cancelar" e `Button` primário **"Abrir WhatsApp"** / **"Abrir e-mail"** (muda com o canal). 48px. No celular, os dois ocupam a largura toda, empilhados com o primário em cima.
- **Trocar canal (critério de aceite):** limpa o contato e o erro, mantém a prévia atualizada, devolve o foco ao campo.

### C. Estados

| Estado | Comportamento |
|---|---|
| Inicial | WhatsApp selecionado, campo vazio, sem erro, botão desabilitado. |
| Digitando | Máscara aplicada ao WhatsApp; botão habilita quando válido. |
| Inválido (tocado) | `Input` com borda `danger` e mensagem; botão desabilitado. |
| Enviando | Ao confirmar, abre o aplicativo (nova aba/janela via link `wa.me` ou `mailto:`), fecha o popup e mostra `Toast variant="success"`: "Mensagem aberta no WhatsApp. Confirme o envio por lá." / "…no aplicativo de e-mail…". O aviso não afirma que a mensagem foi entregue. |
| Link indisponível (RF8) | Popup não abre; no detalhe, o botão está desabilitado (ver A). Se o link falhar após abrir, o corpo mostra `ErrorBanner` "Não foi possível gerar o link do ticket." e só "Fechar". |
| Cancelar / Esc / × / fundo | Fecha sem enviar e sem guardar o contato (RF6, RF7). O foco volta ao botão que abriu (comportamento do `Modal`). |

O envio não tem estado de carregamento próprio: o link é montado localmente, sem chamada ao back.

---

## 2. Componentes

**Reaproveitados:** `Modal`, `OptionGroup`, `Input`, `Button`, `Toast`, `ErrorBanner`.

**Novo (específico da feature, fora de `ui`):** um popup de envio do ticket, reaproveitado pelos dois pontos de entrada, mais o botão de acionamento. Local e nomes finais no Tech Spec. O conteúdo da mensagem e a montagem do link `wa.me`/`mailto:` também são do Tech Spec.

Não há componente novo no design system: nada aqui é padrão que outras telas precisem.

## 3. Tokens

Nenhum valor solto e nenhum token novo.

| Uso | Token |
|---|---|
| Texto, apoio | `colors.text`, `colors.textMuted` |
| Prévia da mensagem | `colors.surfaceMuted`, `radii.md` |
| Erro | `colors.danger` (via `Input error`) |
| Placa e link | `fontFamilies.mono` |
| Corpo, dicas | `fontSizes.sm`, `fontSizes.xs` |
| Espaçamento | `space[2]` entre rótulo e campo, `space[3]` dentro da prévia, `space[4]` entre blocos |
| Foco | `colors.focus`, `outline-offset: 2px` (já nos componentes base) |

## 4. Responsividade e acessibilidade

**Responsividade**
- Largura do popup: `size="sm"` (480px). Em telas pequenas ocupa a largura disponível com margem do `Modal`, sem tela cheia (`fullScreenOnMobile={false}`).
- Rodapé empilhado em coluna abaixo de `breakpoints.md`, lado a lado a partir dele.
- Quando o teclado virtual abre, o campo e o botão principal continuam visíveis (o `Modal` rola o corpo).
- Sem rolagem horizontal a partir de 320px; o link da prévia trunca com reticências.

**Teclado e leitor de tela**
- Foco inicial no campo de contato (`data-autofocus`); Esc fecha; foco preso e devolvido ao botão de origem (do `<dialog>`).
- `OptionGroup` usa radios nativos: setas trocam o canal; o nome é "Enviar por, WhatsApp, 1 de 2".
- Erro do `Input` ligado por `aria-describedby`/`aria-invalid`; o erro é anunciado ao ser exibido.
- O botão desabilitado tem o motivo em texto visível (hint/erro), não só no estado.
- O `Toast` de sucesso tem `role="status"`.
- Contraste mínimo de 4,5:1 nos textos, nos dois temas; o ícone dos botões é reforço, sempre com texto.
- Alvos de toque de 44px no mínimo (canais, campo, botões).

## 5. Pontos a validar na implementação

- **WhatsApp com DDI:** `wa.me` exige o número com código do país; assumir Brasil (55) é decisão do Tech Spec. O popup não pede DDI.
- **Posição do botão no comprovante de entrada:** confirmar que três ações (Concluir, Enviar, Imprimir) cabem em 320px; se não couberem, empilhar com "Concluir" por último.
- **Bloqueio de pop-up:** abrir `wa.me`/`mailto:` a partir do clique de confirmação (gesto do usuário) para o navegador não bloquear; tratado no Tech Spec.
- **Fora do escopo visual:** edição da mensagem, histórico de envios e confirmação de entrega.
