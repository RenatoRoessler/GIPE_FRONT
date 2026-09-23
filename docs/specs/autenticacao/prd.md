# PRD: Autenticação

## Problema
O GIPE é um sistema de gestão para estacionamentos que só pode ser acessado por usuários autenticados. Hoje não existe fluxo de login, recuperação nem alteração de senha, o que impede qualquer controle de acesso ao sistema.

## Objetivo
Usuários cadastrados conseguem entrar no sistema com CPF e senha, recuperar o acesso quando esquecem a senha (via e-mail com link temporário) e definir uma nova senha de forma segura. Usuários não autenticados não acessam nenhuma outra área do sistema.

## Usuário-alvo
Qualquer usuário cadastrado no GIPE (administrador, caixa, manobrista, gerente) que precisa acessar o sistema no dia a dia, em desktop ou mobile.

## Requisitos funcionais

### Tela de login
- RF1: Campo para digitar CPF.
- RF2: Campo para digitar senha.
- RF3: Botão de login que autentica o usuário e redireciona para a área logada.
- RF4: Botão "recuperar senha" que leva à tela de solicitação de recuperação.
- RF5: Usuário não autenticado que tentar acessar qualquer rota do sistema é redirecionado para a tela de login.

### Tela de solicitação de recuperação de senha
- RF6: Campo para digitar CPF.
- RF7: Botão "recuperar senha" só fica habilitado depois que um CPF válido (formato/dígito verificador) é digitado.
- RF8: Ao clicar no botão, o sistema envia um e-mail com link de recuperação para o usuário dono do CPF.
- RF9: Após o clique, exibir um toast de sucesso informando que um e-mail foi enviado para recuperação.

### Tela de alteração de senha
- RF10: Acessada somente via link contendo um token temporário válido.
- RF11: Campo para nova senha.
- RF12: Campo para confirmar nova senha (deve ser igual ao campo de senha).
- RF13: Botão "alterar senha" que salva a nova senha.
- RF14: Após alterar a senha com sucesso, o usuário é redirecionado para a tela de login.
- RF15: Token expirado ou inválido impede a alteração e informa o usuário do problema.

## Fora de escopo
- Autenticação via redes sociais ou SSO.
- Autenticação em dois fatores (2FA).
- Bloqueio de conta por tentativas de login incorretas.
- Envio de e-mail em si (definição de provedor/infra de e-mail) — apenas o disparo funcional faz parte deste PRD.

## Critérios de aceite
- [ ] Usuário com CPF e senha corretos consegue logar e é redirecionado para a área logada.
- [ ] Usuário com CPF ou senha incorretos recebe mensagem de erro e permanece na tela de login.
- [ ] Usuário não autenticado é sempre redirecionado para o login ao tentar acessar qualquer outra tela.
- [ ] Botão de recuperar senha permanece desabilitado até um CPF válido ser digitado.
- [ ] Ao solicitar recuperação com CPF válido, um toast de sucesso é exibido e um e-mail é enviado.
- [ ] Link de recuperação com token válido abre a tela de alteração de senha.
- [ ] Link com token expirado/inválido não permite alterar a senha.
- [ ] Após alterar a senha com sucesso, o usuário é levado de volta à tela de login.
- [ ] Todas as telas funcionam de forma responsiva em desktop e mobile.

## Métricas de sucesso
- Taxa de sucesso de login (logins bem-sucedidos / tentativas) próxima de 100% para credenciais corretas.
- Redução de chamados de suporte para redefinição manual de senha após o fluxo de autorecuperação entrar em produção.
