# description

criar tela de gerenciamento de Preços

ao abrir a tela deve ter uma tabela com todos os registros
vai ter visualização
cadastro
e edição
deve ter paginação

no cadastro vai ser 3 steps

step 1 // Informações
"rotatividadeId": 10,
"empresaConveniadaId": null,
"descricao": "Tabela de Preço: Padrão",
"prioridade": 0,
"tipoRegra": 0,
"inicioVigencia": "2026-06-06T17:00:52.474",
"fimVigencia": null,
"toleranciaEntradaMinutos": 0,
"toleranciaAlteracaoFaixaMinutos": 5,
"periodoDiaria": 12,
"valorDiaria": 35.00,
"valorAdicionalDiaria": 1.00,
"ativo": true,

step 2 // Cadastro de Horarios
"diaSemana": 1,
"horaInicio": "08:00:00",
"horaFim": "18:00:00",
"dataInicio": null,
"dataFim": null,
"ativo": true

step 3 faixe da valores

{ "minutosLimite": 60, "valor": 15.00, "percentualConveniada": null },

step 4

"categorias": [
{ "tipoCategoria": 99 }
]

empresaConveniadaId = campo para o futuro, deixe desabilitado por enquanto

# enum

export enum TipoRegra {
Padrao = 1,
Convenio = 2,
Promocional = 3,
Evento = 4,
}

export enum TipoCategoria {
Moto = 1,
CarroPequeno = 2,
CarroMedio = 3,
SuvPickUp = 4,
Caminhonete = 5,
Caminhao = 6,
Todas = 99,
}@

# endpoint GET

curl --location 'https://api.gipepark.com.br/api/v1/rotatividade?pagina=1&tamanhoPagina=20' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjFmMjVlNTI2LTI0NDgtNGMxZS1iYjdlLWE5NmJjOWNmODIyZSIsImVtcHJlc2FfZ3VpZCI6ImFhYjFmNzlmLWM2NjAtNDk3Zi1hYTIyLWMwMmZjNmYxMjIzYiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InRlc3RlQHRlc3RlLmNvbS5iciIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ0ZXN0ZUB0ZXN0ZS5jb20uYnIiLCJqdGkiOiIwNTJmZTQ4Zi0wOTcwLTRjMmItYmExZS1kNmVmOGZlOGY3NzMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBZG1pbmlzdHJhZG9yIiwiZXhwIjoxNzkxNjg1NjU3LCJpc3MiOiJnaXBlLWF1dGgtc2VydmljZSIsImF1ZCI6ImdpcGUtYXBpIn0.-1ZYX5MKdv5-tMtv3a5NQOmKPNMQyrEUYuZgnkLVfj0'

RETORNO

