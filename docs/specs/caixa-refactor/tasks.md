# Tasks: Refactor do layout do Caixa

Referências: ./prd.md, ./techspec.md, ../caixa-layout/design.md

- [x] T1 — Adicionar `quantidade` (número de entradas) a `TotalForma` em `totaisPorForma`
  - Arquivos: `src/components/caixa/agregados.ts`, `src/components/caixa/regras.test.ts`
  - Pronto quando: cada forma devolve `quantidade`; sangria sem forma não conta como ticket; `GraficosCaixa` segue funcionando sem ler o campo; testes de `totaisPorForma` conferem a quantidade e passam.

- [x] T2 — Criar as funções puras de composição da tela (`valorEmCaixa`, `totalDeTickets`, `formasDoResumo`)
  - Arquivos: `src/components/caixa/resumo.ts`, `src/components/caixa/resumo.test.ts`
  - Pronto quando: valor em caixa = `(saldoAtual ?? entradas − saídas) + valorFundoCaixa`; formas na ordem Dinheiro, Pix, Débito, Crédito (sempre as quatro, mesmo com R$ 0,00) e extras só com entrada, na cor `colors.steel`; rótulos de `formaPagamentoLabel`; percentual via `proporcao()` sem NaN com tudo zerado; testes cobrem esses casos.

- [x] T3 — Remover a query de turnos de `useCaixa`
  - Arquivos: `src/components/caixa/useCaixa.ts`, `src/components/caixa/hooksCaixa.test.tsx`
  - Pronto quando: o hook devolve só caixa, turno e movimentos; os testes deixam de mockar `turnosQuery` e passam.

- [x] T4 — Criar os estilos compartilhados dos cartões e da barra de ações
  - Arquivos: `src/components/caixa/CaixaResumo.styles.ts`
  - Pronto quando: cartões, grade de dois cartões, barra empilhada, lista por forma e barra de ações existem usando só tokens do tema (inclui `colors.pagamento.*`), sem valor visual hardcoded; `npm run lint` sem erros no arquivo.

- [x] T5 — Criar `AberturaCaixa` (data/hora de abertura e selo "Aberto")
  - Arquivos: `src/components/caixa/AberturaCaixa.tsx`, `src/components/caixa/AberturaCaixa.test.tsx`
  - Pronto quando: mostra `formatDateTime(caixa.dataHoraAbertura)` e o `StatusBadge` "Aberto"; teste cobre os dois.

- [x] T6 — Criar `ValorEmCaixa` (valor em destaque e "Recebido ... em N tickets")
  - Arquivos: `src/components/caixa/ValorEmCaixa.tsx`, `src/components/caixa/ValorEmCaixa.test.tsx`
  - Pronto quando: exibe `valorEmCaixa`, o recebido (`valorTotalEntrada`) e o total de tickets (singular/plural correto); esqueleto no cartão enquanto os movimentos carregam; erro só no cartão, com "Tentar novamente"; testes cobrem valores, carregando e erro.

- [x] T7 — Criar `FundoEGaveta` (fundo de caixa e dinheiro na gaveta, lado a lado)
  - Arquivos: `src/components/caixa/FundoEGaveta.tsx`, `src/components/caixa/FundoEGaveta.test.tsx`
  - Pronto quando: mostra "Troco na abertura" com `valorFundoCaixa` e `calcularGaveta(turno).naGaveta`; sem turno (ou sem número válido) mostra "—" e o aviso "Não há turno em andamento"; esqueleto enquanto o turno carrega; testes cobrem esses estados.

- [x] T8 — Criar `RecebidoPorForma` (total, barra empilhada e lista por forma)
  - Arquivos: `src/components/caixa/RecebidoPorForma.tsx`, `src/components/caixa/RecebidoPorForma.test.tsx`
  - Pronto quando: renderiza total, barra empilhada (formas com R$ 0,00 sem trecho) e lista com valor, tickets e cor `colors.pagamento.*` por forma; esqueleto e erro com "Tentar novamente" no cartão; testes cobrem valores, zerado sem NaN, carregando e erro.

- [x] T9 — Criar `AcoesCaixa` (barra de ações por perfil)
  - Arquivos: `src/components/caixa/AcoesCaixa.tsx`, `src/components/caixa/AcoesCaixa.test.tsx`
  - Pronto quando: com `useCan(AREA.CaixaSangria)` verdadeiro mostra Sangria (secondary), Lançar despesa (secondary, `disabled`, `aria-disabled`, "Em breve", sem `onClick`) e Fechar caixa (primary); falso mostra Trocar turno (secondary) e Fechar caixa (primary), sem Sangria nem Lançar despesa; todas desabilitadas sem turno; testes cobrem os dois perfis, o estado sem turno e os callbacks.

- [x] T10 — Criar `CaixaSkeleton` (carregamento no formato dos cartões)
  - Arquivos: `src/components/caixa/CaixaSkeleton.tsx`, `src/components/caixa/CaixaSkeleton.test.tsx`
  - Pronto quando: reproduz a pilha de cartões com `Skeleton`, sem salto de layout ao carregar; teste confirma a renderização.

- [x] T11 — Reescrever `CaixaPage` e a rota com o novo layout
  - Arquivos: `src/components/caixa/CaixaPage/CaixaPage.tsx`, `src/components/caixa/CaixaPage/CaixaPage.test.tsx`, `src/app/(app)/caixa/page.tsx`
  - Pronto quando: fluxo carregando (`CaixaSkeleton`) → 403 (`ErroSemPermissao`) → erro com "Tentar novamente" → caixa fechado (`CaixaFechado` com "Caixas anteriores") → aberto (pilha de cartões e ações); `h1` "Caixa" visualmente oculto; coluna única de até ~720px centralizada; `ModalId` sem `"historico"`; Sangria, Trocar turno e Fechar caixa abrem os modais certos, sem mudar as regras deles; `page.tsx` sem `Suspense`; testes reescritos cobrem caixa aberto, fechado, carregando, erro, 403 e cada ação, e as abas/histórico não aparecem.

- [x] T12 — Registrar o código órfão para remoção futura
  - Arquivos: `docs/specs/caixa-refactor/techspec.md`
  - Pronto quando: a seção de riscos ou decisões lista o que deixou de ser usado (`AbasCaixa`, `GraficosCaixa`, `LinhaDoTempo`, `eventosCaixa`, `aba.ts`, `HistoricoTurnosModal`, `CaixaHeader`, `GavetaResumo`, `TurnoAtual`, `FormasPagamentoTabela`) para apagar após a decisão do RF11; nada é removido nesta entrega.

- [ ] T13 — Verificação final
  - Arquivos: —
  - Pronto quando: `npm run lint` sem erros, testes do Caixa passando, `npm run build` ok e a tela conferida nos temas claro e escuro em 360px, sem rolagem horizontal.
  - Pendente: lint (0 erros), testes e build ok; falta só a conferência visual nos dois temas.
