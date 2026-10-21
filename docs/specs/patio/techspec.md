# Tech Spec: Tela de pátio

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-10-21
**PRD:** ./prd.md
**Design:** ./design.md

> Convenções: segue o `CLAUDE.md` (Next.js App Router + TypeScript + styled-components; tipos em `src/types`, serviços em `src/lib/api/services`, componentes em `src/components/<feature>`, design system em `src/components/ui`). Antes de escrever código, ler o guia relevante em `node_modules/next/dist/docs/` (o `AGENTS.md` avisa que esta versão do Next tem mudanças incompatíveis); esta feature cria uma rota nova (`/patio`) e usa só Server Component para a página e Client Components para a tela.
>
> **Limite desta spec:** o contrato de `GET /Patio` vem do exemplo de `docs/specs/input.md` (um array de objetos, sem paginação). O token desse arquivo é real: **não copiar para código, testes ou documentos**. Os testes montam dados fictícios com os mesmos campos. Formato exato dos campos ausentes (`modelo` e `cor` nulos, `permanencia` com menos de um dia, `quadroChaves`) e o tamanho máximo da lista são `[A CONFIRMAR]` e ficam isolados no mapper.

## Referências

- PRD: `./prd.md` (RF-01 a RF-11)
- Design: `./design.md`. A seção abaixo resume o que lá está decidido e não redefine nada.
- Base existente: `src/lib/api/services/patio.ts`, `src/components/veiculos/*` (entrada, saída, comprovante), `src/components/mensalistas/AgendaView` (padrão de lista, busca, foco depois de uma ação)

## O que o código atual resolve e o que não resolve

| Ponto | Situação no código | Consequência |
|---|---|---|
| Listagem do pátio | `services/patio.ts` tem entrada, saída e comprovante, mas **não** tem `GET /Patio`. | Novo `listPatio()` com mapper e tipos. |
| Saída de um veículo | `SaidaVeiculoModal` + `useSaidaFlow` começam sempre na fase "pesquisa" (câmera de QR e busca manual). A fase vem dos dados: `resultado` → recibo, `consulta` → pagamento, senão pesquisa. | O modal precisa aceitar uma busca inicial. Sem tratamento, durante a consulta inicial ele **mostraria a pesquisa e ligaria a câmera**. Ver "Saída direta". |
| Atualização depois da saída | `useSaidaFlow` não invalida nenhuma consulta ao registrar a saída; `EntradaVeiculoModal` também não. | Nenhuma lista de pátio hoje depende disso. A nova lista precisa ser invalidada em **ambos** os fluxos, senão fica velha depois de uma entrada ou saída feita na mesma máquina. |
| Comprovante | Página pública `/comprovante/[token]` (token de 4 a 32 letras e números). | "Ver comprovante" é um link para ela, em nova aba. Nenhum componente novo. |
| Categoria, cor e placa | `CATEGORIA_VEICULO_OPTIONS`, `CategoriaIcon`, `matchCor`/`CORES_VEICULO`, `normalizePlaca`, `PlateDisplay`. | Reaproveitados; categoria ou cor desconhecidas precisam de um tratamento seguro. |
| Menu | `NAV_ITEMS` + `NavIcons` (`NavIconId`), usados por `Gantry` e `MobileNav`. | Novo item e novo ícone; o item aparece sozinho nos dois menus. |
| Permissão | Não há controle de perfil no cliente. | A página aparece para quem acessa o sistema; a API recusa (403) quando não permitir. |
| Padrão de lista no celular | `ListaRow` e `useIsMobile` (mensalistas). | A tabela do pátio usa o mesmo desenho de tabela que vira itens abaixo de `breakpoints.md`. |

## Design

