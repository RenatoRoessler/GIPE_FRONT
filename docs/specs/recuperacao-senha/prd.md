# PRD: Recuperação de Senha por E-mail

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-10-08
**Versão:** 1.0

---

## 1. Objetivo

Permitir que um usuário que esqueceu a senha recupere o acesso sozinho: informa o e-mail cadastrado, recebe as instruções por e-mail e define uma nova senha. O valor para o usuário é voltar a usar o sistema sem depender de suporte; para o negócio, menos chamados de redefinição manual.

## 2. Contexto e Motivação

Hoje o botão "Esqueci minha senha" do login leva a uma tela que pede o CPF, mas o envio é apenas simulado: nenhum e-mail é realmente disparado, e a tela de alterar senha também não grava nada de verdade. O backend já disponibiliza a solicitação de recuperação por e-mail, então é possível tornar o fluxo funcional de ponta a ponta.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Usuário cadastrado (administrador, caixa, manobrista, gerente) | Recuperar o acesso quando esquece a senha | Na tela de login, sem estar autenticado, em desktop ou celular |

## 4. Escopo

### Dentro do Escopo
- Tela de solicitação de recuperação que pede somente o e-mail e tem o botão "Recuperar minha senha". Ela **substitui** a tela atual de recuperação por CPF.
- Acesso a essa tela pelo botão "Esqueci minha senha" do login.
- Validação do e-mail antes do envio.
- Envio real da solicitação ao backend, com mensagem de confirmação e retorno ao login.
- Tela de alterar senha (aberta pelo link recebido por e-mail) funcionando de verdade: grava a nova senha no backend, com campos de senha e de repetir senha e exigência de senha segura, com checklist de regras ao vivo.
- Tratamento de falhas de comunicação e de link inválido ou expirado.

### Fora do Escopo
- Envio do e-mail em si, seu conteúdo, remetente e o endereço do link (responsabilidade do backend).
- Recuperação por CPF, SMS, perguntas de segurança ou outro canal.
- Alteração de senha de usuário já logado (troca de senha dentro do sistema).
- Autenticação em dois fatores e bloqueio de conta por tentativas.
- Reenvio automático do e-mail e contagem regressiva para novo pedido.

## 5. Requisitos Funcionais

### RF-01: Acesso à recuperação pelo login
**Critério de aceite:**
- Dado que estou na tela de login, quando clico em "Esqueci minha senha", então sou levado à tela de solicitação de recuperação.
- Dado que estou na tela de recuperação, quando clico em "Voltar ao login", então retorno ao login.
- Dado que não estou logado, quando abro a tela de recuperação diretamente pelo endereço, então ela abre normalmente.

### RF-02: Solicitação por e-mail
A tela tem apenas um campo de e-mail e o botão "Recuperar minha senha".

**Critério de aceite:**
- Dado que abro a tela, quando ela carrega, então vejo somente o campo de e-mail, o botão "Recuperar minha senha" e o link para voltar ao login (não há campo de CPF).
- Dado que o campo está vazio ou com e-mail em formato inválido, quando olho o botão, então ele está desabilitado.
- Dado que digitei um e-mail em formato inválido, quando saio do campo, então vejo a mensagem "E-mail inválido" no próprio campo.
- Dado que digitei um e-mail válido, quando olho o botão, então ele está habilitado.

### RF-03: Envio da solicitação
**Critério de aceite:**
- Dado que informei um e-mail válido, quando clico em "Recuperar minha senha", então a solicitação é enviada ao backend com esse e-mail.
- Dado que o envio está em andamento, quando aguardo, então o campo e o botão ficam desabilitados e o botão indica progresso, impedindo envio duplicado.
- Dado que o envio foi aceito, quando recebo a resposta, então vejo uma confirmação como "Enviamos as instruções de recuperação para o seu e-mail. e sou levado ao login, onde a confirmação continua visível.
- Dado que o e-mail informado não está cadastrado (o backend responde que não encontrou), quando envio, então vejo o aviso "E-mail não encontrado. Confira o endereço informado.", permaneço na tela, mantenho o e-mail digitado e posso corrigi-lo e tentar de novo.
- Dado que ocorre falha de rede, tempo esgotado ou erro do servidor, quando envio, então vejo uma mensagem compreensível em português, permaneço na tela, mantenho o e-mail digitado e posso tentar de novo.
- Dado que há erro exibido, quando envio novamente com sucesso, então o erro some.

### RF-04: Alterar senha pelo link do e-mail
**Critério de aceite:**
- Dado que abro o link recebido por e-mail, quando a tela carrega, então vejo os campos de nova senha e de confirmação.
- Dado que a confirmação é diferente da nova senha, quando tento salvar, então o envio é bloqueado com mensagem no campo.
- Dado que informei uma senha válida e igual à confirmação, quando clico em "Alterar senha", então a nova senha é gravada no backend e sou levado ao login com aviso de sucesso.
- Dado que o envio está em andamento, quando aguardo, então os controles ficam desabilitados, impedindo envio duplicado.
- Dado que o link é inválido, expirado ou já utilizado, quando abro a tela ou tento salvar, então vejo a mensagem de que o link não é mais válido e uma opção para solicitar um novo link.
- Dado que abro a tela de alterar senha sem o código do link, quando ela carrega, então vejo a mensagem de link inválido e a opção para solicitar novo link.
- Dado que ocorre falha de comunicação ao salvar, quando clico em "Alterar senha", então vejo mensagem compreensível, mantenho o que digitei e posso tentar de novo.
- Dado que digito a nova senha, quando o campo muda, então vejo uma lista de regras que vai sendo marcada conforme eu cumpro cada uma: mínimo de 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um símbolo. Cada regra tem texto próprio, e o estado "cumprida" ou "pendente" não depende só de cor.
- Dado que a senha não cumpre todas as regras, quando tento salvar, então o envio é bloqueado e a mensagem do campo indica o que falta.
- Dado que a senha cumpre todas as regras e é igual à confirmação, quando olho o botão "Alterar senha", então ele está habilitado.
- Dado que o backend recusa a nova senha por não atender à política dele, quando recebo a resposta, então vejo a mensagem do backend, mantenho o que digitei e posso corrigir. **[A DEFINIR]** se a política do backend é mais rígida que a da tela; a premissa é que a regra da tela é a mínima exigida.
- Contrato confirmado do backend: a redefinição recebe o código do link e a nova senha. O código vem no endereço do link e nunca é exibido.

