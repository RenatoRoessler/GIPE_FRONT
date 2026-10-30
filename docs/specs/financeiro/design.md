# Design Spec: Módulo Financeiro

Insumo para o Tech Spec. Baseado em `prd.md` (RF1 a RF19). Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto.

**Direção (impeccable):** superfície de operação (*Operate*) criada dentro de um mundo visual já estabelecido (asfalto, giz e amarelo faixa; cartões do Caixa; listas de Mensalistas e Preços). O sistema visual não muda. A novidade é a composição da aba **Fluxo de caixa**, escolhida com o usuário entre três estruturas: a **Régua do saldo**. O saldo do período é o herói; logo abaixo vem uma régua diária com as entradas e saídas de cada dia e a linha do saldo acumulado; e, por fim, a composição em dois lados (entradas | saídas). A tela recusa o padrão "grade de quatro KPIs + gráfico de pizza": um único número responde à pergunta ("sobrou ou faltou dinheiro no período?"), e o resto explica de onde ele veio.

Escolhas confirmadas com o usuário: composição **Régua do saldo**, navegação por **abas em `/financeiro`**, formulários em **modal**.

## 1. Estrutura e navegação

Rota única `/financeiro`, com a aba ativa na URL (`?aba=fluxo` padrão, `?aba=lancamentos`, `?aba=categorias`), como em Mensalistas, para permitir link direto e o botão voltar. Os filtros de cada aba também vão para a query string (período, agrupamento, tipo, categoria, cancelados, página), para que o link do fluxo para os lançamentos (seção 2.4) funcione e um recarregamento mantenha a vista.

```
┌ Financeiro ──────────────────────────────────────────┐
│ [Fluxo de caixa]  Lançamentos  Categorias   [+ Novo lançamento]
│ ──────────────────────────────────────────────────── │
```

- Título `Text variant="heading"` "Financeiro"; abas com o componente `Tabs` existente.
- **"Novo lançamento"** (`Button primary`) fica no cabeçalho, ao lado das abas, visível nas abas Fluxo e Lançamentos: é a ação mais frequente do módulo. Na aba Categorias, o botão do cabeçalho vira "Nova categoria".
- **Menu:** novo item "Financeiro" (`shortLabel` "Financeiro") em `nav.ts`, depois de "Notas Fiscais", com o ícone novo `finance` (cédula/gráfico de saldo), área nova `financeiro` nas permissões. Não entra na prioridade da barra inferior (ela continua com Pátio, Entrada, Saída e Caixa); no celular, fica no menu estendido como os demais.

## 2. Aba Fluxo de caixa

### 2.1 Composição (desktop, ≥ `breakpoints.lg`)

```
┌ Período ─────────────────────────────────────────────────────────┐
│ [Este mês] [Mês anterior] [Este ano]   De [01/10/2026] Até [31/10/2026] [Aplicar]   Ver por [Dia|Mês] │
└──────────────────────────────────────────────────────────────────┘
┌ Saldo do período ────────────────────────────────────────────────┐
│ R$ 75.110,00                                     ← display, accent│
│ ▲ Entradas R$ 75.110,00    ▼ Saídas R$ 0,00    01/10 a 31/10/2026  │
├──────────────────────────────────────────────────────────────────┤
│ R$ 75 mil ┤                                   ___/‾‾‾‾‾‾‾‾  ← acumulado
│           │                              ___/                    │
│         0 ┼──▮─▮───▮──────▮▮────▮───────────────────────── ← zero │
│           │                                                      │
│            01      05      10      15      20      25      31    │
└──────────────────────────────────────────────────────────────────┘
┌ Entradas ── R$ 75.110,00 ──────┐ ┌ Saídas ── R$ 0,00 ─────────────┐
│ Estacionamento rotativo 74.810 │ │ Despesas                        │
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ 99,6%   │ │   Aluguel             2.000,00  │
│ Mensalidades              300 │ │   ▬▬▬▬▬▬▬                       │
│ ▏ 0,4%                         │ │   ↳ Energia             450,00  │
│ Lançamentos                    │ │ …                               │
│   Outras receitas         …   │ │                                 │
└────────────────────────────────┘ └─────────────────────────────────┘
▸ Ver valores por dia                                  (tabela recolhível)
ⓘ Sangria e suprimento não entram no fluxo: o dinheiro só muda de lugar.
```