- **Telas/estados:** conforme `design.md`: página "Pátio" no computador (tabela de sete colunas) e no celular (itens de quatro linhas), saída a partir do veículo, comprovante em nova aba, e os estados carregando, sem veículos, sem resultado, erro e atualizando.
- **Componentes do design system reaproveitados:** `Table`, `Input`, `Select`, `Button`, `StatusBadge`, `PlateDisplay`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`, `CategoriaIcon`.
- **Componentes novos:** em `src/components/patio/`: `PatioView`, `PatioTabela`, `PatioLinha`, `PatioFiltros` e `patio.ts` (regras puras). Nenhum componente novo em `src/components/ui`.
- **Tokens:** nenhum token novo (`design.md` §3).

## 1. Arquitetura da solução

```
src/
├── app/(app)/patio/page.tsx                    # Server: título, descrição e <PatioView />
├── lib/
│   ├── nav.ts                                  # + NavIconId "yard" e o item "Pátio" (entre Saída e Caixa)
│   └── api/services/patio.ts                   # + listPatio() e mapper (fromPatioResponse)
├── components/
│   ├── layout/NavSign/NavIcons.tsx             # + YardIcon
│   ├── veiculos/
│   │   ├── SaidaVeiculoModal/
│   │   │   ├── SaidaVeiculoModal.tsx           # + prop buscaInicial
│   │   │   └── useSaidaFlow.ts                 # + buscaInicial, fase direta, invalida o pátio
│   │   └── EntradaVeiculoModal/EntradaVeiculoModal.tsx   # invalida o pátio ao registrar
│   └── patio/
│       ├── patio.ts (+ patio.test.ts)          # ordenar, filtrar, resumir, rótulos
│       ├── usePatio.ts (+ teste)               # query + atualização automática
│       ├── PatioView/
│       │   ├── PatioView.tsx                   # resumo, busca, filtros, estados, saída, foco
│       │   ├── PatioView.styles.ts
│       │   ├── PatioTabela.tsx                 # Table no computador; itens no celular (CSS)
│       │   ├── PatioLinha.tsx
│       │   ├── PatioFiltros.tsx
│       │   ├── PatioView.test.tsx
│       │   └── index.ts
│       └── (reuso) EmptyState, ListError de mensalistas
└── types/patio.ts                              # PatioVeiculo
```

### Server × Client

| Peça | Tipo | Por quê |
|---|---|---|
| `app/(app)/patio/page.tsx` | **Server** | Só monta o título e a descrição, como `veiculos/saida/page.tsx`. Sem busca de dados no servidor: a API exige o token do navegador. |
| `PatioView` e filhos, hooks | **Client** | React Query, estado de busca e filtros, modal de saída, foco e `window` (visibilidade da aba). |
| `NavIcons`, `Gantry`, `MobileNav` | **Client** (já são) | Só ganham o item novo. |

## 2. Tipos (`src/types/patio.ts`)

```ts
// Um veículo no pátio (GET /Patio). `quadroChaves` não é lido nesta versão.
export type PatioVeiculo = {
  patioId: number;
  placa: string;                       // normalizada
  categoria: number;                   // CATEGORIA_VEICULO; valores novos do back não quebram a tela
  modelo: string | null;
  cor: string | null;                  // texto livre
  codigoTicket: number | null;
  sequencial: number;
  mensalista: boolean;
  dataHoraEntrada: string;             // sem fuso; parseApiDate
  minutosPermanencia: number;          // calculado pelo servidor no instante da consulta
  permanencia: string;                 // texto pronto do servidor, ex.: "4d 1h 7min"
  rotatividadeDescricao: string | null;
  usuarioEntrada: string | null;
  token: string | null;                // abre o comprovante; nunca exibido
};

export type PatioFiltroTipo = "todos" | "mensalistas" | "avulsos";
export type PatioFiltros = { busca: string; tipo: PatioFiltroTipo; categoria: number | "todas" };

