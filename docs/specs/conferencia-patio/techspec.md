# Tech Spec: Conferência de pátio

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-11-04
**PRD:** ./prd.md
**Design:** ./design.md

> Convenções: segue o `CLAUDE.md` (Next.js App Router + TypeScript + styled-components; tipos em `src/types`, serviços em `src/lib/api/services`, componentes em `src/components/<feature>`, design system em `src/components/ui`). Antes de escrever código, ler o guia relevante em `node_modules/next/dist/docs/` (o `AGENTS.md` avisa que esta versão do Next tem mudanças) e seguir as skills `code-best-practices` e `styled-components-best-practices`.
>
> **Limite desta spec:** o swagger local descreve os 10 endpoints de `ConferenciaPatio`, mas **não tipa as respostas**. Os nomes de campo abaixo foram **confirmados em 2026-11-04** num servidor de teste (início, leitura, marcação, descarte, finalização, resumo e aberta; fixture em `src/lib/api/services/conferenciaPatio.fixture.ts`). Continuam **não confirmados** os campos de `ajustes` e a resposta de `/saida` e de `/sem-entrada/.../entrada`, porque a saída e a entrada pela conferência não foram exercitadas; o mapper é tolerante (como `fromPatioResponse`). O JWT que está em `docs/specs/input.md` é real: **não copiar para código, testes ou documentos**. Os testes usam dados fictícios.

## Referências

- PRD: `./prd.md` (RF-01 a RF-12). Design: `./design.md`. A seção "Design" abaixo resume e registra os ajustes que a leitura do código obrigou.
- Protótipo: `docs/murel-conferencia-patio.html` (a camada `api` dele é simulada; os endpoints reais são os de `ConferenciaPatio`).
- Base existente: `src/lib/api/services/patio.ts` (entrada e saída), `src/components/patio/` (`PATIO_QUERY_KEY`, `usePatio`), `src/components/veiculos/` (`useLeitorPlaca`, `PagamentoSaida`, `ReciboSaidaStep`, `useMeiosPagamento`, `ModeloField`, `categoriaIcons`), `src/components/caixa/useCaixa.ts`, `src/lib/nav.ts`, `src/lib/permissoes.ts`.

## O que o código atual resolve e o que não resolve

| Ponto | Situação no código | Consequência |
|---|---|---|
| Contrato da conferência | Nada existe. O swagger não tipa as respostas. | Novo serviço, tipos e mapper tolerante; conferir os campos contra uma resposta real na primeira task. |
| Caixa aberto | `GET /resumo` devolve `caixaIdAberto` (`null` sem caixa). | A tela inicial decide por ele; não precisa do `useCaixa`. |
| Leitura de placa pela câmera | `useLeitorPlaca` é um hook reaproveitável, mas **para a câmera depois da primeira placa** e desiste após 15 s. `LeitorPlacaModal` ainda exige uma etapa de confirmação do operador. | Para conferir carro a carro o hook ganha um modo contínuo (ver §6). O modal não é tocado: o visor da conferência usa o hook direto. |
| Saída de um veículo | `useSaidaFlow` é uma máquina grande (QR, busca manual, fases) e termina em `registrarSaida` (`POST /Patio/{id}/saida`). | Não estender. A saída da conferência usa `consultarSaida` + `PagamentoSaida` + `useMeiosPagamento` + `ReciboSaidaStep` num hook novo e pequeno (ver §7). |
| Entrada de um veículo | `EntradaVeiculoModal` é pesado (consulta de placa, gancho de chave, recibo). | Modal novo, simples, com `ModeloField`, `useModelos`, seletor de categoria e de cor já existentes. |
| Menu | `NAV_ITEMS` + `NavIcons` + `BottomBar`/`MenuSheet` (o "Mais" já existe e agrupa o que não coube). `MenuSheet` não tem linha de apoio por item. | Novo item e novo ícone; a linha "Em andamento · 34 de 42" do design não entra nesta versão. |
| Permissão | `AREA_POR_ROTA` em `permissoes.ts` liga rota a área; `AREA.Patio` já cobre Administrador, Gerente, Caixa e Manobrista, igual ao padrão da API. | A rota nova entra em `AREA.Patio`; nada de área nova. |
| Filtros | `Tabs` do design system é um `tablist` com painéis, não uma fila de filtros. | O design dizia usar `Tabs`; corrigido: os filtros são botões `aria-pressed` num componente local. |
| Invalidação | Saída e entrada já invalidam `PATIO_QUERY_KEY` e `QUADROS_QUERY_KEY`. | A conferência faz o mesmo e também invalida `CAIXA_KEY` (saída com valor movimenta o caixa). |

