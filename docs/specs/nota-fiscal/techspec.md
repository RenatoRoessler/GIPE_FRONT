# Tech Spec: Nota Fiscal

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e registra as decisões de componente)
- Modelos a seguir: as listas de Mensalistas (`src/components/mensalistas`), o `TipoModal` (modal com formulário) e o recibo público (`src/components/veiculos/ReciboPublico`)

## Design
- Telas/estados: os de `design.md` (tela com duas abas, filtro de período em Lançadas, modal com formulário e confirmação, botões nos dois recibos).
- Componentes do design system reaproveitados: `Tabs`, `Table`, `Modal`, `Input`, `Button`, `ErrorBanner`, `Skeleton`, `StatusBadge`, `Toast`, `Text`, `PlateDisplay`, `ConfirmDialog`, e de Mensalistas `ListError`, `EmptyState`, `TableArea`, `SkeletonRows`, `Toolbar`, `Primary`.
- Componentes novos necessários (em `src/components/notas`): `NotasFiscaisPage`, `NotasList`, `FiltroPeriodo` e `NotaFiscalModal`.
- Tokens de tema usados/criados: nenhum novo.

## Arquitetura da solução

### Tipos (`src/types/notaFiscal.ts`)
- `NotaFiscal`: o que as listas devolvem. **[A CONFIRMAR]** o formato: o exemplo não traz a resposta. Campos previstos, todos opcionais, lidos de forma tolerante: `notaFiscalId`, `valor`, `dataSolicitacao`, `dataLancamento`, `documento`, `email`, `placa`. A tela mostra só as colunas para as quais houver dado.
- `SolicitarNotaPayload`: `{ token: string; documento?: string; email: string; valor: number }`.
- `NotaSolicitada`: `{ notaFiscalId: number; valor: number; dataSolicitacao: string }` (resposta do contrato).

### API (`src/lib/api/services/notaFiscal.ts`)
- `listNotasPendentes()`: `GET /nota-fiscal/pendentes`.
- `listNotasLancadas({ dataInicio, dataFim })`: `GET /nota-fiscal/lancadas` com datas no formato do exemplo (`2026/10/01`) **[A CONFIRMAR]** se aceita também ISO.
- `solicitarNotaFiscal(payload)`: `POST /nota-fiscal/cliente/solicitar` (público, sem login). Remove `documento` do corpo quando vazio e envia só dígitos; `valor` com até 2 casas.
- Mapeador `fromNotaResponse(dto)` tolerante a campos ausentes; teste do serviço com os três endpoints, o formato das datas e o corpo.

### Validação (`src/lib/schemas/notaFiscal.ts`)
- `solicitarNotaSchema` (zod): `email` obrigatório, aparado, formato válido, até 150 caracteres; `pessoaJuridica` (boolean, desmarcado = pessoa física); `documento` validado em conjunto com ele (`superRefine`): pessoa física aceita vazio ou CPF válido ("CPF inválido"); pessoa jurídica exige CNPJ válido, inclusive o alfanumérico ("Informe o CNPJ" / "CNPJ inválido"). O `valor` não faz parte do formulário e o tipo de pessoa não vai no corpo do POST (só o `documento`).

### Tela da empresa
- `src/app/(app)/notas-fiscais/page.tsx` (Server Component, `metadata` "Notas Fiscais — GIPE", `Suspense` por causa de `useSearchParams`).
- `src/components/notas/NotasFiscaisPage` (Client Component): `Tabs` com a aba na URL (`/notas-fiscais` = Pendentes e `?aba=lancadas`), reaproveitando o padrão de `aba.ts` de Mensalistas.
- `src/components/notas/useNotas.ts`: `useNotasPendentes()` e `useNotasLancadas(periodo)` com `useQuery` (`refetchOnWindowFocus: false`), chaves `NOTAS_PENDENTES_KEY` e `NOTAS_LANCADAS_KEY` (esta inclui o período).
- `src/components/notas/periodo.ts`: `mesAtual(hoje)`, `formatDataApi(data)`, `validarPeriodo(de, ate)`; testados com datas fixas.
- `NotasList` e `FiltroPeriodo`: carregando, vazio, erro (`ListError`, com 403 sem nova tentativa) e o resumo (contagem e total em reais); celular em cartões.
- Menu: `NAV_ITEMS` ganha `{ label: "Notas Fiscais", href: "/notas-fiscais", icon: "invoice" }` depois de Caixa; `NavIconId` ganha `"invoice"` e `NavIcons.tsx` ganha o ícone (traço 2,4). O acesso é decidido pelo back (403); o menu não filtra por perfil.

### Modal (`src/components/notas/NotaFiscalModal/`)
- Props: `{ token: string; valor: number; placa?: string | null; onClose: () => void; onSolicitada: (nota: NotaSolicitada) => void }`.
- Formulário com `useAppForm` e `solicitarNotaSchema` (como o `TipoModal`), `useMutation` para `solicitarNotaFiscal`; estado "confirmação" substitui o formulário em caso de sucesso (`onSolicitada` avisa quem abriu).
- Erros: `rate_limited` → mensagem de limite; `validation` com texto de "já solicitada" (detecção por mensagem, como a duplicidade do `TipoModal`, **[A CONFIRMAR]** se há código) → banner e botão Fechar, e `onSolicitada` não é chamado; demais erros → banner com o motivo e formulário preservado.
- Fechar com dados digitados pede confirmação (`ConfirmDialog`).

