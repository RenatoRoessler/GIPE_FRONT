# Tech Spec: Menu de Serviços separado em Operação e Cadastro

> **Revisão (Financeiro fora):** o perfil Financeiro **não** tem acesso a Serviços (nem à fila nem ao catálogo). A documentação do back lista `GET /Servico` só para Administrador, Gerente, Caixa, Manobrista e Lavador, e a decisão foi não pedir a inclusão. Onde este documento ainda fala em Financeiro consultando o catálogo, vale esta nota.

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só resume e aponta)
- Relacionados: `docs/specs/menu-grupos/` (grupos do menu), `docs/specs/permissoes-por-perfil/` (matriz por perfil), `docs/specs/modulo-servicos/` e `docs/specs/servicos-melhorias/` (conteúdo das telas).

## Design
- **Telas/estados**: ver `design.md`. Duas páginas sem abas: Fila de serviços (`/servicos`) e Catálogo de serviços (`/servicos/catalogo`).
- **Componentes do design system reaproveitados**: `Skeleton`, `InfoCard` (via `ServicosDesligados`), `NavIcon`, e os componentes do menu (`SideNav`, `MenuSheet`, `BottomBar`) sem mudança de código.
- **Componentes novos** (em `src/components/servicos/`): `FilaServicosPage`, `CatalogoServicosPage`. Em `src/components/layout/NavIcons/`: ícone `catalog`.
- **Tokens de tema**: nenhum novo.

## Arquitetura da solução

### Permissões (`src/lib/permissoes.ts`)
O ponto central. Hoje há uma só área de rota (`AREA.Servicos`) cobrindo `/servicos`, e ela também é usada **dentro** do ticket do Pátio (trocar o status de um serviço: `ServicoDetalheSheet`, `ServicosDoVeiculo`). Remover Administrador e Gerente dessa área quebraria o que o PRD manda manter (RF5), então a área existente **não é alterada**. Entram duas áreas novas, só para menu e rota:

| Área (`AREA.*`) | Chave | Perfis padrão | Uso |
|---|---|---|---|
| `ServicosFila` (nova) | `servicos.fila` | Caixa, Manobrista, Lavador | Item "Fila de serviços" e a rota `/servicos` |
| `ServicosCatalogoConsulta` (nova) | `servicos.catalogo.consulta` | Administrador, Gerente, Financeiro | Item "Catálogo de serviços" e a rota `/servicos/catalogo` |
| `Servicos` (existente) | `servicos` | Administrador, Gerente, Caixa, Manobrista, Lavador (igual) | Ações de status no ticket; deixa de ser a área de menu e de rota |
| `ServicosCatalogo` (existente) | `servicos.catalogo` | Administrador, Gerente (igual) | Cadastrar, editar e inativar. O Financeiro **fica de fora**: consulta sem editar (RF6) |
| `ServicosPatio` (existente) | `servicos.patio` | igual | Acrescentar e cancelar no ticket (e Cancelar na fila) |

- Chaves existentes ficam intactas: elas podem estar guardadas como permissão por módulo; renomeá-las sobrescreveria configuração salva.
- `AREA_POR_ROTA`: trocar `["/servicos", AREA.Servicos]` por `["/servicos", AREA.ServicosFila]` e acrescentar `["/servicos/catalogo", AREA.ServicosCatalogoConsulta]`. O prefixo mais longo já vence (`ROTAS_POR_ESPECIFICIDADE`), então `/servicos/catalogo` e subcaminhos usam a área do catálogo.
- `PERMISSOES_PADRAO` é `Record<Area, ...>`: o TypeScript obriga as duas entradas novas. Atualizar o comentário de `Servicos` ("ver o catálogo e a fila" não vale mais) e `permissoes.test.ts`, que repete a matriz.
- Overrides (`PermissoesPorModulo`): as áreas novas aceitam override pelo mesmo mecanismo; a tela de permissões já lê as chaves de `AREA`. **Verificar** na task se a tela de permissões lista as áreas por uma tabela própria que precise das duas novas.

