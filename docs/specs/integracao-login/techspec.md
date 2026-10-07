# Tech Spec: Integração do Login com o Backend

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (via skill claude-design)
- Contexto: `src/components/auth/LoginForm/LoginForm.tsx`, `src/lib/auth.ts`, `src/lib/api/` (camada de comunicação, `docs/INTEGRACAO-BACKEND.md`), `src/lib/api/services/adesao.ts` (padrão de service)

## Design
- **Telas/estados** (a tela de login não muda visualmente):
  - *Padrão*: como hoje.
  - *Enviando*: botão "Entrando..." desabilitado e campos desabilitados (já existe).
  - *Credencial recusada*: mensagem "CPF ou senha inválidos." abaixo dos campos; CPF mantido; senha mantida no campo (sem limpar, para o usuário corrigir).
  - *Falha de comunicação* (rede, timeout, servidor): mensagem em português vinda do `ApiError`; o formulário continua preenchido e pode ser reenviado.
  - *Validação de campo* (CPF inválido ou vazio, senha vazia): erro no campo, sem chamada ao backend.
- **Componentes do design system reaproveitados:** `AuthCard`, `Input`, `Button`, `Text` (variant `error`), `Toast` (aviso de cadastro). Nenhum componente novo.
- **Ajuste de acessibilidade:** a mensagem de erro do envio ganha `role="alert"` para ser anunciada (o `Text` já repassa props HTML). Sem mudança de estilo.
- **Tokens de tema:** nenhum novo.

## Arquitetura da solução

### Arquivos
| Arquivo | Ação | Tipo |
|---|---|---|
| `src/lib/api/services/auth.ts` | Novo: `login(cpf, senha)` | módulo (client) |
| `src/lib/auth.ts` | Editar: remover `mockLogin` e `MOCK_CREDENTIALS`; manter cookie, `saveToken`, `getToken`, `clearToken` | módulo (client) |
| `src/lib/schemas/login.ts` | Editar: validar formato do CPF | módulo |
| `src/components/auth/LoginForm/LoginForm.tsx` | Editar: usar o service, limpar sessão anterior, `role="alert"` no erro | Client Component (já é) |

Nada muda em `src/proxy.ts`, `UserMenu` (já usa `clearToken`) nem na adesão (o aviso `?cadastro=sucesso` segue igual).

### Service (`src/lib/api/services/auth.ts`)
- `login(cpf: string, senha: string): Promise<{ token: string }>`.
- Faz `api.post("/autenticacao/login", { login: onlyDigits(cpf), senha })`. A `baseURL` do `api` já inclui `/api/v1`; o path segue a caixa do `curl` recebido.
- CPF enviado **só com dígitos**, como no exemplo do backend (**[A DEFINIR]** com o time; ponto único de ajuste).
- Extração do token isolada em uma função `extractToken(body: unknown): string`, validada com `zod`. Como o formato da resposta não é conhecido, aceita `token` ou `accessToken`, no topo ou dentro de `data`; se não achar nenhum, lança `ApiError("unknown")`. Ao conhecer o contrato real, a função é reduzida a um único formato.
- Tradução de erro específica do login: `ApiError` com `kind === "unauthorized"` (401) vira `ApiError("unauthorized", "CPF ou senha inválidos.")`, já que a mensagem-padrão dessa classe ("Sessão expirada. Faça login novamente.") não faz sentido aqui. Os demais tipos (rede, timeout, servidor, `validation`, `forbidden`) passam com a mensagem existente, que já usa o texto do backend quando houver. **[A DEFINIR]** como o backend sinaliza credencial inválida (401 ou 400/422); ajustar a tradução quando o formato de erro for conhecido.
- Rejeita sempre com `ApiError`; nunca inclui `senha` em mensagens (o `normalizeError` já descarta config/body da requisição).

### Formulário (`LoginForm`)
- `mutationFn`: `clearToken()` e depois `login(cpf, senha)`. Limpar antes evita que um token antigo vá no `Authorization` da própria requisição de login (o interceptor do `api` anexa o token do cookie) e já deixa o estado sem sessão em caso de falha.
- `onSuccess({ token })`: `saveToken(token)` e `router.push("/dashboard")`, como hoje.
- Erro: `mutation.error.message` em `<Text variant="error" role="alert">`.
- `loginSchema`: CPF passa a usar `isValidCPF` (`src/lib/cpf.ts`) com mensagem "CPF inválido", mantendo "Informe o CPF" para vazio; senha continua só obrigatória (regra de senha é do backend).
- A senha não é logada nem armazenada fora do estado do formulário.

### Sessão
- Mantida como hoje: cookie `gipe_token`, `max-age` de 8 h, `path=/`, lido pelo `proxy` (presença) e pelo interceptor do `api` (`Bearer`). Sem expiração do lado do cliente além do `max-age`.

