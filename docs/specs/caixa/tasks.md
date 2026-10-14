# Tasks: Tela de Caixa

Referências: ./prd.md, ./techspec.md

Ordem pensada para entregar em fatias: **Fase A** (base: tipos, serviço, Modal, menu) → **Fase B** (caixa fechado/aberto e abertura) → **Fase C** (sangria, passagem de turno, histórico) → **Fase D** (fechamento) → **Fase E** (verificação). Rodar `npm run lint` ao fim de cada task que altera código; `npm run build` ao fim de cada fase.

Bloqueios com o backend (ver "Riscos" do `techspec.md`): corpo do `POST /Caixa/abrir` (T4, T10), endpoint e corpo do fechamento (T5, T17), significado de `status` (T3). As demais tasks não dependem desses itens; o que for suposição fica concentrado no serviço e em `format.ts`.

## Fase A — Base

- [x] T1 — Tipos do domínio de caixa
  - Arquivos: `src/types/caixa.ts`
  - Pronto quando: exporta `Caixa`, `CaixaSaldo`, `Turno`, `TurnoFormaPagamento`, `FormaPagamentoId`, `Conferencia` conforme o `techspec.md`; campos opcionais do JSON recebido representados como `null`; `npm run lint` passa.

- [x] T2 — Componente `Modal` no design system
  - Arquivos: `src/components/ui/Modal/Modal.tsx`, `Modal.styles.ts`, `index.ts`
  - Pronto quando: baseado em `<dialog>` com `showModal()`; props `open`, `title`, `onClose`, `children`, `footer`, `size` (`sm` | `lg`); `Esc` e clique no backdrop chamam `onClose`; foco preso e devolvido ao elemento que abriu; título ligado por `aria-labelledby`; abaixo de `breakpoints.md` ocupa a largura com margem do tema; só tokens do tema; `npm run lint` passa.

- [x] T3 — Utilitários de formatação do caixa
  - Arquivos: `src/components/caixa/format.ts`
  - Pronto quando: funções puras para rótulo da forma de pagamento (usa o enum `FORMA_PAGAMENTO_OPTIONS` de `src/types/caixa.ts`, códigos 1–6, com fallback "Forma {n}" para códigos desconhecidos), rótulo do status do turno, data/hora (`pt-BR`, tratando o valor sem fuso como horário local) e diferença (`Sobra`/`Falta`/`Sem diferença` + valor via `formatBRL`); `npm run lint` passa.

- [x] T4 — Serviço de leitura: caixa, saldo, turno atual e histórico
  - Arquivos: `src/lib/api/services/caixa.ts`
  - Pronto quando: `getCaixa()` e `getTurnoAtual()` devolvem `null` em `ApiError` `not_found` (e propagam os demais erros); `getSaldo()` e `listTurnos()` implementados; DTO tolerante normaliza ausentes/`null`; sem log de token nem payload; `npm run lint` passa.

- [x] T5 — Serviço de escrita: abrir, sangria, passagem, fechamento
  - Arquivos: `src/lib/api/services/caixa.ts`
  - Pronto quando: `abrirCaixa(fundoCaixa)` (`POST /Caixa/abrir`, corpo `{ valorFundoCaixa }` conforme suposição do `techspec.md`), `registrarSangria({ valor, observacao })`, `passarTurno({ conferencias, valorInicial, observacao })` (`valorInicial` vazio ⇒ `null`) e `fecharCaixa(conferencias)` (`POST /Caixa/fechar`, **suposição a confirmar**) implementados; `ApiError` sobe sem `try/catch`; as suposições estão em comentário curto apontando o ponto em aberto.

- [x] T6 — Schemas Zod dos formulários
  - Arquivos: `src/lib/schemas/caixa.ts`
  - Pronto quando: schemas de fundo (≥ 0), sangria (valor > 0, motivo `trim().min(1)`; limite do disponível validado por função que recebe `disponivelSangria`), conferência (cada valor ≥ 0; vazio = 0) e passagem (`valorInicial` opcional); mensagens em português seguindo o padrão de `schemas/preco.ts`; reaproveita `parseMoney`.

- [x] T7 — Item "Caixa" no menu
  - Arquivos: `src/lib/nav.ts`, `src/components/layout/NavSign/NavIcons.tsx` (e demais pontos que mapeiam `NavIconId`, ex.: `MobileNav`)
  - Pronto quando: `NavIconId` ganha `"cashier"`; item "Caixa" (`/caixa`) aparece após "Saída de Veículos" no menu desktop e mobile com ícone próprio; `isNavItemActive` marca o item em `/caixa`; `npm run lint` passa.

- [x] T8 — Build da Fase A
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam sem erros.

## Fase B — Tela, estados e abertura

- [x] T9 — Hook de dados `useCaixa` e rota `/caixa`
  - Arquivos: `src/components/caixa/useCaixa.ts`, `src/app/(app)/caixa/page.tsx`
  - Pronto quando: `useCaixa()` expõe `caixa`, `saldo`, `turno` (queries `["caixa"]`, `["caixa","saldo"]`, `["caixa","turno"]`; as duas últimas com `enabled` só com caixa aberto; `refetchOnWindowFocus` ativo nelas) e estados de carregamento/erro; `page.tsx` é Server Component que renderiza `<CaixaPage />`; `npm run build` lista a rota `/caixa`.

- [x] T10 — `CaixaPage` com estados e `CaixaFechado`
  - Arquivos: `src/components/caixa/CaixaPage/CaixaPage.tsx`, `CaixaPage.styles.ts`, `CaixaFechado.tsx`, `index.ts`
  - Pronto quando: carregando mostra esqueleto em `role="status"`; erro (≠ 404) mostra `ErrorBanner` + "Tentar novamente"; caixa fechado mostra "Caixa fechado" e o botão **Abrir caixa** (sem **Fechar caixa**); `useToast` + `Toast` montados na página; título "Caixa" com `Text`; só tokens do tema.

