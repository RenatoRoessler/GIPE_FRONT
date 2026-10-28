# Tech Spec: Novo layout do Pátio, ticket e comprovante

**Status:** Rascunho
**Data:** 2026-10-28
**PRD:** ./prd.md
**Design:** ./design.md

> Convenções: `CLAUDE.md` (Next.js App Router + TypeScript + styled-components; tipos em `src/types`, serviços em `src/lib/api/services`, componentes em `src/components/<feature>`, design system em `src/components/ui`). Segue as skills `code-best-practices` e `styled-components-best-practices`. Antes de codar, reler no `node_modules/next/dist/docs/01-app/`: `03-api-reference/03-file-conventions/dynamic-routes.md` (`params` é `Promise`), `.../04-functions/use-search-params.md` (exige `Suspense`) e `.../03-file-conventions/loading.md`.
>
> **Tarefa de refactor visual + duas telas novas.** Nenhuma regra de negócio muda: ordenação, filtros, saída, chave, foco após saída e atualização automática continuam os do código atual (`src/components/patio/patio.ts`, `usePatio.ts`, `PatioView.tsx`).

## Referências

- PRD: `./prd.md` (RF1 a RF20)
- Design: `./design.md` (resumido na seção "Design"; não é redefinido aqui)
- Base existente: `docs/specs/patio/techspec.md`, `docs/specs/patio-quadro-chaves/`, `src/components/patio/*`, `src/components/veiculos/{SaidaVeiculoModal,ComprovantePublico}`, `src/components/quadros/GuardarChaveModal`, `src/lib/api/services/patio.ts`

## O que o código atual resolve e o que não resolve

| Ponto do design | Situação no código | Consequência |
|---|---|---|
| Lista de veículos | `listPatio()` + `usePatio()` (cache `PATIO_QUERY_KEY`, atualização a cada 5 min). | Reaproveitados sem mudança. O detalhe lê **do mesmo cache**, sem nova chamada de lista. |
| Capacidade e ocupação | `useVagasPatio()` devolve `{ moto, carro }`; `ocupacaoPatio()` já calcula total, carros e motos. | Resolvido: o bloco mostra o total (`carros + motos`) e a linha "Carros x/y · Motos x/y". Nada novo no back. |
| Nome do estacionamento | Está em `getEmpresa()` (`EMPRESA_QUERY_KEY`), já lido por `useVagasPatio`. | Novo hook fino que expõe o nome. Campo exato `[A CONFIRMAR]` em `CompanyData`; sem nome, o subtítulo não aparece. |
| Tipo do veículo | Só `mensalista: boolean`. **Não existe convênio** em `PatioVeiculo`, nem em `SaidaConsulta`. | O tipo é "Avulso" ou "Mensalista". O token `cliente.conveniado` existe, mas não é usado nesta versão. Decisão fechada (ver Decisões). |
| Valor até agora | `PatioVeiculo` não traz valor. `consultarComprovante(token)` (público, `GET /Patio/comprovante/cliente`) devolve `valorAtual`, `permanencia`, `minutosPermanencia`, `cnpj`, `razaoSocial`, `endereco` e `telefone`. | **O detalhe usa `consultarComprovante`**: já tem o valor calculado pelo servidor, sem efeito colateral, e os dados do estabelecimento para o comprovante. Não se calcula preço no navegador. |
| Próxima faixa | `SaidaConsulta` tem `faixaMinutosLimite`, `regra` e `horasAdicionais`, mas **não** o valor da próxima faixa; `ComprovanteCliente` não tem nenhum dos dois. | **Fora desta versão** (ver Fora de escopo): o item "Próxima faixa" não é renderizado. Fica como pendência de back. A tabela de preço aplicada (`rotatividadeDescricao`) entra no lugar, como hoje. |
| Comprovante / QR | Página pública `/comprovante/[token]`; o QR de entrada já é montado como `${window.location.origin}/comprovante/${encodeURIComponent(token)}` (`ReciboEntradaStep.tsx`). `QrCode` do design system existe. | O QR do ticket aponta para essa mesma página. Nenhuma página pública nova. |
| Chave | `GuardarChaveModal`, `IndicadorChaves`, filtros `fora`/`dentro` e `posicaoChave` já existem. | Reaproveitados; `ChaveBotao` sai da linha e passa ao detalhe. |
| Saída | `SaidaVeiculoModal` já aceita `buscaInicial` e abre direto em "Confirmar saída". | Reaproveitado; o detalhe o abre como a lista abre hoje. |
| Menu e shell | `AppShell` = `Header` + `Main` + `AppFooter` + `BottomNav` (fixa, `z-index: 20`, folga de `layout.bottomNavHeight`). | Sem mudança no menu. O detalhe respeita a altura da barra; o comprovante a cobre com uma camada fixa (ver Decisões). |
| Estado ao navegar | Busca e filtros vivem em `useState` de `PatioView`; ao sair da tela, somem. | Passam para a URL (RF8: voltar preserva). |
| Rotas | Só `/patio` existe. | Novas: `/patio/[patioId]` e `/patio/[patioId]/comprovante`. |
| Tabela | `PatioTabela`, `PatioLinha`, `ChaveBotao`, `ProporcaoBarra`/`Segmento`, `Table` não têm mais uso na lista. | Removidos junto com seus testes e estilos órfãos (ver Arquitetura). |

