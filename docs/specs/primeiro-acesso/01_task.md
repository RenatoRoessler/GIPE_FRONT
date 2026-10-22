# Task 01: Serviço de login e token de troca em memória

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

Entrega a base da feature, sem nenhuma tela nova: o login passa a distinguir "sessão criada" de "troca de senha exigida", existe a chamada que envia a nova senha e o token de troca tem onde ficar, só em memória. O `LoginForm` atual segue funcionando.

## Contexto Técnico

**Arquivos a criar:**
- `src/lib/passwordChangeSession.ts`
- `src/lib/passwordChangeSession.test.ts`
- `src/lib/api/services/auth.test.ts`

**Arquivos a editar:**
- `src/lib/api/services/auth.ts` — `login()` devolve `LoginResult` (união `sessao` | `trocar-senha`)
- `src/components/auth/LoginForm/LoginForm.tsx` — apenas adaptar ao novo retorno, mantendo o comportamento de hoje (o tratamento da troca é da Task 03)

## Critérios de Aceite

- [x] `login()` devolve `{ kind: "sessao", token }` quando há `accessToken`
- [x] `login()` devolve `{ kind: "trocar-senha", passwordChangeToken }` quando `requiresPasswordChange` é `true` e o token de troca não é vazio
- [x] `requiresPasswordChange` sem token de troca, ou resposta sem `accessToken` e sem troca, rejeita com `ApiError("unknown")`
- [x] O 401 do login continua com a mensagem "CPF ou senha inválidos."
- [x] `alterarSenha(payload, { bearerToken })` (já existente em `usuario.ts`) é a função usada na troca: `PUT /api/v1/Usuario/senha` com `{ senhaAtual, novaSenha }` e o `passwordChangeToken` do login como Bearer
- [x] Os erros de `alterarSenha()` são propagados como `ApiError`, sem normalizar
- [x] `passwordChangeSession.ts` guarda, lê e limpa o token e a senha temporária só em memória e permite assinar mudanças (para `useSyncExternalStore`)
- [x] O token e a senha nunca são logados nem gravados em cookie, `localStorage` ou `sessionStorage`
- [x] O fluxo de login normal (com `accessToken`) segue levando ao `/dashboard`

## Testes

- [x] `auth.test.ts` (com `api` mockado): login com sessão; login com troca; troca sem token; resposta vazia; 401 com mensagem própria
- [x] `usuario.test.ts`: `alterarSenha` com `bearerToken` envia URL, cabeçalho e corpo esperados; erro propagado como `ApiError`
- [x] `passwordChangeSession.test.ts`: guardar, ler, limpar e notificar assinantes
- [x] Suíte atual de `components/auth` continua passando

## Notas de Implementação

Tech Spec, seções 2 e 3. A leitura da resposta do login usa Zod. Não há endpoint novo: o `passwordChangeToken` entra como Bearer em `alterarSenha()`. O interceptor do `api` sobrescreve `Authorization` quando há cookie de sessão; quem chama limpa o cookie antes (Task 02).
