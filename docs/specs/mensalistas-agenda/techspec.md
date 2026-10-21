# Tech Spec: Agenda de vencimentos dos mensalistas

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-10-21
**PRD:** ./prd.md
**Design:** ./design.md

> Convenções: segue o `CLAUDE.md` (Next.js App Router + TypeScript + styled-components; tipos em `src/types`, serviços em `src/lib/api/services`, componentes em `src/components/<feature>`, design system em `src/components/ui`). Antes de escrever código, ler o guia relevante em `node_modules/next/dist/docs/` (o `AGENTS.md` avisa que esta versão do Next tem mudanças incompatíveis); esta feature só toca em `useRouter`/`useSearchParams` de `next/navigation`.
>
> **Limite desta spec:** o Swagger exige login e o token de `docs/specs/input.md` expirou. O que se sabe da listagem vem de `docs/specs/mensalistas-contrato/techspec.md` (`situacao`, `dataProximoVencimento`, `diasAteProximoVencimento`, `veiculos`). Como a API marca o atraso, o tamanho máximo de página e a ordenação por vencimento são `[A CONFIRMAR]` e estão isolados em `agenda.ts` e no serviço, para trocar sem mexer em tela.

## Referências

- PRD: `./prd.md` (RF-01 a RF-10)
- Design: `./design.md`. A seção abaixo resume o que lá está decidido e não redefine nada.
- Base existente: `src/components/mensalistas/*` (lista, ficha, pagamento, situação, contrato)
- Modelos visuais: https://claude.ai/artifact/XzKzxUJG7D9xfcJC9njZK3 (modelo B, computador e celular)

## O que o código atual resolve e o que não resolve

| Ponto | Situação no código | Consequência |
|---|---|---|
| Dados da agenda | `Mensalista` já traz `ativo`, `situacao`, `dataProximoVencimento`, `diasAteProximoVencimento`, `valorMensalidade`, `veiculos`, `tipoMensal` e `categoria` (`types/mensalista.ts`). | A agenda não precisa de campo novo para agrupar, ordenar e resumir. |
| Listagem | `listMensalistas({ pagina, tamanhoPagina, documento })`: paginada, sem ordenação nem filtro por situação. | A agenda carrega todos os cadastros (várias páginas) e agrupa no cliente. Isso troca simplicidade por volume; ver "Decisões". |
| Pagamento | `PagamentoMensalistaModal` e `podeRegistrarPagamento` recebem `(mensalista, situacao)`; `MensalistasPage` já tem `ModalState { kind: "pagamento" }`. | "Receber" da agenda reutiliza o fluxo, só chama o mesmo callback. |
| Situação / contrato | `derivarSituacao` + `useContratosMensalistas(items)` (só para inativos "Aguardando Primeiro Pagamento"). | A agenda usa os dois sobre o conjunto completo para decidir "Receber" × "Reenviar". |
| Reenvio | `useReenviarContrato` (id em andamento, invalidação, toast). | Reutilizado sem mudança. |
| Abas | `aba.ts`: `mensalistas` e `tipos`; `MensalistasPage` troca a URL por `?aba=`. A paginação da lista usa `?pagina=N` sem `aba`. | Ganha a aba `agenda` (padrão) e `mensalistas` vira `lista`; a URL antiga `?pagina=N` precisa continuar abrindo a lista. |
| Selos | `StatusBadge`: tons `success`, `neutral`, `info`, `warn`. | Falta o tom `danger` e o token `dangerSoft` (design §3). |
| Altura mínima de toque | `Button size="sm"` fica com cerca de 28px; `Tabs` já tem 44px e rola na horizontal. | Estilo local de 44px na agenda; nenhum tamanho novo de botão. |
| Cabeçalho do app | Fixo no celular (`position: sticky`), sem expor a altura. | Títulos de grupo não ficam fixos (design §1C). |

## Design

