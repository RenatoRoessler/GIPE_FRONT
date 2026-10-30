# Tech Spec: Módulo Financeiro

**Status:** Rascunho
**Data:** 2026-10-30
**PRD:** ./prd.md
**Design:** ./design.md

> Convenções do projeto (`CLAUDE.md`): Next.js App Router + TypeScript + styled-components; tipos em `src/types`, serviços em `src/lib/api/services`, schemas Zod em `src/lib/schemas`, componentes em `src/components/<feature>`, testes Vitest ao lado do código. Padrões de referência: Mensalistas (abas na URL, modais com `useAppForm`, React Query) e Caixa (`GraficosCaixa` feito à mão, `calcularGaveta`).

## Referências
- PRD: ./prd.md (RF1 a RF19)
- Design: ./design.md (Régua do saldo; abas em `/financeiro`; formulários em modal)
- Contrato: `docs/specs/input.md` e Swagger do back (`/swagger/v1/swagger.json`), conferidos em 30/10/2026 (ver "Validação no back").

## Design
- **Telas/estados:** como em `design.md`. São três abas (Fluxo de caixa, Lançamentos e Categorias) e cada uma tem os estados carregando, atualizando, vazio, vazio por filtro, erro e 403. Há quatro modais: lançamento (cadastro e edição), detalhe do lançamento, categoria (cadastro e edição) e confirmação de cancelamento.
- **Componentes do design system reaproveitados:** `Tabs`, `Table`, `Pagination`, `Modal`, `ConfirmDialog`, `Button`, `Input`, `Select`, `Switch`, `OptionGroup`, `StatusBadge`, `Skeleton`, `ErrorBanner`, `InfoCard`, `Accordion`, `Card`, `Toast`, `Text`. Também os campos de `src/components/form` (`TextField`, `SelectField`, `SwitchField`, `OptionField`, via `useAppForm`) e `ErroSemPermissao`.
- **Componente promovido:** `FiltroPeriodo` (hoje em `components/notas`) vai para `src/components/ui/FiltroPeriodo`, com props de obrigatoriedade, limite de dias e atalhos.
- **Componentes novos:** os da feature ficam em `src/components/financeiro` (lista na Arquitetura). Ícone `finance` em `NavIcons` e `BottomBarIcons`.
- **Tokens:** nenhum novo. São usados `accent`, `success`, `danger`, `dangerSoft`, `surface`, `surfaceMuted`, `border`, `text`, `textMuted`, `primary`, `focus`, além da escala `space`/`fontSizes`/`radii` e de `typography.display`.

## Validação no back (30/10/2026, `localhost:5000`)

| Verificação | Resultado |
|---|---|
| `GET /Financeiro/fluxo` (mês, dia, período curto) | 200; formato igual ao do input. Valores em **reais** (decimal: `75110.00`), não em centavos. Datas `AAAA-MM-DD`. |
| Fluxo > 366 dias / início > fim / sem data | 400 `BUSINESS_ERROR` com `detail` legível ("O período do fluxo de caixa pode ter no máximo 366 dias.", "A data inicial não pode ser maior que a data final.", "Informe a data inicial e a data final."). |
| Datas no formato `01/10/2026` | **Interpretadas como MM/dd** (o exemplo do input virou 10/01/2026). Enviar sempre `AAAA-MM-DD`. |
| `GET /Financeiro/lancamento/999` | 404 `NOT_FOUND`, "Lançamento não encontrado." |
| `GET /Financeiro/categoria`, `GET /Financeiro/lancamento` | 200, vazios na empresa de teste (formato do item **não confirmado**). |
| `tamanhoPagina=500` | O back limita a 100 (`pageSize: 100`). |
| Swagger | Cancelar é **`PUT /lancamento/{id}/cancelar`** sem corpo. `EFormaPagamento` 1 a 6 (Dinheiro, Pix, Débito, Crédito, Boleto, Transferência), igual a `FORMA_PAGAMENTO`. Os DTOs de resposta não estão no Swagger. |
| POST/PUT (cadastros de teste) | **Não executados**: o modo de permissão bloqueou as escritas. A task 1 faz essa validação (ver Riscos). |