### 2.2 Blocos

**Período (RF3, RF6, RF8).**
- Atalhos `OptionGroup` (rótulos curtos): **Este mês** (padrão ao abrir), **Mês anterior**, **Este ano** (1º de janeiro até 31 de dezembro, dentro dos 366 dias). Escolher um atalho aplica na hora e preenche as datas.
- Datas "De" e "Até" com `Input type="date"`, ambas obrigatórias, e botão "Aplicar". Validação no cliente antes de chamar: "Informe a data inicial." / "Informe a data final." / "A data final não pode ser antes da inicial." / "Escolha um período de até 366 dias." (mensagem sob o campo "Até"). Editar as datas à mão desmarca o atalho.
- "Ver por" `OptionGroup` **Dia | Mês** (padrão Dia); muda na hora.
- Reaproveitar o `FiltroPeriodo` de Notas, promovido a componente compartilhado (ele e o filtro do Histórico de caixas são duplicados hoje), com as validações de obrigatoriedade e limite de dias passadas por props.

**Saldo do período (herói).**
- Rótulo "Saldo do período" em `textMuted`; valor em `typography.display` com `colors.accent` (nunca `primary` como texto, pelo contraste no tema claro), algarismos tabulares. Saldo negativo: cor `danger` **e** sinal "−" explícito ("− R$ 1.250,00"); a cor nunca é o único sinal.
- Linha de apoio: "▲ Entradas R$ …" (ícone em `success`) e "▼ Saídas R$ …" (ícone em `danger`), texto em `text` com `fontWeights.bold` nos valores; à direita, o período por extenso em `textMuted`.

**Régua (gráfico diário/mensal).**
- Uma coluna por item de `periodos`: haste para cima em `success` (entradas) e haste para baixo em `danger` (saídas), a partir de uma linha zero; a linha do **saldo acumulado** passa por cima, em `colors.accent`, com 2px de espessura. Quando o acumulado fica negativo, a linha cruza o zero, e o trecho abaixo do zero é sombreado com `dangerSoft`.
- Construída à mão, como o `GraficosCaixa` (sem biblioteca de gráficos): colunas em CSS e a linha do acumulado em SVG simples, com `viewBox` e traço que não escala (`vector-effect: non-scaling-stroke`). O desenho é gerado a partir dos dados; não é ilustração.
- Eixo X: no agrupamento por dia, rótulos a cada 5 dias quando o período tem até 31 dias, e no 1º de cada mês nos períodos longos ("out", "nov"…); no agrupamento por mês, todos os meses ("out/26"). Eixo Y com só três marcas (0, máximo e mínimo, quando houver negativo), com valores abreviados ("R$ 75 mil").
- **Interação (assinatura da tela):** passar o mouse, tocar ou focar uma coluna destaca a coluna e o ponto correspondente na linha, e mostra um balão com a data ("Qua, 22/10/2026" ou "Outubro de 2026"), Entradas, Saídas, Saldo do dia/mês e Saldo acumulado. Pelo teclado, a régua é um único ponto de parada (`tabindex=0`) e as setas ←/→ andam pelas colunas (Home/End vão às pontas); o balão acompanha, e o conteúdo dele é anunciado numa região `aria-live="polite"`. Sem movimento no dia, o balão diz "Sem movimento".
- **Períodos longos por dia** (mais de 92 colunas): as colunas afinam até 2px sem quebrar a régua; um aviso discreto acima dela oferece "Período longo: ver por mês", que muda o agrupamento.
- **Período todo sem movimento:** a régua mostra só a linha zero, com a mensagem central "Nenhuma entrada ou saída neste período."

