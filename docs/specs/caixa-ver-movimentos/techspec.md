# Tech Spec: Ver movimentos do caixa

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e fixa o que o código precisa)

## Design
- Telas/estados: (1) botão "Ver movimentos" na tela do Caixa, só com caixa aberto e só a partir de `breakpoints.lg`; (2) página `/caixa/movimentos` com título, link "Voltar ao caixa", painel de resumo e a lista. Estados da página: carregando, itens, vazio, filtro sem resultado, erro com tentar de novo, 403 e sem caixa aberto.
- Componentes do design system reaproveitados: `Button`, `Link`, `Text`, `ErrorBanner`, `Skeleton`, `StatusBadge`, `Table`, `Pagination` e `Select` (estes via `MovimentosLista`), `ErroSemPermissao`.
- Componentes novos necessários:
  - `MovimentosCaixaPage` em `src/components/caixa/MovimentosCaixaPage/` (página da lista do caixa aberto).
  - Nenhum em `src/components/ui`.
- Tokens de tema usados/criados: só os existentes (`space`, `colors.*`, `radii`, `breakpoints.lg`). Nenhum token novo.

## Arquitetura da solução

### Arquivos
| Arquivo | Mudança |
|---|---|
| `src/app/(app)/caixa/movimentos/page.tsx` | **Novo.** Server Component com `metadata.title = "Movimentos do caixa — Murel"`; renderiza `<MovimentosCaixaPage />`. Mesmo molde de `caixa/historico/[caixaId]/page.tsx`, sem parâmetros. |
| `src/components/caixa/MovimentosCaixaPage/MovimentosCaixaPage.tsx` | **Novo.** Client Component. |
| `src/components/caixa/MovimentosCaixaPage/index.ts` | **Novo.** Reexporta, como as demais páginas da pasta. |
| `src/components/caixa/movimentos.ts` | Recebe `somarMovimentos` (hoje a função privada `somar` de `ExtratoCaixaPage`) para as duas páginas usarem a mesma conta. |
| `src/components/caixa/ExtratoCaixaPage/ExtratoCaixaPage.tsx` | Passa a importar `somarMovimentos` de `../movimentos`; sem mudança de comportamento. |
| `src/components/caixa/CaixaPage/CaixaPage.tsx` | Renderiza o link "Ver movimentos" quando há caixa aberto. |
| `src/components/caixa/CaixaResumo.styles.ts` | Novo styled `VerMovimentos` (ver abaixo). |
| Testes | `MovimentosCaixaPage.test.tsx` (novo); ajustes em `ExtratoCaixaPage.test.tsx` só se o import quebrar; teste do botão em `CaixaPage`. |

Nenhuma mudança em `src/lib/api`, `src/types/caixa.ts` nem `src/lib/permissoes.ts`: o endpoint `GET /Caixa/movimentos` já é consumido por `listMovimentos`, o mapper já traduz `observacao` em `motivo` e `tipo`/`origem` em `entrada | saida | sangria`.

### Permissão
`/caixa/movimentos` casa com o prefixo `/caixa` em `AREA_POR_ROTA` (o mais longo vence e `/caixa/historico` não o alcança), ou seja, `AREA.Caixa`: Administrador, Gerente, Caixa e Manobrista. É a decisão do design (todos os perfis do Caixa). Nada a configurar.

### Dados
- `MovimentosCaixaPage` usa `useCaixa()`, não uma consulta nova. Assim a página compartilha o cache `["caixa", "movimentos"]` com a tela do Caixa (abrir a lista é instantâneo quando o usuário vem de lá) e reaproveita `refetchOnWindowFocus: true` para refletir lançamentos de outros operadores.
- `caixaQuery` decide o estado externo (pending → esqueleto, 403 → `ErroSemPermissao`, erro → `ErrorBanner` + "Tentar novamente", `caixa === null` → aviso "Não há caixa aberto." + `Link` para `/caixa`). `movimentosQuery` alimenta o painel e a lista.
- Ordenação: copiar o array e ordenar por `dataHora` decrescente (`toSorted`, ou cópia + `sort`) antes de passar à lista. O ISO sem fuso ordena corretamente como string; `movimentoId` desempata. Não confiar na ordem da API.
- Painel de resumo: **Aberto em** (`caixa.dataHoraAbertura` via `formatDateTime`), **Entradas** e **Saídas e retiradas** via `somarMovimentos`, exibidos com `formatMoeda`. Enquanto os movimentos carregam, só "Aberto em" aparece (mesmo padrão do extrato, que esconde os totais).
- `MovimentosLista` recebe `movimentos`, `turnos={turnosDosMovimentos(...)}`, `isError`, `error`, `onRetry={() => void movimentosQuery.refetch()}` e `vazio="Ainda não há movimentos neste caixa."`. Sem `renderAcoes` (sem CSV/PDF).

