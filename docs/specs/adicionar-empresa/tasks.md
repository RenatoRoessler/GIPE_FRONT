# Tasks: Adicionar nova empresa

Referências: ./prd.md, ./design.md, ./techspec.md. Contrato da API em `docs/specs/input.md`.

Ordem pensada para entregar em fatias: **Fase A** (escolha da empresa no login) → **Fase B** (cadastro da nova empresa) → **Fase C** (verificação). A Fase A vem **primeiro de propósito**: hoje o login não entende a resposta de quem tem mais de uma empresa, então criar a segunda empresa antes de a escolha existir deixaria o usuário sem conseguir entrar. Rodar `npm run lint` e os testes da área ao fim de cada task; `npm run build` ao fim de cada fase. Seguir as skills `code-best-practices`, `styled-components-best-practices` e `claude-design` (só tokens do tema).

Formato da lista de empresas no login: conferido na API real na T9 (ver a situação da T9). As suposições ficaram só em `auth.mapper.ts` e `types/auth.ts`.

## Fase A — Escolha da empresa no login

- [x] T1 — Tipo e mapper da lista de empresas do login
  - Arquivos: `src/types/auth.ts`, `src/lib/api/services/auth.mapper.ts`, `src/lib/api/services/auth.mapper.test.ts`
  - Pronto quando: `EmpresaOpcao = { id, nome, cnpj, perfil? }` exportado; o mapper aceita nomes alternativos de campo (`empresaGuid`/`guid`/`id`; `nomeFantasia`/`razaoSocial`/`nome`), usa o nome fantasia e cai na razão social, e lista vazia, item sem id ou sem nome vira `ApiError("unknown")`; testes cobrem cada variação e os casos inválidos; suposições comentadas apontando para a conferência da T9.

- [x] T2 — Serviço: reconhecer a escolha de empresa e escolher
  - Arquivos: `src/lib/api/services/auth.ts`, `src/lib/api/services/auth.test.ts`
  - Pronto quando: `LoginResult` ganha `{ kind: "escolher-empresa", preAuthToken, empresas }`; `toLoginResult` reconhece `requiresCompanySelection: true` com `preAuthToken` e lista (a troca de senha continua vencendo a escolha, e a sessão direta segue como está); `selecionarEmpresa({ preAuthToken, empresaGuid })` faz `POST /autenticacao/selecionar-empresa` com o token no header `Authorization: Bearer` e só `{ empresaGuid }` no corpo e devolve o `accessToken`; resposta sem token vira `ApiError("unknown")`; 401 vira "Sua escolha expirou. Entre novamente." e 429 mantém a mensagem da API; testes cobrem tudo isso, inclusive que o token não vai no corpo.
  - Depende de: T1

- [x] T3 — Componente da etapa "Escolha a empresa"
  - Arquivos: `src/components/auth/EscolherEmpresa/EscolherEmpresa.tsx`, `EscolherEmpresa.styles.ts`, `index.ts`, `EscolherEmpresa.test.tsx`
  - Pronto quando: dentro do `AuthCard`, lista de botões (`<ul>`), um por empresa, com nome e CNPJ com máscara e nome acessível "Entrar em {empresa}, CNPJ {número}"; ao tocar, chama `onEscolher(id)`; enquanto entra, o botão tocado mostra "Entrando…" e os outros ficam desabilitados; erro em `role="alert"` com a lista mantida; no erro de escolha expirada a lista dá lugar a "Voltar ao login"; `Link` "Voltar" chama `onVoltar`; alvos de toque de 56px; só tokens do tema; testes de renderização, foco, estados e acessibilidade.

- [x] T4 — Ligar a escolha ao `LoginForm`
  - Arquivos: `src/components/auth/LoginForm/LoginForm.tsx`, `LoginForm.test.tsx`
  - Pronto quando: o `LoginForm` guarda a etapa (login ou empresa) só em memória do componente, junto do `preAuthToken`, das empresas e dos valores digitados; o resultado `escolher-empresa` troca para `EscolherEmpresa`; escolher uma empresa chama `selecionarEmpresa` e, com sucesso, salva o token, aplica "Lembrar senha" com os valores guardados (como no login direto) e vai para `/dashboard`; "Voltar" descarta a etapa e mostra o login de novo; erros vão para `EscolherEmpresa`; login com uma só empresa continua direto; testes cobrem o fluxo com duas empresas, lembrar senha, voltar, erro e escolha expirada, e um teste documenta que, depois de trocar a senha do primeiro acesso, o login seguinte cai na escolha (RF10); `npm run build` ao fim da fase.
  - Depende de: T2, T3

## Fase B — Cadastro da nova empresa

- [x] T5 — Serviço `addEmpresa`
  - Arquivos: `src/lib/api/services/empresa.ts`, `src/lib/api/services/empresa.test.ts`
  - Pronto quando: `addEmpresa(values)` faz `POST /Empresa/adicionar` com `toEmpresaPayload(values)` (sem `valorTrocoPadrao`), aceita 200 ou 201 e devolve `{ empresaGuid }` validado como texto não vazio (senão `ApiError("unknown")`); erros sobem como `ApiError`; testes cobrem rota, corpo sem `valorTrocoPadrao`, 201 com guid, resposta sem guid e erro 400 com a mensagem da API.

