# PRD: Primeiro Acesso (troca de senha obrigatória)

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-22  
**Versão:** 1.0

---

## 1. Objetivo

Garantir que quem acessa o GIPE pela primeira vez, com a senha temporária enviada por e-mail, seja levado a criar uma senha própria antes de entrar no sistema. Hoje essa pessoa não consegue concluir o login.

## 2. Contexto e Motivação

Ao cadastrar um usuário novo, o Administrador faz o sistema enviar uma senha temporária por e-mail (ver `docs/specs/integracao-gestao-usuarios/prd.md`). O contrato diz que, no primeiro acesso, a pessoa é obrigada a trocá-la.

Para isso o back responde ao login de forma diferente: em vez de uma sessão, devolve `requiresPasswordChange = true`, a mensagem "Altere sua senha para continuar." e um token curto, só para a troca de senha, sem token de acesso. O front ainda não trata essa resposta: o login sem token de acesso é tratado como erro, e o usuário novo fica preso na tela de login sem saber o motivo.

Sem este fluxo, o cadastro de usuários feito pelo Administrador não é utilizável.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Usuário recém-cadastrado (qualquer perfil) | Trocar a senha temporária por uma senha própria e seguir para o sistema | No primeiro login, com a senha recebida por e-mail |
| Administrador | Que os usuários que ele cadastra consigam entrar sem pedir ajuda | Depois de cadastrar alguém na gestão de usuários |

## 4. Escopo

### Dentro do Escopo
- Reconhecer, no login, a resposta que exige troca de senha e levar o usuário à tela de troca.
- Tela dedicada de primeiro acesso, com nova senha e confirmação.
- Regras da nova senha iguais às do cadastro e da recuperação de senha, com o checklist visual já existente.
- Envio da nova senha ao back pela mesma chamada de "Alterar senha" (`PUT /api/v1/Usuario/senha`), usando o `passwordChangeToken` recebido no login no lugar da sessão e a senha temporária digitada no login como senha atual.
- Retorno ao login, com aviso de sucesso, depois da troca.
- Tratamento de token de troca expirado ou inválido, e de erros do back.

### Fora do Escopo
- Entrar direto no sistema depois da troca (o usuário faz login de novo com a senha nova).
- Troca de senha de quem já está logado (já coberta em "Alterar senha", no menu do usuário).
- Recuperação de senha esquecida.
- Reenvio da senha temporária.
- Seleção de empresa no login (`requiresCompanySelection`): esta feature trata só `requiresPasswordChange`.
- Expiração da senha temporária por tempo de cadastro.

## 5. Requisitos Funcionais

### RF-01: Encaminhar o primeiro acesso para a troca de senha
**Critério de aceite:**
- Dado que informo CPF e senha temporária corretos, quando o back responde que a troca de senha é obrigatória, então sou levado à tela de primeiro acesso e não vejo erro de login.
- Dado que fui encaminhado, quando a tela abre, então vejo a mensagem de que preciso criar uma senha para continuar.
- Dado que o login exige troca de senha, quando a resposta chega, então nenhuma sessão é criada e eu não consigo abrir telas internas.
- Dado que o token de troca de senha é sensível, quando sou encaminhado, então ele não aparece no endereço da página.

### RF-02: Definir a nova senha
**Critério de aceite:**
- Dado que estou na tela de primeiro acesso, quando digito a nova senha, então vejo o checklist de requisitos (8 caracteres, maiúscula, minúscula, número e símbolo) com cada item marcado como cumprido ou pendente, em texto e não só em cor.
- Dado que a nova senha não cumpre todos os requisitos, quando tento confirmar, então vejo o que falta e nada é enviado.
- Dado que a confirmação é diferente da nova senha, quando tento confirmar, então vejo o erro no campo de confirmação e nada é enviado.
- Dado que os dados são válidos, quando confirmo, então o botão fica indisponível e mostra que está salvando, para evitar envio duplicado.

### RF-03: Concluir a troca e voltar ao login
**Critério de aceite:**
- Dado que a nova senha foi aceita, quando a troca termina, então sou levado ao login com o aviso de que a senha foi alterada e que devo entrar com a nova senha.
- Dado que voltei ao login, quando entro com o mesmo CPF e a nova senha, então acesso o sistema normalmente.
- Dado que a troca foi concluída, quando tento usar a senha temporária, então o login é recusado.

