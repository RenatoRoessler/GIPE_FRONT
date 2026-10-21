# Tech Spec: Finalização do fluxo de mensalista (veículos, contrato e aceite)

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-10-21
**PRD:** ./prd.md
**Design:** ./design.md

> Convenções: segue o `CLAUDE.md` (Next.js 16 App Router + TypeScript + styled-components; tipos em `src/types`, serviços em `src/lib/api/services`, componentes em `src/components/<feature>`, design system em `src/components/ui`). Os contratos abaixo foram conferidos no Swagger (`/swagger/v1/swagger.json`, 21/10/2026) e com chamadas reais aos endpoints públicos do contrato. Não foi possível chamar os endpoints autenticados porque o token de `input.md` já expirou. Por isso, o formato exato de cada item da listagem continua `[A CONFIRMAR]` na primeira task de integração.

## Referências

- PRD: `./prd.md` (RF-01 a RF-07)
- Design: `./design.md`. A seção abaixo resume o que lá está decidido e não redefine nada.
- Base existente: `docs/specs/mensalistas/techspec.md` e `src/components/mensalistas/*`
- Página pública de referência: `src/app/comprovante/*` + `src/components/veiculos/ComprovantePublico`

## O que o Swagger resolveu (e muda em relação ao design)

| Ponto `[A CONFIRMAR]` do design | O que a API faz | Consequência |
|---|---|---|
| A listagem traz o status do contrato? | **Não.** Traz `situacao` (texto), `dataProximoVencimento`, `diasAteProximoVencimento` e `veiculos[].condutores[]`. O contrato vem de `GET /Mensalista/{id}/contrato` (`status` 0 Pendente, 1 Aceito, 2 Cancelado; `tokenExpiracao`; `dataAceite`; 404 se não houver contrato). | Para as linhas com `situacao = "Aguardando Primeiro Pagamento"`, a lista busca o contrato de cada uma (no máximo 20 por página, com `useQueries`). As linhas ativas e as inativas que já pagaram não precisam. Fica o pedido ao back para embutir um resumo do contrato na listagem (ver Riscos). |
| Distinguir "aceito aguardando 1º pagamento" de "desativado" | `situacao = "Aguardando Primeiro Pagamento"` só para inativo sem nenhuma mensalidade paga. | Inativo com outra `situacao` = "Inativo" (desativado). Com "Aguardando Primeiro Pagamento", o contrato define a etapa. |
| Reenvio invalida o link antigo? | **Sim.** Devolve `{ tokenExpiracao, email }`. Também gera contrato novo quando não há contrato ou quando ele foi cancelado. 400 se já aceito. | O toast de sucesso diz "o link anterior deixa de funcionar". Contrato ausente (404) ou cancelado oferece "Enviar contrato" (mesmo endpoint). |
| 400 do GET público: vencido × inválido | Mesmo status 400 (`"Token inválido ou link expirado"`). 404 = contrato não encontrado. 429 = limite de consultas. Corpo: `{ title, status, detail, errors: [{ code, message }] }`. Token malformado → `detail: "Token inválido."`. | Mapear pelo `detail`/`message`: contém "expir" ou "venc" → `vencido`; qualquer outro 400 ou 404 → `invalido`. Confirmar o texto exato com um link realmente vencido (Riscos). |
| Formato de erro do back | `detail` + `errors[]` (array de `{ code, message }`). Em 401 vem `{ erros: [{ mensagem }] }`. O `normalizeError` atual só lê `body.message`. | **Pré-requisito transversal:** `normalizeError` passa a ler `detail`, `errors[0].message` e `erros[0].mensagem`. Sem isso, nenhuma mensagem de regra do back (placa de outro mensalista, documento não confere) chega à tela. |

## Design

- **Telas/estados:** conforme `design.md`.
  - (A) lista com as colunas "Veículos" e "Situação" (trilha Cadastro → Contrato → Pagamento + "Reenviar") e a ficha do mensalista;
  - (B) seção "Veículos" no `MensalistaModal`, com itens em accordion e condutores para pessoa jurídica;
  - (C) página pública `/contrato?t=` com folha, confirmação e selo, mais as telas de link vencido, link inválido, erro de rede e 429.
