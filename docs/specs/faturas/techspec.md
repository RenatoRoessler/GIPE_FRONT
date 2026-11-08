# Tech Spec: Módulo de Faturas

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e registra as decisões de componente)
- Contrato da API: `docs/specs/input.md` (POST/GET `/api/v1/Fatura`, GET `/Fatura/{id}`, pagar e cancelar)

> Convenções: segue `CLAUDE.md` e os padrões de Financeiro e Empresas conveniadas (tipos em `src/types`, serviços e mappers em `src/lib/api/services`, schemas em `src/lib/schemas`, componentes em `src/components/<feature>`, TanStack Query para dados). A versão do Next.js do projeto tem diferenças de API: nas rotas dinâmicas `params` é uma `Promise`, como em `caixa/historico/[caixaId]/page.tsx`.

## Design
- **Telas/estados:** lista (`/faturas`), detalhe (`/faturas/[id]`), modal de emissão, modal de pagamento e diálogo de cancelamento, com os estados do `design.md`.
- **Componentes do design system reaproveitados:** `Table`, `StatusBadge`, `OptionGroup`, `Select`, `Pagination`, `Modal`, `Button`, `Input`, `Text`, `Skeleton`, `ErrorBanner`, `InfoCard`, `Toast`, `BackButton`, `PlateDisplay`, `StageTrack` (ver decisão 6). Hooks: `useToast`. Formatadores: `formatBRL`/`parseMoney`/`maskMoney` (`lib/money`), `parseApiDate` (`lib/date`), `formatDataBr`/`formatarMinutos`/`rotuloCategoria` já existentes.
- **Componentes novos de `ui`:** `Textarea` (campo de várias linhas com rótulo, erro e contador). Não existe hoje e a observação aceita 500 caracteres; reaproveita `Field`, `Label` e `ErrorText` de `Input.styles`.
- **Componentes novos de feature (`src/components/faturas`):** `FaturasPage`, `FaturasLista`, `FaturaDetalhe`, `ItensFatura`, `CicloFatura`, `EmitirFaturaModal`, `PagarFaturaModal`, `CancelarFaturaDialog`.
- **Tokens de tema:** só os existentes. Nenhum token novo.

## Arquitetura da solução

### Estrutura de pastas

```
src/
├── app/(app)/faturas/
│   ├── page.tsx                       # Server: metadata + <FaturasPage /> em Suspense
│   └── [id]/page.tsx                  # Server: valida o id, <FaturaDetalhe id={...} />
├── components/faturas/
│   ├── FaturasPage/                   # Client: cabeçalho, filtros, lista, modal de emitir, toast
│   ├── FaturasLista/                  # Client: Table + estados (carregando, vazio, erro, 403) + Pagination
│   ├── FaturaDetalhe/                 # Client: herói, ações, ciclo, itens, modais; estados do detalhe
│   ├── ItensFatura/                   # Client: Table das saídas + rodapé com total; aviso se cancelada
│   ├── CicloFatura/                   # Client: linha do tempo (emitida, aguardando, paga, cancelada)
│   ├── EmitirFaturaModal/             # Client: formulário (conveniada, vencimento, observação)
│   ├── PagarFaturaModal/              # Client: formulário (forma, valor pago, data)
│   ├── CancelarFaturaDialog/          # Client: Modal de confirmação com erro e travas
│   ├── Faturas.styles.ts
│   ├── situacao.ts                    # rótulo e tom do selo por situação; "podePagar/podeCancelar"
│   ├── format.ts                      # número "#12", regra da conveniada, mensagens de toast
│   ├── url.ts                         # filtros <-> query string
│   ├── queryKeys.ts
│   ├── useFaturas.ts
│   ├── useFatura.ts
│   └── useFaturaMutations.ts
├── components/ui/Textarea/            # Textarea.tsx, Textarea.test.tsx, index.ts
├── lib/
│   ├── api/services/fatura.ts         # chamadas à API
│   ├── api/services/fatura.mapper.ts  # DTO <-> tipos, payloads
│   ├── schemas/fatura.ts              # Zod: emitir e pagar
│   ├── permissoes.ts                  # + AREA.Faturas, padrão e rota
│   └── nav.ts                         # + item "Faturas" e ícone
├── components/layout/NavIcons/NavIcons.tsx   # + ícone "bill"
└── types/fatura.ts
```

Testes acompanham cada módulo (`*.test.ts(x)`), como no resto do projeto.

### Tipos (`src/types/fatura.ts`)

