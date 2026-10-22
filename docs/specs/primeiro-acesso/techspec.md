# Tech Spec: Primeiro Acesso (troca de senha obrigatória)

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-22  
**PRD:** ./prd.md  
**Design:** ./design.md

> Convenções: segue o `CLAUDE.md` (Next.js App Router + TypeScript + styled-components; serviços em `src/lib/api/services`, esquemas em `src/lib/schemas`, componentes de acesso em `src/components/auth`). O padrão de referência é o fluxo de recuperação de senha (`ResetPasswordForm`, `/alterar-senha`) e a troca de senha da gestão de usuários (`alterarSenha`, `PUT /Usuario/senha`).

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só referencia essa decisão)
- Resposta do login: `docs/specs/input.md`

## Design
- **Telas/estados:** uma tela pública `/primeiro-acesso` (formulário, erro, "prazo expirado") e o redirecionamento sem formulário quando não há token de troca. O login não muda visualmente.
- **Componentes do design system reaproveitados:** `AuthCard`, `Form`, `Footer`, `Button`, `Link`, `Text`, `PasswordRequirements` e os campos do `useAppForm`. O aviso de sucesso é o `?senha=alterada` que o `LoginForm` já exibe.
- **Componentes novos:** nenhum em `src/components/ui`. Um componente de feature, `PrimeiroAcessoForm`, em `src/components/auth/`.
- **Tokens de tema:** nenhum novo.

## 1. Visão técnica

O login passa a ter dois resultados possíveis: sessão criada (`accessToken`) ou troca de senha exigida (`requiresPasswordChange` + `passwordChangeToken`). No segundo caso o `LoginForm` guarda o token de troca **só em memória**, leva o usuário a `/primeiro-acesso` e não cria cookie de sessão. A nova tela envia a nova senha ao back e, em caso de sucesso, volta ao login com o aviso existente.

Pontos centrais:
- **Resultado do login como união discriminada** (`sessao` | `trocar-senha`), em vez de mais um caminho de erro.
- **Token de troca e senha temporária em um módulo de memória** (`passwordChangeSession.ts`), nunca na URL, em cookie, `localStorage` ou `sessionStorage`. Sobrevive à navegação do cliente (`router.push`), não sobrevive ao recarregamento — que é o comportamento pedido (PRD, RF-04).
- **Sem token, sem formulário:** a tela redireciona para `/login` e não renderiza nada enquanto isso.
- **Sem refatorar a recuperação de senha:** o formulário novo reaproveita o mesmo esquema e o mesmo checklist, mas `ResetPasswordForm` fica como está.

## 2. Contrato da API

### Login (`POST /autenticacao/login`, já existente)
Resposta que exige troca (campos usados): `requiresPasswordChange: true`, `passwordChangeToken: string`. Nela `accessToken` vem vazio. Os demais campos (`message`, `refreshToken`, `expiresAt`, `empresas`, `requiresCompanySelection`, `preAuthToken`) são ignorados. A `message` do back não é exibida: a tela usa texto próprio (design).

### Troca de senha (`PUT /api/v1/Usuario/senha`, já existente)
É o mesmo endpoint de "Alterar senha" do menu, usado aqui com o `passwordChangeToken` do login no lugar da sessão. Não há endpoint novo. Contrato:
- Autenticação: `Authorization: Bearer <passwordChangeToken>`.
- Corpo: `{ "senhaAtual": "<senha temporária digitada no login>", "novaSenha": "<senha>" }`. A API exige mínimo de 6 caracteres e nova senha diferente da atual.
- A senha vale para todas as empresas do usuário. No primeiro acesso não há sessão: o usuário volta ao login.
- Sucesso: 2xx sem corpo útil; **não** devolve sessão (PRD: o usuário volta ao login).
- Token vencido ou recusado: 401/403 (ou 404). Regra de negócio da senha: 400/422 com mensagem.

O token de troca é um JWT de curta duração com a claim `purpose: password-change`. **[A CONFIRMAR]** com o back: que `PUT /Usuario/senha` aceita o token de troca (a definição foi do time), o código devolvido para token vencido e o prazo de validade.

## 3. Arquitetura da solução

### Arquivos

```
src/
├── app/
│   └── primeiro-acesso/page.tsx             # Server Component: metadata + <PrimeiroAcessoForm />
├── components/auth/
│   ├── LoginForm/LoginForm.tsx              # trata o resultado "trocar-senha"
│   ├── LoginForm/LoginForm.test.tsx         # novo
│   └── PrimeiroAcessoForm/
│       ├── PrimeiroAcessoForm.tsx           # Client Component
│       ├── PrimeiroAcessoForm.test.tsx
│       └── index.ts
├── lib/
│   ├── passwordChangeSession.ts             # guarda token e senha temporária em memória
│   ├── passwordChangeSession.test.ts
│   └── api/services/
│       ├── auth.ts                          # login() devolve união (alterarSenha() já existe em usuario.ts)
│       └── auth.test.ts                     # novo
└── proxy.ts                                 # + "/primeiro-acesso" nas rotas públicas
    proxy.test.ts                            # + caso da nova rota
```