{
"items": [
{
"rotatividadeId": 10,
"empresaConveniadaId": null,
"descricao": "Tabela de Preço: Padrão",
"prioridade": 0,
"tipoRegra": 0,
"inicioVigencia": "2026-06-06T17:00:52.474",
"fimVigencia": null,
"toleranciaEntradaMinutos": 0,
"toleranciaAlteracaoFaixaMinutos": 5,
"periodoDiaria": 12,
"valorDiaria": 35.00,
"valorAdicionalDiaria": 1.00,
"ativo": true,
"regras": [
{
"rotatividadeRegraId": 32,
"rotatividadeId": 10,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 1,
"horaInicio": null,
"horaFim": null
},
{
"rotatividadeRegraId": 33,
"rotatividadeId": 10,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 2,
"horaInicio": null,
"horaFim": null
},
{
"rotatividadeRegraId": 34,
"rotatividadeId": 10,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 3,
"horaInicio": null,
"horaFim": null
},
{
"rotatividadeRegraId": 35,
"rotatividadeId": 10,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 4,
"horaInicio": null,
"horaFim": null
},
{
"rotatividadeRegraId": 36,
"rotatividadeId": 10,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 5,
"horaInicio": null,
"horaFim": null
},
{
"rotatividadeRegraId": 37,
"rotatividadeId": 10,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 6,
"horaInicio": null,
"horaFim": null
},
{
"rotatividadeRegraId": 38,
"rotatividadeId": 10,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 7,
"horaInicio": null,
"horaFim": null
}
],
"faixaValores": [
{
"rotatividadeValorId": 20,
"rotatividadeId": 10,
"minutosLimite": 30,
"percentualConveniada": 0,
"valor": 10.00
},
{
"rotatividadeValorId": 21,
"rotatividadeId": 10,
"minutosLimite": 60,
"percentualConveniada": 0,
"valor": 15.00
},
{
"rotatividadeValorId": 22,
"rotatividadeId": 10,
"minutosLimite": 120,
"percentualConveniada": 0,
"valor": 20.00
},
{
"rotatividadeValorId": 23,
"rotatividadeId": 10,
"minutosLimite": 180,
"percentualConveniada": 0,
"valor": 25.00
},
{
"rotatividadeValorId": 24,
"rotatividadeId": 10,
"minutosLimite": 240,
"percentualConveniada": 0,
"valor": 30.00
},
{
"rotatividadeValorId": 25,
"rotatividadeId": 10,
"minutosLimite": 720,
"percentualConveniada": 0,
"valor": 35.00
}
],
"categorias": [
{
"rotatividadeCategoriaId": 5,
"rotatividadeId": 10,
"tipoCategoria": 99
}
]
},
{
"rotatividadeId": 11,
"empresaConveniadaId": null,
"descricao": "Tabela padrão",
"prioridade": 2,
"tipoRegra": 1,
"inicioVigencia": "2026-10-15T00:00:00",
"fimVigencia": null,
"toleranciaEntradaMinutos": 15,
"toleranciaAlteracaoFaixaMinutos": 10,
"periodoDiaria": 720,
"valorDiaria": 50.00,
"valorAdicionalDiaria": 2.00,
"ativo": true,
"regras": [
{
"rotatividadeRegraId": 39,
"rotatividadeId": 11,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 1,
"horaInicio": "08:00:00",
"horaFim": "18:00:00"
},
{
"rotatividadeRegraId": 40,
"rotatividadeId": 11,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 2,
"horaInicio": "08:00:00",
"horaFim": "18:00:00"
},
{
"rotatividadeRegraId": 41,
"rotatividadeId": 11,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 3,
"horaInicio": "08:00:00",
"horaFim": "18:00:00"
},
{
"rotatividadeRegraId": 42,
"rotatividadeId": 11,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 4,
"horaInicio": "08:00:00",
"horaFim": "18:00:00"
},
{
"rotatividadeRegraId": 43,
"rotatividadeId": 11,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 5,
"horaInicio": "08:00:00",
"horaFim": "18:00:00"
},
{
"rotatividadeRegraId": 44,
"rotatividadeId": 11,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 6,
"horaInicio": "08:00:00",
"horaFim": "18:00:00"
},
{
"rotatividadeRegraId": 45,
"rotatividadeId": 11,
"ativo": true,
"dataInicio": null,
"dataFim": null,
"diaSemana": 7,
"horaInicio": "08:00:00",
"horaFim": "18:00:00"
}
],
"faixaValores": [
{
"rotatividadeValorId": 26,
"rotatividadeId": 11,
"minutosLimite": 60,
"percentualConveniada": 0,
"valor": 15.00
},
{
"rotatividadeValorId": 27,
"rotatividadeId": 11,
"minutosLimite": 120,
"percentualConveniada": 0,
"valor": 25.00
},
{
"rotatividadeValorId": 28,
"rotatividadeId": 11,
"minutosLimite": 180,
"percentualConveniada": 0,
"valor": 30.00
},
{
"rotatividadeValorId": 29,
"rotatividadeId": 11,
"minutosLimite": 240,
"percentualConveniada": 0,
"valor": 35.00
},
{
"rotatividadeValorId": 30,
"rotatividadeId": 11,
"minutosLimite": 300,
"percentualConveniada": 0,
"valor": 40.00
},
{
"rotatividadeValorId": 31,
"rotatividadeId": 11,
"minutosLimite": 360,
"percentualConveniada": 0,
"valor": 45.00
},
{
"rotatividadeValorId": 32,
"rotatividadeId": 11,
"minutosLimite": 720,
"percentualConveniada": 0,
"valor": 50.00
}
],
"categorias": [
{
"rotatividadeCategoriaId": 6,
"rotatividadeId": 11,
"tipoCategoria": 99
}
]
}
],
"page": 1,
"pageSize": 20,
"totalRecords": 2,
"totalPages": 1
}