- **Componentes do design system reaproveitados:** `Table`, `Pagination`, `Modal`, `ConfirmDialog`, `Button`, `Checkbox`, `Accordion`/`AccordionItem`, `PlateDisplay`, `CameraButton`, `StatusBadge`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`, `Logo`, `PageBackground`, `Select`. Campos de form: `TextField`, `SelectField`, `SwitchField`, `PlateField`, `ColorField`. Da feature de veículos: `LeitorPlacaModal`, `PrintStyles`/`Divider` (`src/components/veiculos/Recibo.styles.ts`).
- **Componentes novos:**
  - `src/components/ui/StageTrack/` (design system);
  - em `src/components/mensalistas/`: `SituacaoMensalista`, `VeiculosResumo`, `MensalistaFichaModal`, `VeiculosSection` (+ `VeiculoItem`, `CondutoresList`);
  - em `src/components/contrato/`: `ContratoAceite` (+ `ContratoFolha`, `ConfirmacaoAceite`, `SeloAceite`, `ContratoMensagem`).
- **Tokens:** nenhum token novo. Os usados estão listados em `design.md` §3.

## 1. Arquitetura da solução

```
src/
├── proxy.ts                                   # + "/contrato" em PUBLIC_PATHS
├── app/
│   └── contrato/
│       ├── layout.tsx                         # Server: SignageThemeProvider + fontes Barlow (cópia do layout de /comprovante)
│       └── page.tsx                           # Server: metadata noindex/no-referrer; lê ?t; valida formato; renderiza <ContratoAceite token>
├── components/
│   ├── ui/StageTrack/
│   │   ├── StageTrack.tsx                     # Client (styled-components)
│   │   ├── StageTrack.styles.ts
│   │   ├── StageTrack.test.tsx
│   │   └── index.ts
│   ├── contrato/                              # página pública (tudo Client, exceto o que a page renderiza direto)
│   │   ├── ContratoAceite/
│   │   │   ├── ContratoAceite.tsx             # orquestra: query, estados, mutation de aceite
│   │   │   ├── ContratoAceite.styles.ts       # Screen, Column, Folha, Faixa, Progresso, Selo…
│   │   │   ├── ContratoAceite.test.tsx
│   │   │   └── index.ts
│   │   ├── ConfirmacaoAceite.tsx              # checkbox + documento + botão + 429 countdown
│   │   ├── SeloAceite.tsx                     # selo + imprimir
│   │   ├── ContratoMensagem.tsx               # telas "link vencido" / "link inválido" (também usada pela page no servidor)
│   │   ├── useReadingProgress.ts              # progresso de rolagem da folha (0–1)
│   │   └── format.ts                          # formatHash, formatDataAceite
│   ├── mensalistas/
│   │   ├── MensalistasList/MensalistasList.tsx        # + colunas Veículos e Situação; abre a ficha
│   │   ├── MensalistaModal/MensalistaModal.tsx        # + VeiculosSection; regra de ativo; erros por veículo
│   │   ├── MensalistaModal/VeiculosSection.tsx        # array field de veículos (accordion)
│   │   ├── MensalistaModal/VeiculoItem.tsx            # placa/câmera, modelo, cor, categoria, condutores
│   │   ├── MensalistaModal/CondutoresList.tsx         # array field de condutores (PJ)
│   │   ├── MensalistaFichaModal/                      # ficha só leitura + reenviar
│   │   ├── SituacaoMensalista/                        # célula de situação (trilha + rótulo + reenviar)
│   │   ├── VeiculosResumo.tsx                         # placas + "+N" como botão
│   │   ├── situacao.ts (+ .test.ts)                   # derivação pura da situação
│   │   ├── useContratosMensalistas.ts                 # useQueries dos contratos das linhas que precisam
│   │   ├── useReenviarContrato.ts                     # mutation + invalidação
│   │   └── MensalistasPage/MensalistasPage.tsx        # + estado do modal "ficha"
├── lib/
│   ├── api/errors.ts (+ errors.test.ts)       # lê detail / errors[] / erros[]; novo kind "rate_limited" (429)
│   ├── api/types.ts                           # ApiErrorBody tolerante aos formatos reais
│   ├── api/services/mensalista.ts             # + getContratoMensalista, reenviarContrato
│   ├── api/services/mensalista.mapper.ts      # + veículos/condutores (ida e volta)
│   ├── api/services/contrato.ts (+ .test.ts)  # público: consultarContratoCliente, aceitarContrato
│   └── schemas/mensalista.ts                  # + veículos/condutores; schema dependente do tipo
└── types/
    ├── mensalista.ts                          # + MensalistaVeiculo, Condutor, ContratoMensalista, SituacaoMensalista
    └── contrato.ts                            # ContratoCliente, AceiteContrato, ContratoErro
```

### Server × Client

| Peça | Tipo | Por quê |
|---|---|---|
| `app/contrato/page.tsx` | **Server** | Exporta `metadata` (noindex, `referrer: "no-referrer"`), lê `searchParams` (Promise no Next 16: `await searchParams`) e rejeita token malformado sem montar JS de consulta. Renderiza `ContratoMensagem` direto quando `t` falta ou é inválido. |
| `app/contrato/layout.tsx` | **Server** | Igual a `app/comprovante/layout.tsx`: fontes via `next/font` + `SignageThemeProvider`. |
| `ContratoAceite` e filhos | **Client** | Precisam de React Query, estado do formulário, rolagem (`useReadingProgress`) e `window.print()`. A consulta é feita no cliente, como no comprovante, porque o `api` (axios) e o tratamento de erro já são client-side. Isso mantém um caminho só e evita expor o token em logs de servidor. |
| `StageTrack`, componentes da lista/modal | **Client** | styled-components com tema; já estão em árvore client (`MensalistasPage`). |

Não há fetch no servidor para o contrato. Se o tempo de primeira pintura no celular virar problema (RNF de performance), uma evolução possível é buscar no Server Component e hidratar, mas fica fora agora (ver Trade-offs).

## 2. Tipos (`src/types`)

```ts
// src/types/mensalista.ts (acréscimos)
export type Condutor = { nome: string; cpf: string };            // cpf só dígitos na resposta

