# Design Spec: Novo layout do Pátio, ticket e comprovante

Insumo para o Tech Spec. Baseado em `prd.md` (RF1 a RF20) e no protótipo `Murel_Patio_Ticket.html` (telas 5 a 8). Segue o design system (`src/styles/theme.ts` + `src/components/ui`). Substitui a parte visual de `docs/specs/patio/design.md` e de `docs/specs/patio-quadro-chaves`; as regras daqueles documentos (ordem, saída, chave, foco após saída) continuam valendo.

## Direção

O protótipo já usa a marca Murel: asfalto, giz, amarelo faixa, Plus Jakarta Sans e JetBrains Mono. O tema do projeto tem os mesmos valores, então **quase tudo vira token existente** e o desenho se reproduz sem inventar cor.

O que define a tela:

- **Primeiro a ocupação, depois o carro.** Dois blocos no topo respondem "quanto falta?" e "que tipo de carro há?" antes de qualquer lista.
- **Placa e permanência são o rosto do card.** Placa em fonte mono à esquerda, permanência em extra-negrito à direita, as duas na mesma linha. O resto é apoio.
- **Um toque leva ao ticket.** O card inteiro é o alvo; as ações (saída, chave, QR) ficam no detalhe, com espaço para serem grandes e claras.
- **O comprovante é do cliente.** Tela clara, QR enorme e pouca coisa mais, mesmo quando o operador usa o tema escuro.

O que **não** fazer: gráficos ou filtros competindo com os dois blocos do topo; cor como única informação do tipo (sempre selo com texto); ações pequenas dentro do card tocável (link dentro de link); copiar a coluna fixa de 480px para o computador.

---

## 1. Telas e estados

### A. Pátio (celular)

```
┌────────────────────────────────────┐
│ [logo] Pátio                  14:32│
│        Estacionamento Central      │
│                                    │
│ ┌───────────────┐ ┌──────────────┐ │
│ │Vagas ocupadas │ │Por tipo      │ │
│ │ 38 /70        │ │● Avulso    24│ │
│ │ ▓▓▓▓▓░░░░     │ │● Mensal    11│ │
│ │ 32 livres     │ │● Convênio   3│ │
│ └───────────────┘ └──────────────┘ │
│ [🔍 Placa, ticket ou tipo]  [Filtros 2]
│ Atualizado às 14:32      [Atualizar]│
│                                    │
│ ┌────────────────────────────────┐ │
│ │ FLP3C88             8 min   ›  │ │
│ │ COROLLA · BRANCO   permanência │ │
│ │ - - - - - - - - - - - - - - -  │ │
│ │ [Avulso]  Chave A1  Entrada 14:24│
│ └────────────────────────────────┘ │
│  Mostrar mais 100                  │
│  ▸ Ver gráficos do pátio           │
└────────────────────────────────────┘
```

- **Topo (RF1):** marca em amarelo, `h1` "Pátio" (`fontSizes.subtitle`, `extrabold`), nome do estacionamento em `textMuted` e hora atual em `fontFamilies.mono`, à direita. A marca é a do sistema (`Logo`/ícone do menu), não o SVG do protótipo copiado.
- **Vagas ocupadas (RF2):** bloco em `surface`, `radii.xl`. Número ocupado em `fontSizes.xxl`/`extrabold`/`accent` (amarelo no escuro, asfalto no claro), "/capacidade" em `lg`/`textMuted`. Barra de 6px, trilho `surfaceMuted`, preenchimento `text`. Abaixo, "32 livres" em `success`, `bold`. Barra com `role="img"` e rótulo "46% ocupado". Se o sistema separa carros e motos, o bloco mostra o total e a linha de baixo diz "Carros 30/50 · Motos 8/20" em `xs` (decisão final no Tech Spec; ver Pontos a validar).
- **Por tipo (RF3):** bloco ao lado. Uma linha por tipo presente: bolinha de 9px na cor `cliente.avulso|mensal|conveniado`, nome em `sm`, contagem à direita em `bold`/`accent`/`tabular-nums`. Pátio vazio mostra só "Avulso 0".
  - **Cada linha é um botão de filtro** (`aria-pressed`), no lugar da barra de proporção atual. Tocar filtra por aquele tipo; tocar de novo limpa. O alvo tem 44px de altura.