**Composição: Entradas | Saídas (RF7).**
- Dois cartões lado a lado, cada um com título e total ("Entradas R$ 75.110,00").
- Dentro de cada um, grupos por **origem** na ordem: Estacionamento rotativo, Mensalidades, Lançamentos. Rotativo e Mensalidades são uma linha cada. Os lançamentos aparecem por **categoria pai**, com as subcategorias recuadas abaixo ("↳ Energia"), e o pai mostra a soma dos filhos mais o que foi lançado nele próprio. As linhas com categoria são as que têm `financeiroCategoriaId` na resposta, agrupadas pelo `financeiroCategoriaPaiId`.
- Cada linha: nome, valor alinhado à direita (`fontWeights.bold`, algarismos tabulares) e, abaixo, uma barra fina de proporção sobre o total do lado (`surfaceMuted` como trilho, `success` ou `danger` como preenchimento) com o percentual em `textMuted`. Linhas ordenadas por valor, da maior para a menor, dentro de cada origem.
- Lado sem valores: "Nenhuma saída no período." em `textMuted`, com o link "Lançar despesa" (abre o modal de lançamento já com o tipo Saída).
- **Linha de categoria clicável:** leva à aba Lançamentos filtrada por aquela categoria e pelo mesmo período (com as subcategorias, se for pai). Rotativo e Mensalidades não são clicáveis, porque não são lançamentos (o detalhe deles fica fora do escopo).

**Valores por dia/mês (tabela recolhível).** `Accordion` ou `<details>` "Ver valores por dia" ("…por mês" no agrupamento mensal), no padrão "Ver valores por hora" do Caixa. Usa `Table` com Data, Entradas, Saídas, Saldo e Acumulado (os quatro alinhados à direita, saldo negativo com "−" e `danger`). Mostra **todos** os períodos, inclusive os sem movimento (RF6), e os dias sem movimento ficam com o texto em `textMuted`. É a versão acessível e exata da régua.

**Nota de regra (RF5).** Rodapé discreto com o ícone de informação: "Sangria e suprimento não entram no fluxo: o dinheiro só muda de lugar. Lançamentos feitos pelo caixa contam uma vez só, como lançamento."

### 2.3 Estados

| Estado | Comportamento visual |
|--------|----------------------|
| Carregando (primeira vez) | `Skeleton` no formato dos blocos: herói (uma linha grande), régua (retângulo), dois cartões de composição; `role="status"` "Carregando fluxo de caixa". |
| Atualizando (troca de período/agrupamento) | Mantém os dados anteriores com opacidade reduzida e `aria-busy`; o herói não pisca. |
| Período inválido | Erros sob os campos; nada é buscado. |
| Sem movimento | Herói "R$ 0,00", régua só com a linha zero e mensagem, cartões com "Nenhuma entrada/saída no período." |
| Erro | `ErrorBanner role="alert"` + "Tentar novamente" (padrão `ErrorArea`). |
| Sem permissão (403) | `ErroSemPermissao`, sem tentar de novo. |

### 2.4 Celular (< `breakpoints.md`)

Uma coluna, na ordem: período, herói, régua, Entradas, Saídas, tabela, nota.
- **Período:** atalhos em linha com rolagem horizontal; as datas e o "Aplicar" ficam num `Accordion` "Personalizar período" (fechado), para o herói aparecer na primeira tela. "Ver por" fica à direita dos atalhos.
- **Herói:** valor em `fontSizes.xl`; entradas e saídas empilhadas.
- **Régua:** altura menor; com até 31 colunas, ocupa a largura. Com mais colunas, a régua tem rolagem horizontal própria e começa no fim (dias mais recentes), com sombra de borda indicando que há mais. O toque abre o balão, e o balão fica fixo acima da régua (não segue o dedo).
- **Composição:** os dois cartões empilhados, com Entradas primeiro.

## 3. Aba Lançamentos

### 3.1 Lista (RF9, RF10)