## Decisões técnicas e trade-offs
- **Service em `src/lib/api/services/` e hook dentro da feature:** segue o padrão do guia e da adesão; o `useMutation` já está no `LoginForm`.
- **Tradução do 401 no service de login, e não no `normalizeError`:** o mesmo 401 significa "sessão expirada" em chamadas autenticadas e "credencial inválida" no login. O contexto só é conhecido aqui.
- **`extractToken` tolerante e isolada:** o contrato da resposta ainda não é conhecido; concentrar a suposição num ponto evita espalhar chute pelo código e falha de forma explícita ("erro inesperado") em vez de gravar um token inválido.
- **`clearToken()` antes do login:** alternativa seria pular o interceptor por flag na requisição, o que mexeria na camada compartilhada por uma exceção; a limpeza prévia é mais simples e semanticamente correta (novo login substitui a sessão).
- **Validar CPF com dígito verificador no cliente:** cumpre o PRD (nenhuma chamada com CPF inválido) e já existe `isValidCPF`. Trade-off em Riscos.
- **Cookie escrito por JavaScript, sem `HttpOnly`/`Secure`/`SameSite`:** mantido por estar fora de escopo e porque o token precisa ser lido no cliente pelo interceptor. Migrar para cookie `HttpOnly` definido pelo servidor exigiria um Route Handler/BFF e fica para depois.
- **Sem tratamento global de 401:** o guia atribui à feature de login limpar a sessão e redirecionar quando uma chamada autenticada retornar 401, mas o PRD deixou expiração e sessão expirada fora de escopo. Registrado como evolução.
- **Sem testes automatizados:** o projeto não tem framework de testes; verificação manual e por lint/build.

## Riscos / pontos de atenção
- **Contrato desconhecido (resposta e erro):** o maior risco. Se o token vier em outro campo, `extractToken` falha com erro inesperado até ajuste; se a credencial inválida vier como 400/422 em vez de 401, a mensagem pode ficar genérica. Primeiro teste real com um usuário válido e um inválido resolve ambos.
- **Validação de CPF no cliente pode bloquear usuário do backend:** se existir usuário de teste com CPF sem dígito verificador válido, o formulário o recusa. O exemplo `00794797075` deve ser conferido; se o backend aceitar CPFs inválidos, trocar para validar só o tamanho (11 dígitos).
- **Senha provisória:** a senha do exemplo (`Mudar@123`) sugere troca obrigatória no primeiro acesso; se o backend responder com uma flag desse tipo, hoje ela seria ignorada e o usuário entraria direto. Fora de escopo, mas precisa de decisão de produto.
- **HTTP sem criptografia:** a senha trafega em texto claro; HTTPS antes de produção. Conteúdo misto bloqueia o login se o front for servido em HTTPS e a API continuar em HTTP.
- **CORS:** o backend precisa liberar a origem de cada ambiente para o `POST` com `Content-Type: application/json` (dispara preflight).
- **Perda do acesso de teste:** ao remover a credencial simulada, o desenvolvimento local depende do backend no ar e de um usuário válido.
- **Cookie sem flags de segurança** (`HttpOnly`, `Secure`): exposto a scripts na página; aceito neste escopo.

## Fora de escopo técnico
- Cookie `HttpOnly` definido pelo servidor / BFF.
- Expiração, renovação de token e tratamento global de 401.
- Recuperação e redefinição de senha integradas.
- Troca obrigatória de senha, dados do usuário logado e permissões.
- Fallback de mock em desenvolvimento.
- Infraestrutura de testes automatizados.

## Roteiro de verificação manual
1. Credenciais válidas do backend: entra e chega ao `/dashboard`; cookie `gipe_token` gravado.
2. Senha errada: mensagem "CPF ou senha inválidos." anunciada; CPF mantido; sem cookie; sem redirecionamento.
3. CPF inválido ou vazio: erro no campo e nenhuma requisição na aba Network.
4. Backend inacessível (offline ou URL errada): mensagem de falha de comunicação; reenvio possível sem redigitar o CPF.
5. Duplo clique em "Entrar": uma única requisição.
6. A requisição de login não leva `Authorization` mesmo havendo cookie antigo; o corpo leva o CPF só com dígitos.
7. A senha não aparece em mensagens nem no console.
8. CPF e senha da antiga credencial simulada (`972.502.551-26` / `123456`): recusados se não existirem no backend.
9. Após a adesão, aviso de cadastro concluído visível e login do titular criado funcionando.
10. Rotas logadas sem cookie levam ao login; "Sair" apaga o cookie.
11. `npm run lint` e `npm run build` sem erros.

## Contrato confirmado (2026-10-07, teste direto com `curl`)
- **Sucesso (200):** `{ "authenticated": true, "message": "OK", "accessToken": "<jwt>", "refreshToken": "", "expiresAt": "<ISO-8601>", "requiresCompanySelection": false, "preAuthToken": null, "empresas": [] }`. O token usado pelo front é `accessToken`; `extractToken` aceita só esse formato.
- **Credencial inválida (401):** `{ "authenticated": false, "message": "Usuário ou Senha Incorretos.", "accessToken": "", ... }`. O front mostra a própria mensagem fixa "CPF ou senha inválidos.".
- **Fora de escopo, mas presente na resposta:** `requiresCompanySelection`, `preAuthToken` e `empresas` indicam um fluxo de escolha de empresa para usuários com mais de uma; `expiresAt` e `refreshToken` indicam expiração/renovação. Hoje, sem `accessToken`, o login falha com erro inesperado.
- **CORS (a resolver):** a requisição `OPTIONS` com `Origin: http://localhost:3000` retorna 204 sem nenhum cabeçalho `Access-Control-*`, e a resposta do `POST` também não os traz. Um navegador bloqueia essa chamada (vale também para `POST /Adesao`). Soluções: liberar a origem no backend, ou fazer o front chamar a API por `rewrites` do Next (mesma origem).
