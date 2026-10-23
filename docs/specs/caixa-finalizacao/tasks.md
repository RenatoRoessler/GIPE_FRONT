# Tasks: Finalização do Caixa

Referências: ./prd.md, ./design.md, ./techspec.md. Contrato da API em `docs/specs/input.md`.

Ordem pensada para entregar em fatias: **Fase A** (corrigir o que existe contra o contrato) → **Fase B** (dados e regras novos) → **Fase C** (nova tela `/caixa`) → **Fase D** (resumo e PDFs) → **Fase E** (histórico de caixas e extrato) → **Fase F** (verificação). Rodar `npm run lint` e os testes da área ao fim de cada task que altera código; `npm run build` ao fim de cada fase. Seguir as skills `code-best-practices`, `styled-components-best-practices` e `claude-design` (só tokens do tema).

Bloqueio conhecido: os esquemas de resposta de turno, caixa, movimentos e histórico não foram vistos (o swagger só descreve em texto). T1, T6 e a conferência final em T20 dependem de uma resposta real da API (acesso a liberar ou JSON de exemplo). As suposições ficam só em `types/caixa.ts` e em `caixa.mapper.ts`.

## Fase A — Corrigir o que existe

- [x] T1 — Alinhar os tipos de caixa e turno ao contrato
  - Arquivos: `src/types/caixa.ts`
  - Pronto quando: `Turno` e `Caixa` trazem os campos descritos na API (`valorFundoCaixa` do turno, `saldoCaixa`, `totalSaida`, `saldoCaixaInformado`, `totalDiferenca`, `observacao`, `disponivelSangria`, `valorFundoCaixaFechamento`); `trocoPadrao` deixa de ser usado pela lógica; `PassagemTurnoInput` troca `valorInicial` por `valorFundoCaixa`; novos tipos `TipoMovimento`, `Movimento`, `CaixaFechado` e `Pagina<T>` exportados; campos que dependem da resposta real ficam opcionais ou `null`; `npm run lint` e `tsc` passam (ajustar os consumidores).

- [x] T2 — Corrigir fechamento e passagem de turno no serviço
  - Arquivos: `src/lib/api/services/caixa.ts`, `src/lib/api/services/caixa.test.ts`
  - Pronto quando: `fecharCaixa` chama `PUT /Caixa/fechar` com `{ conferencias, valorFundoCaixa, observacao }` (`valorFundoCaixa` opcional); `passarTurno` envia `valorFundoCaixa`; `abrirCaixa` e `registrarSangria` mantidos; os comentários `[A DEFINIR]` removidos; testes (com `api` mockado) conferem método, rota e corpo de abrir, sangria, passagem e fechamento, inclusive `valorFundoCaixa: null`.

- [x] T3 — Atualizar os schemas de formulário
  - Arquivos: `src/lib/schemas/caixa.ts`, `src/lib/schemas/caixa.test.ts`
  - Pronto quando: `createSangriaSchema` valida contra o disponível com a mensagem do design ("O valor passa do que pode ser retirado (R$ z). O fundo de caixa fica na gaveta.") e sem mencionar troco padrão; `conferenciaSchema` troca `valorInicial` por `fundoCaixa`; `fecharCaixaSchema` aceita `fundoContado` opcional e não negativo; `periodoSchema` rejeita data inicial maior que a final; testes cobrem cada regra.

- [x] T4 — Ajustar os modais de retirada, passagem de turno e fechamento
  - Arquivos: `src/components/caixa/SangriaModal.tsx`, `PassarTurnoModal.tsx`, `FecharCaixaModal.tsx`, `ConferenciaFields.tsx`, `useConferencia.ts` e seus testes
  - Pronto quando: a retirada mostra "Pode retirar" e o fundo que fica na gaveta, com a mensagem de limite sem troco padrão (a barra segmentada em miniatura fica para a T10, junto da `GavetaResumo`); a passagem tem o campo "Fundo de caixa do novo turno" com a ajuda do valor assumido quando em branco (calculado ao vivo: fundo do turno atual + dinheiro conferido); o fechamento tem o campo opcional "Fundo de caixa contado na gaveta" e envia `valorFundoCaixa`; erros 400 aparecem com a mensagem da API; testes de componente cobrem cada fluxo e o corpo enviado.