### Menu (`src/lib/nav.ts`)
- `NavIconId` ganha `"catalog"`.
- Trocar o item atual por dois, mantendo a ordem do menu:
  - `{ label: "Fila de serviços", shortLabel: "Fila", href: "/servicos", icon: "services", area: AREA.ServicosFila, grupo: "operacao" }` (último de Operação);
  - `{ label: "Catálogo de serviços", shortLabel: "Catálogo", href: "/servicos/catalogo", icon: "catalog", area: AREA.ServicosCatalogoConsulta, grupo: "configuracoes" }` logo depois de "Gestão de Preços".
- Os testes `nav.test.ts` (contagem de itens, ordem, grupos) e os do menu (`BottomNav.test.tsx`, `MenuSheet.test.tsx`, `SideNav.test.tsx`) passam de 19 para 20 itens e de um para dois itens de serviços.
- `NavIcons.tsx`: componente `CatalogIcon` no mesmo `IconBase` e em `ICONS`.

### Redirecionamento dos endereços antigos (RF7)
O guarda de rota é o `src/proxy.ts`: ele hoje manda quem não tem a área para `/acesso-negado`. Sem tratamento, Administrador e Gerente abrindo um `/servicos` guardado nos favoritos cairiam em "acesso negado". Solução: função pura, testada, usada pelo proxy **antes** da checagem de área.

- Novo `src/lib/servicosRotas.ts` com `destinoLegadoDeServicos(perfil, pathname, searchParams): string | null`:
  - só age quando `pathname === "/servicos"`;
  - perfil com `ServicosFila`: devolve `null` (fica na fila);
  - senão, perfil com `ServicosCatalogoConsulta`: devolve `/servicos/catalogo`, repassando `servico` quando existir e válido;
  - senão `null` (cai na checagem normal, que nega).
- `proxy.ts`: com token válido, se `destinoLegadoDeServicos(...)` devolver destino, `NextResponse.redirect`. A regra usa os padrões (`podeAcessar` sem overrides), igual ao proxy hoje; os overrides continuam sendo aplicados na tela pelo `useCan`.
- Não usar `redirects` de `next.config.ts`: dependem do perfil, que só o proxy (cookie) conhece.
- Antes de codar, conferir em `node_modules/next/dist/docs/` as convenções do `proxy.ts` desta versão do Next (o `AGENTS.md` avisa que mudam). O arquivo já existe e usa `NextResponse.redirect`; a mudança só adiciona uma condição.

### Páginas e componentes (`src/components/servicos/`, `src/app/(app)/servicos/`)
Todos Client Components (usam `useCan`, React Query, `useSearchParams`); as rotas continuam Server Components finos com `Suspense`.

- `src/app/(app)/servicos/page.tsx`: renderiza `FilaServicosPage` no `Suspense`.
- `src/app/(app)/servicos/catalogo/page.tsx` (novo): renderiza `CatalogoServicosPage` no `Suspense`.
- `FilaServicosPage`: `Tela` + `Titulo` "Fila de serviços" + `ServicosDesligados` + `FilaServicos`; exporta `FilaServicosEsqueleto`.
- `CatalogoServicosPage`: `Tela` + `Titulo` "Catálogo de serviços" + `ServicosDesligados` + `ServicosMasterDetail`; exporta `CatalogoServicosEsqueleto`.
- Reaproveitar `ServicosPage.styles.ts` (`Tela`, `Titulo`, `Esqueleto`) movendo-o para um arquivo comum (por exemplo `components/servicos/PaginaServicos.styles.ts`) para não manter a pasta `ServicosPage`.
- **Remover** `ServicosPage` (componente, `abaDaUrl`, `Tabs` e o teste), `PARAM_ABA` de `params.ts` e seu uso:
  - `FilaServicos.escolherStatus`: URL passa de `${pathname}?aba=fila&status=${id}` para `${pathname}?status=${id}`.
  - `ServicosMasterDetail`: `urlDaAba` (`?aba=catalogo`) passa a `pathname` puro; `selecionar` usa `?servico=${id}`; `voltarParaLista` volta a `pathname`.
