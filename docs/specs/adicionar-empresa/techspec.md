# Tech Spec: Adicionar nova empresa

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só mapeia a decisão para código)
- Contrato da API: `docs/specs/input.md` (`POST /api/v1/Empresa/adicionar`) e o swagger colado em 23/10/2026 (`autenticacao/login`, `autenticacao/selecionar-empresa`)
- Specs relacionadas: `docs/specs/minha-empresa/` (formulário que será reaproveitado), `docs/specs/permissoes-por-perfil/` (área Empresa)

## Design
- **Telas/estados**: `/minha-empresa/nova` (formulário, erro, enviando), painel "Empresa criada" e a etapa "Escolha a empresa" do login (lista, entrando, erro, escolha expirada). Detalhe em `design.md`.
- **Componentes do design system reaproveitados**: `Accordion`, `Button`, `Text`, `ErrorBanner`, `ConfirmDialog`, `Toast`, `Link`, `AuthCard` (`Form`, `Footer`), `ErroSemPermissao`; do domínio, `CompanyStepFields` (com a busca por CEP), `BusinessHoursStepFields` e `PagamentosFields`.
- **Componentes novos** (nenhum em `ui`): `src/components/empresa/NovaEmpresa/`, `src/components/empresa/EmpresaCriada/`, `src/components/empresa/EmpresaSecoes/` (miolo compartilhado) e `src/components/auth/EscolherEmpresa/`.
- **Tokens de tema**: nenhum novo.

## Arquitetura da solução

### 1. API — `src/lib/api/services/empresa.ts` (editar)
- `addEmpresa(values: EmpresaFormValues): Promise<{ empresaGuid: string }>` → `POST /Empresa/adicionar` com `toEmpresaPayload(values)`. O mapper atual **não envia `valorTrocoPadrao`**: no cadastro a API trata ausente como zero, o que atende à decisão provisória "não pedir o troco" do PRD. Aceita 200 ou 201; devolve `{ empresaGuid }` com a validação de que veio uma string não vazia (senão `ApiError("unknown")`).
- Erros sobem como `ApiError` (400 de regra de negócio, 403, rede). Nada de log do corpo.
- Testes em `empresa.test.ts`: método e rota, corpo sem `valorTrocoPadrao`, 201 com `{ empresaGuid }`, resposta sem guid, erro 400 com a mensagem da API.

### 2. API — login com várias empresas — `src/lib/api/services/auth.ts` (editar)
- `LoginResult` ganha `{ kind: "escolher-empresa"; preAuthToken: string; empresas: EmpresaOpcao[] }`.
- `toLoginResult` passa a reconhecer `requiresCompanySelection: true` com `preAuthToken` e a lista de empresas (hoje esse caso cai em `ApiError("unknown")`, que é exatamente o bloqueio descrito no PRD). A ordem de verificação continua: troca de senha, depois escolha de empresa, depois sessão.
- **A forma da lista de empresas não foi vista.** O swagger só diz "a lista de empresas". Mapper tolerante em `src/lib/api/services/auth.mapper.ts` (novo): `id` ← `empresaGuid ?? guid ?? id`; `nome` ← `nomeFantasia || razaoSocial || nome`; `cnpj` ← `cnpj`; `perfil` opcional. Lista vazia, sem `id` ou sem nome vira `ApiError("unknown")`. As suposições ficam só nesse arquivo, para o ajuste ser local quando houver uma resposta real.
- `selecionarEmpresa({ preAuthToken, empresaGuid }): Promise<string>` → `POST /autenticacao/selecionar-empresa` com `{ empresaGuid }` no corpo e o `preAuthToken` no header `Authorization: Bearer` (mesmo padrão de `trocarSenhaPrimeiroAcesso`; o interceptor já respeita o cabeçalho da chamada). Devolve o `accessToken`; resposta sem token vira `ApiError("unknown")`. Um 401 vira `ApiError("unauthorized", "Sua escolha expirou. Entre novamente.")`; 429 mantém a mensagem da API.
- `src/types/auth.ts` (novo): `EmpresaOpcao = { id: string; nome: string; cnpj: string; perfil?: number | null }`.
- Testes em `auth.test.ts` e `auth.mapper.test.ts`: reconhece escolha de empresa; troca de senha vence escolha; lista vazia ou malformada falha; `selecionarEmpresa` envia header e corpo certos; 401 e 429.

