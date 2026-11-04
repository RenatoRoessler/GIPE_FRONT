# Tasks: Pátio da Conveniada

Referências: ./prd.md, ./techspec.md

- [x] T1 — Conferir a tela de permissões por módulo e o catálogo de áreas antes de criar a área nova
  - Arquivos: leitura de `src/components/usuarios`, `src/lib/permissoes.ts` e dos serviços de permissão; registrar no fim do Tech Spec (Riscos) o que foi achado
  - Pronto quando: está decidido se a área `patio-conveniada` precisa entrar em algum catálogo fixo ou contrato do back, e a decisão está anotada

- [x] T2 — Tipos do pátio da conveniada
  - Arquivos: `src/types/patioConveniada.ts`
  - Pronto quando: `VeiculoConveniada` e `ResumoPatioConveniada` existem como no Tech Spec e `npx tsc --noEmit` passa

- [x] T3 — Mapper da resposta de `GET /Convenio/patio`
  - Arquivos: `src/lib/api/services/patioConveniada.mapper.ts`, `src/lib/api/services/patioConveniada.mapper.test.ts`
  - Pronto quando: o teste cobre a resposta completa com os dois itens do exemplo, campos ausentes e nulos, texto com espaços, resposta que não é array (vira `[]`) e item sem `patioConvenioId` (descartado); testes passam

- [x] T4 — Serviço `listarPatioConveniada`
  - Arquivos: `src/lib/api/services/patioConveniada.ts`, `src/lib/api/services/patioConveniada.test.ts`
  - Depende de: T3
  - Pronto quando: o teste confirma a rota `/Convenio/patio`, que `?placa=` só vai com placa completa e válida (em maiúsculas e sem hífen), que sem placa válida não há parâmetro, e que o 400 e o 403 são propagados; testes passam

- [x] T5 — Chaves de cache e funções puras da lista
  - Arquivos: `src/components/patio-conveniada/patioConveniadaKeys.ts`, `src/components/patio-conveniada/patioConveniada.ts`, `src/components/patio-conveniada/patioConveniada.test.ts`
  - Depende de: T2
  - Pronto quando: `PATIO_CONVENIADA_KEY`, `resumirPorEstacionamento`, `filtrarPorPlaca` (parcial, com ou sem hífen, qualquer caixa), `filtrarPorEstacionamento`, `permanenciaLonga` e `frasePermanencia` existem e têm teste, incluindo lista vazia e estacionamento único; testes passam

- [x] T6 — Hook da lista com atualização periódica
  - Arquivos: `src/components/patio-conveniada/usePatioConveniada.ts`, `src/components/patio-conveniada/usePatioConveniada.test.tsx`
  - Depende de: T4, T5
  - Pronto quando: a consulta usa a chave com a placa, atualiza a cada 30 s só com a aba visível, mantém a lista anterior ao trocar a placa e propaga o erro; teste passa

- [x] T7 — Hook dos filtros (placa e estacionamento na URL)
  - Arquivos: `src/components/patio-conveniada/usePatioConveniadaFiltros.ts`, `src/components/patio-conveniada/usePatioConveniadaFiltros.test.tsx`
  - Depende de: T5
  - Pronto quando: a placa digitada aparece na hora e chega à URL (`?placa=`) após a pausa de 250 ms; o estacionamento vai a `?estacionamento=`; a URL é reescrita sem empilhar histórico; a placa completa e inválida é sinalizada e não vira placa enviada; limpar busca e filtros funciona; teste passa

- [x] T8 — Cartão do veículo
  - Arquivos: `src/components/patio-conveniada/VeiculoConveniadaCard/{VeiculoConveniadaCard.tsx,VeiculoConveniadaCard.styles.ts,VeiculoConveniadaCard.test.tsx,index.ts}`
  - Depende de: T5
  - Pronto quando: o cartão mostra placa, permanência, modelo, cor por extenso, categoria por nome, estacionamento, selo "Convênio", entrada, carimbo com quem carimbou e a tabela; a permanência de 3 dias ou mais tem o tom `warn` e o texto "mais de 3 dias"; a frase para o leitor de tela é uma só; não é link nem recebe foco; só tokens do tema; teste passa

- [x] T9 — Resumo e chips de estacionamento
  - Arquivos: `src/components/patio-conveniada/ResumoConveniada/*` (componente, estilos, teste, `index.ts`)
  - Depende de: T5, T7
  - Pronto quando: o resumo mostra o total e, com mais de um estacionamento, a contagem por estacionamento; os chips (`aria-pressed`, alvo de 44 px) só existem com mais de um estacionamento e voltam a "Todos" ao tocar no ativo; teste passa