### RF-04: Token de troca expirado, inválido ou ausente
**Critério de aceite:**
- Dado que o tempo para trocar a senha acabou, quando confirmo, então vejo que o prazo expirou e sou orientado a entrar de novo com a senha temporária, com um caminho direto para o login.
- Dado que abro a tela de primeiro acesso sem ter passado pelo login (endereço digitado ou página recarregada), quando ela abre, então sou levado ao login em vez de ver um formulário que não funciona.
- Dado que o token de troca foi recusado pelo back, quando confirmo, então vejo a mensagem do back e posso voltar ao login.

### RF-05: Erros e feedback
**Critério de aceite:**
- Dado que o back recusa a nova senha por uma regra própria (ex.: igual à anterior), quando confirmo, então vejo a mensagem do back em português e posso corrigir sem perder o que digitei.
- Dado que não consigo conectar ao servidor, quando confirmo, então vejo o erro e posso tentar de novo.
- Dado que a tela exibe um erro, quando um leitor de tela está em uso, então o erro é anunciado.

## 6. Requisitos Não-Funcionais

- **Performance:** a tela de primeiro acesso abre imediatamente após o login, sem nova consulta ao back. **[A DEFINIR]** meta numérica.
- **Acessibilidade:** WCAG 2.2 nível AA; campos rotulados, erros ligados aos campos, foco no primeiro campo ao abrir, alternância de visibilidade da senha com nome acessível.
- **Compatibilidade:** desktop e mobile (tela responsiva), navegadores atuais.
- **Segurança:** o token de troca vale só para esta operação e nunca é exibido, registrado em log nem guardado de forma permanente; a senha nunca é registrada; o fluxo não cria sessão.

## 7. Fluxos Principais

### Fluxo 1: Primeiro acesso com sucesso
1. O usuário recebe a senha temporária por e-mail e abre o link do sistema.
2. Informa CPF e senha temporária no login.
3. O sistema reconhece que a troca de senha é obrigatória e abre a tela de primeiro acesso.
4. O usuário digita a nova senha e a confirmação, acompanhando o checklist.
5. O sistema aceita a nova senha e leva o usuário ao login com o aviso de sucesso.
6. O usuário entra com o CPF e a nova senha.

### Fluxo 2: Prazo da troca expirado
1. O usuário abre a tela de primeiro acesso e demora para concluir.
2. Ao confirmar, o sistema informa que o prazo expirou.
3. O usuário volta ao login, entra de novo com a senha temporária e refaz a troca.

### Fluxo 3: Acesso direto à tela sem passar pelo login
1. O usuário digita o endereço da tela ou recarrega a página.
2. O sistema não tem o token de troca e leva o usuário ao login.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Usuários novos que concluem o primeiro acesso sem apoio do suporte | 0% (o fluxo não existe) | 100% |
| Logins de usuário novo que terminam em erro genérico | 100% | 0 |
| Tentativas de usar a senha temporária depois da troca | — | 0 aceitas |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| O back precisa aceitar o `passwordChangeToken` como autorização de `PUT /Usuario/senha` | Alto | Definido assim com o time; validar de ponta a ponta com um usuário recém-criado |
| A senha temporária fica em memória até a troca, para ser enviada como senha atual | Médio | Só em memória, junto do token; nunca em URL, cookie, storage ou log; descartada ao trocar, ao expirar ou ao recarregar |
| A API exige nova senha diferente da atual | Baixo | A tela recusa nova senha igual à temporária antes de enviar |
| Prazo de validade do token de troca é curto e não está documentado | Médio | Tratar a expiração com mensagem clara e caminho de volta ao login (RF-04); confirmar o prazo com o back |
| Token de troca vazar por URL, log ou armazenamento persistente | Alto | Manter só em memória durante o fluxo; nunca na URL; nunca em log |
| Recarregar a página perde o token | Baixo | Levar ao login (RF-04); é o comportamento esperado |
| Regras de senha do front divergirem das do back | Médio | Exibir a mensagem do back quando ele recusar (RF-05) |
| Depende da gestão de usuários, que gera a senha temporária | Médio | Validar o fluxo de ponta a ponta com um usuário recém-criado |

## 10. Referências

- `docs/specs/input.md` (resposta do login com `requiresPasswordChange`; o exemplo contém um token real, que não deve ser copiado nem commitado)
- `docs/specs/integracao-gestao-usuarios/prd.md` (cadastro com senha temporária)
- `docs/specs/recuperacao-senha/prd.md` e `docs/specs/autenticacao/prd.md` (regras de senha e login)
- Tela existente de redefinição de senha em `src/app/alterar-senha` e modal "Alterar senha" do menu (`PUT /Usuario/senha`)
