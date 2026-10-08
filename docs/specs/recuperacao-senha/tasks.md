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

- [x] T4 — Criar a chamada de redefinição de senha no service de autenticação
  - Arquivos: `src/lib/api/services/auth.ts`
  - Pronto quando: `resetPassword({ token, senha })` faz `POST /autenticacao/redefinir-senha` com `{ token, novaSenha }` (contrato assumido, comentado como ponto único de ajuste); erros 4xx (`not_found`, `validation`, `unauthorized`, `forbidden`) viram `ApiError("validation", ...)` preservando a mensagem do backend; rede, timeout e servidor passam como estão; nada sensível é logado. **Depende do contrato real:** conferir o endpoint e os campos com o backend antes de dar a task como concluída. **Contrato confirmado em `docs/specs/input.md`; a normalização de erros foi removida na T14.**

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

- [x] T11 — Criar as regras de senha forte
  - Arquivos: `src/lib/password.ts`
  - Pronto quando: exporta `PASSWORD_RULES` (8+ caracteres, maiúscula `\p{Lu}`, minúscula `\p{Ll}`, número `\p{N}`, símbolo `[^\p{L}\p{N}\s]`, cada uma com `label` e `missingLabel`), `getPasswordRuleResults(value)`, `getMissingPasswordRules(value)` e `isStrongPassword(value)`; módulo puro, sem dependências; um script rápido confirma que `abc` cumpre só a regra de minúscula, que `Abcdef1!` cumpre as cinco, que espaço não conta como símbolo e que `NovaSenha@123` é forte; typecheck e lint passam.

- [x] T12 — Exigir senha forte no schema de redefinição
  - Arquivos: `src/lib/schemas/resetPassword.ts`
  - Pronto quando: `senha` vazia retorna "Informe a nova senha"; senha fraca retorna `Falta: <lista do que falta>` (ex.: `Falta: uma letra maiúscula, um número`); a confirmação segue obrigatória e diferente da senha retorna "As senhas não coincidem"; o mínimo de 6 caracteres da T2 deixa de existir. Depende da T11.

- [x] T13 — Criar o componente `PasswordRequirements`
  - Arquivos: `src/components/ui/PasswordRequirements/{PasswordRequirements.tsx,PasswordRequirements.styles.ts,index.ts}`
  - Pronto quando: recebe `value: string` e lista os requisitos de `PASSWORD_RULES` em um `ul`, cada item com marcador, texto e texto oculto "cumprida" ou "pendente" (o estado nunca depende só de cor); cumprido usa `colors.success`, pendente usa `colors.textMuted`; sem `aria-live`; só tokens do tema, legível nos temas claro e escuro; typecheck e lint passam. Depende da T11.

- [x] T14 — Propagar os erros da redefinição sem normalizá-los no service
  - Arquivos: `src/lib/api/services/auth.ts`
  - Pronto quando: `resetPassword` envia `{ token, novaSenha }` (sem a confirmação) e deixa o `ApiError` subir sem converter os 4xx em `validation`; `INVALID_LINK_KINDS` é removido; nada sensível é logado. Com isso a T4 passa a estar concluída (contrato confirmado em `docs/specs/input.md`); marcar a T4 como `[x]` ao validar esta.

- [x] T15 — Completar a tela de alterar senha
  - Arquivos: `src/components/auth/ResetPasswordForm/ResetPasswordForm.tsx`
  - Pronto quando: campos "Nova senha" e "Repetir senha" (`autoComplete="new-password"`), com `PasswordRequirements` logo abaixo do primeiro, lendo o valor com `useStore`; o botão "Alterar senha" só fica habilitado quando `resetPasswordSchema.safeParse(values).success` e não há envio em andamento (desabilitado com o formulário vazio); o corpo enviado ao backend não inclui a repetição; `not_found`, `unauthorized` e `forbidden` mostram o card "Link inválido" com "Solicitar novo link"; `validation` mostra a mensagem do backend com `role="alert"`, mantém os campos e deixa o link "Solicitar novo link" no rodapé; rede, timeout e servidor mostram a mensagem com `role="alert"` mantendo os campos; sucesso leva a `/login?senha=alterada`. Depende de T12, T13 e T14.

- [x] T16 — Calcular a validade do botão da tela de recuperação pelo schema
  - Arquivos: `src/components/auth/RecoverPasswordForm/RecoverPasswordForm.tsx`
  - Pronto quando: o botão "Recuperar minha senha" fica desabilitado com o e-mail vazio (inclusive antes de digitar) e com e-mail inválido, e habilitado com e-mail válido, usando `recoverPasswordSchema.safeParse(values).success` em vez de `isFormValid`; continua desabilitado durante o envio.

- [ ] T10 — Verificação final
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam; no navegador (desktop e 375px, temas claro e escuro) valem os itens do roteiro "Verificação" do techspec: acesso pelo "Esqueci minha senha", só o campo de e-mail, botão desabilitado/habilitado conforme a validação, envio único (duplo clique), redirecionamento ao login com aviso, falha de comunicação mantendo o e-mail, link inválido com "Solicitar novo link", alteração de senha com aviso no login e nenhum e-mail/token/senha no console. Os testes de envio real disparam e-mail de verdade: usar e-mail de teste do time. Também conferir: o checklist de senha marca os requisitos ao digitar (`abc` marca só minúscula; `Abcdef1!` marca os cinco) e o botão "Alterar senha" fica desabilitado com o formulário vazio; a repetição diferente mostra "As senhas não coincidem"; o envio da redefinição leva só `token` e `novaSenha`; o botão "Recuperar minha senha" fica desabilitado com o e-mail vazio; token recusado (404/401/403) mostra o card "Link inválido" e recusa 400/422 mostra a mensagem do backend com o link para novo pedido. Pendentes fora do código: o endereço do link do e-mail em cada ambiente, os status reais de erro da redefinição e a política de senha do backend. Depende de T11 a T16.