- [x] T5 — Corrigir a permissão do histórico de turnos e mapear a rota do histórico de caixas
  - Arquivos: `src/lib/permissoes.ts`, `src/lib/permissoes.test.ts`, `src/components/caixa/CaixaHeader.tsx`, `CaixaHeader.test.tsx`, `src/proxy.test.ts`
  - Pronto quando: `areaDaRota` escolhe o prefixo mais longo e mapeia `/caixa/historico` (e filhas) para `AREA.CaixaHistorico`, enquanto `/caixa` continua em `AREA.Caixa`; o botão "Histórico de turnos" aparece para os quatro perfis; `Retirada` só com `CaixaSangria`; novo `Link` "Caixas anteriores" só com `CaixaHistorico`; testes: Caixa e Manobrista veem o histórico de turnos e são redirecionados do `/caixa/historico` pelo proxy, Administrador e Gerente passam.

## Fase B — Dados e regras novos

- [x] T6 — Serviços e mappers de movimentos e histórico
  - Arquivos: `src/lib/api/services/caixa.ts`, `src/lib/api/services/caixa.mapper.ts`, `caixa.mapper.test.ts`, `caixa.test.ts`
  - Pronto quando: `listMovimentos` (`GET /Caixa/movimentos`, 404 vira `[]`), `listHistoricoCaixas` (`GET /Caixa/historico` com `dataInicio`, `dataFim`, `pagina`, `tamanhoPagina` em `yyyy-MM-dd`) e `listMovimentosCaixa` (`GET /Caixa/historico/{caixaId}/movimentos`) implementados; mapper tolerante normaliza nomes e nulos e classifica o tipo do movimento (entrada, saída, sangria); testes com respostas de exemplo conferem o mapeamento e os parâmetros enviados; suposições comentadas apontando para a validação com a API.

- [x] T7 — Regras puras de movimentos, agregados, linha do tempo e gaveta
  - Arquivos: `src/components/caixa/movimentos.ts`, `agregados.ts`, `eventosCaixa.ts`, `gaveta.ts` e `regras.test.ts` (um arquivo de teste para as quatro)
  - Pronto quando: `filtrarMovimentos`, `contarPorTipo`, `paginar`, `totaisPorForma`, `totaisPorHora` (24 posições, hora local), `picoDeEntradas`, `montarLinhaDoTempo` (abertura, retiradas, passagens, fechamento, do mais recente ao mais antigo) e `calcularGaveta` (usa só `disponivelSangria` e o esperado em dinheiro da API, "—" quando faltar) cobertos por testes com casos vazios, filtros combinados e arredondamento a 2 casas.

- [x] T8 — Exportação CSV
  - Arquivos: `src/components/caixa/exportCsv.ts`, `exportCsv.test.ts`
  - Pronto quando: `movimentosParaCsv` gera cabeçalho em português, separador `;`, decimal com vírgula, BOM UTF-8 e escapa aspas, quebras de linha e `;` nos textos; `baixarCsv(nome, conteudo)` cria o Blob e o link temporário; testes cobrem o conteúdo gerado e o escape.

- [x] T9 — Hooks de dados e invalidação do cache
  - Arquivos: `src/components/caixa/useCaixa.ts`, `useHistoricoCaixas.ts`, `useMovimentosCaixa.ts` e testes
  - Pronto quando: `useCaixa` expõe `movimentosQuery` (habilitada com o caixa aberto, refaz ao voltar o foco, sem polling); `useHistoricoCaixas` usa chave com filtros e página e `keepPreviousData`; `useMovimentosCaixa` busca o extrato por `caixaId`; abrir, retirar, passar turno e fechar invalidam o prefixo `CAIXA_KEY` e o fechamento invalida também o histórico; testes conferem as chaves e a invalidação.

