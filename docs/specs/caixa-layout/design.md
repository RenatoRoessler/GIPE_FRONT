# Design Spec: Refatoração do layout do Caixa

Insumo para o Tech Spec, a partir de `docs/specs/input.md` e dos dois mockups de celular em `docs/specs/1.jpeg` (visão Administrador/Gerente) e `docs/specs/3.jpeg` (visão Manobrista/Operador). Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto.

> **Sem PRD próprio.** Esta é uma refatoração de layout de uma tela que já existe (`docs/specs/caixa/prd.md`, `caixa-finalizacao`). Os requisitos funcionais do Caixa não mudam. O que muda é a hierarquia da informação e a distribuição das ações. Os pontos que os mockups sugerem mas o código atual não sustenta estão na seção 7, para o produto decidir antes do Tech Spec.

**Direção:** tela de operação (*Operate*) usada no celular, no balcão, com o expediente em andamento. A pergunta da tela é "quanto tenho em caixa agora e o que posso fazer?". Os mockups respondem com uma pilha de cartões de largura total em ordem de importância: situação do caixa, valor em caixa em destaque, fundo e dinheiro na gaveta lado a lado, divisão por forma de pagamento e, no pé, as ações. O número grande é o herói da tela; as ações ficam ao alcance do polegar, com **Fechar caixa** como único botão de preenchimento cheio.

## 1. O que muda em relação à tela atual

| Hoje | Nos mockups |
|------|-------------|
| Título "Caixa" e texto de apoio no topo | Some; o cabeçalho do aplicativo (logo) já identifica a área. A situação do caixa abre a tela. |
| Cabeçalho com selo "Caixa aberto", ações no topo (Passar turno, Histórico de turnos, Fechar caixa) e link "Caixas anteriores" | Cartão "Abertura do caixa" só com data/hora e o selo "Aberto". Ações descem para o pé da tela. |
| "Na gaveta agora" como destaque, barra Fundo × Pode retirar e linha Entradas/Saídas/Saldo | "Valor em caixa" como destaque; "Fundo de caixa" e "Dinheiro na gaveta" em dois cartões menores. |
| Tabela por forma de pagamento (Entradas, Saídas, Esperado) no painel "Turno atual" | Lista de formas com barra empilhada e valor à direita, em formato de cartão. |
| Retirada dentro do bloco da gaveta | Retirada vira **Sangria**, botão secundário no pé. |
| Abas (movimentos, linha do tempo, gráficos, turnos) abaixo | Fora dos mockups (só mostram a primeira tela); ver seção 7. |

## 2. Telas e estados

Rota inalterada: `/caixa` (e `/caixa/historico` para Administrador/Gerente).

### 2.1 Caixa aberto, visão Administrador/Gerente (`1.jpeg`)

```
┌ Abertura do caixa ─────────────────────┐
│ Aberto em 29/10/2026 07:00   ● Aberto  │
└────────────────────────────────────────┘
┌ Valor em caixa ────────────────────────┐
│ R$ 1.384,00                            │  ← herói (tipografia display, accent)
│ Recebido R$ 1.284,00 em 37 tickets     │
└────────────────────────────────────────┘
┌ Fundo de caixa ──┐ ┌ Dinheiro na gaveta ┐
│ R$ 100,00        │ │ R$ 314,00          │
│                  │ │ Fundo + dinheiro   │
└──────────────────┘ └────────────────────┘
┌ Por forma de pagamento ──── R$ 1.284,00 ┐
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ │  ← barra empilhada
│ ● Dinheiro      8 tickets   R$ 214,00  │
│ ● Pix          14 tickets   R$ 512,00  │
│ ● Cartão Débito 6 tickets   R$ 160,00  │
│ ● Cartão Crédito 9 tickets  R$ 398,00  │
└────────────────────────────────────────┘
[   Sangria   ] [ Lançar despesa ]         ← secundários
[           Fechar caixa            ]      ← primário, largura total
```

### 2.2 Caixa aberto, visão Manobrista/Operador (`3.jpeg`)

Mesma pilha de cartões. Diferenças:
- O subtítulo do valor em caixa diz "Recebido R$ 1.284,00 em 37 tickets **+ fundo de caixa**" (explica de onde vem o valor).
- O cartão "Fundo de caixa" traz a legenda "Troco na abertura".
- No pé, em lugar de Sangria e Lançar despesa, um único botão secundário **Trocar turno**, acima de **Fechar caixa**.

### 2.3 Estados

