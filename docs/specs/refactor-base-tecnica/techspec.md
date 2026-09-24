# Tech Spec: Refactor de Base Técnica (Formulários, Dados e APIs Depreciadas)

## Referências
- PRD: ./prd.md
- Design: nenhuma tela nova nem decisão visual — refactor interno, reaproveita 100% dos componentes de `src/components/ui` já existentes (`Input`, `Select`, `Button`, `Text`, `AuthCard`, `Card`, `Stepper`). Segue as skills `zod` e `tanstack` (seção Form/Query) já disponíveis no projeto.

## Design
- Telas/estados: sem mudança visual. Os estados hoje existentes (loading no botão, erro de campo, erro de submit/toast) continuam os mesmos — só a origem desses estados muda (de `useState`/funções manuais para `TanStack Form` + `TanStack Query`).
- Componentes do design system reaproveitados: todos os já usados por cada formulário hoje (nenhum novo).
- Componentes novos necessários: uma camada fina de **field components** (`TextField`, `SelectField`) que conectam o design system (`Input`/`Select`) ao TanStack Form — ver "Arquitetura da solução".
- Tokens de tema: nenhum novo.

## Arquitetura da solução

### Novas dependências (`package.json`)
```
zod
@tanstack/react-query
@tanstack/react-form
```

### Arquivos novos

```
src/lib/queryClient.ts                       # instância singleton do QueryClient

src/lib/schemas/login.ts                      # z.object({ cpf, senha }) — obrigatórios
src/lib/schemas/recoverPassword.ts            # z.object({ cpf }) — obrigatório + isValidCPF (refine)
src/lib/schemas/resetPassword.ts              # z.object({ senha, confirmarSenha }) — min 6 + refine (coincidem)
src/lib/schemas/adesao.ts                     # companySchema + adminUserSchema (reaproveita isValidCNPJ/isValidCPF/isValidEmail via refine)

src/lib/mockApi.ts                            # mockRecoverPassword(), mockResetPassword(), mockSaveOnboarding()
                                               # (mockLogin já existe em src/lib/auth.ts e é reaproveitado como está)

src/components/form/form.ts                   # createFormHookContexts() + createFormHook() -> useAppForm, withForm
src/components/form/TextField.tsx             # useFieldContext<string>() + <Input> do design system
src/components/form/SelectField.tsx           # useFieldContext<...>() + <Select> do design system
src/components/form/index.ts

src/contexts/CurrentUserContext.tsx           # substitui src/hooks/useCurrentUser.ts (RF9/RF10)
```

### Arquivos alterados

```
src/lib/registry.tsx                                          # adiciona QueryClientProvider
src/app/layout.tsx (ou registry.tsx)                          # adiciona CurrentUserProvider

src/components/auth/LoginForm/LoginForm.tsx                   # useAppForm + loginSchema + useMutation(mockLogin)
src/components/auth/RecoverPasswordForm/RecoverPasswordForm.tsx  # useAppForm + recoverPasswordSchema + useMutation(mockRecoverPassword)
src/components/auth/ResetPasswordForm/ResetPasswordForm.tsx   # useAppForm + resetPasswordSchema + useMutation(mockResetPassword)

src/components/adesao/OnboardingWizard/OnboardingWizard.tsx   # 2 forms (um por step) via useAppForm; validate*() removidas
src/components/adesao/CompanyStepFields/CompanyStepFields.tsx    # passa a receber `form` (via withForm) e usar form.AppField, não mais (value, errors, onChange)
src/components/adesao/AdminUserStepFields/AdminUserStepFields.tsx # idem

src/components/layout/Header/Header.tsx                       # consome useCurrentUser() do novo contexto (mesma API de retorno)
src/components/layout/UserMenu/UserMenu.tsx                   # idem

src/hooks/useCurrentUser.ts                                   # removido
```

### `src/lib/queryClient.ts`
Client Component-adjacent (usado dentro de `"use client"` em `registry.tsx`), instancia um único `QueryClient` (`new QueryClient()` com defaults padrão — sem necessidade de `staleTime`/retry customizados neste mock, já que não há rede real). `registry.tsx` passa a envolver `ThemeModeProvider` com `<QueryClientProvider client={queryClient}>`.