## Arquitetura da solução

### Arquivos

```
src/
├── app/(app)/financeiro/page.tsx            # Server: metadata + <Suspense><FinanceiroPage/></Suspense>
├── types/financeiro.ts                      # enums, DTOs, form values
├── lib/
│   ├── periodo.ts                           # (novo) datas AAAA-MM-DD, atalhos, validação com limite de dias
│   ├── periodoNotas.ts                      # passa a reexportar de periodo.ts (sem mudança de comportamento)
│   ├── permissoes.ts                        # + AREA.Financeiro, padrão, rota /financeiro
│   ├── nav.ts                               # + item "Financeiro", NavIconId "finance"
│   ├── schemas/financeiro.ts                # Zod: lançamento, categoria
│   └── api/services/
│       ├── financeiro.ts                    # chamadas HTTP
│       └── financeiro.mapper.ts             # DTO ⇄ tipos; form ⇄ payload
├── components/
│   ├── ui/FiltroPeriodo/                    # promovido de components/notas (FiltroPeriodo.tsx, .styles.ts, index.ts)
│   ├── layout/NavIcons/NavIcons.tsx         # + FinanceIcon
│   ├── layout/BottomNav/BottomBarIcons.tsx  # + finance
│   ├── notas/…                              # passa a importar ui/FiltroPeriodo
│   └── financeiro/
│       ├── url.ts                           # parse/serialize de aba e filtros na query string
│       ├── format.ts                        # valor com sinal, "Pai › Filha", rótulo de mês, tipo
│       ├── composicao.ts                    # categorias do fluxo → árvore entradas/saídas
│       ├── regua.ts                         # escala, marcas do eixo, pontos da linha, abreviação
│       ├── categorias.ts                    # árvore de categorias, opções de select, pais elegíveis
│       ├── pelaGaveta.ts                    # regra de habilitação do "pelo caixa" e disponível
│       ├── queryKeys.ts
│       ├── useFluxo.ts · useLancamentos.ts · useLancamento.ts · useCategorias.ts
│       ├── useLancamentoMutations.ts · useCategoriaMutations.ts
│       ├── Financeiro.styles.ts             # Page, Header, Toolbar, EmptyState, ErrorArea, TableArea
│       ├── FinanceiroPage/                  # cabeçalho, Tabs, ação do cabeçalho, Toast, modal aberto
│       ├── FluxoCaixa/                      # período + blocos
│       ├── SaldoPeriodo/                    # herói
│       ├── ReguaSaldo/                      # gráfico, balão, teclado
│       ├── ComposicaoFluxo/                 # cartões Entradas | Saídas
│       ├── TabelaPeriodos/                  # tabela recolhível
│       ├── LancamentosLista/                # filtros + tabela + paginação
│       ├── LancamentoModal/                 # cadastro/edição
│       ├── LancamentoDetalhe/
│       ├── CancelarLancamentoDialog/
│       ├── CategoriasLista/
│       └── CategoriaModal/
```

### Tipos (`src/types/financeiro.ts`)