### Pontos de entrada
- `ReciboSaidaStep` (Client): botão **Gerar nota fiscal** ao lado de Imprimir/Concluir quando `saida.tokenRecibo` existir e a saída tiver cobrança (`!consulta.mensalista` e `saida.valor > 0`); abre o `NotaFiscalModal` com `token = saida.tokenRecibo`, `valor = saida.valor` e `placa`. Estado local `notaSolicitada` troca o botão pelo texto "Nota fiscal solicitada". Invalida `NOTAS_PENDENTES_KEY` ao solicitar. O botão não entra no nó de impressão.
- `ReciboPublico` (Client): terceiro botão **Solicitar nota** na linha de ações quando `!notaFiscalSolicitada`, a saída tem cobrança e `valorDoRecibo(recibo.valor) > 0`; abre o modal com `token = recibo.token` e `valor = valorDoRecibo(recibo.valor)`. Ao solicitar, atualiza o cache da consulta do recibo (`notaFiscalSolicitada: true`), o que some com o botão e mostra a nota de rodapé. Fora da impressão (`ReciboActions` já é escondido).

### Server vs Client
Rota `page.tsx`: Server Component. Páginas, listas, modal e os dois pontos de entrada: Client Components (consultas, formulário, estado).

## Decisões técnicas e trade-offs
- **Um modal só**, no `src/components/notas`, usado pela tela do operador e pela página pública, sem depender de contexto de login: o corpo do POST é o mesmo e o back decide.
- **Valor fora do formulário:** o back exige igualdade com o valor do recibo; o modal só exibe e envia o valor recebido por prop, para o usuário nunca poder divergir.
- **Leitura tolerante das listas:** o formato está pendente; um mapeador isola o contrato e as colunas aparecem conforme os dados, em vez de quebrar.
- **Aba na URL, período em estado:** o filtro é de uso curto e o endereço não precisa guardá-lo; a aba fica na URL por padrão do sistema. Se pedirem compartilhar o período, passa-se para a URL.
- **Item de menu para todos, acesso no back:** é o que as telas administrativas fazem hoje; filtrar o menu por perfil é outra mudança.
- **Sem paginação:** os endpoints do exemplo não paginam; reavaliar se o volume crescer.

## Desvios na implementação
- Os auxiliares de período ficaram em `src/lib/periodoNotas.ts` (e não em `src/components/notas`), porque o serviço de API os usa e `lib` não deve importar de `components`.
- A tela de notas tem a própria moldura e linha de tabela (`NotasTabela` e `NotaRow`) em vez de reaproveitar as de Mensalistas: a tabela comum só vira cartão abaixo de 480px e entre 480 e 767px ficava cortada. Aqui, abaixo de `md` cada nota vira um cartão (cliente em cima, data e valor embaixo, com rótulos).
- O botão **Filtrar** usa a cor principal: na variante secundária ele ficava da mesma cor do fundo da página.
- O formulário do modal tem um botão de envio invisível dentro dele, para o Enter enviar (o botão visível fica no rodapé do modal, fora do `<form>`).
- `formatPlacaExibicao` foi acrescentada a `src/lib/placa.ts` para mostrar "Saída de ABC-1234" no modal e a placa nas listas.
- As chaves das consultas (`NOTAS_PENDENTES_KEY`, `NOTAS_LANCADAS_KEY`) ficaram em `src/components/notas/notasKeys.ts`, para o recibo da saída invalidar as pendentes sem importar a tela.

## Riscos / pontos de atenção
- **Contrato não confirmado:** formato das respostas de pendentes e lançadas; formato aceito das datas de `lancadas`; como a mensagem de "já solicitada" chega (código ou texto).
- **Código do recibo na saída:** o botão do operador depende de `tokenRecibo` na resposta que registra a saída (pendência já conhecida com o back).
- **Limite de 10 solicitações por minuto por IP:** vários clientes atrás da mesma rede do estacionamento podem esbarrar; a mensagem orienta tentar de novo e o formulário é preservado.
- **Dados pessoais** (documento e e-mail) em tela e no corpo do POST: só na tela de notas, para quem tem acesso; nunca em logs, no cache além da sessão ou no PDF do recibo.
- **Dois modais empilhados** (o modal de saída e o de nota): o `<dialog>` aninhado devolve o foco ao botão de origem; conferir no navegador, em especial no celular.
- **Página pública sem sessão:** o POST não deve disparar o redirecionamento ao login quando o back devolver 401; conferir o tratamento do cliente HTTP nesse caso.
- **Testes existentes** que contam os itens do menu (`nav.test.ts`, `BottomNav.test.tsx`) mudam de 10 para 11.
- **Token real no `input.md`:** não copiar para código, testes ou specs; recomenda-se revogá-lo.

## Fora de escopo técnico
- Lançar, cancelar ou editar notas dentro do sistema; baixar ou enviar o arquivo da nota.
- Paginação, exportação e relatórios.
- Filtrar o menu por perfil.
- Notas para saídas sem cobrança.