### `src/lib/schemas/*.ts`
Cada schema usa `.trim().min(1, "mensagem atual")` para os campos obrigatórios (preservando a mensagem hoje mostrada) e `.refine(isValidCPF, "CPF inválido")`/`.refine(isValidCNPJ, "CNPJ inválido")`/`.refine(isValidEmail, "E-mail inválido")` chamando as funções já existentes em `src/lib/cpf.ts`/`cnpj.ts`/`email.ts` — **não reimplementa** a lógica de dígito verificador dentro do schema (RF4). `resetPassword.ts` usa `.superRefine` para o erro "As senhas não coincidem" no campo `confirmarSenha`, associando o erro ao path certo (`error-path-for-nested` da skill `zod`). Cada schema exporta o schema e o tipo inferido (`z.infer`), conforme `type-export-schemas-and-types`.

### `src/lib/mockApi.ts`
Funções `Promise`-based com `setTimeout`, no mesmo espírito de `mockLogin` (`src/lib/auth.ts`), preservando os delays atuais de cada tela (`RecoverPasswordForm` 900ms, `ResetPasswordForm` 900ms, `OnboardingWizard` 1000ms) e o comportamento (`mockRecoverPassword`/`mockResetPassword` sempre resolvem; `mockSaveOnboarding` também resolve — nenhuma dessas telas tem hoje um caminho de erro simulado, então nenhum é criado agora, para não mudar comportamento observável fora do que o PRD pede).

### `src/components/form/form.ts`
Segue o padrão `createFormHookContexts()` + `createFormHook()` da skill `tanstack` (`references/form.md`): registra `TextField` e `SelectField` como `fieldComponents`, exporta `useAppForm` (usado em cada formulário) e `withForm` (usado por `CompanyStepFields`/`AdminUserStepFields` para tipar o `form` recebido do `OnboardingWizard` sem duplicar generics).

### `TextField`/`SelectField`
Usam `useFieldContext()` internamente e renderizam `Input`/`Select` do design system, repassando `value`/`onChange`/`onBlur` do field e mapeando `field.state.meta.errors` para a prop `error` que `Input`/`Select` já aceitam hoje — nenhuma mudança visual, só a fonte do dado.

### Formulários (`LoginForm`, `RecoverPasswordForm`, `ResetPasswordForm`)
- `useAppForm({ defaultValues, validators: { onChange: schema.safeParse... } })` no lugar de `useState` por campo.
- Submissão: `form.handleSubmit()` chama uma `useMutation({ mutationFn: mockLogin | mockRecoverPassword | mockResetPassword })`; o `onSubmit` do form dispara `mutation.mutate(value)`.
- Erro de **credencial/negócio** (ex.: "CPF ou senha inválidos" do `mockLogin`) continua vindo de `mutation.error`, exibido separado dos erros de campo (`Display mutation/API errors separately from field validation errors`, conforme skill `tanstack`) — mesma UI de hoje (`Text variant="error"`).
- `RecoverPasswordForm`: o botão fica desabilitado enquanto o form é inválido, usando `useStore(form.store, s => s.isFormValid)` (substituindo o atual `cpfIsValid = isValidCPF(cpf)` calculado manualmente) — mesmo comportamento observável.

### `OnboardingWizard`
Dois `useAppForm` (um por step) em vez de dois `useState` + duas funções `validate*`. `handleNext` chama `companyForm.handleSubmit()`; se válido, avança `step`. `handleSubmit` do step 2 chama `adminUserForm.handleSubmit()`, que dispara `useMutation({ mutationFn: mockSaveOnboarding })`. `CompanyStepFields`/`AdminUserStepFields` passam a ser definidos com `withForm` (recebendo `form` tipado) e usar `form.AppField` para cada campo, no lugar da assinatura atual `(value, errors, onChange)`.

