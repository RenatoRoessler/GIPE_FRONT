<task>Adicionar nova empresa </task>
<description>
Criar tela para que o usuário consiga cadatrar uma nova empresa

Perfis: Administrador (padrão; a permissão por módulo pode alterar)

Retorna { empresaGuid }. Depois, o acesso à nova empresa é feito pelo login com seleção de empresa.

/api/v1/Empresa/adicionar

{
"razaoSocial": "string",
"nomeFantasia": "string",
"cnpj": "string",
"tipoEmpresa": 1,
"telefone": "string",
"endereco": {
"logradouro": "string",
"bairro": "string",
"numero": "string",
"cidade": "string",
"estado": "string",
"cep": "string"
},
"quantidadeVagasMoto": 0,
"quantidadeVagasCarro": 0,
"valorTrocoPadrao": 0,
"dinheiro": true,
"pix": true,
"cartaoCredito": true,
"cartaoDebito": true,
"horarios": [
{
"aberto": true,
"aberto24Horas": true,
"diaDaSemana": 1,
"horarioAbertura": "string",
"horarioFechamento": "string"
}
]
}

</description>
