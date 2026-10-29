criar tela para cadastro de empresas conveniadas

get /api/v1/Empresa/conveniada
Perfis: Administrador (padrão; a permissão por módulo pode alterar)

Uma linha por convênio (empresa_convenio), em ordem de nome (nome fantasia ou, sem ele, razão social).

ativo (opcional): true só convênios ativos, false só encerrados; sem o parâmetro, todos.
Retorna empresaConvenioId, empresaConveniadaId, empresaGuid, razaoSocial, nomeFantasia, cnpj (só números), telefone, endereço (logradouro, numero, bairro, cidade, estado, cep), ativo (situação do convênio) e dataCriacao (cadastro do convênio).

/api/v1/Empresa/conveniada

Implementado em: 25/10/2026
Perfis: Administrador (padrão; a permissão por módulo pode alterar)

Corpo: empresa (razaoSocial, nomeFantasia, cnpj, telefone, endereco) e usuario (nome, cpf, email, celular), o dono da conveniada.

Empresa: não tem tipoEmpresa no corpo; é sempre gravada como 5 (Conveniada). Obrigatórios: razão social, CNPJ válido (com ou sem máscara), telefone e endereço completo. Se o CNPJ já for de uma conveniada (convênio com outro estacionamento), ela é reaproveitada sem alterar os dados e só o convênio é registrado; CNPJ de empresa de outro tipo = 400.

Convênio: registrado em empresa_convenio (estacionamento × conveniada). Já ativo = 400; encerrado = reativado.

Usuário: CPF novo é cadastrado com senha temporária (troca obrigatória no primeiro acesso) e recebe o e-mail do convênio com o nome do estacionamento, o link de login (Front:LinkLogin) e a senha. CPF existente só ganha acesso à conveniada como Administrador Conveniada (perfil 5), sem e-mail, e os outros campos são ignorados; se já tiver acesso a ela, fica como está. E-mail de outro usuário = 400.

Retorna empresaConveniadaId, empresaGuid, novaEmpresa, usuarioId e novoUsuario.

{
"empresa": {
"razaoSocial": "string",
"nomeFantasia": "string",
"cnpj": "string",
"telefone": "string",
"endereco": {
"logradouro": "string",
"bairro": "string",
"numero": "string",
"cidade": "string",
"estado": "string",
"cep": "string"
}
},
"usuario": {
"nome": "string",
"cpf": "string",
"email": "string",
"celular": "string"
}
}
