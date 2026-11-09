# Tasks: Configuração da empresa — dados obrigatórios na entrada

Referências: ./prd.md, ./techspec.md, ./design.md

Antes de T9 e T10, confirmar com o back o nome, o tipo e o tamanho do campo do prisma nos payloads de entrada (techspec, "A confirmar com o back"). T1 a T8 não dependem disso.

- [x] T1 — Tipos e padrão da configuração
  - Arquivos: `src/types/configuracao.ts` (novo)
  - Pronto quando: existem `Configuracao`, `ConfiguracaoValues` e `CONFIGURACAO_PADRAO` (`modelo: true`, `cor: true`, `prisma: false`); `npx tsc --noEmit` passa.

- [x] T2 — Serviço e mapper da API de configuração
  - Arquivos: `src/lib/api/services/configuracao.ts`, `src/lib/api/services/configuracao.mapper.ts`, `configuracao.test.ts`, `configuracao.mapper.test.ts` (novos)
  - Pronto quando: `getConfiguracao()` faz `GET /Configuracao` e `updateConfiguracao(values)` faz `PUT /Configuracao` com `{ modelo, cor, prisma }`; o mapper cai no padrão para campo ausente e transforma data inválida e campos nulos em `null`; testes passam, inclusive o do erro como `ApiError`.

- [x] T3 — Schema do formulário da tela
  - Arquivos: `src/lib/schemas/configuracao.ts` (novo) e teste
  - Pronto quando: `configuracaoSchema` valida três booleanos e rejeita valores de outro tipo; teste passa.

- [x] T4 — Hooks de leitura e gravação
  - Arquivos: `src/components/configuracoes/useConfiguracao.ts` (novo) e teste
  - Pronto quando: `CONFIGURACAO_QUERY_KEY = ["configuracao"]`; `useConfiguracao()` devolve `{ configuracao, carregando, erro }` com `configuracao` igual ao padrão enquanto carrega ou se falhar, com `staleTime` de 5 minutos e sem refetch ao focar a janela; `useSalvarConfiguracao()` grava com `PUT`, atualiza o cache com o que o back confirmou e propaga o `ApiError`; testes cobrem carregando, sucesso, falha (padrão) e salvar.

- [x] T5 — Área, rota e item de menu
  - Arquivos: `src/lib/permissoes.ts`, `src/lib/nav.ts`, `src/components/layout/NavIcons/` (ícone `settings`), `src/lib/permissoes.test.ts`, `src/proxy.test.ts`, testes de nav, `SideNav` e `BottomNav` que contam itens
  - Pronto quando: existe `AREA.Configuracoes` (padrão Administrador e Gerente) com a rota `/configuracoes`; o item "Configurações" (rótulo curto "Config.", ícone de engrenagem) aparece no grupo Configurações depois de "Minha Empresa" só para quem tem a área; testes atualizados passam.

- [x] T6 — Formulário da configuração
  - Arquivos: `src/components/configuracoes/ConfiguracaoEntradaForm/` (novo: componente, estilos, teste, `index.ts`)
  - Pronto quando: três `SwitchField` (Modelo, Cor, Prisma) com a frase do efeito ligada por `aria-describedby`; linha ligada com `primary`/`primarySoft`; Salvar só habilitado com mudança; "Alterações não salvas" e "Salvando…"; `Toast` "Configuração salva." no sucesso; `ErrorBanner` com foco no erro, mantendo o que foi marcado; linha de auditoria só quando existe alteração; modo somente leitura (chaves desabilitadas, selo, sem Salvar); testes cobrem cada estado; sem valor visual fora do tema.

- [x] T7 — Página de configurações
  - Arquivos: `src/components/configuracoes/ConfiguracoesPage/` (novo: componente, esqueleto, estilos, teste), `src/app/(app)/configuracoes/page.tsx` (novo)
  - Pronto quando: `/configuracoes` mostra o esqueleto ao carregar, `ErroSemPermissao` no 403, `ErrorBanner` com "Tentar novamente" nos outros erros e o formulário quando os dados chegam; o título é "Configurações"; a `page.tsx` é só `<ConfiguracoesPage />`; testes passam.

- [x] T8 — Fábricas de schema de entrada com as regras da empresa
  - Arquivos: `src/lib/schemas/veiculo.ts`, `src/lib/schemas/conferenciaPatio.ts` e seus testes
  - Pronto quando: `criarEntradaVeiculoSchema(regras)` e `criarEntradaConferenciaSchema(regras)` aceitam `{ modelo, cor, prisma, mensalista }`; modelo e cor desligados aceitam vazio; prisma só é exigido com `prisma` ligado e `mensalista` falso, com a mensagem "Informe o prisma"; os schemas atuais continuam exportados e equivalem às regras padrão; testes cobrem cada combinação; os testes que já existiam seguem passando.

- [x] T9 — Entrada do pátio com a configuração
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx` e teste, `src/types/veiculo.ts`, `src/lib/api/services/patio.ts` se preciso
  - Pronto quando: o modal usa `useConfiguracao()` e o schema de T8; só os campos obrigatórios têm marcador e `aria-required`; o campo Prisma aparece só quando é obrigatório e some para mensalista; o rodapé de pendências lista só o que a configuração exige; `modelo` e `cor` vazios saem do payload; `EntradaPayload` ganha `prisma?`; o comentário `[A CONFIRMAR] modelo opcional` é removido; testes cobrem padrão, prisma obrigatório, mensalista e modelo/cor desligados.

- [x] T10 — Entrada da conferência com a configuração
  - Arquivos: `src/components/conferencia/RegistrarEntradaConferenciaModal/RegistrarEntradaConferenciaModal.tsx` e teste, `EntradaConferenciaPayload` em `src/lib/schemas/conferenciaPatio.ts` e `src/lib/api/services/conferenciaPatio.ts`
  - Pronto quando: mesmo comportamento de T9 no formulário da conferência, com `mensalista` vindo da chave já existente no formulário; testes cobrem as mesmas situações.

- [ ] T11 — Revisão visual e de acessibilidade
  - Arquivos: telas `/configuracoes`, entrada do pátio e entrada da conferência
  - Pronto quando: conferido em 360×640, 768×1024 e 1280×800, nos temas claro e escuro, sem rolagem horizontal, alvos de toque de pelo menos 44px, foco visível e erros anunciados (`role="alert"`); sem cor, espaçamento ou fonte fora do tema.
  - Situação: pendente. Exige a sessão logada (a área é protegida) e a conta de teste não foi fornecida. Os estados e a acessibilidade (nomes, `aria-describedby`, `role="alert"`) estão cobertos por testes.

- [ ] T12 — Validação final
  - Arquivos: todos os acima
  - Pronto quando: `npm run lint`, `npx tsc --noEmit`, `npm test` e `npm run build` passam; os critérios de aceite do `prd.md` estão marcados `[x]`, e os que dependem do back ficam anotados com o motivo.
  - Situação: parcial. Lint (0 erros), `tsc` e build passam. Nos testes, 3 falhas antigas e alheias à feature: o link "Ir para o início" aponta para `/` e os testes esperam `/dashboard` (CaixaPage, MinhaEmpresa e UsuariosList). Faltam T11 e a confirmação do back sobre o prisma (nome, tipo e tamanho; hoje `prisma`, texto, até 20 caracteres, marcados `[A CONFIRMAR]` no código).