### 3. Login — `src/components/auth/LoginForm/LoginForm.tsx` (editar) e `EscolherEmpresa` (novo)
- `LoginForm` ganha o estado `etapa: { tipo: "login" } | { tipo: "empresa"; preAuthToken; empresas; values }`, **só em memória do componente** (o token de pré-autenticação e a senha não vão para URL, storage nem `passwordChangeSession`). Recarregar a página volta ao login, que é o esperado.
- Em `onSuccess` do login, o novo `case "escolher-empresa"` muda a etapa. O `case "sessao"` não muda.
- `EscolherEmpresa` (Client Component): recebe `empresas`, `onEscolher(id)`, `onVoltar`, `isPending`, `pendenteId`, `error`. Renderiza dentro do `AuthCard` a lista de botões (`<ul>` de `<button>`), o `Link` "Voltar" e os estados do design. Erro 401 mostra "Voltar ao login" no lugar da lista.
- A mutação de escolha, ao ter sucesso: `saveToken`, lembrar ou limpar o login (usando os `values` guardados na etapa, como hoje) e `router.push("/dashboard")`. Erros sobem para `EscolherEmpresa` mostrar.
- **Primeiro acesso com várias empresas (RF10)** já se resolve sem código novo: depois de trocar a senha o fluxo atual manda para `/login?senha=alterada`, e o login seguinte cai na escolha. Fica um teste que documenta isso.

### 4. Formulário da nova empresa — compartilhar com `EmpresaForm`
Hoje `EmpresaForm.tsx` concentra três formulários, a validação, o estado dos acordeões, o foco no primeiro erro e o JSX. Para não duplicar:
- `src/components/empresa/useEmpresaForms.ts` (novo): recebe `EmpresaFormValues` iniciais e devolve `companyForm`, `hoursForm`, `paymentsForm`, `isDirty`, `isInvalid` por seção, `open/setOpen`, `sectionsRef`, `validarTudo(): Promise<EmpresaFormValues | null>` (o corpo de `handleSave` até antes da mutação: valida os três, abre seções com erro, foca o primeiro campo inválido) e `reset()`.
- `src/components/empresa/EmpresaSecoes/EmpresaSecoes.tsx` (novo): o `Accordion` com as três seções, recebendo o que o hook devolve e as props `disabled` e `lockCnpj`.
- `EmpresaForm.tsx` (editar): passa a usar o hook e as seções, com **o mesmo comportamento e os mesmos testes** (`EmpresaForm.test.tsx` é a rede de segurança desta refatoração e deve passar sem mudança de expectativa). Ganha o botão `secondary` "Adicionar empresa" ao lado do título, que faz `router.push("/minha-empresa/nova")` (os testes passam a mockar `next/navigation`).
- `NovaEmpresa.tsx` (novo): valores iniciais `EMPTY_COMPANY_DATA`, `EMPTY_BUSINESS_HOURS_DATA`, `EMPTY_PAYMENTS_DATA` (só Dinheiro ligado, como na adesão), `lockCnpj` desligado, ações "Cancelar" e "Criar empresa", `ConfirmDialog` ao cancelar com dados (`isDirty`), `useMutation(addEmpresa)`, `ErrorBanner` com a mensagem da API, `ErroSemPermissao` no 403. Em caso de sucesso guarda o nome criado e renderiza `EmpresaCriada` no lugar do formulário.
- `EmpresaCriada.tsx` (novo): painel com título, razão social, texto do design, botão "Sair e escolher a empresa" e "Voltar para Minha empresa"; foco no título e `role="status"`.
- `src/hooks/useLogout.ts` (novo): `clearToken()`, `clearRememberedLogin()` e `router.push("/login")`, extraído de `UserMenu.tsx` (que passa a usá-lo, sem mudar o comportamento) para o painel reutilizar a mesma saída.

