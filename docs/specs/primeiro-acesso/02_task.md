# Task 02: Tela de primeiro acesso e rota pública

**Status:** ✅ Concluída  
**Dependências:** Task 01

## Objetivo

Entrega a tela `/primeiro-acesso` completa: formulário de nova senha, estados de erro e de prazo expirado, redirecionamento sem token e a rota liberada para quem ainda não tem sessão.

## Contexto Técnico

**Arquivos a criar:**
- `src/app/primeiro-acesso/page.tsx`
- `src/components/auth/PrimeiroAcessoForm/PrimeiroAcessoForm.tsx`
- `src/components/auth/PrimeiroAcessoForm/PrimeiroAcessoForm.test.tsx`
- `src/components/auth/PrimeiroAcessoForm/index.ts`

**Arquivos a editar:**
- `src/proxy.ts` — incluir `/primeiro-acesso` nas rotas públicas
- `src/proxy.test.ts` — caso da nova rota

## Critérios de Aceite

- [x] A página tem o título "Primeiro acesso — GIPE"
- [x] Sem token de troca em memória, nada do formulário é renderizado e o usuário é levado a `/login`
- [x] Com token: card "Crie sua senha", subtítulo do design, campos "Nova senha" e "Repetir senha" e o checklist `PasswordRequirements` padrão
- [x] O foco inicial vai para "Nova senha"
- [x] "Salvar nova senha" fica desabilitado até a senha cumprir todos os requisitos e a confirmação coincidir (usa `resetPasswordSchema`)
- [x] Durante o envio o botão mostra "Salvando..." e os campos ficam desabilitados
- [x] O envio limpa o cookie de sessão e chama `alterarSenha({ senhaAtual: <senha temporária>, novaSenha }, { bearerToken: <token de troca> })`
- [x] Nova senha igual à senha temporária é recusada na tela, sem chamar a API
- [x] Sucesso: limpa o token de troca e a senha lembrada e vai para `/login?senha=alterada`
- [x] Token expirado ou recusado (401, 403 ou 404): mostra "Não foi possível trocar a senha" com o aviso de prazo e o botão "Ir para o login", e limpa o token
- [x] Outros erros (400/422, rede, servidor): mensagem em `role="alert"`, campos preenchidos e botão disponível de novo
- [x] O texto de apoio "Depois de salvar, você volta ao login..." e o link "Voltar ao login" aparecem conforme o design
- [x] `/primeiro-acesso` abre sem cookie de sessão; as demais rotas protegidas continuam redirecionando
- [x] O token de troca nunca aparece na tela, na URL ou em atributos de acessibilidade

## Testes

- [x] Sem token redireciona para `/login` e não renderiza o formulário
- [x] Com token mostra o formulário e o checklist; botão desabilitado com senha fraca e com confirmação diferente
- [x] Sucesso limpa o token e navega para `/login?senha=alterada`
- [x] 401 mostra o estado de prazo expirado e limpa o token
- [x] 400 com mensagem do back fica no formulário com os valores preservados
- [x] Botão desabilitado e "Salvando..." durante o envio
- [x] `proxy.test.ts`: `/primeiro-acesso` abre sem sessão

## Notas de Implementação

Tech Spec, seções 3 e 4. O token é lido com `useSyncExternalStore` (snapshot de servidor `null`). Seguir o padrão de `ResetPasswordForm` e `src/app/alterar-senha/page.tsx` (`metadata`, `PageProps`); conferir `node_modules/next/dist/docs/` em caso de dúvida sobre a API desta versão do Next (ver `AGENTS.md`). Não alterar `ResetPasswordForm`.
