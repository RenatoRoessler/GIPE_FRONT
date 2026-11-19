# Tech Spec: Dashboard — Visão Geral do Administrador

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só mapeia a decisão para código)
- Layout: ./referencia-layout.html (proposta visual com dados fictícios; a lógica de exibição do script dela vale como referência de comportamento, os cálculos não)
- Contrato da API: `docs/specs/input.md` (`GET /api/v1/Dashboard`, regras e resposta de exemplo)

## Design
- **Telas/estados**: `/dashboard` redesenhada nos blocos do `design.md` (cabeçalho, faturamento, pátio agora, indicadores, faturamento por dia, pendências, origem, recebimento, por categoria e por hora). Estados: carregando, trocando de período, erro, empresa nova, período fechado e campos nulos.
- **Componentes do design system reaproveitados** (`src/components/ui`): `Tabs` (`variant="segmentada"`), `ProgressBar`, `StatusBadge` (`neutral`), `Skeleton`, `InlineNotice`, `Text`, `Link`. Também `useMediaQuery` e `useAgora` (`src/hooks`), `formatBRL` (`src/lib/money.ts`), `formatarMinutos` (`src/components/patio/patio.ts`) e `hrefDoTicket` (`src/components/patio/patioUrl.ts`).
- **Componentes novos**: todos em `src/components/dashboard` (domínio), nenhum em `ui`. Lista e responsabilidades na seção 6.
- **Tokens de tema**: novos `successSoft`, `caution`, `cautionSoft`, `info`, `infoSoft` em `ThemeColors` (claro e escuro, valores do `design.md`). O resto usa os tokens existentes.

## Arquitetura da solução

### 1. Tipos — `src/types/dashboard.ts` (novo)
Espelha a resposta de `GET /Dashboard` já normalizada pelo mapper. Datas como `string` ISO sem fuso (padrão do repositório, ex.: `types/caixa.ts`); o que pode ser nulo é `| null` explícito, nunca opcional.

```ts
export const PERIODO_DASHBOARD = { Dia: 1, Semana: 2, Mes: 3 } as const;
export type PeriodoDashboard = (typeof PERIODO_DASHBOARD)[keyof typeof PERIODO_DASHBOARD];

export type ValorQuantidade = { quantidade: number; valor: number };
export type Comparacao = { inicio: string; fim: string; faturamento: number; variacaoPercentual: number | null };
export type OrigemValores = { avulso: number; mensalista: number; convenio: number; lavaRapido: number };

export type Dashboard = {
  dataReferencia: string;
  inicioUso: string | null;
  periodo: {
    tipo: PeriodoDashboard; inicio: string; fim: string; fechado: boolean; faturamento: number;
    comparacao: Comparacao | null; saidas: number; ticketMedio: number | null; permanenciaMediaMinutos: number | null;
  };
  mes: {
    referencia: string; fechado: boolean; faturado: number; diasDeUso: number; diasNoMes: number; mediaPorDia: number | null;
    comparacaoMesAnterior: Comparacao | null; projecao: number | null;
    fechamentoMesAnterior: number | null; melhorDia: { data: string; faturamento: number } | null;
  };
  patio: { ocupados: number; capacidade: number; carros: Ocupacao; motos: Ocupacao; avulsos: number; mensalistas: number } | null;
  alertas: {
    mensalistasInadimplentes: ValorQuantidade | null;
    mensalidadesAVencer: ValorQuantidade | null;
    faturasConveniadaAbertas: ValorQuantidade | null;
    caixasComDiferenca: { quantidade: number; valor: number } | null;
    veiculosParados: { quantidade: number; horasMinimas: number; maisAntigo: { idPatio: number; placa: string; permanenciaMinutos: number } } | null;
  } | null;
  faturamentoDiario: ((OrigemValores & { data: string }) | null)[];
  origem: { [K in keyof OrigemValores]: number | null };
  recebimento: { formaPagamento: number; descricao: string; valor: number }[];
  categorias: { categoria: string; saidas: number; valor: number }[];
  movimentoPorHora: {
    media: boolean;
    horas: ({ hora: number; veiculos: number; entradas: number } | null)[];
    maiorMovimento: FaixaMovimento | null; menorMovimento: FaixaMovimento | null;
  } | null;
};
```

`Ocupacao = { ocupados: number; capacidade: number }` e `FaixaMovimento = { inicio: number; fim: number; veiculosMedia: number }`.