## Design

- **Telas/estados:** conforme `design.md`: início, conferindo (câmera ou lista), divergências, resumo, folhas de dar saída, digitar placa e registrar entrada, e os estados de carregando, erro, sem caixa, conferência já aberta e encerrada por outro operador.
- **Componentes do design system reaproveitados:** `Button`, `Card`, `InfoCard`, `ActionBar`, `BackButton`, `OptionGroup`, `Input`, `Select`, `Switch`, `Modal`, `PlateDisplay`, `StatusBadge`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`, `PageBackground`, `ColorSwatchGroup`.
- **Componentes novos no design system (`src/components/ui`):** `ProgressBar` e `TipoClienteBadge`.
- **Componentes novos da feature:** em `src/components/conferencia/` (ver §1).
- **Tokens:** nenhum token novo (`design.md` §3).
- **Ajustes ao design decididos aqui** (já refletidos em `design.md`):
  1. Filtros "Faltam / Conferidos / Divergências" são botões `aria-pressed`, não `Tabs`.
  2. O visor lê **continuamente**; o rodapé tem "Ver resumo" (ou "Resolver divergências") e, só quando a câmera parou (tempo sem leitura, permissão negada), "Ler placas" para religá-la. Não existe "Ler próxima placa" por toque.
  3. O visor usa `useLeitorPlaca` direto, em vez de extrair o conteúdo do `LeitorPlacaModal`.
  4. Sem linha de apoio no item do menu.

## 1. Arquitetura da solução

```
src/
├── app/(app)/conferencia-patio/page.tsx          # Server: Suspense + <ConferenciaPage />
├── types/conferenciaPatio.ts                     # tipos da conferência, itens, leituras, ajustes e payloads
├── lib/
│   ├── nav.ts                                    # + NavIconId "checklist" e o item "Conferência" (depois de Caixa)
│   ├── permissoes.ts                             # + ["/conferencia-patio", AREA.Patio] em AREA_POR_ROTA
│   ├── schemas/conferenciaPatio.ts               # zod: entrada sem ticket, saída pela conferência, placa digitada
│   └── api/services/
│       ├── conferenciaPatio.ts                   # os 10 endpoints
│       └── conferenciaPatio.mapper.ts            # fromConferenciaResponse, fromItem, fromLeitura, fromResumo
├── components/
│   ├── layout/NavIcons/NavIcons.tsx              # + ChecklistIcon
│   ├── ui/
│   │   ├── ProgressBar/                          # novo
│   │   └── TipoClienteBadge/                     # novo
│   ├── veiculos/LeitorPlacaModal/useLeitorPlaca.ts   # + opção `continuo`
│   └── conferencia/
│       ├── conferenciaKeys.ts                    # CONFERENCIA_KEY, resumo e aberta
│       ├── conferencia.ts (+ teste)              # regras puras: totais, filtros, tipo do cliente, textos
│       ├── useConferenciaResumo.ts               # GET /resumo
│       ├── useConferenciaAberta.ts               # GET /aberta (204 → null), atualização periódica
│       ├── useConferenciaAcoes.ts                # iniciar, ler, marcar, descartar, finalizar + fila de leituras
│       ├── useSaidaConferencia.ts                # consulta + saída pela conferência
│       ├── ConferenciaPage/                      # controla a etapa pela URL; estados gerais
│       ├── ConferenciaInicio/
│       ├── ConferenciaConferindo/                # progresso, filtros, lista; usa VisorPlacas
│       ├── VisorPlacas/                          # câmera contínua + resultado da última leitura
│       ├── ConferenciaItem/                      # um veículo e suas ações por situação
│       ├── ConferenciaDivergencias/
│       ├── ConferenciaResumo/
│       ├── DarSaidaConferenciaModal/
│       ├── RegistrarEntradaConferenciaModal/
│       └── DigitarPlacaModal/
```

Cada pasta de componente segue o padrão do projeto: `Nome.tsx`, `Nome.styles.ts`, `Nome.test.tsx`, `index.ts`.

### Server × Client

| Peça | Tipo | Por quê |
|---|---|---|
| `app/(app)/conferencia-patio/page.tsx` | **Server** | Só monta a página, como `patio/page.tsx`. Sem dados no servidor: a API exige o token do navegador. |
| `ConferenciaPage` e filhos, hooks | **Client** | React Query, estado de etapa na URL (`useSearchParams`), câmera, modais, foco. |
| `ProgressBar`, `TipoClienteBadge` | Sem estado; aceitos em ambos | Componentes puros de apresentação. |

`ConferenciaPage` lê a etapa da URL; por isso o `page.tsx` envolve em `Suspense` com um esqueleto, exatamente como a página do pátio.

## 2. Tipos (`src/types/conferenciaPatio.ts`)

Os valores numéricos da API viram constantes nomeadas (padrão de `CATEGORIA_VEICULO`), para a tela nunca depender de um número solto.

```ts
export const METODO_CONFERENCIA = { Camera: 1, Lista: 2 } as const;
export const SITUACAO_CONFERENCIA = { Aberta: 1, Finalizada: 2, Incompleta: 3 } as const;
export const SITUACAO_ITEM = { Pendente: 1, Conferido: 2, NaoEncontrado: 3, Baixado: 4, Saiu: 5 } as const;
export const ORIGEM_ITEM = { Camera: 1, Manual: 2, Entrada: 3 } as const;       // leituras só enviam Camera ou Manual
export const RESULTADO_LEITURA = { Conferido: 1, JaConferido: 2, SemEntrada: 3 } as const;
export const SITUACAO_SEM_ENTRADA = { Pendente: 1, EntradaRegistrada: 2, Descartada: 3 } as const;
export const MOTIVO_SAIDA = { SaiuSemBaixa: 1, TicketDuplicado: 2, EntradaPorEngano: 3, Outro: 4 } as const;
export const TIPO_AJUSTE = { Saida: 1, Entrada: 2 } as const;