| Estado | Comportamento visual |
|--------|----------------------|
| Carregando | `Skeleton` no formato dos cartões (situação, valor em caixa, dois cartões, lista), `role="status"` com rótulo "Carregando caixa". |
| Caixa fechado | `CaixaFechado` atual com o botão "Abrir caixa"; sem valor em caixa nem ações de turno. Mantido como está. |
| Caixa aberto sem turno | Valor em caixa e totais do caixa continuam; "Dinheiro na gaveta" e a lista por forma mostram "—" e há aviso discreto "Não há turno em andamento". Ações que dependem do turno ficam desabilitadas. |
| Erro | `ErrorBanner role="alert"` + `Button` secondary "Tentar novamente"; 403 com `ErroSemPermissao`. Sem mudança. |
| Atualizando | Valores trocam sem piscar (mantém o dado anterior até chegar o novo). |
| Ação em andamento | O botão que abriu o modal segue o padrão atual dos modais (Sangria, Trocar turno e Fechar caixa continuam em `Modal`). |

## 3. Cartões e conteúdo

- **Abertura do caixa:** rótulo em `textMuted`; "Aberto em" + data e hora em `fontWeights.bold`; selo `StatusBadge tone="success"` com o texto "Aberto" (o estado nunca depende só da cor).
- **Valor em caixa:** o número em `typography.display` na cor `colors.accent` (amarelo no tema escuro, asfalto no claro; **nunca `primary` como cor de texto** no tema claro, por contraste). Linha de apoio com "Recebido" em destaque e a quantidade de tickets.
- **Fundo de caixa / Dinheiro na gaveta:** dois cartões iguais (`Card` sem animação de entrada), valor em `fontWeights.bold`, legenda em `textMuted`. Lado a lado a partir de 320px, sem quebra.
- **Por forma de pagamento:** título à esquerda e total à direita. Barra empilhada com a proporção de cada forma e, abaixo, uma linha por forma: amostra de cor, nome, quantidade de tickets em `textMuted`, valor alinhado à direita em `fontWeights.bold`. Divisórias tracejadas entre as linhas, com `colors.border`.
- Cores das formas: os tokens `colors.pagamento` (`dinheiro`, `pix`, `debito`, `credito`), que correspondem às cores dos mockups. Já existem no tema, mas nenhum componente os usa ainda; esta tela é a primeira a consumi-los. Cada amostra leva o nome da forma ao lado; a barra é decorativa (`aria-hidden`) e a lista é o conteúdo acessível.
- Formas sem movimento (R$ 0,00) aparecem na lista, sem trecho na barra.

## 4. Ações

| Ação | Visão | Estilo | Observação |
|------|-------|--------|------------|
| Sangria | Administrador/Gerente | `Button secondary`, metade da largura | É a "Retirada" atual (`SangriaModal`), renomeada. |
| Lançar despesa | Administrador/Gerente | `Button secondary`, metade da largura | **Não existe hoje.** Ver seção 7. |
| Trocar turno | Manobrista/Operador | `Button secondary`, largura total | É o "Passar turno" atual (`PassarTurnoModal`), renomeado. |
| Fechar caixa | todas | `Button primary`, largura total, alvo de 48px | Hoje é `danger`; nos mockups é o amarelo da marca. É a ação principal da tela. |

O pé da tela fica sobre o conteúdo no fluxo normal (não fixo), acima da barra de navegação inferior. Alvos de toque de 44px no mínimo.

## 5. Componentes do design system

### Reaproveitados
- **Card** (e os painéis atuais de `Caixa.styles`/`GavetaResumo.styles`, que já têm a mesma aparência de cartão), **StatusBadge**, **Button**, **Skeleton**, **ErrorBanner**, **ErroSemPermissao**, **Text**, **Toast**.
- Modais atuais: `AbrirCaixaModal`, `SangriaModal`, `PassarTurnoModal`, `FecharCaixaModal`, `HistoricoTurnosModal`. Nenhum muda de comportamento.
- Cálculo da gaveta (`calcularGaveta`) e agregados (`agregados.ts`, `proporcao`) já existem e continuam sendo a fonte dos números.

### Novos (feature, em `components/caixa`)
- Cartão de **valor em caixa** (herói).
- Cartão de **divisão por forma de pagamento** (barra empilhada + lista).
- **Barra de ações** do pé, que varia por perfil.

Nenhum componente novo em `ui`.

## 6. Tokens usados