## Design

- **Telas/estados:** as cinco do `design.md`: Pátio (celular e computador), estados (carregando, vazio, sem resultado, erro, atualizando), detalhe do ticket e comprovante digital.
- **Componentes do design system reaproveitados:** `Button`, `Input`, `Skeleton`, `Toast`, `Text`, `StatusBadge`, `QrCode`, `Logo`, `ErrorBanner`/`ListError`, `EmptyState` de mensalistas, `Modal` (via `SaidaVeiculoModal` e `GuardarChaveModal`).
- **Componentes novos:** todos em `src/components/patio/` (nenhum novo em `src/components/ui`).
- **Tokens:** um novo, `colors.surfaceMuted` (em `ThemeColors`, `lightTheme`, `darkTheme`). Demais valores mapeados no `design.md` §3. O comprovante usa `lightTheme` num `ThemeProvider` local.
- **Ajuste no design system:** `StatusBadge` ganha `tone="avulso" | "mensal"` (cores `cliente.avulso` e `cliente.mensal`, texto `onPrimary`); `conveniado` não é adicionado agora.

## 1. Arquitetura da solução

```
src/
├── styles/theme.ts                               # + colors.surfaceMuted (claro e escuro)
├── types/patio.ts                                # + PatioFiltroTipo inalterado; sem tipos novos de dados
├── app/(app)/patio/
│   ├── page.tsx                                  # Server: <Suspense><PatioView /></Suspense>; remove título/descrição soltos
│   └── [patioId]/
│       ├── page.tsx                              # Server: valida patioId, renderiza <TicketView patioId />
│       └── comprovante/page.tsx                  # Server: renderiza <ComprovanteDigital patioId />
├── components/
│   ├── ui/StatusBadge/                           # + tones avulso e mensal (+ teste)
│   └── patio/
│       ├── patio.ts                              # + contagemPorTipo(), rotuloTipo(); regras existentes intactas
│       ├── patioUrl.ts (+ teste)                 # filtros <-> query string; link de volta com os filtros
│       ├── usePatioFiltros.ts (+ teste)          # busca/tipo/categoria/chave lidos e gravados na URL (debounce na busca)
│       ├── usePatioVeiculo.ts (+ teste)          # acha o veículo no cache de usePatio por patioId
│       ├── useComprovanteTicket.ts (+ teste)     # useQuery de consultarComprovante(token), refetch a cada 30 s
│       ├── useEstacionamento.ts                  # nome do estacionamento a partir de getEmpresa (cache já usado)
│       ├── PatioView/
│       │   ├── PatioView.tsx                     # reescrito: composição, estados, saída, foco
│       │   ├── PatioView.styles.ts               # reescrito
│       │   ├── PatioResumo.tsx                   # blocos "Vagas ocupadas" e "Por tipo" (botões de filtro)
│       │   ├── PatioFiltros.tsx                  # busca + botão "Filtros" + painel (categoria, chave, limpar)
│       │   ├── PatioCard.tsx                     # card = um <Link> para /patio/[id]
│       │   ├── PatioLista.tsx                    # <ul> em grade responsiva + "mostrar mais"
│       │   └── IndicadorChaves.tsx               # mantido
│       ├── TicketView/
│       │   ├── TicketView.tsx                    # detalhe: estados, ações, GuardarChaveModal, SaidaVeiculoModal
│       │   ├── TicketView.styles.ts
│       │   └── TicketItens.tsx                   # lista de itens (entrada, tabela, operador, sequencial, chave)
│       ├── ComprovanteDigital/
│       │   ├── ComprovanteDigital.tsx            # camada fixa, ThemeProvider(lightTheme), QR, wake lock
│       │   ├── ComprovanteDigital.styles.ts
│       │   └── useWakeLock.ts (+ teste)          # Screen Wake Lock com fallback silencioso
│       └── graficos/                             # mantidos; só reposicionados
```