- **Busca (RF4):** campo de 48px, `radii.md`, borda `borderStrong`, ícone de lupa, placeholder "Placa, ticket ou tipo". Reaproveita `Input`. Ao lado, o botão **"Filtros"** (44px) com a contagem de filtros ativos ("Filtros 2"), que abre/fecha um painel logo abaixo da busca com o que o Pátio já tem: categoria (chips), chave fora/dentro do quadro (chips) e "Limpar filtros". No computador o painel fica sempre aberto (ver C).
- **Atualização (RF6):** linha "Atualizado às 14:32" (`time`, `xs`, `textMuted`) e `Button variant="secondary" size="sm"` "Atualizar"; "Atualizando…" desabilitado e lista com opacidade reduzida e `aria-busy`, como hoje.
- **Lista de cards (RF5):** coluna, `space[2]` entre cards. Cada card é um **único link** `surface`, `radii.lg`, padding `space[3]` e seta `›` em `textMuted`:
  1. Placa (`fontFamilies.mono`, `lg`, `bold`, `letter-spacing` leve) e, à direita, permanência (`lg`, `extrabold`, `tabular-nums`).
  2. Modelo · cor em caixa alta (`sm`, truncado com reticências) e a legenda "permanência" (`xs`, `textMuted`).
  3. Divisor tracejado em `border`, e o rodapé: `StatusBadge` do tipo (texto sempre), a chave ("Chave A1" ou "Fora do quadro" com o ponto de atenção que já existe) e "Entrada 14:24" em mono, `xs`, `textMuted`.
  - Estado `:active`/`:hover`: fundo `surfaceMuted`. Foco visível com o anel padrão.
  - Nome acessível: "Ver ticket do carro FLP3C88, avulso, 8 minutos no pátio".
  - Não há botão dentro do card. O botão de chave e o de comprovante da tabela atual passam para o detalhe.
- **Mostrar mais e gráficos:** "Mostrar mais N" e o `details` "Ver gráficos do pátio" ficam no fim da lista, como hoje.

### B. Pátio (estados, RF7)

| Estado | Comportamento |
|---|---|
| Carregando | Esqueletos no formato final: os dois blocos, a busca e oito cards (`Skeleton`). `role="status"` "Carregando o pátio". |
| Pátio vazio | Os blocos aparecem com zero. No lugar da lista: ícone de vaga (retângulo aberto embaixo, borda `border`), "Nenhum carro no pátio", "As entradas aparecem aqui assim que forem registradas." e o botão "Registrar entrada". |
| Busca ou filtro sem resultado | "Nenhum carro encontrado", "Confira a placa, o ticket ou o tipo digitado." e "Limpar busca"/"Limpar filtros". `role="status"`. |
| Erro | `ListError` com "Tentar novamente" (sem o botão em erro de permissão), como hoje. |

### C. Pátio (computador)

Mesmos blocos, reorganizados pela largura, no limite `layout.contentMaxWidth`:

```
Pátio · Estacionamento Central                                   14:32

┌ Vagas ocupadas ───────┐ ┌ Por tipo ─────────┐ ┌ Busca e filtros ─────────┐
│ 38 /70   32 livres    │ │ ● Avulso     24   │ │ [🔍 Placa, ticket…]      │
│ ▓▓▓▓▓▓░░░░░░░         │ │ ● Mensal     11   │ │ Categoria: [chips]       │
└───────────────────────┘ │ ● Convênio    3   │ │ Chave: [chips]  [Limpar] │
                          └───────────────────┘ └──────────────────────────┘
Atualizado às 14:32  [Atualizar]

┌ card ─────────┐ ┌ card ─────────┐ ┌ card ─────────┐
```