**Formatos ainda não vistos na resposta de exemplo** (vieram nulos ou vazios): `mes.comparacaoMesAnterior`, `mes.fechamentoMesAnterior`, `mes.melhorDia`, `alertas.mensalidadesAVencer`, `alertas.caixasComDiferenca` e o item de `categorias`. Os formatos acima são suposições. Elas ficam só neste arquivo e no mapper, para o ajuste ser local quando a API for conferida (ver Riscos).

### 2. Contrato com a API — `src/lib/api/services/dashboard.ts` + `dashboard.mapper.ts` (novos)
- `getDashboard(params: { periodo: PeriodoDashboard; data?: string }): Promise<Dashboard>` faz `api.get("/Dashboard", { params })`, com `data` em `yyyy-MM-dd` e omitida quando for hoje.
- `fromDashboardResponse(dto)` no mapper, com DTO tolerante como os demais `*.mapper.ts` (usar `mapperUtils.ts`):
  - Número ausente vira `0` só onde a regra diz "sempre tem valor" (`faturamento`, `saidas`, `faturado`, `diasDeUso`, `ocupados`). Onde nulo significa "não se aplica", fica `null`. Nunca `undefined`: viraria `NaN` na tela (lição de `caixa.ts`).
  - `faturamentoDiario` preserva os `null` e as posições. `horas` é normalizado para 24 posições.
  - `recebimento` e `categorias` são filtrados para `valor > 0`, por defesa, já que a API promete trazer só linhas com valor.
- Erros: 400 (data futura) e 403 sobem como `ApiError` (`kind` `validation` / `forbidden`).
- Fixture `src/lib/api/services/dashboard.fixture.ts` com a resposta de exemplo do input, usada nos testes do mapper e dos componentes.

### 3. Período e URL — `src/components/dashboard/periodo.ts` + `url.ts` (novos, puros)
- **Endereço**: `/dashboard?periodo=semana&data=2026-11-10`. `periodo` aceita `dia` | `semana` | `mes` (padrão `dia`) e `data` aceita `AAAA-MM-DD` (padrão hoje). Só o que difere do padrão vai para a URL, como em `financeiro/url.ts`. `lerFiltros(params, hoje)` corrige valores inválidos e **data futura para hoje**: a API devolveria 400.
- **Funções de período** (todas recebem `hoje: Date`, sem `new Date()` dentro, para teste determinístico):
  - `limitesDoPeriodo(tipo, data)`: dia; segunda a domingo; mês.
  - `deslocar(tipo, data, ±1)`: ±1 dia, ±7 dias ou mês anterior/seguinte. No mês, usa o dia 1, para não pular meses curtos.
  - `ehPeriodoAtual(tipo, data, hoje)`: decide a seta › e o "Voltar para hoje".
  - `podeVoltar(tipo, data, inicioUso)`: `false` quando o período contém o início do uso, ou quando `inicioUso` é nulo.
  - `rotuloDoPeriodo(tipo, data, hoje)`: os formatos do `design.md` ("Hoje · 19 nov", "Esta semana · 16 – 22 nov", "Outubro 2026"…).
- A troca de período usa `router.replace(url, { scroll: false })`, para não empilhar histórico a cada seta. Ao trocar o tipo, a `data` sai da URL (volta para hoje).

### 4. Regras de apresentação — `src/components/dashboard/apresentacao.ts` + `format.ts` (novos, puros)
Toda decisão de "o que mostrar" sai dos componentes e fica testável:
- `saudacao(hora)` e `primeiroNome(nome)`.
- `textoComparacao(dashboard)`: "vs. quinta passada" / "vs. mesmo ponto da semana passada" / "vs. semana anterior" / "vs. out até dia 19" / "vs. outubro". Devolve `null` sem `comparacao` ou sem `variacaoPercentual`.
- `rotuloFaturamento(dashboard, ehAtual)` e `indicadoresDoMes(dashboard)`: devolve as duas colunas abaixo do número (rótulo, valor ou mensagem, subtexto e tom), seguindo a tabela de casos do `design.md`. Exemplo: projeção nula com mês em andamento e `diasDeUso < 5` vira "Disponível com 5 dias de uso" / "faltam N dias de uso".
- `pendencias(alertas, podeAcessar)`: lista ordenada por severidade, com ícone, título, resumo, contagem, tom (`danger` | `caution` | `info`) e `href` (ou `null` sem permissão para o destino). Destinos:

| Alerta | `href` | Área exigida |
| --- | --- | --- |
| `mensalistasInadimplentes` | `/mensalistas?aba=lista` | `Mensalistas` |
| `caixasComDiferenca` | `/caixa/historico` | `CaixaHistorico` |
| `veiculosParados` | `hrefDoTicket(maisAntigo.idPatio, filtrosVazios)` | `Patio` |
| `mensalidadesAVencer` | `/mensalistas` (agenda) | `Mensalistas` |
| `faturasConveniadaAbertas` | `/faturas` | `Faturas` |

- `distribuicaoOrigem(origem)` e `distribuicaoRecebimento(recebimento)`: linhas com nome, valor, % e cor (chave de tema). Origem: Avulso → `cliente.avulso`, Mensalistas → `cliente.mensal`, Convênios → `cliente.conveniado`, Lava-rápido → `primary`. Recebimento: `FORMA_PAGAMENTO` (`types/caixa.ts`) → `pagamento.*`, e o desconhecido → `steel`.
- `agruparHoras(horas, passo)`: média dos veículos e soma das entradas por grupo; grupo sem hora conhecida fica vazio.
- `format.ts`: `brl(valor, { centavos })` (sem centavos, arredonda e reaproveita `formatBRL`), `dataCurta` ("18 nov", com o ano só quando diferente do atual), `diaSemanaCurto`, `percentual`, e permanência via `formatarMinutos`.

### 5. Hook — `src/components/dashboard/useDashboard.ts` (novo)
```ts
useQuery({
  queryKey: ["dashboard", periodo, data],
  queryFn: () => getDashboard({ periodo, data }),
  placeholderData: keepPreviousData,   // troca de período sem salto: mostra o anterior esmaecido
  staleTime: 60_000,
  refetchOnWindowFocus: true,          // voltar ao app atualiza "agora" (pátio/alertas)
  enabled,                             // só com permissão (useCan(AREA.Inicio))
});
```
Sem `refetchInterval`: atualização automática está fora do escopo. `isPlaceholderData` controla o `aria-busy` e a opacidade.

### 6. Componentes (Client Components, `"use client"`: query, URL, estado de seleção e media query)
Em `src/components/dashboard/`, cada um com `X.tsx`, `X.styles.ts`, `index.ts` e teste, seguindo o padrão do repositório:
- **DashboardPage**: lê a URL (`useSearchParams`), chama `useDashboard` e monta a grade nas três quebras do `design.md`. Também resolve os estados: skeleton no primeiro carregamento, `InlineNotice` com "Tentar de novo" (`refetch`) no erro, mantendo os dados anteriores, e `aria-busy` na troca de período. Esconde Pátio e Pendências quando `periodo.fechado`.
- **CabecalhoDashboard**: saudação (`useCurrentUser().user.name`, `useAgora(60_000)` para trocar de bom dia/boa tarde), subtítulo com `dataReferencia`, `Tabs` segmentada, setas (botões com ícone chevron, `aria-label`, alvo de toque `touchTarget`), rótulo `aria-live="polite"` e "Voltar para hoje".
- **PainelDashboard**: `section` com `aria-labelledby` e o rótulo em caixa alta. É a base de todos os blocos.
- **CardFaturamento** (inclui o estado de boas-vindas), **Variacao**, **CardPatioAgora**, **IndicadoresPeriodo**, **ListaPendencias**, **Distribuicao**, **PorCategoria**.
- **GraficoFaturamentoDiario**: colunas empilhadas por origem. A seleção usa *roving tabindex*: um só ponto de tabulação, ←/→ movem e Esc limpa. O detalhe do dia fica numa linha acima do gráfico. O `role="img"` com resumo vai num wrapper e as colunas são `button`.
- **MovimentoPorHora**: mesmo padrão de seleção (`aria-pressed`). O agrupamento em 2h vem de `useMediaQuery` (abaixo de `sm`, ou abaixo de `lg` quando o maior valor tem 3 dígitos).
- **DashboardSkeleton**: a grade com `Skeleton` por painel.

`src/app/(app)/dashboard/page.tsx` vira um Server Component que só exporta `metadata` ("Visão Geral — Murel") e envolve `<DashboardPage />` em `Suspense` (exigido pelo `useSearchParams`, como em `financeiro/page.tsx`).