### RF-05: Substituição da tela por CPF
**Critério de aceite:**
- Dado que o fluxo novo está no ar, quando acesso o endereço da recuperação de senha, então vejo a tela de e-mail e não existe mais caminho que leve à recuperação por CPF.
- Dado que a recuperação deixa de ser simulada, quando o usuário a utiliza, então a confirmação só aparece depois de a solicitação ser realmente enviada ao backend.

### RF-06: Uso em qualquer dispositivo
**Critério de aceite:**
- Dado que uso desktop ou celular, quando abro as telas de recuperação e de alterar senha, então ambas são legíveis, sem rolagem horizontal, nos temas claro e escuro.

## 6. Requisitos Não-Funcionais

- **Performance:** a confirmação aparece assim que o backend responde; limite de espera da requisição conforme o padrão do sistema, com mensagem de erro ao estourar.
- **Acessibilidade:** WCAG 2.2 nível AA; campo com rótulo, erro associado ao campo, foco visível, mensagens anunciadas a leitores de tela e fluxo completo por teclado.
- **Compatibilidade:** navegadores atuais em desktop e mobile, temas claro e escuro.
- **Segurança:** a tela informa quando o e-mail não está cadastrado (decisão de produto, que facilita a correção de erros de digitação, mas permite descobrir quais e-mails têm conta); o código do link é de uso temporário e não deve ser exibido nem registrado em logs; a senha nunca é exibida nem registrada. **[A DEFINIR]** limite de tentativas por e-mail ou endereço, a cargo do backend. A nova senha precisa ser forte (8+ caracteres com maiúscula, minúscula, número e símbolo); a confirmação serve só para conferência e não é enviada ao backend.

## 7. Fluxos Principais

### Fluxo 1: Solicitar recuperação
1. Usuário clica em "Esqueci minha senha" no login.
2. Sistema abre a tela de recuperação com o campo de e-mail.
3. Usuário digita um e-mail válido e clica em "Recuperar minha senha".
4. Sistema envia a solicitação, mostra a confirmação genérica e leva o usuário ao login.
5. Usuário recebe o e-mail com o link de recuperação.

### Fluxo 2: Definir a nova senha
1. Usuário abre o link recebido por e-mail.
2. Sistema mostra a tela de nova senha.
3. Usuário informa a nova senha e a confirmação e clica em "Alterar senha".
4. Sistema grava a senha, leva o usuário ao login com aviso de sucesso.
5. Usuário entra com a nova senha.

### Fluxo 3: Link inválido ou expirado
1. Usuário abre um link vencido ou já usado.
2. Sistema informa que o link não é mais válido e oferece "Solicitar novo link".
3. Usuário volta à tela de recuperação e repete o Fluxo 1.

### Fluxo 4: Falha de comunicação
1. Usuário envia o e-mail ou a nova senha sem conexão ou com o servidor indisponível.
2. Sistema mostra mensagem de erro e mantém os dados digitados.
3. Usuário tenta novamente quando quiser.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Usuários que concluem a redefinição após solicitar o e-mail | Não medido (fluxo simulado) | A definir após o lançamento |
| Chamados de suporte para redefinição manual de senha | Não medido | Redução após o lançamento |
| Solicitações que terminam com erro de comunicação | Não medido | Baixa e acompanhada |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| Política de senha do backend pode ser diferente da exibida na tela | Médio | Exibir a mensagem do backend quando recusar e alinhar a regra com o time de backend |
| O e-mail precisa levar a um link que abra a tela de alterar senha com o código esperado | Alto | Alinhar com o backend o endereço do link em cada ambiente (homologação, azul, produção) |
| Avisar que o e-mail não foi encontrado permite descobrir quais e-mails têm conta (enumeração) | Médio | Aceito por decisão de produto; pedir limite de tentativas ao backend e monitorar abusos |
| Usuário não recebe o e-mail (spam, e-mail desatualizado) | Médio | Texto orientando a verificar a caixa de spam; reenvio fica para uma próxima versão |
| Remoção do fluxo simulado por CPF pode deixar usuários habituados sem a opção | Baixo | Texto da tela deixa claro que o e-mail é o cadastrado no sistema |

## 10. Referências

- Pedido original: `docs/specs/input.md` (inclui o endereço da solicitação de recuperação no backend).
- PRD de autenticação com o fluxo anterior por CPF: `docs/specs/autenticacao/prd.md`.
- Integração do login com o backend: `docs/specs/integracao-login/`.
