# Design Spec: Tela de pátio

Insumo para o Tech Spec. Baseado em `prd.md` (RF-01 a RF-11). Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto. Complementa as telas de entrada e saída de veículos (`docs/specs/entrada-veiculos`, `docs/specs/saida-veiculos`) e herda o padrão de lista, busca e celular das telas de mensalistas (`docs/specs/mensalistas-agenda/design.md`).

## Direção

Tela **Operate**, usada várias vezes ao dia no portão e no balcão, no computador e no celular. Herda o mundo visual do GIPE (tema "Confiança Azul" e "Grafite Coral", fonte do app, tabela e botões atuais). O que a define:

- **A placa é o rosto da linha.** O operador procura o carro pela placa, então ela é o primeiro elemento de cada veículo, no mesmo componente `PlateDisplay` que o resto do sistema usa, e não um texto comum.
- **A permanência é o número que decide.** É ela, e não a data, que diz o que está há mais tempo no pátio. Fica em negrito e com algarismos tabulares, ao lado da data de entrada.
- **Uma ação clara por linha.** "Registrar saída" é o botão principal de cada veículo; o comprovante, menos frequente, é um ícone com nome acessível. Nada de menu escondido.
- **Celular como primeira classe.** No celular a tabela vira itens compactos, com a ação principal do lado, ao alcance do polegar.

O que **não** fazer: cartões grandes iguais lado a lado; número gigante de resumo (a quantidade é uma frase); cor vermelha para "muito tempo no pátio" (alertas ficaram fora do escopo); exibir o código do comprovante; modal para consultar o comprovante.

---

## 1. Telas e estados

### A. Página "Pátio" (computador)

Nova entrada no menu, entre "Saída de Veículos" e "Caixa", com um ícone novo de pátio (um estacionamento: a letra P num quadrado).

```
Pátio

42 veículos no pátio · Atualizado às 14:32                      [Atualizar]

[🔍 Buscar por placa, modelo ou ticket]   [Tipo: Todos ▾]  [Categoria: Todas ▾]

PLACA        VEÍCULO              ENTRADA            PERMANÊNCIA   TABELA / OPERADOR       AÇÕES
[BRA2E19]    Gol · ● Prata        17/10/26 15:30     4d 1h 7min    valores padrões…        [Registrar saída] [📄]
Mensalista   Carro pequeno        Seq. 5059                         renato teste
[MNB7880]    Gol · ● Prata        20/10/26 16:41     1d 0h 29min   TABELA MOTOS            [Registrar saída] [📄]
             Moto                 Seq. 2464                         renato teste
```

- **Cabeçalho (RF-01, RF-09):** o título "Pátio" e uma frase com a quantidade e o horário da última atualização, em `fontSizes.sm`, com a contagem em `fontWeights.bold` e `tabular-nums`. À direita, `Button variant="secondary" size="sm"` "Atualizar". O horário usa o elemento `time`.
  - Enquanto atualiza, o botão vira "Atualizando…" e fica desabilitado; a lista permanece com opacidade reduzida e `aria-busy`.
  - Com busca ou filtros, a frase passa a "12 de 42 veículos".
- **Busca e filtros (RF-05, RF-06):** `Input` "Buscar por placa, modelo ou ticket" à esquerda e dois `Select` ("Tipo": Todos, Mensalistas, Avulsos; "Categoria": Todas e as sete categorias) ao lado. Os filtros são `Select` nativos, que funcionam bem no celular. Um botão "Limpar filtros" aparece só quando há filtro ativo.
- **Tabela (RF-02, RF-03, RF-04):** usa o `Table` do design system, com sete colunas.
  - *Placa:* `PlateDisplay size="md"`. Abaixo, um `StatusBadge tone="info"` "Mensalista" quando for o caso (avulso não leva selo, para não gerar ruído).
  - *Veículo:* o modelo em `fontWeights.medium`, com a cor ao lado (uma pequena amostra e o texto, quando a cor é uma das conhecidas; só o texto nas demais) e, abaixo, a categoria com a silhueta de `categoriaIcons` em `textMuted`. Modelo e cor ausentes mostram "—".
  - *Entrada:* data e hora (`formatDateTime`) e, abaixo, "Seq. 2464" e, quando existir, "Ticket 24024", em `fontSizes.xs` e `textMuted`.
  - *Permanência:* o tempo que a API devolve ("4d 1h 7min"), em `fontWeights.bold` e `tabular-nums`.
  - *Tabela / operador:* a tabela de preço aplicada e, abaixo, o operador, em duas linhas truncadas com reticências e `title` com o texto completo.
  - *Ações:* `Button size="sm"` "Registrar saída" (primário) e um `IconButton` de comprovante, de 44px, com `aria-label="Ver comprovante de BRA2E19"` e `title`.