**Removidos:** `PatioView/PatioTabela.tsx`, `PatioLinha.tsx`, `ChaveBotao.tsx` e seus testes; `ProporcaoBarra`, `Segmento`, `Area`, `Linha` e demais estilos de tabela de `PatioView.styles.ts`. `categoriaIcons` continua usado pelas telas de entrada/saída (não mexer).

### Rotas e navegação

| URL | Tela | Observação |
|---|---|---|
| `/patio?q=&tipo=&cat=&chave=` | Lista | Filtros na query string; ausente = "todos". |
| `/patio/[patioId]` | Detalhe | `patioId` numérico; qualquer outra coisa → `notFound()` do segmento. |
| `/patio/[patioId]/comprovante` | Comprovante | Mesmo `patioId`. |

- A lista monta os links do card com a query atual (`patioUrl.ts`), e o "Voltar" do detalhe usa `router.back()` quando há histórico do próprio Pátio, ou a lista com os filtros guardados como fallback (acesso direto por link). Assim o botão de voltar do navegador e o botão da tela coincidem.
- Busca: o campo mantém estado local imediato e grava na URL com `router.replace` depois do debounce que já existe (`useDebouncedValue`, 250 ms), sem empilhar histórico a cada letra. Tipo, categoria e chave usam `router.replace` também (são filtros, não navegação).
- `useSearchParams` fica dentro de `<Suspense fallback={esqueleto}>` na `page.tsx` da lista (exigência do Next).
- Destino de "Registrar entrada" no estado vazio e demais links externos não mudam.

### Server vs Client

| Peça | Tipo | Por quê |
|---|---|---|
| `patio/page.tsx`, `[patioId]/page.tsx`, `comprovante/page.tsx` | Server | Só validam params e montam o Client; `params` é `await`ado. |
| `PatioView`, `TicketView`, `ComprovanteDigital` e filhos | Client | Dados do React Query, estado, modais, `useSearchParams`, `navigator.wakeLock`. |
| `patio.ts`, `patioUrl.ts` | Módulos puros | Testáveis sem DOM. |

### Dados

