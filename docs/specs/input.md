<task>melhorar fluxo de entrada </task>
<description>
quero que o layout seja melhorado com base nesse[text](../../../Users/renat/Downloads/gipe-entrada.html)
na tela de entrada altere o campo cor para ser um enum agora

o qrcode deve apontar para uma tela com o campo token do endpoiont https://api.gipepark.com.br/api/v1/Patio/entrada

ao entrar na tela de recebido deve chamar o <endpoint_comprovante> passando o token
esse tela vai ser publica

</description>
<endpoint_comprovante>

curl -X 'GET' \
 'https://api.gipepark.com.br/api/v1/Patio/comprovante/cliente?token=227SUSYV' \
 -H 'accept: _/_'

{
"cnpj": "66326569000150",
"razaoSocial": "teste razao",
"endereco": "Avenida Sete de Setembro, 123",
"telefone": "54996384949",
"placa": "LWJ2686",
"modelo": "Fusca",
"cor": "teste",
"categoriaId": 2,
"categoriaDescricao": "Carro pequeno",
"dataHoraEntrada": "2026-10-17T10:06:06.2094",
"dataHoraConsulta": "2026-10-17T10:06:21.3565059",
"minutosPermanencia": 0,
"permanencia": "0h 0min",
"sequencial": 7888,
"token": "227SUSYV",
"valorAtual": 0
}
</endpoint_comprovante>
