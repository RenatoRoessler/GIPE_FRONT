Criar modulo de faturas
/api/v1/Fatura
Perfis: Administrador, Gerente, Financeiro (padrão; a permissão por módulo pode alterar)

Junta todas as saídas da conveniada (linhas da patio_convenio do estacionamento logado) com saída, situação 1 (Aberto), sem fatura e com valor da conveniada. Elas passam a 2 (Faturado) e ganham o convenioFaturaId; a fatura grava a quantidade e a soma de valorConveniada. As saídas com a parte da conveniada zerada (situação 5) não entram.

empresaConveniadaId: conveniada do estacionamento (o convênio pode estar inativo).
vencimento: a partir de hoje.
observacao: opcional, até 500 caracteres.
Retorna a fatura (fatura, com o convenioFaturaGuid que vai para a conveniada) e as saídas dela (itens).

curl -X 'POST' \
 'http://localhost:5000/api/v1/Fatura' \
 -H 'accept: _/_' \
 -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6Ijk3ZDJhY2MzLTQ5ZjUtNDNjZS05NGYyLWZmN2Y0NDRiYzVhZCIsImVtcHJlc2FfZ3VpZCI6IjU1YmU1MWM2LWU0MGItNGUyNS05ZTdkLTQ0OWEzMmZkYTUxZiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InJlbmF0by5yb2Vzc2xlckBtdXJlbC5jb20uYnIiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoicmVuYXRvLnJvZXNzbGVyQG11cmVsLmNvbS5iciIsImp0aSI6ImRmMDZkMzlhLWE1ZmYtNDdlNC05MjFjLTMwMTY3ZTliMjU2YSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IjEiLCJleHAiOjE3OTQxOTU2MzcsImlzcyI6Im11cmVsLWF1dGgtc2VydmljZSIsImF1ZCI6Im11cmVsLWFwaSJ9.SOz6onhG3sgTta0vBUILi-y-8-TmzPIYCuyMHzKNSV0' \
 -H 'Content-Type: application/json' \
 -d '{
"empresaConveniadaId": 53,
"vencimento": "2026-12-08",
"observacao": "teste"
}'

response
{
"fatura": {
"convenioFaturaId": 1,
"convenioFaturaGuid": "d796a912-b584-4b3a-9b19-fc9fcdd404f8",
"empresaId": 52,
"estacionamento": "empresa teste",
"empresaConveniadaId": 53,
"conveniada": "empresa conveniada 1",
"quantidadeSaidas": 1,
"valorTotal": 1.5,
"vencimento": "2026-12-08T00:00:00",
"situacao": 1,
"observacao": "teste",
"usuarioId": 47,
"usuario": "Renato Rossler",
"dataCriacao": "2026-11-08T10:46:56.797998",
"dataPagamento": null,
"formaPagamento": null,
"valorPago": null,
"usuarioIdPagamento": null,
"usuarioPagamento": null,
"dataCancelamento": null,
"usuarioIdCancelamento": null,
"usuarioCancelamento": null
},
"itens": [
{
"patioConvenioId": 17,
"placa": "YCC3U07",
"modelo": "FUSION",
"categoria": 3,
"dataEntrada": "2026-11-08T10:42:39.016539",
"dataSaida": "2026-11-08T10:46:43.199059",
"minutosPermanencia": 4,
"rotatividadeId": 23,
"rotatividade": "tabela convenio",
"percentualConveniada": 50,
"valorFixoConveniada": null,
"valorTotal": 3,
"valorConveniada": 1.5,
"valorCliente": 1.5,
"dataValidacao": "2026-11-08T10:43:48.28227",
"usuarioConveniada": "usuario conveniado 1"
}
]
}

/api/v1/Fatura
Perfis: Administrador, Gerente, Financeiro (padrão; a permissão por módulo pode alterar)

Faturas do estacionamento logado, da emissão mais recente para a mais antiga, sem as saídas (ver GET fatura/{id}).

