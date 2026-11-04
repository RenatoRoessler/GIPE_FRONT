# Tasks: Conferência de pátio

Referências: ./prd.md, ./design.md, ./techspec.md

> Cada task termina com `npm run lint` e os testes da própria task passando. A última roda também `npm run build`. Nenhum teste, fixture ou documento pode conter o JWT de `docs/specs/input.md`.

## Fase 1 — Contrato e dados

- [x] T1 — Conferir o contrato real das respostas e guardar uma fixture anonimizada
  - Arquivos: `src/lib/api/services/conferenciaPatio.fixture.ts`, ajustes nos `[A CONFIRMAR]` de `techspec.md`
  - Pronto quando: numa conferência de **teste** (ambiente de desenvolvimento, não dados reais) foram vistas as respostas de `GET /aberta`, `POST /`, `/leituras` (conferido, já conferido e sem entrada), `PUT /itens/{id}`, `/saida` e `/finalizar`; os nomes dos campos de item, sem entrada, ajuste, `ultimaConferencia` e `conferenciaAberta` estão confirmados no `techspec.md`; a fixture não tem placas, nomes ou tokens reais; o tratamento de 204 no `client.ts` foi verificado.
  - Feito em 2026-11-04 no servidor de teste, com a conferência nº 1 do caixa 4 (finalizada). **Não exercitados por decisão:** `/saida`, `/sem-entrada/{placa}/entrada` e, por isso, o conteúdo de `ajustes` e de `conferenciaAberta` no resumo. Esses campos seguem `[A CONFIRMAR]` e devem ser vistos na T10/T19 ou em teste manual.

- [x] T2 — Tipos e constantes da conferência
  - Arquivos: `src/types/conferenciaPatio.ts`
  - Pronto quando: constantes nomeadas (método, situações, origem, resultado, motivo, tipo de ajuste) e os tipos do Tech Spec §2 existem com os nomes confirmados em T1; `tsc` sem erros.

- [x] T3 — Mapper tolerante das respostas
  - Arquivos: `src/lib/api/services/conferenciaPatio.mapper.ts`, `conferenciaPatio.mapper.test.ts`; exportar `toNumber`/`toText` de `patio.ts` para um módulo comum, se ainda forem privados
  - Pronto quando: `fromResumo`, `fromConferencia`, `fromItem`, `fromLeitura` leem a fixture de T1; campos ausentes ou de tipo errado não quebram; item sem id é descartado; placa vem normalizada; listas ausentes viram `[]`; testes cobrem esses casos.

- [x] T4 — Serviço dos endpoints
  - Arquivos: `src/lib/api/services/conferenciaPatio.ts`, `conferenciaPatio.test.ts`
  - Pronto quando: `obterResumo`, `obterAberta` (204 → `null`), `iniciarConferencia`, `lerPlaca`, `marcarItem`, `darSaidaPeloItem`, `registrarEntradaSemTicket`, `descartarSemEntrada` e `finalizarConferencia` chamam os caminhos e payloads do swagger; a placa na rota vai normalizada e com `encodeURIComponent`; erros 400, 403 e 404 sobem como `ApiError`; testes cobrem cada função.

- [x] T5 — Schemas de validação
  - Arquivos: `src/lib/schemas/conferenciaPatio.ts`, `conferenciaPatio.test.ts`
  - Pronto quando: existem schemas zod para placa digitada, saída (motivo obrigatório; descrição obrigatória e até 300 caracteres no motivo "Outro") e entrada sem ticket (categoria, modelo até 80, cor até 50, ticket opcional só dígitos); mensagens em português; testes cobrem os limites.

- [x] T6 — Regras puras da conferência
  - Arquivos: `src/components/conferencia/conferencia.ts`, `conferencia.test.ts`
  - Pronto quando: `tipoDoCliente`, `calcularTotais`, `filtrarItens`, `ordenarItens`, `itensNaoEncontrados`, `semEntradaPendentes`, `descricaoLeitura`, `pctProgresso` e `duracaoEntre` funcionam; os totais ignoram itens Baixado e Saiu; um teste compara `calcularTotais` com o `totais` da fixture de T1.

