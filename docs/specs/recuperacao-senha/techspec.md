# Tech Spec: Recuperação de Senha por E-mail

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (via skill claude-design; as telas já existem e só mudam o campo e o comportamento, então não há `design.md` separado)
- Camada de comunicação: `docs/INTEGRACAO-BACKEND.md` (`src/lib/api`)
- Padrão seguido: `docs/specs/integracao-login/techspec.md` (service em `src/lib/api/services/auth.ts`, `useMutation` no formulário, aviso por parâmetro de URL)
- Contrato confirmado (`docs/specs/input.md`): `POST /autenticacao/esqueci-senha` com `{ "email": "..." }` e `POST /autenticacao/redefinir-senha` com `{ "token": "...", "novaSenha": "..." }`; o código do link vem no parâmetro `token` da URL.

## Design
- **Telas/estados**
  - `/recuperar-senha`: card de autenticação com título "Recuperar senha", subtítulo "Informe o e-mail cadastrado para receber as instruções de recuperação.", **um campo "E-mail"**, botão "Recuperar minha senha" e link "Voltar ao login".
    - *Padrão*: botão desabilitado enquanto o e-mail estiver vazio ou inválido.
    - *Erro de campo*: "E-mail inválido" / "Informe o e-mail" abaixo do campo, depois de o campo ser tocado.
    - *Enviando*: campo e botão desabilitados, botão "Enviando...".
    - *Falha de comunicação*: mensagem em `Text variant="error"` com `role="alert"`; e-mail mantido; reenvio possível.
    - *Sucesso*: redireciona para `/login?recuperacao=enviada` (sem tela intermediária).
  - `/login`: ganha dois avisos em `Toast`, acionados por parâmetro de URL (mesmo padrão do `?cadastro=sucesso`): `recuperacao=enviada` ("Enviamos as instruções de recuperação para o seu e-mail.") e `senha=alterada` ("Senha alterada! Faça login com a nova senha.").
  - `/alterar-senha`: campos "Nova senha" e "Repetir senha" (a confirmação serve só para conferência). Logo abaixo de "Nova senha", o **checklist de requisitos** (mínimo de 8 caracteres, letra maiúscula, letra minúscula, número, símbolo): cada item mostra marcador e texto, com "cumprida"/"pendente" também em texto para leitores de tela (nunca só cor). *Botão*: "Alterar senha" fica desabilitado enquanto a senha não cumprir todos os requisitos ou a repetição for diferente. *Erro de campo*: "Falta: uma letra maiúscula, um número" (lista só o que falta) e "As senhas não coincidem", após o campo ser tocado. *Link inválido* (sem token, ou 401/403/404 do backend): card "Link inválido" com a mensagem e "Solicitar novo link". *Recusa 400/422 do backend* (inclusive senha fora da política dele ou código inválido): mensagem do backend em `role="alert"`, campos mantidos e o link "Solicitar novo link" sempre disponível no rodapé do card. *Falha de comunicação*: mensagem `role="alert"` mantendo os campos.
- **Componentes do design system reaproveitados:** `AuthCard`, `Footer`, `Form`, `Button`, `Link`, `Text`, `Toast`, `TextField`/`useAppForm`.
- **Componente novo:** `PasswordRequirements` em `src/components/ui/PasswordRequirements/` (lista de requisitos de senha com estado cumprida/pendente; reutilizável pela adesão no futuro).
- **Tokens de tema:** nenhum novo. Requisito cumprido usa `colors.success`; pendente usa `colors.textMuted`; texto em `colors.text`; espaçamentos `space[*]`; tamanhos `fontSizes.sm`/`xs`.

## Arquitetura da solução