## Fase C — Nova tela `/caixa`

- [x] T10 — Bloco "Gaveta"
  - Arquivos: `src/components/caixa/GavetaResumo.tsx`, `GavetaResumo.styles.ts`, `GavetaResumo.test.tsx`; `src/styles/theme.ts` só se precisar de `successSoft`
  - Pronto quando: mostra "Na gaveta agora" em destaque, a barra segmentada fundo/pode retirar, a linha de entradas, saídas e saldo, e o botão `Retirada` somente com `CaixaSangria`; estados de carregamento, sem turno, erro e 403; layout empilhado no mobile; só tokens do tema (claro e escuro); testes de renderização por estado e por perfil.

- [x] T11 — Turno atual por forma de pagamento
  - Arquivos: `src/components/caixa/FormasPagamentoTabela.tsx`, `.styles.ts`, `.test.tsx`; `TurnoAtual.tsx`
  - Pronto quando: tabela com forma, entradas, saídas e esperado, barra de proporção por linha com o número sempre em texto, dinheiro primeiro, boleto e transferência só se vierem da API, modo cartão abaixo do breakpoint; `TurnoAtual` usa o novo componente e a faixa de contexto (responsável, início, fundo do turno); testes de renderização, ordem e estados.

- [x] T12 — Lista de movimentos com filtros
  - Arquivos: `src/components/caixa/MovimentosLista.tsx`, `.styles.ts`, `.test.tsx`
  - Pronto quando: filtros de tipo (Todos, Entradas, Saídas, Sangrias, com `aria-pressed`) e de turno; tabela com data/hora, tipo, forma, turno e usuário, motivo e valor (sinal e cor); 20 por página com `Pagination`; contagem anunciada por `aria-live`; vazio, vazio por filtro com "Limpar filtros", carregando e erro/403; modo cartão no mobile; testes de filtro, paginação e estados.

- [x] T13 — Linha do tempo
  - Arquivos: `src/components/caixa/LinhaDoTempo.tsx`, `.styles.ts`, `.test.tsx`
  - Pronto quando: `<ol>` com marcador por tipo de evento, hora e autor, do mais recente ao mais antigo, usando `montarLinhaDoTempo`; caso vazio mostra só a abertura; sem animação decorativa; testes de ordem e conteúdo.

- [x] T14 — Gráficos do turno
  - Arquivos: `src/components/caixa/GraficosCaixa.tsx`, `.styles.ts`, `.test.tsx`
  - Pronto quando: gráfico por forma de pagamento (entradas e saídas lado a lado, valor em texto) e por hora (colunas de entradas e saídas, resumo do pico em texto, `role="img"` com `aria-label` e equivalente textual); valores vêm de `agregados.ts`; estado vazio; só tokens do tema; testes de rótulos, resumo e estado vazio.

- [x] T15 — Compor a página do caixa com as abas
  - Arquivos: `src/components/caixa/CaixaPage/CaixaPage.tsx`, `AbasCaixa.tsx`, `src/components/caixa/aba.ts`, `SaldoCards.tsx` (remover), testes
  - Pronto quando: a ordem é cabeçalho, `GavetaResumo`, `TurnoAtual` e as abas Movimentos, Linha do tempo e Gráficos; a aba ativa fica em `?aba=` (Movimentos é o padrão e fica sem parâmetro; valor inválido cai no padrão); `SaldoCards` removido sem referências; estado "caixa fechado" mostra o `Link` "Caixas anteriores" só para `CaixaHistorico`; `npm run build` ao fim da fase (adiado para a T20, para não derrubar um servidor `next start` em uso); a retirada passa a viver só na gaveta (removida do cabeçalho para não duplicar o botão); testes de composição e da URL.

## Fase D — Resumo e comprovantes