export type TipoCliente = "avulso" | "mensal" | "conveniado";

export type ConferenciaResumo = {              // GET /resumo (confirmado)
  totalVeiculos: number;
  avulsos: number;
  mensais: number;
  conveniados: number;
  caixaIdAberto: number | null;
  ultimaConferencia: ConferenciaEncerrada | null;
  conferenciaAberta: ConferenciaEmAndamento | null;
};

export type ConferenciaEncerrada = {            // confirmado (ultimaConferencia)
  patioConferenciaId: number;
  caixaId: number;
  situacao: 2 | 3;                              // Finalizada | Incompleta
  dataFim: string;
  usuarioIdFim: number | null;
  usuarioFim: string | null;
  totalVeiculos: number;
  totalConferidos: number;
};

export type ConferenciaEmAndamento = {          // [A CONFIRMAR] sempre `null` no resumo durante os testes; nomes pelo swagger
  patioConferenciaId: number;
  caixaId: number;
  dataInicio: string;
  usuarioIdInicio: number | null;
  usuarioInicio: string | null;
  total: number;
  conferidos: number;
};

export type ChaveItem = { quadroChaveId: number; posicao: string; patioQuadroId: number; quadro: string } | null;

export type ItemConferencia = {                 // confirmado
  patioConferenciaItemId: number;
  patioId: number;
  placa: string;                                // normalizada
  modelo: string | null;
  cor: string | null;
  categoria: number;
  dataEntrada: string;
  mensalista: boolean;
  conveniado: boolean;
  situacao: number;                             // SITUACAO_ITEM
  origem: number | null;
  dataConferido: string | null;
  usuarioIdConferido: number | null;
  usuarioConferido: string | null;
  chave: ChaveItem;
};

// confirmado
export type SemEntrada = { patioConferenciaSemEntradaId: number; placa: string; dataLeitura: string; situacao: number; patioId: number | null };

// [A CONFIRMAR] sempre vazio nos testes; só `tipo`, `motivo` e `descricao` vêm do swagger
export type AjusteConferencia = { tipo: number; placa: string | null; motivo: number | null; descricao: string };

export type Conferencia = {
  patioConferenciaId: number;
  caixaId: number;
  metodo: number;
  situacao: number;
  dataInicio: string;
  usuarioIdInicio: number | null;
  usuarioInicio: string | null;
  dataFim: string | null;
  usuarioIdFim: number | null;
  usuarioFim: string | null;
  observacao: string | null;
  itens: ItemConferencia[];
  semEntrada: SemEntrada[];
  ajustes: AjusteConferencia[];
  // `totais` do servidor não é guardado: os totais saem de `calcularTotais` (ver §4).
};

export type ResultadoLeitura = {
  resultado: number;                            // RESULTADO_LEITURA
  placa: string;
  item: ItemConferencia | null;
  semEntrada: SemEntrada | null;
};

