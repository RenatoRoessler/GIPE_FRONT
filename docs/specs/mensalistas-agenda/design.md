# Design Spec: Agenda de vencimentos dos mensalistas

Insumo para o Tech Spec. Baseado em `prd.md` (RF-01 a RF-10). Segue o design system (`src/styles/theme.ts` + `src/components/ui`). Complementa `docs/specs/mensalistas/design.md`, `docs/specs/mensalistas-contrato/design.md` e `docs/specs/mensalistas-pagamento/design.md`, que continuam valendo para a ficha, o contrato e o pagamento. Os modelos visuais (computador e celular) estão em https://claude.ai/artifact/XzKzxUJG7D9xfcJC9njZK3 (modelo B).

## Direção

Tela **Operate**, usada várias vezes ao dia no balcão e no pátio, no computador e no celular. Herda o mundo visual do GIPE (tema "Confiança Azul" e "Grafite Coral", fonte do app, tabelas e modais atuais). A mudança está na **composição**, não na identidade:

- **A lista deixa de ser um cadastro e vira uma fila.** A ordem da tela é a ordem em que o operador deve agir: atrasados, hoje, esta semana, ainda sem pagamento. O vencimento passa a ser a primeira coisa de cada linha, em tamanho de leitura, porque é por ele que o operador decide.
- **Uma ação por linha.** Cada item tem uma ação principal com nome ("Receber", "Reenviar"), e a ficha fica a um toque no nome. Sem ícones sozinhos para as ações frequentes.
- **Celular não é uma versão reduzida da tabela.** É uma lista de itens de duas linhas com alvos de 44px, e a confirmação do pagamento fica fixa embaixo.

O que **não** fazer: cartões grandes iguais lado a lado; número gigante de resumo (o resumo é uma frase); vermelho como cor de texto pequeno (reprova o contraste); barra colorida na lateral do item; menu de três pontos para ações frequentes; modal para a consulta.

---

## 1. Telas e estados

### A. Página de Mensalistas

As abas passam de duas para três: **Agenda** (primeira e padrão), **Lista** (a tabela atual, com a busca ampliada) e **Tipos de mensalidade**. O componente `Tabs` já rola na horizontal e tem alvo de 44px, então cabe em 320px sem mudança.

O cabeçalho da página continua com o título "Mensalistas" e o botão "Novo mensalista". No celular o botão sai do cabeçalho e vira um botão flutuante "+ Novo" no canto inferior direito, com 48px de altura, respeitando a área segura do aparelho.

### B. Agenda (computador)

```
Mensalistas                                              [Novo mensalista]
[ Agenda ] [ Lista ] [ Tipos de mensalidade ]

Até domingo, 25/10: 7 mensalistas vencem, somando R$ 3.640,00.   [🔍 Nome, placa ou documento]

Atrasados  3
15/10   Transportadora Alfa Ltda      [BRA2E19][XYZ9K88] +1     R$ 900,00   [Receber]
6 dias  Integral · todas
17/10   Fábio Nunes                   [FNB5C77]                 R$ 200,00   [Receber]
4 dias  Noturno · carro
...
Vencem hoje  2
...
Esta semana  2 de 5                                                    [Ver os outros 3]
...
Ainda sem pagamento  9
1º pagamento  Ana Lima                [ABC1D23]                 R$ 280,00   [Receber]
              Contrato aceito em 20/10
Contrato      Carla Dias              [CDS6F10]                 R$ 280,00   [Reenviar]
              Link vence em 27/10

109 mensalistas em dia, com vencimento depois de domingo            [Ver todos]
```

- **Frase de resumo (RF-04):** texto comum em `fontSizes.sm`, com a contagem e o valor em `fontWeights.bold` e `tabular-nums`. Não é um cartão nem um número grande. Ao lado fica a busca (`Input`), à direita, com largura máxima de 320px.
- **Grupos (RF-01):** cada grupo é uma `section` com título e contagem. O título usa `fontSizes.lg` e `fontWeights.bold`; a contagem, `textMuted`. Há uma linha fina (`border`) abaixo do título. **Atrasados** mostra a contagem em um `StatusBadge tone="danger"`; os demais, em texto.
- **Item (RF-02):** uma linha de grade com cinco colunas: vencimento (88px), nome, placas, valor e ação.
  - *Vencimento:* a data em `fontSizes.lg`, `fontWeights.bold`, `tabular-nums`; abaixo, em `fontSizes.xs`, o atraso ("6 dias") ou "hoje" ou o dia da semana. Quando atrasado, o atraso vai em `StatusBadge tone="danger"`, e não em texto vermelho.
  - *Nome:* o nome é um botão sem aparência de botão (sublinha no hover e foco), que abre a ficha. Abaixo, em `fontSizes.xs` e `textMuted`, o tipo e a categoria.
  - *Placas:* até duas `PlateDisplay size="sm"` e `+N` em `StatusBadge tone="neutral"`, como na lista atual (`VeiculosResumo` sem o botão, porque o toque está no nome).
  - *Valor:* `fontWeights.medium`, `tabular-nums`, alinhado à direita.
  - *Ação:* `Button size="sm"`. "Receber" é primário em atrasados e hoje, e secundário em "esta semana". "Reenviar" é sempre secundário.