- **Telas/estados:** conforme `design.md`: aba Agenda (computador e celular), estados de carregamento, vazio, busca sem resultado, erro, reenvio em andamento e atualização em segundo plano.
- **Componentes do design system reaproveitados:** `Tabs`, `Button`, `Input`, `StatusBadge`, `PlateDisplay`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`, e do domínio: `MensalistaFichaModal`, `PagamentoMensalistaModal`, `useReenviarContrato`.
- **Componentes novos:** em `src/components/mensalistas/`: `AgendaView`, `AgendaGrupo`, `AgendaItem`, `AgendaResumo` e `agenda.ts`. Nenhum componente novo em `src/components/ui`; só o tom `danger` do `StatusBadge`.
- **Tokens:** um token novo, `colors.dangerSoft`, nos quatro temas de `theme.ts` (claro, escuro e os dois de sinalização, que usam o mesmo tipo `AppTheme`).

## 1. Arquitetura da solução

```
src/
├── styles/theme.ts                                  # + colors.dangerSoft (4 temas)
├── components/
│   ├── ui/StatusBadge/StatusBadge.styles.ts         # + tom "danger" (fundo dangerSoft, texto text, ponto danger)
│   └── mensalistas/
│       ├── aba.ts (+ aba.test.ts)                   # "agenda" | "lista" | "tipos"; "agenda" é o padrão
│       ├── agenda.ts (+ agenda.test.ts)             # regras puras: agrupar, ordenar, resumir, filtrar
│       ├── useAgendaMensalistas.ts (+ teste)        # carrega todos os cadastros (várias páginas)
│       ├── AgendaView/
│       │   ├── AgendaView.tsx                       # busca, resumo, grupos, estados, foco pós-pagamento
│       │   ├── AgendaView.styles.ts
│       │   ├── AgendaGrupo.tsx
│       │   ├── AgendaItem.tsx
│       │   ├── AgendaResumo.tsx
│       │   ├── AgendaView.test.tsx
│       │   └── index.ts
│       ├── MensalistasPage/MensalistasPage.tsx      # + aba agenda, botão "+ Novo" flutuante no celular
│       └── MensalistasList/MensalistasList.tsx      # URLs com aba=lista; busca por nome/placa (T9)
├── lib/api/services/mensalista.ts                   # + listAllMensalistas
└── types/mensalista.ts                              # + tipos da agenda
```

### Server × Client

| Peça | Tipo | Por quê |
|---|---|---|
| Todas as peças novas | **Client** | React Query, estado de busca, foco e `useSearchParams`. Já ficam dentro da árvore client de `MensalistasPage`. Nenhuma rota nova e nenhum Server Component. |

## 2. Tipos (`src/types/mensalista.ts`)

```ts
export type AgendaGrupoId = "atrasados" | "hoje" | "semana" | "sem-pagamento";

// Um mensalista na agenda, já com o grupo e a situação derivada.
export type AgendaItemData = {
  mensalista: Mensalista;
  grupo: AgendaGrupoId;
  situacao: SituacaoMensalista;
  // Data do próximo vencimento como dia local (sem hora); null quando o back não informa.
  vence: Date | null;
  // > 0 só em "atrasados".
  diasAtraso: number;
};

export type AgendaGrupoData = { id: AgendaGrupoId; titulo: string; itens: AgendaItemData[] };

export type AgendaResumoData = {
  // Hoje + esta semana; atrasados têm contagem própria.
  quantidade: number;
  total: number;
  ate: Date;
};

export type Agenda = {
  grupos: AgendaGrupoData[];
  emDia: number;
  resumo: AgendaResumoData;
};
```

## 3. Dados e API

Nenhum endpoint novo. Usa `GET /Mensalista` (já existe).

```ts
// src/lib/api/services/mensalista.ts
listAllMensalistas(opts?: { tamanhoPagina?: number; maxPaginas?: number }):
  Promise<{ items: Mensalista[]; totalRecords: number; truncado: boolean }>
