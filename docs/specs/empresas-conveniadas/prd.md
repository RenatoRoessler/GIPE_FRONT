# PRD: Cadastro de Empresas Conveniadas

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-29  
**Versão:** 1.0

---

## 1. Objetivo

Permitir que o Administrador do estacionamento gerencie as empresas conveniadas (empresas que têm convênio com o estacionamento): consultar os convênios existentes e cadastrar novos, já definindo o responsável (dono) da conveniada que terá acesso ao sistema.

## 2. Contexto e Motivação

O backend passou a oferecer a consulta e o cadastro de empresas conveniadas (implementado em 25/10/2026). Falta a tela no GIPE para que o Administrador use esses recursos sem depender de outro canal. O cadastro cobre, em uma única ação, a empresa, o convênio com o estacionamento e o acesso do responsável.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Administrador do estacionamento | Ver quais empresas têm convênio, cadastrar novas e dar acesso ao responsável de cada uma | Gestão administrativa, em desktop ou celular |

O acesso à tela é do perfil Administrador por padrão, podendo ser alterado pela permissão por módulo.

## 4. Escopo

### Dentro do Escopo
- Item de menu "Empresas conveniadas", visível conforme perfil/permissão por módulo.
- Listagem dos convênios do estacionamento, com filtro por situação (todos, ativos, encerrados).
- Página própria de cadastro de conveniada, com dados da empresa e do usuário responsável.
- Mensagens de retorno distintas conforme o resultado do cadastro (empresa nova ou reaproveitada; usuário novo ou existente).
- Tratamento dos erros de negócio retornados (CNPJ de empresa de outro tipo, convênio já ativo, e-mail de outro usuário).
- Layout responsivo (desktop e celular), com estados de carregamento, vazio e erro.

### Fora do Escopo
- Editar dados da empresa conveniada ou do usuário responsável.
- Encerrar ou reativar convênio por ação própria (a reativação ocorre apenas quando se cadastra novamente uma conveniada com convênio encerrado).
- Exclusão de conveniadas.
- Gestão dos demais usuários da conveniada.
- Uso do convênio na operação do pátio (desconto, cobrança, etc.).
- Busca textual ou paginação da listagem [A DEFINIR, caso o volume exija].

## 5. Requisitos Funcionais

### RF-01: Acesso à tela
**Critério de aceite:**
- Dado um usuário com perfil Administrador (ou com permissão do módulo concedida), quando acessa o menu, então vê o item "Empresas conveniadas" e consegue abrir a tela.
- Dado um usuário sem permissão, quando tenta acessar a tela, então não vê o item no menu e é impedido de acessá-la pelo endereço.

### RF-02: Listar convênios
**Critério de aceite:**
- Dado que o Administrador abre a tela, quando a lista carrega, então vê uma linha por convênio, ordenada pelo nome (nome fantasia ou, sem ele, razão social).
- Dado cada linha, então exibe nome (fantasia ou razão social), CNPJ formatado, telefone, endereço (logradouro, número, bairro, cidade/estado, CEP), situação do convênio (ativo/encerrado) e data de cadastro do convênio.
- Dado que não há convênios, quando a lista carrega, então vê um estado vazio com chamada para cadastrar a primeira conveniada.
- Dado que a consulta falha, então vê mensagem de erro com opção de tentar novamente.

### RF-03: Filtrar por situação
**Critério de aceite:**
- Dado a listagem, quando o Administrador escolhe "Ativos", então vê apenas convênios ativos.
- Dado a listagem, quando escolhe "Encerrados", então vê apenas convênios encerrados.
- Dado a listagem, quando escolhe "Todos" (padrão), então vê todos os convênios.

### RF-04: Acessar o cadastro
**Critério de aceite:**
- Dado a listagem, quando o Administrador aciona "Nova conveniada", então é levado a uma página própria de cadastro, com opção de voltar à listagem.

### RF-05: Cadastrar dados da empresa
**Critério de aceite:**
- Dado o formulário, então pede razão social, nome fantasia (opcional), CNPJ, telefone e endereço completo (logradouro, número, bairro, cidade, estado, CEP).
- Dado que razão social, CNPJ, telefone ou algum campo do endereço está vazio, quando tenta salvar, então o campo é sinalizado e o envio não ocorre.
- Dado um CNPJ inválido (com ou sem máscara), quando tenta salvar, então vê erro no campo e o envio não ocorre.
- Dado que o CEP é informado, então o endereço pode ser preenchido a partir dele, mantendo os campos editáveis (reaproveitando o comportamento já existente no sistema).

### RF-06: Cadastrar o usuário responsável
**Critério de aceite:**
- Dado o formulário, então pede nome, CPF, e-mail e celular do responsável (dono da conveniada).
- Dado um CPF inválido ou campos obrigatórios vazios, quando tenta salvar, então o campo é sinalizado e o envio não ocorre.