```
┌ Filtros ─────────────────────────────────────────────────────────┐
│ De [__] Até [__]   Tipo [Todos|Entradas|Saídas]   Categoria [▾]   ☐ Mostrar cancelados │
└──────────────────────────────────────────────────────────────────┘
 Data       Descrição                  Categoria             Forma      Valor
 22/10/2026 Conta de luz               Despesas › Energia    Pix     − R$ 450,00   ✎ ⋯
            Cia. Elétrica · NF 1234
 20/10/2026 Troco do cofre  [Pelo caixa] Outras receitas     Dinheiro + R$ 100,00  ✎ ⋯
 18/10/2026 Aluguel  [Cancelado]       Despesas › Aluguel    Boleto  − R$ 2.000,00 (riscado)
                      ‹ 1 2 3 ›
```

- **Filtros:** período com o mesmo componente de período (datas opcionais aqui, sem atalhos); Tipo como `OptionGroup` (Todos | Entradas | Saídas); Categoria como `Select` com as categorias agrupadas por tipo, filhas recuadas e uma opção "Todas", acompanhado da dica "Inclui as subcategorias" quando um pai está escolhido; "Mostrar cancelados" como `Switch`. Cada mudança reinicia na página 1. Escolher um tipo limita a lista de categorias àquele tipo. Botão "Limpar filtros" (`Button secondary` pequeno) quando houver algum filtro.
- **Colunas:** Data (do pagamento), Descrição (favorecido e documento em linha secundária `textMuted`, quando existirem), Categoria ("Pai › Filha"), Forma de pagamento, Valor (alinhado à direita, algarismos tabulares, com sinal **"+"/"−"** e cor `success`/`danger`) e Ações.
- **Selos:** "Pelo caixa" (`StatusBadge tone="info"`) junto à descrição; "Cancelado" (`tone="neutral"`), com a linha inteira em `textMuted` e o valor riscado (`text-decoration: line-through`), mantendo o texto "Cancelado" como sinal principal.
- **Ações por linha:** clicar na linha abre o detalhe. Ícones à direita: editar (✎) e cancelar (⊘), com rótulos acessíveis ("Editar lançamento Conta de luz"). Lançamento cancelado não tem ações (RF15).
- Paginação com `Pagination` (20 por página).

| Estado | Comportamento visual |
|--------|----------------------|
| Carregando | `Skeleton` em 8 linhas, `role="status"` "Carregando lançamentos". |
| Atualizando | Dados anteriores com opacidade reduzida e `aria-busy` (padrão `PrecosList`). |
| Vazio, sem nenhum lançamento | `EmptyState`: "Nenhum lançamento ainda." + "Novo lançamento". Sem categoria ativa, o texto vira "Crie uma categoria de receita ou despesa antes de lançar." e o botão leva à aba Categorias com o modal de nova categoria aberto. |
| Vazio dos filtros | "Nenhum lançamento com esses filtros." + "Limpar filtros". |
| Erro / 403 | Iguais aos da aba Fluxo. |

**Celular:** os filtros ficam num `Accordion` "Filtros" com a contagem dos ativos ("Filtros · 2"); a tabela vira cartões (padrão do `Table` com `data-label`), com descrição e valor em destaque na primeira linha, categoria e data na segunda e selos abaixo; as ações viram um botão "⋯" com alvo de 44px que abre Editar e Cancelar.

### 3.2 Detalhe do lançamento (RF13)

`Modal size="sm"`, título com a descrição. Lista de definição com Tipo, Categoria, Valor (com sinal e cor), Data do pagamento, Forma, Favorecido, Documento, Observação (campos vazios mostram "—"), "Lançado pelo caixa" (quando for o caso) e, se cancelado, "Cancelado por Fulano" com o selo "Cancelado". Rodapé com "Editar" (secondary) e "Cancelar lançamento" (`danger`, secundário), ou só "Fechar" quando o lançamento já está cancelado.

### 3.3 Novo / editar lançamento (RF11, RF12, RF14)

`Modal size="lg"`, em tela cheia no celular, com formulário em duas colunas a partir de `breakpoints.sm`.

