# Tech Spec: Pagamento do mensalista

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-10-21
**PRD:** ./prd.md
**Design:** ./design.md

> Convenções: segue o `CLAUDE.md` (Next.js App Router + TypeScript + styled-components; tipos em `src/types`, serviços em `src/lib/api/services`, componentes em `src/components/<feature>`, design system em `src/components/ui`). Antes de escrever código, ler o guia relevante em `node_modules/next/dist/docs/` (o `AGENTS.md` avisa que esta versão do Next tem mudanças incompatíveis), embora esta feature não toque em rotas nem em Server Components.
>
> **Limite desta spec:** o Swagger da API passou a exigir autenticação (`401` em `/swagger/v1/swagger.json`) e o token de `docs/specs/input.md` já expirou. Por isso, o contrato do pagamento abaixo vem **só do `input.md`**. O formato da resposta ("a cobrança paga e a próxima gerada") e as mensagens de erro são `[A CONFIRMAR]` e estão isolados no mapper e no classificador de erro, para trocar sem mexer em tela.

## Referências

- PRD: `./prd.md` (RF-01 a RF-06)
- Design: `./design.md`. A seção abaixo resume o que lá está decidido e não redefine nada.
- Base existente: `docs/specs/mensalistas-contrato/techspec.md` e `src/components/mensalistas/*`
- Padrão de pagamento no balcão: `src/components/veiculos/PagamentoSaida`, `src/lib/money.ts`, `src/types/caixa.ts` (`FORMA_PAGAMENTO`)

## O que o código atual resolve e o que não resolve

| Ponto | Situação no código | Consequência |
|---|---|---|
| **`empresaId` e `usuarioId` no corpo** | **O front não os conhece.** Só guarda o token no cookie `gipe_token` (`src/lib/auth.ts`); nenhum serviço atual envia esses ids (a empresa vem de uma claim `empresa_guid`, conforme `minha-empresa/techspec.md`), e a spec do caixa registra que "o front não conhece o `usuarioId` logado". O login só devolve `accessToken`. | **Bloqueio principal.** Precisa de uma fonte confiável dos dois ids numéricos (ver "Ids da sessão"). Não dá para pedir ao operador nem usar valor fixo (viola RNF de segurança do PRD). |
| Primeiro pagamento × aceite (RF-05) | `situacao` da listagem vale `"Aguardando Primeiro Pagamento"` só para inativo que nunca pagou; `precisaDoContrato` e `derivarSituacao` (`mensalistas/situacao.ts`) já dizem se o contrato está aceito. | Dá para decidir na tela se é o primeiro pagamento e se o aceite falta, sem endpoint novo. A API continua sendo a palavra final. |
| Existe cobrança pendente? (RF-01) | A listagem traz `dataProximoVencimento` e `diasAteProximoVencimento`, mas não diz se há cobrança pendente. | A tela não bloqueia por isso: oferece a ação e traduz o erro da API (design §1A). |
| Valor sugerido | `Mensalista.valorMensalidade` (valor do tipo). | O formulário vem com esse valor. Se a API passar a informar o valor da cobrança pendente, troca-se a fonte. |
| Atualização depois de pagar | Lista, contrato e tipos compartilham o prefixo `MENSALISTAS_QUERY_KEY` (`useTiposMensalidade.ts`); `useMensalistas` e `contratoQueryKey` o usam. | Um `invalidateQueries({ queryKey: MENSALISTAS_QUERY_KEY })` atualiza lista, situação e contratos. |
| Formas de pagamento | `FORMA_PAGAMENTO` (`types/caixa.ts`) já tem os seis códigos, **iguais** ao `EFormaPagamento` do `input.md` (1 Dinheiro, 2 PIX, 3 Débito, 4 Crédito, 5 Boleto, 6 Transferência) e `FORMA_PAGAMENTO_OPTIONS` os rotula. | Reutilizar, sem enum novo. |
| Formatação | `formatBRL`/`parseMoney` (`lib/money.ts`), `formatDate`/`parseApiDate`. | Reutilizar. |
| Erros | `normalizeError` já lê `detail`, `errors[]` e `erros[]` (entregue em `mensalistas-contrato`). | As mensagens de regra do back chegam à tela sem trabalho extra. |

