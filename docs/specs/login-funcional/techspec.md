# Tech Spec: Login Funcional e Controle de Acesso

## Referências
- PRD: ./prd.md
- Design: nenhuma tela nova nem decisão visual — reaproveita a tela de login existente (`src/components/auth/LoginForm`) e o texto de erro já previsto em `docs/specs/autenticacao/design.md` (`Text variant="error"` acima/abaixo do botão). Não passou pela skill `claude-design` porque não há UI nova.

## Design
- Telas/estados: sem mudança de layout. Estados novos no `LoginForm` existente: `loading` (já existia visualmente, passa a refletir uma chamada mockada real) e `error` (mensagem de credencial inválida, usando `Text variant="error"` já usado no componente).
- Componentes do design system reaproveitados: `AuthCard`, `Input`, `Button`, `Text` — nenhum novo.
- Tokens de tema: nenhum novo.

## Arquitetura da solução

### Contexto
Hoje não existe nenhuma forma de sessão: `LoginForm` só simula loading com `setTimeout` e não valida nada; nenhuma rota é protegida. Esta spec adiciona uma camada de autenticação **mockada** (sem backend real) baseada em cookie, para que o Next.js consiga proteger rotas via Proxy antes mesmo de renderizar (evitando flash de conteúdo protegido antes do redirecionamento).

### Arquivos novos
```
src/lib/auth.ts          # mockLogin(), saveToken(), clearToken(), getToken(), AUTH_COOKIE_NAME
src/proxy.ts               # protege as rotas da área logada checando o cookie de auth
```

### Arquivos alterados
```
src/components/auth/LoginForm/LoginForm.tsx   # chama mockLogin() de verdade no submit
src/components/layout/UserMenu/UserMenu.tsx   # "Sair" chama clearToken() antes de navegar
```

### `src/lib/auth.ts` (sem `"use client"` — funções puras, usáveis em client e no proxy quando aplicável)
```ts
export const AUTH_COOKIE_NAME = "gipe_token";

const MOCK_CREDENTIALS = { cpf: "97250255126", password: "123456" };

export function mockLogin(cpf: string, password: string): Promise<{ token: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const cpfDigits = cpf.replace(/\D/g, "");
      if (cpfDigits === MOCK_CREDENTIALS.cpf && password === MOCK_CREDENTIALS.password) {
        resolve({ token: `mock.${Date.now()}` });
      } else {
        reject(new Error("CPF ou senha inválidos"));
      }
    }, 800);
  });
}

export function saveToken(token: string): void {
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 8}`;
}