export type MensalistaVeiculo = {
  placa: string;                                                 // normalizada, sem hífen
  modelo: string;
  cor: string;                                                   // texto livre até 50 (UI usa CORES_VEICULO)
  categoria: CategoriaMensalidade;                               // nunca 99 em veículo
  condutores: Condutor[];                                        // [] para PF
};

// Mensalista (listagem) ganha:
//   veiculos: MensalistaVeiculo[];
//   situacao: string | null;                 // texto do back
//   dataProximoVencimento: string | null;
//   diasAteProximoVencimento: number | null;

export const SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO = "Aguardando Primeiro Pagamento";

export const CONTRATO_STATUS = { Pendente: 0, Aceito: 1, Cancelado: 2 } as const;
export type ContratoStatus = (typeof CONTRATO_STATUS)[keyof typeof CONTRATO_STATUS];

// GET /Mensalista/{id}/contrato (operador); só os campos usados na tela
export type ContratoMensalista = {
  status: ContratoStatus;
  versao: string;                     // [A CONFIRMAR] string ou número
  titulo: string;
  dataGeracao: string | null;
  tokenExpiracao: string | null;
  dataAceite: string | null;
};

// Derivada (src/components/mensalistas/situacao.ts)
export type SituacaoMensalista =
  | { kind: "ativo" }
  | { kind: "inativo" }                                          // desativado / já pagou antes
  | { kind: "carregando" }                                       // contrato ainda buscando
  | { kind: "aguardando-aceite"; expiraEm: string | null }
  | { kind: "link-vencido" }
  | { kind: "sem-contrato" }                                     // 404 ou cancelado → "Enviar contrato"
  | { kind: "aguardando-pagamento"; aceitoEm: string | null }
  | { kind: "desconhecida" };                                    // falha ao buscar contrato → fallback "Inativo"

// Formulário
export type CondutorFormValues = { uid: string; nome: string; cpf: string };   // cpf mascarado
export type VeiculoFormValues = {
  uid: string;                       // chave estável só do cliente (crypto.randomUUID); não vai para a API
  placa: string;
  modelo: string;
  cor: string;
  categoria: string;                 // "" | "1".."n"
  condutores: CondutorFormValues[];
};
// MensalistaFormValues ganha: veiculos: VeiculoFormValues[]

// MensalistaPayload ganha:
//   veiculos: { placa; modelo; cor; categoria; condutores?: { nome; cpf }[] }[]
//   (condutores omitido para PF — o back recusa se enviado)
```

```ts
// src/types/contrato.ts
export type ContratoCliente = {
  razaoSocial: string;
  nomeMensalista: string;
  versao: string;
  titulo: string;
  conteudo: string;                  // texto simples; quebras de linha preservadas na exibição
  hash: string;                      // SHA-256 hex
  status: ContratoStatus;
  tokenExpiracao: string | null;
  dataAceite: string | null;
};

export type AceiteContrato = { dataAceite: string; hash: string };

// Erros já classificados pelo serviço público
export type ContratoErroKind = "vencido" | "invalido" | "documento" | "ja-aceito" | "rate-limited";
```

## 3. Contratos de API

Cliente: `api` de `src/lib/api/client.ts`. Os endpoints públicos funcionam com ou sem `Authorization`: se o operador estiver logado no mesmo navegador, o header vai junto sem efeito.

### Formato de erro (todos os endpoints)

```json
{ "type": "...", "title": "Erro de regra de negócio", "status": 400,
  "detail": "Token inválido.", "errors": [{ "code": "BUSINESS_ERROR", "message": "Token inválido." }] }