export type PatioResumo = { total: number; mostrados: number };
```

## 3. Contrato de API e serviço

Nenhum endpoint novo para o back: usa `GET /Patio`.

```ts
// src/lib/api/services/patio.ts
listPatio(): Promise<PatioVeiculo[]>
```

- `api.get<Record<string, unknown>[]>("/Patio")` e `data.map(fromPatioResponse)`; resposta que não é array vira lista vazia.
- `fromPatioResponse` lê cada campo de forma tolerante (`Number()`, `typeof` e `?? null`), normaliza a placa (`normalizePlaca`) e o token (texto não vazio ou `null`). `codigoTicket` aceita número ou texto numérico. Modelo ou cor vazios viram `null`. **Não** lê `quadroChaves`.
- Erros sobem como `ApiError`, como nos demais serviços.

```ts
// src/components/patio/usePatio.ts
export const PATIO_QUERY_KEY = ["patio"] as const;
usePatio({ pausado }: { pausado?: boolean }): UseQueryResult<PatioVeiculo[]>
```

- `queryKey: PATIO_QUERY_KEY`, `staleTime: 30_000`, `placeholderData: keepPreviousData`, `refetchOnWindowFocus: true` (voltar para a aba atualiza o pátio).
- **Atualização automática:** `refetchInterval: pausado ? false : 60_000` e `refetchIntervalInBackground: false`. Isso mantém a permanência e as entradas e saídas feitas em outros terminais em dia sem recalcular nada no cliente. Decide o `[A DEFINIR]` do PRD (RF-09): atualiza sozinha a cada minuto **e** sob comando.
- `pausado` é verdadeiro com o modal de saída aberto: a lista não muda debaixo do operador enquanto ele recebe o pagamento.
- Fica **fora** do prefixo de mensalistas; é invalidada por `PATIO_QUERY_KEY` (ver abaixo).

## 4. Regras puras (`patio.ts`)

```ts
ordenarPatio(itens: PatioVeiculo[]): PatioVeiculo[]
filtrarPatio(itens: PatioVeiculo[], filtros: PatioFiltros): PatioVeiculo[]
resumirPatio(todos: PatioVeiculo[], visiveis: PatioVeiculo[]): PatioResumo
rotuloCategoria(categoria: number): string     // "Carro pequeno"; desconhecida → "Categoria N"
corDoVeiculo(cor: string | null): { texto: string; amostra: string | null }
```

- **Ordem:** `minutosPermanencia` decrescente (o que está há mais tempo primeiro) e, no empate, a placa. [A CONFIRMAR] a ordem desejada (PRD RF-03); só `ordenarPatio` muda.
- **Busca (`filtrarPatio`):** termo sem acento e em minúsculas, vazio devolve tudo. Casa:
  - **placa:** o termo reduzido a letras e números, em maiúsculas, aparece na placa (placa com ou sem hífen, parcial a partir de 2 caracteres);
  - **modelo:** o termo aparece no modelo (sem acento), e várias palavras exigem todas, em qualquer ordem;
  - **ticket e sequencial:** termo só com dígitos casa, por prefixo, o `sequencial` ou o `codigoTicket`.
- **Filtros:** `tipo` ("mensalistas" mantém `mensalista === true`, "avulsos" o contrário) e `categoria` (igualdade numérica). Busca e filtros valem juntos.
- **Resumo:** `total` é o tamanho da lista carregada; `mostrados` o resultado dos filtros. A frase da tela usa "N veículos no pátio" quando iguais e "M de N veículos" quando há filtro.
- **Cor:** `matchCor` decide se há amostra (cor em `CORES_VEICULO`); caso contrário só o texto (inclusive valores livres como "teste"); cor vazia vira "—".
- **Categoria:** `rotuloCategoria` procura em `CATEGORIA_VEICULO_OPTIONS`; o ícone só aparece para categorias conhecidas.

## 5. Saída a partir do veículo

### `SaidaVeiculoModal` e `useSaidaFlow`

- `SaidaVeiculoModalProps` ganha `buscaInicial?: SaidaBusca` (`{ tipo: "placa", valor }`; a lista usa a placa normalizada).
- `useSaidaFlow({ buscaInicial })`:
  - estado inicial de `busca` é `buscaInicial ?? null` e de `buscaValues` é `{ placa: buscaInicial.valor, token: "", sequencial: "" }` (a pesquisa, se aparecer, já vem preenchida);
  - novo estado `direto` (verdadeiro enquanto a abertura vinda da lista não foi descartada);
  - `fase`: `resultado` → `recibo`; `consulta` **ou** (`direto` e a consulta ainda não falhou) → `pagamento`; senão `pesquisa`;
  - `limpar()` (usado por "Voltar para a pesquisa") põe `direto` em falso, para voltar de verdade à pesquisa.
- Efeito: na abertura direta o modal mostra a fase "Confirmar saída" com o resumo ainda vazio (os componentes `ResumoSaida` e `PagamentoSaida` já aceitam `consulta` nula, com o pagamento inativo) e **não monta o leitor de QR**, então a câmera não é pedida.
- Se a consulta falha (o veículo saiu em outro terminal), `fase` cai em `pesquisa`, com o aviso que o fluxo já mostra e a placa preenchida.
- Sem `buscaInicial`, o comportamento atual não muda; os testes existentes continuam valendo.

### Invalidação

- No `onSuccess` da saída registrada (`tipo: "registrada"`), `queryClient.invalidateQueries({ queryKey: PATIO_QUERY_KEY })`.
- Em `EntradaVeiculoModal`, no `onSuccess` do `registrarEntrada`, a mesma invalidação.
- A dependência é `veiculos` → `patio/usePatio.ts` (só a constante). Para não criar ciclo, a constante mora em `src/components/patio/patioKeys.ts`, importada por `usePatio` e pelos dois fluxos.

## 6. Componentes e comportamento

### Página e menu

- `app/(app)/patio/page.tsx`: `<Text variant="heading">Pátio</Text>`, a descrição e `<PatioView />`, como as demais páginas de veículos.
- `nav.ts`: `NavIconId` ganha `"yard"`; `NAV_ITEMS` ganha `{ label: "Pátio", href: "/patio", icon: "yard" }` entre "Saída de Veículos" e "Caixa". `isNavItemActive` já cobre rotas filhas.
- `NavIcons.tsx`: `YardIcon`, um quadrado com a letra P em traço (mesmo traço e tamanho dos demais, 20px e `strokeWidth` 1.8), e a entrada em `ICONS`.

### `PatioView`

- `usePatio({ pausado: saida !== null })`.
- Estado local: `busca`, `tipo`, `categoria`, `saida` (o `PatioVeiculo` com o modal aberto), `anuncio`, e `limite`. A busca passa por `useDebouncedValue` (250 ms); busca e filtros não vão para a URL (o termo pode ser uma placa de cliente).
- `ordenarPatio` e `filtrarPatio` rodam em `useMemo` sobre `data`, `termo` e filtros.
- **Resumo** em `role="status"`: "42 veículos no pátio" ou "12 de 42 veículos"; "Atualizado às 14:32" vem de `dataUpdatedAt` (`formatHora`) e **não** é uma região viva, porque muda a cada minuto. O botão "Atualizar" chama `refetch()` e mostra "Atualizando…" enquanto `isFetching`.
- **Limite de linhas:** mostra as primeiras 100 e um botão "Mostrar mais 100", que soma 100 ao `limite`; qualquer mudança de busca ou filtro volta o `limite` a 100. Isso limita o DOM com centenas de veículos sem virtualização.
- **Estados:**
  - carregando (`isPending`): esqueletos e `role="status"` "Carregando o pátio";
  - lista vazia sem filtro: "Nenhum veículo no pátio." e o botão "Registrar entrada", um `Link` para `/veiculos/entrada`;
  - sem resultado: "Nada encontrado para “…”." com "Limpar busca", e/ou "Nenhum veículo com esses filtros." com "Limpar filtros";
  - erro: `ListError` (mensagem do back, "Tentar novamente", sem o botão em 403);
  - atualizando: opacidade reduzida e `aria-busy`.
- **Ações:**
  - "Registrar saída" define `saida` e renderiza `<SaidaVeiculoModal buscaInicial={{ tipo: "placa", valor: placa }} onClose={…} onSuccess={showToast} />`; o `Toast` vem de `useToast`, como em `RegistrarSaidaButton`.
  - "Ver comprovante" é um `<a href="/comprovante/{token}" target="_blank" rel="noopener noreferrer">` estilizado como `IconButton` (44px). Sem token, o ícone não é renderizado.
- **Foco depois da saída:** mesma ideia da agenda de mensalistas. Ao clicar em "Registrar saída", guarda `{ id, placa, vizinhos }`. Quando o modal fecha (`saida === null`) e o veículo não está mais na lista, o foco vai para o "Registrar saída" do próximo vizinho que ainda existe, ou para o campo de busca, e uma região `role="status"` oculta anuncia "{placa} saiu do pátio.". Se o veículo continua (saída cancelada ou falha), o foco fica no botão que abriu o modal. A lógica fica num hook `useFocoAposRemocao` em `src/hooks/`, para a agenda poder usá-lo depois; a agenda **não** é refatorada nesta entrega.

### `PatioTabela` e `PatioLinha`

- Usam `Table`, `TableHead`, `TableBody` e `TableCell` com `data-label`, e uma linha estilizada no padrão do `ListaRow` das telas de mensalistas: a partir de `breakpoints.md` é a linha da tabela; abaixo, uma grade de quatro linhas (placa e ação; modelo e categoria; permanência e entrada; tabela de preço e operador), com o botão de comprovante embaixo de "Registrar saída". O botão e o ícone têm `min-height: 44px` no celular.
- Colunas (computador): placa (`PlateDisplay md` e o selo "Mensalista"), veículo (modelo, cor e `CategoriaIcon` com o rótulo), entrada (`formatDateTime`, "Seq. N" e "Ticket N"), permanência (negrito, `tabular-nums`, o texto de `permanencia`), tabela de preço e operador (duas linhas com reticências e `title`), ações.
- Cabeçalho de verdade (`th scope="col"`); no celular o cabeçalho sai da tela e continua para leitores de tela (padrão do `Table`).
- Nomes acessíveis: "Registrar saída de {placa}" e "Ver comprovante de {placa} (abre em nova aba)".

### `PatioFiltros`

- `Input` (rótulo "Buscar por placa, modelo ou ticket") e dois `Select`: "Tipo" e "Categoria" (com `CATEGORIA_VEICULO_OPTIONS`). "Limpar filtros" só quando há filtro ativo. No celular, a busca ocupa a largura toda e os filtros dividem uma linha em duas colunas.

## 7. Decisões técnicas e trade-offs

- **Filtrar e ordenar no cliente:** a API devolve tudo de uma vez e não aceita filtros. Para algumas centenas de veículos é rápido e dá busca imediata. Se o volume crescer, `listPatio` é o único ponto a trocar (paginação e filtros no back), junto com `usePatio`.
- **Atualização automática de 60 s pausada com o modal aberto:** mantém a permanência e as entradas de outros terminais sem recalcular o tempo no cliente (o cálculo local erraria em fusos diferentes, porque `dataHoraEntrada` vem sem fuso). A pausa evita a lista mudar enquanto o operador recebe um pagamento.
- **Placa como identificador da busca de saída:** `consultarSaida` já aceita `placa`; evita criar um endpoint ou uma segunda consulta por `patioId`. O custo é uma segunda ida ao servidor ao abrir a saída, que de todo modo recalcula o valor naquele instante (regra do fluxo existente).
- **Fase "direta" na saída:** é um ajuste mínimo do fluxo existente e mantém o que o operador já conhece (resumo, pagamento, recibo). Não se cria um segundo modal de saída.
- **Comprovante em nova aba:** reaproveita a página pública já testada, pensada para o celular, e evita um modal e a busca de dados da empresa. Fica a verificar o que ela mostra para um veículo já fora do pátio (Riscos).
- **Sem estado global novo:** React Query para dados do servidor, estado local para busca, filtros e modal.
- **Foco em um hook genérico:** a agenda já tem a mesma lógica inline; duplicá-la numa terceira tela seria pior. O hook nasce para o pátio, e a agenda adota depois, sem risco de regressão agora.

## 8. Testes

Vitest + Testing Library, nos padrões existentes (`*.test.ts(x)` ao lado do arquivo). Dados de teste fictícios; nenhum token real.

| Alvo | Casos |
|---|---|
| `patio.test.ts` | Ordem por permanência e desempate por placa; busca por placa (com e sem hífen, parcial), por modelo (sem acento, várias palavras) e por ticket e sequencial (prefixo de dígitos); termo vazio; mensalista × avulso; categoria; filtros combinados; resumo; cor conhecida e livre ("teste") e vazia; categoria desconhecida. |
| `services/patio.test.ts` | `listPatio`: mapeia os campos; `modelo`/`cor` nulos; `codigoTicket` nulo, numérico e em texto; placa normalizada; não lê `quadroChaves`; resposta que não é array vira lista vazia; erro vira `ApiError`. |
| `usePatio.test.tsx` | Chave `["patio"]`; recarrega a cada 60 s (relógio falso) e não recarrega com `pausado`; invalidar a chave recarrega. |
| `useSaidaFlow` / `SaidaVeiculoModal` | Com `buscaInicial`, abre direto em "Confirmar saída", **sem montar o leitor de QR**; consulta a placa uma vez; com falha da consulta, cai na pesquisa com o aviso e a placa preenchida; "Voltar para a pesquisa" volta de verdade; sem `buscaInicial` o comportamento é o de hoje; registrar a saída invalida `["patio"]`. |
| `EntradaVeiculoModal` | Registrar a entrada invalida `["patio"]`. |
| `PatioView.test.tsx` | Frase de resumo e horário; lista, colunas e selo de mensalista; tabela de preço e operador com traço quando ausentes; busca e filtros (com anúncio "M de N"); sem resultado e "Limpar"; vazio com "Registrar entrada"; carregando; erro com e sem "Tentar novamente"; "Atualizar" e "Atualizando…"; "Mostrar mais 100"; comprovante com `href`, `target` e `rel` corretos e nome acessível, e sem ícone quando não há token; "Registrar saída" abre o modal com a placa; depois da saída o veículo some, o foco vai ao vizinho e o anúncio é lido; saída cancelada mantém o veículo e o foco. |
| `nav` / menus | O item "Pátio" aparece no menu do computador e no do celular, na ordem certa, e fica ativo em `/patio`. |

**Validação contra a API real:** checklist manual numa task final, em homologação.
1. Abrir o Pátio e conferir contagem, ordem, tabela de preço e operador.
2. Confirmar `modelo` e `cor` nulos, o formato de `permanencia` abaixo de um dia e o tamanho máximo da lista.
3. Buscar por placa, modelo e ticket.
4. Registrar a saída a partir da lista e conferir que o veículo sai, o foco e o aviso.
5. Abrir o comprovante de um veículo do pátio e o de um que já saiu.
6. Registrar uma entrada em outra aba e conferir que a lista a mostra na próxima atualização.
7. Conferir 320px, 390px e tablet, os dois temas, e o tempo de carga com o volume real.

Rodar `npm run lint`, `npm run test` e `npm run build` ao final.

## 9. Riscos / pontos de atenção

| Risco | Impacto | Mitigação |
|---|---|---|
| Volume de veículos maior que o esperado (sem paginação) | Médio | Limite de 100 linhas visíveis com "Mostrar mais"; pedir paginação e filtros ao back se passar de algumas centenas. |
| A câmera de QR ligaria ao abrir a saída pela lista | Alto: pede permissão do navegador sem sentido | A fase "direta" não monta o leitor; teste dedicado. |
| A página pública do comprovante pode não existir para quem já saiu do pátio | Baixo | Conferir na validação; a lista só mostra quem está no pátio, e o link só vale enquanto o ticket está aberto. |
| A atualização automática muda a lista durante um clique | Médio | Pausar com o modal aberto; os botões citam a placa, e o modal de saída mostra a placa em destaque para o operador conferir. |
| `permanencia` com formato diferente abaixo de um dia | Baixo | A tela exibe o texto do servidor sem reformatar; confirmar na validação. |
| Valores livres de cor e categorias novas do back | Baixo | `corDoVeiculo` e `rotuloCategoria` tratam o desconhecido sem quebrar. |
| O token da API está no `input.md` | Alto | Remover ou invalidar antes de qualquer commit; testes com dados fictícios. |
| Permissão: a tela aparece para qualquer usuário logado | Baixo | A API devolve 403 e a mensagem é exibida; revisitar quando houver perfil no cliente. |

## 10. Fora de escopo técnico

- Paginação, filtros e ordenação no back, e virtualização da lista.
- Alertas de permanência, quadro de chaves, mapa de vagas e relatórios.
- Editar ou cancelar uma entrada.
- Recalcular a permanência no cliente.
- Impressão de comprovante.
- Refatorar a agenda de mensalistas para o hook de foco compartilhado.

## 11. Resultados da execução (2026-10-21)

**Feito (T1 a T8):** `npm run lint` sem erros, `tsc --noEmit` limpo, `npm run test` com 121 arquivos e 1339 testes verdes e `npm run build` passando. O layout do computador (1280px) e do celular (390px) foi conferido num navegador, com uma página temporária de pré-visualização e dados fictícios (já removida). **Não conferido:** 320px, tablet, tema escuro, a API real e um celular de verdade.

**Decisões tomadas na implementação (diferem do texto acima):**
- **Seis colunas, não sete.** "Tabela e operador" é uma coluna de duas linhas (como no wireframe do design); o Tech Spec contava as duas separadas.
- **Cancelar a saída pede confirmação.** O fluxo de saída já pergunta "Cancelar a saída?" quando o veículo foi encontrado; a abertura direta herda isso. Só enquanto o veículo ainda carrega dá para desistir sem pergunta, e a placa vinda da lista não conta como algo digitado.
- **O modal não pode ser recriado.** Quando o último veículo sai, a lista vira o estado vazio; sem uma chave estável, o modal de saída era recriado e perdia o recibo. O modal, o toast e o anúncio ficam num bloco com chave, dentro do mesmo contêiner em todos os estados. Uma falha ao atualizar com a lista já na tela não a derruba.
- **Um só "Limpar filtros".** Fica na barra de filtros, que continua à vista; o estado "sem resultado" só oferece "Limpar busca".
- **Hook de foco.** `useFocoAposRemocao` (em `src/hooks`) e `vizinhosDe` ficaram genéricos; a agenda de mensalistas continua com a lógica própria (não foi refatorada).
- **Câmera.** Na abertura direta, o leitor de QR não é montado (teste dedicado).
- **Ajustes de visual** vistos no navegador: botões secundários ganharam contorno, o separador "·" some no celular (começava a linha quando quebrava), a data de entrada ocupa a largura toda no celular, e a coluna de ações se mantém alinhada quando um veículo não tem comprovante.

**Ainda aberto (T9):** o roteiro manual contra a API real e os formatos reais dos campos.
