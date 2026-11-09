# Tech Spec: Campo prisma na entrada de veículos

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (resume e referencia `./design.md`, via skill claude-design)
- Feature anterior: `../config-entrada-empresa/` (criou a opção "Prisma obrigatório" e um campo de texto provisório)

## Ponto de partida no código
A feature de configuração deixou um prisma **provisório**: campo de texto livre, até 20 caracteres, marcado `[A CONFIRMAR]`. Esta feature o substitui pela regra real (inteiro de 1 a 999) e acrescenta a leitura e a edição no pátio. Pontos de contato existentes:
- `src/lib/schemas/regrasEntrada.ts`: `PRISMA_MAX = 20`, `camposDaEntrada` (prisma como `string`), `prismaExigido`.
- `src/lib/schemas/veiculo.ts` e `src/lib/schemas/conferenciaPatio.ts`: valores da entrada com `prisma: string`; `toEntradaConferenciaPayload` envia o texto.
- `src/types/veiculo.ts` (`EntradaPayload.prisma?: string`) e `src/types/conferenciaPatio.ts` (`EntradaConferenciaPayload.prisma?: string`).
- `EntradaVeiculoModal.tsx` e `RegistrarEntradaConferenciaModal.tsx`: `field.TextField label="Prisma" maxLength={PRISMA_MAX}`.
- `PatioVeiculo` (`src/types/patio.ts`) e `fromPatioResponse` (`src/lib/api/services/patio.ts`): **não** têm prisma.

## Contrato da API
Do `input.md`: prisma é um inteiro de 1 a 999, ativo só com `prisma = true` na configuração da empresa. O resto **não** está no `input.md` e precisa de confirmação com o back antes das tasks de serviço (T3, T7 e T8):
1. **Entrada** (`POST /Patio/entrada` e a entrada da conferência): campo `prisma` com número inteiro? (assumido). Resposta `EntradaRegistrada` devolve o prisma?
2. **Listagem do pátio** (`GET /Patio`): campo `prisma` (número ou nulo) em cada veículo? (assumido).
3. **Edição no pátio**: não há endpoint conhecido. Assumido `PUT /Patio/{patioId}/prisma` com corpo `{ prisma: number | null }` (`null` apaga, só para mensalista). Pode ser `PATCH`, outra rota ou outro formato.
4. Erros de validação do back (fora de 1 a 999, ausente quando exigido, veículo que saiu, **prisma já em uso** se o produto proibir repetição) chegam como `ApiError` de validação com a mensagem do back.

Enquanto o item 3 não estiver confirmado, a edição (T8 a T10) fica atrás do serviço assumido; o contrato é isolado em uma única função (`atualizarPrisma`), trocá-lo não mexe na interface.

## Design
- Telas/estados: o campo **Prisma** nos formulários de entrada (padrão, vazio obrigatório, fora de 1 a 999, válido, desabilitado enviando); o item **Prisma** no ticket do pátio (com valor, sem valor, só leitura quando a empresa não usa o prisma); e o modal **Prisma · {placa}** (padrão, inválido, salvando, sucesso, erro ao salvar, veículo já saiu). Detalhes em `design.md`.
- Componentes do design system reaproveitados: `Input` (via `TextField`), `Modal`, `Button`, `ErrorBanner`, `Toast`, `Text`; no ticket, `Item`, `Mono` e `LinkBotao` de `TicketView.styles.ts`.
- Componentes novos (de feature, não do design system):
  - `src/components/veiculos/PrismaField/` (campo dos dois formulários de entrada).
  - `src/components/patio/EditarPrismaModal/` (modal de edição, no padrão do `GuardarChaveModal`).
- Tokens de tema: nenhum novo.

## Arquitetura da solução