- [x] T7 — Chaves de cache e hooks de leitura
  - Arquivos: `src/components/conferencia/conferenciaKeys.ts`, `useConferenciaResumo.ts`, `useConferenciaAberta.ts` e seus testes
  - Pronto quando: `useConferenciaAberta` devolve `null` no 204, atualiza a cada 30 s só com a aba visível e quando `ativo`, e recarrega ao voltar o foco; `useConferenciaResumo` expõe `caixaIdAberto`, `ultimaConferencia` e `conferenciaAberta`; testes com serviços mockados.

## Fase 2 — Ações e câmera

- [x] T8 — Hook de ações com fila de leituras
  - Arquivos: `src/components/conferencia/useConferenciaAcoes.ts`, `useConferenciaAcoes.test.tsx`
  - Pronto quando: `iniciar`, `ler`, `marcar`, `descartar` e `finalizar` atualizam o cache de `conferenciaAbertaKey` conforme a tabela do Tech Spec §5; a tela só muda depois da resposta do servidor; leituras vão numa fila serial; a mesma placa em 5 s é descartada antes de entrar na fila; falha de rede não recoloca a leitura e a fila segue; `iniciar` com 400 de "já existe aberta" faz refetch; testes cobrem cada caso, inclusive item novo que entrou depois do início.

- [x] T9 — Modo contínuo do leitor de placa
  - Arquivos: `src/components/veiculos/LeitorPlacaModal/useLeitorPlaca.ts`, `useLeitorPlaca.test.tsx`
  - Pronto quando: a opção `continuo` mantém a câmera ligada depois da primeira placa, reinicia o consenso e reinicia o tempo limite a cada leitura; ao estourar vai a `sem-leitura`; sem a opção o comportamento é idêntico ao atual; os testes existentes de `useLeitorPlaca`, `LeitorPlacaModal` e dos campos de placa continuam passando e há testes novos do modo contínuo.

- [x] T10 — Hook da saída pela conferência
  - Arquivos: `src/components/conferencia/useSaidaConferencia.ts`, `useSaidaConferencia.test.tsx`
  - Pronto quando: consulta `consultarSaida` por placa e reconsulta a cada 30 s; usa `useMeiosPagamento`, `getPagamentoStatus` e `valorACobrar`; ao confirmar reconsulta e, se o valor mudou, avisa e não envia; envia `valor`, `formaPagamento`, `motivo` e `descricao` pelo `darSaidaPeloItem`; mensalista e valor zero usam a forma padrão sem troco; trava contra duplo envio; ao concluir invalida pátio, quadros, caixa e refaz `aberta`; testes cobrem valor alterado, valor zero, motivo "Outro" e erro de caixa fechado.

## Fase 3 — Design system, menu e permissão

- [x] T11 — `ProgressBar` e `TipoClienteBadge`
  - Arquivos: `src/components/ui/ProgressBar/*`, `src/components/ui/TipoClienteBadge/*` (componente, estilos, teste, `index.ts`); um token de tema para o texto sobre as cores de cliente, só se ainda não existir
  - Pronto quando: `ProgressBar` tem `role="progressbar"` com valor, máximo e nome, preenche por `scaleX` e respeita `prefers-reduced-motion`; `TipoClienteBadge` mostra a inicial P/M/C nas cores de `colors.cliente`, com nome por extenso em `aria-label`/`title`, e contraste mínimo de 4,5:1 nos dois temas; testes de papel, nome e valores limite (0 e 100%).

- [x] T12 — Item no menu, rota e permissão
  - Arquivos: `src/lib/nav.ts`, `nav.test.ts`, `src/lib/permissoes.ts`, `permissoes.test.ts`, `src/components/layout/NavIcons/NavIcons.tsx`, testes de `BottomNav`/`SideNav` que contem itens
  - Pronto quando: existe o item "Conferência de pátio" (`shortLabel` "Conferência", `href` "/conferencia-patio", ícone `checklist`, `AREA.Patio`) logo depois de "Caixa" (e não de "Saída", para não deslocar Pátio, Entrada, Saída e Caixa), fora de `BAR_PRIORITY`; a rota está em `AREA_POR_ROTA`; o `ChecklistIcon` segue o traço dos outros ícones; some do menu e é bloqueado para perfil sem a área; testes atualizados.

## Fase 4 — Telas