## Design

- **Telas/estados:** conforme `design.md`.
  - (A) ficha do mensalista, com bloco "Pagamento" e botão "Registrar pagamento";
  - (B) lista, com o botão "Receber pagamento" nas linhas aguardando 1º pagamento e o ícone de pagamento nas demais;
  - (C) `PagamentoMensalistaModal`, com formulário e comprovante no mesmo modal.
- **Componentes do design system reaproveitados:** `Modal`, `Button`, `Input`, `OptionGroup`, `ErrorBanner`, `Toast`, `StageTrack`, `StatusBadge`, `Skeleton`, `Text`.
- **Componentes novos:** nenhum em `src/components/ui`. Em `src/components/mensalistas/`: `PagamentoMensalistaModal/` (+ `ComprovantePagamento`), `pagamento.ts` (regras puras) e `usePagamentoMensalista.ts`. Um ícone de pagamento junto dos ícones da lista.
- **Tokens:** nenhum token novo. Os usados estão em `design.md` §3.

## 1. Arquitetura da solução

```
src/
├── components/mensalistas/
│   ├── PagamentoMensalistaModal/
│   │   ├── PagamentoMensalistaModal.tsx          # Client: formulário (passo 1) + resultado (passo 2)
│   │   ├── PagamentoMensalistaModal.styles.ts
│   │   ├── PagamentoMensalistaModal.test.tsx
│   │   ├── ComprovantePagamento.tsx              # bloco de valor + próxima cobrança
│   │   └── index.ts
│   ├── pagamento.ts (+ .test.ts)                 # regras puras: podeRegistrarPagamento, rótulo do botão, vencimento explicado
│   ├── usePagamentoMensalista.ts (+ .test.tsx)   # mutation + invalidação + trava de envio duplo
│   ├── MensalistaFichaModal/MensalistaFichaModal.tsx   # + bloco Pagamento e botão no rodapé
│   ├── MensalistasList/MensalistasList.tsx             # + IconButton de pagamento; callback onReceberPagamento
│   ├── SituacaoMensalista/SituacaoMensalista.tsx       # + ação "Receber pagamento" (aguardando-pagamento)
│   └── MensalistasPage/MensalistasPage.tsx             # + ModalState { kind: "pagamento" }
├── lib/
│   ├── session.ts (+ .test.ts)                   # lê empresaId/usuarioId do token (ver "Ids da sessão")
│   ├── api/services/mensalista.ts                # + pagarMensalista
│   ├── api/services/mensalista.mapper.ts         # + toPagamentoPayload, fromPagamentoResponse
│   └── schemas/pagamento.ts (+ .test.ts)         # valor e forma
└── types/
    └── mensalista.ts                             # + PagamentoMensalista*, ORIGEM_PAGAMENTO
```

### Server × Client

| Peça | Tipo | Por quê |
|---|---|---|
| Todas as peças novas | **Client** | Formulário, mutation do React Query, foco/estado de modal e leitura do cookie do token. Já ficam dentro da árvore client de `MensalistasPage`. Nenhuma rota nova e nenhum Server Component. |

## 2. Tipos (`src/types/mensalista.ts`)

```ts
// EOrigemPagamento do back. Esta tela só registra pelo painel administrativo.
export const ORIGEM_PAGAMENTO = { Patio: 1, PainelAdministrativo: 2, WebHook: 3, Site: 4 } as const;

// Corpo do POST /Mensalista/pagamento
export type PagamentoMensalistaPayload = {
  empresaId: number;           // da sessão
  mensalistaId: number;
  valorPago: number;           // > 0, até 2 casas
  formaPagamento: FormaPagamentoId;
  origemPagamento: number;     // ORIGEM_PAGAMENTO.PainelAdministrativo
  usuarioId: number;           // da sessão
};

// Uma cobrança na resposta. [A CONFIRMAR] os nomes exatos dos campos; o mapper é tolerante.
export type CobrancaMensalista = {
  cobrancaId: number | null;
  valor: number;
  vencimento: string | null;   // data da cobrança
  dataPagamento: string | null;
  formaPagamento: FormaPagamentoId | null;
  status: number | null;       // 0 pendente, 1 pago
};

export type PagamentoMensalistaResultado = {
  paga: CobrancaMensalista;
  proxima: CobrancaMensalista | null;   // null se o back não devolver; a tela diz "Próxima cobrança gerada" sem valor
};

// Formulário
export type PagamentoFormValues = { valorPago: string; formaPagamento: string };
```