export type ConferenciaEtapa = "inicio" | "conferindo" | "divergencias" | "resumo";
export type FiltroLista = "faltam" | "conferidos";
```

Payloads (todos exatamente como no swagger): `{ metodo }`, `{ placa, origem }`, `{ situacao }`, `{ valor, formaPagamento, motivo, descricao? }`, `{ categoria, modelo, cor, codigoTicket?, mensalista }`, `{ observacao? }`.

## 3. Contrato de API e serviço

Prefixo `/conferencia-patio` (a base `.../api/v1` já está no cliente `api`). O `Authorization` e o tratamento de erro (`ApiError`) são os do cliente existente; nenhum endpoint novo para o back.

```ts
// src/lib/api/services/conferenciaPatio.ts
obterResumo(): Promise<ConferenciaResumo>                                   // GET    /resumo
obterAberta(): Promise<Conferencia | null>                                  // GET    /aberta        (204 → null)
iniciarConferencia(metodo): Promise<Conferencia>                            // POST   /              (400 se já houver aberta ou sem caixa)
lerPlaca(id, { placa, origem }): Promise<ResultadoLeitura>                  // POST   /{id}/leituras
marcarItem(id, itemId, situacao): Promise<ItemConferencia>                  // PUT    /{id}/itens/{itemId}
darSaidaPeloItem(id, itemId, payload): Promise<SaidaRegistrada>             // POST   /{id}/itens/{itemId}/saida
registrarEntradaSemTicket(id, placa, payload): Promise<unknown>             // POST   /{id}/sem-entrada/{placa}/entrada
descartarSemEntrada(id, placa): Promise<void>                               // DELETE /{id}/sem-entrada/{placa}
finalizarConferencia(id, observacao?): Promise<Conferencia>                 // POST   /{id}/finalizar
```

Não há um `obterConferencia(id)` no uso: a tela só trabalha com a aberta. Ele entra no serviço apenas se uma task precisar (o detalhe de conferências encerradas está fora do escopo).

- **204 em `/aberta`:** o cliente `api` precisa devolver `data` vazio sem quebrar; o cliente é `axios`, que entrega `data` como string vazia no 204, e o serviço devolve `null` quando `data` não é um objeto. Confirmado no servidor: `/aberta` sem conferência responde 204, e `DELETE .../sem-entrada/{placa}` também.
- **Placa na rota** (`sem-entrada/{placa}`): normalizada (`normalizePlaca`, sem hífen) e passada por `encodeURIComponent`.
- **`darSaidaPeloItem`** devolve o mesmo corpo de `POST /Patio/{id}/saida`, então reusa o tipo `SaidaRegistrada` (e o `tokenRecibo`).
- **Mapper tolerante:** cada campo é lido com `toNumber`/`toText` (os mesmos auxiliares de `patio.ts`; se ainda forem privados, exportá-los para um módulo comum em vez de copiar). Item com `patioConferenciaItemId` ausente é descartado. Placa normalizada. Listas ausentes viram `[]`.
- **Erros que a tela diferencia:** `ApiError.kind === "validation"` (400: caixa fechado, conferência já aberta, motivo de mensalista recusado) mostra a mensagem do back; `forbidden` (403) não oferece tentar de novo; `not_found` (404) em `/{id}/...` indica conferência encerrada.

### Chaves e hooks de leitura

```ts
export const CONFERENCIA_KEY = ["conferencia-patio"] as const;
export const conferenciaResumoKey = [...CONFERENCIA_KEY, "resumo"] as const;
export const conferenciaAbertaKey = [...CONFERENCIA_KEY, "aberta"] as const;
```

- `useConferenciaResumo()`: `staleTime: 0`, `refetchOnWindowFocus: true`; usado só na etapa início.
- `useConferenciaAberta({ ativo })`: `queryFn: obterAberta`, `refetchOnWindowFocus: true`, `refetchInterval: ativo ? 30_000 : false` e `refetchIntervalInBackground: false`. É como o progresso de outros operadores aparece (RF-04, RF-11); 30 s equilibra frescor e tráfego, e a mesma query é a fonte única da tela, sem estado duplicado em `useState`.
- Nenhuma das duas fica sob o prefixo `["patio"]`; as mutações invalidam o que mudou (§5).

## 4. Regras puras (`conferencia.ts`)

```ts
tipoDoCliente(item): TipoCliente                              // conveniado > mensalista > avulso
calcularTotais(conferencia): { total, conferidos, faltam, naoEncontrados, semEntrada, divergencias, ajustes }
filtrarItens(itens, filtro: FiltroLista): ItemConferencia[]
ordenarItens(itens, filtro): ItemConferencia[]                // faltam: entrada mais antiga primeiro; conferidos: mais recente primeiro
itensNaoEncontrados(conferencia): ItemConferencia[]
semEntradaPendentes(conferencia): SemEntrada[]
descricaoLeitura(resultado, item): { texto: string; tom: "success" | "muted" | "danger" }
pctProgresso(conferidos, total): number
duracaoEntre(inicio, fim): string                             // "52min", "1h 4min"
```

- **Totais** seguem as definições do swagger: `total` e `conferidos` **não** contam itens Baixado (4) e Saiu (5); `faltam` = Pendente; `naoEncontrados` = situação 3; `semEntrada` = linhas com situação 1; `divergencias` = naoEncontrados + semEntrada; `ajustes` = tamanho da lista.
- **Totais calculados no cliente, não lidos do `totais` do servidor:** depois de cada leitura a tela atualiza o cache com o item devolvido (§5) e precisa dos números na hora, sem outra ida à API. Um teste de contrato compara `calcularTotais` com o `totais` de uma resposta fixture real (exemplo anonimizado) para detectar divergência de regra.
- **Ordem:** itens já vêm "da entrada mais antiga" da API; a ordenação local só garante o critério quando o item muda de situação no cache.
- Datas com `parseApiDate`/`formatTime` já existentes em `components/caixa/format`; nada de `new Date` solto em fuso errado (a API devolve datas sem fuso).

## 5. Mutações e atualização do cache (`useConferenciaAcoes`)

Uma única fonte de verdade: o cache de `conferenciaAbertaKey`. Cada ação espera a resposta do servidor e **só então** muda a tela (o operador nunca vê "Conferido" de algo que não foi gravado, RF-11).

| Ação | Depois do sucesso |
|---|---|
| `iniciar(metodo)` | `setQueryData(conferenciaAbertaKey, conferencia)`; invalida `conferenciaResumoKey`. Se vier 400 de "já existe aberta", faz `refetch` de `aberta` e a tela vira "Continuar". |
| `ler(placa, origem)` | Aplica o `item` devolvido ao cache (troca o item pelo `patioConferenciaItemId`; se o item for novo, por exemplo um carro que entrou depois do início, acrescenta). `semEntrada` devolvido substitui ou acrescenta a linha pela placa. Guarda `ultimaLeitura` para o visor. |
| `marcar(itemId, situacao)` | Troca o item pelo devolvido. |
| `descartar(placa)` | Marca a linha como Descartada (situação 3) no cache e faz `refetch` de `aberta`. |
| `darSaida` (§7) | `refetch` de `aberta`; invalida `PATIO_QUERY_KEY`, `QUADROS_QUERY_KEY` e `CAIXA_KEY`. |
| `registrarEntrada` | `refetch` de `aberta`; invalida `PATIO_QUERY_KEY`, `QUADROS_QUERY_KEY` e `CAIXA_KEY`; invalida `conferenciaResumoKey`. |
| `finalizar(obs)` | Remove `conferenciaAbertaKey` do cache (`setQueryData(null)`) e invalida o resumo. |

### Fila de leituras

A câmera pode ler várias placas por segundo; o back grava cada uma na hora. Para não atropelar o cache nem o servidor:

- As leituras entram numa **fila serial** (uma requisição por vez, na ordem em que foram vistas), dentro do hook, com `useRef` para a fila e o estado "em andamento".
- A mesma placa vista de novo antes de `REPETICAO_LEITURA_MS` (5 s) é descartada **antes** de entrar na fila; o `JaConferido` do back cobre o resto.
- Falha de rede em uma leitura: `Toast` de erro com a placa e a leitura **não** é recolocada sozinha (o operador reaponta ou digita); o resto da fila segue.
- Digitar placa usa a mesma fila (`origem: Manual`); a folha fecha só quando o resultado volta.
- Concorrência entre marcação manual e leitura na mesma placa é resolvida pelo servidor (conferir de novo mantém quem conferiu primeiro); o cache sempre recebe a versão devolvida mais recente.

## 6. Leitura contínua da câmera

### `useLeitorPlaca` (modificação mínima)

Nova opção `continuo?: boolean` (padrão `false`; os usos atuais, `LeitorPlacaModal` e os campos de placa, não mudam).

- Com `continuo`, ao confirmar uma placa pelo consenso: vibra, chama `onPlaca` e **não** chama `parar()`; reinicia o consenso (`criarConsenso()`) e continua o laço.
- O tempo limite (`tempoLimiteMs`) passa a contar a partir da **última leitura ou do início**, não do início só; no modo contínuo é reiniciado a cada placa lida e o valor usado pela conferência é 120 s. Estourado, o hook para a câmera e vai a `sem-leitura` como hoje, e o botão "Ler placas" religa (`iniciar()`).
- Um teste novo em `useLeitorPlaca.test.tsx` cobre: segue lendo depois da primeira placa; reinicia o limite a cada leitura; para ao estourar; modo padrão inalterado.
- **Gestão de energia:** a câmera desliga quando a aba/etapa sai de "conferindo", quando a aba do navegador fica oculta (`visibilitychange`) e ao desmontar; volta sozinha ao reabrir a etapa se o método é câmera. O hook já libera tudo quando `ativo` vira `false`.

### `VisorPlacas`

- Recebe `ativo`, `onPlaca` e `ultimaLeitura`; usa `useLeitorPlaca({ ativo, continuo: true, tempoLimiteMs: 120_000, onPlaca })` e os estilos de vídeo e mira de `LeitorQrSaida.styles` (`Video`, `Mira`).
- Mostra, conforme `design.md`, a última placa em `PlateDisplay`, o resultado da leitura em `role="status"`/`aria-live="polite"`, e as mensagens por estado do hook (`negada`, `indisponivel`, `sem-leitura`, `contextoSeguro` falso → "só funciona em HTTPS").
- "Sem entrada · Registrar agora" é um botão que chama `onRegistrarEntrada(placa)`.
- Sem câmera ou negada: o método continua câmera, mas a tela destaca "Digitar placa" e oferece trocar para lista (a conferência já criada não muda de método; só a forma de marcar).

### Leitura não confirmada pelo operador

Diferente do modal de entrada, a conferência **não** pede confirmação da placa lida: a leitura é idempotente e desfazível ("Desfazer", "Leitura errada"), e confirmar cada carro derrotaria o objetivo. Uma leitura errada do OCR vira, no pior caso, uma divergência "sem entrada" que o operador descarta com um toque. Isto é uma decisão consciente (ver riscos).

## 7. Dar saída pela conferência (`useSaidaConferencia`)

Hook novo e pequeno; **não** altera `useSaidaFlow`.

> **Mudança (pedido do usuário):** o "Dar saída" da conferência pede apenas o motivo (e a descrição em "Outro"). Não consulta valor, não pede pagamento e não mostra recibo; envia `valor: 0` e `formaPagamento: 1` (Dinheiro), que o endpoint exige. Prevalece sobre o que está descrito abaixo sobre valor, pagamento e recibo.

- `useQuery` de `consultarSaida({ tipo: "placa", valor })` (mesmo serviço do fluxo normal), `gcTime: 0`, `retry: false`, `refetchInterval` de 30 s enquanto o modal está aberto e nada está sendo enviado (a permanência e o valor dependem do instante).
- Meios de pagamento: `useMeiosPagamento()`; forma padrão e `getPagamentoStatus` do módulo `saida.ts`, como a saída normal. Mensalista e valor zero: sem forma, sem troco.
- **Confirmar:** reconsulta; se `valorACobrar` mudou, mostra o aviso de valor alterado (mesmo comportamento da saída normal) e não envia; senão chama `darSaidaPeloItem` com `{ valor, formaPagamento, motivo, descricao }`. Valor zero envia a forma padrão (Dinheiro), como a saída de mensalista de hoje.
- **Motivo e descrição:** schema zod em `lib/schemas/conferenciaPatio.ts` (`motivo` obrigatório; `descricao` obrigatória e até 300 caracteres no motivo "Outro").
- **Forma de pagamento:** só dinheiro, crédito, débito e Pix (boleto e transferência não são oferecidos; `FORMAS_SAIDA` já exclui os dois).
- **Resultado:** com sucesso, mostra `ReciboSaidaStep` com o `SaidaResultado` montado como no fluxo normal (saída, recebido, troco, `emitidoEm`), e fecha ao concluir. Reaproveita o componente sem mudanças.
- O modal cuida do envio com a mesma trava anti-clique-duplo que `useSaidaFlow` usa (`enviandoRef`).

## 8. Registrar entrada sem ticket (`RegistrarEntradaConferenciaModal`)

- Campos: `categoria` (seletor com `CategoriaIcon` e a ordem de `ORDEM_CATEGORIAS` já usada na entrada), `modelo` (`ModeloField` + `useModelos`, até 80), `cor` (`ColorSwatchGroup` com `CORES_VEICULO`; vai o nome em caixa alta, como na entrada; até 50), `codigoTicket` (opcional, só dígitos) e `mensalista` (`Switch`).
- Validação com zod e `useAppForm` (o mesmo padrão de formulário do projeto); mensagens em português.
- A chamada é `registrarEntradaSemTicket`. Erro 400 de mensalista não permitido: `ErrorBanner` com a mensagem do back, `Switch` desligado e a frase "Você pode registrar como avulso."; o resto do formulário é mantido.
- Sucesso: `Toast` "Entrada registrada.", invalidações da §5 e foco no próximo item.
- O ticket de entrada (comprovante, QR) **não** é emitido nesta versão: o PRD não pede. Se o operador precisar, abrirá pelo pátio (`/comprovante/{token}`).

## 9. Etapas e URL (`ConferenciaPage`)

- Etapa na URL: `/conferencia-patio` (início), `?etapa=conferindo`, `?etapa=divergencias`, `?etapa=resumo`. Mudar de etapa usa `router.push` (o botão voltar do aparelho funciona); sair da tela não encerra nada.
- Regras de redirecionamento, avaliadas depois que `aberta` carrega:
  - etapa ≠ início e **sem** conferência aberta → `router.replace` para o início, com o aviso "Esta conferência foi encerrada." se ela existia há pouco (detectado por `aberta` passar de objeto para `null` com a tela aberta);
  - etapa início com conferência aberta → mostra "Continuar conferência".
- Cada etapa é um componente próprio (`ConferenciaInicio`, `ConferenciaConferindo`, `ConferenciaDivergencias`, `ConferenciaResumo`) que recebe a conferência e as ações por props; `ConferenciaPage` só carrega, decide e conecta.
- Filtro da lista e observação digitada ficam em `useState` local (a observação também em `sessionStorage` protegido por `try/catch`, para sobreviver a um recarregamento; limpa ao finalizar).
- **Foco:** depois de marcar ou resolver um item, o foco vai para o item seguinte, ou para o botão do rodapé quando a lista esvazia (padrão da agenda de mensalistas e do pátio); as folhas devolvem o foco ao botão de origem.

## 10. Navegação, permissão e ícone

- `nav.ts`: `NavIconId` ganha `"checklist"`; item `{ label: "Conferência de pátio", shortLabel: "Conferência", href: "/conferencia-patio", icon: "checklist", area: AREA.Patio }` logo depois de "Caixa". Fora de `BAR_PRIORITY`: no celular cai no "Mais", no computador aparece no menu lateral.
- `permissoes.ts`: `["/conferencia-patio", AREA.Patio]` em `AREA_POR_ROTA`. Quem não tem a área vê a página de acesso negado, como nas demais.
- `NavIcons.tsx`: `ChecklistIcon` (prancheta com visto) no mesmo traço dos outros ícones.
- Testes: `nav.test.ts` (item presente na ordem e some sem permissão), `permissoes.test.ts` (rota), `BottomNav.test.tsx` se a contagem de itens for afirmada.

## 11. Estilo

- Cada componente com `*.styles.ts` em styled-components, usando só o tema (`theme.colors`, `space`, `fontSizes`, `radii`, `layout`), transient props (`$variante`) e sem valores soltos. O fundo do visor da câmera segue o que `LeitorQrSaida.styles` já faz (cor fixa de equipamento).
- Breakpoints do tema (`md` e `lg`) com media queries; o layout em duas colunas só a partir de `lg`.
- `prefers-reduced-motion` desliga a transição da barra e a saída dos itens.
- `ProgressBar`: `role="progressbar"` com `aria-valuenow`/`aria-valuemax`/`aria-label`, preenchimento por `transform: scaleX` (sem animar `width`).
- `TipoClienteBadge`: cores de `theme.colors.cliente`, texto sempre `#0E1729` do tema (não repetir o valor: usar o token que já define o texto sobre essas cores, ou adicioná-lo ao tema se não existir), `aria-label` com o nome por extenso.

