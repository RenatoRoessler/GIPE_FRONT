# PRD: Integração do Login com o Backend

## Problema
A tela de login hoje valida contra uma credencial fixa simulada (um único CPF e uma única senha) e gera um token falso. Nenhum usuário real cadastrado, como o titular criado pela adesão, consegue entrar no sistema. Isso impede que o fluxo de cadastro (adesão) termine em acesso de fato.

## Objetivo
Quem tem cadastro válido no sistema consegue entrar na área logada usando CPF e senha reais, validados pelo backend. Credenciais inválidas e falhas de comunicação são informadas com mensagem clara, sem entrar no sistema.

## Usuário-alvo
Qualquer usuário cadastrado no GIPE (a começar pelo titular criado na adesão) acessando a tela de login, em desktop ou celular.

## Premissas
- O backend expõe a autenticação por `POST /autenticacao/login`, recebendo `login` e `senha`. No exemplo recebido, `login` é o CPF só com dígitos. **[CONFIRMAR]**
- O formato da resposta (onde vem o token, se há dados do usuário, expiração) e o formato de erro ainda não são conhecidos. **[A DEFINIR]** com o time de backend; os requisitos abaixo não dependem desses detalhes.
- A comunicação com o backend segue a camada já existente (`docs/specs/integracao-backend`).

## Requisitos funcionais
- RF1: Ao enviar o formulário com CPF e senha válidos em formato, o sistema autentica no backend com esses dados.
- RF2: Enquanto a autenticação está em andamento, o formulário indica progresso e impede envio duplicado.
- RF3: Em caso de sucesso, o usuário passa a ter sessão e é levado à home da área logada.
- RF4: Se o backend recusar as credenciais, o usuário vê mensagem clara na própria tela de login, continua sem sessão e mantém o CPF digitado.
- RF5: Se houver falha de rede, tempo esgotado ou erro do servidor, o usuário vê mensagem compreensível em português e pode tentar de novo sem redigitar o CPF.
- RF6: A senha nunca é exibida em mensagens de erro nem registrada em log.
- RF7: O CPF continua com máscara na tela e validação de formato antes do envio; o valor enviado ao backend segue o formato aceito por ele. **[A DEFINIR]** (exemplo recebido: só dígitos).
- RF8: A credencial fixa simulada deixa de ser aceita.
- RF9: O aviso de cadastro concluído (vindo da adesão) e os links de recuperação de senha continuam funcionando como hoje.
- RF10: Quem já tem sessão e abre uma rota logada continua acessando normalmente; quem não tem sessão continua sendo levado ao login.
- RF11: "Sair" no menu do usuário encerra a sessão local, como hoje.

## Fora de escopo
- Recuperação e redefinição de senha integradas ao backend.
- Expiração de sessão, renovação de token e tratamento de sessão expirada em chamadas autenticadas (a definir após conhecer a resposta do backend).
- Troca obrigatória de senha no primeiro acesso, caso o backend a exija. **[A DEFINIR]**
- Bloqueio por tentativas, captcha e autenticação em dois fatores.
- Exibição de dados do usuário logado (nome, perfil) e controle de permissões por perfil.
- Logout invalidando a sessão no servidor.
- Login por outro identificador além do CPF.

## Critérios de aceite
- [ ] Dado um usuário cadastrado, quando informo CPF e senha corretos, então entro e chego à home da área logada.
- [ ] Dado CPF ou senha incorretos, quando envio, então vejo mensagem de credenciais inválidas na tela de login, sem sessão e com o CPF mantido.
- [ ] Dado que o servidor está fora do ar ou sem conexão, quando envio, então vejo mensagem compreensível e posso tentar de novo sem redigitar o CPF.
- [ ] Dado que a autenticação está em andamento, então o botão indica progresso e não permite um segundo envio.
- [ ] Dado CPF em formato inválido ou campo vazio, então a mensagem aparece no campo e nenhuma chamada é feita ao backend.
- [ ] Dado o CPF e a senha da credencial simulada antiga, quando não existirem no backend, então o login é recusado.
- [ ] Dado que concluí a adesão, quando entro na tela de login, então o aviso de cadastro concluído aparece e consigo entrar com o titular criado.
- [ ] Dado que estou sem sessão, quando abro uma rota logada, então sou levado ao login; com sessão, a rota abre normalmente.
- [ ] Dado que clico em "Sair", então a sessão local é encerrada e o acesso volta a exigir login.
- [ ] A senha não aparece em nenhuma mensagem de erro nem em log.

## Métricas de sucesso (se aplicável)
- 100% dos usuários cadastrados no backend conseguem entrar com suas credenciais.
- Titular criado na adesão consegue entrar sem intervenção manual.
- Todos os tipos de falha (credencial, rede, tempo esgotado, servidor) exibem mensagem compreensível.

## Pontos em aberto
- **[A DEFINIR]** formato da resposta de sucesso e de erro do endpoint de login.
- **[A DEFINIR]** formato do CPF enviado (com ou sem máscara) e regra de senha.
- **[A DEFINIR]** se há senha provisória com troca obrigatória no primeiro acesso (a senha do exemplo recebido sugere isso).
- **[A DEFINIR]** tratamento de sessão expirada e comportamento do "Sair" além do local.
- **Risco:** o backend usa HTTP sem criptografia e a senha passaria por esse canal; HTTPS é recomendado antes de produção (mesmo risco já registrado na adesão).