- **Lista:** `usePatio()` inalterado. `usePatio({ pausado })` continua pausando a atualização com um modal aberto, agora em `PatioView` (saída iniciada pela lista deixa de existir) e em `TicketView` (saída e chave).
- **Detalhe:** `usePatioVeiculo(patioId)` lê o veículo de `usePatio()`. Se o cache ainda não tem a lista (acesso direto), o `usePatio` a carrega; enquanto isso o detalhe mostra o esqueleto. Se a lista chega e o `patioId` não está nela: estado "Este carro não está mais no pátio".
- **Valor, permanência, estabelecimento:** `useComprovanteTicket(token)` = `useQuery(["patio","comprovante", token], () => consultarComprovante(token))`, `staleTime` 15 s, `refetchInterval` 30 s, sem atualizar em aba escondida. A chave começa por `"patio"`, então **a invalidação do pátio (entrada/saída) também a invalida**. Enquanto carrega: permanência vem de `PatioVeiculo.permanencia`, o valor mostra esqueleto. Falha: valor mostra "—" com "Tentar novamente"; o resto do detalhe continua. Veículo sem `token`: sem valor, sem QR; botão "Mostrar QR" não é oferecido e o detalhe diz "Comprovante indisponível".
- **Mensalista:** o valor mostra "Mensal" e a ação fica só "Registrar saída" (regra `valorACobrar`, que já zera mensalista).
- **Permanência na lista:** continua a string pronta do servidor (`permanencia`). Entre atualizações de 5 min a lista não a recalcula (decisão herdada do PRD do Pátio); o card ganha apenas o texto.
- **Por tipo:** `contagemPorTipo(veiculos)` → `{ avulso, mensal }` do pátio inteiro (sem filtros), em `patio.ts`. A linha do tipo filtra com `PatioFiltroTipo` existente (`avulsos` / `mensalistas`). Linhas com zero somem, salvo se estiverem ativas (para poder desfazer), e o pátio vazio mostra "Avulso 0".
- **Invalidação:** nenhuma mudança. Saída e entrada já invalidam `PATIO_QUERY_KEY`. Depois de guardar a chave no detalhe, o mesmo (`useQuadrosMutations` já faz).

### Contratos e tipos

- `PatioVeiculo`, `PatioVagas`, `PatioOcupacao`, `ChaveRef`: **sem mudança**.
- `ComprovanteCliente` (`src/types/veiculo.ts`): **sem mudança**; `valorAtual`, `razaoSocial`, `cnpj`, `endereco`, `telefone`, `permanencia` já existem.
- Novo tipo local `TipoPatio = "avulso" | "mensal"` em `patio.ts`; `rotuloTipo(veiculo)` devolve "Avulso" ou "Mensalista".
- `patioUrl.ts`: `lerFiltros(searchParams): PatioFiltros` (valores inválidos viram "todos"), `gravarFiltros(filtros): string` (omite os padrões) e `hrefDoTicket(patioId, filtros): string`.
- Formatos: dinheiro com `formatBRL` (`src/lib/money`); data/hora com `formatDateTime`/`formatTime` (`components/caixa/format`) e `parseApiDate`; placa em mono com `normalizePlaca` (`PlateDisplay` **não** é usado, conforme o design).

### Estilos

- `PatioView.styles.ts` e `TicketView.styles.ts` seguem o padrão atual: `theme.*` em tudo, props transitórias (`$ativo`, `$tipo`), breakpoints `theme.breakpoints.md`/`lg`, `theme.layout.contentMaxWidth`.
- Grade de cards: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` limitada a 1 coluna abaixo de `md` e 3 a partir de `lg`.
- Ações do detalhe no celular: barra `position: sticky; bottom: calc(layout.bottomNavHeight + env(safe-area-inset-bottom))`, fundo `background`, com `padding-bottom` na página para não cobrir o conteúdo.
- Barra de ocupação: largura animada com `transition`, desligada em `prefers-reduced-motion`.
- `surfaceMuted`: escuro `#22304B`, claro `#ECE8DA`. O contraste do trilho contra `surface` é verificado na implementação; se ficar abaixo de 3:1, a barra ganha borda `border`.

### Comprovante digital