## 3. Contrato de API

Cliente: `api` de `src/lib/api/client.ts` (o token vai pelo interceptor).

| Método | Rota | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| POST | `/Mensalista/pagamento` | `PagamentoMensalistaPayload` | cobrança paga e próxima gerada `[A CONFIRMAR]` | 400 regra de negócio (sem cobrança pendente, contrato não aceito, empresa/usuário fora da empresa, valor inválido) · 401 · 403 · 404 mensalista não encontrado · 5xx |

A rota fica sob a `baseURL` (`.../api/v1`), então o serviço chama `"/Mensalista/pagamento"`, igual aos demais.

```ts
// src/lib/api/services/mensalista.ts
pagarMensalista(values: { mensalistaId: number; valorPago: number; formaPagamento: FormaPagamentoId }):
  Promise<PagamentoMensalistaResultado>
```

- O serviço lê `empresaId` e `usuarioId` da sessão (`getSessaoIds()`), monta o payload com `origemPagamento: ORIGEM_PAGAMENTO.PainelAdministrativo` e envia. **Quem chama não informa empresa, usuário nem origem** (RF-02, RNF de segurança).
- Sessão sem ids → `ApiError("unauthorized", "Sua sessão expirou. Entre novamente.")`, sem chamar a API.
- `valorPago` é enviado como `number` já arredondado a centavos (`Math.round(v * 100) / 100`), porque a validação do formulário já garante até 2 casas.
- `fromPagamentoResponse(data)`: lê `data.cobrancaPaga ?? data.paga ?? data.pagamento` e `data.proximaCobranca ?? data.proxima`, cada uma por `toCobranca(raw)`, com `Number()`/`textOrNull` e `?? null`. A lista de apelidos aceitos é uma constante única no mapper, a ser reduzida quando o formato real for conferido.
- **Sem chave de idempotência** (o `input.md` não prevê uma). Ver "Envio duplo".

### Ids da sessão (`src/lib/session.ts`)

```ts
export type SessaoIds = { empresaId: number; usuarioId: number };
export function getSessaoIds(): SessaoIds | null   // decodifica o payload do JWT do cookie, sem verificar assinatura
```

- Decodifica só o payload do token (`atob` do segmento central, base64url) e lê as claims numéricas. **Os nomes das claims são `[A CONFIRMAR]`** (a única conhecida é `empresa_guid`, que não serve): a lista de candidatas fica em constantes no topo do arquivo (`EMPRESA_ID_CLAIMS`, `USUARIO_ID_CLAIMS`), por exemplo `empresa_id`, `empresaId`, `nameid`, `sub`, `usuario_id`. A primeira que for inteiro positivo vale.
- Não valida assinatura: é só leitura de dado já presente no cookie do próprio usuário. **Quem garante a regra é o back**, que compara `empresaId` e `usuarioId` com a sessão (o `input.md` diz que `empresaId` "precisa ser a empresa selecionada no login").
- Nunca loga o token nem as claims.
- **Se o token não trouxer os ids numéricos**, o caminho é pedir ao back uma destas duas coisas (decisão fora do front): (a) expor os ids no JWT; ou (b) aceitar o pagamento sem `empresaId`/`usuarioId` no corpo, lendo-os do token. Em (b), `session.ts` sai e o serviço só deixa de enviar os dois campos. A task T1 decide isso antes de construir o resto.

### Classificação de erro (`pagamento.ts`)

```ts
type PagamentoErroKind = "contrato-nao-aceito" | "sem-cobranca" | "sessao" | "rede" | "generico";
classificarErroPagamento(error: unknown): { kind: PagamentoErroKind; message: string }
```