### 7. Tema — `src/styles/theme.ts` (editar)
Adicionar `successSoft`, `caution`, `cautionSoft`, `info` e `infoSoft` a `ThemeColors`, com comentário de uso, em `lightTheme` e `darkTheme`, com os valores do `design.md`. Antes de fechar, conferir o contraste: 3:1 de `caution`/`info` sobre `surface` e sobre o `*Soft` correspondente, nos dois temas.

### 8. Permissões, menu e tela inicial
- **`src/lib/permissoes.ts`**: `PERMISSOES_PADRAO[AREA.Inicio]` passa de `SEM_CONVENIADA` para `[Administrador]`. Atualizar o comentário: a área é a Visão Geral, e a permissão por módulo pode sobrescrever. Hoje o perfil nulo só acessa `AREA.Inicio`; isso passa a ser **nenhuma área** (ele só abre as `ROTAS_SEM_AREA`). `SEM_CONVENIADA` sai se ficar sem uso.
  - Efeito automático, sem código novo: o `proxy.ts` barra `/dashboard` (→ `/acesso-negado`) e `navItemsPermitidos` some com a Visão Geral do menu, da barra inferior e do tour.
- **`src/lib/telaInicial.ts`**: nova regra, com retorno `string`:
  1. Conveniada → `/carimbo` (como hoje).
  2. Tela grande e acessa a Visão Geral → `/dashboard`.
  3. Acessa o Pátio → `/patio` (celular de todos, e tela grande de quem não vê a Visão Geral).
  4. Acessa a Visão Geral → `/dashboard` (Administrador sem Pátio por permissão por módulo).
  5. Primeiro item com `href` de `navItemsPermitidos(perfil)`, na ordem do menu (Financeiro → `/financeiro`, Lavador → `/servicos`).
  6. Nenhum → `/usuario`.
  - `LoginForm` e `RedirecionarInicio` já usam a função: não mudam.
- **`src/components/onboarding/conteudo.ts`**: atualizar o texto de `/dashboard` ("resumo do faturamento, do pátio e das pendências…", sem os atalhos que saíram).

### 9. Remoções e realocação das ações antigas
- **Repetir tour** → item "Repetir tour" no `UserMenu` (`src/components/layout/UserMenu`), para todos os perfis, chamando `useOnboardingTour().abrirTour`. O `UserMenu` já está dentro do `OnboardingProvider` (ele é montado no `AppShell`). O `RepetirTourButton` continua no Carimbo. Gerar cartaz (Minha Empresa), Instalar app (Header/UserMenu) e entrada/saída (barra inferior e Pátio) já têm lugar.
- **Remover**, depois de confirmar com busca que ficaram sem uso: `src/components/home/DashboardContent`, `src/components/home/IndicadoresPatio`, `src/components/veiculos/ActionRow.tsx`, `src/components/patio/graficos/*` (só o `IndicadoresPatio` os usa) e as funções de `patio.ts` que ficarem órfãs (`estatisticasPatio`, `chegadasPorHora`, `ocupacaoPatio`?). Cada remoção leva junto os seus testes. `useVagasPatio` só sai se também ficar sem uso.
- **Reescrever** `src/app/(app)/dashboard/page.test.tsx`.

### 10. Testes (Vitest + Testing Library, `renderWithTheme`)
- **Puros**:
  - `periodo.ts`: limites, deslocamento por mês curto e virada de ano, período atual, `podeVoltar` com início do uso nulo ou dentro do período, rótulos.
  - `url.ts`: padrões, valores inválidos, data futura.
  - `apresentacao.ts`: todos os casos de `indicadoresDoMes`, `textoComparacao`, ordem e destinos de `pendencias`, filtros das distribuições, `agruparHoras`.
  - `format.ts`.
  - `dashboard.mapper.ts`: fixture do input, nulos preservados, ausência sem `NaN`.
  - `telaInicial.ts`: cada perfil, em tela grande e pequena, e perfil nulo.
  - `permissoes.ts` e `nav.test.ts`: Visão Geral só para o Administrador.
