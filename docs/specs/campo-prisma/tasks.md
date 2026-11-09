# Tasks: Campo prisma na entrada de veículos

Referências: ./prd.md, ./techspec.md, ./design.md

Antes de T5, T8 e T9, confirmar com o back o contrato do prisma (techspec, "Contrato da API"): campo `prisma` numérico na entrada e na listagem do pátio, e a rota de edição (assumida `PUT /Patio/{id}/prisma` com `{ prisma: número | null }`). T1 a T4 não dependem disso.

- [x] T1 — Regra do prisma (1 a 999) num só lugar
  - Arquivos: `src/lib/prisma.ts` (novo), `src/lib/prisma.test.ts` (novo)
  - Pronto quando: existem `PRISMA_MIN = 1`, `PRISMA_MAX = 999`, `PRISMA_DIGITOS = 3`, `somenteDigitosDoPrisma`, `prismaDoTexto` e as mensagens "Informe o prisma (de 1 a 999)" e "Use um número de 1 a 999"; testes cobrem vazio, 0, 1, 999, 1000, decimais, texto, zeros à esquerda ("007" vira 7) e corte em 3 dígitos.

- [x] T2 — Schemas da entrada com o prisma inteiro
  - Arquivos: `src/lib/schemas/regrasEntrada.ts`, `src/lib/schemas/veiculo.ts`, `src/lib/schemas/conferenciaPatio.ts`, `src/lib/schemas/prisma.ts` (novo) e os testes `regrasEntrada`/`veiculo`/`conferenciaPatio`/`prisma`
  - Pronto quando: o `PRISMA_MAX = 20` e o texto livre saem de `regrasEntrada.ts`; `camposDaEntrada` aceita só dígitos de 1 a 999 (fora disso, a mensagem do intervalo) e exige o valor quando `prismaExigido`; `criarPrismaEdicaoSchema({ mensalista })` exige o valor fora de mensalista e aceita vazio para mensalista; testes cobrem cada combinação e os que já existiam seguem passando.

- [x] T3 — Campo `PrismaField` dos formulários
  - Arquivos: `src/components/veiculos/PrismaField/` (novo: componente, teste, `index.ts`), `src/components/form/form.ts`
  - Pronto quando: `PrismaField` é registrado em `fieldComponents`; renderiza o `Input` com rótulo "Prisma", apoio "Número de 1 a 999.", `inputMode="numeric"`, máximo de 3 caracteres e `TECLADO_INTEIRO`; descarta caracteres que não são dígitos ao digitar; mostra o erro depois do blur com `aria-invalid`; testes cobrem digitação, descarte de letras, apoio e erro.

