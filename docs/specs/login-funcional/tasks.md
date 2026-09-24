# Tasks: Login Funcional e Controle de Acesso

Referências: ./prd.md, ./techspec.md

- [x] T1 — Criar `src/lib/auth.ts` com o mock de autenticação
  - Arquivos: `src/lib/auth.ts`
  - Pronto quando: exporta `AUTH_COOKIE_NAME`, `mockLogin(cpf, password)` (Promise que resolve `{ token }` para `972.502.551-26`/`123456` após ~800ms e rejeita com `Error("CPF ou senha inválidos")` para qualquer outra combinação — comparando os dígitos do CPF sem formatação), `saveToken(token)` e `clearToken()` (via `document.cookie`, `path=/`).

- [x] T2 — Criar `src/proxy.ts` protegendo as rotas da área logada
  - Arquivos: `src/proxy.ts`
  - Pronto quando: o `matcher` cobre as rotas `/dashboard`, `/precos`, `/usuarios`, `/usuario`, `/veiculos`, `/relatorios` (e subrotas); requisições sem o cookie `AUTH_COOKIE_NAME` são redirecionadas para `/login`; requisições com o cookie passam (`NextResponse.next()`).

- [x] T3 — Ligar `LoginForm` ao mock de login
  - Arquivos: `src/components/auth/LoginForm/LoginForm.tsx`
  - Pronto quando: no submit, chama `mockLogin(cpf, password)`; enquanto pendente, mantém o estado de loading já existente no botão; em sucesso, chama `saveToken(token)` e navega para `/dashboard` (`useRouter`); em erro, exibe a mensagem (`Text variant="error"`) e desliga o loading, sem navegar.

- [x] T4 — Ligar "Sair" (`UserMenu`) à limpeza do token
  - Arquivos: `src/components/layout/UserMenu/UserMenu.tsx`
  - Pronto quando: `handleLogout` chama `clearToken()` antes de `router.push("/login")`.

- [x] T5 — Verificação final (lint/build) e checagem manual dos critérios de aceite
  - Arquivos: n/a
  - Pronto quando: `npm run lint` e `npm run build` passam sem erros; e, manualmente: (a) `972.502.551-26`/`123456` loga e vai para `/dashboard` com token salvo; (b) credencial errada mostra erro e não navega; (c) acessar `/dashboard` ou `/precos` direto pela URL sem token redireciona para `/login`; (d) com token, navegar entre as rotas da área logada não redireciona; (e) "Sair" limpa o token e uma tentativa seguinte de acessar rota protegida redireciona para `/login`.