```

- Busca a página 1; se `totalPages > 1`, busca as demais **em paralelo** (`Promise.all`) até `maxPaginas` e junta os itens. `truncado` é `true` quando `totalPages > maxPaginas`.
- Padrões: `tamanhoPagina = AGENDA_PAGE_SIZE` (100) e `maxPaginas = 10`, ou seja, até 1000 cadastros. `[A CONFIRMAR]` o tamanho máximo aceito pela API: se recusar 100, cai no tamanho aceito sem mudar o resto (a página 1 devolve `pageSize`, e o serviço usa esse valor para calcular as demais).
- Reutiliza `listMensalistas` (mapeia a resposta e normaliza placas e CPFs).

```ts
// src/components/mensalistas/useAgendaMensalistas.ts
useAgendaMensalistas(): UseQueryResult<{ items; totalRecords; truncado }>
```

- `queryKey: [...MENSALISTAS_QUERY_KEY, "agenda"]`. Está sob o prefixo de `MENSALISTAS_QUERY_KEY`, então o pagamento (`invalidateQueries(MENSALISTAS_QUERY_KEY)`), o reenvio e o cadastro atualizam a agenda sem código novo.
- `staleTime: 30_000`, `refetchOnWindowFocus: false`, `placeholderData: keepPreviousData` (a agenda não pisca ao atualizar).

## 4. Regras puras (`agenda.ts`)

```ts
montarAgenda(
  items: Mensalista[],
  situacaoDe: (mensalista: Mensalista) => SituacaoMensalista,   // derivarSituacao + contratos
  hoje: Date,
): Agenda

