# Tech Spec: Preparação da Comunicação com o Backend

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (via skill claude-design)

## Design
- Telas/estados: **nenhuma**. A feature é infraestrutura, sem UI nova. Não há etapa `claude-design`.
- Componentes do design system reaproveitados: nenhum. As features futuras exibirão `ApiError.message` via o `Toast` existente (`src/hooks/useToast.ts`).
- Componentes novos necessários: nenhum.
- Tokens de tema usados/criados: nenhum.

## Arquitetura da solução

### Configuração por ambiente
Next.js só carrega nativamente `.env`, `.env.local`, `.env.development` e `.env.production` (por `NODE_ENV`). Ambientes customizados (hml/azl/prod) exigem escolher o arquivo explicitamente. Ver `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`.

- Novos arquivos na raiz (URLs não são segredo, logo podem ser versionados; ajustar `.gitignore` com `!.env.hml`, `!.env.azl`, `!.env.prod`, `!.env.example`):
  - `.env.hml`, `.env.azl`, `.env.prod`, cada um com:
    ```
    NEXT_PUBLIC_APP_ENV=hml
    NEXT_PUBLIC_API_URL=http://157.151.11.120:5000/api/v1
    NEXT_PUBLIC_API_TIMEOUT_MS=15000
    ```
  - `.env.example` documentando as variáveis.
  - `.env.local` (não versionado) para o desenvolvimento local, apontando para o mesmo endereço.
- Dependência de desenvolvimento nova: `dotenv-cli`.
- `package.json`, scripts novos (os atuais `dev`/`build`/`start` permanecem e usam `.env.local`):
  - `build:hml`, `build:azl`, `build:prod` → `dotenv -e .env.<amb> -- next build`
  - `start:hml`, `start:azl`, `start:prod` → `dotenv -e .env.<amb> -- next start`
- `NEXT_PUBLIC_` é necessário porque o cliente axios roda no browser; os valores são **embutidos no build**. Cada ambiente precisa do seu próprio build (não dá para promover o mesmo artefato entre ambientes).

### Camada de API (`src/lib/api/`)
```
src/lib/api/
  env.ts          # lê e valida (zod) as variáveis; exporta `env`
  client.ts       # instância axios + interceptors
  errors.ts       # ApiError, ApiErrorKind, normalizeError()
  types.ts        # ApiResponse<T> e ApiErrorBody (tipos base)
  services/
    health.example.ts   # exemplo mínimo de serviço (ver abaixo)
  index.ts        # reexporta api, ApiError, tipos
```
- **`env.ts`**: schema zod (`APP_ENV: "hml"|"azl"|"prod"|"dev"`, `API_URL: url`, `TIMEOUT_MS: coerce number positivo, default 15000`). Acessa as variáveis por referência literal (`process.env.NEXT_PUBLIC_API_URL`), pois lookups dinâmicos não são embutidos no bundle. Se `APP_ENV` ausente, assume `dev` e emite `console.warn` (RF-01). Se a URL estiver ausente/inválida, lança erro nomeando a variável. Remove `/` final da URL para evitar `//` nas rotas.
- **`client.ts`**: `axios.create({ baseURL, timeout, headers: { Accept: "application/json" } })`.
  - Interceptor de request: lê o cookie `AUTH_COOKIE_NAME` (`src/lib/auth.ts`) e, se existir, define `Authorization: Bearer <token>`. Leitura via helper novo `getToken()` em `src/lib/auth.ts` (guarda `typeof document === "undefined"`). Sem token, segue sem o header.
  - Interceptor de response (erro): converte qualquer `AxiosError` em `ApiError` via `normalizeError` e rejeita com ele. Em 401, apenas sinaliza `kind: "unauthorized"`. **Não** redireciona nem limpa a sessão aqui; isso fica para a task de login real (ver Decisões).
- **`errors.ts`**: `class ApiError extends Error { kind; status?; details?; }` com `kind` em `"unauthorized" | "forbidden" | "not_found" | "validation" | "server" | "network" | "timeout" | "unknown"`. Mapeamento: 401, 403, 404, 422 (e 400) → `validation`, ≥500 → `server`, `ECONNABORTED/ETIMEDOUT` → `timeout`, sem resposta → `network`. Mensagem: usa `message` do corpo se for string, senão texto padrão em pt-BR por `kind`. Nunca inclui config/headers do request.
- **`types.ts`**: `ApiErrorBody = { message?: string; errors?: Record<string, string[]> }` (tolerante; formato real do backend ainda a confirmar) e `ApiResponse<T> = T` (alias até o contrato real do backend ser conhecido, para não inventar envelope).
- **`services/health.example.ts`**: exemplo `getHealth()` documentando o padrão `api.get<T>(...)`. Serve de modelo; não é chamado por nenhuma tela.

