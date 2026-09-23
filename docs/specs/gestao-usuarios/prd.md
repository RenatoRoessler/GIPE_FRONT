# PRD: Gestão de Usuários

## Problema
O GIPE precisa de um cadastro de usuários do sistema (administradores, caixas, manobristas, gerentes) para permitir login e controle de quem pode operar o estacionamento. Hoje não existe forma de cadastrar, listar ou editar esses usuários.

## Objetivo
Um administrador consegue cadastrar novos usuários com sua função no sistema, visualizar todos os usuários cadastrados em uma listagem e editar os dados de um usuário existente, incluindo ativá-lo ou inativá-lo.

## Usuário-alvo
Administradores (e outros perfis com permissão de gestão de usuários) que precisam controlar quem tem acesso ao GIPE e qual o papel de cada pessoa.

## Requisitos funcionais

### Cadastro de usuários
- RF1: Campo CPF.
- RF2: Campo nome.
- RF3: Campo sobrenome.
- RF4: Campo função, do tipo enum, com as opções: 1 = Admin, 2 = Caixa, 3 = Manobrista, 4 = Gerente.
- RF5: Campo/flag ativo (indica se o usuário pode logar no sistema).
- RF6: Salvar o cadastro cria o usuário e o torna disponível para login (sujeito ao fluxo de senha definido em Autenticação).

### Listagem de usuários
- RF7: Lista todos os usuários cadastrados em formato de tabela.
- RF8: Cada linha da tabela tem um botão de editar que leva à edição dos dados daquele usuário.

## Fora de escopo
- Exclusão definitiva de usuários (inativação cobre esse caso).
- Definição de senha inicial no cadastro (tratada pelo fluxo de recuperação/alteração de senha do PRD de Autenticação).
- Regras finas de permissão por menu (tratadas no PRD de Permissões).

## Critérios de aceite
- [ ] É possível cadastrar um novo usuário com CPF, nome, sobrenome, função e status ativo.
- [ ] CPF é validado (formato/dígito verificador) antes de salvar.
- [ ] A listagem exibe todos os usuários cadastrados em tabela, com nome, CPF, função e status.
- [ ] Cada usuário na listagem possui um botão de editar que abre seus dados para alteração.
- [ ] É possível inativar/reativar um usuário pela edição.
- [ ] Usuário inativo não consegue realizar login.
- [ ] Telas funcionam de forma responsiva em desktop e mobile.

## Métricas de sucesso
- Tempo médio para cadastrar um novo usuário.
- Zero usuários inativos conseguindo autenticar no sistema.