| Campo | Componente | Observações |
|-------|------------|-------------|
| Tipo | `OptionGroup` **Entrada \| Saída** | Não é enviado: serve para filtrar as categorias e deixar claro o sentido do dinheiro. Abre em Saída por padrão (despesa é o caso mais comum) ou no tipo de quem chamou ("Lançar despesa"). Trocar o tipo limpa a categoria. Na edição, fica fixo (a categoria só muda dentro do mesmo tipo). |
| Categoria | `SelectField` | Só categorias ativas do tipo, agrupadas (pai e filhas recuadas; o pai também pode ser escolhido). Na edição, mantém a categoria atual mesmo inativa, marcada "(inativa)". Sem categorias do tipo: dica com o link "Criar categoria". |
| Descrição | `TextField` | Obrigatória. |
| Valor | `TextField` monetário (R$) | Maior que zero. |
| Data do pagamento | `TextField type="date"` | Padrão: hoje. Máximo: hoje; data futura mostra "Só é possível lançar o que já foi pago." |
| Forma de pagamento | `SelectField` | As mesmas formas e rótulos do caixa (`formaPagamentoLabel`). |
| Favorecido | `TextField` | Opcional. Rótulo "Pagou a / Recebido de" conforme o tipo. |
| Documento | `TextField` | Opcional (nota, boleto, recibo). |
| Observação | campo de texto de várias linhas | Opcional, em largura total. |
| Pelo caixa | `SwitchField` "Entrou/Saiu pela gaveta do caixa" | Só no cadastro. Explicado na seção 3.4. |

#### 3.4 "Pelo caixa"

- O switch só fica habilitado com forma **Dinheiro**, data **hoje** e **turno aberto**. Desabilitado, mostra uma dica com o motivo: "Só para pagamentos em dinheiro, com a data de hoje." ou "Abra o caixa para lançar pela gaveta." (sem turno aberto).
- Ligado, aparece um quadro informativo (estilo `InfoCard`) logo abaixo: "Vai aparecer no turno atual e entrar na conferência do caixa." Numa **saída**, o quadro mostra também "Disponível na gaveta: R$ X" (fundo do turno + dinheiro do turno). Se o valor digitado passar disso, o campo Valor mostra o erro "Maior que o dinheiro na gaveta (R$ X)." e o botão Salvar fica bloqueado. O servidor continua sendo a regra final; o erro dele aparece no `ErrorBanner` do modal.
- Mudar a forma ou a data depois de ligar o switch o desliga, com a dica do motivo.

**Edição de lançamento feito pelo caixa (RF14):** Valor, Data e Forma aparecem desabilitados, com o ícone de cadeado e a dica no topo do formulário (`InfoCard`): "Lançado pelo caixa: para mudar valor, data ou forma de pagamento, cancele e lance de novo." O botão "Cancelar lançamento" fica ali mesmo. Categoria (do mesmo tipo), descrição, favorecido, documento e observação seguem editáveis.

**Estados do modal** (padrão dos modais de Mensalistas): enviando (campos e botão desabilitados, "Salvando…"); erro de campo sob o campo, em `danger`; erro do servidor em `ErrorBanner role="alert"` no topo do corpo, com a mensagem da API em linguagem clara (RF19); sucesso fecha o modal e mostra o `Toast` "Lançamento salvo." / "Lançamento atualizado." e atualiza a lista **e** o fluxo. Fechar com dados preenchidos pede `ConfirmDialog` "Descartar alterações?".

### 3.5 Cancelar lançamento (RF15)

`ConfirmDialog` com tom de perigo: título "Cancelar lançamento?", texto "Conta de luz · − R$ 450,00. O lançamento fica no histórico como cancelado e sai do fluxo de caixa." e botões "Cancelar lançamento" (`danger`) e "Voltar".
- **Feito pelo caixa:** o texto acrescenta "R$ 450,00 voltam para a gaveta do caixa." (saída) ou "R$ 100,00 saem da gaveta do caixa." (entrada).
- Se o caixa daquele lançamento já foi fechado, a resposta da API aparece no diálogo ("O caixa deste lançamento já foi fechado.") e o botão de confirmar fica desabilitado.
- Sucesso: `Toast` "Lançamento cancelado." A lista e o fluxo são atualizados.