- **Ordem (RF-03):** do que está há mais tempo para o que está há menos [A CONFIRMAR]. A ordem não muda com a busca.

### B. Página "Pátio" (celular, até `breakpoints.md`)

```
Pátio

42 veículos no pátio
Atualizado às 14:32       [Atualizar]

[🔍 Buscar por placa, modelo ou ticket]
[Tipo ▾]  [Categoria ▾]

[BRA2E19] Mensalista                       [Registrar saída]
Gol · Prata · Carro pequeno                          [📄]
4d 1h 7min · entrou 17/10 às 15:30
valores padrões… · renato teste
─────────────────────────────────────
```

- Sem tabela e sem colunas. Cada veículo é um item de quatro linhas, sem cartão (só um divisor):
  1. *Placa* (`PlateDisplay size="sm"`) e o selo "Mensalista"; do lado direito, "Registrar saída", com 44px de altura, ocupando as duas primeiras linhas.
  2. *Modelo · cor · categoria*, em `fontSizes.sm`.
  3. *Permanência* em negrito e a entrada em texto ("entrou 17/10 às 15:30").
  4. *Tabela de preço · operador*, em `fontSizes.xs` e `textMuted`, em uma linha com reticências.
- O botão de comprovante fica abaixo de "Registrar saída", também com 44px.
- A frase de resumo e o "Atualizar" ficam em duas linhas curtas. A busca ocupa a largura toda, e os dois filtros dividem a linha seguinte em duas colunas.
- Sem rolagem horizontal a partir de 320px; nomes e descrições longos cortam com reticências.

### C. Registrar saída a partir do veículo (RF-07)

- "Registrar saída" abre o `SaidaVeiculoModal` existente já com a placa daquele veículo, e o modal vai direto à fase "Confirmar saída" (o veículo é encontrado automaticamente). Enquanto a consulta roda, a fase mostra os esqueletos que ela já tem.
- Se o veículo não está mais no pátio (por exemplo, saiu em outro terminal), o modal fica na fase "Localizar veículo" com a mensagem da API ("Nenhum veículo no pátio com essa placa."), e a lista se atualiza ao fechar.
- Ao concluir, o modal fecha com o toast que ele já mostra, o veículo some da lista e o foco vai para o item que ocupa o lugar (ver acessibilidade). Cancelar não muda a lista.

### D. Ver comprovante (RF-08)

- O ícone abre o comprovante do veículo em uma **nova aba**, na página pública que já existe (`/comprovante/{token}`), que já é pensada para o celular e para impressão. O endereço usa o token do veículo, que nunca aparece como texto na tela.
- O link tem `rel="noopener noreferrer"` e o nome acessível "Ver comprovante de BRA2E19 (abre em nova aba)".
- Veículo sem token: o ícone não é oferecido, e o nome do veículo mostra no `title` "Comprovante indisponível".

### E. Estados (RF-10)

| Estado | Comportamento |
|---|---|
| Carregando | Esqueletos no formato do conteúdo: uma frase de resumo e oito linhas na mesma altura das reais (`Skeleton`). `role="status"` "Carregando o pátio". |
| Sem veículos | Área tracejada: "Nenhum veículo no pátio." e o botão "Registrar entrada", que leva a `/veiculos/entrada`. |
| Busca ou filtro sem resultado | "Nada encontrado para “{termo}”." (ou "Nenhum veículo com esses filtros.") e os botões "Limpar busca" e "Limpar filtros", conforme o caso. |
| Erro | `ErrorBanner role="alert"` com a mensagem do back e "Tentar novamente"; sem o botão em erro de permissão (403). |
| Atualizando | Conteúdo anterior com opacidade reduzida e `aria-busy`; "Atualizar" desabilitado. |

---

## 2. Componentes