### Regra do prisma (um só lugar)
- `src/lib/prisma.ts` (novo): `PRISMA_MIN = 1`, `PRISMA_MAX = 999`, `PRISMA_DIGITOS = 3`, `somenteDigitosDoPrisma(texto)` (remove não dígitos e corta em 3), `prismaDoTexto(texto): number | null` (vazio → `null`; inteiro de 1 a 999 → número; senão `null`) e as mensagens `PRISMA_OBRIGATORIO_MESSAGE = "Informe o prisma (de 1 a 999)"` e `PRISMA_INTERVALO_MESSAGE = "Use um número de 1 a 999"`. Testes em `prisma.test.ts`.
- `src/lib/schemas/regrasEntrada.ts`: remove o `PRISMA_MAX = 20` e o texto livre. `camposDaEntrada` passa a usar um schema de string de dígitos (`/^\d*$/`, até 3) que, quando preenchido, exige inteiro de 1 a 999 (mensagem do intervalo) e, quando exigido (`prismaExigido`), recusa vazio. O valor do formulário continua `string` (o campo é um input), a conversão para número acontece no payload.
- `src/lib/schemas/prisma.ts` (novo): `criarPrismaEdicaoSchema({ mensalista })` para o modal de edição (mesmas regras: obrigatório fora de mensalista, 1 a 999). Teste ao lado.

### Camada de dados
- `src/types/patio.ts`: `PatioVeiculo.prisma: number | null` (obrigatório no tipo, `null` quando ausente). `fromPatioResponse` lê `raw.prisma` com `toNumber` e aceita só inteiro de 1 a 999 (valor fora disso vira `null`, sem derrubar a tela). Atualizar os fixtures e testes que montam `PatioVeiculo` (`patio.list.test.ts`, `patio.test.ts`, fixtures de `usePatio`, `TicketView`, etc.).
- `src/types/veiculo.ts`: `EntradaPayload.prisma?: number` (era `string`) e `EntradaRegistrada.prisma?: number | null`.
- `src/types/conferenciaPatio.ts`: `EntradaConferenciaPayload.prisma?: number`.
- `src/lib/schemas/conferenciaPatio.ts`: `toEntradaConferenciaPayload` envia `prisma: Number(...)` só quando preenchido e fora de mensalista. `EntradaVeiculoModal.tsx` faz o mesmo no `mutationFn` (hoje envia o texto).
- `src/lib/api/services/patio.ts`: nova `atualizarPrisma(patioId: number, prisma: number | null): Promise<void>` (`PUT /Patio/{id}/prisma`, assumido). `not_found` vira `ApiError("not_found", "O veículo não está no pátio.", 404)`, como `registrarSaida`. Teste em `patio.test.ts`.

### Entrada de veículos
- `src/components/veiculos/PrismaField/PrismaField.tsx` (novo, Client Component): usa `useFieldContext<string>()` do formulário; renderiza o `Input` com rótulo "Prisma", `hint="Número de 1 a 999."`, `inputMode="numeric"`, `maxLength={3}`, `teclado={TECLADO_INTEIRO}` e `format={somenteDigitosDoPrisma}` (mesmo padrão do "Código do ticket" na conferência). O erro aparece depois do blur ou da tentativa de envio, como nos outros campos.
- Registro como campo do formulário: `PrismaField` entra em `fieldComponents` de `src/components/form/form.ts` (como `StepperField`), e os dois modais trocam `field.TextField label="Prisma"` por `field.PrismaField`.
- `EntradaVeiculoModal.tsx` e `RegistrarEntradaConferenciaModal.tsx`: o rodapé de pendências continua dizendo "Falta: prisma."; o campo continua só aparecendo quando `prismaExigido(regras)`.