- [x] T16 — PDFs de comprovante e de extrato
  - Arquivos: `src/components/caixa/pdf/comprovanteTurnoPdf.ts`, `extratoPdf.ts`, `.test.ts`
  - Pronto quando: geração A4 com `jspdf` importado dinamicamente; comprovante de fechamento/passagem com empresa (quando disponível), período, responsáveis, esperado, informado e diferença por forma, observação e linhas de assinatura; extrato com cabeçalho do caixa e movimentos paginados; reaproveita os helpers de `ComprovantePublico/pdfCupom.ts` ou os move para um módulo comum; testes conferem as linhas montadas e que o `jspdf` só carrega ao gerar.

- [x] T17 — Resumo pós-fechamento e pós-passagem com comprovante
  - Arquivos: `src/components/caixa/ResumoFechamento.tsx`, `.styles.ts`, `.test.tsx`, `FecharCaixaModal.tsx`, `PassarTurnoModal.tsx`
  - Pronto quando: após o sucesso, o modal mostra o resumo (esperado, informado e diferença por forma com Sobra/Falta/Sem diferença, total, responsáveis, observação) e o botão "Baixar comprovante (PDF)" com estado "Gerando…" e erro sem perder o resumo; foco no título do resumo; ao dispensar, a tela atualiza como hoje; testes do resumo, da geração (mock) e do foco.

## Fase E — Caixas anteriores e extrato

- [x] T18 — Histórico de caixas fechados
  - Arquivos: `src/app/(app)/caixa/historico/page.tsx`, `src/components/caixa/HistoricoCaixasPage/` (componente, estilos, `index.ts`, teste)
  - Pronto quando: título, `Link` de volta, filtro De/Até (validado por `periodoSchema` sem chamar a API quando inválido) com estado em `?de=&ate=&pagina=`, tabela com abertura, fechamento, quem abriu e fechou, totais (conforme a resposta real) e `Ver extrato`, paginação do servidor, cartões no mobile; estados carregando, vazio, erro e 403; Caixa e Manobrista barrados pelo proxy; testes de filtro, paginação e estados. Ler `node_modules/next/dist/docs/` antes de escrever a página.

- [x] T19 — Extrato de um caixa fechado
  - Arquivos: `src/app/(app)/caixa/historico/[caixaId]/page.tsx`, `src/components/caixa/ExtratoCaixaPage/` (componente, estilos, `index.ts`, teste)
  - Pronto quando: cabeçalho com período, quem abriu e fechou e resumo (fundo, entradas, saídas, diferença); reaproveita `MovimentosLista` com os mesmos filtros; botões "Baixar CSV" e "Baixar PDF" exportam o que está filtrado e o rótulo indica o filtro ativo; estados: carregando, caixa não encontrado (404), caixa ainda aberto (400 com a mensagem da API e link para `/caixa`), erro e 403; `params` assíncrono conforme a versão do Next deste projeto; testes de exportação e dos estados.

## Fase F — Verificação

- [ ] T20 — Verificação final
  - Arquivos: `docs/specs/caixa-finalizacao/prd.md`, `docs/specs/caixa/` (nota de que foi superada nos pontos corrigidos), `tasks.md`
  - Pronto quando: `npm run lint`, a suíte de testes e `npm run build` passam; os critérios de aceite do `prd.md` conferidos um a um; tipos e mappers validados contra respostas reais da API (ou o risco registrado se a API não estiver acessível); fluxos de abrir, retirar, passar turno, fechar, comprovante, movimentos, gráficos, linha do tempo, histórico e extrato percorridos com cada perfil, em desktop e mobile, e o PDF testado no tablet do balcão; "Questões em aberto" do PRD atualizadas.

  - Situação (parcial): `npm run lint` (0 erros), `npm run build` e a suíte (2137 de 2138 testes; o que falhou foi `MensalistaModal.veiculos` por tempo, 5,0 s sob carga, e passa isolado) estão verdes. **Pendentes**: validar tipos e mappers contra a API real, percorrer os fluxos com cada perfil em desktop e mobile, testar os PDFs no tablet do balcão e atualizar as "Questões em aberto" do PRD.