filtrarAgenda(agenda: Agenda, busca: string): Agenda
fimDaSemana(hoje: Date): Date          // domingo; se hoje é domingo, é o próprio dia
diasEntre(de: Date, ate: Date): number // dias de calendário, sem horas
```

**Classificação de cada mensalista:**

| Condição | Grupo |
|---|---|
| `!ativo` e `situacao` = "Aguardando Primeiro Pagamento" | `sem-pagamento` |
| `!ativo` com outra `situacao` (desativado) | fica fora da agenda (só aparece na Lista) |
| `ativo` e sem `dataProximoVencimento` | fora da agenda; conta em `emDia` |
| `ativo` e `vence < hoje` | `atrasados`; `diasAtraso = diasEntre(vence, hoje)` |
| `ativo` e `vence = hoje` | `hoje` |
| `ativo` e `hoje < vence <= fimDaSemana(hoje)` | `semana` |
| `ativo` e `vence > fimDaSemana(hoje)` | fora da agenda; conta em `emDia` |

- A data é tratada como **dia local**: pega `AAAA-MM-DD` dos primeiros 10 caracteres de `dataProximoVencimento` e monta `new Date(ano, mês - 1, dia)`. Evita o deslocamento de `new Date("2026-11-05")`, que é UTC (mesma razão de `formatDiaCobranca`).
- **Atraso `[A CONFIRMAR]`:** a regra acima usa a data. Se o back marcar o atraso de outro jeito (por exemplo `diasAteProximoVencimento` negativo, ou a `situacao` "Pagamento Atrasado", ou uma tolerância de atraso do tipo), só `classificar` muda. Enquanto não for confirmado, vale a data; a `situacao` do back não é usada para atraso.

**Ordenação:** `atrasados` do mais antigo para o mais recente (maior `diasAtraso` primeiro); `hoje` e `semana` por `vence` e, no empate, por nome; `sem-pagamento` por tipo de situação (`aguardando-pagamento` primeiro, depois `link-vencido`, `sem-contrato`, `aguardando-aceite`, `carregando`/`desconhecida`) e, no empate, por nome (`localeCompare("pt-BR")`).

**Resumo:** `quantidade` e `total` somam `hoje` + `semana` (o `total` é a soma de `valorMensalidade`; `[A CONFIRMAR]` se deve ser o da cobrança pendente). `ate = fimDaSemana(hoje)`. Atrasados ficam fora, porque já têm título e contagem próprios.

**Busca (`filtrarAgenda`):** normaliza o termo (minúsculas, sem acentos) e casa **nome**, **placa** (`normalizePlaca`, sem hífen) ou **documento** (só dígitos). Termo só com dígitos casa por prefixo do documento; os demais, por trecho. Termo vazio devolve a agenda inteira. Recalcula o resumo sobre os itens encontrados e zera `emDia` na exibição.

## 5. Componentes e comportamento

### Página e abas

- `aba.ts`: `ABAS = agenda | lista | tipos`; `parseAba(valor, { temPagina })` devolve `agenda` por padrão. **Compatibilidade:** sem `aba` na URL mas com `pagina`, devolve `lista` (as URLs antigas `?pagina=N` continuam abrindo a lista).
- `MensalistasPage`: `changeAba` navega para `/mensalistas` (agenda) ou `/mensalistas?aba=lista` / `?aba=tipos`. Na aba agenda renderiza `AgendaView`, passando `onVerFicha`, `onReceberPagamento`, `onNovo` e `onToast`, os mesmos callbacks que alimentam `MensalistasList`.
- `MensalistasList`: as URLs de paginação passam a ser `?aba=lista&pagina=N` (e `?aba=lista` na página 1).
- **Botão "+ Novo mensalista":** no celular (< `breakpoints.md`) o botão do cabeçalho some e entra um botão flutuante fixo (`position: fixed`, canto inferior direito, 48px, `shadows.md`, deslocado pela área segura). O conteúdo ganha `padding-bottom` para não ficar escondido.

### `AgendaView`

- `useAgendaMensalistas()` para os dados; `useContratosMensalistas(items)` para os contratos dos aguardando-1º-pagamento (já limita a consulta a esses itens); `situacaoDe(m) = derivarSituacao(m, contratos.get(m.mensalistaId), agora)`; `montarAgenda(...)` dentro de `useMemo`.
- Estado local `busca` (não vai para a URL, como na lista: o documento do cliente não deve ficar no endereço). `filtrarAgenda` roda com o termo já com debounce (`useDebouncedValue`, 250 ms).
- `useReenviarContrato` com o mesmo toast da lista; o item que está sendo reenviado fica desabilitado.
- **Foco depois do pagamento:** `AgendaView` guarda `{ grupo, indice }` do último item acionado. Quando a lista nova não tem mais aquele mensalista, o foco vai (nesta ordem) para o botão-nome do item que ocupa o lugar, o título do grupo, ou o campo de busca. Uma região `role="status"` oculta anuncia "{nome} saiu de {grupo}." Esse anúncio e o foco são do `AgendaView`; o toast de "Pagamento registrado" continua sendo o do modal.
- **Truncado:** se `truncado`, mostra uma nota discreta "Mostrando os primeiros N mensalistas. Use a Lista para os demais." e o resumo diz "nesta carga". Não bloqueia nada.
- Estados: carregando (esqueletos), vazio, busca sem resultado, erro (`ErrorBanner` com "Tentar novamente", sem o botão quando o erro for de permissão), atualizando (opacidade e `aria-busy`).

### `AgendaGrupo` e `AgendaItem`

- `AgendaGrupo`: `section` com `aria-labelledby`, título e contagem, `ul` de itens e, em `semana` e `sem-pagamento`, "Ver os outros N" (limite de 5 visíveis; estado local do grupo). `atrasados` e `hoje` mostram todos.
- `AgendaItem` (`li`):
  - botão-nome → `onVerFicha(mensalista)`;
  - ação principal: `Receber` quando `podeRegistrarPagamento(situacao).pode` e (grupo ≠ `sem-pagamento` ou `situacao.kind` = `aguardando-pagamento`); `Reenviar` quando `situacao.kind` é `aguardando-aceite`, `link-vencido` ou `sem-contrato` ("Enviar contrato" no último); nenhuma ação enquanto `carregando`;
  - "Receber" chama `onReceberPagamento(mensalista, situacao)`;
  - peso da ação: primária em `atrasados` e `hoje`, secundária em `semana`; `Reenviar` é sempre secundária;
  - em `sem-pagamento`, o selo no lugar da data usa `apresentarSituacao`-like: "1º pagamento" (`info`), "Contrato" (`warn`) e "Link vencido" (`danger`), com a linha de fato ("Contrato aceito em 20/10", "Link vence em 27/10") que já vem de `apresentarSituacao`.
- Layout: grade de cinco colunas a partir de `breakpoints.md`; abaixo, duas linhas com o botão ocupando as duas. `min-height: 44px` no botão-nome e na ação no celular.

### `StatusBadge` e tema

- `theme.ts`: `colors.dangerSoft` em `ThemeColors` e nos quatro temas (`rgba(226, 61, 78, 0.12)` no claro e `rgba(255, 107, 107, 0.16)` no escuro; os de sinalização reaproveitam os mesmos valores do par claro/escuro correspondente).
- `StatusBadge`: tom `danger`: `background-color: dangerSoft`, `color: text`, com um `::before` de 8px (círculo) em `colors.danger`. O texto continua sendo a informação; o ponto só reforça.

## 6. Decisões técnicas e trade-offs

- **Agrupar no cliente sobre o conjunto completo**, em vez de pedir ordenação e filtros ao back: entrega a agenda agora, com a API que existe. O preço é carregar todos os cadastros (até 1000) a cada abertura. É aceitável para o tamanho esperado (algumas centenas) e fica atrás de `listAllMensalistas`, que pode virar uma chamada única quando o back oferecer ordenação, filtro e totais. O corte `truncado` evita que um cliente grande trave a tela.
- **Uma query para todas as páginas** (e não `useQueries` por página): um único estado de carregamento e de erro, e uma única chave de invalidação. A desvantagem é não renderizar parcialmente; como as páginas vão em paralelo, o tempo é o da mais lenta.
- **Dados de contrato só dos aguardando-1º-pagamento**, como na lista: não cria consulta por mensalista ativo.
- **Sem menu de três pontos e sem título fixo:** evita um componente de overlay novo e uma dependência da altura do cabeçalho (design §1).
- **Atraso pela data, não pelo texto da `situacao`:** o texto é do back e pode mudar; a data é um fato. Fica isolado em `classificar` para o caso de o back definir tolerância.
- **Dia local, sem fuso:** a data de vencimento é um dia de calendário; tratá-la como instante em UTC causa erro de um dia no Brasil.
- **Busca no cliente:** como a agenda já tem todos os cadastros, a busca por nome e placa não depende do back. Na Lista (paginada no servidor), a busca por nome e placa reaproveita esse mesmo conjunto (T9) e deixa a busca por documento como está.
- **Sem Zustand ou Context novo:** o estado do servidor fica no React Query, e o de UI (busca, "ver mais", foco) local.

## 7. Testes

Vitest + Testing Library, nos padrões existentes (`*.test.ts(x)` ao lado do arquivo).

| Alvo | Casos |
|---|---|
| `agenda.test.ts` | Cada linha da tabela de classificação; o limite de "hoje" e de domingo (hoje sendo segunda, domingo e sábado); virada de mês e de ano; `dataProximoVencimento` nula; inativo desativado fora; ordenação de cada grupo; resumo (quantidade e total só de hoje e semana); `emDia`; `diasEntre` com horário de verão; data de vencimento em formato com hora (`...T00:00:00`) e só data. |
| `filtrarAgenda` | Nome com acento e sem; placa com e sem hífen; documento por prefixo e mascarado; termo sem resultado; termo vazio; resumo recalculado. |
| `aba.test.ts` | `agenda` como padrão; `lista` e `tipos`; `?pagina` sem `aba` abre `lista`; valor inválido cai em `agenda`. |
| `mensalista.test.ts` (serviço) | `listAllMensalistas`: uma página; várias páginas juntadas em ordem; `truncado` quando passa de `maxPaginas`; erro em uma página rejeita tudo; usa o `pageSize` devolvido pela primeira página. |
| `useAgendaMensalistas.test.tsx` | Chave sob o prefixo dos mensalistas; invalida junto com o pagamento. |
| `AgendaView.test.tsx` | Grupos na ordem e sem os vazios; item com data, atraso em texto e selo `danger`; "Receber" chama o callback com mensalista e situação; contrato pendente mostra "Reenviar", sem "Receber"; reenvio desabilita só o item; "Ver os outros N"; busca filtra e anuncia o resultado; busca sem resultado e "Limpar busca"; estado vazio; erro com e sem "Tentar novamente"; carregando; foco volta ao próximo item depois do pagamento; região de anúncio "{nome} saiu de {grupo}"; nota de `truncado`. |
| `MensalistasPage` | Agenda é a aba padrão; trocar de aba atualiza a URL; `+ Novo` no celular; "Receber" da agenda abre o pagamento; "Ver ficha" abre a ficha. |
| `MensalistasList` | URLs de paginação com `aba=lista`; busca por nome e placa pelo conjunto completo (T9). |
| `StatusBadge` | Tom `danger` renderiza o texto e o ponto. |

**Validação contra a API real:** checklist manual numa task final.
1. Confirmar `dataProximoVencimento` e `diasAteProximoVencimento` de mensalistas atrasados, de hoje e do futuro, e como a API marca o atraso.
2. Confirmar o tamanho máximo de página aceito e o tempo de carga com o volume real.
3. Pagar um atrasado e conferir que ele sai do grupo e que o foco e o anúncio funcionam.
4. Reenviar o contrato de um item da agenda.
5. Conferir no celular (320px, 390px e tablet) os alvos de 44px, a rolagem das abas e o botão flutuante com o teclado aberto.
6. Registrar o formato real do atraso no Tech Spec.

Rodar `npm run lint`, `npm run test` e `npm run build` ao final.

## 8. Riscos / pontos de atenção

| Risco | Impacto | Mitigação |
|---|---|---|
| A API não devolve o atraso como esperado, ou só devolve o vencimento futuro | Alto: o grupo "Atrasados" fica errado | A regra está isolada em `classificar`; confirmar com dados reais na primeira task de integração e pedir ao back a marcação explícita de atraso, se faltar. |
| Carregar todos os cadastros fica lento para empresas grandes | Médio | Páginas em paralelo, `staleTime` de 30 s, corte em 1000 e nota de `truncado`; pedir ao back ordenação, filtros e totais para a agenda. |
| A API recusa `tamanhoPagina = 100` | Baixo | Usa o `pageSize` devolvido pela primeira página. |
| O pagamento ainda depende do `usuarioId` numérico (ver `mensalistas-pagamento`) | Alto para o valor da agenda | A agenda funciona sem o pagamento (lista, busca, reenvio); "Receber" entrega o aviso atual do modal até o back resolver. |
| Mudar `?pagina=N` para `?aba=lista&pagina=N` quebra favoritos antigos | Baixo | `parseAba` com `pagina` sem `aba` abre a lista. |
| Contratos consultados para muitos aguardando-1º-pagamento | Baixo | Já limitado a esses itens, com `staleTime` de 60 s. |
| O botão flutuante cobre o último item ou fica atrás do teclado | Médio | `padding-bottom` no conteúdo e `bottom` com a área segura; testar com o teclado aberto no celular. |
| `dangerSoft` em um dos temas de sinalização destoa do fundo | Baixo | Usar os valores do par claro/escuro correspondente; conferir os dois no navegador. |

## 9. Fora de escopo técnico

- Ordenação, filtros e totais no back (a agenda funciona sem eles).
- Quadro por etapas, relatórios, lembretes e notificações.
- Histórico de cobranças e cálculo de juros ou multa.
- Mudança de regra de vencimento, tolerância ou valor.
- Reconhecimento do mensalista pela placa na entrada e saída.
- Título de grupo fixo no celular e menu de ações extras (decididos fora no design).

## 10. Resultados da execução (2026-10-21)

**Feito (T1 a T9):** `npm run lint` sem erros, `tsc --noEmit` limpo, `npm run test` com 109 arquivos e 1241 testes verdes e `npm run build` passando. Os testes usam a API simulada e `jsdom`, que não avalia as regras de `@media`: o layout do celular, o botão flutuante e os dois temas **não foram vistos no navegador**.

**Decisões tomadas na implementação (diferem do texto acima):**
- **Busca achando quem não está nos grupos.** Quem está em dia ou desativado não aparece nos grupos, mas é o caso mais comum de quem chega pelo carro. `Agenda` ganhou `ocultos` (em dia e inativos) e a busca os mostra em dois grupos extras, "Em dia" e "Inativos". `AgendaGrupoId` ganhou `em-dia` e `inativos`.
- **Nome com várias palavras.** A busca por nome exige todas as palavras, em qualquer ordem ("jose conceicao" acha "José da Conceição").
- **Documento por prefixo alfanumérico.** O prefixo de documento aceita letras (CNPJ alfanumérico), desde que o termo não tenha espaço.
- **Lista.** `buscaEhTexto` decide o modo: só dígitos e pontuação buscam no servidor; qualquer letra filtra o conjunto completo no cliente, com paginação local de 20. O hook `useMensalistasDaLista` junta os dois modos. A barra de busca continua visível enquanto o conjunto completo carrega (sem isso, o campo sumia no meio da digitação).
- **Botão "Novo mensalista".** Na aba Agenda ele passa para o cabeçalho da página (tela larga) e para um botão flutuante "+ Novo" (celular), com folga embaixo. Na Lista continua o botão da barra de ferramentas.
- **Foco depois do pagamento.** `AgendaView` recebe `bloqueado` (algum modal aberto) e só move o foco quando ele fecha; antes, a agenda atrás do modal não recebe foco. Se o pagamento foi cancelado e o item continua, o foco fica no botão que abriu o modal.
- **Anúncio.** A região de anúncio "{nome} saiu de {grupo}." existe na tela da agenda; no caso raro de o último cadastro sair, a tela passa ao estado "Nenhum mensalista cadastrado" e o anúncio não é lido.
- **Resumo.** A frase tem uma versão longa (computador) e uma curta (celular), alternadas por CSS; os dois textos estão no DOM, só um aparece.

**Ainda aberto:** o roteiro manual contra a API real (tarefa T10): como o back marca o atraso, o tamanho máximo de página, o tempo de carga com o volume real, o pagamento (que depende do `usuarioId` numérico, ver `mensalistas-pagamento`), o reenvio, o celular e os dois temas.

**Ajustes de celular na Lista e na agenda (2026-10-21), conferidos num navegador com viewport de 390px:**
- Abaixo de `breakpoints.md` a tabela da Lista vira itens de três linhas (nome e ações; tipo e valor; situação e placa), sem moldura e sem rolagem lateral. Documento, e-mail, telefone e dia de vencimento saem da linha (estão na ficha e na edição). O nome da linha passou a ser um botão que abre a ficha, e o ícone "Ver ficha" some no celular.
- `useIsMobile` (`src/hooks/useMediaQuery.ts`) faz a Lista e a agenda mostrarem uma placa e o "+N" no celular (duas no computador). Sem `matchMedia` vale falso.
- A agenda esconde tipo e categoria no celular e deixa o vencimento sozinho na linha de baixo do nome; placa e valor dividem a linha seguinte.
- Botões secundários em lista ganharam contorno (`Reenviar`, `Receber` fora de urgência, `Ver os outros N`, `Ver todos`): o fundo `surface` é o da página e eles sumiam.
- Sem rolagem horizontal em 390px (conferido por `scrollWidth`). **Não conferido:** 320px, tablet, tema escuro e o celular real (teclado, área segura e o botão flutuante com o teclado aberto).
- **Observação fora do escopo:** no computador, a tabela da Lista (8 colunas) rola na horizontal e a coluna "Ações" (pagamento e editar) fica fora da tela mesmo em 1280px. Não verifiquei se é anterior a estas mudanças; a agenda resolve o uso diário, mas a Lista em tela larga merece revisão própria.