## Decisões técnicas e trade-offs

- **Cache da conferência aberta como fonte única**, atualizado com a resposta de cada ação, em vez de refazer o `GET` inteiro a cada leitura. Menos tráfego e a tela responde na hora; o custo é a regra de merge (§5), coberta por testes. O refetch de 30 s e ao voltar o foco corrige qualquer desvio e traz o trabalho dos outros operadores.
- **Totais no cliente.** Evita esperar o servidor para mover a barra; o teste de contrato garante que a regra bate com o `totais` real.
- **Sem confirmação da placa lida.** Mais rápido para o operador; leituras erradas viram divergências descartáveis. A alternativa (confirmar cada placa) foi descartada por ir contra o objetivo.
- **Fila serial de leituras.** Simples e previsível; evita que duas respostas fora de ordem desfaçam uma à outra no cache. Não há fila persistente: sem rede, a leitura falha e o operador repete.
- **Saída em hook próprio.** Duplica um pouco do fluxo de confirmação, mas evita deformar `useSaidaFlow` (QR, busca manual) para um caso que só precisa de consulta + pagamento + recibo. A lógica compartilhada (`valorACobrar`, `valoresIguais`, `getPagamentoStatus`) continua nas funções puras de `saida.ts`.
- **Entrada em modal próprio.** Evita puxar consulta de placa, gancho de chave e recibo de `EntradaVeiculoModal` para um formulário que o back trata como "entrada pela conferência".
- **Etapa na URL.** Permite o voltar do aparelho, mas todo estado importante está no servidor: abrir uma etapa avançada sem conferência apenas redireciona.
- **Polling em vez de WebSocket/SSE.** O back não oferece push para a conferência; 30 s com a aba visível basta (a mesma estratégia do pátio).
- **`ProgressBar` e `TipoClienteBadge` no design system.** Já há três lugares com barra e selos de tipo desenhados à mão; a conferência é o ponto em que vale extrair. Migrar os usos antigos fica fora desta entrega.