```ts
export const SITUACAO_FATURA = { Aberta: 1, Paga: 2, Cancelada: 3 } as const;
export type SituacaoFatura = (typeof SITUACAO_FATURA)[keyof typeof SITUACAO_FATURA];

// GET /Fatura (itens da lista), e o campo `fatura` de POST e GET /Fatura/{id}.
export type Fatura = {
  convenioFaturaId: number;
  empresaConveniadaId: number;
  conveniada: string;
  quantidadeSaidas: number;
  valorTotal: number;                 // soma de valorConveniada das saídas
  vencimento: string;                 // "AAAA-MM-DD"
  situacao: number;                   // number para tolerar valor novo do back; SITUACAO_FATURA nomeia os conhecidos
  observacao: string | null;
  usuario: string | null;             // quem emitiu
  dataCriacao: string;                // ISO sem fuso
  dataPagamento: string | null;
  formaPagamento: FormaPagamentoId | null;
  valorPago: number | null;
  usuarioPagamento: string | null;
  dataCancelamento: string | null;
  usuarioCancelamento: string | null;
};

// Saída incluída na fatura.
export type FaturaItem = {
  patioConvenioId: number;
  placa: string;
  modelo: string | null;
  categoria: number;
  dataEntrada: string;
  dataSaida: string;
  minutosPermanencia: number;
  rotatividade: string | null;        // tabela de convênio usada
  percentualConveniada: number | null;
  valorFixoConveniada: number | null;
  valorTotal: number;
  valorConveniada: number;
  valorCliente: number;
};

export type FaturaDetalhe = { fatura: Fatura; itens: FaturaItem[] };

export type FaturaFiltros = {
  empresaConveniadaId: number | null;
  situacao: SituacaoFatura | null;
  pagina: number;
};

// Valores dos formulários (strings, como digitadas)
export type EmitirFaturaValues = { empresaConveniadaId: string; vencimento: string; observacao: string };
export type PagarFaturaValues = { formaPagamento: string; valorPago: string; dataPagamento: string };
```

O GUID (`convenioFaturaGuid`), os ids de usuário e o `empresaId` do estacionamento não entram nos tipos: a tela não os usa nesta versão. O `dataValidacao` e o `usuarioConveniada` dos itens também ficam de fora pelo mesmo motivo.

### Serviço (`lib/api/services/fatura.ts`)

```ts
export const FATURAS_POR_PAGINA = 20;

emitirFatura(values: EmitirFaturaValues): Promise<FaturaDetalhe>
// POST /Fatura  { empresaConveniadaId, vencimento, observacao? }   (observação vazia não vai)

listFaturas(filtros: FaturaFiltros, tamanhoPagina = FATURAS_POR_PAGINA): Promise<Paginado<Fatura>>
// GET /Fatura   params: empresaConveniadaId?, situacao?, pagina, tamanhoPagina (só os preenchidos)

getFatura(id: number): Promise<FaturaDetalhe>
// GET /Fatura/{id}

pagarFatura(id: number, values: PagarFaturaValues, hoje: string): Promise<void>
// PUT /Fatura/{id}/pagar  { formaPagamento, valorPago?, dataPagamento? }

cancelarFatura(id: number): Promise<void>
// PUT /Fatura/{id}/cancelar  (sem corpo)
```

- **Verbos e caminho do pagamento** não constam no pedido (o texto de "pagar" vem sem caminho, e o de "cancelar" sem verbo). Assumo `PUT .../pagar` e `PUT .../cancelar`, por analogia com `PUT /Financeiro/lancamento/{id}/cancelar`. Ficam em um único lugar (`fatura.ts`) e a task de serviço confirma contra o Swagger do back antes de seguir.
- As respostas de pagar e cancelar são ignoradas: depois delas a tela refaz a consulta (ver "Fluxo de dados"), então não depende do formato do retorno.
- Datas vão como `AAAA-MM-DD` (o back lê "01/10/2026" como mês/dia, como em Financeiro). `dataPagamento` igual a hoje **não é enviada**, para valer "agora" (o back grava hora e minuto) em vez da meia-noite; só datas anteriores a hoje vão no corpo. `valorPago` vazio não é enviado (valor total).
- Erros sobem como `ApiError` (`client.ts`); a mensagem de regra de negócio (400) vem do back.

### Mapper (`fatura.mapper.ts`)

`fromFaturaResponse`, `fromFaturaItemResponse` e `fromFaturaDetalheResponse` fazem leitura tolerante (campo ausente ou fora do formato nunca vira `NaN`), reaproveitando `toNumber`/`toText` de `mapperUtils`. `vencimento` é cortado em 10 caracteres. `itens` ausente vira lista vazia (a resposta de cancelamento e a lista não trazem itens). `toEmitirPayload(values)` e `toPagarPayload(values, hoje)` montam os corpos e aplicam as regras de omissão acima.