```ts
export const TIPO_LANCAMENTO = { Entrada: 1, Saida: 2 } as const;          // ETipoLancamentoFinanceiro
export type TipoLancamento = (typeof TIPO_LANCAMENTO)[keyof typeof TIPO_LANCAMENTO];

export const AGRUPAMENTO_FLUXO = { Dia: 1, Mes: 2 } as const;              // EAgrupamentoFluxoCaixa
export type AgrupamentoFluxo = (typeof AGRUPAMENTO_FLUXO)[keyof typeof AGRUPAMENTO_FLUXO];

export const ORIGEM_FLUXO = { Rotativo: 1, Mensalidades: 2, Lancamento: 3 } as const;
export type OrigemFluxo = number;                                          // tolera origens novas

// GET /Financeiro/fluxo (confirmado)
export type FluxoCategoria = {
  origem: OrigemFluxo; tipo: TipoLancamento;
  financeiroCategoriaId: number | null; categoria: string;
  financeiroCategoriaPaiId: number | null; categoriaPai: string | null;
  valor: number;
};
export type FluxoPeriodo = { data: string; entradas: number; saidas: number; saldo: number; saldoAcumulado: number };
export type FluxoCaixa = {
  dataInicio: string; dataFim: string; agrupamento: AgrupamentoFluxo;
  totalEntradas: number; totalSaidas: number; saldo: number;
  categorias: FluxoCategoria[]; periodos: FluxoPeriodo[];
};

// GET /Financeiro/categoria — [A CONFIRMAR] nomes da resposta (supostos a partir do request e do fluxo)
export type FinanceiroCategoria = {
  financeiroCategoriaId: number; nome: string; tipo: TipoLancamento;
  financeiroCategoriaPaiId: number | null; categoriaPai: string | null; ativo: boolean;
};
export type CategoriaPayload = { nome: string; tipo: TipoLancamento; financeiroCategoriaPaiId: number | null; ativo: boolean };

// GET /Financeiro/lancamento(/{id}) — [A CONFIRMAR] nomes da resposta
export type Lancamento = {
  financeiroLancamentoId: number;
  financeiroCategoriaId: number; categoria: string; categoriaPai: string | null;
  tipo: TipoLancamento;
  descricao: string; valor: number; dataPagamento: string;               // AAAA-MM-DD (ou ISO; o mapper corta)
  formaPagamento: FormaPagamentoId;
  favorecido: string | null; documento: string | null; observacao: string | null;
  peloCaixa: boolean;
  cancelado: boolean; canceladoPor: string | null; dataCancelamento: string | null;
};
export type LancamentoPayload = {
  financeiroCategoriaId: number; descricao: string; valor: number;
  dataPagamento: string | null; formaPagamento: FormaPagamentoId;
  favorecido: string | null; documento: string | null; observacao: string | null;
  peloCaixa: boolean;
};
export type LancamentoFiltros = {
  de?: string; ate?: string; tipo?: TipoLancamento; financeiroCategoriaId?: number;
  incluirCancelados: boolean; pagina: number;
};

// Formulários (strings, como os campos)
export type LancamentoFormValues = {
  tipo: string; financeiroCategoriaId: string; descricao: string; valor: string;
  dataPagamento: string; formaPagamento: string;
  favorecido: string; documento: string; observacao: string; peloCaixa: boolean;
};
export type CategoriaFormValues = { nome: string; tipo: string; financeiroCategoriaPaiId: string; ativo: boolean };
```

`Paginado<T>` (`src/lib/api/types.ts`) e `FormaPagamentoId`/`FORMA_PAGAMENTO_OPTIONS` (`src/types/caixa.ts`) são reaproveitados.

### Serviço (`src/lib/api/services/financeiro.ts`)

```ts
getFluxo(p: { dataInicio: string; dataFim: string; agrupamento: AgrupamentoFluxo }): Promise<FluxoCaixa>
listLancamentos(f: LancamentoFiltros, tamanhoPagina = 20): Promise<Paginado<Lancamento>>
getLancamento(id: number): Promise<Lancamento>
createLancamento(v: LancamentoFormValues): Promise<{ financeiroLancamentoId: number } | void>
updateLancamento(id: number, v: LancamentoFormValues, atual: Lancamento): Promise<void>
cancelarLancamento(id: number): Promise<void>                // PUT /lancamento/{id}/cancelar, sem corpo
listCategorias(): Promise<FinanceiroCategoria[]>             // sem filtros: tudo, filtrado no cliente
createCategoria(v: CategoriaFormValues): Promise<void>
updateCategoria(id: number, v: CategoriaFormValues): Promise<void>
```