- A partir de `breakpoints.md`: resumo em três colunas (ocupação, por tipo, busca e filtros, este último sempre aberto, sem o botão "Filtros").
- Cards em grade: 2 colunas a partir de `md`, 3 a partir de `lg` (`repeat(auto-fill, minmax(…))`), em vez de uma coluna estreita.
- A tabela atual deixa de existir. As informações que só ela mostrava (tabela de preço, operador, sequencial) passam a viver no detalhe do ticket.

### D. Detalhe do ticket (RF8 a RF14)

Tela própria, com `Voltar` (44px, preserva busca e filtros), título "Ticket de entrada" e o código do ticket em mono à direita.

```
‹  Ticket de entrada               H2M8·4QXT

┌────────────────────────────────────┐
│ FLP3C88                            │  placa 28px mono
│ COROLLA · BRANCO · CARRO MÉDIO     │
│ ● Avulso                           │
└────────────────────────────────────┘
┌ Permanência ───┐ ┌ Valor até agora ┐
│ 0h 08          │ │ R$ 12,00        │
└────────────────┘ └─────────────────┘
┌────────────────────────────────────┐
│ Entrada                    14:24   │
│ Próxima faixa   R$ 18,00 às 15:00  │
│ Registrado por              Ana    │
│ Quadro de chaves      [A1] Alterar │
└────────────────────────────────────┘
[ Mostrar QR do ticket ao cliente ]
[ Registrar saída · R$ 12,00       ]
```

- **Veículo (RF9):** bloco `surface`, `radii.xl`; placa em `xl`, mono; modelo · cor · categoria em `sm`, caixa alta, sem truncar; tipo com bolinha de cor e nome (e "· Clínica Vida" no convênio).
- **Dois destaques (RF10):** permanência e valor, em `xl`/`extrabold`/`tabular-nums`, rótulo em `xs`/`textMuted`. Mensalista: o valor mostra "Mensal".
- **Lista de itens (RF11):** linhas separadas por divisor tracejado; rótulo em `textMuted`, valor em `bold`. "Quadro de chaves": a posição vira etiqueta amarela (`primary` com `onPrimary`, mono, `extrabold`, `radii.sm`) ou "Fora do quadro" em `textMuted`; ao lado, o link-botão "Alterar" ou "Guardar chave" (44px) abre o `GuardarChaveModal` existente. "Tabela de preço" e "Sequencial" entram aqui como itens extras, quando existirem.
- **Ações (RF12):**
  - "Registrar saída · R$ 12,00": `Button` primário, 56px, largura total. Sem cobrança: só "Registrar saída". Abre o `SaidaVeiculoModal`.
  - "Mostrar QR do ticket ao cliente": `Button variant="secondary"`, 48px, largura total.
  - No celular as duas ficam presas ao pé da tela, **acima** da barra de navegação inferior (`layout.bottomNavHeight` + área segura), com o conteúdo rolando por trás.
- **Estados:** carregando (esqueletos do bloco do veículo e dos itens); ticket não encontrado, por saída em outro terminal ou código inválido ("Este carro não está mais no pátio", com "Voltar ao pátio"); erro com "Tentar novamente". Depois da saída: volta ao Pátio com o `Toast` já usado, e o foco vai para o vizinho (regra atual).
- **Computador:** duas colunas dentro de uma largura máxima de ~960px: à esquerda veículo e os dois destaques; à direita itens e ações (as ações deixam de ser fixas ao pé). Voltar continua no topo.

### E. Comprovante digital (RF15 a RF18)

Tela cheia, sempre clara, que cobre o menu enquanto está aberta (o operador entrega o aparelho ao cliente).