## 4. Aba Categorias (RF16 a RF18)

```
 Tipo [Todos|Receitas|Despesas]   Situação [Ativas ▾]
 RECEITAS
 Nome                        Situação
 Outras receitas             ● Ativa      ✎
   ↳ Venda de sucata         ● Ativa      ✎
 DESPESAS
 Despesas fixas              ● Ativa      ✎
   ↳ Aluguel                 ● Ativa      ✎
   ↳ Energia                 ○ Inativa    ✎
```

- Filtros: Tipo `OptionGroup` (Todos | Receitas | Despesas), Situação `Select` (Ativas, padrão | Inativas | Todas).
- Lista agrupada em duas seções com subtítulo: "Receitas" (tipo entrada) e "Despesas" (tipo saída), na ordem que a API devolve (pai seguido das filhas). As filhas ficam recuadas `space[4]`, com "↳" em `textMuted`; o pai em `fontWeights.semibold`. Situação com `StatusBadge` ("Ativa" `success` / "Inativa" `neutral`). Sem paginação.
- Estados: carregando (`Skeleton` em linhas), vazio ("Nenhuma categoria cadastrada." + "Nova categoria", com a dica "Ex.: Aluguel, Salários, Manutenção."), vazio do filtro, erro/403 como nas outras abas.
- **Celular:** cartões compactos; o recuo das filhas fica mantido (`space[3]`).

### 4.1 Nova / editar categoria

`Modal size="sm"`, uma coluna.

| Campo | Componente | Observações |
|-------|------------|-------------|
| Nome | `TextField` | Obrigatório. Nome repetido (entre as ativas) aparece como erro no campo. |
| Tipo | `OptionGroup` **Receita (entrada) \| Despesa (saída)** | Na edição, fica desabilitado com a dica "O tipo não muda depois de criado." Trocar o tipo no cadastro limpa a categoria pai. |
| Categoria pai | `SelectField` | Opcional: "Nenhuma (categoria principal)" + categorias ativas, do mesmo tipo e sem pai, excluindo a própria categoria. Fica desabilitado quando a categoria já agrupa outras, com a dica "Esta categoria agrupa outras e não pode virar subcategoria." |
| Ativa | `SwitchField` | Só na edição. Ao desligar: "Não recebe lançamentos novos. Os lançamentos antigos continuam valendo." |

Estados de enviar, erro, sucesso ("Categoria salva." / "Categoria atualizada.") e descarte iguais aos do modal de lançamento.

## 5. Componentes

**Reaproveitados:** `Tabs`, `Table`, `Pagination`, `Modal`, `ConfirmDialog`, `Button`, `Input`, `Select`, `Switch`, `OptionGroup`, `StatusBadge`, `Skeleton`, `ErrorBanner`, `ErroSemPermissao`, `InfoCard`, `Accordion`, `Card`, `Toast`, `Text`; campos de formulário (`TextField`, `SelectField`, `SwitchField`, `OptionField` via `useAppForm`); estilos de lista da `PrecosList`/Mensalistas (`Page`, `Header`, `EmptyState`, `ErrorArea`, `TableArea`); formatação de moeda e forma de pagamento de `components/caixa/format.ts`.

**Promovido a compartilhado:** filtro de período (`FiltroPeriodo` de Notas, hoje duplicado no Histórico de caixas), com obrigatoriedade, limite de dias e atalhos opcionais configuráveis. O local e o nome ficam para o Tech Spec.

**Novos da feature (em `src/components/financeiro`, nomes finais no Tech Spec):** `FinanceiroPage` (abas + cabeçalho), `FluxoCaixa` (período, `SaldoPeriodo`, `ReguaSaldo`, `ComposicaoFluxo`, tabela por período), `LancamentosLista`, `LancamentoModal`, `LancamentoDetalhe`, `CategoriasLista`, `CategoriaModal`.