- [x] T6 — Extrair o miolo do formulário de empresa
  - Arquivos: `src/components/empresa/useEmpresaForms.ts`, `src/components/empresa/EmpresaSecoes/EmpresaSecoes.tsx` (+ `index.ts`), `src/components/empresa/MinhaEmpresa/EmpresaForm.tsx`, testes do hook
  - Pronto quando: `useEmpresaForms(initial)` devolve os três formulários, `isDirty`, `isInvalid` por seção, o estado `open`, `sectionsRef`, `validarTudo()` (valida os três, abre seções com erro e foca o primeiro campo inválido) e `reset()`; `EmpresaSecoes` renderiza o acordeão das três seções com `disabled` e `lockCnpj`; `EmpresaForm` passa a usá-los **sem mudar o comportamento**: os testes existentes de `EmpresaForm.test.tsx` e `MinhaEmpresa.test.tsx` passam sem alterar nenhuma expectativa; testes novos cobrem `validarTudo` (abre seção inválida, foca o primeiro erro) e `reset`.
  - Depende de: —

- [x] T7 — `useLogout` e painel "Empresa criada"
  - Arquivos: `src/hooks/useLogout.ts`, `src/components/layout/UserMenu/UserMenu.tsx`, `src/components/empresa/EmpresaCriada/EmpresaCriada.tsx` (+ `.styles.ts`, `index.ts`), testes
  - Pronto quando: `useLogout` limpa o token, o login lembrado e leva a `/login`; `UserMenu` usa o hook sem mudar o comportamento (testes dele passam); `EmpresaCriada` mostra o título, a razão social, o texto do design e os botões "Sair e escolher a empresa" (usa `useLogout`) e "Voltar para Minha empresa"; foco no título ao aparecer e `role="status"`; testes cobrem as duas ações e o foco.

- [x] T8 — Tela "Adicionar empresa", rota e botão de acesso
  - Arquivos: `src/components/empresa/NovaEmpresa/NovaEmpresa.tsx` (+ `.styles.ts`, `index.ts`, teste), `src/app/(app)/minha-empresa/nova/page.tsx`, `src/components/empresa/MinhaEmpresa/EmpresaForm.tsx` e seu teste, `src/lib/permissoes.test.ts`, `src/proxy.test.ts`
  - Pronto quando: a tela abre vazia (`EMPTY_COMPANY_DATA`, `EMPTY_BUSINESS_HOURS_DATA`, `EMPTY_PAYMENTS_DATA` com só Dinheiro ligado), com o CNPJ editável e a busca por CEP; "Criar empresa" valida os três blocos como "Minha empresa", envia uma vez só (controles desabilitados e "Criando…") e, no sucesso, troca o formulário por `EmpresaCriada`; "Cancelar" volta direto se não há dados e abre o `ConfirmDialog` se há; erro da API aparece em `ErrorBanner` com o formulário preservado, e 403 mostra `ErroSemPermissao`; `EmpresaForm` ganha o botão "Adicionar empresa" (`useCan(AREA.Empresa)`) que leva a `/minha-empresa/nova` (testes mockam `next/navigation`); testes de permissão: Gerente e Caixa são barrados em `/minha-empresa/nova` pelo proxy e `areaDaRota` a mapeia para Empresa; `npm run build` ao fim da fase.
  - Depende de: T5, T6, T7

## Fase C — Verificação

- [x] T9 — Verificação final
  - Arquivos: `docs/specs/adicionar-empresa/prd.md` (atualizar "Questões em aberto"), `tasks.md`
  - Pronto quando: `npm run lint`, a suíte de testes e `npm run build` passam; os critérios de aceite do `prd.md` conferidos um a um; teste de ponta a ponta com a conta de teste (criar uma empresa descartável, sair, entrar de novo, ver as duas empresas e entrar em cada uma); o formato real da lista de empresas conferido e o mapper ajustado se preciso; perfil do criador na nova empresa confirmado; fluxo conferido em desktop e mobile.
  - Depende de: T4, T8
  - Situação: concluída em 23/10/2026. `npm run lint` (0 erros), a suíte e `npm run build` (inclui `/minha-empresa/nova`) passam. Conferido **contra a API real** com a conta de teste: o `POST /Empresa/adicionar` respondeu 200 com `{ empresaGuid }`; o login seguinte devolveu `requiresCompanySelection` com `empresas: [{ empresaGuid, razaoSocial, cnpj, perfil, perfilId }]` (sem `nomeFantasia`; `perfil` é o nome do perfil em texto e `perfilId` o código, o que corrigiu o mapper); a escolha entrou em cada empresa (o token traz `empresa_guid` diferente e role 1 = Administrador nas duas); "Minha empresa" mostra os dados da empresa escolhida; o 429 do `selecionar-empresa` aparece com a mensagem da API e a lista mantida. **Não conferido na API real:** o 401 de escolha vencida (coberto só por teste unitário) e o layout no celular. **Dado deixado na conta de teste (a API não exclui):** empresa "TESTE VALIDACAO ADICIONAR EMPRESA LTDA", CNPJ 54.172.891/0001-92, guid `a9bebee3-d7ff-406f-b0a0-fe03249b7031`.