- `ApiError` com `kind` de rede/timeout → `rede`.
- 401/403 → `sessao`.
- 400 cuja mensagem casa com `/contrato|aceit/i` → `contrato-nao-aceito`.
- 400/404 cuja mensagem casa com `/pendente|cobran[cç]a/i` → `sem-cobranca`.
- Demais → `generico`, com a mensagem normalizada do back.
- Os padrões ficam num lugar só, testados com cada mensagem conhecida, e são o primeiro ponto a ajustar quando a validação contra a API real registrar o texto exato (mesma abordagem de `classifyContratoError`).

## 4. Validação (`src/lib/schemas/pagamento.ts`)

`pagamentoSchema` (Zod), usado com `useAppForm`, como `MensalistaModal`:

- `valorPago`: texto → `parseMoney`; erro se `NaN`, `<= 0` ou com mais de 2 casas (`Math.abs(v * 100 - Math.round(v * 100)) > 1e-6`). Mensagem: "Informe um valor maior que zero, com até 2 casas decimais."
- `formaPagamento`: string obrigatória e pertencente a `FORMA_PAGAMENTO_OPTIONS` ("Escolha a forma de pagamento.").
- Não há campo de empresa, usuário nem origem.

## 5. Componentes e comportamento

### Regras puras (`pagamento.ts`)

```ts
type EstadoPagamento =
  | { pode: true; primeiroPagamento: boolean }
  | { pode: false; motivo: "contrato-nao-aceito" | "carregando" };

podeRegistrarPagamento(situacao: SituacaoMensalista): EstadoPagamento
```

| `situacao.kind` | Resultado |
|---|---|
| `ativo`, `inativo` | `pode: true`, `primeiroPagamento: false` |
| `aguardando-pagamento` | `pode: true`, `primeiroPagamento: true` |
| `aguardando-aceite`, `link-vencido`, `sem-contrato` | `pode: false`, `contrato-nao-aceito` |
| `carregando` | `pode: false`, `carregando` |
| `desconhecida` | `pode: true`, `primeiroPagamento: true` (a API decide e o erro é tratado no modal) |

Também em `pagamento.ts`: `rotuloConfirmar(valor, forma)` ("Confirmar R$ 280,00 em Pix"), `explicarVencimento(diaCadastro, vencimentoProxima)` (a frase do dia 31, só quando o dia efetivo difere do cadastro) e `rotuloAtivacao(primeiroPagamento)`.

### `usePagamentoMensalista`

- `useMutation(pagarMensalista)`.
- **Sucesso:** `invalidateQueries({ queryKey: MENSALISTAS_QUERY_KEY })`, que cobre a lista, os contratos e a ficha. Devolve o `PagamentoMensalistaResultado` para o modal mostrar o comprovante.
- **Erro:** devolve `classificarErroPagamento(error)`. Para `contrato-nao-aceito`, também invalida o contrato daquele mensalista (a tela se corrige se o aceite aconteceu em outra aba).
- **Envio duplo (risco do PRD):** o modal só chama `mutate` se `!isPending` (estado e uma ref síncrona, porque dois cliques no mesmo tick podem passar pelo estado). Não há reenvio automático e `retry` é `0`: pagamento não é repetido sem decisão do operador.
- **Falha de rede:** como não há idempotência na API, o modal não oferece "Tentar de novo" sozinho. Oferece **"Conferir situação"** (design §1C), que faz `refetch` da lista e, se o mensalista passou a constar como ativo ou a `situacao` mudou, mostra o comprovante resumido (sem próxima cobrança) com a nota "Pagamento já registrado". Se nada mudou, o botão libera "Tentar de novo". Isso mantém a regra "nunca um sucesso que não foi gravado".

### `PagamentoMensalistaModal`

- Props: `mensalista`, `situacao`, `onClose`, `onToast`, `onConcluido?`.
- `Modal size="md"`. Fecha por Esc, clique fora e ✕ **só quando não está enviando** (`onClose` ignorado durante `isPending`).
- **Passo 1:**
  - `valorPago` preenchido com `String(mensalista.valorMensalidade).replace(".", ",")`, com foco e seleção ao abrir;
  - `OptionGroup` com `FORMA_PAGAMENTO_OPTIONS`, `columns={3}`, sem ícones, e Dinheiro como padrão;
  - botão primário com `rotuloConfirmar`;
  - Enter no valor confirma.