### Arquivos
| Arquivo | Ação | Tipo |
|---|---|---|
| `src/lib/api/services/auth.ts` | Editar: adicionar `requestPasswordReset(email)` e `resetPassword({ token, senha })` (sem normalizar os erros 4xx) | módulo (client) |
| `src/lib/schemas/recoverPassword.ts` | Editar: trocar `cpf` por `email` | módulo |
| `src/lib/password.ts` | **Novo**: regras de senha forte (`PASSWORD_RULES`, `getPasswordRuleResults`, `getMissingPasswordRules`, `isStrongPassword`) | módulo puro |
| `src/lib/schemas/resetPassword.ts` | Editar: exigir senha forte com mensagem do que falta | módulo |
| `src/components/ui/PasswordRequirements/{PasswordRequirements.tsx,PasswordRequirements.styles.ts,index.ts}` | **Novo**: checklist de requisitos | Client Component |
| `src/components/auth/RecoverPasswordForm/RecoverPasswordForm.tsx` | Editar: campo de e-mail, `requestPasswordReset`, redirecionar ao login; botão habilitado por validade calculada dos valores | Client Component (já é) |
| `src/components/auth/ResetPasswordForm/ResetPasswordForm.tsx` | Editar: `resetPassword`, checklist, botão por validade, estados de erro e link inválido, redirecionar ao login com aviso | Client Component (já é) |
| `src/components/auth/LoginForm/LoginForm.tsx` | Editar: avisos `recuperacao=enviada` e `senha=alterada` | Client Component (já é) |
| `src/app/alterar-senha/page.tsx` | Editar: `referrer: "no-referrer"` no `metadata` | Server Component (já é) |
| `src/lib/mockApi.ts` | **Remover**: não restam usos depois da troca (só `mockRecoverPassword`/`mockResetPassword`) | — |

`src/proxy.ts` não muda: `/recuperar-senha` e `/alterar-senha` já são públicas. O link "Esqueci minha senha" do login já aponta para `/recuperar-senha`.

### Service (`src/lib/api/services/auth.ts`)
- `requestPasswordReset(email: string): Promise<void>`
  - `api.post("/autenticacao/esqueci-senha", { email: email.trim() })` (a `baseURL` já inclui `/api/v1`).
  - **E-mail não cadastrado:** um `ApiError` com `kind === "not_found"` (404) é relançado com a mensagem "E-mail não encontrado. Confira o endereço informado." (decisão de produto, revisando a premissa inicial de mensagem sempre igual). A tela a exibe como erro, mantendo o e-mail digitado. Os demais erros (rede, timeout, servidor, `validation`) propagam com a mensagem existente.
  - `unauthorized` nunca significa "sessão expirada" aqui (rota pública); se vier, é traduzido para a mensagem genérica de falha de servidor.
- `resetPassword({ token, senha }): Promise<void>` — **contrato confirmado**
  - `api.post("/autenticacao/redefinir-senha", { token, novaSenha: senha })`. A confirmação de senha não é enviada.
  - O token é um código opaco longo; vai no corpo, nunca em URL de requisição nem em log.
  - Os erros propagam como `ApiError` sem normalização; quem decide o que mostrar é o formulário pelo `kind` (ver abaixo). O trecho anterior que convertia todo 4xx em `validation` é removido.
- Nenhuma função loga o e-mail, o token ou a senha; o `normalizeError` já descarta config e corpo da requisição.

### Formulários
- **`recoverPasswordSchema`:** `email: z.string().trim().min(1, "Informe o e-mail").refine(isValidEmail, "E-mail inválido")`, reaproveitando `isValidEmail` (`src/lib/email.ts`). `RecoverPasswordValues = { email: string }`.
- **`RecoverPasswordForm`:**
  - `useAppForm` com `defaultValues: { email: "" }` e o mesmo `validators.onChange` com `zodFieldErrors` dos demais.
  - Campo via `form.AppField name="email"` + `field.TextField` (`type="email"`, `inputMode="email"`, `autoComplete="email"`, desabilitado em `isPending`); o erro por campo já vem do `TextField` (mostrado após `isTouched`).
  - `useMutation({ mutationFn: ({ email }) => requestPasswordReset(email), onSuccess: () => router.push("/login?recuperacao=enviada") })`.
  - Botão habilitado só se `recoverPasswordSchema.safeParse(values).success` (selector do `useStore`) e sem envio em andamento; `isFormValid` não serve porque é verdadeiro antes de qualquer digitação, o que deixaria o botão ativo com o campo vazio. Erro do envio em `Text variant="error" role="alert"`.
  - Remove o `Toast`/`useToast` e o `formatCPF` deste componente (o aviso agora é do login).