```

`normalizeError` (ordem de preferência da mensagem): `body.message` → `body.detail` → `body.errors[0].message` (quando `errors` é array) → `body.erros[0].mensagem` → padrão do `kind`. `status 429` → novo `kind: "rate_limited"` ("Muitas tentativas. Aguarde um pouco e tente de novo."). `details` continua aceitando o formato antigo (`Record<string, string[]>`) e passa a aceitar o array. `ApiErrorBody` vira união tolerante.

### Autenticados (operador)

| Método | Rota | Uso | Resposta |
|---|---|---|---|
| GET | `/Mensalista?pagina&tamanhoPagina&documento` | lista (já existe) | `Paginado<Mensalista>`, agora com `veiculos`, `situacao`, `dataProximoVencimento`, `diasAteProximoVencimento` |
| POST | `/Mensalista` | cadastro (já existe) | `{ mensalistaId }`. Corpo ganha `veiculos`; `ativo` é ignorado (nasce inativo), a tela envia `false`. |
| PUT | `/Mensalista/{id}` | edição (já existe) | 200. `veiculos` é a lista **completa** (substitui). `tipoPessoa` não muda. |
| GET | `/Mensalista/{id}/contrato` | situação na lista e na ficha | `ContratoMensalista` (+ `conteudo`, `hash`, evidências, que a tela não usa). **404** = sem contrato. |
| POST | `/Mensalista/{id}/contrato/reenviar` | reenviar/enviar | `{ tokenExpiracao, email }`. 400 = já aceito; 404 = mensalista não encontrado. |

Serviço (`src/lib/api/services/mensalista.ts`):

```ts
getContratoMensalista(id: number): Promise<ContratoMensalista | null>   // 404 → null
reenviarContrato(id: number): Promise<{ tokenExpiracao: string | null; email: string }>
```

### Públicos (mensalista, `src/lib/api/services/contrato.ts`)

| Método | Rota | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| GET | `/Mensalista/contrato/cliente?token=` | — | `ContratoCliente` | 400 inválido/expirado · 404 não encontrado · 429 |
| POST | `/Mensalista/contrato/cliente/aceitar` | `{ token, documento }` (documento sem máscara) | `{ dataAceite, hash }` | 400 inválido / expirado / já aceito / documento não confere · 404 · 429 (10 por minuto por IP) |

```ts
consultarContratoCliente(token: string): Promise<ContratoCliente>
aceitarContrato(token: string, documento: string): Promise<AceiteContrato>
```

Os dois lançam `ContratoError extends ApiError` com `contratoKind: ContratoErroKind`, classificado por `classifyContratoError(error)`, uma função pura e testada:
- 429 → `rate-limited`;
- 404 → `invalido`;
- 400 cuja mensagem casa com `/expir|venc/i` → `vencido`;
- 400 que casa com `/j[aá] aceit/i` → `ja-aceito`;
- 400 que casa com `/documento|cpf|cnpj|confere/i` → `documento`;
- qualquer outro 400 → `invalido`.

Os demais erros (rede, timeout, 5xx) seguem como `ApiError` comum.

> Os padrões de texto são frágeis. Ficam centralizados em `classifyContratoError`, com teste para cada mensagem conhecida, e são o primeiro lugar a ajustar se o back mudar o texto. O pedido ao back é expor `code` distintos (ex.: `TOKEN_EXPIRADO`, `DOCUMENTO_NAO_CONFERE`), e a função passa a preferir `code` quando existir.

## 4. Mapeamento e validação

### Mapper (`mensalista.mapper.ts`)

- `fromMensalistaResponse`: lê `veiculos` de forma tolerante (`?? []`), normaliza a placa (`normalizePlaca`) e o CPF dos condutores (só dígitos). Também lê `situacao` e os campos de vencimento (`?? null`).
- `fromMensalista` (lista → form):
  - cada veículo ganha `uid`, categoria em string e condutores com CPF mascarado (`formatCPF`);
  - **cor:** `matchCor(cor)` quando bate com `CORES_VEICULO`. Quando não bate, mantém o texto original, e o `ColorField` mostra nenhuma amostra selecionada. O PUT reenvia o texto intacto, e o dado do cliente não é trocado por um padrão em silêncio.
- `toMensalistaPayload(values)`:
  - placa: `normalizePlaca`;
  - modelo e cor: `trim`;
  - categoria: `Number`;
  - **condutores:** só para PJ (`{ nome: trim, cpf: digits }`); para PF, a chave é omitida;
  - `uid` é descartado.

### Schema (`src/lib/schemas/mensalista.ts`)

`mensalistaSchema` vira uma fábrica `createMensalistaSchema({ categoriaTipo })`, porque a regra de categoria depende do tipo escolhido. O modal monta o schema com `useMemo` a partir do tipo selecionado.

- **Veículo:**
  - placa obrigatória e `isValidPlaca`;
  - modelo até 80; cor até 50;
  - categoria obrigatória e válida: igual à do tipo quando o tipo não é 99; qualquer uma, exceto 99, quando o tipo é 99.
- **Lista de veículos:** placas repetidas (comparando `normalizePlaca`) geram erro em **todas** as ocorrências repetidas, no caminho `veiculos.{i}.placa`.
- **PJ:**
  - cada veículo exige ao menos 1 condutor;
  - condutor: nome obrigatório (até 100) e CPF obrigatório e `isValidCPF`;
  - CPF repetido no mesmo veículo gera erro em `veiculos.{i}.condutores.{j}.cpf`.
- **PF:** os condutores são ignorados na validação. O form nem os renderiza, e o mapper não os envia.
- O `zodFieldErrors` atual já converte o `path` em nome de campo. Validar na task que caminhos aninhados com índice (`veiculos[0].placa`) batem com os nomes do TanStack Form, e ajustar o conversor se necessário.

### Categoria forçada pelo tipo

Ao mudar `mensalistaTipoId` (listener do campo), se o tipo novo tem categoria ≠ 99:
- `setFieldValue` em `veiculos[i].categoria` para todos os veículos;
- mostra a nota "Categorias dos veículos ajustadas para X." se algum valor mudou.

No `VeiculoItem`, com tipo de categoria específica, a categoria aparece como campo somente leitura, e não como `SelectField`.

## 5. Componentes e comportamento

### Lista e situação

- **`useContratosMensalistas(items)`:**
  - `useQueries` sobre os itens com `!ativo && situacao === SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO`;
  - `queryKey: ["mensalistas", "contrato", id]` (prefixo `MENSALISTAS_QUERY_KEY`, para que a invalidação existente atualize também os contratos);
  - `staleTime: 60_000`, `retry: false`, `refetchOnWindowFocus: false`.
  - Retorna `Map<id, UseQueryResult>`.
- **`situacao.ts` → `derivarSituacao(mensalista, contratoQuery, agora)`:** função pura, coberta pela tabela de `design.md` §1A.
  - **Ativo:** `ativo`.
  - **Contrato pendente:** com `tokenExpiracao` futuro → `aguardando-aceite`; com `tokenExpiracao` no passado → `link-vencido`.
  - **Contrato aceito** → `aguardando-pagamento`.
  - **Sem contrato:** `null` (404) ou status cancelado → `sem-contrato`.
  - **Consulta em andamento** → `carregando` (skeleton curto na célula).
  - **Erro na consulta** → `desconhecida`.
  - **Inativo com outra `situacao`** → `inativo`.
  - `agora` é injetado para os testes.
- **`SituacaoMensalista`:**
  - mapeia `kind` → `StageTrack` (stages), rótulo, tom e linha secundária;
  - mostra "Reenviar" (`aguardando-aceite`, `link-vencido`) ou "Enviar contrato" (`sem-contrato`);
  - recebe `onReenviar` e `reenviando`.
- **`useReenviarContrato`:** `useMutation(reenviarContrato)`, que expõe o id em andamento para desabilitar só aquela linha.
  - No sucesso: `invalidateQueries(["mensalistas", "contrato", id])` + toast "Novo link enviado para {email}. Vale por 7 dias; o link anterior deixa de funcionar."
  - No erro: toast de erro com a mensagem normalizada. 400 "já aceito" também invalida, para a linha se corrigir.
- **`VeiculosResumo`:** `PlateDisplay size="sm"` para as 2 primeiras placas + `StatusBadge` "+N". É um `button` com `aria-label="Ver veículos de {nome}"`. "—" quando não há veículos.
- **`MensalistaFichaModal`:** recebe o `Mensalista` da linha e usa a mesma query de contrato (busca sob demanda se a linha não a buscou, ex.: ativo). Os CPFs dos condutores aparecem mascarados (`maskCpfParcial`, em `format.ts`). Os botões "Reenviar contrato" e "Editar" chamam callbacks do `MensalistasPage`.
- **`MensalistasPage`:** `ModalState` ganha `{ kind: "ficha"; mensalista }`. "Editar" dentro da ficha troca o estado para `{ kind: "mensalista", mensalista }`.

### Modal: veículos e condutores

- **`VeiculosSection`:** `form.AppField name="veiculos" mode="array"`. Os itens são renderizados com `key={veiculo.uid}`.
  - Estado local `abertos: Set<uid>`:
    - um veículo novo entra aberto;
    - ao adicionar, os itens sem erro se recolhem;
    - no submit com erro, abre os itens com erro.
  - "Adicionar veículo" faz `pushValue(novoVeiculo(pessoa, categoriaTipo))`:
    - PJ: já vem com 1 condutor vazio;
    - categoria do tipo quando ≠ 99;
    - cor `COR_PADRAO`;
    - foco no campo de placa do item novo (ref por uid).
  - "Remover": `removeValue(i)` direto se o veículo está vazio; senão abre `ConfirmDialog`. O foco vai para o item anterior ou para o botão "Adicionar".
  - `AccordionItem.summary` = "placa · modelo · cor · categoria"; `hasError` quando algum campo do item tem erro tocado.
- **`VeiculoItem`:**
  - campos: `PlateField` + `CameraButton` → abre `LeitorPlacaModal`, igual ao `EntradaVeiculoModal` (um único leitor no modal, com o índice do veículo alvo no estado); `TextField` modelo; `ColorField` (`CORES_VEICULO`); categoria.
- **`CondutoresList`:** só monta para PJ. É um array field aninhado em `veiculos[i].condutores`.
  - Remover fica desabilitado com 1 condutor.
  - **"Copiar condutores de…":** soma os condutores do veículo escolhido, sem repetir CPF. Fica isolado numa função pura `mesclarCondutores` (pode sair da primeira entrega sem afetar o resto).
- **Troca de tipo de pessoa:** só no cadastro (na edição continua bloqueada).
  - PJ → PF: limpa os condutores de todos os veículos.
  - PF → PJ: adiciona 1 condutor vazio em cada veículo.
- **Situação na edição:**
  - mensalista ativo: o `SwitchField` "Desativar mensalista" (só desliga);
  - mensalista inativo: o switch some, e no lugar entra `SituacaoMensalista` só leitura (sem reenviar dentro do modal);
  - o payload envia `ativo` = valor atual do switch (ativo) ou `false` (inativo).
- **Cadastro:** `createMensalista` passa a enviar `ativo: false` (o back ignora o valor, mas fica coerente). Toast: "Mensalista cadastrado. Enviamos o contrato para {email}."
- **Erros do servidor por veículo:** `mapMensalistaServerError(message, veiculos)`, função pura.
  - Se a mensagem contém uma placa da lista (comparação normalizada) → erro naquele `veiculos[i].placa`, com o item aberto e focado. Para isso, usar `form.setFieldMeta` (`errorMap.onServer`) do campo.
  - Caso contrário → `ErrorBanner` como hoje.
  - `[A CONFIRMAR]`: o texto real das mensagens de placa de outro mensalista e de categoria, a ser coletado na validação contra a API.

### Página pública

- **`page.tsx`:**
  - lê `const { t } = await searchParams`, aceitando `string` (se vier array, usa o primeiro);
  - valida com `/^[A-Za-z0-9]{10}$/` (o back documenta 10 caracteres);
  - token inválido → `<ContratoMensagem kind="invalido" />`;
  - token válido → `<ContratoAceite token={t} />`.
  - `metadata`: `title: "Contrato — GIPE"`, `robots: { index: false, follow: false }`, `referrer: "no-referrer"`.
- **`ContratoAceite`:**
  - `useQuery(["contrato-cliente", token], consultarContratoCliente, { retry: false, refetchOnWindowFocus: false })`;
  - `ContratoError` com `vencido`/`invalido` → `ContratoMensagem`; `rate-limited` → banner com "Tentar novamente" após a espera; demais erros → banner + retry;
  - status `Aceito` → folha + selo (sem formulário); status `Cancelado` → `ContratoMensagem kind="invalido"`.
- **`ConfirmacaoAceite`:**
  - form com `useAppForm` + Zod: `aceito: true` obrigatório ("Marque que leu e concorda") e documento válido como CPF **ou** CNPJ, conforme o tamanho. A máscara é a do `formatBusca` de `mensalistas/format.ts`, movida para `src/lib/documento.ts` (`formatDocumentoAuto`) para não criar dependência da página pública com a feature interna.
  - O botão fica sempre habilitado (decisão do design).
  - O submit chama a `useMutation(aceitarContrato)`:
    - sucesso: `queryClient.setQueryData` com `status: Aceito`, `dataAceite` e `hash`; o documento digitado é descartado (`form.reset`); o foco vai ao título do selo;
    - erro `documento`: erro no campo + foco;
    - erro `ja-aceito`: refetch;
    - erro `vencido`: troca para `ContratoMensagem`;
    - erro `rate-limited`: banner + `useCountdown(60)` desabilitando o botão. O rótulo do botão mostra a contagem, e o banner é anunciado uma vez (`role="alert"`).
- **`useReadingProgress(ref)`:** listener de `scroll`/`resize` passivo com `requestAnimationFrame` e cálculo pelo `getBoundingClientRect` da folha. Retorna 0–1, aplicado em `transform: scaleX()` da barra (sem transição).
- **`SeloAceite`:** usa `formatDataAceite` e `formatHash` (grupos de 4, `início…fim`, com botão para expandir) e "Imprimir ou salvar PDF" via `window.print()` + `PrintStyles`, que esconde a faixa, a barra e os botões.
- **Datas:** `parseApiDate` de `components/caixa/format.ts` (a API devolve sem fuso; tratado como horário local). Mover `parseApiDate`/formatadores para `src/lib/date.ts` se o uso atravessar features; decidir na task, sem mudar comportamento do caixa. O selo mostra "(horário de Brasília)" porque o servidor e a empresa estão no Brasil (ver Riscos).

### `StageTrack` (design system)

```ts
type StageState = "done" | "current" | "attention" | "todo";
interface StageTrackProps {
  stages: { label: string; state: StageState }[];
  size?: "sm" | "md";        // sm: rótulos só para leitor de tela
  tone?: "default" | "success"; // success: trilha toda em colors.success (mensalista ativo)
  label: string;             // aria-label do <ol>
}
```

`<ol aria-label>`. Cada `<li>` tem a marca (`aria-hidden`) e o texto visível (`md`) ou oculto (`sm`) "Contrato: atual". A etapa `current` recebe `aria-current="step"`. Estilos só com tokens (`design.md` §3), usando transient props (`$state`, `$size`).

## 6. Decisões técnicas e trade-offs

- **`useQueries` por linha em vez de esperar o back:** atende o RF-04 já, com no máximo 20 requisições por página e só para inativos aguardando o 1º pagamento (na prática, poucos). O custo é a latência extra na célula (skeleton curto). Quando o back embutir `contrato { status, tokenExpiracao, dataAceite }` na listagem, só `useContratosMensalistas`/`derivarSituacao` mudam.
- **Classificação de erro por texto:** necessária porque o back usa o mesmo 400 para casos diferentes. Fica isolada e testada, e muda para `code` quando houver.
- **Corrigir `normalizeError` globalmente:** muda as mensagens de erro de outras telas, de "Os dados enviados são inválidos." para a mensagem real do back. É uma melhoria desejada, mas precisa de revisão rápida nas telas que comparam `error.message` (procurar por `.message ===` ou textos fixos nos testes).
- **Fábrica de schema dependente do tipo**, em vez de validar a categoria no componente: mantém a regra num lugar só, testável, e casa com o `onChange` do `useAppForm`.
- **`uid` só no cliente:** os itens de array mudam de posição (remover do meio), e usar o índice como chave quebraria foco e estado do accordion.
- **Um único `LeitorPlacaModal` no modal**, com o índice do veículo alvo, em vez de um por veículo: a câmera é um recurso pesado.
- **Página pública com fetch no cliente:** mesmo padrão do comprovante (um caminho de erro, React Query, retry manual). A troca por fetch no servidor fica aberta se a métrica de performance pedir.
- **Botão de aceite sempre habilitado:** diverge do padrão de "botão desabilitado até válido" da recuperação de senha, por acessibilidade num formulário de uso único (design §1C).
- **Sem Zustand ou Context novo:** o estado do formulário fica no TanStack Form, o do servidor no React Query, e o de UI (ficha, abertos, countdown) local.

## 7. Testes

Vitest + Testing Library, nos padrões existentes (`*.test.ts(x)` ao lado do arquivo).

| Alvo | Casos |
|---|---|
| `errors.test.ts` | `detail`; `errors[]` array; `erros[].mensagem`; formato antigo `Record`; 429 → `rate_limited`. |
| `contrato.test.ts` | `classifyContratoError` para cada mensagem conhecida (incluindo "Token inválido." e "Contrato não encontrado.") e 429; `aceitarContrato` envia o documento sem máscara. |
| `mensalista.mapper.test.ts` | Veículos de ida e volta; PF sem chave `condutores`; PJ com CPF só dígitos; cor fora da lista preservada; placa normalizada. |
| `schemas/mensalista` | Placa repetida (as duas marcadas); categoria × tipo (específico e 99); PJ sem condutor; CPF repetido no veículo; mesmo CPF em veículos diferentes aceito; PF com zero veículos aceito. |
| `situacao.test.ts` | Todas as linhas da tabela do design, incluindo o limite exato de `tokenExpiracao` e o erro da consulta. |
| `StageTrack.test.tsx` | `aria-current`, textos de estado, `sm` com rótulos ocultos. |
| `MensalistaModal.test.tsx` | Adicionar/remover veículo, condutor inicial de PJ, categoria forçada ao trocar o tipo, erro de placa do servidor no item certo, regra do switch ativo/inativo. |
| `MensalistasList.test.tsx` | Coluna de veículos com "+N"; situação por tipo de contrato (serviço mockado); reenviar desabilita só a linha e mostra o toast. |
| `ContratoAceite.test.tsx` | Carregando; pendente; enviar sem marcar; documento que não confere; 429 com contagem (fake timers); sucesso → selo com foco e documento limpo; já aceito sem form; vencido; inválido. |

**Validação contra a API real (escopo do PRD):** checklist manual numa task final, em homologação e com e-mail de teste combinado:
1. cadastrar um PF sem veículos e um PJ com 2 veículos e condutores;
2. conferir a listagem (`veiculos`, `situacao`);
3. abrir o link do e-mail (depois que o back apontar `Contrato:LinkAceite` para `/contrato?t=`);
4. aceitar com documento errado e depois com o certo;
5. reenviar (e confirmar que o link antigo morreu);
6. editar removendo um veículo;
7. registrar as mensagens reais de erro em `classifyContratoError`/`mapMensalistaServerError`.

Rodar `npm run lint`, `npm run test` e `npm run build` ao final.

## 8. Riscos / pontos de atenção

| Risco | Impacto | Mitigação |
|---|---|---|
| `Contrato:LinkAceite` do back ainda aponta para a página de teste externa | Alto: o e-mail não leva ao GIPE | Combinar a troca para `https://<host-do-front>/contrato?t={token}` em cada ambiente antes de liberar; item do checklist. |
| Mensagens de 400 usadas para classificar erros podem mudar | Médio | Função única e testada; pedir `code` distintos ao back. |
| N requisições de contrato por página | Baixo/Médio | Só para inativos aguardando o 1º pagamento; `staleTime` de 60s; pedir o resumo do contrato embutido na listagem. |
| A correção do `normalizeError` muda as mensagens de outras telas | Baixo | Rodar a suíte inteira; revisar os testes que fixam a mensagem padrão. |
| Fuso das datas (`tokenExpiracao`, `dataAceite`) sem offset | Médio: link "vencido" calculado errado para quem está fora do fuso | Mesmo `parseApiDate` (horário local); confirmar com o back que é horário de Brasília; o selo explicita o fuso. |
| `zodFieldErrors` com caminhos aninhados de arrays | Médio | Teste específico antes de construir a UI de veículos; ajustar o conversor se preciso. |
| `ColorField` com cor fora da lista | Baixo | Preservar o texto; nenhuma amostra selecionada; teste de mapper. |
| `proxy.ts` redireciona `/contrato` para o login se esquecido | Alto | Incluir em `PUBLIC_PATHS` + teste manual sem cookie. |
| Service worker/PWA cachear a página pública com token | Baixo | Conferir que `sw.js` não faz cache de navegação de `/contrato` (rota dinâmica com dados pessoais). |

