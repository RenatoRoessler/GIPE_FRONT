# Tasks: Menu de Serviços separado em Operação e Cadastro

> **Revisão (Financeiro fora):** o perfil Financeiro **não** tem acesso a Serviços (nem à fila nem ao catálogo). A documentação do back lista `GET /Servico` só para Administrador, Gerente, Caixa, Manobrista e Lavador, e a decisão foi não pedir a inclusão. Onde este documento ainda fala em Financeiro consultando o catálogo, vale esta nota. Em código: `ServicosCatalogoConsulta` é só de Administrador e Gerente, e os testes de menu, rota, tour e proxy foram ajustados.

Referências: ./prd.md, ./techspec.md (design em ./design.md)

Convenções para todas as tasks: seguir as skills `code-best-practices` e `styled-components-best-practices`; nenhum valor visual fora do tema; antes de concluir cada task rodar `npx tsc --noEmit`, `npx eslint` nos arquivos tocados e `npx vitest run <caminho>` do que foi tocado; `npm run build` ao fim. Caminhos relativos a `src/`. Antes da T3, conferir em `node_modules/next/dist/docs/` as convenções de `proxy.ts` desta versão do Next (aviso do `AGENTS.md`).

Decisões assumidas (techspec): Financeiro só consulta o catálogo; a área `Servicos` existente não muda; o catálogo entra no grupo Configurações, depois de Gestão de Preços.

## Permissões e rotas

- [x] T1 — Áreas novas de Serviços e rota do catálogo
  - Arquivos: `lib/permissoes.ts`, `lib/permissoes.test.ts`
  - Pronto quando: `AREA.ServicosFila` (`servicos.fila`) e `AREA.ServicosCatalogoConsulta` (`servicos.catalogo.consulta`) existem; `PERMISSOES_PADRAO` dá a primeira a Caixa, Manobrista e Lavador e a segunda a Administrador, Gerente e Financeiro; `Servicos`, `ServicosCatalogo` e `ServicosPatio` ficam exatamente como estão (comentário de `Servicos` atualizado); `AREA_POR_ROTA` mapeia `/servicos` para `ServicosFila` e `/servicos/catalogo` para `ServicosCatalogoConsulta`; testes cobrem a matriz completa, `areaDaRota("/servicos")`, `areaDaRota("/servicos/catalogo")` e `areaDaRota("/servicos/catalogo/qualquer")`, e que o Financeiro não tem `ServicosCatalogo`; `tsc` sem erro.

- [x] T2 — Função do redirecionamento de endereços antigos
  - Arquivos: `lib/servicosRotas.ts`, `lib/servicosRotas.test.ts`
  - Pronto quando: `destinoLegadoDeServicos(perfil, pathname, searchParams)` devolve `null` fora de `/servicos`, `null` para perfil da fila (ignora `?aba=`), `"/servicos/catalogo"` para perfil do catálogo (com e sem `?aba=`), repassa `?servico=` só quando for inteiro positivo, e `null` para perfil sem nenhuma das duas áreas ou sem perfil; testes cobrem cada perfil de estacionamento e os de conveniada.
  - Depende de: T1

- [x] T3 — Proxy aplica o redirecionamento antes de negar
  - Arquivos: `proxy.ts`, `proxy.test.ts`
  - Pronto quando: com token válido, Administrador, Gerente e Financeiro em `/servicos` (com ou sem `?aba=`) são redirecionados a `/servicos/catalogo` (mantendo `?servico=` válido); Caixa, Manobrista e Lavador seguem em `/servicos`; Caixa/Manobrista/Lavador em `/servicos/catalogo` e Administrador/Gerente/Financeiro sem o redirecionamento caem em `/acesso-negado` quando não têm a área; sem token continua indo ao login; os testes existentes do proxy seguem passando.
  - Depende de: T1, T2

## Menu

- [x] T4 — Ícone `catalog`
  - Arquivos: `components/layout/NavIcons/NavIcons.tsx`, `lib/nav.ts` (só o tipo `NavIconId`), teste do ícone se houver
  - Pronto quando: `NavIconId` inclui `"catalog"`; `CatalogIcon` usa o mesmo `IconBase`, traço, tamanho e cantos dos demais; `ICONS` o registra; o ícone renderiza sem erro e é decorativo (sem texto acessível próprio).

- [x] T5 — Dois itens de Serviços no menu
  - Arquivos: `lib/nav.ts`, `lib/nav.test.ts`, `components/layout/BottomNav/BottomNav.test.tsx`, `components/layout/BottomNav/MenuSheet.test.tsx`, `components/layout/SideNav/SideNav.test.tsx`
  - Pronto quando: `NAV_ITEMS` tem "Fila de serviços" (`shortLabel` "Fila", `/servicos`, ícone `services`, área `ServicosFila`, grupo `operacao`, último do grupo) e "Catálogo de serviços" (`shortLabel` "Catálogo", `/servicos/catalogo`, ícone `catalog`, área `ServicosCatalogoConsulta`, grupo `configuracoes`, logo depois de "Gestão de Preços"); o item antigo "Serviços" não existe mais; os testes passam a esperar vinte itens e conferem, por perfil, quem vê cada item (Lavador só a fila; Administrador, Gerente e Financeiro só o catálogo; Caixa e Manobrista só a fila); o Financeiro passa a ter o grupo Configurações com um item; testes do menu atualizados (barra inferior, painel "Mais", menu lateral).
  - Depende de: T1, T4

