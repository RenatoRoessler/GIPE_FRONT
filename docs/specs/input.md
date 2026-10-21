<task>finalização fluxo de mensalista</task>
<description>
implentar, integrar e validar fluxo de mensalista
listagem de mensalistas
crud

apos o cadastro o usuario ira receber um email
ele devera clicar nesse email
abrira uma pagina mostrando o contrata
e pedindo para ele aceitar os termos
apos isso ele fica valido

chame os endpoint para validar o retorno

https://api.gipepark.com.br/swagger/index.html

Usuario: front
Senha: Gipe2026@#$%

</description>
<endpoint_get_mensalistas>
Ativos primeiro, depois por nome. Cada item traz o tipo (tipoMensal, categoria, valorMensalidade) o nome de quem cadastrou e de quem fez a última alteração, e os veiculos do mensalista. Cada veículo traz os condutores (nome, cpf só com dígitos); a lista vem vazia para pessoa física.

documento: opcional, início do CPF/CNPJ, com ou sem máscara. O documento completo encontra o mensalista exato.
pagina: padrão 1.
tamanhoPagina: padrão 20, máximo 100.

curl -X 'GET' \
 'https://api.gipepark.com.br/api/v1/Mensalista?pagina=1' \
 -H 'accept: _/_' \
 -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6Ijc3NmMxMWYzLThiNzQtNDE5Ni1hNGM3LTA4MThlOWIxNzI3NSIsImVtcHJlc2FfZ3VpZCI6IjViZTM4Yzc3LWJjZDItNDYyZi1hMmYzLTkyZDdhNzdkZDQ4YyIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InJlbmF0b3JvZXNzbGVyQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJyZW5hdG9yb2Vzc2xlckBnbWFpbC5jb20iLCJqdGkiOiIzZmU4YzFlMS0zNTJlLTQzNDUtYWRmMy01YzY1MDFjYjQ1ZTUiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBZG1pbmlzdHJhZG9yIiwiZXhwIjoxNzkyNTY0ODk5LCJpc3MiOiJnaXBlLWF1dGgtc2VydmljZSIsImF1ZCI6ImdpcGUtYXBpIn0.b4C6R0tUhucScRPMxnuT-RmuXA3efzoQYjRSplecdpY'

{
"items": [],
"page": 1,
"pageSize": 20,
"totalRecords": 0,
"totalPages": 0
}

Code Description Links
200
Página de mensalistas

No links
401
Não autenticado

No links
403
Perfil sem permissão

</endpoint_get_mensalistas>

<endpoint_post_mensalista>

Cadastrado inativo: só é ativado no primeiro pagamento (POST mensalista/pagamento). Retorna { mensalistaId }.

Gera também o contrato (modelo padrão preenchido com os dados do mensalista) e envia por e-mail o link para o aceite eletrônico, válido por 7 dias (POST mensalista/{id}/contrato/reenviar manda um link novo). O primeiro pagamento só é aceito depois do aceite do contrato.

Gera a primeira cobrança pendente (mensalista_cobranca) com o valor do tipo. Vence neste mês se o diaVencimento ainda não passou (o dia de hoje conta), senão no mês seguinte. Se o mês não tem o dia (ex.: 31 em novembro), vence no dia seguinte ao último dia do mês (01/12).

documento: CPF ou CNPJ válido conforme o tipoPessoa (1 Física, 2 Jurídica), com ou sem máscara. Aceita CNPJ alfanumérico.
celular: DDD + 9 dígitos, com ou sem máscara.
diaVencimento: 1 a 31.
mensalistaTipoId: precisa ser um tipo da empresa e estar ativo.
veiculos: lista de { placa, modelo, cor, categoria } (pode ser vazia). Placa com ou sem hífen, sem repetir na lista e sem pertencer a outro mensalista da empresa; modelo até 80 e cor até 50 caracteres; categoria igual à do tipo (qualquer uma, exceto 99, quando o tipo é 99 - Todas). Placas que ainda não estão no cadastro de veículos entram nele; as que já estão não são alteradas.
veiculos[].condutores: lista de { nome, cpf } com as pessoas autorizadas a usar o veículo. Pessoa jurídica: obrigatório, ao menos um por veículo (nome até 100, CPF válido com ou sem máscara, sem repetir CPF no mesmo veículo; a mesma pessoa pode estar em mais de um veículo). Pessoa física: não envie (recusado).