```
Estacionamento Central                  ✕
CNPJ 00.000.000/0001-00
Rua Exemplo, 123 · Centro · São Paulo/SP
Telefone (11) 0000-0000

Comprovante Digital
┌──────────────────┐
│     [ QR ]       │
└──────────────────┘
FLP3C88
COROLLA · BRANCO
Entrada 28/10 14:24 · Ticket H2M8·4QXT

Aponte a câmera do celular para o QR Code e acompanhe tempo e valor pelo link.
Ou tire uma foto desta tela. Não precisa de cadastro.

[ Pronto ]
```

- **Tema:** a tela aplica o `lightTheme` ao seu próprio trecho (`ThemeProvider`), independente do tema do operador. Fundo `background`, cartões `surface` com borda `border`, texto `text`, apoio `textMuted`. Botão "Pronto" em `text` sobre `background` (56px).
- **QR:** reaproveita o `QrCode` do design system (preto sobre branco, contraste máximo), em tamanho grande: `min(290px, 100%)`. `aria-label` "QR Code do ticket H2M8·4QXT". Se o QR não puder ser gerado, mostra o endereço do ticket como texto.
- **Identificação:** placa em mono `xl`; ticket e entrada em mono `sm`, `textMuted`.
- **Instruções:** cartão com borda `border`, `sm`; a primeira frase em `bold`.
- "✕" (44px) e "Pronto" voltam ao detalhe. Tecla Esc também.
- **Computador:** a mesma coluna única centralizada, em até 480px, sobre o fundo claro de tela cheia. É a única tela em coluna estreita, de propósito, porque é feita para ser vista e fotografada.
- Tela acesa enquanto aberta (RF17) é comportamento, não visual: vai para o Tech Spec.

---

## 2. Componentes

**Reaproveitados:** `Button`, `Input`, `Skeleton`, `Toast`, `Text`, `StatusBadge`, `QrCode`, `Logo`, `ErrorBanner`/`ListError`, `EmptyState` de mensalistas, `GuardarChaveModal`, `SaidaVeiculoModal`, `IndicadorChaves` e os gráficos atuais.

**Mudanças no design system (`src/components/ui`):**
- `StatusBadge`: aceitar os três tipos de cliente, com as cores `cliente.avulso|mensal|conveniado` e texto `onPrimary` (asfalto), como o protótipo e a regra do tema ("texto sobre estas cores é sempre asfalto"). Se o `tone` atual não cobrir, acrescentar `tone="avulso" | "mensal" | "conveniado"`.
- Nenhum outro componente base novo. Os blocos de ocupação, o card do veículo, a lista de itens do ticket e o comprovante são específicos desta feature e ficam em `src/components/patio/`.

**Novos (`src/components/patio/`, nomes finais no Tech Spec):** painel de resumo (ocupação + por tipo), card do veículo, painel de filtros, detalhe do ticket, comprovante digital. A tabela atual e o botão de comprovante da linha saem.

## 3. Tokens

Mapa do protótipo para o tema (nenhum valor solto):

| Protótipo | Token |
|---|---|
| `--fundo` | `colors.background` |
| `--sup` | `colors.surface` |
| `--sup2` | **novo** `colors.surfaceMuted` |
| `--linha` | `colors.border` |
| `--borda` | `colors.borderStrong` |
| `--texto` / `--suave` | `colors.text` / `colors.textMuted` |
| `--faixa` (texto, números) | `colors.accent` |
| `--faixa` (preenchimento) | `colors.primary` + `colors.onPrimary` |
| `--ok` | `colors.success` |
| `--avulso` / `--mensal` / `--conv` | `colors.cliente.avulso` / `mensal` / `conveniado` |
| tema claro do comprovante | `lightTheme` aplicado ao trecho |
| Plus Jakarta Sans / JetBrains Mono | `fontFamilies.sans` / `mono` |
| raios 16 / 14 / 12 | `radii.xl` / `lg` / `md` |
| fontes 38 / 22 / 20 / 14 / 12 | `fontSizes.xxl` / `subtitle` / `lg` / `sm` / `xs` (a placa do detalhe, 34px, vira `xl`) |

