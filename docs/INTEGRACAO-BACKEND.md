# Integração com o backend

Camada de comunicação em `src/lib/api/` (axios + erros padronizados). Specs: `docs/specs/integracao-backend/`.

## Ambientes

| Ambiente | Arquivo | Build | Start |
|----------|---------|-------|-------|
| dev (local) | `.env.local` (não versionado) | `npm run dev` | — |
| hml | `.env.hml` | `npm run build:hml` | `npm run start:hml` |
| azl | `.env.azl` | `npm run build:azl` | `npm run start:azl` |
| prod | `.env.prod` | `npm run build:prod` | `npm run start:prod` |

Variáveis (veja `.env.example`):

- `NEXT_PUBLIC_APP_ENV`: `dev | hml | azl | prod` (ausente → `dev`, com aviso no console).
- `NEXT_PUBLIC_API_URL`: URL base do backend, sem barra final. Hoje igual nos 3 ambientes: `https://api.gipepark.com.br/api/v1`.
- `NEXT_PUBLIC_API_TIMEOUT_MS`: tempo limite das requisições (padrão 30000).

Os valores `NEXT_PUBLIC_*` são embutidos no **build**: cada ambiente precisa do seu próprio build. Se uma variável obrigatória faltar ou for inválida, a aplicação falha com erro citando qual é.

## Criar um service

```ts
import { api, type ApiResponse } from "@/lib/api";

export async function listUsers() {
  const { data } = await api.get<ApiResponse<User[]>>("/users");
  return data;
}
```

Services são funções puras que retornam `Promise<T>`; o hook (`useQuery`/`useMutation`) fica na feature. O token do cookie `gipe_token` é enviado automaticamente como `Authorization: Bearer`. Exemplo: `src/lib/api/services/health.example.ts`.

## Tratar erros

Toda falha chega como `ApiError`, com `kind` (`unauthorized | forbidden | not_found | validation | server | network | timeout | unknown`), `status?`, `details?` e `message` em pt-BR (usa a mensagem do backend quando houver). No TanStack Query, `error` já vem tipado como `ApiError`, e erros `unauthorized`, `forbidden`, `not_found` e `validation` não sofrem retry.

O 401 é só classificado: limpar a sessão e redirecionar ao login é responsabilidade da feature de login.

## Riscos conhecidos

- **HTTP e IP direto:** o backend não usa TLS; o tráfego (incluindo o token) vai em texto claro. Recomendado HTTPS antes de produção.
- **Conteúdo misto:** frontend em HTTPS chamando API em HTTP é bloqueado pelo browser. Alternativas: HTTPS no backend ou proxy via `rewrites` no `next.config.ts`.
- **CORS:** o backend precisa liberar a origem de cada ambiente.
- **Contrato do backend:** formato de erro e de token ainda não confirmados; os tipos em `types.ts` são tolerantes e devem ser ajustados no primeiro contato real.
