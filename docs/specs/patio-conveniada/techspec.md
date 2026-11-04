# Tech Spec: Pátio da Conveniada

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e fixa o que o código precisa saber)

## Design
- **Telas/estados:** uma rota `/patio-conveniada`. Estados: carregando, lista, vazia, sem resultado, placa inválida, atualizando, erro ao carregar e sem permissão (design §1).
- **Componentes do design system reaproveitados:** `Text`, `Input`, `Button`, `StatusBadge` (tom `conveniado` já existe), `Skeleton`, `ErrorBanner`, `Toast` (se houver aviso). Erros: `ListError` (`src/components/mensalistas/ListError.tsx`, já trata o 403) e `ErroSemPermissao`.
- **Reaproveitado da visão do lojista (`src/components/patio/patio.ts`):** `corDoVeiculo`, `rotuloCategoria` e `PERMANENCIA_LONGA_MINUTOS`. Os componentes de tela do lojista (`PatioCard`, `PatioFiltros`, `PatioResumo`) não são reaproveitados: são acoplados a ticket, tipo avulso/mensal, ocupação e gráficos.
- **Componentes novos:** `PatioConveniadaPage` e `VeiculoConveniadaCard`, em `src/components/patio-conveniada/`. Nada novo no design system.
- **Tokens de tema:** só os existentes (`surface`, `border`, `text`, `textMuted`, `warn`/`onWarn`, `danger`, `space`, `radii`, `fontSizes`, `breakpoints`). Nenhum token novo.

## Arquitetura da solução

### Contrato da API
`GET /api/v1/Convenio/patio?placa=` devolve um array. O `api` do projeto já prefixa `/api/v1`, como em `/Convenio/carimbar`. Sem corpo de resposta com `dataSaida` (o back só devolve os que não saíram).

| Campo | Tipo | Observação |
|---|---|---|
| `patioConvenioId` | número | chave do item |
| `empresaId` | número | id do estacionamento |
| `estacionamento` | texto | nome do estacionamento |
| `placa`, `modelo`, `cor` | texto | cor como vem (ex.: `"PRATA"`) |
| `categoria` | número | 1 a 6 |
| `dataEntrada`, `dataValidacao` | ISO sem fuso | entrada e carimbo |
| `usuarioIdConveniada`, `usuarioConveniada` | número, texto | quem carimbou |
| `rotatividadeId`, `rotatividade` | número, texto | tabela de convênio |
| `minutosPermanencia` | número | até agora |
| `permanencia` | texto | já formatada (`"5d 22h 51min"`) |

`placa` é opcional e a placa inválida devolve 400. A lista já vem ordenada do carimbo mais recente para o mais antigo; o front **não reordena**.

### Tipos
- `src/types/patioConveniada.ts`: `VeiculoConveniada` (os campos acima, em camelCase; texto ausente vira `""` e número ausente vira `0`, como em `carimbo.mapper.ts`) e `ResumoPatioConveniada` (`total` e `porEstacionamento: { empresaId; nome; total }[]`).

### Serviço e mapper
- `src/lib/api/services/patioConveniada.mapper.ts`: `fromPatioConveniadaResponse(raw): VeiculoConveniada[]`. Resposta que não é array vira `[]`; item que não é objeto ou sem `patioConvenioId` é descartado. Usa `toNumber`/`toText` de `mapperUtils.ts`. Texto com espaços nas pontas é aparado.
- `src/lib/api/services/patioConveniada.ts`: `listarPatioConveniada(placa?: string): Promise<VeiculoConveniada[]>`. Normaliza a placa (`normalizePlaca`) e só envia `?placa=` quando ela é válida (`isValidPlaca`); caso contrário não envia o parâmetro.
- Testes: mapper (resposta completa com os dois itens do exemplo, campos ausentes e nulos, resposta que não é array, item descartado) e serviço (rota, parâmetro enviado só com placa válida, propagação do 400 e do 403).