export function clearToken(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
}
```
- `saveToken`/`clearToken` usam `document.cookie` diretamente (chamadas só em Client Components) em vez de `localStorage`, porque o `proxy.ts` roda no Edge e só enxerga cookies da requisição — `localStorage` não seria visível ali, obrigando um guard client-side com flash de conteúdo.
- Cookie não é `httpOnly` (setado via JS, não via `Set-Cookie` de um servidor real) — aceitável aqui porque é um mock local, sem dado sensível de verdade; documentado como limitação em "Riscos".
- `mockLogin` remove a formatação do CPF (`replace(/\D/g, "")`) antes de comparar, porque o campo já aplica a máscara de `formatCPF` (o valor chega como `972.502.551-26`, não `97250255126`) — comparar os dígitos crus evita acoplar o mock ao formato de exibição.

### `src/proxy.ts` (Proxy do Next.js — renomeação da antiga "Middleware" a partir da v16; roda antes da rota ser renderizada)
```ts
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const hasToken = request.cookies.has(AUTH_COOKIE_NAME);
  if (!hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/precos/:path*",
    "/usuarios/:path*",
    "/usuario/:path*",
    "/veiculos/:path*",
    "/relatorios/:path*",
  ],
}
```
- `matcher` lista exatamente as rotas do route group `(app)` (ver `docs/specs/estrutura-projeto-logado/techspec.md`) — as rotas públicas (`/login`, `/recuperar-senha`, `/alterar-senha`, `/adesao`, `/`) ficam fora do matcher e continuam acessíveis sem token.
- Só verifica **presença** do cookie (RF7/RF8) — não valida o conteúdo do token, pois neste mock qualquer token gerado por `mockLogin` já é considerado válido (sem expiração/refresh, conforme "Fora de escopo" do PRD).

### `LoginForm.tsx` (Client Component, já existente)
- Import `mockLogin`, `saveToken` de `@/lib/auth` e `useRouter` de `next/navigation`.
- `handleSubmit`: chama `mockLogin(cpf, password)`; em `.then`, `saveToken(token)` + `router.push("/dashboard")`; em `.catch`, `setError(err.message)` e `setIsLoading(false)`. Sucesso não precisa desligar `isLoading` antes da navegação (a troca de rota já desmonta o formulário).

### `UserMenu.tsx` (Client Component, já existente)
- `handleLogout` passa a chamar `clearToken()` (de `@/lib/auth`) antes de `router.push("/login")`.

## Decisões técnicas e trade-offs
- **Cookie em vez de `localStorage`**: só o cookie é visível pelo `proxy.ts` no Edge, o que permite bloquear a rota **antes** de renderizar qualquer conteúdo protegido — evita o "flash" de tela que um guard 100% client-side (checando `localStorage` num `useEffect`) teria.
- **Proxy com matcher explícito** em vez de checar tudo exceto uma lista de rotas públicas: a lista de rotas protegidas é pequena e já conhecida (mesmo conjunto do route group `(app)`), então listar positivamente é mais direto e não corre risco de esquecer de proteger uma rota nova sem querer deixar pública por engano (o padrão, ao esquecer, é "não fica protegida" — mais seguro exigir opt-in explícito no matcher ao criar cada nova tela da área logada).
- **`mockLogin` como Promise com `setTimeout`** em vez de reaproveitar algo do `useCurrentUser`: são mocks de coisas diferentes — `useCurrentUser` mocka "quem está exibido no header", `mockLogin` mocka "a chamada de autenticação em si"; mantê-los separados evita acoplar dois mocks que vão ser substituídos por integrações reais em momentos possivelmente diferentes.
- **Sem `httpOnly`/`Secure` no cookie**: como não há servidor real emitindo o cookie, só JS do próprio app, aceitável para o mock — sinalizado em Riscos para não ser esquecido quando a autenticação real for implementada.

## Riscos / pontos de atenção
- Cookie sem `httpOnly` é, por definição, acessível via JS no navegador — não é um padrão de segurança aceitável para um token real; ao substituir por backend de verdade, o cookie deve passar a ser setado pelo servidor (`Set-Cookie` com `httpOnly`, `Secure`, `SameSite`).
- O proxy só verifica **presença** do cookie, não seu conteúdo — qualquer valor não vazio "loga" no Edge; isso é aceitável apenas porque `saveToken` é o único lugar que escreve esse cookie hoje.
- `useCurrentUser` (nome exibido no header) continua sendo um mock independente do token — logar/deslogar não muda o nome mostrado; isso é uma inconsistência aceitável nesta fase (ambos serão substituídos por dados reais futuramente), mas vale registrar para não confundir em QA.
- Testar manualmente: acessar `/dashboard` direto pela URL sem token (deve redirecionar), logar e navegar entre as telas da área logada (não deve redirecionar de volta), usar "Sair" e tentar voltar a uma URL protegida (deve redirecionar de novo).

## Fora de escopo técnico
- Qualquer chamada real de rede/API — `mockLogin` nunca sai do front-end.
- Expiração/refresh de token — o cookie tem um `max-age` fixo (8h) só para não durar para sempre em uma máquina compartilhada, sem lógica de expiração ativa no app.
- Múltiplas credenciais/usuários — só `972.502.551-26`/`123456` é validado.
- Redirecionar automaticamente para `/dashboard` quem já está logado e acessa `/login` — fora do pedido do PRD, não implementado aqui.