- `ComprovanteDigital` renderiza um `div` `position: fixed; inset: 0; z-index` **acima** do `BottomNav` e do `Header` (ambos `z-index: 20`; usar 30) com `overflow-y: auto`, dentro de `<ThemeProvider theme={lightTheme}>` para ficar claro nos dois temas. O `AppShell` não muda.
- QR: `QrCode` com `value = ${window.location.origin}/comprovante/${encodeURIComponent(token)}` (mesmo formato do `ReciboEntradaStep`), `size` calculado pela largura (até 290). Sem `token`, a rota mostra "Comprovante indisponível" e "Voltar ao ticket".
- Dados do estabelecimento: de `useComprovanteTicket` (`razaoSocial`, `cnpj`, `endereco`, `telefone`); `cnpj` e `telefone` formatados com `lib/cnpj` e `lib/phone`. Campos ausentes são omitidos, não viram "—".
- `useWakeLock()`: `navigator.wakeLock?.request("screen")` ao montar; solta ao desmontar e ao `visibilitychange: hidden`; pede de novo ao voltar a ficar visível; qualquer erro é engolido (RF17 diz "quando o aparelho permitir").
- "✕", "Pronto" e a tecla Esc fazem `router.replace("/patio/[patioId]")`. Foco inicial no `h1`; ao sair, o foco volta ao botão que abriu (o detalhe o recupera por `id`).
- `metadata`: `robots: { index: false }` no `layout`/`page` da rota (dados de veículo), como em `/comprovante/[token]`.

## Decisões técnicas e trade-offs

1. **Valor vem de `consultarComprovante`, não de cálculo no cliente nem de `consultarSaida`.** Mantém uma única fonte de preço (o servidor) e evita divergir da cobrança da saída. `consultarSaida` também devolve valor, mas é a consulta de saída (semântica de "iniciar saída", `dataHoraSaida` no instante); `consultarComprovante` é a que o próprio cliente usa. Contra: uma chamada a mais por detalhe aberto. Aceito.
2. **Filtros na URL.** É o que dá "voltar preserva busca e filtros" e endereço próprio (RF20) sem estado global. Custo: `Suspense` e cuidado para não empilhar histórico (`replace`). Alternativa descartada: Zustand/sessionStorage; some em outra aba e não funciona com o botão voltar do navegador.
3. **O detalhe lê do cache da lista.** Evita um endpoint de "ticket por id" que não existe. Contra: se o veículo saiu em outro terminal, o detalhe só descobre na próxima atualização (5 min) ou ao tocar em "Atualizar"/focar a aba (`refetchOnWindowFocus` já está ligado). A saída em si é validada pelo back (`registrarSaida` → "O veículo não está no pátio").
4. **Sem convênio, sem "próxima faixa".** O código não tem esses dados; inventá-los ou calculá-los no cliente viola a regra "sem divergir da saída". Quando o back entregar, são acréscimos locais a `TicketItens` e a `contagemPorTipo`.
5. **Comprovante como camada fixa, não como layout de rota separado.** Evita reestruturar `(app)/layout.tsx` (grupo de rotas só para essa tela). Custo: a camada precisa de `z-index` maior que o shell e bloquear o scroll de baixo. Se o shell ganhar outros elementos acima de 30, revisar.
6. **Card = um único `Link`.** Sem botões internos (evita interativo aninhado e dá alvo grande). A saída e a chave exigem um toque a mais; é o risco já registrado no `design.md`.
7. **`PlateDisplay` fica fora do Pátio novo** (placa em mono, como no protótipo). Continua nas telas de entrada e saída.
8. **`StatusBadge` ganha tons em vez de componente novo**, mantendo o selo de tipo único no sistema; as cores já estão no tema.
9. **Reescrever `PatioView` em vez de remendar.** A composição muda por completo (resumo, filtros recolhíveis, grade). A lógica pura (`patio.ts`), os hooks e os modais são preservados; os testes de comportamento (filtros, saída, foco após saída, chave, estados) são portados para a nova estrutura, não descartados.
10. **Granularidade do foco:** o hook `useFocoAposRemocao` hoje devolve o foco ao "Registrar saída" do vizinho. Sem esse botão na lista, o foco passa a ir ao `Link` do card vizinho; ao voltar do detalhe após a saída, a lista foca o primeiro card (ou a busca, se esvaziou). O anúncio "{placa} saiu do pátio." continua, agora disparado ao voltar com o aviso de saída (`?saiu=PLACA` na URL de retorno, lido uma vez e removido com `replace`).