### Pasta `src/components/patio-conveniada/`
| Arquivo | Papel |
|---|---|
| `patioConveniada.ts` | Funções puras: `resumirPorEstacionamento`, `filtrarPorPlaca` (parcial, no navegador), `filtrarPorEstacionamento`, `permanenciaLonga` (usa `PERMANENCIA_LONGA_MINUTOS`), `frasePermanencia` (texto lido pelo leitor de tela) |
| `patioConveniadaKeys.ts` | `PATIO_CONVENIADA_KEY = ["patio-conveniada"]` e a chave com a placa |
| `usePatioConveniada.ts` | `useQuery` da lista (ver "Dados e atualização") |
| `usePatioConveniadaFiltros.ts` | Estado e URL dos filtros: placa e estacionamento |
| `PatioConveniadaPage/` | Tela: topo, resumo, busca, chips de estacionamento, lista e estados |
| `VeiculoConveniadaCard/` | Cartão do veículo (design §1.1) |
| `PatioConveniada.styles.ts` | Estilos compartilhados (colunas, grade, estado vazio) |

Cada pasta de componente tem `index.ts` e teste ao lado, como no resto do projeto.

### Rota
- `src/app/(app)/patio-conveniada/page.tsx`: Server Component com `metadata.title = "Pátio — Murel"` e `Suspense` em volta de `PatioConveniadaPage` (a tela lê a URL), com o esqueleto como `fallback`. Mesmo desenho de `conferencia-patio/page.tsx`.

### Permissão e menu
- `src/lib/permissoes.ts`: nova área `AREA.PatioConveniada = "patio-conveniada"`, padrão `[AdministradorConveniada, GerenteConveniada, UsuarioConveniada]` e rota `["/patio-conveniada", AREA.PatioConveniada]`. Área própria (e não `AREA.Carimbo`) para a permissão por módulo poder liberar uma sem a outra.
- `src/lib/nav.ts`: item `{ label: "Pátio da conveniada", shortLabel: "Pátio", href: "/patio-conveniada", icon: "stampedYard", area: AREA.PatioConveniada }`, logo **depois** de "Carimbar ticket". O ícone `yard` não serve: o teste do menu exige um ícone por item. Ganha o ícone novo `stampedYard` em `NavIcons` (o "P" do pátio com a marca do carimbo).
- Verificar a tela de permissões por módulo: se ela lista as áreas de um catálogo fixo, incluir a nova (ver Riscos).
- `src/lib/telaInicial.ts` **não muda**: a conveniada continua abrindo no Carimbo.

### Integração com o carimbo
- `useCarimbar` passa a invalidar `PATIO_CONVENIADA_KEY` no sucesso, para o veículo recém-carimbado aparecer na lista sem esperar a atualização automática. A chave vem de `patioConveniadaKeys.ts` (arquivo sem dependências, evita ciclo de importação).

### Dados e atualização
- `useQuery` com chave `["patio-conveniada", placaEnviada]`, onde `placaEnviada` é a placa completa e válida ou `""`.
- `staleTime: 30_000`, `refetchInterval: 30_000`, `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true` e `placeholderData: keepPreviousData` (a lista não pisca ao atualizar nem ao trocar a placa).
- **Atualização automática não rouba foco nem rola a lista.** Ela só troca o cache; a lista é renderizada por `key = patioConvenioId`.
- O botão "Atualizar" chama `refetch()`; o estado "Atualizando…" vem de `isFetching`.
- "Atualizado às" vem de `dataUpdatedAt`.

### Filtros e URL
- A placa vive no estado local (a tecla aparece na hora) e na URL como `?placa=`; o estacionamento, como `?estacionamento=<empresaId>`. Ambos usam `router.replace` sem empilhar histórico e com `scroll: false`, no desenho de `usePatioFiltros.ts`. A placa chega à URL depois de uma pausa de 250 ms (`useDebouncedValue`).
- **Placa parcial:** filtra no navegador, por trecho, sobre a lista que já está no cache (`filtrarPorPlaca` compara o texto normalizado e **não** exige placa válida).
- **Placa completa e válida:** além do filtro local, vai ao servidor (`?placa=`), que é a fonte da verdade quando a lista é maior do que a tela mostra.
- **Placa completa (7 caracteres) e inválida:** mostra "Placa inválida" no campo, não chama o servidor e **mantém a lista como estava**.
- O chip de estacionamento filtra no navegador; só existe quando a lista tem mais de um `empresaId`. Se o estacionamento ativo deixar de existir na lista, o filtro é ignorado (não deixa a tela vazia sem explicação).

### Foco após a saída de um veículo
> **Não se aplica (decidido na T10):** o cartão não é interativo e não recebe foco, então nenhuma atualização tira o foco de um cartão. O campo de busca nunca sai da tela. Não foi criado nenhum tratamento de foco.