# endpoint POST

curl --location 'https://api.gipepark.com.br/api/v1/rotatividade' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjFmMjVlNTI2LTI0NDgtNGMxZS1iYjdlLWE5NmJjOWNmODIyZSIsImVtcHJlc2FfZ3VpZCI6ImFhYjFmNzlmLWM2NjAtNDk3Zi1hYTIyLWMwMmZjNmYxMjIzYiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InRlc3RlQHRlc3RlLmNvbS5iciIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ0ZXN0ZUB0ZXN0ZS5jb20uYnIiLCJqdGkiOiIwNTJmZTQ4Zi0wOTcwLTRjMmItYmExZS1kNmVmOGZlOGY3NzMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBZG1pbmlzdHJhZG9yIiwiZXhwIjoxNzkxNjg1NjU3LCJpc3MiOiJnaXBlLWF1dGgtc2VydmljZSIsImF1ZCI6ImdpcGUtYXBpIn0.-1ZYX5MKdv5-tMtv3a5NQOmKPNMQyrEUYuZgnkLVfj0' \
--data '{
"rotatividade": {
"empresaConveniadaId": null,
"descricao": "Tabela padrão",
"inicioVigencia": "2026-10-15T00:00:00",
"fimVigencia": null,
"toleranciaEntradaMinutos": 15,
"toleranciaAlteracaoFaixaMinutos": 10,
"periodoDiaria": 720,
"valorDiaria": 50.00,
"valorAdicionalDiaria": 2.00,
"prioridade": 2,
"tipoRegra": 1
},
"regras": [
{
"diaSemana": 1,
"horaInicio": "08:00:00",
"horaFim": "18:00:00",
"dataInicio": null,
"dataFim": null,
"ativo": true
},
{
"diaSemana": 2,
"horaInicio": "08:00:00",
"horaFim": "18:00:00",
"dataInicio": null,
"dataFim": null,
"ativo": true
},
{
"diaSemana": 3,
"horaInicio": "08:00:00",
"horaFim": "18:00:00",
"dataInicio": null,
"dataFim": null,
"ativo": true
},
{
"diaSemana": 4,
"horaInicio": "08:00:00",
"horaFim": "18:00:00",
"dataInicio": null,
"dataFim": null,
"ativo": true
},
{
"diaSemana": 5,
"horaInicio": "08:00:00",
"horaFim": "18:00:00",
"dataInicio": null,
"dataFim": null,
"ativo": true
},
{
"diaSemana": 6,
"horaInicio": "08:00:00",
"horaFim": "18:00:00",
"dataInicio": null,
"dataFim": null,
"ativo": true
},
{
"diaSemana": 7,
"horaInicio": "08:00:00",
"horaFim": "18:00:00",
"dataInicio": null,
"dataFim": null,
"ativo": true
}
],
"faixaValores": [
{ "minutosLimite": 60, "valor": 15.00, "percentualConveniada": null },
{ "minutosLimite": 120, "valor": 25.00, "percentualConveniada": null },
{ "minutosLimite": 180, "valor": 30.00, "percentualConveniada": null },
{ "minutosLimite": 240, "valor": 35.00, "percentualConveniada": null },
{ "minutosLimite": 300, "valor": 40.00, "percentualConveniada": null },
{ "minutosLimite": 360, "valor": 45.00, "percentualConveniada": null },
{ "minutosLimite": 720, "valor": 50.00, "percentualConveniada": null }

],
"categorias": [
{ "tipoCategoria": 99 }
]
}'