- Cores: `surface`/`border`, `text`/`textMuted`, `accent` (valor em caixa), `success` (selo), `pagamento.*` (barra e amostras), `primary`/`onPrimary` (Fechar caixa), `focus`.
- Espaçamento da escala `space`; tipografia de `fontSizes`/`fontWeights`; o valor em caixa com `typography.display`. Raios `radii.lg` nos cartões.
- Nenhum token novo. Funciona nos dois temas: os mockups mostram o escuro, o claro deriva dos mesmos tokens.

## 7. Pontos em aberto (decidir antes do Tech Spec)

O que os mockups mostram e o código atual não entrega, ou entrega de outro jeito:

1. **"Lançar despesa" não existe.** Não há função, tela nem endpoint de despesa no projeto; hoje a única saída de dinheiro é a Sangria (retirada). Opções: (a) tirar o botão desta entrega e registrar a despesa como funcionalidade à parte, com PRD e contrato do back; (b) mantê-lo desabilitado. **Recomendação: (a).**
2. **Contagem de tickets (total e por forma).** "37 tickets", "8 tickets" etc. não vêm de `GET /Caixa` nem de `GET /Caixa/turno`: as formas só trazem valores (`entradas`, `saidas`). Sem o dado, a tela mostraria só valores. Opções: (a) pedir ao back a quantidade por forma; (b) omitir a contagem nesta entrega. **Recomendação: (b) agora e abrir o pedido ao back.**
3. **Quem vê o quê.** Os mockups dividem por papel, mas as regras de hoje são: Sangria para Administrador, Gerente e Caixa; histórico de caixas para Administrador e Gerente; Manobrista acessa o Caixa mas não a Sangria. Proposta: a barra de ações segue as permissões já existentes (Sangria para quem tem `caixa.sangria`; Trocar turno para quem opera o turno, inclusive Administrador/Gerente) em vez de duas telas por papel. Confirmar se o Administrador/Gerente também precisa ver "Trocar turno" e se o perfil Caixa (que tem Sangria) usa a barra do operador ou a do gestor.
4. **Para onde vão as abas (movimentos, linha do tempo, gráficos, turnos), o "Histórico de turnos" e o link "Caixas anteriores".** Os mockups só mostram a primeira tela. Recomendação: manter as abas abaixo da barra de ações, mantendo todo o conteúdo atual; "Histórico de turnos" passa para dentro das abas (a aba de turnos já existe) e "Caixas anteriores" continua como link para quem tem permissão, abaixo do cartão de abertura.
5. **"Valor em caixa".** Pelos números dos mockups (R$ 1.284,00 recebido + R$ 100,00 de fundo = R$ 1.384,00), é entradas totais mais o fundo, e não o "saldo" atual, que exclui o fundo. Confirmar se saídas (sangrias) entram na conta, e com isso a fórmula e o texto de apoio ("Recebido… + fundo de caixa").
6. **Fechar caixa em amarelo (primário) e não em vermelho (`danger`)** como hoje, por ser a ação principal da tela; o modal de fechamento continua com a conferência e a confirmação.
7. **Título "Caixa".** Sai da tela nos mockups; para leitores de tela o cabeçalho da página continua existindo como `h1` visualmente oculto.

## 8. Responsividade

- **Celular (principal, 360px de referência):** coluna única de cartões com margem padrão; dois cartões lado a lado para fundo e gaveta; ações no pé com as duas secundárias lado a lado e o Fechar caixa em largura total.
- **Tablet e desktop:** o conteúdo não estica: largura máxima de ~720px centralizada, ou, se o Tech Spec preferir aproveitar a largura, valor em caixa e cartões em duas colunas com a divisão por forma ao lado. Decisão de composição para o Tech Spec; não há mockup para essas larguras.
- Mantém o menu padrão (lateral nas telas grandes, barra inferior no celular).

## 9. Acessibilidade

- Cada cartão é uma região rotulada pelo seu título (`aria-labelledby`); o valor em caixa lê "Valor em caixa, R$ 1.384,00".
- O selo "Aberto" leva o texto; as amostras de cor da forma de pagamento acompanham o nome da forma, e a barra empilhada é `aria-hidden`.
- Valores em algarismos tabulares para alinhar à direita; contraste AA nos dois temas (por isso `accent` no número e não `primary` como texto).
- Ações operáveis por teclado, foco visível com `colors.focus`; os modais mantêm o foco e a ordem atuais.
- Resultado das ações continua anunciado pelo `Toast` (`role="status"`).