- **Passo 2:** depois do sucesso, o modal troca o conteúdo por `ComprovantePagamento` e o foco vai para o título (`tabIndex=-1`, `role="status"`). Mostra "Mensalista ativado" quando `primeiroPagamento`.
  - "Concluir" fecha o modal.
  - O `Toast` é disparado por quem abre (`onToast`), com "Pagamento registrado. Mensalista ativado." ou "Pagamento registrado.".
- **Erros:** `ErrorBanner role="alert"` conforme a tabela do design §1C. Em `contrato-nao-aceito`, o banner traz "Reenviar contrato" (`useReenviarContrato` existente, com o toast padrão).
- **Valor diferente da mensalidade:** a dica passa a `warn` quando `parseMoney(valor)` difere de `mensalista.valorMensalidade`; sem bloqueio.
- **Foco:** ao fechar, o foco volta ao elemento que abriu o modal (padrão do `Modal`; confirmar na task).

### `ComprovantePagamento`

- Mostra valor recebido (`formatBRL(paga.valor)`), forma (`formaPagamentoLabel`), data/hora (`parseApiDate` + `formatDate`; o horário é o de Brasília, como em `mensalistas-contrato`), e a próxima cobrança (`proxima.valor`, `proxima.vencimento`).
- O valor e o vencimento da próxima vêm **da resposta**, nunca recalculados na tela. O cálculo local existe só para a frase explicativa do dia 31 (`explicarVencimento`).
- `StatusBadge tone="info"` "Valor atualizado do tipo" quando `proxima.valor !== paga.valor`.
- Se `proxima` vier `null` ou sem campos, mostra "Próxima cobrança gerada." sem valor, em vez de esconder o bloco.

### Ficha, lista e página

- **`MensalistaFichaModal`:** novo bloco "Pagamento" (vencimento do cadastro, `dataProximoVencimento` quando existir, `valorMensalidade`). O rodapé ganha "Registrar pagamento" como primário (e "Editar" vira secundário). Quando `podeRegistrarPagamento` dá `pode: false`, o botão usa `aria-disabled="true"` com `aria-describedby` apontando ao texto do bloco, e o clique não faz nada (design §1A).
- **`SituacaoMensalista` / `apresentarSituacao`:** a ação `"Receber pagamento"` para `aguardando-pagamento`; o tipo `action` passa a `"Reenviar" | "Enviar contrato" | "Receber pagamento"`, e a célula recebe `onReceberPagamento`. O botão fica `variant="primary" size="sm"`; os outros continuam secundários. `aria-label`: "Receber pagamento de {nome}".
- **`MensalistasList`:** `IconButton` "Registrar pagamento de {nome}" entre "Ver ficha" e "Editar", **só** quando `podeRegistrarPagamento` é `pode: true` e a linha não é `aguardando-pagamento` (essa já tem o botão na célula). Novo prop `onReceberPagamento`.
- **`MensalistasPage`:** `ModalState` ganha `{ kind: "pagamento"; mensalista: Mensalista }`. Da ficha, "Registrar pagamento" troca o estado (como "Editar"). O modal de pagamento recebe a situação derivada (`derivarSituacao` com a query de contrato já em cache) para saber se é o primeiro pagamento.
- **Permissão:** o projeto não tem controle de perfil no cliente (`caixa/techspec.md`, "Fora de escopo"). A ação aparece para quem acessa a página de mensalistas, e a API recusa (403) quando não permitir; o `ErrorBanner` mostra a mensagem. Quando existir uma regra de perfil no front, o botão passa a respeitá-la (nota para o design §4, "Segurança").

## 6. Decisões técnicas e trade-offs