### `CurrentUserContext` (RF9/RF10)
- `src/contexts/CurrentUserContext.tsx`: `CurrentUserProvider` (Client Component) guarda `{ user, isLoading }` em estado **uma vez**, com o mesmo mock/delay que existe hoje em `useCurrentUser`. Exporta `useCurrentUser()` que só faz `useContext` (mesma assinatura de retorno de hoje: `{ user, isLoading }`), então `Header`/`UserMenu` não mudam a forma como consomem o hook — só passam a compartilhar uma instância.
- Provider é adicionado ao lado do `ThemeModeProvider`/`QueryClientProvider` em `registry.tsx` (ou em `src/app/layout.tsx`, o que for mais direto sem criar um novo arquivo de composição só para isso).

## Decisões técnicas e trade-offs
- **TanStack Form em vez de React Hook Form**: a skill `tanstack` já disponível no projeto cobre Query, Router **e Form** — não há skill de `react-hook-form` configurada neste repositório, então TanStack Form é o caminho já "abençoado" pelas convenções do projeto, evitando introduzir uma biblioteca de formulário concorrente sem necessidade.
- **Zod só valida formato/obrigatoriedade, não regra de negócio**: erros como "CPF ou senha inválidos" (a combinação está errada) continuam vindo do mock via `mutation.error`, não do schema — schema valida o que é validável estaticamente (campo preenchido, CPF com dígito verificador correto), a API (mesmo mockada) valida a regra de negócio. Mantém a mesma separação que já existe hoje entre erro de campo e erro de submit.
- **`mockApi.ts` novo em vez de espalhar `setTimeout` inline**: centraliza os mocks de rede da mesma forma que `auth.ts` já faz para login, deixando claro (e fácil de achar) tudo que precisará virar chamada real quando o backend existir.
- **`CurrentUserContext` só resolve duplicação de estado, não integra com `auth.ts`**: como já registrado no PRD, unir "usuário exibido" com "token de sessão" é decisão de uma spec futura — aqui só garantimos uma única fonte de estado para o usuário mockado.
- **Não foi criado hook de "wizard genérico"**: com um wizard só (`OnboardingWizard`), extrair uma abstração de step-management agora seria especular sobre a forma que o próximo wizard (preços, 4 etapas) vai precisar. Prefere-se deixar os dois `useAppForm` explícitos no `OnboardingWizard` e revisitar extração quando o segundo wizard existir de verdade.

## Riscos / pontos de atenção
- `@tanstack/react-form` e `@tanstack/react-query` são dependências novas — checar compatibilidade com React 19 (`package.json` atual já usa `react@19.2.8`) antes de instalar; rodar `npm run build` logo após instalar para pegar qualquer incompatibilidade cedo.
- Migrar `CompanyStepFields`/`AdminUserStepFields` de `(value, errors, onChange)` para `form.AppField`/`withForm` é a mudança de maior superfície desta spec — fazer com atenção redobrada ao `Grid`/`GridItem` existentes (`FormGrid.styles.ts`) para não quebrar o layout dos steps.
- Testar manualmente todos os fluxos afetados após a migração (não há testes automatizados nesta spec, por decisão explícita do PRD): login (certo/errado), recuperar senha (botão habilita só com CPF válido), alterar senha (senhas não coincidem), adesão (as duas etapas, voltar/avançar, erros de validação em cada campo).
- `CurrentUserContext` precisa envolver toda a árvore onde `Header`/`UserMenu` são renderizados (dentro de `AppShell`) — confirmar que o provider fica acima o suficiente na árvore (`registry.tsx`/`app/layout.tsx`) para não precisar de providers duplicados por rota.

## Fora de escopo técnico
- Testes automatizados (vitest) — fora de escopo por decisão do PRD.
- Qualquer chamada de rede real — `mockApi.ts`/`auth.ts` continuam sendo mocks locais.
- RBAC/permissões por perfil — registrado no PRD como necessidade futura, não tratado aqui.
- Extrair um hook/abstração genérica de wizard multi-step — adiado até existir um segundo caso de uso real (wizard de preços).
- Migrar telas que ainda não existem (preços, usuários, veículos, relatórios) para o novo padrão — o padrão fica pronto, mas não há tela nova para aplicá-lo nesta spec.