- [x] T13 — Página, etapas na URL e estados gerais
  - Arquivos: `src/app/(app)/conferencia-patio/page.tsx`, `page.test.tsx`, `src/components/conferencia/ConferenciaPage/*`
  - Pronto quando: `page.tsx` é Server com `Suspense` e esqueleto; `ConferenciaPage` lê `?etapa=` (`conferindo`, `divergencias`, `resumo`), usa `router.push` entre etapas e redireciona para o início se não há conferência aberta, com o aviso "Esta conferência foi encerrada." quando ela some com a tela aberta; mostra esqueleto no carregamento e `ErrorBanner` com "Tentar novamente" (sem o botão no 403); testes de cada redirecionamento.

- [x] T14 — Tela inicial
  - Arquivos: `src/components/conferencia/ConferenciaInicio/*`
  - Pronto quando: mostra o total, a divisão em avulsos, mensais e conveniados, a última conferência (com "Incompleta" em texto quando for o caso, ou "nenhuma"), o `OptionGroup` de método (câmera desabilitada com a frase quando indisponível) e o aviso de entradas e saídas; "Iniciar conferência" inicia e vai para `conferindo`; com conferência aberta mostra o aviso com quem iniciou e o progresso e o botão vira "Continuar conferência"; sem caixa aberto o botão fica desabilitado com o aviso e o link "Abrir caixa"; testes dos quatro cenários e do erro 400.

- [x] T15 — Item da conferência
  - Arquivos: `src/components/conferencia/ConferenciaItem/*`
  - Pronto quando: mostra placa em `PlateDisplay`, modelo · cor, chave ou "Sem chave", hora de entrada, selo de tipo e o tipo por extenso; as ações mudam por situação (pendente: "Está no pátio" e "Não achei"; conferido: hora, origem e "Desfazer"; não encontrado: "Procurar de novo"); nomes acessíveis com a placa; modelo e cor longos truncam; botão ocupado enquanto envia; testes das três situações e dos nomes acessíveis.

- [x] T16 — Visor de placas
  - Arquivos: `src/components/conferencia/VisorPlacas/*`
  - Pronto quando: usa `useLeitorPlaca` em modo contínuo (120 s), liga e desliga com `ativo`, desliga com a aba oculta; mostra a última placa e o resultado (conferido, já conferido, sem entrada com botão "Registrar agora", entrada registrada) em região `aria-live="polite"`, com a placa lida letra a letra para leitor de tela; trata `negada`, `indisponivel`, `sem-leitura` e falta de HTTPS com a mensagem e a saída para "Digitar placa"; testes com o hook mockado.

- [x] T17 — Tela "Conferindo"
  - Arquivos: `src/components/conferencia/ConferenciaConferindo/*`, `DigitarPlacaModal/*`
  - Pronto quando: mostra "X de Y conferidos", percentual e `ProgressBar`; filtros `aria-pressed` "Faltam", "Conferidos" e (se houver) "Divergências" com a contagem no nome; lista de `ConferenciaItem` com mensagens de lista vazia por filtro; `VisorPlacas` só no método câmera; rodapé `ActionBar` com "Ver resumo" ou "Resolver divergências" e, com a câmera parada, "Ler placas"; "Digitar placa" abre a folha com validação e usa a mesma fila de leituras; duas colunas a partir de `breakpoints.lg`; foco vai ao item seguinte depois de uma marcação; testes de filtros, vazio, digitação inválida e válida.

- [x] T18 — Folha "Dar saída"
  - Arquivos: `src/components/conferencia/DarSaidaConferenciaModal/*`
  - Pronto quando: mostra a placa, `Select` de motivo, descrição (só em "Outro", com contador 0/300), `ResumoSaida` e `PagamentoSaida` (sem boleto e sem transferência; "Sem valor a cobrar" no valor zero); `Skeleton` no cálculo; `ErrorBanner` para erro de cálculo ou caixa fechado, com o botão de confirmar desabilitado; "Confirmar saída" vira "Registrando…" e fica travado; ao concluir mostra `ReciboSaidaStep`, fecha, e o `Toast` "Saída registrada."; testes de motivo "Outro" obrigatório, valor alterado e erro.