- **Regras de senha (`src/lib/password.ts`):** `PASSWORD_RULES` com `id`, `label` (para o checklist), `missingLabel` (para a mensagem de erro) e `test(value)`: tamanho `>= 8`; maiúscula `/\p{Lu}/u`; minúscula `/\p{Ll}/u`; número `/\p{N}/u`; símbolo `/[^\p{L}\p{N}\s]/u` (espaço não conta como símbolo). `getPasswordRuleResults(value)` devolve `{ id, label, met }[]`; `getMissingPasswordRules(value)` devolve os `missingLabel` pendentes; `isStrongPassword(value)` é verdadeiro quando todas passam. Sem teto de tamanho (o backend não informou).
- **`resetPasswordSchema`:** `senha` com `.min(1, "Informe a nova senha")` e `superRefine` que, se faltar algo, emite `Falta: <lista>` (ex.: `Falta: uma letra maiúscula, um número`); `confirmarSenha` obrigatória e igual à senha ("As senhas não coincidem"). Substitui o mínimo de 6.
- **`PasswordRequirements`:** recebe `value: string` e renderiza `<ul>` com um item por regra (marcador + `label` + texto oculto "cumprida"/"pendente"). Não usa `aria-live` (evita anunciar a cada tecla); o erro de campo continua sendo o canal de aviso ao enviar. Estilos com styled-components e tokens do tema.
- **`ResetPasswordForm`:**
  - Sem `token` (ausente na URL): card "Link inválido", como hoje.
  - `useMutation({ mutationFn: ({ senha }) => resetPassword({ token, senha }), onSuccess: () => router.push("/login?senha=alterada") })`.
  - Campos: "Nova senha" (`autoComplete="new-password"`) seguido de `<PasswordRequirements value={senha} />` (valor lido com `useStore(form.store, s => s.values.senha)`) e "Repetir senha".
  - Botão: habilitado apenas se `resetPasswordSchema.safeParse(values).success` (selector do `useStore`) e não houver envio em andamento. Usa a validade calculada dos valores, e não `isFormValid`, porque este é verdadeiro antes de qualquer digitação.
  - Erros pelo `kind` do `ApiError`: `not_found`, `unauthorized`, `forbidden` (404/401/403) renderizam o card "Link inválido" com "Solicitar novo link"; `validation` (400/422) mostra a mensagem do backend em `Text variant="error" role="alert"` mantendo os campos, com o link "Solicitar novo link" no rodapé; rede, timeout e servidor mostram a mensagem em `role="alert"` mantendo os campos.
  - Limitação aceita: se o backend usar 400 tanto para código vencido quanto para senha fora da política, a mensagem dele é o que explica o caso; o link para novo pedido sempre fica à mão.
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
| Redefinir senha | `POST /autenticacao/redefinir-senha` `{ token, novaSenha }` | `docs/specs/input.md` (confirmado) |
| Link do e-mail | `<origem do front>/alterar-senha?token=<código>` (o parâmetro `token` está confirmado; a origem por ambiente fica **[A DEFINIR]** com o backend) | `docs/specs/input.md` |
| Regra de senha | 8+ caracteres, maiúscula, minúscula, número e símbolo (decisão de produto; exemplo do backend: `NovaSenha@123`) | PRD; **[A DEFINIR]** se a política do backend é mais rígida |
| Resposta de sucesso da redefinição | corpo ignorado | assumido |
| Erro de código inválido ou vencido | status não informado; 401/403/404 = link inválido, 400/422 = mensagem do backend | **[A DEFINIR]** |