### Schemas (`lib/schemas/fatura.ts`)

Zod, mensagens no padrão de `schemas/financeiro.ts` (reaproveita `parseMoney` e a regra de até duas casas):
- `createEmitirFaturaSchema({ hoje })`: `empresaConveniadaId` obrigatório ("Escolha a conveniada."), `vencimento` obrigatório e `>= hoje` ("Informe o vencimento." / "O vencimento não pode ser antes de hoje."), `observacao` com até 500 caracteres ("Máximo de 500 caracteres.").
- `createPagarFaturaSchema({ hoje })`: `formaPagamento` obrigatória ("Escolha a forma de pagamento."), `valorPago` opcional e, se preenchido, maior que zero com até 2 casas ("O valor pago precisa ser maior que zero."), `dataPagamento` opcional e `<= hoje` ("A data não pode ser depois de hoje.").
- `hoje` vem de fora (`"AAAA-MM-DD"` local) para o teste não depender do relógio, como em `createLancamentoSchema`.

### Dados e cache

- `queryKeys.ts`: `FATURAS_KEY = ["faturas"]`; `faturasKey(filtros)` e `faturaKey(id)` sob esse prefixo. Invalidar o prefixo atualiza lista e detalhe de uma vez.
- `useFaturas(filtros)`: `useQuery` com `placeholderData: keepPreviousData` e `refetchOnWindowFocus: false` (estado "atualizando" da lista), igual a `useLancamentos`.
- `useFatura(id)`: `useQuery` do detalhe, `refetchOnWindowFocus: false`.
- `useFaturaMutations()`: `emitir`, `pagar` e `cancelar` com `retry: false` (sem idempotência: repetir emitiria duas faturas ou pagaria duas vezes). Todas invalidam `FATURAS_KEY` em `onSuccess`. A emissão devolve o detalhe e a tela usa o `convenioFaturaId` para navegar.
- Conveniadas do filtro e do modal: reaproveita `useConveniadas("todos")`, que traz as de convênio encerrado também. Opção do select: `nomeExibido(conveniada)`, com " (encerrado)" quando `ativo` for falso; valor: `empresaConveniadaId`.

### Filtros na URL (`url.ts`)

Funções puras, testadas: `parseFiltros(searchParams)` e `filtrosUrl(filtros)` sobre `?conveniada=53&situacao=aberta&pagina=2`. Situação: `aberta|paga|cancelada` (outro valor vira sem filtro); `conveniada` e `pagina` inválidos viram nulo e 1. Padrões não vão para a URL. Trocar um filtro volta à página 1 e usa `router.replace`. Para o "Voltar para faturas" do detalhe manter os filtros, usa-se `router.back()` quando houver histórico e um link para `/faturas` quando não houver; a task do detalhe segue o padrão já usado em `ExtratoCaixaPage`.

### Fluxo das ações

- **Emitir:** `EmitirFaturaModal` valida pelo schema; `emitir.mutate`; em sucesso fecha o modal, mostra o `Toast` ("Fatura emitida: N saídas, R$ x,xx.", montado por `format.ts`) e faz `router.push("/faturas/{id}")`. O toast atravessa a navegação como em Conveniadas (`?emitida=1` lido uma vez e limpo; a task escolhe conforme o padrão já existente de `NovaEmpresa`/`EmpresaCriada`). Erro (inclusive "sem saídas a faturar") fica em `ErrorBanner` dentro do modal, que continua aberto com os dados digitados.
- **Pagar:** `PagarFaturaModal` recebe a `Fatura`; valida; `pagar.mutate`; em sucesso fecha e mostra "Pagamento registrado." O detalhe se atualiza porque a consulta foi invalidada. O aviso de valor diferente do total é calculado no render a partir do texto digitado, sem bloquear.
- **Cancelar:** `CancelarFaturaDialog` usa `Modal` diretamente (como `CancelarLancamentoDialog`), e não o `ConfirmDialog`, porque precisa mostrar o erro do back e travar a confirmação enquanto envia. Erro de validação do back (400) desabilita o botão de confirmar, como no cancelamento de lançamento.
- **Regras de visibilidade:** `situacao.ts` expõe `podePagar(fatura)` e `podeCancelar(fatura)` (ambas verdadeiras só para `Aberta`). A tela não oferece o botão quando falsas; o back continua sendo a autoridade (RF15, RF18).

### Permissões e navegação