## Riscos / pontos de atenção

- **Contrato das respostas não tipado no swagger.** Mitigação: mapper tolerante, `[A CONFIRMAR]` nos tipos, e uma task inicial que confere os nomes com uma conferência real em ambiente de desenvolvimento (iniciar e finalizar uma conferência de teste) e guarda uma fixture anonimizada para os testes. Não iniciar conferência em dados reais só para explorar.
- **OCR e luz.** O leitor pode errar à noite ou com sol forte. Mitigação: placa digitada, "Leitura errada", lista como método alternativo. O consenso por quadros seguidos do `criarConsenso` reduz falsos positivos; o modo contínuo não o enfraquece.
- **Duas conferências ao mesmo tempo / corrida de início.** Dois operadores iniciando juntos: o segundo recebe 400. Tratado em `iniciar` (§5).
- **Fechamento do caixa com a conferência aberta.** O back encerra como incompleta; a tela detecta por `aberta` virar `null` e avisa. Ações pendentes recebem 404 e mostram a mensagem de conferência encerrada.
- **Volume.** A conferência devolve todos os itens de uma vez e é remontada a cada refetch de 30 s. Para centenas de veículos é aceitável; a lista usa `key` estável e `React.memo` em `ConferenciaItem`. Se passar de ~500, considerar virtualização (fora desta entrega).
- **Câmera em segundo plano e consumo de bateria.** Câmera desliga ao ocultar a aba, sair da etapa e após 120 s sem leitura. Testar em celular real.
- **`useLeitorPlaca` é compartilhado.** A opção `continuo` não pode alterar o comportamento padrão: testes dos três usos atuais precisam continuar passando.
- **204 no cliente HTTP.** Confirmar o tratamento no `client.ts`.
- **Token do `input.md`.** Remover ou invalidar antes de commitar; não copiar para testes ou fixtures.

