# Tech Spec: Recuperação de Senha por E-mail

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (via skill claude-design; as telas já existem e só mudam o campo e o comportamento, então não há `design.md` separado)
- Camada de comunicação: `docs/INTEGRACAO-BACKEND.md` (`src/lib/api`)
- Padrão seguido: `docs/specs/integracao-login/techspec.md` (service em `src/lib/api/services/auth.ts`, `useMutation` no formulário, aviso por parâmetro de URL)
- Contrato conhecido: `POST /autenticacao/esqueci-senha` com `{ "email": "..." }` (`docs/specs/input.md`). **O contrato da redefinição de senha não foi informado** (ver "Contrato assumido").

## Design
- **Telas/estados**
  - `/recuperar-senha`: card de autenticação com título "Recuperar senha", subtítulo "Informe o e-mail cadastrado para receber as instruções de recuperação.", **um campo "E-mail"**, botão "Recuperar minha senha" e link "Voltar ao login".
    - *Padrão*: botão desabilitado enquanto o e-mail estiver vazio ou inválido.
    - *Erro de campo*: "E-mail inválido" / "Informe o e-mail" abaixo do campo, depois de o campo ser tocado.
    - *Enviando*: campo e botão desabilitados, botão "Enviando...".
    - *Falha de comunicação*: mensagem em `Text variant="error"` com `role="alert"`; e-mail mantido; reenvio possível.
    - *Sucesso*: redireciona para `/login?recuperacao=enviada` (sem tela intermediária).
  - `/login`: ganha dois avisos em `Toast`, acionados por parâmetro de URL (mesmo padrão do `?cadastro=sucesso`): `recuperacao=enviada` ("Enviamos as instruções de recuperação para o seu e-mail.") e `senha=alterada` ("Senha alterada! Faça login com a nova senha.").
  - `/alterar-senha`: continua com "Nova senha" e "Confirmar senha". *Link inválido* (sem token ou recusado pelo backend): card "Link inválido" com a mensagem e "Solicitar novo link". *Erro de comunicação*: mensagem `role="alert"` mantendo os campos.
- **Componentes do design system reaproveitados:** `AuthCard`, `Footer`, `Form`, `Button`, `Link`, `Text`, `Toast`, `TextField`/`useAppForm`. **Nenhum componente novo.**
- **Tokens de tema:** nenhum novo.

## Arquitetura da solução

### Arquivos
| Arquivo | Ação | Tipo |
|---|---|---|
| `src/lib/api/services/auth.ts` | Editar: adicionar `requestPasswordReset(email)` e `resetPassword({ token, senha })` | módulo (client) |
| `src/lib/schemas/recoverPassword.ts` | Editar: trocar `cpf` por `email` | módulo |
| `src/lib/schemas/resetPassword.ts` | Editar: exigir tamanho mínimo da senha | módulo |
| `src/components/auth/RecoverPasswordForm/RecoverPasswordForm.tsx` | Editar: campo de e-mail, `requestPasswordReset`, redirecionar ao login | Client Component (já é) |
| `src/components/auth/ResetPasswordForm/ResetPasswordForm.tsx` | Editar: `resetPassword`, estados de erro e link inválido, redirecionar ao login com aviso | Client Component (já é) |
| `src/components/auth/LoginForm/LoginForm.tsx` | Editar: avisos `recuperacao=enviada` e `senha=alterada` | Client Component (já é) |
| `src/app/alterar-senha/page.tsx` | Editar: `referrer: "no-referrer"` no `metadata` | Server Component (já é) |
| `src/lib/mockApi.ts` | **Remover**: não restam usos depois da troca (só `mockRecoverPassword`/`mockResetPassword`) | — |

`src/proxy.ts` não muda: `/recuperar-senha` e `/alterar-senha` já são públicas. O link "Esqueci minha senha" do login já aponta para `/recuperar-senha`.

### Service (`src/lib/api/services/auth.ts`)
- `requestPasswordReset(email: string): Promise<void>`
  - `api.post("/autenticacao/esqueci-senha", { email: email.trim() })` (a `baseURL` já inclui `/api/v1`).
  - **E-mail não cadastrado:** um `ApiError` com `kind === "not_found"` (404) é relançado com a mensagem "E-mail não encontrado. Confira o endereço informado." (decisão de produto, revisando a premissa inicial de mensagem sempre igual). A tela a exibe como erro, mantendo o e-mail digitado. Os demais erros (rede, timeout, servidor, `validation`) propagam com a mensagem existente.
  - `unauthorized` nunca significa "sessão expirada" aqui (rota pública); se vier, é traduzido para a mensagem genérica de falha de servidor.
