# Tasks: Integração do Login com o Backend

Referências: ./prd.md, ./techspec.md

- [x] T1 — Criar o service de login `login(cpf, senha)`: `POST /autenticacao/login` com `{ login, senha }`, CPF só com dígitos (`onlyDigits`). A função `extractToken(body)` valida a resposta com `zod`, aceitando `token` ou `accessToken` no topo ou dentro de `data`; sem token, lança `ApiError("unknown")`. Erro `unauthorized` (401) vira `ApiError("unauthorized", "CPF ou senha inválidos.")`; os demais `ApiError` passam sem alteração. Retorna `{ token }`. A senha nunca entra em mensagem de erro.
  - Arquivos: `src/lib/api/services/auth.ts`
  - Pronto quando: `tsc --noEmit` sem erros; com resposta válida devolve `{ token }`; 401 resulta em "CPF ou senha inválidos."; rede, timeout e 5xx mantêm a mensagem padrão do `ApiError`; corpo sem token resulta em erro inesperado; o corpo enviado leva o CPF só com dígitos.

- [x] T2 — Validar o formato do CPF no `loginSchema` com `isValidCPF`: vazio mantém "Informe o CPF", inválido mostra "CPF inválido"; a senha continua só obrigatória.
  - Arquivos: `src/lib/schemas/login.ts`
  - Pronto quando: CPF vazio e CPF inválido geram as mensagens corretas; CPF válido com máscara passa; `tsc --noEmit` sem erros.

- [x] T3 — Ligar o `LoginForm` ao service: `mutationFn` chama `clearToken()` e depois `login(values.cpf, values.senha)`; `onSuccess` salva o token e vai para `/dashboard`; a mensagem de erro do envio usa `role="alert"`. CPF e senha são mantidos após falha.
  - Arquivos: `src/components/auth/LoginForm/LoginForm.tsx`
  - Pronto quando: login válido leva ao `/dashboard` com o cookie `gipe_token` gravado; credencial recusada, rede fora do ar e CPF inválido exibem as mensagens do Tech Spec sem redirecionar e sem apagar o que foi digitado; duplo clique gera uma só requisição; a requisição de login não leva `Authorization`.
  - Depende de: T1, T2

- [x] T4 — Remover o login simulado: apagar `mockLogin` e `MOCK_CREDENTIALS` de `src/lib/auth.ts`, mantendo `AUTH_COOKIE_NAME`, `saveToken`, `getToken` e `clearToken`.
  - Arquivos: `src/lib/auth.ts`
  - Pronto quando: nenhuma referência a `mockLogin`/`MOCK_CREDENTIALS` no código (`grep`); `tsc --noEmit` e `npm run lint` sem erros novos; `UserMenu`, `proxy` e o interceptor do `api` continuam funcionando.
  - Depende de: T3

- [ ] T5 — Verificação final: `npm run lint` e `npm run build` sem erros, e roteiro manual do Tech Spec (11 passos) contra o backend real, incluindo o login do titular criado na adesão. Registrar no `techspec.md` o formato real da resposta e do erro, e ajustar `extractToken` e a tradução do 401 se divergirem.
  - Arquivos: nenhum (verificação); `docs/specs/integracao-login/techspec.md` só se o contrato real diferir do assumido
  - Pronto quando: lint e build passam e os 11 passos foram conferidos.
  - Depende de: T4