- [x] T11 — `AbrirCaixaModal`
  - Arquivos: `src/components/caixa/AbrirCaixaModal.tsx`
  - Pronto quando: campo "Fundo de caixa" (monetário, ≥ 0) com TanStack Form + schema; envio chama `abrirCaixa`, mostra estado de envio, erro do backend inline (`ErrorBanner`, `role="alert"`) sem fechar o modal; sucesso invalida `["caixa"]`, fecha o modal e mostra Toast "Caixa aberto."; botão **Abrir caixa** só aparece com caixa fechado.

- [x] T12 — `CaixaHeader`, `SaldoCards` e `TurnoAtual`
  - Arquivos: `src/components/caixa/CaixaHeader.tsx`, `SaldoCards.tsx`, `TurnoAtual.tsx` (+ `.styles.ts` de cada)
  - Pronto quando: com caixa aberto o cabeçalho mostra status, abertura e os botões (Retirada, Passar turno, Histórico de turnos, Fechar caixa) — **Abrir caixa não aparece**; 5 cards (abertura, fundo, entradas, saídas, saldo — saldo em destaque) com grade 5→2→1 colunas; turno atual mostra responsável, início, valor inicial, troco padrão, disponível p/ sangria e `Table` por forma de pagamento (entradas, saídas, esperado), virando lista empilhada no mobile; valores via `formatBRL`; sinais/texto além da cor.

- [x] T13 — Build da Fase B
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam; `/caixa` mostra o estado correto para caixa fechado e aberto.

## Fase C — Sangria, passagem de turno e histórico

- [x] T14 — `SangriaModal`
  - Arquivos: `src/components/caixa/SangriaModal.tsx`
  - Pronto quando: mostra o disponível para retirada (`disponivelSangria`); valor e motivo obrigatórios; bloqueia valor acima do disponível com mensagem do limite; envia `registrarSangria({ valor, observacao: motivo })`; erro do backend inline; sucesso invalida `["caixa"]`, fecha e mostra Toast "Retirada registrada.".

- [x] T15 — `ConferenciaFields` e `PassarTurnoModal`
  - Arquivos: `src/components/caixa/ConferenciaFields.tsx`, `PassarTurnoModal.tsx`
  - Pronto quando: `ConferenciaFields` lista um campo monetário por forma de pagamento do turno atual (vazio = 0, com aviso visível); `PassarTurnoModal` inclui `valorInicial` opcional (texto de apoio: vazio assume o dinheiro conferido) e observação opcional; envia `passarTurno`; o 400 "turno já é do usuário logado" aparece inline; sucesso invalida `["caixa"]`, fecha e mostra Toast "Turno passado.".

- [x] T16 — `HistoricoTurnosModal`
  - Arquivos: `src/components/caixa/HistoricoTurnosModal.tsx`
  - Pronto quando: consulta `["caixa","turnos"]` só com o modal aberto; lista do mais antigo ao mais recente com responsável, início/fim, valor inicial e status; turnos fechados mostram informado e diferença por forma de pagamento com `StatusBadge` (Sobra/Falta) e valor; turno aberto aparece identificado, sem valores informados; carregando, erro (com "Tentar novamente") e lista vazia tratados.

- [x] T17 — Build da Fase C
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam.

## Fase D — Fechamento (⚠ depende do contrato do endpoint de fechamento)

- [ ] T18 — `FecharCaixaModal` com resumo do resultado
  - Status: código implementado e compilando; fica pendente até o contrato (endpoint, corpo e retorno) ser confirmado com o backend.
  - Arquivos: `src/components/caixa/FecharCaixaModal.tsx`
  - Pronto quando: reaproveita `ConferenciaFields` com o aviso "formas sem valor serão contadas como zero"; envia `fecharCaixa`; sucesso exibe, no próprio modal, o resumo do turno encerrado (esperado, informado e diferença por forma de pagamento) e, ao fechar o resumo, invalida `["caixa"]` e a tela volta ao estado "Caixa fechado" com Toast "Caixa fechado."; erro inline; botão **Fechar caixa** só com caixa aberto. Contrato (endpoint, corpo, retorno) confirmado com o backend e refletido em `caixa.ts` e no `techspec.md`.

- [x] T19 — Build da Fase D
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam.

## Fase E — Verificação e fechamento

- [ ] T20 — Verificação manual
  - Arquivos: —
  - Pronto quando: conferido em **empresa de teste**, em desktop e 375 px, claro e escuro: caixa fechado → abrir (fundo 0 e com valor; erro ao abrir com caixa já aberto); cards e turno batem com `/Caixa/saldo` e `/Caixa/turno`; sangria (motivo vazio, valor acima do disponível, válida); passagem de turno com outro usuário real (valor inicial vazio e preenchido; passar para si mesmo mostra o erro); fechamento e resumo com diferenças; histórico em ordem do mais antigo ao mais recente com diferenças destacadas; 403 e falha de rede com dados preservados nos modais; teclado (`Esc`, foco devolvido ao botão de origem) e leitor de tela (título do modal, erros).

- [ ] T21 — Fechamento da feature
  - Arquivos: `docs/specs/caixa/tasks.md`, `docs/specs/caixa/prd.md`, `docs/specs/caixa/techspec.md`
  - Pronto quando: `npm run lint` e `npm run build` passam; critérios de aceite RF-01 a RF-10 do `prd.md` conferidos; itens `[A DEFINIR]` (corpo de abrir, fechamento, `status`) resolvidos e refletidos nos documentos; `docs/specs/input.md` sem os tokens Bearer reais antes de qualquer commit.
