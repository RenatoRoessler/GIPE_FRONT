# Tasks: Recuperação de Senha por E-mail

Referências: ./prd.md, ./techspec.md

- [x] T1 — Trocar o CPF pelo e-mail no schema de recuperação
  - Arquivos: `src/lib/schemas/recoverPassword.ts`
  - Pronto quando: `recoverPasswordSchema` valida `email` (trim, "Informe o e-mail" para vazio, "E-mail inválido" via `isValidEmail`); `RecoverPasswordValues = { email: string }`; não há mais referência a CPF no arquivo.

- [x] T2 — Exigir tamanho mínimo da nova senha no schema de redefinição
  - Arquivos: `src/lib/schemas/resetPassword.ts`
  - Pronto quando: `senha` recusa menos de 6 caracteres com "A senha precisa ter ao menos 6 caracteres", a confirmação continua exigida e a regra "As senhas não coincidem" segue igual.

- [x] T3 — Criar a chamada de solicitação de recuperação no service de autenticação
  - Arquivos: `src/lib/api/services/auth.ts`
  - Pronto quando: `requestPasswordReset(email)` faz `POST /autenticacao/esqueci-senha` com `{ email }` (e-mail com trim); um `ApiError` `not_found` (404) é relançado com a mensagem "E-mail não encontrado. Confira o endereço informado." para a tela exibir; `unauthorized` vira a mensagem genérica de falha de servidor; demais erros propagam como `ApiError`; nenhum dado sensível é logado; typecheck e lint passam.

- [ ] T4 — Criar a chamada de redefinição de senha no service de autenticação
  - Arquivos: `src/lib/api/services/auth.ts`
  - Pronto quando: `resetPassword({ token, senha })` faz `POST /autenticacao/redefinir-senha` com `{ token, novaSenha }` (contrato assumido, comentado como ponto único de ajuste); erros 4xx (`not_found`, `validation`, `unauthorized`, `forbidden`) viram `ApiError("validation", ...)` preservando a mensagem do backend; rede, timeout e servidor passam como estão; nada sensível é logado. **Depende do contrato real:** conferir o endpoint e os campos com o backend antes de dar a task como concluída. **Status: implementada com o contrato assumido; falta confirmar com o backend, por isso segue pendente.**

- [x] T5 — Reescrever o `RecoverPasswordForm` para pedir e-mail
  - Arquivos: `src/components/auth/RecoverPasswordForm/RecoverPasswordForm.tsx`
  - Pronto quando: a tela tem somente o campo "E-mail" (`type="email"`, `autoComplete="email"`), o botão "Recuperar minha senha" e o link "Voltar ao login"; subtítulo pede o e-mail cadastrado; botão desabilitado com e-mail vazio/inválido e durante o envio ("Enviando..."); erro de campo após tocar; envio chama `requestPasswordReset` e, no sucesso, leva a `/login?recuperacao=enviada`; falha de comunicação mostra mensagem com `role="alert"` mantendo o e-mail; não há mais `Toast`, `useToast`, `formatCPF` nem `mockRecoverPassword` no componente.

- [x] T6 — Integrar o `ResetPasswordForm` ao backend e tratar link inválido
  - Arquivos: `src/components/auth/ResetPasswordForm/ResetPasswordForm.tsx`
  - Pronto quando: o envio chama `resetPassword({ token, senha })` e, no sucesso, leva a `/login?senha=alterada`; sem `token` ou com erro 4xx da redefinição mostra o card "Link inválido" com "Solicitar novo link"; erros de rede/servidor aparecem com `role="alert"` mantendo os campos; controles ficam desabilitados durante o envio; não há mais `mockResetPassword`.

- [x] T7 — Mostrar os avisos de recuperação no login
  - Arquivos: `src/components/auth/LoginForm/LoginForm.tsx`
  - Pronto quando: um mapa de parâmetros de URL para mensagens exibe o `Toast` de sucesso para `cadastro=sucesso` (texto atual), `recuperacao=enviada` ("Enviamos as instruções de recuperação para o seu e-mail.") e `senha=alterada` ("Senha alterada! Faça login com a nova senha."); sem parâmetro não aparece aviso; o restante do login não muda.

- [x] T8 — Impedir vazamento do token do link por `Referer`
  - Arquivos: `src/app/alterar-senha/page.tsx`
  - Pronto quando: o `metadata` da página exporta `referrer: "no-referrer"` e o título continua "Alterar senha — GIPE"; o HTML da página traz `<meta name="referrer" content="no-referrer">`.

- [x] T9 — Remover o mock de API que deixou de ser usado
  - Arquivos: `src/lib/mockApi.ts`
  - Pronto quando: uma busca por `mockApi` e `mockRecoverPassword`/`mockResetPassword` em `src` não encontra nenhum uso; o arquivo foi apagado; typecheck, lint e build passam.

- [ ] T10 — Verificação final
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam; no navegador (desktop e 375px, temas claro e escuro) valem os itens do roteiro "Verificação" do techspec: acesso pelo "Esqueci minha senha", só o campo de e-mail, botão desabilitado/habilitado conforme a validação, envio único (duplo clique), redirecionamento ao login com aviso, falha de comunicação mantendo o e-mail, link inválido com "Solicitar novo link", alteração de senha com aviso no login e nenhum e-mail/token/senha no console. Os testes de envio real disparam e-mail de verdade: usar e-mail de teste do time. Pendentes fora do código: contrato real da redefinição (T4) e o endereço do link do e-mail em cada ambiente.