Regras do mapper:
- **Datas:** sempre `AAAA-MM-DD` na query e no corpo. Na leitura, as datas são cortadas em 10 caracteres, para tolerar ISO com hora.
- **Valores:** chegam como `number` em reais. Na leitura, o mapper usa `Number(x) || 0`, para nunca gerar `NaN` na tela (como no Caixa).
- **Leitura tolerante:** as respostas chegam como `Partial<…>`, com `?? null`. A situação de cancelado aceita `cancelado`, e o autor do cancelamento aceita `canceladoPor`, `usuarioCancelamento` ou `nomeUsuarioCancelamento` (o primeiro texto encontrado). O tipo vem de `tipo` e, se faltar, do tipo da categoria na lista de categorias.
- **Payload do lançamento:** valor via `parseMoney`, `formaPagamento` como `Number`, opcionais vazios viram `null`, data vazia vira `null` (o back entende como hoje). `peloCaixa` só é `true` no cadastro.
- **Edição de lançamento feito pelo caixa:** o mapper reenvia `valor`, `dataPagamento` e `formaPagamento` **do lançamento atual** (o parâmetro `atual`), nunca os do formulário. O `PUT` exige o corpo completo, e o back recusa a mudança desses campos.
- **Payload da categoria:** pai vazio vira `null`. Na edição, o tipo é o atual.

### Schemas (`src/lib/schemas/financeiro.ts`)

- **Lançamento:**
  - Categoria obrigatória.
  - Descrição obrigatória, até 200 caracteres `[A CONFIRMAR]`.
  - Valor maior que zero (`parseMoney`).
  - Data obrigatória e no máximo hoje: "Só é possível lançar o que já foi pago."
  - Forma obrigatória (reaproveita a validação de `schemas/pagamento.ts`).
  - `peloCaixa` só com forma 1 e data igual a hoje (`superRefine`).
  - A checagem "valor maior que o disponível na gaveta" é feita no componente, porque depende do turno carregado. Ela fica num `pelaGaveta.ts` puro e testado, não no schema.
- **Categoria:** nome obrigatório e aparado, até 100 caracteres `[A CONFIRMAR]`; tipo 1 ou 2.

### Permissões e navegação

- `permissoes.ts`:
  - `AREA.Financeiro = "financeiro"`;
  - `PERMISSOES_PADRAO[AREA.Financeiro] = [Administrador, Gerente, Financeiro]`;
  - `["/financeiro", AREA.Financeiro]` em `AREA_POR_ROTA`.
- O `proxy`/guarda de rota existente nega o acesso direto (RF1), sem código novo.
- `PermissoesPorModulo` aceita a área nova automaticamente (RF2). Hoje nenhuma tela do front alimenta os overrides; ver Riscos.
- `nav.ts`: `{ label: "Financeiro", shortLabel: "Financeiro", href: "/financeiro", icon: "finance", area: AREA.Financeiro }` depois de "Notas Fiscais". O `"finance"` entra em `NavIconId`, mas não em `BAR_PRIORITY`.
- Atualizar os testes de `permissoes.test.ts`, `nav.test.ts` e `BottomNav.test.tsx`, que enumeram as áreas e os itens.

### Server vs Client

| Peça | Tipo | Motivo |
|---|---|---|
| `app/(app)/financeiro/page.tsx` | Server | `metadata` ("Financeiro — Murel"); envolve o conteúdo em `Suspense` por causa de `useSearchParams`. |
| `FinanceiroPage` e todo o resto de `components/financeiro` | Client | Estado de URL, React Query, interação (régua, modais). |
| Funções puras (`url`, `format`, `composicao`, `regua`, `categorias`, `pelaGaveta`, `periodo`) | Neutras | Testáveis sem DOM. |

### Estado e dados

- **React Query.** Chaves em `queryKeys.ts`, todas abaixo de `["financeiro"]`:
  - `["financeiro","fluxo",{de,ate,agrupamento}]`;
  - `["financeiro","lancamentos",filtros]`;
  - `["financeiro","lancamento",id]`;
  - `["financeiro","categorias"]`.