### RF-07: Registrar o convênio
**Critério de aceite:**
- Dado dados válidos, quando o Administrador salva, então o convênio é registrado, o usuário volta à listagem e a conveniada aparece como ativa.
- Dado que o envio está em andamento, então o botão de salvar fica indisponível e indica carregamento, evitando envio duplicado.

### RF-08: Mensagens conforme o resultado
**Critério de aceite:**
- Dado que a empresa já existia como conveniada (convênio com outro estacionamento), quando salva, então a mensagem informa que a empresa já cadastrada foi reaproveitada, sem alteração de seus dados.
- Dado que o CPF é novo, quando salva, então a mensagem informa que o responsável foi cadastrado e recebeu por e-mail o acesso (link de login e senha temporária).
- Dado que o CPF já existia, quando salva, então a mensagem informa que o usuário existente ganhou acesso à conveniada como Administrador Conveniada, sem envio de e-mail e sem alteração de seus dados.
- Dado que o convênio estava encerrado, quando salva, então a mensagem informa que o convênio foi reativado.

### RF-09: Erros de negócio
**Critério de aceite:**
- Dado um CNPJ pertencente a empresa de outro tipo (não conveniada), quando salva, então vê mensagem clara de que o CNPJ não pode ser usado como conveniada, e os dados digitados são mantidos.
- Dado que o convênio com este estacionamento já está ativo, quando salva, então vê mensagem informando que o convênio já existe, e os dados são mantidos.
- Dado um e-mail que pertence a outro usuário, quando salva, então o erro aparece associado ao campo de e-mail, e os dados são mantidos.
- Dado qualquer outra falha, então vê mensagem de erro genérica e pode tentar novamente.

## 6. Requisitos Não-Funcionais

- **Performance:** listagem exibe estado de carregamento enquanto consulta; cadastro dá retorno visual imediato ao enviar.
- **Acessibilidade:** WCAG 2.2 nível AA (rótulos nos campos, erros anunciados, navegação por teclado).
- **Compatibilidade:** navegadores atuais, desktop e celular.
- **Segurança:** acesso restrito por perfil/permissão; nenhuma senha exibida na tela; dados pessoais (CPF, e-mail, celular) usados apenas no cadastro.

## 7. Fluxos Principais

### Fluxo 1: Consultar convênios
1. Administrador abre "Empresas conveniadas" no menu.
2. Sistema mostra a lista de convênios (todos, por padrão).
3. Administrador filtra por ativos ou encerrados.
4. Sistema atualiza a lista conforme o filtro.

### Fluxo 2: Cadastrar nova conveniada
1. Administrador aciona "Nova conveniada" na listagem.
2. Sistema abre a página de cadastro.
3. Administrador preenche empresa e responsável e salva.
4. Sistema valida os campos; se houver erro, sinaliza e mantém os dados.
5. Sistema registra o convênio e exibe a mensagem do resultado (RF-08).
6. Sistema retorna à listagem com a conveniada ativa.

### Fluxo 3: Cadastrar conveniada já existente em outro estacionamento
1. Administrador informa o CNPJ de uma conveniada já cadastrada e os demais dados.
2. Sistema reaproveita a empresa sem alterar seus dados e registra apenas o convênio.
3. Sistema informa o reaproveitamento (RF-08).

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| [A DEFINIR] | — | — |

Sem métricas definidas nesta entrega; sucesso é o Administrador conseguir listar e cadastrar conveniadas de ponta a ponta com mensagens claras.

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| API `GET /api/v1/Empresa/conveniada` e `POST /api/v1/Empresa/conveniada` (implementadas em 25/10/2026) | Alto | Alinhar contrato com o backend antes da tech spec |
| Permissão por módulo pode alterar o perfil padrão | Médio | Respeitar o mecanismo de permissões existente |
| Resposta do cadastro distingue empresa/usuário novos de existentes | Médio | Usar os indicadores retornados para compor as mensagens |
| Volume grande de conveniadas na listagem | Baixo | Avaliar paginação/busca se necessário [A DEFINIR] |
| Envio de e-mail ao novo responsável depende do backend (link de login configurado) | Médio | Mensagem de sucesso não promete entrega do e-mail, apenas o envio |

## 10. Referências

- `docs/specs/input.md` (contrato das APIs de listagem e cadastro)
- `docs/specs/gestao-usuarios/prd.md` (padrão de cadastro/listagem de usuários)
- `docs/specs/permissoes/prd.md` (permissão por módulo)
- `docs/specs/busca-cep-adesao/prd.md` (preenchimento de endereço por CEP)