## Riscos / pontos de atenção

- **`valorAtual` de mensalista e convênio**: `[A CONFIRMAR]` o que `/Patio/comprovante/cliente` devolve para mensalista. Mitigação: a tela não usa o valor quando `mensalista` é verdadeiro.
- **Comprovante público para veículo que já saiu**: o QR de um ticket já encerrado abre a página pública; o que ela mostra nesse caso é comportamento do back (`ComprovantePublico`, `not_found`), fora desta spec.
- **Anúncio da saída por query string**: `?saiu=` precisa ser consumido e limpo para não repetir ao recarregar. Coberto em teste.
- **`z-index` do comprovante**: se algum modal global (`Modal`, `Toast`) tiver `z-index` ≥ 30, pode aparecer por baixo ou por cima; verificar `Modal.styles.ts` e `Toast`.
- **Wake Lock**: indisponível em parte dos navegadores e exige contexto seguro; o recurso é opcional e não pode gerar erro visível.
- **Cache do detalhe**: `usePatio` com `keepPreviousData`; ao chegar de um link direto, há um instante sem veículo. O esqueleto cobre; não renderizar "não encontrado" antes de a primeira carga terminar.
- **Contraste**: `surfaceMuted` no tema claro e os selos `avulso`/`mensal` com texto asfalto nos dois temas, a medir (meta: 4,5:1 nos textos, 3:1 na barra).
- **Volume**: grade com `LIMITE_INICIAL = 100` e "Mostrar mais" como hoje; sem virtualização.
- **Testes existentes**: `PatioView.test.tsx`, `PatioView.saida.test.tsx`, `PatioView.chave.test.tsx`, `PatioTabela.test.tsx`, `ChaveBotao.test.tsx`, `page.test.tsx` e `IndicadoresPatio` dependem da estrutura antiga; os de lista/saída/chave são reescritos para a nova navegação (saída e chave passam a ser testadas em `TicketView`).
- **Segurança/privacidade**: o `token` do veículo nunca é exibido como texto; só entra no QR e na chamada ao back. O arquivo `docs/specs/input.md` pode conter um JWT real (ver PRD do Pátio): não copiar nada dele para código, testes ou docs.

## Plano de testes

- **Puros** (`vitest`): `contagemPorTipo`, `rotuloTipo`, `patioUrl` (ida e volta, valores inválidos), regras já existentes de `patio.ts` sem regressão.
- **Hooks:** `usePatioFiltros` (URL ↔ estado, debounce, `replace`), `usePatioVeiculo` (carregando, achado, ausente), `useComprovanteTicket` (token nulo, erro, mensalista), `useWakeLock` (sem suporte, perda de visibilidade).
- **Componentes:** `PatioView` (resumo e ocupação, filtro pelo "Por tipo", busca, painel de filtros, estados vazio/sem resultado/erro/carregando, card como link com nome acessível); `TicketView` (campos, mensalista, sem token, chave guardar/alterar, saída conclui e volta com aviso, saída cancelada); `ComprovanteDigital` (dados, QR com a URL certa, Pronto/✕/Esc voltam); `StatusBadge` (novos tons).
- **Acessibilidade:** `aria-pressed` nas linhas de tipo, nome do card, barra de ocupação com texto, foco após voltar/saída.
- Rodar `npm run lint` e `npm run build` ao final (CLAUDE.md).

## Fora de escopo técnico

- "Próxima faixa" de preço e valor da próxima faixa (sem dado no back).
- Tipo "Convênio" e o nome do convênio (sem dado no back); `colors.cliente.conveniado` permanece no tema, sem uso.
- Endpoint de ticket por id, paginação no back, tempo real (WebSocket) e virtualização.
- Mudar a página pública `/comprovante/[token]`, o menu, as regras de preço/saída ou a impressão.
- Atalho de "Registrar saída" no card da lista.
- Retirar a chave do quadro sem escolher outro gancho.