### Integração com TanStack Query
- `src/lib/queryClient.ts`: tipar o erro padrão com `declare module "@tanstack/react-query" { interface Register { defaultError: ApiError } }`, para `useQuery`/`useMutation` já devolverem `error` como `ApiError`.
- Ajustar `retry` do `QueryClient`: não repetir quando `error.kind` for `unauthorized`, `forbidden`, `not_found` ou `validation`; manter o padrão do TanStack (3 tentativas) nos demais.
- Convenção de service: funções puras que retornam `Promise<T>` e lançam `ApiError`; `queryKey`/hooks ficam em cada feature (fora do escopo criar hooks genéricos).

### Documentação
- `docs/INTEGRACAO-BACKEND.md`: como configurar ambientes, rodar `build:<amb>`, criar um novo service e tratar `ApiError`. Seção curta no `README.md` apontando para ele.

### Server vs Client
- Todo o `src/lib/api/*` é código isomórfico, mas **usado apenas no cliente nesta entrega** (depende do cookie via `document.cookie`). Não é Server Component nem tem `"use client"` (não é componente). O uso a partir de Server Components/Route Handlers não é suportado agora.
- Nenhuma tela é alterada; `mockLogin` e `mockApi.ts` permanecem.

### Dependências novas
- `axios` (dependência) e `dotenv-cli` (devDependência).

## Decisões e trade-offs
- **`.env.<amb>` + `dotenv-cli` em vez de um único `.env` com 3 URLs:** segue o combinado no PRD e evita expor no bundle as URLs dos outros ambientes. Custo: uma devDependency e scripts extras. Alternativa descartada: scripts sem dependência (cópia de arquivo), por serem frágeis no Windows/CI.
- **Variáveis versionadas:** URLs não são segredo; versioná-las dá rastreabilidade. Se no futuro algum ambiente tiver dado sensível, trocar por variáveis de CI.
- **Token via cookie legível por JS:** o cookie `gipe_token` já é gravado no cliente (`saveToken`) e lido pelo `proxy.ts`. Reaproveitar evita criar novo mecanismo de sessão. Limitação: não é `HttpOnly`, então fica exposto a XSS. Aceitável enquanto o backend não definir o contrato; revisar quando houver o login real.
- **Sem redirecionamento automático em 401:** o interceptor só classifica o erro. Acoplar navegação/limpeza de sessão ao cliente HTTP dificulta teste e antecipa decisões do login real. A task de integração do login conecta `kind === "unauthorized"` a `clearToken()` + redirect.
- **`ApiResponse<T> = T`:** o envelope das respostas do backend é desconhecido; não criar abstração antes de conhecê-lo.
- **Sem proxy/rewrites do Next agora:** ver riscos.
- **Sem refresh de token e sem testes automatizados:** o projeto não tem runner de testes configurado (nem `vitest` no `package.json`); a verificação nesta entrega é por `npm run lint`, `npm run build` e checagem manual descrita abaixo.

## Verificação
- `npm run lint` e `npm run build` sem erros.
- `npm run build:hml|azl|prod` com cada arquivo `.env.*` e conferência de que o endereço correto foi embutido.
- Validação manual com um service de exemplo contra o backend: sucesso, 404, falha de rede (backend inacessível), timeout (valor baixo temporário) e header `Authorization` presente quando há cookie.
- Remover `NEXT_PUBLIC_API_URL` e confirmar o erro explícito (RF-01).

## Riscos / pontos de atenção
- **Conteúdo misto:** se o frontend for servido por HTTPS e o backend responder em HTTP, o browser bloqueia as chamadas. Mitigação provável: `rewrites` no `next.config.ts` (proxy server-side, ver `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/rewrites.md`) com `API_URL` relativa, ou HTTPS no backend. Decisão a tomar antes do primeiro deploy em HTTPS.
- **CORS:** o backend precisa liberar a origem de cada ambiente; em desenvolvimento local pode bloquear. Validar cedo; o proxy via `rewrites` também resolve.
- **Backend sem TLS e por IP:** tráfego (incluindo o token) em texto claro. Registrar e recomendar HTTPS antes de produção.
- **Valores embutidos no build:** trocar a URL de um ambiente exige novo build.
- **Formato de erro e de token do backend desconhecidos:** a normalização é tolerante, mas os tipos precisarão de ajuste após o primeiro contato real.
- **`NEXT_PUBLIC_APP_ENV` esquecido em deploy:** cai em `dev` com aviso; os scripts `build:<amb>` reduzem esse risco.

## Fora de escopo técnico
- Migrar login, recuperação de senha, onboarding e gestão de usuários dos mocks para a API.
- Chamadas a partir de Server Components, Route Handlers ou do `proxy.ts`.
- Refresh de token, cookie `HttpOnly` e logout automático em 401.
- Proxy/rewrites, HTTPS e configuração de CORS.
- Pipeline de CI/CD e instalação de runner de testes.
- Cache, retry customizado por endpoint e cancelamento de requisições além do padrão do TanStack Query.