- **Ler os ids do JWT no cliente** em vez de pedir ao operador ou usar um mock: é a única fonte hoje, e o back valida. É mais frágil que ter os ids na resposta de login ou um endpoint de sessão, então o isolamento em `session.ts` e a task T1 de confirmação são obrigatórios. A alternativa (b) (back lê do token) é a mais limpa e fica como pedido ao back.
- **`useMutation` simples, sem otimismo:** o resultado só aparece depois da resposta (RNF de confiabilidade). Invalidar o prefixo `MENSALISTAS_QUERY_KEY` é mais barato e seguro que atualizar o cache à mão.
- **Sem "Tentar de novo" automático após falha de rede:** na falta de idempotência, repetir às cegas pode baixar duas cobranças. "Conferir situação" primeiro é o desenho mais seguro com o que a API oferece. Se o back aceitar uma chave de idempotência, o serviço a envia e o botão volta a ser um retry simples.
- **Classificação de erro por texto:** mesma fragilidade já aceita em `classifyContratoError`; fica centralizada e testada.
- **Formulário com `useAppForm` + Zod** (e não o `useState` do `PagamentoSaida`): dois campos, mas com validação e erro por campo, e o projeto já padronizou esse formato nos modais de mensalista.
- **Reaproveitar `FORMA_PAGAMENTO`** em vez de um enum de mensalista: os códigos são idênticos aos do back; um segundo enum divergiria com o tempo.
- **Sem estado global novo** (Zustand/Context): o estado do formulário fica no TanStack Form, o do servidor no React Query, e o do modal em `MensalistasPage`.

## 7. Testes

Vitest + Testing Library, nos padrões existentes (`*.test.ts(x)` ao lado do arquivo).

| Alvo | Casos |
|---|---|
| `session.test.ts` | Lê ids de um JWT de teste (montado no teste, nunca um token real); candidatas por ordem; claim ausente ou não numérica → `null`; base64url com `-`/`_`; token malformado → `null`; nunca lança. |
| `mensalista.mapper.test.ts` | `toPagamentoPayload` (campos, `origemPagamento = 2`, arredondamento a centavos); `fromPagamentoResponse` com os apelidos aceitos, com `proxima` ausente e com campos faltando. |
| `mensalista.test.ts` (serviço) | Envia `empresaId`/`usuarioId` da sessão e nada vindo do chamador; sessão sem ids → `unauthorized` sem chamar a API; rota `POST /Mensalista/pagamento`. |
| `schemas/pagamento.test.ts` | Valor vazio, zero, negativo, 3 casas, "1.234,56", "280", "280,5"; forma ausente e forma fora da lista. |
| `pagamento.test.ts` | `podeRegistrarPagamento` para cada `kind`; `rotuloConfirmar` (valor inválido cai para "Confirmar pagamento"); `explicarVencimento` (31/10 → 01/12 → 31/12, fevereiro bissexto e comum, dia 30); `classificarErroPagamento` para cada mensagem/status. |
| `usePagamentoMensalista.test.tsx` | Sucesso invalida o prefixo; clique duplo gera uma única chamada; erro `contrato-nao-aceito` invalida o contrato; `retry` 0. |
| `PagamentoMensalistaModal.test.tsx` | Valor padrão e foco; Enter confirma; erro de valor foca o campo; rótulo do botão acompanha valor e forma; enviando bloqueia fechar; comprovante com próxima cobrança e foco no título; valor diferente da mensalidade em `warn`; cada erro do design (banner, "Reenviar contrato", "Conferir situação"). |
| `MensalistaFichaModal.test.tsx` | Botão habilitado para ativo e aguardando 1º pagamento; `aria-disabled` com motivo para aguardando aceite; clique em desabilitado não abre o modal. |
| `MensalistasList.test.tsx` | "Receber pagamento" só em aguardando 1º pagamento; ícone nas demais linhas habilitadas; nenhum atalho em aguardando aceite. |
| `SituacaoMensalista` | Ação "Receber pagamento" e `aria-label`. |

**Validação contra a API real** (escopo do PRD), checklist manual numa task final, em homologação e com mensalista de teste:
1. confirmar as claims do token e o formato do corpo aceito (T1);
2. mensalista que aceitou o contrato: pagar e conferir baixa, ativação e próxima cobrança;
3. mensalista que não aceitou: conferir o 400 e a mensagem real;
4. mensalista ativo com cobrança: segundo pagamento;
5. mensalista sem cobrança pendente: mensagem real;
6. valor diferente do da mensalidade (a mais e a menos);
7. dia de vencimento 31 atravessando novembro, e 29/30/31 em fevereiro;
8. registrar no `classificarErroPagamento` e no mapper os textos e campos reais.

