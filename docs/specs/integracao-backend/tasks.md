# Tasks: Preparação da Comunicação com o Backend

Referências: ./prd.md, ./techspec.md

- [x] T1 — Instalar dependências `axios` (dependência) e `dotenv-cli` (devDependência)
  - Arquivos: `package.json`, `package-lock.json`
  - Pronto quando: ambos aparecem no `package.json` e `npm install` roda sem erros.

- [x] T2 — Criar arquivos de ambiente e liberar versionamento
  - Arquivos: `.env.hml`, `.env.azl`, `.env.prod`, `.env.example`, `.env.local` (não versionado), `.gitignore`
  - Pronto quando: cada `.env.<amb>` define `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_API_URL` (`https://api.gipepark.com.br/api/v1`) e `NEXT_PUBLIC_API_TIMEOUT_MS`; `.gitignore` tem as exceções `!.env.hml`, `!.env.azl`, `!.env.prod`, `!.env.example`; `git status` lista os 4 arquivos versionáveis e não lista `.env.local`.

- [x] T3 — Adicionar scripts por ambiente
  - Arquivos: `package.json`
  - Pronto quando: existem `build:hml|azl|prod` e `start:hml|azl|prod` usando `dotenv -e .env.<amb> -- next build|start`; `dev`, `build` e `start` permanecem inalterados.

- [x] T4 — Criar leitura e validação das variáveis de ambiente
  - Arquivos: `src/lib/api/env.ts`
  - Pronto quando: valida com zod `APP_ENV` (`dev|hml|azl|prod`), `API_URL` (URL, sem `/` final) e `TIMEOUT_MS` (número positivo, padrão 30000), acessando `process.env.NEXT_PUBLIC_*` por referência literal; sem `APP_ENV` assume `dev` com `console.warn`; URL ausente/inválida lança erro citando a variável; `npm run lint` passa.

- [x] T5 — Criar tipos base da API
  - Arquivos: `src/lib/api/types.ts`
  - Pronto quando: exporta `ApiErrorBody` (`message?`, `errors?`) e `ApiResponse<T> = T`; compila sem erros.

- [x] T6 — Criar `ApiError` e `normalizeError`
  - Arquivos: `src/lib/api/errors.ts`
  - Pronto quando: `ApiError` tem `kind` (`unauthorized|forbidden|not_found|validation|server|network|timeout|unknown`), `status?` e `details?`; `normalizeError` mapeia 401, 403, 404, 400/422, ≥500, timeout (`ECONNABORTED/ETIMEDOUT`) e ausência de resposta; usa `message` do corpo quando for string, senão mensagem padrão em pt-BR por `kind`; o erro não contém config nem headers do request.

- [x] T7 — Adicionar `getToken()` ao módulo de autenticação
  - Arquivos: `src/lib/auth.ts`
  - Pronto quando: `getToken()` lê o cookie `AUTH_COOKIE_NAME`, retorna `null` se ausente ou se `document` for indefinido; `saveToken`, `clearToken` e `mockLogin` permanecem inalterados.

- [x] T8 — Criar o cliente axios com interceptors
  - Arquivos: `src/lib/api/client.ts`
  - Pronto quando: `api` usa `baseURL` e `timeout` de `env`; o interceptor de request anexa `Authorization: Bearer <token>` só quando há token; o interceptor de response rejeita sempre com `ApiError`; não há redirect nem limpeza de sessão no 401.

- [x] T9 — Criar service de exemplo e `index.ts` público
  - Arquivos: `src/lib/api/services/health.example.ts`, `src/lib/api/index.ts`
  - Pronto quando: `getHealth()` demonstra `api.get<T>()`; `index.ts` reexporta `api`, `ApiError`, `normalizeError` e os tipos; nenhuma tela importa o exemplo.

- [x] T10 — Integrar com TanStack Query
  - Arquivos: `src/lib/queryClient.ts`
  - Pronto quando: `ApiError` está registrado como `defaultError` via `declare module "@tanstack/react-query"`; `retry` não repete para `unauthorized`, `forbidden`, `not_found` e `validation` e mantém o padrão nos demais; `createQueryClient()` continua com a mesma assinatura.

- [x] T11 — Documentar a integração
  - Arquivos: `docs/INTEGRACAO-BACKEND.md`, `README.md`
  - Pronto quando: o doc explica configurar ambientes, rodar `build:<amb>`, criar um service e tratar `ApiError`, e registra os riscos de HTTP, CORS e conteúdo misto; o `README.md` tem uma seção curta apontando para ele.

- [~] T12 — Verificação final
  - Arquivos: nenhum (execução de comandos)
  - Pronto quando: `npm run lint` e `npm run build` passam; `build:hml`, `build:azl` e `build:prod` passam com o endereço correto embutido; sem `NEXT_PUBLIC_API_URL` o erro explícito aparece; validação manual do `getHealth()` contra o backend cobre sucesso, 404, rede indisponível, timeout e presença do `Authorization` com cookie. O que não puder ser testado (ex.: backend inacessível) é reportado como pendente.