**Nenhum componente novo em `ui`.** A `ReguaSaldo` é da feature. Se um segundo gráfico temporal aparecer em outra tela, vale extraí-la para o design system.

**Menu:** ícone novo `finance` no conjunto de ícones da navegação; item "Financeiro" em `nav.ts`.

## 6. Tokens usados

Nenhum token novo.
- Cores: `accent` (saldo do período e linha do acumulado), `success`/`danger` (entradas/saídas, sinais e barras), `dangerSoft` (área de saldo acumulado negativo), `surface`/`surfaceMuted` (cartões e trilhos das barras), `border` (linha zero, divisórias), `text`/`textMuted`, `primary`/`onPrimary` ("Novo lançamento"), `focus`.
- As cores `cliente.*` e `pagamento.*` **não** são usadas: origem e categoria se distinguem por nome e posição, não por cor; isso evita uma legenda de cores e mantém o sentido verde = entra, vermelho = sai.
- Tipografia: `typography.display` no saldo (em `fontSizes.xl` no celular), `fontSizes.sm` nas tabelas, nos eixos e nas linhas secundárias, `fontWeights.bold` nos valores, algarismos tabulares (`font-variant-numeric: tabular-nums`) em todo valor.
- Espaçamento: escala `space` (`space[3]`–`space[5]` entre blocos, `space[2]` dentro das linhas da composição); raios `radii.lg` nos cartões, `radii.full` nas barras de proporção.

## 7. Acessibilidade

- Herói lido como "Saldo do período, R$ 75.110,00, de 01/10/2026 a 31/10/2026"; sinal e palavra ("negativo") no texto acessível quando negativo.
- Régua com `role="img"` e um resumo no rótulo ("Saldo acumulado de R$ 0,00 a R$ 75.110,00; maior entrada em 22/10, R$ 32.800,00"); navegável por setas, com o balão anunciado em `aria-live`. A tabela recolhível é o conteúdo completo.
- Entradas/saídas nunca dependem só de cor: ícones ▲/▼, sinais +/− e rótulos.
- Barras de proporção `aria-hidden`, com o percentual em texto.
- Selos "Pelo caixa"/"Cancelado" com texto; o valor riscado do cancelado não é o único sinal.
- Abas com setas/Home/End (já no `Tabs`); modais mantêm foco e devolvem ao botão de origem; erros ligados aos campos por `aria-describedby`; o motivo de controles desabilitados (switch "pelo caixa", tipo, categoria pai) fica em texto visível ligado ao controle.
- Alvos de toque de 44px no celular; contraste AA nos dois temas (por isso `accent`, não `primary`, como texto).

## 8. Pontos em aberto (decidir no Tech Spec ou com o produto)

1. **"Lançar despesa" na tela do Caixa.** O design do Caixa (`caixa-layout`) tirou esse botão por falta de função. Com este módulo, ele poderia abrir o modal de lançamento com tipo Saída, forma Dinheiro e "pelo caixa" ligado. O PRD deixou mudanças no Caixa fora do escopo; fica a sugestão para uma entrega à parte.
2. **Saldo disponível na gaveta** para o aviso da saída "pelo caixa": confirmar no Tech Spec de onde vem (o cálculo de gaveta do Caixa já existe, `calcularGaveta`), e quais perfis do Financeiro podem consultar o turno atual (o perfil Financeiro não tem acesso à área Caixa hoje).
3. **Formas de pagamento aceitas no lançamento:** o input só confirma a forma 1 (Dinheiro). Validar no back se valem as mesmas formas do caixa (Pix, Crédito, Débito) ou outras (boleto, transferência), e ajustar o `SelectField`.
4. **"Cancelado por"** no detalhe: confirmar o nome do campo na resposta de `GET /Financeiro/lancamento/{id}` ao validar os endpoints.