### Tipos e contratos

```ts
// src/lib/api/services/auth.ts
export type LoginResult =
  | { kind: "sessao"; token: string }
  | { kind: "trocar-senha"; passwordChangeToken: string };

export function login(cpf: string, senha: string): Promise<LoginResult>;
// A troca usa alterarSenha({ senhaAtual, novaSenha }, { bearerToken }), de services/usuario.ts, já existente.
```

A leitura da resposta do login usa Zod:
- `requiresPasswordChange === true` **e** `passwordChangeToken` não vazio → `trocar-senha`.
- Caso contrário, exige `accessToken` não vazio → `sessao`.
- Qualquer outra forma (inclusive `requiresPasswordChange` sem token) → `ApiError("unknown")`, como hoje.

```ts
// src/lib/passwordChangeSession.ts  (módulo de memória, só no navegador)
export type PasswordChange = { token: string; senhaAtual: string };
export function setPasswordChange(value: PasswordChange): void;
export function getPasswordChange(): PasswordChange | null; // mesma referência até mudar
export function clearPasswordChange(): void;
export function subscribePasswordChange(listener: () => void): () => void; // para useSyncExternalStore
```

### Server vs Client Component

| Peça | Tipo | Motivo |
|---|---|---|
| `app/primeiro-acesso/page.tsx` | Server | só metadata (`<title>` "Primeiro acesso — GIPE") e composição |
| `PrimeiroAcessoForm` | Client | formulário, mutation, leitura do token em memória |
| `passwordChangeSession.ts`, `auth.ts`, esquemas | módulos | lógica sem React |

## 4. Fluxos técnicos

### Login → primeiro acesso
1. `LoginForm` chama `login()` (já faz `clearToken()` antes).
2. Resultado `trocar-senha`: `setPasswordChange({ token, senhaAtual: <senha digitada> })`, `clearRememberedLogin()` (a senha lembrada, se houver, é a temporária) e `router.push("/primeiro-acesso")`. **Não** chama `saveToken` nem `saveRememberedLogin`, qualquer que seja o estado de "Lembrar senha".
3. Resultado `sessao`: comportamento atual, sem mudança.

### Tela `/primeiro-acesso`
1. O token é lido com `useSyncExternalStore(subscribe, getPasswordChange, () => null)`. No servidor e na hidratação o valor é `null`; em navegação do cliente, são os dados guardados.
2. Sem token, depois de montado: `router.replace("/login")` em efeito, e o componente devolve `null` (nada de formulário).
3. Com token: formulário com `resetPasswordSchema` (campos `senha` e `confirmarSenha`), `PasswordRequirements` padrão e botão "Salvar nova senha".
4. Nova senha igual à temporária: a tela recusa antes de enviar (a API exige senha diferente da atual).
5. Envio: `mutationFn` faz `clearToken()` (o interceptor do `api` sobrescreveria o Bearer com um cookie de sessão antigo) e chama `alterarSenha({ senhaAtual, novaSenha }, { bearerToken: token })`.
6. Sucesso: `clearPasswordChange()`, `clearRememberedLogin()` e `router.push("/login?senha=alterada")`.
7. Erro: `unauthorized`, `forbidden` ou `not_found` → estado "Não foi possível trocar a senha" (token expirado/recusado), com `clearPasswordChange()` e o botão "Ir para o login". Qualquer outro erro (400/422, rede, servidor) fica no formulário, com `Text variant="error"` e os campos preenchidos.

### Rota pública
`/primeiro-acesso` entra em `PUBLIC_PATHS` do `src/proxy.ts`, senão o proxy redireciona para o login por falta de cookie.

## 5. Decisões técnicas e trade-offs