Quando uma atualização tira da lista o cartão que tinha o foco, o foco vai ao cartão que ocupa o lugar ou, se a lista esvaziou, ao campo de busca. Reaproveita o hook `useFocoAposRemocao` (`src/hooks`) se ele atender; senão, o mesmo desenho do `PatioView`.

### Server x Client
- `page.tsx`: Server Component.
- `PatioConveniadaPage`, `VeiculoConveniadaCard` e os hooks: Client Components (`"use client"`), porque dependem de estado, URL e TanStack Query. O cartão é `"use client"` só por viver dentro da tela; não tem estado próprio.

## Decisões técnicas e trade-offs
- **Área de permissão própria.** Evita acoplar a lista ao carimbo e permite à permissão por módulo liberar uma sem a outra. Custo: mais uma entrada no catálogo e nos testes de permissões.
- **Cartão sem link e sem ação.** A conveniada não tem ticket nem saída, então o cartão é só informação. Reaproveitar `PatioCard` obrigaria a esconder ticket, tipo e operador.
- **Filtro de placa em duas camadas.** Parcial no navegador (resposta imediata, sem chamada por tecla) e completa no servidor. Evita o 400 do back para placa incompleta e mantém o contrato (`placa` válida).
- **Sem estado global novo.** A lista é um `useQuery`; o resumo e os chips são derivados dela por funções puras. O carimbo só invalida a chave.
- **Sem paginação.** O back devolve a lista inteira. A tela corta em 100 itens com "Mostrar mais" (o mesmo corte do pátio do lojista) para não pesar o celular, sem criar uma abstração compartilhada agora.
- **Hora do relógio no topo não entra.** O design cita um relógio como na visão do lojista, mas ele não carrega informação para a conveniada; "Atualizado às" já diz a hora que importa. Se for desejado, é extrair o `Relogio` do `PatioView` depois.
- **Ícone novo `stampedYard`.** O menu exige um ícone por item (teste de `nav`), então o `yard` do pátio do lojista não pôde ser reaproveitado.

## Riscos / pontos de atenção
- **Endpoint em teste.** O `input.md` mostra uma resposta real de dois itens, mas o comportamento da placa parcial, do 400 e de listas grandes não foi exercitado. Validar no servidor de teste (túnel SSH) antes de fechar a última task.
- **Tela de permissões por módulo.** Verificado na T1: não existe tela nem catálogo de áreas no front; `PermissoesPorModulo` é só o tipo dos `overrides` de `podeAcessar`, e a regra padrão vem de `PERMISSOES_PADRAO`. Basta incluir a nova área em `AREA`, `PERMISSOES_PADRAO` e `AREA_POR_ROTA`. O contrato do back para áreas novas continua a confirmar na T15.
- **Menu e testes de navegação.** Perfis de conveniada passam a ter dois itens. Os testes de `nav`, `SideNav`, `BottomBar` e `BottomNav` contam itens e capacidades e precisam ser atualizados.
- **Permanência defasada.** Vem pronta do servidor no instante da consulta; sem atualizar, fica velha. A atualização de 30 s e o "Atualizado às" cobrem isso. Não calcular a permanência no navegador para não divergir do servidor.
- **Cor desconhecida e categoria nova.** `corDoVeiculo` e `rotuloCategoria` já toleram valor novo (texto livre sem amostra; "Categoria N").
- **Datas sem fuso.** Formatar com os utilitários existentes (`formatDateTime` de `src/components/caixa/format`), como o resto das listas, sem converter.
- **Token no `input.md`.** O arquivo traz um JWT real. Não copiar para fixtures, testes nem docs; remover o token antes de qualquer commit.
- **Dados de teste.** Fixtures dos testes usam os dois itens do exemplo, com nomes genéricos já presentes ("teste 2", "teste login").

## Fora de escopo técnico
- Carimbar, dar baixa, cobrar ou desfazer carimbo.
- Histórico de veículos que já saíram, relatórios e valores a pagar.
- Gráficos, ocupação e a vista de ticket do operador.
- Paginação no servidor e atualização em tempo real (WebSocket); a atualização é por consulta periódica.
- Mudar a tela inicial da conveniada (continua no Carimbo).
- Novos tokens de tema.