- **Fluxo e lista:** `placeholderData: keepPreviousData`, para o estado "atualizando" sem piscar. `refetchOnWindowFocus: false`, como nas demais telas.
- **Categorias:** uma consulta só, com tudo. Ela alimenta a aba, os selects e o filtro, e os filtros de tipo e situação são aplicados no cliente. O volume esperado é pequeno.
- **Mutations:**
  - Lançamento (criar, editar ou cancelar) invalida `["financeiro"]` inteiro: lista, fluxo e detalhe.
  - Se o lançamento for **pelo caixa**, invalida também `CAIXA_KEY` (`["caixa"]`), porque o movimento entra no turno.
  - Categoria invalida `["financeiro"]`, porque os nomes aparecem no fluxo e na lista.
- **URL** (`url.ts`, padrão de `mensalistas/aba.ts`):
  - Parâmetros: `aba` (`fluxo` padrão, `lancamentos`, `categorias`), `de`, `ate`, `ver` (`dia`|`mes`), `tipo` (`entrada`|`saida`), `categoria` (id), `cancelados` (`1`) e `pagina`.
  - Valor inválido cai no padrão.
  - O fluxo sem `de`/`ate` usa o mês atual: do dia 1 ao **último dia** do mês (RF8). É diferente de `mesAtual` de Notas, que vai até hoje. Por isso existe a nova `mesCorrente(hoje)` em `periodo.ts`.
  - As abas Fluxo e Lançamentos usam os mesmos `de`/`ate`? **Não.** Os nomes ficam separados por aba (`de`/`ate` no fluxo; `lde`/`late` nos lançamentos), para trocar de aba não mudar o filtro da outra. O link da composição (Fluxo → Lançamentos) monta `?aba=lancamentos&lde=…&late=…&categoria=…`.
  - Trocar filtro volta para `pagina` 1. Página fora do intervalo segue a mesma lógica da `PrecosList`.
- **Modal aberto:** estado local em `FinanceiroPage`, com o formato `{ tipo: "lancamento"; id?; tipoInicial? } | { tipo: "detalhe"; id } | { tipo: "categoria"; item? } | { tipo: "cancelar"; lancamento }`. O `Toast` também fica ali.

### "Pelo caixa" (`pelaGaveta.ts` + `LancamentoModal`)

- O turno vem de `useQuery([...CAIXA_KEY,"turno"], getTurnoAtual)`, a mesma chave do Caixa. Só é consultado enquanto o modal de cadastro está aberto.
- `estadoPelaGaveta({ forma, data, hoje, turno, turnoErro })` devolve `{ habilitado, motivo?, disponivel: number | null }`:
  - forma diferente de Dinheiro ou data diferente de hoje: desabilitado, "Só para pagamentos em dinheiro, com a data de hoje.";
  - turno `null` (404 = sem turno) ou turno fechado (`isTurnoAberto`): desabilitado, "Abra o caixa para lançar pela gaveta.";
  - turno com **erro 403** (o perfil Financeiro não tem a área Caixa no front): habilitado, `disponivel: null`, e o aviso "O caixa confere o valor ao salvar." A regra final é do back.
  - ok: habilitado, `disponivel = calcularGaveta(turno).naGaveta` (fundo do turno + dinheiro esperado, a mesma conta descrita no contrato).
- Numa saída com `disponivel !== null` e valor maior que ele: erro no campo Valor e envio bloqueado.
- Mudar a forma ou a data com o switch ligado desliga o switch, com `form.setFieldValue`.

### Fluxo: transformação e régua

- `composicao.ts`: `montarComposicao(categorias)` devolve `{ entradas: Grupo[]; saidas: Grupo[] }`.
  - Na ordem: Rotativo, Mensalidades, Lançamentos.
  - Nos lançamentos, agrupa por `financeiroCategoriaPaiId ?? financeiroCategoriaId`. O total do pai é o valor dele mais o das filhas. Se só as filhas tiverem valor, o pai é criado a partir de `categoriaPai`.
  - Ordena por valor (decrescente) e calcula o percentual sobre o total do lado. Linhas com valor 0 são omitidas.