## Decisões técnicas e trade-offs
- **Reaproveitar `/recuperar-senha` em vez de criar rota nova:** o login e o proxy já a conhecem, e a decisão do PRD foi substituir a tela por CPF. Evita rota órfã e redirecionamentos.
- **Aviso no login por parâmetro de URL, sem tela de confirmação:** segue o padrão `?cadastro=sucesso` e atende "aviso e volta ao login" sem estado global. Custo: o aviso reaparece se a página for recarregada com o parâmetro (comportamento já existente para `cadastro`).
- **Exibir o 404 de `esqueci-senha` como "E-mail não encontrado":** ajuda o usuário a corrigir erro de digitação; troca a proteção contra enumeração de e-mails por clareza (decisão de produto). Alternativa descartada: mensagem sempre igual.
- **Contrato da redefinição isolado em `resetPassword`:** concentra endpoint, campos e tratamento de erro numa função; o contrato já foi confirmado, mas o isolamento continua útil para futuras mudanças.
- **Decidir o erro da redefinição pelo `kind`, não normalizar no service:** 401/403/404 indicam link inválido (card próprio); 400/422 mostram a mensagem do backend com o link para novo pedido. É a leitura que atende ao PRD (mensagem do backend em recusa de senha) sem esconder o caso de código vencido.
- **Regra de senha em módulo próprio (`src/lib/password.ts`):** o schema, o checklist e (no futuro) a adesão consomem a mesma fonte, evitando regras divergentes. A adesão não muda nesta entrega (hoje mínimo de 6 caracteres): fica anotada como inconsistência.
- **Checklist sem `aria-live`:** anunciar cada requisito a cada tecla seria ruidoso; a mensagem de erro do campo e o botão desabilitado cobrem o aviso.
- **Botão por validade calculada:** `isFormValid` do TanStack Form é verdadeiro antes de qualquer validação; calcular pelo schema garante o botão desabilitado com o formulário vazio (PRD RF-02 e RF-04).
- **Remover `mockApi.ts`:** deixa de ter usos; manter código morto esconderia fluxo simulado como se fosse real.
- **Sem `Toast` na própria tela de recuperação:** a confirmação aparece depois do redirecionamento, no login; a tela de recuperação só mostra erros.
- **Sem testes automatizados:** o projeto não tem runner; schemas e services ficam puros, e a verificação é manual (abaixo).

## Verificação
- `npm run lint` e `npm run build`.
- Manual no navegador (desktop e 375px, temas claro e escuro):
  1. Login → "Esqueci minha senha" abre `/recuperar-senha`; "Voltar ao login" retorna.
  2. Só existe o campo de e-mail; botão desabilitado com o campo vazio (inclusive antes de digitar) e com e-mail inválido (`a@b`); erro "E-mail inválido" após tocar no campo; habilitado com e-mail válido.
  3. Envio com e-mail de teste: uma única requisição para `/autenticacao/esqueci-senha` com `{ email }`, botão "Enviando..." e redirecionamento para `/login?recuperacao=enviada` com o aviso visível.
  4. Duplo clique no botão: uma só requisição.
  5. Backend inacessível: mensagem de falha, e-mail mantido, reenvio possível.
  6. E-mail não cadastrado (404): aviso "E-mail não encontrado. Confira o endereço informado.", e-mail mantido no campo, sem redirecionamento.
  7. Link do e-mail (ou `/alterar-senha?token=abc`): campos "Nova senha" e "Repetir senha" com o checklist logo abaixo; botão desabilitado com o formulário vazio; digitar `abc` marca só "minúscula"; `Abcdef1!` marca os cinco requisitos e habilita o botão; repetição diferente mantém o botão desabilitado e mostra "As senhas não coincidem"; salvar válido envia só `{ token, novaSenha }` (sem a repetição) e vai para `/login?senha=alterada` com aviso.
  8. `/alterar-senha` sem token e com token recusado (404/401/403): card "Link inválido" com "Solicitar novo link"; recusa 400/422: mensagem do backend, campos mantidos e link para novo pedido.
  9. Nada de e-mail, token ou senha no console; o token não vai em `Referer`.
- **Atenção:** cada envio real dispara um e-mail de verdade. Usar um e-mail de teste do time, nunca o de um usuário real.

## Riscos / pontos de atenção
- **Status de erro do backend para token inválido (médio):** o status e o corpo de erro da redefinição não foram informados; a divisão 401/403/404 versus 400/422 é uma premissa. Testar com um token inválido e com uma senha recusada e ajustar a decisão por `kind` no formulário.
- **Link do e-mail (alto):** o backend monta a URL; se apontar para outro domínio, caminho ou nome de parâmetro (`token`), a tela de alterar senha não abre. Alinhar por ambiente (hml, azl, prod).
- **Enumeração de e-mails:** o aviso revela quais e-mails têm conta. Aceito por decisão de produto; limite de tentativas depende do backend.
- **Política de senha do backend (médio):** pode exigir mais que a tela (ou rejeitar símbolos específicos). A tela exibe a mensagem do backend nesse caso; alinhar a regra final com o time de backend.
- **Token real em `docs/specs/input.md` (alto):** o arquivo contém um código de redefinição de exemplo; invalidar e remover antes de compartilhar o repositório.
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