curl -X 'POST' \
 'https://api.gipepark.com.br/api/v1/Mensalista' \
 -H 'accept: _/_' \
 -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6Ijc3NmMxMWYzLThiNzQtNDE5Ni1hNGM3LTA4MThlOWIxNzI3NSIsImVtcHJlc2FfZ3VpZCI6IjViZTM4Yzc3LWJjZDItNDYyZi1hMmYzLTkyZDdhNzdkZDQ4YyIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InJlbmF0b3JvZXNzbGVyQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJyZW5hdG9yb2Vzc2xlckBnbWFpbC5jb20iLCJqdGkiOiIzZmU4YzFlMS0zNTJlLTQzNDUtYWRmMy01YzY1MDFjYjQ1ZTUiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBZG1pbmlzdHJhZG9yIiwiZXhwIjoxNzkyNTY0ODk5LCJpc3MiOiJnaXBlLWF1dGgtc2VydmljZSIsImF1ZCI6ImdpcGUtYXBpIn0.b4C6R0tUhucScRPMxnuT-RmuXA3efzoQYjRSplecdpY' \
 -H 'Content-Type: application/json' \
 -d '{
"mensalistaTipoId": 0,
"tipoPessoa": 1,
"documento": "string",
"nome": "string",
"email": "string",
"celular": "string",
"diaVencimento": 0,
"ativo": true,
"veiculos": [
{
"placa": "string",
"modelo": "string",
"cor": "string",
"categoria": 1,
"condutores": [
{
"nome": "string",
"cpf": "string"
}
]
}
]
}'

{
"mensalistaTipoId": 0,
"tipoPessoa": 1,
"documento": "string",
"nome": "string",
"email": "string",
"celular": "string",
"diaVencimento": 0,
"ativo": true,
"veiculos": [
{
"placa": "string",
"modelo": "string",
"cor": "string",
"categoria": 1,
"condutores": [
{
"nome": "string",
"cpf": "string"
}
]
}
]
}

</endpoint_post_mensalista>
<endpoint_put_mensalista>

Envie todos os campos; ativo: false desativa o mensalista. ativo: true não ativa um mensalista inativo: a ativação é sempre pelo pagamento (POST mensalista/pagamento; inativo sem cobrança pendente usa antes o POST mensalista/{id}/reativar). Trocar para um tipo inativo não é permitido; manter o tipo atual é, mesmo que ele tenha sido desativado.

O tipoPessoa não pode mudar (PF ↔ PJ): para isso, faça um novo cadastro.

veiculos é sempre a lista completa, com os condutores de cada veículo (PJ): substitui os veículos e condutores atuais (vazia remove todos). Mesmas regras do cadastro.

curl -X 'PUT' \
 'https://api.gipepark.com.br/api/v1/Mensalista/1' \
 -H 'accept: _/_' \
 -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6Ijc3NmMxMWYzLThiNzQtNDE5Ni1hNGM3LTA4MThlOWIxNzI3NSIsImVtcHJlc2FfZ3VpZCI6IjViZTM4Yzc3LWJjZDItNDYyZi1hMmYzLTkyZDdhNzdkZDQ4YyIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InJlbmF0b3JvZXNzbGVyQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJyZW5hdG9yb2Vzc2xlckBnbWFpbC5jb20iLCJqdGkiOiIzZmU4YzFlMS0zNTJlLTQzNDUtYWRmMy01YzY1MDFjYjQ1ZTUiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBZG1pbmlzdHJhZG9yIiwiZXhwIjoxNzkyNTY0ODk5LCJpc3MiOiJnaXBlLWF1dGgtc2VydmljZSIsImF1ZCI6ImdpcGUtYXBpIn0.b4C6R0tUhucScRPMxnuT-RmuXA3efzoQYjRSplecdpY' \
 -H 'Content-Type: application/json' \
 -d '{
"mensalistaTipoId": 0,
"tipoPessoa": 1,
"documento": "string",
"nome": "string",
"email": "string",
"celular": "string",
"diaVencimento": 0,
"ativo": true,
"veiculos": [
{
"placa": "string",
"modelo": "string",
"cor": "string",
"categoria": 1,
"condutores": [
{
"nome": "string",
"cpf": "string"
}
]
}
]
}'

