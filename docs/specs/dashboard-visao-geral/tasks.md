# Tasks: Dashboard — Visão Geral do Administrador

Referências: ./prd.md, ./techspec.md, ./design.md

Toda task com código termina com os testes dela passando; `npm run lint` e `npm run build` rodam na T32. Caminhos novos ficam em `src/components/dashboard/` (abreviado como `dashboard/`).

## A. Fundações: tema, tipos e dados

- [x] T1 — Adicionar os tokens `successSoft`, `caution`, `cautionSoft`, `info` e `infoSoft` ao tema (claro e escuro), com comentário de uso
  - Arquivos: `src/styles/theme.ts`
  - Pronto quando: `ThemeColors`, `lightTheme` e `darkTheme` têm os cinco tokens com os valores do `design.md`; `tsc` não aponta erro; e um teste confere o contraste mínimo de 3:1 de `caution`/`info` sobre `surface` e sobre o `*Soft` correspondente, nos dois temas (ajustar o valor se falhar)

- [x] T2 — Criar os tipos do dashboard (`Dashboard`, `PERIODO_DASHBOARD`, `Comparacao`, `OrigemValores`, `FaixaMovimento` etc.)
  - Arquivos: `src/types/dashboard.ts`
  - Pronto quando: o arquivo compila e exporta os tipos da seção 1 do Tech Spec, com `| null` explícito (sem campos opcionais) e comentário marcando os formatos supostos

- [x] T3 — Criar a fixture com a resposta de exemplo do input (19/11/2026, início do uso em 07/11)
  - Arquivos: `src/lib/api/services/dashboard.fixture.ts`
  - Pronto quando: a fixture exporta o DTO bruto do input, mais fábricas para variações (mês fechado, empresa nova, sem pendências), usadas pelos testes seguintes

- [x] T4 — Criar o mapper da resposta (`fromDashboardResponse`) com DTO tolerante
  - Arquivos: `src/lib/api/services/dashboard.mapper.ts`, `src/lib/api/services/dashboard.mapper.test.ts`
  - Pronto quando: testes cobrem a fixture do input, nulos preservados (comparação, projeção, alertas, posições de `faturamentoDiario` e de `horas`), ausência de campo sem `NaN`/`undefined`, `horas` normalizado para 24 posições e `recebimento`/`categorias` filtrados para `valor > 0`

- [x] T5 — Criar o serviço `getDashboard({ periodo, data })`
  - Arquivos: `src/lib/api/services/dashboard.ts`, `src/lib/api/services/dashboard.test.ts`
  - Pronto quando: testes confirmam `GET /Dashboard` com `periodo` e `data` (omitida quando não informada), retorno já mapeado, e que 400 e 403 sobem como `ApiError`

## B. Período, URL e regras de apresentação (funções puras)

- [x] T6 — Funções de período: `limitesDoPeriodo`, `deslocar`, `ehPeriodoAtual`, `podeVoltar`
  - Arquivos: `dashboard/periodo.ts`, `dashboard/periodo.test.ts`
  - Pronto quando: testes cobrem dia, semana de segunda a domingo e mês; deslocamento por mês curto e virada de ano; período atual; `podeVoltar` com início do uso nulo, dentro do período e antes dele; tudo com `hoje` injetado

- [x] T7 — Rótulos de período (`rotuloDoPeriodo`) e formatações de data (`dataCurta`, `diaSemanaCurto`)
  - Arquivos: `dashboard/periodo.ts`, `dashboard/format.ts`, `dashboard/format.test.ts`
  - Pronto quando: testes conferem "Hoje · 19 nov", "Ontem · 18 nov", "Qua · 11 nov", "Esta semana · 16 – 22 nov", "26 out – 1 nov", "Outubro 2026", com o ano só quando diferente do atual

- [x] T8 — Formatação de valores: `brl` (com/sem centavos), `percentual`, permanência (`1h 52min`, `2d 3h`)
  - Arquivos: `dashboard/format.ts`, `dashboard/format.test.ts`
  - Pronto quando: testes confirmam "R$ 1.403,50", "R$ 2.591", percentual sem sinal duplicado e permanência via `formatarMinutos`; valor nulo nunca vira "R$ 0"