- Conferir `ServicosMasterDetail` quanto a `useCan(AREA.ServicosCatalogo)` (já esconde Novo serviço, Editar e Inativar para o Financeiro) e o estado vazio, que já distingue quem pode cadastrar.
- Tour de boas-vindas (`components/onboarding/conteudo.ts`): o texto de `"/servicos"` hoje fala de catálogo e fila juntos. Reescrever para a fila e acrescentar `"/servicos/catalogo"`; sem isso o item novo fica fora do tour (o teste de completude do onboarding falha, de propósito).

### Tipos/dados
Sem mudança de API nem de tipos de domínio. `Area` ganha dois membros; `NavIconId` ganha `"catalog"`.

## Decisões e trade-offs
- **Duas áreas novas em vez de reaproveitar `Servicos`.** `Servicos` também é regra de ação do ticket; mudá-la tiraria de Administrador e Gerente o que o PRD mantém. Custo: duas áreas a mais na matriz e nos testes; benefício: zero regressão no ticket e nenhuma chave salva é renomeada.
- **Consulta e edição do catálogo continuam áreas separadas.** `ServicosCatalogoConsulta` abre a tela; `ServicosCatalogo` libera os botões. Assim o Financeiro vê sem editar, e uma permissão por módulo pode mudar cada uma sem a outra.
- **Redirecionamento no proxy, não na página.** A página só roda depois do guarda; o proxy já decide por perfil e o redirecionamento acontece antes de qualquer renderização ou tela de "acesso negado". Fica uma função pura, fácil de testar.
- **Remover `?aba=` de vez.** Mantê-lo exigiria ler a URL em duas páginas só por compatibilidade; o proxy já cobre os links antigos.
- **Ícone novo em vez de reaproveitar a gota.** Dois itens com o mesmo ícone no menu recolhido são indistinguíveis; é a única peça de design nova.

## Riscos / pontos de atenção
1. **O back pode negar o catálogo ao Financeiro (403).** Hoje a regra do back para `GET /Servico` não é conhecida para esse perfil. Se negar, a tela mostra o aviso de falta de permissão já existente (`ErroSemPermissao`), mas o item de menu apareceria sem utilidade. Confirmar com o back antes de liberar; se não puder, tirar o Financeiro da área nova (uma linha em `PERMISSOES_PADRAO`).
2. **Perfis só com override.** Quem configurou permissões por módulo passa a ver o menu pelas áreas novas, que não têm override salvo: valem os padrões. Avisar na entrega.
3. **Administrador e Gerente perdem a fila no menu** (decisão do PRD). Só aparecem no menu se a regra de `ServicosFila` os incluir; o cancelamento e a troca de status seguem pelo ticket.
4. **Sobreposição com `servicos-melhorias`.** Esse trabalho já mexeu em `ServicosMasterDetail` e mexerá em `FilaServicos` e nos seus testes; esta mudança toca nos mesmos arquivos (URLs sem `?aba=`, títulos). Fazer esta primeiro nos pontos de URL, ou aplicar a outra em cima, para não resolver conflito duas vezes. As tasks de `servicos-melhorias` que citam abas ou `?aba=` precisam ser atualizadas (T24 e a verificação).
5. **Barra inferior com capacidade fixa.** Com 20 itens no total, conferir `useBarCapacity`/`MenuSheet` e os testes de capacidade: o novo item da Operação pode empurrar outro para "Mais" em alguns perfis.
6. **Testes que repetem a matriz.** `permissoes.test.ts`, `nav.test.ts` e os do menu duplicam listas; atualizar todos junto com o código.
7. **Link antigo com `?servico=`** só é repassado ao catálogo quando for inteiro positivo (mesma regra de `lerServicoDaUrl`).

## Fora de escopo técnico
- Mudar o conteúdo, os dados ou o visual da fila e do catálogo (`servicos-melhorias`).
- Dar ao Financeiro permissão de editar o catálogo.
- Criar um grupo novo ("Cadastro") no menu.
- Alterar as áreas `Servicos` e `ServicosPatio` ou as regras do ticket do Pátio.
- Redirecionamento baseado em override de permissão no proxy (continua só com os padrões).