- `permissoes.ts`: `AREA.Faturas = "faturas"`; `PERMISSOES_PADRAO[AREA.Faturas] = [Administrador, Gerente, Financeiro]`; `AREA_POR_ROTA` ganha `["/faturas", AREA.Faturas]`. Atualizar `permissoes.test.ts`. O `Record<Area, …>` faz o TypeScript apontar todo lugar que precisa tratar a área nova; rodar `tsc` e `lint`.
- `nav.ts`: `NavIconId` ganha `"bill"`; item `{ label: "Faturas", shortLabel: "Faturas", href: "/faturas", icon: "bill", area: AREA.Faturas }` logo depois de "Empresas conveniadas". `NAV_ITEMS` passa de 16 para 17 itens: atualizar `nav.test.ts` (lista de rótulos e contagens) e os testes de `BottomNav`/`SideNav` que dependam dela. O item não entra em `BARRA_FIXA` nem em `BAR_PRIORITY`: no celular fica no painel "Mais".
- `NavIcons.tsx`: ícone `bill` no mesmo traço dos demais.
- **RF2 (tela de permissões por módulo):** o front **não tem** essa tela hoje (o próprio `areasDoSistema.ts` a lista como ainda inexistente); a permissão por módulo chega do back em `PermissoesPorModulo`, indexada por `Area`. Registrar `AREA.Faturas` já faz o módulo respeitar uma sobrescrita da empresa; construir a tela está fora de escopo.

### Server vs Client

| Peça | Tipo | Motivo |
|---|---|---|
| `app/(app)/faturas/page.tsx` e `[id]/page.tsx` | Server | Só `metadata` e composição; a lista usa `<Suspense>` por causa de `useSearchParams`; o `[id]` valida o parâmetro (`notFound()` se não for número) e passa o número. |
| `FaturasPage`, `FaturasLista`, `FaturaDetalhe`, `ItensFatura`, `CicloFatura` e os modais | Client | TanStack Query, URL, estado de modal e toast, formulários. |
| `Textarea` | Client | Segue os demais campos de `ui` (`"use client"`). |
| `situacao.ts`, `format.ts`, `url.ts`, `queryKeys.ts`, mapper, schema | Módulos puros | Testáveis sem React. |

### Formulários

`useAppForm` (TanStack Form) com validação pelo schema Zod, no padrão de `LancamentoForm`/`useEmpresaForms`. Valor monetário com `maskMoney` e `parseMoney`. Datas com `Input type="date"`; `hoje` calculado uma vez na montagem do modal. Contador da observação no `Textarea` (prop `maxLength`/`counter`).

## Decisões técnicas e trade-offs

1. **Rotas separadas, não abas.** Lista e detalhe têm propósitos diferentes e o detalhe precisa de link direto; segue Empresas conveniadas e Preços (`/precos/[id]`). Custo: o toast da emissão atravessa a navegação.
2. **Modais para emitir e pagar, página para o detalhe**, como definido no design: poucos campos, sem perder o contexto da lista ou do detalhe.
3. **Sem tela de preview da emissão.** O pedido não traz endpoint para consultar as saídas elegíveis antes de emitir; o modal só explica a regra (RF5) e o back responde com o resultado ou com o erro de "sem saídas".
4. **`Textarea` novo em `ui`** em vez de `Input` de uma linha: 500 caracteres em uma linha é ruim em celular, e o campo é reaproveitável. Escopo mínimo (rótulo, erro, contador), sem variantes.
5. **`CancelarFaturaDialog` com `Modal`, não `ConfirmDialog`**, pelo mesmo motivo do cancelamento de lançamento (erro do back e trava).
6. **`CicloFatura` e `StageTrack`:** o `StageTrack` mostra estados de uma trilha horizontal e não carrega data nem nome de quem agiu. O ciclo da fatura precisa de texto por passo (quem, quando, forma e valor). Decisão: lista vertical própria e pequena em `CicloFatura`, sem reaproveitar o `StageTrack` e sem criar componente genérico de linha do tempo antes de haver um segundo uso.
7. **Respostas de pagar e cancelar ignoradas; refetch no lugar.** Evita depender de um formato que o pedido não mostra e garante o detalhe fiel ao back (incluindo `itens` vazio após cancelar).
8. **`dataPagamento` de hoje não é enviada**, para a hora do pagamento ser "agora" no back, que é o comportamento descrito para a data nula.
9. **Reaproveitar `useConveniadas("todos")`** em vez de uma consulta nova: a lista já traz as de convênio encerrado, que o PRD manda permitir.
10. **Aviso de valor pago diferente do total é só informativo**, até o ponto em aberto do PRD ser decidido; a regra de bloqueio, se houver, entra no schema sem mudar a tela.