- [x] T9 — Leitura e escrita da URL (`lerFiltros`, `filtrosParaQuery`)
  - Arquivos: `dashboard/url.ts`, `dashboard/url.test.ts`
  - Pronto quando: testes cobrem padrões (dia e hoje), `periodo` inválido, `data` inválida e data futura corrigida para hoje, e que só o que difere do padrão vai para a query

- [x] T10 — Textos de saudação e comparação: `saudacao`, `primeiroNome`, `textoComparacao`
  - Arquivos: `dashboard/apresentacao.ts`, `dashboard/apresentacao.test.ts`
  - Pronto quando: testes cobrem as faixas de hora (5h–11h59, 12h–17h59, 18h–4h59), nome vazio, e todos os textos de comparação ("vs. quinta passada", "vs. mesmo ponto da semana passada", "vs. semana anterior", "vs. out até dia 19", "vs. outubro"); sem `comparacao` ou sem `variacaoPercentual` devolve `null`

- [x] T11 — Regras do card de faturamento: `rotuloFaturamento` e `indicadoresDoMes`
  - Arquivos: `dashboard/apresentacao.ts`, `dashboard/apresentacao.test.ts`
  - Pronto quando: testes cobrem todos os casos do `design.md` (dia/semana em mês em andamento, mês em andamento, projeção indisponível com "faltam N dias de uso", mês fechado com média e melhor dia, dia/semana em mês fechado) e a fixture do input gera "Mês até agora" + projeção, sem comparação com o mês anterior

- [x] T12 — Regras das pendências: `pendencias(alertas, podeAcessar)`
  - Arquivos: `dashboard/apresentacao.ts`, `dashboard/apresentacao.test.ts`
  - Pronto quando: testes confirmam a ordem por severidade, o tom (`danger`/`caution`/`info`), o resumo de cada uma, os destinos da tabela do Tech Spec, `href: null` sem permissão no destino, lista vazia com alertas nulos e o item mais antigo com placa e permanência

- [x] T13 — Regras das distribuições: `distribuicaoOrigem` e `distribuicaoRecebimento`
  - Arquivos: `dashboard/apresentacao.ts`, `dashboard/apresentacao.test.ts`
  - Pronto quando: testes confirmam nome, valor, % e chave de cor de cada linha, origem nula omitida (ex.: mensalista da fixture), forma desconhecida com cor `steel`, e lista vazia quando não há valor

- [x] T14 — Regras do gráfico por hora: `agruparHoras`, janela de maior/menor movimento e hora selecionada padrão
  - Arquivos: `dashboard/apresentacao.ts`, `dashboard/apresentacao.test.ts`
  - Pronto quando: testes cobrem passo 1 e 2 (média dos veículos, soma das entradas, grupo sem hora conhecida vazio), a hora padrão (hora atual hoje, senão a hora após o início do pico) e a fixture com 0h–15h preenchidas e o resto nulo

## C. Hook de dados

- [x] T15 — Criar o hook `useDashboard`
  - Arquivos: `dashboard/useDashboard.ts`, `dashboard/useDashboard.test.tsx`
  - Pronto quando: testes confirmam a chave `["dashboard", periodo, data]`, `keepPreviousData` (`isPlaceholderData` na troca), `enabled: false` sem permissão (nenhuma chamada) e `refetch` funcionando

## D. Acesso, menu e tela inicial

- [x] T16 — Restringir a Visão Geral ao Administrador por padrão
  - Arquivos: `src/lib/permissoes.ts`, `src/lib/permissoes.test.ts`, `src/lib/nav.test.ts`, `src/proxy.test.ts`
  - Pronto quando: `PERMISSOES_PADRAO[AREA.Inicio]` é `[Administrador]` (comentário atualizado; `SEM_CONVENIADA` removido se ficar sem uso); perfil nulo não acessa nenhuma área; testes confirmam que só o Administrador vê a Visão Geral no menu e que os demais perfis são barrados em `/dashboard` pelo proxy

- [x] T17 — Nova regra da tela inicial por perfil
  - Arquivos: `src/lib/telaInicial.ts`, `src/lib/telaInicial.test.ts`
  - Pronto quando: testes cobrem, em tela grande e pequena: conveniada → `/carimbo`; Administrador → `/dashboard` (grande) e `/patio` (pequena); Gerente/Caixa/Manobrista → `/patio`; Financeiro → `/financeiro`; Lavador → `/servicos`; Administrador sem acesso ao Pátio por permissão por módulo → `/dashboard`; perfil nulo → `/usuario`; e `LoginForm`/`RedirecionarInicio` seguem passando sem alteração