empresaConveniadaId: opcional, só de uma conveniada.
situacao: opcional, 1 Aberta, 2 Paga ou 3 Cancelada.
pagina: padrão 1. tamanhoPagina: padrão 20, máximo 100.

curl -X 'GET' \
 'http://localhost:5000/api/v1/Fatura' \
 -H 'accept: _/_' \
 -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6Ijk3ZDJhY2MzLTQ5ZjUtNDNjZS05NGYyLWZmN2Y0NDRiYzVhZCIsImVtcHJlc2FfZ3VpZCI6IjU1YmU1MWM2LWU0MGItNGUyNS05ZTdkLTQ0OWEzMmZkYTUxZiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InJlbmF0by5yb2Vzc2xlckBtdXJlbC5jb20uYnIiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoicmVuYXRvLnJvZXNzbGVyQG11cmVsLmNvbS5iciIsImp0aSI6ImRmMDZkMzlhLWE1ZmYtNDdlNC05MjFjLTMwMTY3ZTliMjU2YSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IjEiLCJleHAiOjE3OTQxOTU2MzcsImlzcyI6Im11cmVsLWF1dGgtc2VydmljZSIsImF1ZCI6Im11cmVsLWFwaSJ9.SOz6onhG3sgTta0vBUILi-y-8-TmzPIYCuyMHzKNSV0'

{
"items": [
{
"convenioFaturaId": 1,
"convenioFaturaGuid": "d796a912-b584-4b3a-9b19-fc9fcdd404f8",
"empresaId": 52,
"estacionamento": "empresa teste",
"empresaConveniadaId": 53,
"conveniada": "empresa conveniada 1",
"quantidadeSaidas": 1,
"valorTotal": 1.5,
"vencimento": "2026-12-08T00:00:00",
"situacao": 1,
"observacao": "teste",
"usuarioId": 47,
"usuario": "Renato Rossler",
"dataCriacao": "2026-11-08T10:46:56.797998",
"dataPagamento": null,
"formaPagamento": null,
"valorPago": null,
"usuarioIdPagamento": null,
"usuarioPagamento": null,
"dataCancelamento": null,
"usuarioIdCancelamento": null,
"usuarioCancelamento": null
}
],
"page": 1,
"pageSize": 20,
"totalRecords": 1,
"totalPages": 1
}

/api/v1/Fatura/{convenioFaturaId}
Perfis: Administrador, Gerente, Financeiro (padrão; a permissão por módulo pode alterar)

fatura: dados da fatura, com emissão, pagamento e cancelamento. itens: as saídas (placa, modelo, categoria, entrada, saída, permanência, tabela de convênio, regra da conveniada e valores), da mais antiga para a mais recente.

Perfis: Administrador, Gerente, Financeiro (padrão; a permissão por módulo pode alterar)

fatura: dados da fatura, com emissão, pagamento e cancelamento. itens: as saídas (placa, modelo, categoria, entrada, saída, permanência, tabela de convênio, regra da conveniada e valores), da mais antiga para a mais recente.
Perfis: Administrador, Gerente, Financeiro (padrão; a permissão por módulo pode alterar)

Só fatura aberta. A fatura passa a 2 (Paga) e as saídas dela a 3 (Pago). O pagamento não entra no caixa.

formaPagamento: EFormaPagamento.
valorPago: opcional, maior que zero; nulo = valor total da fatura.
dataPagamento: opcional, até hoje; nula = agora.

/api/v1/Fatura/{convenioFaturaId}/cancelar
Perfis: Administrador, Gerente, Financeiro (padrão; a permissão por módulo pode alterar)

Só fatura aberta (paga não é cancelada). A fatura não é apagada: fica 3 (Cancelada) com quem cancelou e quando. As saídas dela voltam a 1 (Aberto), sem fatura, e entram na próxima emissão. A resposta traz itens vazio.
