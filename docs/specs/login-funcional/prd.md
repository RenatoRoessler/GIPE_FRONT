# PRD: Login Funcional e Controle de Acesso

## Problema
Hoje a tela de login (`LoginForm`) é só front-end: o botão "Entrar" simula um loading com `setTimeout` e não verifica nada — qualquer CPF/senha "loga" sem checar credencial, sem gerar sessão e sem redirecionar. Além disso, nenhuma rota do sistema é protegida: dá para acessar a área logada (`/dashboard`, `/precos`, etc.) diretamente pela URL sem nunca ter passado pelo login.

## Objetivo
O login deve validar credenciais (via uma chamada mockada, simulando um backend futuro), mostrar loading enquanto "aguarda" essa resposta, guardar um token mockado ao autenticar com sucesso e redirecionar para o dashboard. Qualquer tentativa de acessar uma tela da área logada sem esse token deve ser bloqueada e redirecionada para o login.

## Usuário-alvo
Qualquer usuário do GIPE tentando entrar no sistema (tela de login) ou navegando diretamente para uma URL da área logada sem estar autenticado.

## Requisitos funcionais
- RF1: Ao submeter o formulário de login, o sistema deve simular uma chamada ao backend (mock, sem API real) para validar as credenciais.
- RF2: Enquanto a chamada mockada está em andamento, o formulário deve mostrar um estado de carregamento (o botão "Entrar" já reflete isso, ex.: label "Entrando...", desabilitado).
- RF3: A credencial válida do mock é fixa: CPF (campo já existente na tela) = `972.502.551-26` e senha = `123456`.
- RF4: Se a credencial informada for a válida (RF3), o mock deve retornar um token (também mockado) e o sistema deve salvá-lo (ex.: em armazenamento local do navegador).
- RF5: Com login bem-sucedido, o usuário deve ser redirecionado para o dashboard (`/dashboard`).
- RF6: Se a credencial informada for diferente da válida, o login deve falhar: sem salvar token, sem redirecionar, exibindo uma mensagem de erro na própria tela de login.
- RF7: Qualquer tentativa de acessar uma rota da área logada sem um token salvo deve ser bloqueada, redirecionando o usuário para a tela de login.
- RF8: Com um token salvo, o usuário deve conseguir acessar normalmente as rotas da área logada (sem ser redirecionado de volta ao login).
- RF9: A opção "Sair" do menu do usuário (header) deve remover o token salvo, além de navegar para fora da área logada — depois disso, o acesso volta a se comportar como não autenticado (RF7).

## Fora de escopo
- Chamada real a um backend/API de autenticação — tudo aqui é mockado.
- Cadastro de múltiplos usuários/credenciais — só a credencial fixa `972.502.551-26`/`123456` existe neste mock.
- Expiração de token, refresh token, ou qualquer lógica de validade temporal do token mockado.
- Logout real invalidando sessão em servidor (o botão "Sair" já existente no header continua sendo só navegação/local, conforme spec de estrutura do projeto logado).
- Alterar o campo de CPF para um campo genérico de usuário — ele continua sendo o mesmo campo, validando/formatando CPF normalmente; o valor aceito no mock é apenas um CPF fixo específico (RF3).
- Recuperação/alteração de senha (já coberto por specs próprias) — não é afetado por esta feature.

## Critérios de aceite
- [ ] Ao digitar CPF `972.502.551-26` e senha `123456` e clicar em "Entrar", o botão mostra estado de carregamento e, em seguida, o usuário é redirecionado para `/dashboard`.
- [ ] Após o login bem-sucedido, um token mockado fica salvo (persistindo ao menos durante a sessão do navegador).
- [ ] Ao digitar uma credencial diferente de `972.502.551-26`/`123456` e clicar em "Entrar", o sistema exibe uma mensagem de erro na tela de login, sem redirecionar e sem salvar token.
- [ ] Acessar diretamente uma URL da área logada (ex.: `/dashboard`, `/precos`) sem ter feito login antes redireciona para a tela de login.
- [ ] Após logar com sucesso, acessar as URLs da área logada funciona normalmente, sem redirecionar de volta ao login.
- [ ] Usar a opção "Sair" do header (spec de estrutura do projeto logado) remove o acesso — tentar voltar a uma URL da área logada depois disso redireciona novamente para o login.

## Métricas de sucesso
Não aplicável nesta fase (mock interno, sem usuários reais medindo sucesso ainda).