- **Componentes**: os critérios de aceite do PRD com a fixture (R$ 0,00, ▼ 100% vs. quinta passada, projeção, "—" nos indicadores, 17 lacunas, origem sem Mensalista, quatro formas de recebimento, categorias vazias, horas 16h–23h como lacuna). Também o período fechado sem Pátio/Pendências, a empresa nova, o erro com "Tentar de novo", a seta › desabilitada e a navegação pelo teclado nos gráficos.
- **Antes de finalizar**: `npm run lint` e `npm run build`.

## Decisões técnicas e trade-offs
- **Reaproveitar `AREA.Inicio` em vez de criar `AREA.Dashboard`**: a rota, o menu, o tour e os testes já se apoiam nela. Renomear espalharia mudanças sem ganho. O custo é o nome "Início" deixar de significar "o mínimo para qualquer um". O comentário e a mudança do perfil nulo deixam isso explícito.
- **Período e data na URL**: o link pode ser compartilhado, o voltar do navegador funciona e fica o mesmo padrão do Financeiro e do Histórico do caixa. `replace` em vez de `push` evita histórico poluído pelas setas.
- **"Hoje" do navegador para navegação; `dataReferencia` do servidor para exibição**: as setas precisam responder antes da API, então a decisão é local. A divergência de relógio é tratada em Riscos.
- **Gráficos novos no domínio em vez de generalizar `patio/graficos`**: seleção, lacunas tracejadas, empilhamento e agrupamento são próprios desta tela, e os gráficos do pátio ficam sem uso com a saída do `IndicadoresPatio`. Generalizar um componente que vai ser removido não compensa. Se uma segunda tela precisar, aí promover para `ui`.
- **Regras de exibição em funções puras**: são muitos casos condicionais (mês fechado ou em andamento, dia ou semana, nulos). Testar isso em componente seria caro e frágil.
- **SVG/CSS próprio, sem biblioteca de gráficos**: o repositório não tem uma. Barras são `div`s com flex, como na referência e no `ChegadasPorHora`, e uma dependência nova não se paga para colunas.
- **Sem atualização automática**: o PRD deixa de fora. `refetchOnWindowFocus` cobre o caso do Administrador que volta ao app.

## Riscos / pontos de atenção
- **Formatos não confirmados da API** (seção 1): `comparacaoMesAnterior`, `fechamentoMesAnterior`, `melhorDia`, `mensalidadesAVencer`, `caixasComDiferenca` e o item de `categorias`. Antes de implementar os blocos que os usam, chamar a API com um mês fechado e uma empresa com mais dados, ou pedir o swagger ao back-end. Até lá, o mapper tolera nomes alternativos e os testes cobrem a forma suposta.
- **Relógio do aparelho adiantado**: a URL pode pedir "hoje" depois do hoje do servidor e receber 400. O tratamento é refazer a consulta sem `data` (o servidor assume hoje) e corrigir a URL.
- **Fuso**: datas ISO sem fuso, interpretadas como horário local, como no resto do sistema. Semana segunda a domingo calculada localmente, igual ao servidor.
- **Perfil nulo sem nenhuma área**: quem tiver token com role desconhecida cai em `/usuario` e não tem menu. É coerente com a regra, mas muda o comportamento atual. Cobrir em teste.
- **Permissão por módulo não está ligada no front**: `podeAcessar` aceita `overrides`, mas ninguém os passa hoje. "A permissão por módulo pode alterar" só vale quando aquela feature (`docs/specs/permissoes`) for ligada. Nada a fazer aqui, só não fechar o caminho.
- **Remoções em cascata** (`patio/graficos`, funções de `patio.ts`, `useVagasPatio`): confirmar o uso por busca antes de apagar. `npm run lint` e `npm run build` pegam importações quebradas.
- **Tour**: os passos seguem `navItemsPermitidos`. O teste de passos exige texto para cada item do menu, então, se o texto de `/dashboard` mudar de chave, o teste aponta.
- **Desempenho no celular**: 30 colunas + 24 horas com seleção. Memoizar os dados derivados por resposta (`useMemo`) e não re-renderizar a página inteira na seleção: o estado de seleção fica dentro de cada gráfico.

## Fora de escopo técnico
- Atualização em tempo real ou por intervalo, exportação, intervalo de datas livre.
- Ligar a permissão por módulo (overrides) do back-end ao front.
- Filtros por URL nas telas de destino das pendências (Mensalistas inadimplentes, Faturas abertas): os links abrem a tela, e o filtro fica para quando essas telas o suportarem.
- Testes E2E (ficam para `executar-qa`).