- **Ainda sem pagamento:** no lugar da data, um `StatusBadge` com o motivo ("1º pagamento", tom `info`; "Contrato", tom `warn`; "Link vencido", tom `danger`). A linha secundária conta o fato ("Contrato aceito em 20/10", "Link vence em 27/10").
- **Em dia:** uma linha tracejada (como o estado vazio atual, mas compacta) com a contagem e o botão "Ver todos", que leva à aba Lista.
- **"Ver os outros N":** botão secundário no fim de "Esta semana" e de "Ainda sem pagamento" quando passam de cinco itens. Atrasados e hoje mostram todos.

### C. Agenda (celular, até `breakpoints.md`)

- Sem tabela e sem colunas. Cada item é uma linha de dois níveis, sem cartão (só um divisor entre itens):
  - *Primeira linha:* o nome (botão que abre a ficha) e o botão "Receber" à direita.
  - *Segunda linha:* a primeira placa (`PlateDisplay sm`) e `+N`, e o vencimento e o valor em `fontSizes.xs` ("6 dias de atraso · R$ 900"), com o atraso dentro de um `StatusBadge tone="danger"`.
- O botão de ação tem **44px de altura** (`min-height`) e ocupa as duas linhas, do lado direito. O toque no nome tem 44px de altura também.
- O resumo vira uma frase curta de uma linha ("Até domingo: 7 vencem, R$ 3.640,00"). A busca é um campo de largura total logo abaixo das abas.
- Os títulos de grupo rolam com o conteúdo. Não ficam fixos: o cabeçalho do app já é fixo no celular e não expõe a própria altura, então um título fixo precisaria adivinhá-la. Como cada grupo mostra poucos itens, o título raramente sai da vista.
- O botão "+ Novo" é flutuante; o conteúdo ganha folga embaixo para o último item não ficar escondido.
- Tipos de mensalista com nome longo cortam com reticências na primeira linha; o nome completo está na ficha.

### D. Pagamento e ficha (reaproveitados)

- "Receber" abre o `PagamentoMensalistaModal` existente direto, sem passar pela ficha; o nome abre o `MensalistaFichaModal` existente, que já tem Editar, Registrar pagamento e Reenviar contrato.
- No celular o `Modal` já ocupa a tela toda (`fullScreenOnMobile`), com o botão de confirmar no rodapé. Não se cria folha nova: o rodapé fixo atende o requisito do PRD.
- Depois do pagamento, o comprovante é o atual. Ao concluir, o item some do grupo e um `Toast` diz "Pagamento registrado" (ver acessibilidade).

### E. Estados (RF-10)

| Estado | Comportamento |
|---|---|
| Carregando | Esqueletos no formato de grupos: um título e três linhas por grupo, na mesma altura dos itens reais (`Skeleton`). `role="status"` "Carregando a agenda". |
| Sem nada a atender | Área tracejada: "Nenhum mensalista para atender até domingo." e, abaixo, o botão "Ver todos os mensalistas". |
| Busca sem resultado | Mensagem "Nada encontrado para "{termo}"." e o botão "Limpar busca". Os grupos somem. |
| Busca com resultado | Os mesmos grupos, só com os itens que casam; grupos sem item não aparecem. O resumo passa a dizer "N encontrados". |
| Erro | `ErrorBanner role="alert"` com a mensagem do back e "Tentar novamente" (`Button variant="secondary"`). Sem o botão quando o erro for de permissão (403). |
| Item enviando (reenvio) | O botão da linha vira "Reenviando…" e fica desabilitado; só aquela linha é afetada. |
| Atualizando em segundo plano | A agenda mantém o conteúdo anterior com opacidade reduzida (como a tabela atual) e `aria-busy`. |

---

## 2. Componentes