- [x] T19 — Folha "Registrar entrada"
  - Arquivos: `src/components/conferencia/RegistrarEntradaConferenciaModal/*`
  - Pronto quando: mostra a placa e os campos categoria, modelo (`ModeloField`), cor (`ColorSwatchGroup`), código do ticket e `Switch` de mensalista, validados pelo schema de T5; erro 400 de mensalista aparece no `ErrorBanner`, desliga o `Switch`, mantém o formulário e sugere registrar como avulso; sucesso mostra `Toast`, invalida pátio, quadros, caixa e resumo e refaz `aberta`; "Depois" fecha sem descartar; testes de campos obrigatórios, erro de mensalista e sucesso.

- [x] T20 — Tela de divergências
  - Arquivos: `src/components/conferencia/ConferenciaDivergencias/*`
  - Pronto quando: lista os não encontrados (com "Procurar de novo" e "Dar saída", e o aviso de conveniado quando for o caso) e as placas sem entrada (com "Leitura errada" e "Registrar entrada"), cada seção só quando houver itens; o subtítulo mostra "N para resolver" ou "Tudo resolvido" e o texto "Nenhuma divergência. O pátio bate com o sistema."; o item sai da lista ao resolver, com transição que respeita `prefers-reduced-motion`, e o foco vai ao próximo item ou ao botão "Ver resumo"; abre as folhas de T18 e T19; testes dos dois tipos de item e do foco.

- [x] T21 — Tela de resumo e finalização
  - Arquivos: `src/components/conferencia/ConferenciaResumo/*`
  - Pronto quando: mostra o título ("Pátio conferido" ou "Quase lá"), data, intervalo, duração e operador, os três números (no sistema, conferidos, ajustes feitos), os avisos de pendentes e de divergências (este leva à tela de divergências), a lista de ajustes com a descrição do servidor (ou "Nenhum ajuste nesta conferência."), e a observação opcional com contador 0/500 que sobrevive a recarregar a página e é limpa ao finalizar; "Finalizar conferência" chama `finalizar`, mostra o `Toast` "Conferência finalizada · X de Y conferidos" e volta ao início com a "Última conferência" atualizada; erro mostra `ErrorBanner` sem perder a observação; testes de finalizar com pendentes, com divergências e com erro.

## Fase 5 — Fechamento

- [ ] T22 — Revisão de acessibilidade, responsividade e temas
  - Arquivos: os componentes de `src/components/conferencia/*` e `src/components/ui/{ProgressBar,TipoClienteBadge}`
  - Pronto quando: sem rolagem horizontal em 320 px, alvos de toque de pelo menos 44 px, foco visível e navegação por teclado em todas as telas e folhas, contraste de 4,5:1 nos temas claro e escuro, `h1` único por etapa, regiões `aria-live` sem anunciar repetições, e nenhum valor visual solto fora do tema.
  - Andamento (2026-11-04): revisão feita no código e nos testes — um `h1` por etapa, alvos de 44 px (filtros, botões dos itens, folhas, visor), `aria-live` no visor e no progresso, foco depois de marcar/resolver, `prefers-reduced-motion` na barra, cores do visor vindas de `darkTheme`, sem hex solto. **Falta conferir no navegador:** 320 px sem rolagem horizontal, contraste nos dois temas, duas colunas em `lg` e o teclado de placa.

- [ ] T23 — Verificação final
  - Arquivos: nenhum novo (ajustes pontuais onde a verificação apontar)
  - Pronto quando: `npm run lint`, `npm run test` e `npm run build` passam; a feature foi usada no navegador, no celular em HTTPS, numa conferência de teste (iniciar, ler placas pela câmera, digitar, marcar, resolver divergências de saída e de entrada, finalizar, retomar depois de fechar o app, dois aparelhos na mesma conferência); `docs/specs/input.md` não vai no commit com o token.
  - Andamento (2026-11-04): `npm run lint` (0 erros), `npm run test` (322 arquivos, 3573 testes) e `npm run build` passam; a rota `/conferencia-patio` está no build. **Falta:** o uso no navegador e no celular em HTTPS (câmera real, 10 placas em sequência, retomar depois de fechar o app, dois aparelhos na mesma conferência), a saída e a entrada pela conferência contra o servidor de teste e a conferência do contrato de `ajustes`. `docs/specs/input.md` segue com o token e não deve ir no commit.