- [x] T10 — Tela `PatioConveniadaPage` com todos os estados
  - Arquivos: `src/components/patio-conveniada/PatioConveniadaPage/{PatioConveniadaPage.tsx,PatioConveniadaPage.test.tsx,index.ts}`, `src/components/patio-conveniada/PatioConveniada.styles.ts`
  - Depende de: T6, T7, T8, T9
  - Pronto quando: a tela tem título, "Atualizar" e "Atualizado às", busca de placa com rótulo visível, a lista em uma coluna no celular e duas no `lg`, corte de 100 itens com "Mostrar mais", e os estados carregando, lista, vazia (com botão para `/carimbo`), sem resultado (com "Limpar busca"), placa inválida (lista mantida), atualizando, erro com "Tentar novamente" (lista mantida se já havia) e 403; a contagem fica em `role="status"`; o foco não precisa de tratamento porque o cartão não é interativo (decisão registrada no Tech Spec); testes passam

- [x] T11 — Rota `/patio-conveniada`
  - Arquivos: `src/app/(app)/patio-conveniada/page.tsx`, `src/app/(app)/patio-conveniada/page.test.tsx`
  - Depende de: T10
  - Pronto quando: a página é Server Component com `metadata.title` "Pátio — Murel" e `Suspense` com o esqueleto como reserva; o teste passa

- [x] T12 — Permissão da área e item de menu
  - Arquivos: `src/lib/permissoes.ts`, `src/lib/permissoes.test.ts`, `src/lib/nav.ts`, `src/lib/nav.test.ts`, `src/components/layout/NavIcons/NavIcons.tsx`, `src/components/layout/SideNav/SideNav.test.tsx`, `src/components/layout/BottomNav/BottomBar.test.tsx`, `src/components/layout/BottomNav/BottomNav.test.tsx`
  - Depende de: T1
  - Pronto quando: `AREA.PatioConveniada` vale para os três perfis de conveniada (e as permissões por módulo podem alterá-la), a rota `/patio-conveniada` pertence a ela, o item "Pátio da conveniada" (rótulo curto "Pátio") fica logo depois de "Carimbar ticket" com o ícone novo `stampedYard` (o `yard` já é do pátio do lojista e o teste do menu exige um ícone por item), os perfis do estacionamento não o veem, `telaInicial` continua devolvendo `/carimbo` para a conveniada e os testes de contagem e capacidade do menu foram ajustados; testes passam

- [x] T13 — O carimbo atualiza a lista
  - Arquivos: `src/components/carimbo/useCarimbar.ts`, `src/components/carimbo/useCarimbar.test.tsx`
  - Depende de: T5
  - Pronto quando: no sucesso do carimbo a chave `["patio-conveniada"]` é invalidada (sem importar nada da tela, para não criar ciclo) e o teste prova isso; nada mais no comportamento do carimbo muda

- [x] T14 — Revisão de acessibilidade, responsividade e tema
  - Arquivos: os componentes de `src/components/patio-conveniada/`
  - Depende de: T10, T12
  - Pronto quando: sem horizontal scroll em 320 px, uma coluna no celular e duas no `lg`, contraste conferido nos dois temas, alvos de toque de pelo menos 44 px, nada só em cor, operação completa por teclado, cartão sem foco e sem hover de link, e respeito a `prefers-reduced-motion`; anotar o que foi conferido só no código e o que falta no navegador
  - Revisão (só no código): tokens do tema em todos os estilos, sem valor solto; `Bloco` e os chips com `min-width: 0` e rolagem horizontal só dentro do bloco; textos longos quebram (`overflow-wrap: anywhere`); chips com 44 px e foco visível; cartão sem foco, sem link e com uma frase para o leitor de tela; permanência longa com selo em texto; transições só com `prefers-reduced-motion: no-preference`. **Falta conferir no navegador:** 320 px sem rolagem horizontal, contraste nos dois temas, duas colunas em `lg` e o teclado de placa no celular.

- [ ] T15 — Verificação final
  - Arquivos: —
  - Depende de: T1 a T14
  - Pronto quando: `npx tsc --noEmit`, `npm run lint` (sem erros novos), toda a suíte `vitest` e `npm run build` passam, com a rota `/patio-conveniada` no build; e, com o servidor de teste (túnel SSH autorizado pelo usuário), a lista real aparece, a placa completa filtra no servidor e a placa parcial filtra na tela; critérios de aceite do `prd.md` conferidos um a um; token do `input.md` removido antes de qualquer commit
  - Progresso: `npx tsc --noEmit` limpo, `npm run lint` com 0 erros (95 avisos que já existiam), `vitest` completo com 331 arquivos e 3643 testes passando e `npm run build` com a rota `/patio-conveniada`. **Falta:** conferir no servidor de teste (precisa do túnel SSH, autorizado pelo usuário) a lista real, a placa completa no servidor e a placa parcial na tela; confirmar com o back a área `patio-conveniada`; remover o token do `input.md` antes de qualquer commit.
