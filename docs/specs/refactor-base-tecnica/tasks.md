# Tasks: Refactor de Base Técnica (Formulários, Dados e APIs Depreciadas)

Referências: ./prd.md, ./techspec.md

- [x] T1 — Instalar dependências novas
  - Arquivos: `package.json`, `package-lock.json`
  - Pronto quando: `zod`, `@tanstack/react-query` e `@tanstack/react-form` instalados; `npm run build` continua passando (checagem de compatibilidade com React 19).

- [x] T2 — Criar `QueryClient` e plugar no app
  - Arquivos: `src/lib/queryClient.ts`, `src/lib/registry.tsx`
  - Pronto quando: `queryClient.ts` exporta uma instância de `QueryClient`; `registry.tsx` envolve a árvore com `QueryClientProvider` (ao lado do `ThemeModeProvider`), sem quebrar o build.

- [x] T3 — Criar `CurrentUserContext` e remover `useCurrentUser` como hook solto
  - Arquivos: `src/contexts/CurrentUserContext.tsx` (novo), `src/hooks/useCurrentUser.ts` (removido), `src/lib/registry.tsx` ou `src/app/layout.tsx` (adiciona o provider), `src/components/layout/Header/Header.tsx`, `src/components/layout/UserMenu/UserMenu.tsx`
  - Pronto quando: `CurrentUserProvider` guarda `{ user, isLoading }` uma única vez; `useCurrentUser()` (exportado do contexto) tem a mesma assinatura de retorno de antes; `Header` e `UserMenu` continuam funcionando (skeleton, nome, iniciais) sem alteração visual.

- [x] T4 — Criar a camada de formulário (`useAppForm`/`withForm` + field components)
  - Arquivos: `src/components/form/form.ts`, `src/components/form/TextField.tsx`, `src/components/form/SelectField.tsx`, `src/components/form/index.ts`
  - Pronto quando: `form.ts` exporta `useAppForm`/`withForm` via `createFormHook`/`createFormHookContexts`, registrando `TextField`/`SelectField` como `fieldComponents`; `TextField`/`SelectField` usam `useFieldContext()` e renderizam `Input`/`Select` do design system, repassando `field.state.meta.errors` para a prop `error` já existente.

- [x] T5 — Criar `src/lib/mockApi.ts`
  - Arquivos: `src/lib/mockApi.ts`
  - Pronto quando: exporta `mockRecoverPassword()`, `mockResetPassword()` e `mockSaveOnboarding()`, cada uma `Promise`-based com o mesmo delay que existe hoje inline nos respectivos componentes (900ms, 900ms, 1000ms), sempre resolvendo (nenhuma dessas telas tem hoje caminho de erro simulado).

- [x] T6 — Criar os schemas `zod`
  - Arquivos: `src/lib/schemas/login.ts`, `src/lib/schemas/recoverPassword.ts`, `src/lib/schemas/resetPassword.ts`, `src/lib/schemas/adesao.ts`
  - Pronto quando: cada schema usa `.trim().min(1, "<mensagem atual>")` para campos obrigatórios com a mesma mensagem hoje exibida; `recoverPassword` usa `.refine(isValidCPF, "CPF inválido")`; `adesao` usa `.refine(isValidCNPJ, ...)`/`.refine(isValidEmail, ...)`/`.refine(isValidCPF, ...)` reaproveitando as funções de `src/lib`; `resetPassword` usa `.superRefine` para o erro "As senhas não coincidem" no campo `confirmarSenha`; todos exportam schema + tipo inferido (`z.infer`).

- [x] T7 — Migrar `LoginForm` para `useAppForm` + `useMutation`
  - Arquivos: `src/components/auth/LoginForm/LoginForm.tsx`
  - Pronto quando: usa `useAppForm` com `loginSchema` (validators.onChange), submit dispara `useMutation({ mutationFn: mockLogin })`; erro de credencial (`mutation.error`) exibido como hoje (`Text variant="error"`); loading do botão vem de `mutation.isPending`/`form` state; nenhum `FormEvent` importado; comportamento manual idêntico ao atual (CPF `972.502.551-26`/senha `123456` loga e redireciona, credencial errada mostra erro).

- [x] T8 — Migrar `RecoverPasswordForm` para `useAppForm` + `useMutation`
  - Arquivos: `src/components/auth/RecoverPasswordForm/RecoverPasswordForm.tsx`
  - Pronto quando: usa `useAppForm` com `recoverPasswordSchema`; botão desabilitado enquanto `!isFormValid` (via `useStore`), substituindo o `cpfIsValid` manual; submit dispara `useMutation({ mutationFn: mockRecoverPassword })`; sucesso mostra o mesmo toast de hoje; nenhum `FormEvent` importado.

- [x] T9 — Migrar `ResetPasswordForm` para `useAppForm` + `useMutation`
  - Arquivos: `src/components/auth/ResetPasswordForm/ResetPasswordForm.tsx`
  - Pronto quando: usa `useAppForm` com `resetPasswordSchema` (erro "As senhas não coincidem" vindo do schema, não de `useState` manual); submit dispara `useMutation({ mutationFn: mockResetPassword })`; sucesso redireciona para `/login` como hoje; nenhum `FormEvent` importado.

- [x] T10 — Migrar `CompanyStepFields`/`AdminUserStepFields` para `form.AppField`
  - Arquivos: `src/components/adesao/CompanyStepFields/CompanyStepFields.tsx`, `src/components/adesao/AdminUserStepFields/AdminUserStepFields.tsx`
  - Pronto quando: os dois componentes são definidos com `withForm` (recebendo `form` tipado) em vez da assinatura `(value, errors, onChange)`; cada campo usa `form.AppField`/`TextField`/`SelectField`; o layout (`Grid`/`GridItem` de `FormGrid.styles.ts`) permanece visualmente idêntico.

- [x] T11 — Migrar `OnboardingWizard` para dois `useAppForm` (um por step)
  - Arquivos: `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx`
  - Pronto quando: `validateCompany`/`validateAdminUser` são removidas; `companySchema`/`adminUserSchema` (de `src/lib/schemas/adesao.ts`) validam cada step via `useAppForm`; `handleNext` avança de step só se o form do step 1 for válido; submit final dispara `useMutation({ mutationFn: mockSaveOnboarding })`; nenhum `FormEvent` importado; fluxo manual (avançar, voltar, erros de validação, salvar) idêntico ao atual.

- [x] T12 — Verificação final (lint/build) e checagem manual dos critérios de aceite
  - Arquivos: n/a
  - Pronto quando: `npm run lint` e `npm run build` passam sem erros; nenhuma ocorrência de `FormEvent` (de `"react"`) resta no projeto (`grep -r "FormEvent" src` vazio); manualmente: login (certo/errado), recuperar senha (botão habilita só com CPF válido, toast de sucesso), alterar senha (senhas não coincidem, redirect final), adesão (avançar/voltar, erros de validação nas duas etapas, salvar) — todos continuam funcionando como antes do refactor.