- `regua.ts`:
  - `escala(periodos)` dá o mínimo e o máximo considerando entradas, −saídas e o acumulado.
  - `marcasEixoX(periodos, agrupamento)`: a cada 5 dias quando são até 31 pontos; no dia 1 de cada mês nos períodos longos; todos os meses no agrupamento mensal.
  - `pontosAcumulado` dá as coordenadas em porcentagem para o `points` do SVG (`viewBox="0 0 100 100"`, `preserveAspectRatio="none"`, `vector-effect: non-scaling-stroke`).
  - `abreviar(valor)` produz "R$ 75 mil" (via `Intl.NumberFormat` com `notation: "compact"`).
- `ReguaSaldo`:
  - As colunas são `div`s em flex (como `GraficosCaixa`) e a linha é um SVG sobreposto.
  - O índice ativo fica em estado local. Mouse, toque e foco o alteram. A régua tem `tabIndex=0`, e o teclado responde a ←/→/Home/End.
  - O balão é posicionado pelo índice. Há uma região `aria-live="polite"` com o texto do ponto ativo e `role="img"` com o resumo.
  - Com mais de 92 pontos, aparece o aviso "Período longo: ver por mês".
  - No celular, com mais de 31 pontos, a régua ganha largura mínima por coluna e rolagem horizontal, com `scrollLeft` no fim depois do primeiro render.
- O rótulo do mês usa a data `AAAA-MM-01` formatada com `Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" })`, criada com `new Date(ano, mes-1, 1)` local, para não sofrer o deslocamento de UTC.

### Promoção do `FiltroPeriodo`

- A pasta muda de `components/notas/FiltroPeriodo` para `components/ui/FiltroPeriodo`, com estilos próprios (hoje vêm de `Notas.styles`).
- Novas props: `obrigatorio?: boolean` (padrão `true`, que é o comportamento atual), `maxDias?: number`, `atalhos?: { id; label; periodo }[]` e `atalhoAtivo?`.
- A validação vai para `lib/periodo.ts` (`validarPeriodo(periodo, { obrigatorio, maxDias })`), com as mensagens do design. `periodoNotas.ts` reexporta `formatDataInput`, `mesAtual` e `validarPeriodo` com as opções atuais, para Notas não mudar.
- O filtro do Histórico de caixas **não** é migrado nesta entrega (ver Fora de escopo).

## Decisões técnicas e trade-offs

| Decisão | Alternativa | Motivo |
|---|---|---|
| Uma rota `/financeiro` com abas e filtros na URL | Três rotas | Escolha do usuário no design; link do fluxo para os lançamentos; voltar e recarregar mantêm a vista. |
| Filtros de período separados por aba (`de/ate` × `lde/late`) | Período compartilhado | No fluxo o período é obrigatório; nos lançamentos é opcional. Compartilhar faria a troca de aba mudar o que a outra mostra. |
| Gráfico à mão (CSS + SVG mínimo) | Biblioteca (Recharts etc.) | Padrão do `GraficosCaixa`, sem dependência nova; a régua é simples (colunas + uma linha). |
| Categorias numa consulta só, filtradas no cliente | Consultar com `tipo`/`ativo` | A mesma lista serve à aba, aos selects e ao filtro; o volume é pequeno; evita várias chaves de cache. |
| Disponível na gaveta calculado com `calcularGaveta` | Pedir um campo ao back | Já existe e segue a regra do contrato; o back é a validação final. |
| 403 no turno não bloqueia o "pelo caixa" | Desabilitar | O perfil Financeiro pode não ver o turno no front e ainda assim o back aceitar; bloquear impediria um uso legítimo. |
| Edição pelo caixa reenvia valor, data e forma atuais | Enviar o formulário | O `PUT` exige o corpo completo; os campos ficam travados na tela e o back recusa a mudança. |
| `FiltroPeriodo` em `ui` | Copiar na feature | Seria a terceira cópia; a skill `claude-design` pede componentes reaproveitáveis em `ui`. |
| Detalhe/edição com `GET /lancamento/{id}` | Usar o item da lista | O endpoint existe; garante dados atuais (cancelamento por outra pessoa). |