### Ticket do pátio
- `src/components/patio/TicketView/TicketItens.tsx`: novo item **Prisma** entre "Registrado por" e "Quadro de chaves". Props novas: `prismaAtivo: boolean` (a empresa usa o prisma) e `onEditarPrisma: () => void`. O item aparece se `prismaAtivo || veiculo.prisma !== null`; o link ("Alterar" / "Informar", `LinkBotao`) só se `prismaAtivo`. `aria-label` com a placa.
- `src/components/patio/TicketView/TicketView.tsx`: lê `useConfiguracao().configuracao.prisma` para `prismaAtivo`; novo estado `prismaDe: PatioVeiculo | null`; pausa a atualização da lista também com o modal aberto (`pausado: saida !== null || chaveDe !== null || prismaDe !== null`); renderiza `EditarPrismaModal` junto dos outros modais e mostra o aviso "Prisma atualizado." no `Toast` que já existe (`setAviso`).
- `src/components/patio/EditarPrismaModal/EditarPrismaModal.tsx` (novo, Client Component): `Modal` pequeno com TanStack Form (`useAppForm`) e o `PrismaField`; validação com `criarPrismaEdicaoSchema({ mensalista: veiculo.mensalista })`; `useMutation` chamando `atualizarPrisma`; no sucesso invalida `PATIO_QUERY_KEY` (a lista é a fonte do ticket), chama `onSalvo` e fecha. Estados do design: Salvar desabilitado se inválido ou igual ao atual, "Salvando…", `ErrorBanner` no erro mantendo o valor, e o estado "veículo já saiu" quando o erro é `not_found`. Enter salva (o campo está num `<form>`).

### Server vs Client
Tudo é Client Component (formulários, modal, hooks). Nenhuma página nova; `app/(app)/patio/[patioId]/page.tsx` não muda.

## Decisões técnicas e trade-offs
- **Regra do prisma isolada em `lib/prisma.ts`.** Entrada, conferência, edição e leitura do pátio leem os mesmos limites e mensagens; mudar o intervalo é uma linha. Alternativa descartada: espalhar `1` e `999` nos schemas.
- **Valor do formulário como `string`, payload como `number`.** Mantém o input controlado simples e deixa a conversão em um ponto (`prismaDoTexto`), evitando `NaN` e zeros à esquerda ("007" vira 7).
- **`PrismaField` como campo do formulário, não só estilo.** Os três formulários (pátio, conferência, edição) têm a mesma máscara, dica e teclado; sem o componente a configuração se repetiria três vezes.
- **Edição por modal a partir do ticket, no padrão da chave.** O usuário já conhece "valor + Alterar"; o modal evita um segundo estado de edição inline no ticket e reaproveita `Modal`, `Toast` e a pausa da atualização da lista.
- **O ticket lê a lista do pátio.** Não há consulta de ticket por id; invalidar `PATIO_QUERY_KEY` atualiza o valor mostrado e a lista de uma vez.
- **`prismaAtivo` vem da configuração, não do veículo.** O link some quando a empresa deixa de usar o prisma, mas o valor já gravado continua visível (não esconde dado que existe).
- **Sem unicidade no cliente.** Se o produto proibir repetir prisma, o back recusa e a mensagem aparece como erro; checar no cliente exigiria a lista do pátio e correria o risco de divergir do back.

## Riscos / pontos de atenção
- **Contrato da API não confirmado** (campo `prisma` na entrada, na lista do pátio e rota de edição). É o maior risco e bloqueia as tasks de serviço; o isolamento em `atualizarPrisma` e em `fromPatioResponse` limita o retrabalho.
- **Mudança de tipo `string` → `number` no payload** quebra os testes que verificam o envio de `prisma` (pátio e conferência); eles precisam ser atualizados junto.
- **`PatioVeiculo.prisma` obrigatório no tipo** exige atualizar todo fixture que monta um veículo; é mecânico, mas espalhado.
- **Corrida entre a edição e a saída:** o veículo pode sair enquanto o modal está aberto; o `not_found` do back vira o estado "já saiu".
- **Veículos antigos sem prisma** com a empresa exigindo o prisma: o ticket mostra "—" e "Informar"; nada os trava, porque a exigência vale só na entrada.
- **Prisma repetido:** depende da decisão do produto (questão em aberto do PRD); se for proibido, o back precisa recusar e a mensagem precisa ser legível.

## Fora de escopo técnico
- Editar outros dados do veículo no pátio.
- Unicidade do prisma no cliente e histórico de alterações.
- Mostrar o prisma no comprovante, no recibo ou na lista do pátio (só no ticket).
- Prisma de veículos que já saíram.
- Migrar valores que tenham sido gravados com o campo provisório de texto (a feature de configuração não foi usada em produção com ele).