- [x] T6 — Capacidade da barra inferior e menu em celular
  - Arquivos: `components/layout/BottomNav/useBarCapacity.ts` (só se necessário), testes de `BottomNav`
  - Pronto quando: com o novo número de itens, a barra inferior continua mostrando o que mostrava e o excedente vai para "Mais" para cada perfil afetado (Caixa, Manobrista e Lavador na fila; Administrador, Gerente e Financeiro no catálogo); sem item cortado ou duplicado; teste cobre ao menos um perfil de cada lado.
  - Depende de: T5

## Páginas

- [x] T7 — Estilos comuns das páginas de Serviços
  - Arquivos: `components/servicos/PaginaServicos.styles.ts` (novo, a partir de `ServicosPage/ServicosPage.styles.ts`)
  - Pronto quando: `Tela`, `Titulo` e `Esqueleto` existem num arquivo comum sem depender de `ServicosPage`; só tokens do tema; `ServicosPage` ainda compila usando o arquivo novo (remoção na T10).

- [x] T8 — Página da Fila de serviços (`/servicos`)
  - Arquivos: `components/servicos/FilaServicosPage/*` (componente, `index.ts`, teste), `app/(app)/servicos/page.tsx`
  - Pronto quando: `FilaServicosPage` mostra o título "Fila de serviços", `ServicosDesligados` e `FilaServicos`, sem `Tabs`; exporta `FilaServicosEsqueleto` (com o mesmo título) usado como `fallback` do `Suspense` na rota; testes cobrem o título, o aviso de módulo desligado e a presença da fila para um perfil da fila.
  - Depende de: T7

- [x] T9 — Página do Catálogo de serviços (`/servicos/catalogo`)
  - Arquivos: `components/servicos/CatalogoServicosPage/*`, `app/(app)/servicos/catalogo/page.tsx` (novo)
  - Pronto quando: `CatalogoServicosPage` mostra o título "Catálogo de serviços", `ServicosDesligados` e `ServicosMasterDetail`, sem `Tabs`; `CatalogoServicosEsqueleto` como `fallback` do `Suspense`; teste confirma o título e o conteúdo para Administrador; teste com perfil Financeiro (`perfil: 8`) confirma que a lista aparece e **não** há botões "Novo serviço", "Editar" nem "Inativar", e que o estado vazio mostra só "Nenhum serviço cadastrado.".
  - Depende de: T7

- [x] T10 — Tirar as abas e o `?aba=`
  - Arquivos: `components/servicos/params.ts`, `components/servicos/FilaServicos/FilaServicos.tsx`, `components/servicos/ServicosMasterDetail/ServicosMasterDetail.tsx`, testes de ambos, remoção de `components/servicos/ServicosPage/` (componente, estilos, `index.ts`, teste)
  - Pronto quando: `PARAM_ABA` não existe mais; a fila troca de coluna com `?status=` (sem `aba`) e o catálogo seleciona com `?servico=` e volta à lista em `pathname` puro; nenhum arquivo importa `ServicosPage`, `abaDaUrl` ou `PARAM_ABA`; `grep` por esses nomes em `src/` não encontra nada; testes atualizados para as URLs novas (`/servicos?status=2`, `/servicos/catalogo?servico=7`).
  - Depende de: T8, T9

## Conteúdo auxiliar

- [x] T11 — Texto do tour de boas-vindas
  - Arquivos: `components/onboarding/conteudo.ts`, testes do onboarding
  - Pronto quando: a chave de `/servicos` descreve só a fila (de aguardando a em execução e a pronto, cancelar o que o cliente desistiu); existe a chave de `/servicos/catalogo` descrevendo o catálogo com preço por categoria; o teste de completude do onboarding passa (todo item do menu permitido tem texto) e o tour de cada perfil mostra o passo certo ("Fila de serviços" ou "Catálogo de serviços") com "No menu, em Operação." ou "No menu, em Configurações.".
  - Depende de: T5

## Fechamento

- [ ] T12 — Verificação final e ajuste das tasks de `servicos-melhorias`
  - Arquivos: todos os tocados; `docs/specs/servicos-melhorias/tasks.md`, `docs/specs/servicos-melhorias/techspec.md` (só as menções a abas e `?aba=`)
  - Pronto quando: `npm run lint`, `npx vitest run` (ao menos `src/lib`, `src/components/servicos`, `src/components/layout`, `src/components/onboarding`) e `npm run build` passam; as menções a abas/`?aba=` nos documentos de `servicos-melhorias` (T24, T24b e o techspec) estão corrigidas para as duas páginas; critérios de aceite do `prd.md` desta feature conferidos item a item, com a conferência manual de perfil (Lavador, Caixa, Administrador, Financeiro) em celular e computador, tema claro e escuro, e do redirecionamento dos endereços antigos; pendência registrada: confirmar com o back se o Financeiro pode ler o catálogo (se não, remover o perfil de `ServicosCatalogoConsulta`).
  - Depende de: T1 a T11
  - Roteiro da conferência manual por perfil e tela: `docs/specs/servicos-melhorias/roteiro-conferencia.md` (seção 1).
  - Andamento: lint (0 erros), build e a doc de `servicos-melhorias` feitos; `vitest` completo tem 3 falhas antigas, alheias a esta mudança (`CaixaPage`, `MinhaEmpresa` e `UsuariosList` esperam `/dashboard` no link "Ir para o início", mas `ErroSemPermissao` aponta para `/`). Faltam a conferência manual por perfil/tela/tema e a resposta do back sobre o Financeiro.

## Ordem e dependências

- T1 → T2 → T3.
- T4 em paralelo com T1; T5 depende de T1 e T4; T6 depende de T5.
- T7 → T8 e T9 (independentes entre si) → T10.
- T11 depende de T5.
- T12 por último.
- Sugestão de ordem de execução: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12.