**Reaproveitados:** `Table`, `Input`, `Select`, `Button`, `StatusBadge`, `PlateDisplay`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`, `categoriaIcons`, `SaidaVeiculoModal`, `ListError` e o `EmptyState` das telas de mensalistas, `formatDateTime` e a página pública `/comprovante/{token}`.

**Mudanças no design system (`src/components/ui`):** nenhuma.

**Mudanças em componentes existentes:**
- `SaidaVeiculoModal`: aceita uma busca inicial (a placa do veículo) e pula a fase de pesquisa quando ela vem preenchida (Tech Spec).
- `src/lib/nav.ts` e o menu: novo item "Pátio" e um novo ícone no conjunto de ícones do menu (`NavIconId`).

**Novos (`src/components/patio/`):** `PatioView` (resumo, busca, filtros, estados, foco), `PatioTabela` (tabela no computador, itens no celular, na mesma árvore, como na lista de mensalistas), `PatioLinha` (uma linha), `PatioFiltros` e `patio.ts` (regras puras: ordenar, filtrar, resumir). Nomes e pastas finais ficam a cargo do Tech Spec.

## 3. Tokens

**Nenhum token novo.**
- **Cores:** `text`, `textMuted` (linhas secundárias), `border`, `surface`, `background`, `primary` (ação principal, foco), `primarySoft` (hover e selo `info`), `link`.
- **Espaçamento:** `space[2]` entre selo e texto, `space[3]` entre colunas e itens, `space[4]` entre blocos e no padding da página.
- **Tipografia:** `fontSizes.xs` (linhas secundárias), `sm` (valores e a frase de resumo), `md` (modelo), `xl`/`displaySize` (título da página); `fontWeights.bold` na permanência e na contagem; `tabular-nums` em datas, permanências e contagens.
- **Raios e sombras:** `radii.md` nos botões, selos e na área tracejada; `radii.full` nos selos.
- **Foco:** anel padrão `outline: 3px solid colors.primary; outline-offset: 2px`.
- A amostra de cor do veículo é um dado do veículo (como em `CORES_VEICULO`), igual nos dois temas, e não um token de tema.

## 4. Responsividade e acessibilidade

**Responsividade**
- Abaixo de `breakpoints.md` (768px): itens de quatro linhas, busca em largura total e filtros em duas colunas. A partir de 768px: a tabela de sete colunas.
- Entre 768px e 1024px, as colunas "Tabela / operador" e "Veículo" encolhem com reticências para as ações não saírem da tela; as ações nunca ficam atrás de rolagem horizontal.
- Sem rolagem horizontal em nenhuma largura, a partir de 320px.
- Botões, ícones e filtros têm pelo menos 44px de altura no celular; as placas e os selos não são alvos de toque.

**Teclado e leitor de tela**
- A tabela tem cabeçalho de verdade (`th scope="col"`); no celular, cada item é um `li` de uma lista, com a placa lida primeiro.
- Os botões têm nome acessível com a placa: "Registrar saída de BRA2E19", "Ver comprovante de BRA2E19 (abre em nova aba)".
- Mensalista, permanência e entrada são sempre texto; a cor só reforça.
- A frase de resumo e as mensagens de busca ficam em `role="status"` ("12 de 42 veículos", "Nada encontrado para “…”").
- Depois de uma saída registrada, uma região `role="status"` oculta anuncia "{placa} saiu do pátio." e o foco vai para o botão "Registrar saída" do item que ocupa o lugar (ou para o campo de busca, se a lista esvaziou), como na agenda de mensalistas.
- A frase "Atualizado às 14:32" é lida quando muda, mas só depois de uma atualização pedida pelo operador, nunca a cada minuto.
- Contraste mínimo de 4,5:1 nos textos e nos selos, nos dois temas.

**Pontos a validar na implementação**
- **Ordem e permanência:** se o tempo da API acompanha o relógio entre atualizações, ou se a tela o recalcula a partir da data de entrada a cada minuto (muda a confiança no número).
- **Volume:** o comportamento da tabela com centenas de veículos (sem paginação na API); se necessário, mostrar os primeiros N com "Ver os outros".
- **Comprovante:** que o token do veículo da listagem abre o mesmo comprovante que o cliente recebe, e o que a página pública mostra para um veículo que já saiu.
- **Saída direta:** que a busca por placa do fluxo de saída encontra o veículo da lista (placas com ou sem hífen, padrão antigo e Mercosul).
- **Cor e categoria:** os valores livres vindos da API (por exemplo "teste") não podem quebrar a amostra de cor nem o ícone de categoria; categoria desconhecida mostra só o número como texto.
- **Fora do escopo:** alertas de permanência, quadro de chaves e relatórios.