- [x] T18 — Atualizar o texto do tour da Visão Geral
  - Arquivos: `src/components/onboarding/conteudo.ts`, `src/components/onboarding/passos.test.ts`
  - Pronto quando: o texto de `/dashboard` descreve faturamento, pátio e pendências (sem os atalhos que saíram) e `passos.test.ts` passa

- [x] T19 — Levar "Repetir tour" para o menu do usuário
  - Arquivos: `src/components/layout/UserMenu/UserMenu.tsx`, `src/components/layout/UserMenu/UserMenu.styles.ts`, `src/components/layout/UserMenu/UserMenu.test.tsx`
  - Pronto quando: o menu mostra "Repetir tour" para qualquer perfil, o clique fecha o menu e chama `abrirTour`, o item funciona por teclado, e o teste do `UserMenu` cobre o caso (o `RepetirTourButton` do Carimbo continua igual)

## E. Componentes base da tela

- [x] T20 — Criar `PainelDashboard` (superfície com rótulo em caixa alta) e `Variacao` (pílula ▲/▼)
  - Arquivos: `dashboard/PainelDashboard/*`, `dashboard/Variacao/*`
  - Pronto quando: renderizam nos dois temas só com tokens do tema; `PainelDashboard` expõe `section` com `aria-labelledby`; `Variacao` mostra seta, texto e tom (`success`/`danger`) sem depender só de cor; testes cobrem os dois

- [x] T21 — Criar `CabecalhoDashboard`
  - Arquivos: `dashboard/CabecalhoDashboard/*`
  - Pronto quando: mostra saudação com primeiro nome, data por extenso e "atualizado às HH:mm"; `Tabs` segmentada Dia/Semana/Mês; setas com `aria-label` e alvo de 44px; rótulo com `aria-live="polite"`; › desabilitada no período atual, ‹ desabilitada pelo início do uso, "Voltar para hoje" só fora do período atual; no celular os controles ocupam a largura toda; testes cobrem cada regra e os callbacks

- [x] T22 — Criar `CardFaturamento` com o estado de boas-vindas
  - Arquivos: `dashboard/CardFaturamento/*`
  - Pronto quando: renderiza rótulo, marca "Fechado", número com centavos, `Variacao` (ausente sem comparação), as duas colunas do mês e, com `inicioUso` nulo, o texto de boas-vindas; testes usam a fixture do input (R$ 0,00 · ▼ 100% vs. quinta passada · projeção) e os casos de mês fechado e empresa nova

- [x] T23 — Criar `CardPatioAgora`
  - Arquivos: `dashboard/CardPatioAgora/*`
  - Pronto quando: mostra "17 de 110 vagas", a pílula de % ocupado, a `ProgressBar`, carros/motos e avulsos/mensalistas (esta linha some sem mensalistas na empresa); testes com a fixture

- [x] T24 — Criar `IndicadoresPeriodo`
  - Arquivos: `dashboard/IndicadoresPeriodo/*`
  - Pronto quando: três painéis (Saídas, Ticket médio, Permanência) com valor, subtexto e, sem dado, "—" em `textMuted` com a frase "sem saídas no período"/"sem saídas pagas"; no celular, 2 colunas com Permanência na linha inteira; testes com e sem dado

- [x] T25 — Criar `ListaPendencias`
  - Arquivos: `dashboard/ListaPendencias/*`
  - Pronto quando: renderiza ícone por tipo, título, resumo, contagem e chevron; cada linha é um link só quando há `href`; sem pendências mostra "Tudo em dia — Nenhuma pendência no momento"; testes cobrem os cinco tipos, a ordem e o estado vazio

- [x] T26 — Criar `Distribuicao` e usá-la em "De onde vem o dinheiro" e "Como você recebe"
  - Arquivos: `dashboard/Distribuicao/*`
  - Pronto quando: barra empilhada de 12px com segmentos separados, linhas com marcador de cor, valor e %, título com o mês quando não é o atual e mensagem de vazio; testes com origem sem mensalista e os quatro recebimentos da fixture