Code Description Links
200
Mensalista atualizado

No links
400
Mensalista não existe, dados inválidos, troca de tipo de pessoa, tipo inativo, categoria do veículo diferente da do tipo, placa de outro mensalista ou condutores ausentes (PJ) / enviados (PF)

No links
401
Não autenticado

No links
403
Perfil sem permissão

</endpoint_put_mensalista>

<endpoint_get_contrato_cliente>

Não exige autenticação: é a tela que o mensalista abre pelo link do e-mail. Informe o token de 10 caracteres. O link do e-mail é a base Contrato:LinkAceite do appsettings seguida do token (hoje https://evertonoliveira30br.github.io/gipe-iu-mobile-teste/contrato/?t={token}): a tela lê o t e chama este endpoint.

Retorna razaoSocial, nomeMensalista, versao, titulo, conteudo (texto simples: preserve as quebras de linha ao exibir), hash, status, tokenExpiracao e dataAceite. Contrato já aceito continua disponível pelo link; pendente com o link vencido responde 400.

</endpoint_get_contrato_cliente>

<endpoint_post_contrato_cliente>
Não exige autenticação. O mensalista confirma o próprio documento (documento: CPF, ou CNPJ para pessoa jurídica, com ou sem máscara) e aceita o contrato do token.

Grava as evidências: data e hora, IP, navegador (User-Agent) e o documento informado, junto com o hash do texto. Envia por e-mail a confirmação com o texto aceito e o hash. Libera o primeiro pagamento do mensalista. Retorna dataAceite e hash. Limite de 10 tentativas por minuto por IP.

{
"token": "string",
"documento": "string"
}

</endpoint_post_contrato_cliente>

<endpoint_post_tipo>
Sempre criado ativo. Retorna { mensalistaTipoId }.

tipoMensal: nome livre (Diurno, Noturno, Integral...), até 100 caracteres. Não pode repetir nome + categoria entre os tipos ativos.
categoria: ECategoria (99 = todas as categorias).
valorMensalidade: maior que zero.
horarioEntrada / horarioSaida: opcionais, mas juntos. Saída menor que a entrada é permitido (ex.: 19:00 às 07:00).
toleranciaDiasAtraso: 0 a 31 (padrão 0). Dias de atraso da mensalidade em que o mensalista ainda entra como mensalista; passado o limite, ele é inativado na entrada. Ex.: vencimento 17/10 e tolerância 3 → mensalista até 20/10.
quantidadeVagas: 1 a 99 (padrão 1). Quantos veículos do mensalista podem estar no pátio como mensalista ao mesmo tempo; com as vagas ocupadas, o próximo entra como rotativo.
domingo, segunda, terca, quarta, quinta, sexta, sabado: booleanos (padrão false). Dias da semana em que o mensalista entra como mensalista, pelo dia da entrada; fora deles, entra como rotativo.

{
"tipoMensal": "string",
"categoria": 1,
"valorMensalidade": 0,
"horarioEntrada": "string",
"horarioSaida": "string",
"toleranciaDiasAtraso": 0,
"quantidadeVagas": 0,
"domingo": true,
"segunda": true,
"terca": true,
"quarta": true,
"quinta": true,
"sexta": true,
"sabado": true,
"ativo": true
}
</endpoint_post_tipo>

<endpoint_Get_tipo>

Ativos e inativos: ativos primeiro, depois por nome e categoria. Traz o nome de quem criou e de quem fez a última alteração.
<endpoint_Get_tipo>

<endpoint_put_tipo>

Envie todos os campos; ativo: false desativa o tipo.

{
"tipoMensal": "string",
"categoria": 1,
"valorMensalidade": 0,
"horarioEntrada": "string",
"horarioSaida": "string",
"toleranciaDiasAtraso": 0,
"quantidadeVagas": 0,
"domingo": true,
"segunda": true,
"terca": true,
"quarta": true,
"quinta": true,
"sexta": true,
"sabado": true,
"ativo": true
}
<endpoint_put_tipo>