- [x] T4 — Prisma nos formulários de entrada (pátio e conferência)
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx` e teste, `src/components/conferencia/RegistrarEntradaConferenciaModal/RegistrarEntradaConferenciaModal.tsx` e teste, `src/lib/schemas/conferenciaPatio.ts`
  - Pronto quando: os dois modais usam `field.PrismaField` no lugar do campo de texto; o campo continua só aparecendo com a empresa usando o prisma e fora de mensalista; o rodapé segue dizendo "Falta: prisma."; valores como 0 e 1000 são recusados com a mensagem; testes atualizados passam.

- [x] T5 — Envio do prisma como número na entrada
  - Arquivos: `src/types/veiculo.ts`, `src/types/conferenciaPatio.ts`, `src/lib/schemas/conferenciaPatio.ts`, `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx`, testes de `registrarEntrada` e dos dois modais
  - Pronto quando: `EntradaPayload.prisma?: number`, `EntradaConferenciaPayload.prisma?: number` e `EntradaRegistrada.prisma?: number | null`; os dois envios mandam o número (via `prismaDoTexto`) só quando o campo está ativo, preenchido e fora de mensalista; testes verificam `prisma: 45` (número) e a ausência da chave nos outros casos.

- [x] T6 — Prisma no veículo do pátio
  - Arquivos: `src/types/patio.ts`, `src/lib/api/services/patio.ts`, `patio.list.test.ts`, `patio.test.ts`, fixtures e testes que montam `PatioVeiculo`
  - Pronto quando: `PatioVeiculo.prisma: number | null`; `fromPatioResponse` aceita só inteiro de 1 a 999 e usa `null` para ausente ou fora do intervalo, sem quebrar a lista; todos os fixtures compilam e testes cobrem presente, ausente e inválido; `npx tsc --noEmit` passa.

- [x] T7 — Serviço de edição do prisma
  - Arquivos: `src/lib/api/services/patio.ts`, `src/lib/api/services/patio.test.ts`
  - Pronto quando: `atualizarPrisma(patioId, prisma)` chama a rota confirmada (assumida `PUT /Patio/{id}/prisma` com `{ prisma }`); `not_found` vira `ApiError("not_found", "O veículo não está no pátio.", 404)`; os outros erros sobem como `ApiError`; testes cobrem envio de número, envio de `null`, `not_found` e erro de validação.

- [x] T8 — Modal de edição do prisma
  - Arquivos: `src/components/patio/EditarPrismaModal/` (novo: componente, estilos se precisar, teste, `index.ts`)
  - Pronto quando: modal pequeno "Prisma · {placa}" com o `PrismaField` já preenchido com o valor atual e foco no campo; Salvar desabilitado se inválido ou igual ao atual; Enter salva; "Salvando…" trava campo e botões; no sucesso invalida `PATIO_QUERY_KEY`, avisa quem abriu e fecha; no erro mostra `ErrorBanner` `role="alert"` mantendo o valor; com `not_found` mostra "Este carro não está mais no pátio." só com Fechar; mensalista pode apagar o valor; testes cobrem cada estado.

- [x] T9 — Item Prisma no ticket do pátio
  - Arquivos: `src/components/patio/TicketView/TicketItens.tsx`, `src/components/patio/TicketView/TicketView.tsx`, testes de ambos
  - Pronto quando: o item "Prisma" aparece entre "Registrado por" e "Quadro de chaves" quando a empresa usa o prisma ou o veículo já tem um; mostra o número em fonte mono ou "—"; o link "Alterar" (com valor) ou "Informar" (sem valor) só aparece com a empresa usando o prisma e tem `aria-label` com a placa; o link abre o `EditarPrismaModal`; a atualização da lista fica pausada com o modal aberto; ao salvar aparece o aviso "Prisma atualizado."; testes cobrem os casos.

- [ ] T10 — Revisão visual e de acessibilidade
  - Arquivos: entrada do pátio, entrada da conferência e ticket do pátio
  - Pronto quando: conferido em 360×640, 768×1024 e 1280×800, nos temas claro e escuro, sem rolagem horizontal, alvos de toque de pelo menos 44px, foco visível, foco devolvido ao link "Alterar" ao fechar o modal e erros anunciados (`role="alert"`); sem cor, espaçamento ou fonte fora do tema.
  - Situação: pendente. Exige a sessão logada (as telas são protegidas) e a conta de teste não foi fornecida. Estados e acessibilidade (rótulo, `aria-describedby`, `aria-invalid`, `role="alert"`) estão cobertos por testes.

- [ ] T11 — Validação final
  - Arquivos: todos os acima
  - Pronto quando: `npm run lint`, `npx tsc --noEmit`, `npm test` e `npm run build` passam; os critérios de aceite do `prd.md` estão marcados `[x]`, e os que dependem do back (rota de edição, campo na listagem) ficam anotados com o motivo.
  - Situação: parcial. Lint (0 erros), `tsc` e build passam. Nos testes, 3 falhas antigas e alheias à feature: o link "Ir para o início" aponta para `/` e os testes esperam `/dashboard` (CaixaPage, MinhaEmpresa e UsuariosList). Dependem do back, ainda sem confirmação: o campo `prisma` na entrada e na listagem do pátio e a rota de edição (assumida `PUT /Patio/{id}/prisma`). Faltam T10 e essa confirmação.