## Estratégia de testes (Vitest, padrão do repositório)

| Alvo | O que testar |
|---|---|
| `lib/periodo.ts` | Mês corrente (incluindo fevereiro e ano bissexto), atalhos, limite de 366 dias, ordem das datas, modo opcional. |
| `financeiro.mapper.ts` | Datas cortadas, valores sem `NaN`, nomes alternativos de "cancelado por", opcionais vazios → `null`, edição pelo caixa reenviando os campos atuais. |
| `financeiro.ts` (serviço) | Query string (`AAAA-MM-DD`, só filtros preenchidos), `PUT …/cancelar`. |
| `schemas/financeiro.ts` | Data futura, valor zero, `peloCaixa` com Pix ou com data diferente de hoje. |
| `composicao.ts`, `regua.ts`, `categorias.ts`, `pelaGaveta.ts`, `url.ts` | Funções puras: pai sem valor próprio, percentuais, escala com negativos, marcas do eixo, pais elegíveis, cada motivo do "pelo caixa", parse com valores inválidos. |
| Componentes | `ReguaSaldo` (teclado, `aria-live`), `LancamentoModal` (switch, travas na edição pelo caixa, erro do servidor), `FinanceiroPage` (aba pela URL), `FiltroPeriodo` (Notas continua igual). |
| Permissões/nav | Área e item novos nos testes que enumeram tudo. |

Antes de concluir cada task: `npm run lint`, `npm test` e, na última, `npm run build`.

## Riscos / pontos de atenção

| Risco | Mitigação |
|---|---|
| **Formato das respostas de categoria e lançamento não confirmado** (o back estava vazio e as escritas de teste foram bloqueadas) | A task 1 cadastra no back, com sua autorização, uma categoria pai, uma filha e um lançamento comum. Se houver turno aberto, também um lançamento pelo caixa de R$ 1,00, depois cancelado. Ela confere os nomes reais e ajusta tipos e mapper antes da UI. O mapper é tolerante até lá. |
| Datas `dd/MM/aaaa` lidas como `MM/dd` pelo back | Enviar sempre `AAAA-MM-DD`; teste do serviço cobre. |
| Perfil Financeiro sem acesso a `/Caixa/turno` | 403 tratado como "sem informação" (switch habilitado, sem disponível). Confirmar com um usuário Financeiro na QA. |
| RF2 (permissão por módulo): a área existe no front, mas a tela de permissões por módulo e o carregamento dos overrides não existem hoje | A área nova já entra no mapa padrão e no tipo `PermissoesPorModulo`. Se a configuração de módulos é feita no back, confirmar que "financeiro" está entre os módulos de lá. |
| Régua com 366 colunas no celular | Largura mínima por coluna + rolagem horizontal; aviso para ver por mês. |
| Fuso nas datas (`new Date("2026-10-01")` = UTC) | Construir datas locais por partes; testes com fuso de São Paulo. |
| Mensagens do back genéricas | Mostrar `ApiError.message` (`detail`) no `ErrorBanner`; erro de nome repetido no campo quando a mensagem citar "já existe" (heurística já usada em Mensalistas). |
| Token real em `docs/specs/input.md` | Não copiar para código ou specs; não commitar o input com o token. |

## Fora de escopo técnico

- Migrar o filtro do Histórico de caixas para o `FiltroPeriodo` compartilhado (fica para um refactor à parte).
- O botão "Lançar despesa" na tela do Caixa (design, seção 8.1).
- Tela de permissões por módulo e carregamento de overrides no front.
- Biblioteca de gráficos, exportação e impressão.
- Detalhe dos pagamentos de rotativo e de mensalidades a partir do fluxo.