### 5. Rota e permissão
- `src/app/(app)/minha-empresa/nova/page.tsx` (novo, Server Component com `metadata` e `<NovaEmpresa />`).
- `areaDaRota` já mapeia o prefixo `/minha-empresa` para `AREA.Empresa`, então `/minha-empresa/nova` fica restrita ao Administrador pelo proxy sem mudança. Acrescentar casos de teste em `permissoes.test.ts` e `proxy.test.ts` (Gerente e Caixa são barrados em `/minha-empresa/nova`).
- O item "Minha Empresa" do menu continua marcado como ativo na rota filha (`isNavItemActive` já cobre filhas).
- O botão "Adicionar empresa" usa `useCan(AREA.Empresa)` por consistência, embora a página inteira já seja só do Administrador.

## Decisões e trade-offs
- **Extrair o miolo em vez de copiar `EmpresaForm`**: a copia é mais rápida, mas duplica ~150 linhas de validação e foco que já foram acertadas e testadas; a extração é guiada pelos testes existentes. Risco: a refatoração mexe numa tela que funciona, mitigado por não mudar expectativas de teste.
- **Painel de confirmação na mesma rota**, e não redirecionar: a pessoa precisa saber o que fazer em seguida, e o formulário preenchido na tela convidaria a reenvio.
- **Não trocar a sessão para a nova empresa**: a API só emite o token da empresa pelo fluxo de login (`selecionar-empresa` exige o `preAuthToken`). Simular a troca exigiria guardar a senha, o que o projeto evita.
- **Token de pré-autenticação só em memória do componente**: mais restrito que `passwordChangeSession` (que sobrevive à navegação), porque aqui a etapa acontece na mesma tela do login.
- **Não enviar `valorTrocoPadrao`**: já é o que o mapper faz; evita pedir um campo que deixou de limitar a retirada do caixa.
- **Mapper tolerante para a lista de empresas**: o formato real é desconhecido; concentrar a suposição num arquivo evita espalhar nomes de campo.

## Riscos / pontos de atenção
- **Formato da lista de empresas no login não conhecido.** Maior risco da feature. Mitigação: mapper isolado e testes com payload de exemplo; validar com um login real de um usuário com duas empresas antes de dar por concluída (a conta de teste passa a ter duas depois de criar uma).
- **Bloqueio de acesso já existe para quem tiver duas empresas** (o login falha com "erro inesperado"). A etapa de escolha deve entrar **antes ou junto** do cadastro: criar a segunda empresa sem a escolha pronta tranca o usuário fora da interface.
- **Criar empresa em ambiente real deixa dado de teste** na conta. Para testar de ponta a ponta, usar CNPJ válido e razão social identificável, e registrar o que foi criado (a API não oferece exclusão).
- **Refatoração de `EmpresaForm`:** qualquer divergência de comportamento aparece nos testes da tela "Minha empresa"; rodá-los a cada passo.
- **Perfil do criador na nova empresa** não está documentado (presume-se Administrador); confirmar no primeiro acesso à empresa criada.
- **Sessão antiga após criar:** o token atual continua válido para a empresa de origem; o painel orienta a sair e entrar de novo. Se a pessoa não sair, nada quebra.
- **CNPJ duplicado:** a mensagem vem da API; se vier vazia, usar o texto padrão do sistema.

## Fora de escopo técnico
- Seletor de empresa dentro do sistema e nome da empresa atual no cabeçalho.
- Edição ou exclusão de empresas além da edição da empresa logada.
- Copiar dados entre empresas.
- Troca de sessão sem passar pelo login.
- Mudanças na adesão.
