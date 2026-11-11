1
criar nova tela publica para consultar o cliente consultar o ticket atravez da placa

essa tela deve receber como paremtro a empresaGuid

deve ser uma tela publica

deve ter campo para digitar a placa e um botão buscar

deve chamar o endpoint patio/comprovante/cliente/placa?empresa={{empresaGuid}}&placa=QQQ5Z8

response {
"cnpj": "33233645000123",
"razaoSocial": "Empresa de Teste",
"endereco": "Rua Achiles Tomazelli - E, 12",
"telefone": "54996384141",
"placa": "RMI1V18",
"modelo": "",
"cor": "",
"categoriaId": 4,
"categoriaDescricao": "Caminhonete",
"dataHoraEntrada": "2026-11-11T11:31:33.97548",
"dataHoraConsulta": "2026-11-11T11:31:43.0523315",
"minutosPermanencia": 0,
"permanencia": "0h 0min",
"sequencial": 6578,
"prisma": 2,
"token": "P8WRVRQW",
"valorAtual": 0
}

caso tenha passado 8 minutos ou a placa não exista retorna 404

depois de buscar deve chamar a abrir o comprovante
https://app.murel.com.br/comprovante/{token}

2
criar Botão "Gerar Cartaz do Ticket"
deve ficar na home e dentro da tela de empresa
ao clicar deve abrir imprimir um cartaza assim ![alt text](<Cartaz Ticket Digital · A4 retrato@1x.png>)

o qrcode deve apontar para a tela do 1 passanando o empresaGuid
no endpoint de empresa foi adicionado o campo empresaGuid no payload
