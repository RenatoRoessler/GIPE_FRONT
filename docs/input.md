# description

o fluxo de adesão é o fluxo responsavel pelo cadastro da empresa e usuário titular da empresa no sistema
o usuário vai receber esse link e vai cadastrar a empresa

# description

integração do fluxo de adesao
src\components\adesao\OnboardingWizard\OnboardingWizard.tsx

# POST

curl --location 'http://157.151.11.120:5000/api/v1/Adesao' \
--header 'Content-Type: application/json' \
--data-raw '{
"empresa": {
"razaoSocial": "ESTACIONAMENTO TESTE 2",
"cnpj": "74756416000170",
"tipoEmpresa": 1,
"telefone": "11987456814",
"endereco": {
"logradouro": "Rua dos Jequitibás",
"bairro": "Jardim Oriental",
"numero": "171",
"cidade": "São Paulo",
"estado": "SP",
"cep": "04310-874"
},
"quantidadeVagasMoto": 15,
"quantidadeVagasCarro": 65
},
"horarios": [
{
"aberto": false,
"aberto24Horas": false,
"diaDaSemana": 1,
"horarioAbertura": null,
"horarioFechamento": null
},
{
"aberto": true,
"aberto24Horas": false,
"diaDaSemana": 2,
"horarioAbertura": "08:00",
"horarioFechamento": "22:00"
},
{
"aberto": true,
"aberto24Horas": false,
"diaDaSemana": 3,
"horarioAbertura": "08:00",
"horarioFechamento": "22:00"
},
{
"aberto": true,
"aberto24Horas": false,
"diaDaSemana": 4,
"horarioAbertura": "08:00",
"horarioFechamento": "22:00"
},
{
"aberto": true,
"aberto24Horas": false,
"diaDaSemana": 5,
"horarioAbertura": "08:00",
"horarioFechamento": "22:00"
},
{
"aberto": true,
"aberto24Horas": false,
"diaDaSemana": 6,
"horarioAbertura": "08:00",
"horarioFechamento": "22:00"
},
{
"aberto": true,
"aberto24Horas": false,
"diaDaSemana": 7,
"horarioAbertura": "08:00",
"horarioFechamento": "16:00"
}
],
"usuario": {
"nome": "Usuario 123",
"cpf": "00826751121",
"email": "teste322@gmail.com",
"celular": "11987475862",
"senha": "Mudar@123"
}
}'