### Botão "Ver movimentos"
- `Link` (Next, via `src/components/ui/Link`) estilizado como botão `secondary`, apontando para `/caixa/movimentos`: é navegação, não ação. Se `Link` não tiver visual de botão, o styled `VerMovimentos` envolve o `Link` do design system com `display: none` por padrão e `display: inline-flex` em `@media (min-width: ${theme.breakpoints.lg})`, usando só tokens. `display: none` também o retira da árvore de acessibilidade, como pede o design.
- Posição: no topo da tela, alinhado à direita da linha do título "Caixa", **fora** de `AcoesCaixa` (que continua com Fechar caixa em destaque). Como o `<h1>` é `VisuallyHidden` hoje, o botão entra em uma linha própria acima do primeiro cartão (`AberturaCaixa`), alinhada à direita; o encaixe fino é decisão de implementação, validada visualmente.
- Só dentro do ramo "caixa aberto" de `CaixaPage` (o fragmento que renderiza `AberturaCaixa`, `ValorEmCaixa` etc.). Não depende de `turnoQuery`.
- Largura: `Tela` limita a 720px e `Page` a 1100px. A tabela cabe em 1100px; a página nova usa `Page`, sem alterar `Tela`.

### Server vs Client
| Peça | Tipo | Motivo |
|---|---|---|
| `caixa/movimentos/page.tsx` | Server | Só define `metadata` e monta o componente. |
| `MovimentosCaixaPage` | Client | React Query, estado e `MovimentosLista` (que usa `useState`). |
| Link "Ver movimentos" | Client (já dentro de `CaixaPage`) | Faz parte de um Client Component existente. |

## Decisões e trade-offs
- **Reaproveitar `useCaixa` em vez de um hook novo.** Evita duplicar as consultas e dá cache compartilhado. O custo é que a página também dispara a consulta do turno (`enabled: caixa !== null`), que ela não usa; é uma chamada barata e já em cache vindo do Caixa. Se incomodar, extrair um `useCaixaAberto` mínimo fica para depois.
- **Rota própria em vez de modal.** O PRD diz "abre a tela de movimentos"; rota dá URL, botão voltar do navegador e reaproveita o padrão do extrato.
- **Ocultar por CSS, não por JS (`matchMedia`).** Sem hidratação divergente nem `useEffect`, e segue o padrão de media query de `Caixa.styles`. O botão existe no DOM, mas escondido, em telas pequenas.
- **Rota acessível em tela pequena.** Só o botão some no celular; abrir a URL direto funciona (a lista já vira cartões). Bloquear exigiria lógica de viewport sem ganho real.
- **Filtros e paginação da lista ficam.** Esconder exigiria flags novas em `MovimentosLista`. O PRD precisa ser ajustado (ver design).
- **`somarMovimentos` compartilhada.** Só extraímos o que as duas páginas realmente repetem; a moldura de página (título, link, painel) não vira abstração agora, porque as duas telas diferem em dados do painel e ações.

## Riscos / pontos de atenção
- **Classificação de `origem: 2`.** O mapper trata `origem === 2` como Sangria. A saída "compra de material de limpeza" do exemplo da API pode ser uma despesa, e então o badge apareceria errado. Confirmar com o backend antes de liberar; se houver outro código, ajustar `classificarMovimento` e seus testes.
- **Lista pode misturar períodos.** O exemplo da API traz movimentos de 23 a 29/10 num mesmo retorno. Se o endpoint não filtra pelo caixa aberto, o painel e a lista mostrariam dados de mais de um caixa. Validar com a API real; se confirmado, filtrar no backend (preferível) ou cruzar por `turnoId` com os turnos do caixa.
- **Valores do painel vs. tela do Caixa.** O painel soma movimentos; a tela do Caixa soma por forma de pagamento. Tem que bater (entradas = valor em caixa). Cobrir com teste usando os mesmos dados.
- **Ordem da API.** Resolvida pela ordenação local, mas confirmar que `movimentoId` desempata de forma estável.
- **Token real em `docs/specs/input.md`.** Remover antes de commitar.
- **Next.js diferente do conhecido** (AGENTS.md): conferir em `node_modules/next/dist/docs/` a convenção de `page.tsx`, `metadata` e `Link` antes de implementar.

## Fora de escopo técnico
- Mudar `src/lib/api` ou os tipos de `Movimento`.
- Exibir placa ou dados do veículo (a API só traz `patioId`).
- Exportar CSV/PDF desta tela.
- Versão própria da lista para celular, bloqueio da rota por tamanho de tela e permissão específica para a rota.
- Lançar despesa, estorno ou edição de movimentos.