## Plano de testes

- **Regras puras (`conferencia.test.ts`):** totais (incluindo itens Baixado e Saiu), tipo do cliente, filtros, ordenação, duração, texto da leitura.
- **Mapper e serviço (`conferenciaPatio.mapper.test.ts`, `conferenciaPatio.test.ts`):** campos ausentes ou fora do tipo, 204 → `null`, placa normalizada na rota, payloads corretos, erros 400/403/404.
- **Hooks:** `useConferenciaAcoes` (merge de leitura no cache, fila serial, descarte da mesma placa em 5 s, falha de rede sem recolocar), `useSaidaConferencia` (valor mudou, valor zero, mensalista, motivo "Outro"), `useLeitorPlaca` contínuo.
- **Componentes (RTL):** cada etapa nos estados padrão, carregando, vazio e erro; marcação e desfazer; divergências (sair do item ao resolver, foco); resumo (aviso de pendentes, observação com contador, finalizar); folhas de saída, entrada e placa digitada; início com e sem caixa aberto e com conferência em andamento; `VisorPlacas` com câmera negada e indisponível; acessibilidade por papel e nome (`getByRole`) e sem rolagem horizontal onde dá para testar.
- **Página e rotas:** `page.test.tsx` (renderiza com Suspense), redirecionamento de etapa sem conferência, item no menu e permissão por perfil.
- **Manual (celular):** câmera real em HTTPS, luz forte, sequência de 10 placas, retomar depois de fechar o app, dois aparelhos na mesma conferência.
- Antes de concluir: `npm run lint`, `npm run test` e, por ser feature relevante, `npm run build`.

## Fora de escopo técnico

- Relatórios de conferências, detalhe de conferência encerrada, exportação CSV e PDF (sem endpoint).
- Divergência e atualização de posição de chave (sem endpoint).
- Emissão do ticket de entrada pelo fluxo de entrada sem ticket.
- Modo offline ou fila persistente de leituras.
- Virtualização da lista e migração dos usos antigos de barra de progresso e selos de tipo para os componentes novos.
- Atualização em tempo real (push); fica o polling.
