# Tasks: Saída sem cobrança e fila do lavador (mobile)

Referências: ./prd.md, ./design.md, ./techspec.md

## A. Saída sem cobrança (RF1 a RF5)

- [x] T1 — Criar o helper `semCobranca` que diz se a saída não tem nada a cobrar
  - Arquivos: `src/components/veiculos/saida.ts`, `src/components/veiculos/saida.test.ts`
  - Pronto quando: `semCobranca(consulta)` é verdadeiro para avulso com valor 0 e para mensalista, e falso para avulso com valor maior que zero (comparação por centavos, como `valoresIguais`); teste cobre os três casos.

- [x] T2 — Fazer o fluxo da saída usar o helper para liberar a confirmação e enviar sem pagamento
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.ts`, `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.test.tsx`
  - Depende de: T1
  - Pronto quando: `semCobranca` do hook vale para avulso a R$ 0,00 e para mensalista; nesse caso `pagamento.canConfirm` é verdadeiro sem escolher forma e sem esperar os meios de pagamento; `confirmar` envia `valor: 0` e `formaPagamento: 1` (Dinheiro), com `recebido` e `troco` nulos; saída com cobrança segue igual. Testes novos para avulso a R$ 0,00 passam e os de mensalista continuam passando.

- [x] T3 — Limpar as escolhas de pagamento quando o valor muda entre zero e maior que zero
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.ts`, `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.test.tsx`
  - Depende de: T2
  - Pronto quando: nos dois pontos que já detectam mudança de valor (resposta `"mudou"` da confirmação e a atualização automática da consulta), quando o estado sem cobrança vira, `forma`, `recebido` e `atalho` voltam ao vazio; mudança entre dois valores maiores que zero continua limpando só `recebido` e `atalho`, como hoje. Testes cobrem 0 → maior que 0, maior que 0 → 0 e maior que 0 → maior que 0.

- [x] T4 — Mostrar o estado sem cobrança no modal (botão, anúncio e área de pagamento)
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/SaidaVeiculoModal.tsx`, `src/components/veiculos/SaidaVeiculoModal/SaidaVeiculoModal.test.tsx`, `src/components/veiculos/SaidaVeiculoModal/SaidaVeiculoModal.direto.test.tsx`
  - Depende de: T2
  - Pronto quando: avulso a R$ 0,00 mostra "Sem pagamento nesta saída.", não mostra "Forma de pagamento" nem "Cliente pagou com", e o botão "Confirmar Saída · Sem cobrança" já está habilitado; com valor novo o botão diz "Confirmar novo valor · Sem cobrança"; o anúncio da fase não cita "pagamento" nesse caso (função `anuncioDaFase`); avulso com valor maior que zero fica idêntico ao atual. Testes do modal passam.

- [x] T5 — Garantir que o recibo da saída sem cobrança continua correto
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/SaidaVeiculoModal.test.tsx`
  - Depende de: T4
  - Pronto quando: teste de ponta a ponta no modal confirma a saída de avulso a R$ 0,00 e o recibo mostra "Pagamento: Sem cobrança", sem "Valor recebido", sem "Troco" e sem o texto "null"; botão de nota fiscal não aparece.

## B. Fila do lavador (RF6 a RF10)

- [x] T6 — Criar `statusInicialDaFila` e `ordenarColuna`
  - Arquivos: `src/components/servicos/fila.ts`, `src/components/servicos/fila.test.ts`
  - Pronto quando: `statusInicialDaFila(itens)` devolve a primeira aba com itens na ordem Em andamento, Na fila, Pronto (um atrasado está sempre em andamento), e "Na fila" se a fila está vazia; `ordenarColuna(itens, agora)` coloca os atrasados primeiro, do mais atrasado para o menos, e mantém a ordem dos demais (ordenação estável). Testes cobrem: atrasado, só em andamento, só na fila, só pronto, tudo vazio, empate de atraso.
  - Observação: a função não recebe `agora` (o techspec previa), porque o atraso só existe em andamento e essa aba já vem primeiro.

- [x] T7 — Aceitar rótulo com conteúdo e nome acessível nas abas
  - Arquivos: `src/components/ui/Tabs/Tabs.tsx`, `src/components/ui/Tabs/Tabs.styles.ts`, `src/components/ui/Tabs/Tabs.test.tsx`
  - Pronto quando: `TabsItem.label` aceita `ReactNode` e `TabsItem.ariaLabel` (opcional) vira o `aria-label` do botão; na variante `segmentada` a aba usa `white-space: nowrap` e `padding: 0 space[2]`; abas com `label` em texto se comportam como antes (inclusive setas, Home e End); teste novo cobre rótulo em JSX e `ariaLabel`. Conferido que os outros usos de `Tabs` continuam passando nos seus testes.