## 9. Fora de escopo técnico

- Pagamento (`POST /Mensalista/pagamento`) e reativação (`POST /Mensalista/{id}/reativar`): só se usa `situacao` para derivar a etapa.
- Uso de `dataProximoVencimento`/`diasAteProximoVencimento` e das situações de cobrança ("Pagamento Atrasado" etc.) na lista.
- Campos novos de tipo de mensalidade (`toleranciaDiasAtraso`, `quantidadeVagas`, dias da semana) no `TipoModal`. O `PUT /Mensalista/tipo` exige todos os campos, então **verificar** se o `toTipoPayload` atual (sem esses campos) zera valores já gravados. Se zerar, é um bug da entrega anterior, a tratar em correção separada.
- Exibir as evidências do aceite (IP, user-agent, documento) ao operador.
- Fetch do contrato no Server Component / streaming.
- Reconhecer mensalista pela placa na entrada e saída.

## 10. Resultados da execução (2026-10-21)

**Feito (T1 a T16):** `npm run lint` sem erros (os 94 avisos já existiam), `tsc --noEmit` limpo, `npm run test` com 92 arquivos e 1001 testes verdes e `npm run build` passando. Com o servidor de produção no ar: `/contrato` responde 200 sem cookie, com `robots: noindex, nofollow` e `referrer: no-referrer`; token ausente ou curto mostra "Link inválido" sem chamar a API; `/mensalistas` continua redirecionando ao login.

