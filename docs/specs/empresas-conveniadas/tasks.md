# Tasks: Empresas Conveniadas

Referências: ./prd.md, ./techspec.md, ./design.md

- [ ] T1 — Decidir e aplicar o reuso dos estilos de lista de Mensalistas (promover só o que for idêntico para `src/components/ui/ListPage`, ou replicar o mínimo em `Conveniadas.styles.ts`)
  - Arquivos: `src/components/mensalistas/Mensalistas.styles.ts`, `src/components/ui/ListPage/*` (se promovido), `src/components/conveniadas/Conveniadas.styles.ts`
  - Pronto quando: estilos de lista (Page, Header, TableArea, SkeletonRows, ErrorArea, EmptyState) disponíveis para Conveniadas, sem mudança visual em Mensalistas e com os testes de Mensalistas passando

- [ ] T2 — Criar os tipos da feature
  - Arquivos: `src/types/conveniada.ts`
  - Pronto quando: `Conveniada`, `SituacaoFiltro`, `ConveniadaPayload`, `ConveniadaResultado`, `ConveniadaFormValues` e `EMPTY_CONVENIADA_FORM` exportados; `tsc` sem erros

- [ ] T3 — Criar o mapper DTO <-> tipos e payload
  - Arquivos: `src/lib/api/services/conveniada.mapper.ts`, `src/lib/api/services/conveniada.mapper.test.ts`
  - Pronto quando: `fromConveniadaResponse` aceita endereço aninhado e plano, tolera campos ausentes e devolve CNPJ/telefone só dígitos; `toConveniadaPayload` faz trim, `onlyDigits` em CNPJ/CPF/celular e `formatCEP` no CEP; testes passando

- [ ] T4 — Criar o serviço da API
  - Arquivos: `src/lib/api/services/conveniada.ts`, `src/lib/api/services/conveniada.test.ts`
  - Pronto quando: `listConveniadas` envia `ativo=true|false` ou nenhum parâmetro conforme o filtro; `cadastrarConveniada` faz POST com o payload do mapper e propaga `ApiError`; testes com client mockado passando

- [ ] T5 — Criar o schema Zod do formulário
  - Arquivos: `src/lib/schemas/conveniada.ts`, `src/lib/schemas/conveniada.test.ts`
  - Pronto quando: valida CNPJ, telefone, CEP, estado (`SIGLAS_ESTADOS`), CPF, e-mail e celular; nome fantasia opcional; campos obrigatórios vazios geram erro; testes passando

- [ ] T6 — Criar os módulos puros de apoio (`situacao`, `mensagens`, `format`, `conveniadasKeys`)
  - Arquivos: `src/components/conveniadas/situacao.ts`, `mensagens.ts`, `format.ts`, `conveniadasKeys.ts` e respectivos `*.test.ts`
  - Pronto quando: `parseSituacao` converte valor desconhecido em `todos`; `mensagens` cobre as 4 combinações de `novaEmpresa`/`novoUsuario` sem prometer entrega de e-mail nem citar "convênio reativado"; `format` devolve nome exibido (fantasia ou razão social) e endereço resumido; testes passando

- [ ] T7 — Criar os hooks de dados
  - Arquivos: `src/components/conveniadas/useConveniadas.ts`, `src/components/conveniadas/useCadastrarConveniada.ts`
  - Pronto quando: `useConveniadas` usa `queryKey: ["conveniadas", situacao]`, `refetchOnWindowFocus: false` e `keepPreviousData`; `useCadastrarConveniada` invalida `["conveniadas"]` no sucesso e repassa o resultado para a navegação

- [ ] T8 — Registrar a área, a permissão e o item de menu
  - Arquivos: `src/lib/permissoes.ts`, `src/lib/permissoes.test.ts`, `src/lib/nav.ts`, `src/lib/nav.test.ts`, `src/components/layout/NavSign/NavIcons.tsx`, `BottomNav.test.tsx` (se depender da contagem)
  - Pronto quando: `AREA.Conveniadas` com padrão `[Administrador]` e rota `/empresas-conveniadas`; item "Empresas conveniadas" após "Mensalistas"; Gerente, Caixa e AdministradorConveniada não veem o item; `tsc` sem erros de `Record<Area, ...>`; testes passando

- [ ] T9 — Implementar a listagem (`ConveniadasList`)
  - Arquivos: `src/components/conveniadas/ConveniadasList/ConveniadasList.tsx`, `index.ts`, teste
  - Pronto quando: exibe Table com nome, CNPJ formatado, telefone, endereço, situação e data de cadastro; estados carregando, vazio (com e sem filtro), erro com tentar novamente e 403 (`ErroSemPermissao`); testes passando

- [ ] T10 — Implementar a página de listagem com filtro e toast (`ConveniadasPage`) e a rota
  - Arquivos: `src/components/conveniadas/ConveniadasPage/ConveniadasPage.tsx`, `index.ts`, `src/app/(app)/empresas-conveniadas/page.tsx`
  - Pronto quando: filtro Todos/Ativos/Encerrados sincronizado com `?situacao=` via `router.replace`; botão "Nova conveniada" leva a `/empresas-conveniadas/nova`; toast de retorno lido uma vez e limpo (mecanismo escolhido conforme o padrão de `NovaEmpresa`/`EmpresaCriada`, sem dados pessoais); rota com `metadata` e `<Suspense>`

- [ ] T11 — Implementar as seções do formulário (Empresa e Responsável)
  - Arquivos: `src/components/conveniadas/ConveniadaEmpresaFields.tsx`, `ConveniadaResponsavelFields.tsx`
  - Pronto quando: campos com máscaras (CNPJ, telefone, CEP, CPF, celular) e grid de `FormGrid.styles`; preenchimento por CEP via `useCepLookup` mantendo campos editáveis e sem preencher número; `CompanyStepFields` não alterado

- [ ] T12 — Implementar a página de cadastro (`NovaConveniada`) e a rota
  - Arquivos: `src/components/conveniadas/NovaConveniada/NovaConveniada.tsx`, `index.ts`, `src/app/(app)/empresas-conveniadas/nova/page.tsx`, teste
  - Pronto quando: validação pelo schema Zod com erros por campo; botão de salvar desabilitado e com carregamento durante o envio; erro do back exibido no `ErrorBanner` com dados mantidos; `ConfirmDialog` de descarte quando o formulário está sujo; sucesso volta à listagem com toast; testes passando

- [ ] T13 — Validação final da feature
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` sem erros; testes de Mensalistas e da feature passando; critérios de aceite do `prd.md` conferidos, registrando RF-08 (convênio reativado) e RF-09 (mensagens por caso) como parcialmente atendidos até o back oferecer campo/código estável