1. **Token em módulo de memória, não em storage.** `sessionStorage` sobreviveria ao recarregamento, o que o PRD não pede, e deixaria um token legível por qualquer script da página por mais tempo. Memória atende ao caso (login → tela) e perde o token ao recarregar, levando ao login. Trade-off: abrir a tela em outra aba também cai no login. Aceito.
2. **União discriminada no `login()`** em vez de lançar um erro especial. A troca obrigatória é um resultado esperado do login, não uma falha; assim o `LoginForm` trata os dois caminhos com `switch` exaustivo e o TypeScript avisa se surgir um terceiro (ex.: seleção de empresa).
3. **Redirecionamento no cliente, não no servidor.** O token só existe no navegador, então o servidor não tem como decidir. Para o formulário nunca piscar, o componente não renderiza nada até confirmar o token.
4. **Reaproveita `resetPasswordSchema`, não generaliza `ResetPasswordForm`.** As duas telas têm destinos, textos e tratamento de erro diferentes. Extrair um formulário comum agora mexeria em uma tela que funciona e aumentaria o escopo. Se uma terceira tela precisar do mesmo par de campos, vale extrair então.
5. **Reusar `PUT /Usuario/senha` em vez de um endpoint novo.** É a mesma operação de "Alterar senha", só que autorizada pelo token de troca. Reusar evita um contrato novo e a função `alterarSenha` já existe.
8. **A senha temporária fica em memória até a troca.** A API pede a senha atual, e pedir de novo ao usuário a senha que ele acabou de digitar seria atrito sem ganho de segurança relevante: ela já foi usada, vale uma única troca e vive só na memória da aba, junto do token. Alternativa descartada: campo "Senha temporária" na tela.
6. **`clearRememberedLogin()` no login que exige troca e depois da troca.** Evita deixar a senha temporária (já inválida após a troca) como credencial lembrada, que faria o próximo login falhar sem explicação.
7. **Sem tempo restante na tela.** O prazo do token não está documentado; mostrar contagem exigiria decodificar o token no cliente. Fora do desenho.

## 6. Testes

Vitest + Testing Library, como no restante do repo.

- **`auth.test.ts` (serviço, `api` mockado):** login com `accessToken` → `sessao`; login com `requiresPasswordChange` e token → `trocar-senha`; `requiresPasswordChange` sem token → `ApiError unknown`; resposta vazia → `unknown`; 401 mantém a mensagem "CPF ou senha inválidos."; `alterarSenha` com `bearerToken` envia `PUT /Usuario/senha` com o cabeçalho Bearer do token de troca e `{ senhaAtual, novaSenha }` (em `usuario.test.ts`).
- **`passwordChangeSession.test.ts`:** guardar, ler, limpar, notificar assinantes.
- **`LoginForm.test.tsx`:** resultado `trocar-senha` guarda o token, chama `router.push("/primeiro-acesso")`, **não** salva cookie nem credencial lembrada e limpa a lembrada; resultado `sessao` segue para `/dashboard`.
- **`PrimeiroAcessoForm.test.tsx`:** sem token redireciona para `/login` e não renderiza o formulário; com token mostra o formulário e o checklist; botão desabilitado com senha fraca ou confirmação diferente; sucesso limpa o token e vai para `/login?senha=alterada`; 401 mostra "prazo expirado" e limpa o token; 400 com mensagem do back fica no formulário com os campos preenchidos; botão desabilitado e "Salvando..." durante o envio.
- **`proxy.test.ts`:** `/primeiro-acesso` abre sem sessão.
- Antes de concluir: `npm run lint` e `npm run build`.

## 7. Riscos / pontos de atenção

1. **O back precisa aceitar o `passwordChangeToken` como autorização de `PUT /Usuario/senha`.** Principal risco: o endpoint foi desenhado para usuário logado. Validar de ponta a ponta com um usuário recém-criado antes de liberar.
2. **Senha temporária em memória.** Fica na memória da aba até a troca, ao lado do token; nunca em URL, cookie, storage ou log (testes cobrem). Sai ao trocar, ao expirar o token ou ao recarregar.
2. **Prazo do token curto e desconhecido.** Se for de poucos minutos, o estado "prazo expirado" será comum. A mensagem e o caminho de volta ao login cobrem, mas vale conhecer o prazo.
3. **Dependência do interceptor do `api`.** Ele sobrescreve `Authorization` quando há cookie de sessão. O `clearToken()` antes da chamada evita isso; um teste cobre o cabeçalho enviado.
4. **Estado em módulo e SSR.** O módulo de memória é carregado também no servidor, mas nunca recebe o token lá (só o `LoginForm`, no navegador, escreve). Os testes e o uso de `useSyncExternalStore` com snapshot de servidor `null` garantem que não há vazamento entre requisições.
5. **Nova senha igual à temporária.** A regra, se existir, é do back; a tela mostra a mensagem dele (PRD, RF-05).
6. **Estrutura do app (Next.js).** `AGENTS.md` avisa de mudanças incompatíveis nesta versão do Next. A página de `alterar-senha` usa `PageProps<"/alterar-senha">` e `metadata`; seguir o mesmo padrão e, na dúvida, conferir `node_modules/next/dist/docs/`.
7. **Token real em `docs/specs/input.md`.** O arquivo traz um token (com e-mail dentro). Não deve ser commitado; os testes usam tokens fictícios.

## 8. Fora de escopo técnico

- Entrar direto no sistema depois da troca (`accessToken` na resposta da troca).
- Seleção de empresa (`requiresCompanySelection`, `preAuthToken`, `empresas`) e `refreshToken`.
- Contagem regressiva do prazo do token.
- Refatorar `ResetPasswordForm` ou unificar os dois formulários.
- Troca de senha de usuário logado (já existe, no menu).