Rodar `npm run lint`, `npm run test` e `npm run build` ao final.

## 8. Riscos / pontos de atenção

| Risco | Impacto | Mitigação |
|---|---|---|
| O token pode não trazer `empresaId`/`usuarioId` numéricos | **Alto: bloqueia a feature** | T1 confirma com um token válido; plano B: pedir ao back para ler do token (alternativa b) ou expor os ids no login. |
| Formato da resposta do pagamento desconhecido | Médio | Mapper tolerante e isolado; comprovante degrada sem a próxima cobrança em vez de quebrar. |
| Sem idempotência: falha de rede após o back gravar | Alto (cobrança baixada sem o operador saber) | "Conferir situação" antes de reenviar; sem retry automático; pedir ao back uma chave de idempotência. |
| Mensagens de 400 usadas para classificar erros podem mudar | Médio | Função única e testada; pedir `code` distintos. |
| Valor pago diferente da cobrança: regra de negócio indefinida | Médio | Sem bloqueio local; a API decide e a mensagem real é exibida; registrar o comportamento na validação. |
| Operador sem permissão vê o botão | Baixo | A API devolve 403 e a mensagem é exibida; revisitar quando houver perfil no front. |
| Cobrança pendente inexistente só é descoberta ao confirmar | Baixo | Mensagem clara; evolução: a API informar a cobrança pendente na listagem. |
| Fuso das datas do comprovante | Baixo | Mesmo `parseApiDate` da feature de contrato; rótulo "horário de Brasília". |
| `docs/specs/input.md` contém, em versões anteriores, tokens reais | Médio | Não copiar tokens para código, testes ou docs; os testes montam um JWT fictício. |

## 9. Fora de escopo técnico

- Estorno, edição ou cancelamento de pagamento; pagamento por site ou webhook.
- Gateway, PIX com QR Code, boleto, conciliação e recibo imprimível.
- Histórico/lista de cobranças e relatório de inadimplência.
- Controle de acesso por perfil no cliente e verificação de assinatura do JWT.
- Chave de idempotência (depende do back).
- Reativação (`POST /Mensalista/{id}/reativar`) e os campos novos de tipo de mensalidade (continua o item aberto T17 de `mensalistas-contrato`).

## 10. Resultados da execução (2026-10-21)

**Feito (T2 a T7):** `npm run lint` sem erros, `tsc --noEmit` limpo, `npm run test` com 102 arquivos e 1124 testes verdes e `npm run build` passando.

**Decisões tomadas na implementação (diferem do texto acima):**
- **403:** `classificarErroPagamento` só trata o 401 como `sessao`; o 403 mostra a mensagem da própria API (falta de permissão), para não mandar o operador "entrar novamente" sem necessidade.
- **Valor diferente da mensalidade:** é um `StatusBadge tone="warn"` ("Diferente da mensalidade do tipo"), e não texto na cor `warn`, que não passa no contraste sobre o fundo claro.
- **Datas de cobrança:** formatadas pelas partes do dia (`formatDiaCobranca`), porque `new Date("2026-11-05")` é interpretado em UTC e mostraria o dia anterior no Brasil. A data do comprovante usa `formatDateTime` (horário local), sem o rótulo "horário de Brasília".
- **Conferir situação:** consulta a listagem pelo documento do mensalista e considera o pagamento gravado se `ativo`, `situacao` ou `dataProximoVencimento` mudaram em relação ao que o modal recebeu. Depois de falha de rede, o novo envio só é liberado depois dessa conferência.
- **Callback de pagamento:** `onReceberPagamento(mensalista, situacao)`, para a página não recalcular a situação.

**Ainda aberto:**
- **T1:** as claims do JWT para `empresaId` e `usuarioId` (`src/lib/session.ts`) são candidatas não confirmadas. Sem token válido, nada foi chamado na API real.
- **T8 (roteiro manual):** os 8 itens contra a API real dependem de homologação e dados de teste. Ao executá-los, registrar aqui o formato real da resposta (`fromPagamentoResponse`), os textos reais de erro (`classificarErroPagamento`) e se a API aceita valor diferente da mensalidade.
