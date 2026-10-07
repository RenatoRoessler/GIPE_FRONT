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

### Serviço de comunicação com o backend (mockado)
- RF9: Cadastrar, listar e editar usuários deve funcionar de ponta a ponta mesmo sem um backend real disponível ainda — todas essas operações passam por um serviço de comunicação próprio, com os dados mantidos em memória/mock durante o uso da tela.
- RF10: Esse serviço concentra toda a comunicação com o "backend" de usuários (criar, listar, editar, ativar/inativar) em um único lugar, para que, quando a API real existir, só a implementação desse serviço precise mudar — as telas não devem ser reescritas.
- RF11: Enquanto mockado, o serviço deve simular o comportamento esperado de uma chamada real (algum tempo de resposta, possibilidade de erro), para que as telas já tratem loading e erro corretamente antes de existir backend de verdade.

## Fora de escopo
- Exclusão definitiva de usuários (inativação cobre esse caso).
- Definição de senha inicial no cadastro (tratada pelo fluxo de recuperação/alteração de senha do PRD de Autenticação).
- Regras finas de permissão por menu (tratadas no PRD de Permissões).
- Integração com um backend real — nesta versão, o serviço de comunicação (RF9-RF11) é inteiramente mockado; a troca por uma API de verdade é um trabalho futuro, fora desta spec.

## Critérios de aceite
- [ ] É possível cadastrar um novo usuário com CPF, nome, sobrenome, função e status ativo.
- [ ] CPF é validado (formato/dígito verificador) antes de salvar.
- [ ] A listagem exibe todos os usuários cadastrados em tabela, com nome, CPF, função e status.
- [ ] Cada usuário na listagem possui um botão de editar que abre seus dados para alteração.
- [ ] É possível inativar/reativar um usuário pela edição.
- [ ] Usuário inativo não consegue realizar login.
- [ ] Telas funcionam de forma responsiva em desktop e mobile.
- [ ] Cadastrar, listar, editar e ativar/inativar um usuário funciona de ponta a ponta usando o serviço de comunicação mockado, sem depender de um backend real.
- [ ] As telas mostram estado de carregamento e tratam erro nas operações acima, mesmo estas sendo mockadas.

## Métricas de sucesso
- Tempo médio para cadastrar um novo usuário.
- Zero usuários inativos conseguindo autenticar no sistema.