**Token novo (único):** `colors.surfaceMuted`, para o trilho da barra de ocupação e o estado pressionado do card. Escuro `#22304B` (o `--sup2` do protótipo); claro um tom entre `surface` e `border` (sugestão `#ECE8DA`), a validar no contraste do trilho contra `surface` (mínimo 3:1 para a barra ser percebida, ou usar `border` como fallback). Entra em `ThemeColors`, `lightTheme` e `darkTheme`.

**Espaçamento:** `space[2]` entre cards e entre selo e texto; `space[3]` dentro de cards e entre os dois blocos; `space[4]` entre seções e na margem da página.
**Foco:** anel `colors.focus`, `outline-offset: 2px`.
**Movimento:** a barra anima a largura em 0,3s, desligada em `prefers-reduced-motion`.

## 4. Responsividade e acessibilidade

**Responsividade**
- Abaixo de `breakpoints.md`: coluna única, blocos de resumo lado a lado (2 colunas iguais), painel de filtros recolhível, ações do detalhe fixas ao pé acima do menu inferior.
- `md` a `lg`: cards em 2 colunas; resumo em 3 colunas com busca e filtros abertos.
- `lg` em diante: cards em 3 colunas, no limite de `layout.contentMaxWidth`.
- Sem rolagem horizontal a partir de 320px (placa e modelo truncam com reticências; a permanência nunca quebra).
- Alvos de toque de 44px no mínimo: card, linhas do "Por tipo", "Filtros", chips, "Voltar", "Alterar", "✕", e as ações.
- A navegação inferior continua a atual; o detalhe do ticket respeita sua altura. O comprovante a cobre.

**Teclado e leitor de tela**
- Card = um `a` com nome completo (placa, tipo, permanência). A lista é uma `ul`.
- "Por tipo" são botões `aria-pressed`; o nome diz "Filtrar por Avulso, 24 carros".
- Tipo, chave e permanência sempre em texto; cor e ícone só reforçam.
- Barra de ocupação com equivalente em texto; "32 livres" também é texto.
- `role="status"` nos avisos de busca, contagem e atualização, como hoje. A hora do topo **não** é anunciada a cada minuto (`aria-hidden` no relógio ou sem região viva).
- Foco: ao voltar do detalhe, vai para o card de onde saiu; depois da saída, para o vizinho (regra atual); ao abrir o comprovante, para o título; ao fechar, para o botão que o abriu.
- Contraste mínimo de 4,5:1 nos textos e nos selos, nos dois temas; o selo `conveniado` (laranja) com texto asfalto passa; confirmar a bolinha de cor sempre acompanhada do nome.
- O comprovante tem `h1` "Comprovante Digital" e a imagem do QR com descrição.

**Pontos a validar na implementação**
- **Saída em dois toques:** com o card abrindo o detalhe, "Registrar saída" exige um toque a mais que a tabela atual. Se o operador sentir a perda, avaliar um atalho no card; fora do protótipo, por isso não incluído.
- **Capacidade:** como mostrar carros e motos no bloco de ocupação (um total ou dois), conforme o PRD.
- **Convênio:** se não existir no back, o tipo e o selo saem e o bloco "Por tipo" mostra só os existentes.
- **Valor e próxima faixa:** dependem do que a API entrega (PRD). Sem esses dados, o detalhe omite os dois campos e o valor na ação, em vez de calcular no navegador.
- **Contraste do `surfaceMuted` no tema claro** (trilho da barra).
- **Voltar preservando a busca:** estado de busca e filtros precisa sobreviver à navegação entre Pátio e detalhe.
- **Fora do escopo:** barra de abas do protótipo, botão de teste "Testar pátio vazio", mudanças na página pública do ticket.
