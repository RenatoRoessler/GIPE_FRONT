<task>Pagamento do mensalista</task>
<description>
na pagina do mensalista, adicionar opção para realizar o pagamento
Numa única transação:

Dá baixa na cobrança pendente mais recente do mensalista (status 1 - Pago, com data, forma, valor pago, origem e quem recebeu);
Ativa o mensalista;
Gera a cobrança pendente do mês seguinte, com o valor atual do tipo.
O próximo vencimento sai sempre do diaVencimento do cadastro do mensalista. Se o mês não tem o dia, vence no dia seguinte ao último dia do mês (dia 31: 31/10 → 01/12 → 31/12).

empresaId: precisa ser a empresa selecionada no login.
mensalistaId: mensalista da empresa com cobrança pendente.
valorPago: maior que zero, até 2 casas decimais.
formaPagamento: EFormaPagamento (1 Dinheiro, 2 PIX, 3 Débito, 4 Crédito, 5 Boleto, 6 Transferência).
usuarioId: usuário que recebeu o pagamento, vinculado à empresa.
origemPagamento: EOrigemPagamento (1 Pátio, 2 Painel Administrativo, 3 WebHook, 4 Site).
Primeiro pagamento do mensalista: só depois do aceite do contrato (quem já pagou alguma mensalidade não é bloqueado).

Retorna a cobrança paga e a próxima gerada.

curl -X 'POST' \
 'https://api.gipepark.com.br/api/v1/Mensalista/pagamento' \
 -H 'accept: _/_' \
 -H 'Content-Type: application/json' \
 -d '{
"empresaId": 0,
"mensalistaId": 0,
"valorPago": 0,
"formaPagamento": 1,
"origemPagamento": 1,
"usuarioId": 0
}'

</description>