**Evidência real dos endpoints públicos** (chamadas sem autenticação em 2026-10-21):
- `GET /Mensalista/contrato/cliente?token=ABCDEFGHIJ` → 404, `detail: "Contrato não encontrado."`
- `GET /Mensalista/contrato/cliente?token=abc` → 400, `detail: "Token inválido."`

Os dois casos viram "link inválido" em `classifyContratoError`. A mensagem de um link realmente vencido segue sem ser vista (precisa de um contrato de verdade).

**T17: PUT de tipo de mensalidade (aberta, risco provável).** O Swagger descreve o `MensalistaTipoRequestDto` com `toleranciaDiasAtraso`, `quantidadeVagas` e `domingo` a `sabado` como campos **não anuláveis e sem `required`**, e o `PUT /Mensalista/tipo/{id}` diz "Envie todos os campos". O `toTipoPayload` atual (`mensalista.mapper.ts`) não envia nenhum deles, e nenhum arquivo de `src/` os lê ou os guarda. Se o back os preencher com o padrão da linguagem, editar um tipo pelo `TipoModal` zera a tolerância e os dias da semana e manda `quantidadeVagas: 0`, valor fora do intervalo de 1 a 99, o que deveria gerar 400. **Falta confirmar com uma chamada real.** Correção mínima proposta, sem tela nova: ler esses campos no `GET /Mensalista/tipo`, guardá-los em `MensalistaTipo` e reenviá-los como estão no `PUT`.

**T18: validação ponta a ponta (aberta).** Precisa de login válido na API (o token de `input.md` expirou), de e-mail de teste combinado e de o back apontar `Contrato:LinkAceite` para `/contrato?t={token}`. Ao rodar o roteiro, conferir principalmente: o formato real da listagem (`veiculos`, `situacao`), as mensagens de 400 que citam placa e categoria (`mapMensalistaServerError`) e a mensagem do link vencido (`classifyContratoError`).