- [x] T27 — Criar `PorCategoria`
  - Arquivos: `dashboard/PorCategoria/*`
  - Pronto quando: linhas ordenadas da maior para a menor, trilho proporcional, rodapé com total de saídas e valor, rótulo "saídas do dia/da semana/do mês" e mensagem de vazio; teste com a fixture (vazio) e com categorias

## F. Gráficos

- [x] T28 — Criar `GraficoFaturamentoDiario`
  - Arquivos: `dashboard/GraficoFaturamentoDiario/*`
  - Pronto quando: colunas empilhadas por origem, legenda só das origens com valor, eixo com início/meio/fim ("Hoje"), destaque dos dias do período, dias antes do início do uso tracejados e dias futuros vazios; detalhe do dia por mouse, foco e toque; navegação ←/→ (um ponto de tabulação) e Esc; `role="img"` com resumo; altura 130px no celular; testes cobrem a fixture (17 lacunas), seleção por teclado e o estado vazio

- [x] T29 — Criar `MovimentoPorHora`
  - Arquivos: `dashboard/MovimentoPorHora/*`
  - Pronto quando: 24 colunas com valor, pico em destaque, horas futuras como lacuna, seleção por botão com `aria-pressed` e detalhe (veículos, % das vagas, entradas), linhas de maior e menor movimento, agrupamento em 2h abaixo de `sm` (ou abaixo de `lg` com valores de 3 dígitos) e as duas mensagens de vazio (sem uso; menos de 7 dias em semana/mês); testes cobrem cada caso

## G. Página

- [x] T30 — Criar `DashboardSkeleton` e `DashboardPage` (grade, estados e navegação por URL)
  - Arquivos: `dashboard/DashboardSkeleton/*`, `dashboard/DashboardPage/*`
  - Pronto quando: a página lê a URL, chama `useDashboard`, monta a grade nas três larguras do `design.md` (a ordem no celular põe as pendências antes do gráfico), esconde Pátio e Pendências no período fechado, mostra esqueleto no primeiro carregamento, mantém os dados com `aria-busy` na troca de período, mostra `InlineNotice` com "Tentar de novo" no erro e refaz a consulta sem `data` quando a API recusa a data; setas e seletor atualizam a URL com `replace`; testes cobrem os critérios de aceite do PRD com a fixture, período fechado, empresa nova, erro e teclado

- [x] T31 — Trocar a rota `/dashboard` pela nova página e remover o conteúdo antigo
  - Arquivos: `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/dashboard/page.test.tsx`; remover `src/components/home/DashboardContent`, `src/components/home/IndicadoresPatio`, `src/components/veiculos/ActionRow.tsx`, `src/components/patio/graficos` e o que ficar órfão em `src/components/patio/patio.ts` e `useVagasPatio.ts` (cada um com os seus testes)
  - Pronto quando: a página exporta `metadata` ("Visão Geral — Murel") e envolve `DashboardPage` em `Suspense`; o teste da rota foi reescrito; uma busca confirma que nada mais importa o que foi removido; nada que ainda é usado por outra tela foi apagado

## H. Fechamento

- [ ] T32 — Verificação final: lint, testes, build e conferência com a referência
  - Arquivos: —
  - Pronto quando: `npm run lint`, a suíte de testes e `npm run build` passam; a página, aberta com dados reais, confere com `referencia-layout.html` no desktop e no celular (~375px), em tema claro e escuro, sem rolagem horizontal; os formatos supostos da API (Riscos do Tech Spec) foram conferidos contra uma resposta real e os ajustes ficaram só em `types/dashboard.ts` e no mapper
  - Situação: lint (0 erros; nenhum aviso nos arquivos da feature), testes e build passam, e a tela foi conferida com a fixture do input em 1280px e 375px, nos temas claro e escuro, sem rolagem horizontal. **Falta** conferir os formatos supostos (`mes.comparacaoMesAnterior`, `mes.fechamentoMesAnterior`, `mes.melhorDia`, `alertas.mensalidadesAVencer`, `alertas.caixasComDiferenca` e o item de `categorias`) contra uma resposta real da API, com um mês fechado ou uma empresa com mais dados. Falhas que já existiam e não são desta feature: `tokens.test.ts` (`PlateField.styles.ts` usa `warn` em outline) e os três testes de "Ir para o início" (CaixaPage, MinhaEmpresa e UsuariosList esperam `/dashboard`, o componente linka `/`).