**Reaproveitados:** `Tabs`, `Button`, `Input`, `StatusBadge`, `PlateDisplay`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`, `MensalistaFichaModal`, `PagamentoMensalistaModal`, `useReenviarContrato`, `EmptyState` de `Mensalistas.styles`, `formatBRL`, `formatDiaCobranca`.

**Mudanças no design system (`src/components/ui`):**
- `StatusBadge`: novo tom `danger`. Fundo `colors.dangerSoft` (token novo), texto `colors.text` e um ponto de 8px na cor `colors.danger` antes do texto. O texto é escuro de propósito: `colors.danger` sobre fundo claro dá cerca de 4,2:1, abaixo dos 4,5:1 exigidos para texto pequeno.
- `Button`: nenhum tamanho novo. No celular, a agenda aplica `min-height: 44px` por estilo local, porque `size="sm"` fica com cerca de 28px de altura.

**Novos (`src/components/mensalistas/`):**
- `AgendaView`: orquestra a busca, os grupos, o resumo e os estados.
- `AgendaGrupo`: seção com título, contagem, itens e "Ver os outros N".
- `AgendaItem`: a linha do item (grade no computador, duas linhas no celular).
- `AgendaResumo`: a frase do resumo.
- `agenda.ts`: regras puras (agrupar, ordenar, resumir, filtrar), para teste.

Nomes finais e pastas ficam a cargo do Tech Spec.

## 3. Tokens

**Um token novo:** `colors.dangerSoft`, nos dois temas.
- Claro: `rgba(226, 61, 78, 0.12)`.
- Escuro: `rgba(255, 107, 107, 0.16)`.

Os demais já existem:
- **Cores:** `text`, `textMuted`, `border`, `surface`, `background`, `primary` (foco, ação principal, aba ativa), `primarySoft` (hover e `info`), `warn`/`onWarn` (contrato pendente), `danger` (apenas o ponto do selo), `success`.
- **Espaçamento:** `space[2]` entre selo e texto, `space[3]` entre colunas e itens, `space[4]` entre grupos e no padding da página, `space[5]` acima do título de um grupo e `space[3]` abaixo (mais espaço acima do que abaixo).
- **Tipografia:** `fontSizes.xs` (linhas secundárias), `sm` (resumo, valores), `md` (nome), `lg` (título do grupo e data); `fontWeights.bold` para data, título e totais; `tabular-nums` em datas e valores.
- **Raios e sombras:** `radii.md` nos botões e na área tracejada; `radii.full` nos selos. O botão flutuante usa `shadows.md`.
- **Foco:** anel padrão `outline: 3px solid colors.primary; outline-offset: 2px`.

## 4. Responsividade e acessibilidade

**Responsividade**
- Abaixo de `breakpoints.md` (768px): itens de duas linhas, resumo curto, busca em largura total, "+ Novo" flutuante. A partir de 768px: a grade de cinco colunas.
- Entre 768px e 1024px, a coluna de placas encolhe (mostra uma placa e `+N`) para o nome não ser cortado cedo.
- Sem rolagem horizontal em nenhuma largura, a partir de 320px. Nomes e tipos longos cortam com reticências.
- O texto do corpo não cai abaixo de 14px; a linha secundária usa 12px só para tipo e fatos, nunca para o que decide a ação.

**Teclado e leitor de tela**
- Cada grupo é uma `section` com `aria-labelledby` apontando para o título; os itens são uma `ul`/`li`.
- A ordem de foco por item é: nome, depois a ação. Não há menu escondido.
- Os botões têm nome acessível com o mensalista: "Receber de Transportadora Alfa Ltda", "Reenviar contrato para Carla Dias", "Ver ficha de Fábio Nunes".
- O atraso e a situação são sempre texto ("6 dias de atraso", "Link vencido"); a cor só reforça.
- A frase de resumo e as mensagens de busca (`N encontrados`, `Nada encontrado`) ficam em `role="status"`.
- Depois de um pagamento, o `Toast` do pagamento continua genérico, e uma região `role="status"` oculta anuncia "{nome} saiu de {grupo}.". O foco volta ao primeiro item do grupo que ficou, ou ao título se o grupo desapareceu. O operador não perde o lugar na fila.
- Alvos de toque de pelo menos 44px nos botões, no nome e nas abas. As placas e os selos não são alvos de toque.
- Contraste de pelo menos 4,5:1 nos textos e nos selos, nos dois temas; `danger` não é usado como cor de texto.
- Respeita `prefers-reduced-motion`: a única transição é a opacidade da atualização, que some quando o usuário reduz movimento.

**Pontos a validar na implementação**
- **Atraso:** como a API informa o atraso e desde quando (`diasAteProximoVencimento` negativo ou texto em `situacao`); define o grupo "Atrasados" (PRD §9).
- **Totais e ordem:** se vêm da API ou são calculados sobre a página carregada; muda o texto do resumo quando incompleto ("nesta página").
- **Busca por nome e placa:** se é da API ou sobre os dados carregados.
- **Valor do resumo:** mensalidade do tipo ou cobrança pendente.
- **Fora do escopo:** quadro por etapas, relatórios e lembretes.