## Riscos / pontos de atenção

- **Pagar e cancelar sem verbo/caminho confirmado.** Assumi `PUT`; se o back usar `POST`, o erro aparece no primeiro teste. A task de serviço confirma antes de seguir e os testes do serviço fixam o contrato.
- **Identificador da área no back.** Se o back não conhecer `"faturas"` como módulo, a sobrescrita por empresa não terá efeito e vale o padrão (Administrador, Gerente e Financeiro). Confirmar o identificador.
- **Formato de `situacao` e das datas.** A resposta traz `situacao` numérico e datas ISO sem fuso (vencimento com `T00:00:00`); o mapper corta o vencimento em `AAAA-MM-DD` e usa `parseApiDate` para as demais, evitando virar o dia por fuso.
- **Emissão sem idempotência.** Sem retry e com o botão desabilitado durante o envio; mesmo assim, dois toques muito rápidos em dispositivos lentos são cobertos só pelo estado `isPending`. Se o back devolver "sem saídas" na segunda tentativa, o usuário vê o erro e a fatura já existe na lista.
- **Valor pago diferente do total** sem regra definida no PRD: o back decide o resultado e a tela mostra o que ele aceitar.
- **`NAV_ITEMS` com 17 itens:** mexe em testes de `nav`, `BottomNav` e `SideNav` que contam ou listam itens; a task de navegação roda a suíte desses três.
- **Reuso do cache `["conveniadas"]`:** a lista inclui conveniadas sem o dado de fatura; não há acoplamento, mas uma conveniada nova só aparece no select depois que a consulta é refeita (sem `refetchOnWindowFocus`). Aceitável: o cadastro invalida `["conveniadas"]`.
- **Dados sensíveis no `input.md`:** o exemplo de `curl` contém um token de acesso completo. Substituir por um marcador antes de commitar o arquivo; não copiar o token para código, testes ou documentos.
- **Largura da tabela de saídas** (oito colunas) em tablet: a coluna da conveniada não pode sair da tela; a task de estilos valida em 768px e 1023px.

## Fora de escopo técnico
- Acesso da conveniada à fatura (link pelo GUID, portal, perfil de conveniada) e envio por e-mail ou mensagem.
- PDF, impressão e exportação da fatura.
- Escolher saídas específicas, editar a fatura emitida, pagamento em parcelas, juros, multa e marcação automática de vencida.
- Lançar o pagamento no caixa ou no fluxo do Financeiro.
- Tela de permissões por módulo (só registrar a área).
- Novos tokens de tema e qualquer mudança visual fora do módulo.
- Consulta de pré-visualização das saídas elegíveis antes de emitir (não há endpoint no pedido).

## Testes e verificação
- **Mapper e serviço** (`fatura.mapper.test.ts`, `fatura.test.ts`): resposta completa, campos ausentes, `itens` ausente, vencimento cortado, payloads (observação vazia e valor pago vazio omitidos, data de hoje omitida), e cada chamada com verbo, caminho e parâmetros certos.
- **Schemas** (`schemas/fatura.test.ts`): vencimento passado, observação com 501 caracteres, forma ausente, valor zero e com três casas, data futura.
- **Puros** (`situacao.test.ts`, `format.test.ts`, `url.test.ts`): rótulos e tons, `podePagar`/`podeCancelar`, regra da conveniada ("50%" e "R$ 12,00 fixo"), mensagens de toast, ida e volta da URL.
- **Componentes:** `FaturasLista` (carregando, lista, vazio com e sem filtro, erro, 403, paginação, linha leva ao detalhe), `EmitirFaturaModal` (validações, sucesso, erro sem saídas mantendo os dados), `PagarFaturaModal` (aviso de caixa sempre visível, aviso de valor diferente, validações), `CancelarFaturaDialog` (confirmação, erro e trava), `FaturaDetalhe` (aberta mostra os dois botões; paga e cancelada, nenhum; cancelada mostra o aviso no lugar da tabela; 404 e 403), `ItensFatura` (rodapé confere a soma), `CicloFatura` (três situações), `Textarea` (contador e erro).
- **Permissões e navegação:** `permissoes.test.ts` (perfis padrão, rota `/faturas` e `/faturas/12`, sobrescrita por módulo), `nav.test.ts` (item e contagem), e `BottomNav`/`SideNav` sem regressão.
- **Verificação manual** (skill `run`), 375px, 768px e 1280px, temas claro e escuro: emitir, pagar e cancelar de ponta a ponta contra o back local; tabela de saídas sem corte; modais em tela cheia no celular.
- `npm run lint` e `npm run build` antes de fechar.