- `resetPassword({ token, senha }): Promise<void>` — **contrato assumido, ponto único de ajuste**
  - `api.post("/autenticacao/redefinir-senha", { token, novaSenha: senha })`.
  - O nome do endpoint e dos campos é uma suposição (o backend usa nomes em português, como `esqueci-senha`). Se o backend também exigir o e-mail ou a confirmação, só esta função, o tipo do argumento e o link do e-mail mudam.
  - Erros `not_found`, `validation`, `unauthorized` e `forbidden` (4xx) viram `ApiError("validation", ...)` preservando a mensagem do backend quando houver, e o formulário trata como "link inválido ou expirado" (ver abaixo). Rede, timeout e servidor passam como estão.
- Nenhuma função loga o e-mail, o token ou a senha; o `normalizeError` já descarta config e corpo da requisição.

### Formulários
- **`recoverPasswordSchema`:** `email: z.string().trim().min(1, "Informe o e-mail").refine(isValidEmail, "E-mail inválido")`, reaproveitando `isValidEmail` (`src/lib/email.ts`). `RecoverPasswordValues = { email: string }`.
- **`RecoverPasswordForm`:**
  - `useAppForm` com `defaultValues: { email: "" }` e o mesmo `validators.onChange` com `zodFieldErrors` dos demais.
  - Campo via `form.AppField name="email"` + `field.TextField` (`type="email"`, `inputMode="email"`, `autoComplete="email"`, desabilitado em `isPending`); o erro por campo já vem do `TextField` (mostrado após `isTouched`).
  - `useMutation({ mutationFn: ({ email }) => requestPasswordReset(email), onSuccess: () => router.push("/login?recuperacao=enviada") })`.
  - Botão desabilitado com `!isFormValid || isPending`; erro do envio em `Text variant="error" role="alert"`.
  - Remove o `Toast`/`useToast` e o `formatCPF` deste componente (o aviso agora é do login).
- **`resetPasswordSchema`:** `senha` com `.min(6, "A senha precisa ter ao menos 6 caracteres")` (**[A DEFINIR]** regra real; mesma da adesão), mantendo a confirmação.
- **`ResetPasswordForm`:**
  - Sem `token` (ausente na URL): card "Link inválido", como hoje.
  - `useMutation({ mutationFn: ({ senha }) => resetPassword({ token, senha }), onSuccess: () => router.push("/login?senha=alterada") })`.
  - Se `mutation.error` for um `ApiError` de 4xx (`validation`, `not_found`, `unauthorized`, `forbidden`), renderiza o mesmo card "Link inválido" com "Solicitar novo link" (RF-04: link vencido ou já usado). Outros erros aparecem em `Text variant="error" role="alert"` acima do botão, com campos preenchidos.
  - Limitação aceita: um 400 por senha fraca seria interpretado como link inválido enquanto o backend não distinguir os casos; documentado em Riscos.
- **`LoginForm`:** o `useEffect` que hoje lê só `cadastro=sucesso` passa a usar um mapa `parâmetro → mensagem` (`cadastro=sucesso`, `recuperacao=enviada`, `senha=alterada`) e mostra o `Toast` correspondente. Sem mudança visual além do texto.
- **Token no endereço:** `src/app/alterar-senha/page.tsx` exporta `metadata.referrer = "no-referrer"`, para o código do link não vazar por `Referer` a terceiros (o ViaCEP não é chamado nesta tela, mas a medida é barata).

### Server vs Client
Todas as peças alteradas já são Client Components (formulários, `useMutation`, `useSearchParams`); `page.tsx` de `/alterar-senha` continua Server Component e só passa o `token`. Schemas e services são módulos puros.

## Contrato assumido
| Item | Valor | Fonte |
|---|---|---|
| Solicitar recuperação | `POST /autenticacao/esqueci-senha` `{ email }` | `docs/specs/input.md` (confirmado) |
| Resposta de sucesso da solicitação | corpo ignorado | assumido |
| E-mail não cadastrado | responde 404; exibido como "E-mail não encontrado." | confirmado pelo pedido de produto |
| Redefinir senha | `POST /autenticacao/redefinir-senha` `{ token, novaSenha }` | **assumido, não informado** |
| Link do e-mail | `<origem do front>/alterar-senha?token=<código>` | **[A DEFINIR]** com o backend, por ambiente |
| Regra de senha | mínimo de 6 caracteres | **[A DEFINIR]** |