- [x] T8 — Fazer a fila escolher a aba inicial e ordenar a coluna "Em andamento"
  - Arquivos: `src/components/servicos/FilaServicos/FilaServicos.tsx`, `src/components/servicos/FilaServicos/FilaServicos.test.tsx`
  - Depende de: T6
  - Pronto quando: no celular, sem `?status=` na URL, a aba aberta é a de `statusInicialDaFila`, decidida uma única vez depois da primeira resposta; com `?status=` na URL ela manda; uma atualização automática da fila não troca a aba; `statusDaUrl` continua exportada e com o mesmo contrato (`null` → "Na fila"); `colunaDe` usa `ordenarColuna`, com o atrasado no topo. No desktop nada muda. Testes existentes ajustados e testes novos cobrem cada regra.

- [x] T9 — Mostrar contagem em cima, nome embaixo e ponto de atraso nas abas da fila
  - Arquivos: `src/components/servicos/FilaServicos/FilaServicos.tsx`, `src/components/servicos/FilaServicos/FilaServicos.styles.ts`, `src/components/servicos/FilaServicos/FilaServicos.test.tsx`
  - Depende de: T7, T8
  - Pronto quando: cada aba mostra a contagem em negrito e o nome em `fontSizes.xs`, em uma linha; a aba "Em andamento" ganha um ponto `danger` quando há serviço atrasado; o `ariaLabel` da aba diz, por exemplo, "Em andamento, 1 serviço, 1 passou da previsão"; nada de cor, fonte ou espaço fora do tema. Em 390px e 360px "Em andamento" cabe em uma linha (conferido na T13).

- [x] T10 — Tornar os contadores do topo tocáveis no `ResumoDaFila`
  - Arquivos: `src/components/servicos/ResumoDaFila/ResumoDaFila.tsx`, `src/components/servicos/ResumoDaFila/ResumoDaFila.styles.ts`, `src/components/servicos/ResumoDaFila/index.ts`, `src/components/servicos/ResumoDaFila/ResumoDaFila.test.tsx`
  - Pronto quando: sem `onSelecionar` renderiza exatamente como hoje; com `onSelecionar` cada pílula é `<li>` com um botão de altura mínima `touchTarget`, com hover (`surfaceMuted`), foco visível (`colors.focus`) e, nas três de status, `aria-pressed` verdadeiro só na atual (`statusAtual`), com borda `colors.text`; "passou da previsão" é botão simples com `danger`/`dangerSoft`; o callback recebe `"aguardando"`, `"execucao"`, `"pronto"` ou `"atrasados"`. Testes passam.

- [x] T11 — Ligar os contadores às abas no celular
  - Arquivos: `src/components/servicos/FilaServicos/FilaServicos.tsx`, `src/components/servicos/FilaServicos/FilaServicos.test.tsx`
  - Depende de: T8, T10
  - Pronto quando: no celular, tocar em "na fila", "em andamento" ou "pronto" troca para a aba certa (gravando `?status=`); "passou da previsão" abre "Em andamento" e leva o primeiro cartão à vista (`scrollIntoView` com `block: "nearest"`, sem roubar o foco); no desktop os contadores continuam só de leitura (sem botões). Testes cobrem os quatro contadores e o desktop.

## C. Fechamento

- [x] T12 — Rodar lint, testes e build
  - Arquivos: nenhum
  - Depende de: T1 a T11
  - Pronto quando: `npm run lint` sem erros; `npx tsc --noEmit` limpo; `npx vitest run` sem falhas novas (as 4 falhas já existentes, "403 avisa da permissão" em `MinhaEmpresa`, `UsuariosList` e `CaixaPage`, e "o foco usa o token `focus`", continuam as mesmas); `npm run build` passa.
  - Resultado: lint 0 erros (95 avisos); tsc limpo; 4968 testes passando e só as 4 falhas conhecidas; build ok.

- [x] T13 — Conferir no celular (390px e 360px) em homologação
  - Arquivos: nenhum (verificação; resultado anotado em `docs/specs/relatorio-regressao-mobile-2026-11-17.md`)
  - Depende de: T12
  - Pronto quando: (a) saída de um avulso a R$ 0,00 em homologação confirma sem escolher nada e gera o recibo "Sem cobrança" (valida o contrato com a API); (b) saída com cobrança ficou igual; (c) fila como lavador abre na aba certa e o atrasado fica no topo; (d) contadores levam à aba certa; (e) "Em andamento" cabe em uma linha em 360px e 390px; (f) todos os critérios de aceite do `prd.md` marcados.
  - Resultado: (a) ok (placa `QAT4D56`: recibo "Pagamento: Sem cobrança"); (b) ok (R$ 175,00 com forma de pagamento e "Cliente pagou com", botão desabilitado até escolher; descartado sem registrar); (c) ok (abre em "Em andamento", atrasado no topo); (d) ok ("0 na fila" leva a `?status=1`, "passou da previsão" a `?status=2`); (e) ok (abas de 106×44 em 360px, nome em uma linha); (f) critérios do PRD conferidos por teste automático e pela verificação acima.