## Decisões técnicas e trade-offs
- **Reaproveitar `/recuperar-senha` em vez de criar rota nova:** o login e o proxy já a conhecem, e a decisão do PRD foi substituir a tela por CPF. Evita rota órfã e redirecionamentos.
- **Aviso no login por parâmetro de URL, sem tela de confirmação:** segue o padrão `?cadastro=sucesso` e atende "aviso e volta ao login" sem estado global. Custo: o aviso reaparece se a página for recarregada com o parâmetro (comportamento já existente para `cadastro`).
- **Exibir o 404 de `esqueci-senha` como "E-mail não encontrado":** ajuda o usuário a corrigir erro de digitação; troca a proteção contra enumeração de e-mails por clareza (decisão de produto). Alternativa descartada: mensagem sempre igual.
- **Contrato da redefinição isolado em `resetPassword`:** como o endpoint é suposição, concentrar nome, campos e a tradução de erros numa única função evita espalhar o palpite por componentes.
- **4xx na redefinição = link inválido:** sem formato de erro conhecido, é a leitura mais útil para o usuário (oferece novo link). Refinar quando o backend distinguir "senha fraca" de "token inválido".
- **Remover `mockApi.ts`:** deixa de ter usos; manter código morto esconderia fluxo simulado como se fosse real.
- **Sem `Toast` na própria tela de recuperação:** a confirmação aparece depois do redirecionamento, no login; a tela de recuperação só mostra erros.
- **Sem testes automatizados:** o projeto não tem runner; schemas e services ficam puros, e a verificação é manual (abaixo).

## Verificação
- `npm run lint` e `npm run build`.
- Manual no navegador (desktop e 375px, temas claro e escuro):
  1. Login → "Esqueci minha senha" abre `/recuperar-senha`; "Voltar ao login" retorna.
  2. Só existe o campo de e-mail; botão desabilitado com campo vazio e com e-mail inválido (`a@b`); erro "E-mail inválido" após tocar no campo; habilitado com e-mail válido.
  3. Envio com e-mail de teste: uma única requisição para `/autenticacao/esqueci-senha` com `{ email }`, botão "Enviando..." e redirecionamento para `/login?recuperacao=enviada` com o aviso visível.
  4. Duplo clique no botão: uma só requisição.
  5. Backend inacessível: mensagem de falha, e-mail mantido, reenvio possível.
  6. E-mail não cadastrado (404): aviso "E-mail não encontrado. Confira o endereço informado.", e-mail mantido no campo, sem redirecionamento.
  7. Link do e-mail (ou `/alterar-senha?token=abc`): campos de nova senha; confirmação diferente bloqueia; salvar válido chama o endpoint e vai para `/login?senha=alterada` com aviso.
  8. `/alterar-senha` sem token e com token recusado: card "Link inválido" com "Solicitar novo link".
  9. Nada de e-mail, token ou senha no console; o token não vai em `Referer`.
- **Atenção:** cada envio real dispara um e-mail de verdade. Usar um e-mail de teste do time, nunca o de um usuário real.

## Riscos / pontos de atenção
- **Contrato da redefinição desconhecido (alto):** endpoint, nomes dos campos e se exige o e-mail podem diferir. Não há como validar o `RF-04` sem esse contrato; obter antes de executar a task correspondente (as demais tasks não dependem dele).
- **Link do e-mail (alto):** o backend monta a URL; se apontar para outro domínio, caminho ou nome de parâmetro (`token`), a tela de alterar senha não abre. Alinhar por ambiente (hml, azl, prod).
- **Enumeração de e-mails:** o aviso revela quais e-mails têm conta. Aceito por decisão de produto; limite de tentativas depende do backend.
- **4xx genérico na redefinição:** senha fraca pode aparecer como "link inválido". Mitigado pela regra mínima no cliente; refinar com o formato de erro real.
- **CORS:** como nas demais chamadas, o backend precisa liberar a origem de cada ambiente (`POST` JSON dispara preflight) para essas duas rotas.
- **Token na URL:** fica no histórico do navegador e em logs de acesso; mitigado por `no-referrer` e uso único/expiração (responsabilidade do backend).
- **Limite de tentativas (spam de e-mails):** sem proteção no front; depende do backend.
- **E-mail pessoal real em `docs/specs/input.md`:** o exemplo do `curl` contém um endereço de pessoa; remover antes de compartilhar o repositório.
- **Alteração de comportamento:** quem usava o CPF na recuperação passa a precisar do e-mail cadastrado; comunicar a mudança.

## Fora de escopo técnico
- Reenvio do e-mail, contagem regressiva e limite de tentativas no front.
- Recuperação por CPF/SMS e troca de senha dentro da área logada.
- Tela intermediária de confirmação e limpeza do parâmetro de URL após exibir o aviso.
- Cookie `HttpOnly`, tratamento global de 401 e expiração de sessão.
- Testes automatizados (o projeto ainda não tem runner).
