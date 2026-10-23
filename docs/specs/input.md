<task>finalizar caixa </task>
<description>

analise o que foi feito no caixa
valide tudo contra os endpoints abaixo (swagger da API GIPE v1, só o módulo Caixa) e implemente no front o que falta ser feito referente ao caixa

implemente uma visão melhorada do caixa

Todos os endpoints: autenticação Bearer. Respostas comuns: 401 (não autenticado) e 403 (perfil sem permissão).

## Endpoints

### POST /api/v1/Caixa/abrir — Abre o caixa da empresa (16/07/2026)
Perfis: Administrador, Gerente, Caixa, Manobrista (padrão; a permissão por módulo pode alterar)

Abre o caixa com o valor de fundo informado e já abre o primeiro turno, de quem abriu. O fundo vira o valor inicial do turno. Só pode existir um caixa aberto por empresa.

Corpo: `AbrirCaixaRequestDto` `{ valorFundoCaixa: number }`
Respostas: 200 OK, 201 Caixa aberto, 400 já existe caixa aberto ou dados inválidos.

### PUT /api/v1/Caixa/fechar — Fecha o turno aberto e o caixa (16/07/2026)
Perfis: Administrador, Gerente, Caixa, Manobrista (padrão; a permissão por módulo pode alterar)

Fecha o turno com a conferência por forma de pagamento e depois o caixa, numa operação só. No dinheiro, informe o valor sem o fundo do caixa (o esperado também não inclui o fundo); o fundo contado na gaveta vai em `valorFundoCaixa` (opcional, não pode ser negativo) e fica gravado no caixa, aparecendo no histórico como `valorFundoCaixaFechamento`. Boleto (5) e transferência bancária (6) só aparecem quando têm movimento no turno. Retorna o resumo do turno encerrado, no mesmo formato de `turnos`.

Corpo: `FecharCaixaRequestDto`
```
{
  conferencias: [ { formaPagamento: EFormaPagamento, valorInformado: number } ],
  valorFundoCaixa: number | null,   // fundo contado na gaveta no fechamento; opcional
  observacao: string | null
}
```
Respostas: 200 Caixa fechado, 400 não há caixa aberto ou dados inválidos.

### GET /api/v1/Caixa — Retorna o caixa aberto da empresa (16/07/2026)
Perfis: Administrador, Gerente, Caixa, Manobrista (padrão; a permissão por módulo pode alterar)

Os totais são calculados na hora a partir dos movimentos de todos os turnos do caixa: `valorTotalEntrada` (entradas), `valorTotalSaida` (saídas, estornos e sangrias) e `saldoAtual` (entradas menos saídas). Não incluem o `valorFundoCaixa`.

Respostas: 200 Caixa aberto, 404 não há caixa aberto.

### GET /api/v1/Caixa/turno — Retorna o turno aberto com o parcial por forma de pagamento (11/10/2026)
Perfis: Administrador, Gerente, Caixa, Manobrista (padrão; a permissão por módulo pode alterar)

Traz `formasPagamento` com `formaPagamento`, `descricao`, `entradas` e `saidas` de cada forma, e os totais do turno: `totalEntradas` (soma das entradas de todas as formas) e `totalSaidas` (soma das saídas, incluindo estornos e sangrias). Os totais não incluem o `valorFundoCaixa` (dinheiro na gaveta no início do turno). Boleto (5) e transferência bancária (6) só aparecem quando têm movimento no turno. `disponivelSangria` é o dinheiro esperado na gaveta menos o fundo com que o caixa foi aberto, que sempre fica na gaveta.

Respostas: 200 Turno aberto, 404 não há turno aberto.

### GET /api/v1/Caixa/turnos — Lista os turnos do caixa aberto (11/10/2026)
Perfis: Administrador, Gerente, Caixa, Manobrista (padrão; a permissão por módulo pode alterar)

Do mais antigo para o mais recente. Cada turno traz:
- `valorFundoCaixa`: dinheiro na gaveta no início do turno (no primeiro turno, o fundo do caixa);
- `saldoCaixa`: soma do esperado das formas de pagamento, sem o fundo; `totalSaida`: soma das saídas, incluindo estornos e sangrias;
- no turno fechado, `saldoCaixaInformado` (soma do conferido), `totalDiferenca` e `observacao`.

Em `formasPagamento`, `valorEsperado` é entradas menos saídas; no dinheiro (1) também não inclui o fundo. Turnos fechados trazem o valor informado e a diferença por forma de pagamento. Boleto (5) e transferência bancária (6) só aparecem quando têm movimento no turno.

Respostas: 200 Turnos do caixa, 404 não há caixa aberto.

### POST /api/v1/Caixa/turno/passagem — Passa o turno para o usuário logado (11/10/2026)
Perfis: Administrador, Gerente, Caixa, Manobrista (padrão; a permissão por módulo pode alterar)

Feita por quem **assume** o turno, logado com o próprio usuário. Fecha o turno atual com a conferência por forma de pagamento (forma não informada conta como zero) e abre o turno do usuário logado na mesma operação. No dinheiro, informe o valor sem o fundo do caixa (o esperado também não inclui o fundo). `valorFundoCaixa` é o dinheiro que fica na gaveta para o novo turno (vira o `valorFundoCaixa` dele); se nulo, assume o fundo do turno encerrado mais o dinheiro conferido.

Corpo: `PassagemTurnoRequestDto`
```
{
  conferencias: [ { formaPagamento: EFormaPagamento, valorInformado: number } ],
  valorFundoCaixa: number | null,   // dinheiro que fica na gaveta para o novo turno
  observacao: string | null
}
```
Respostas: 200 Turno passado, 400 não há turno aberto, o turno já é do usuário logado ou dados inválidos.

### POST /api/v1/Caixa/sangria — Registra uma sangria no turno aberto (11/10/2026)
Perfis: Administrador, Gerente, Caixa (padrão; a permissão por módulo pode alterar)

Retira dinheiro da gaveta (saída em dinheiro, origem Sangria). O motivo é obrigatório e o valor não pode passar do disponível: dinheiro esperado no turno menos o fundo com que o caixa foi aberto, que sempre fica na gaveta. Retorna o turno atualizado.

Corpo: `SangriaRequestDto` `{ valor: number, observacao: string }` (observacao = motivo da retirada, ex.: "Recolhimento para o cofre")
Respostas: 200 Sangria registrada, 400 valor acima do disponível, sem turno aberto ou dados inválidos.

### GET /api/v1/Caixa/movimentos — Lista os movimentos do caixa aberto (11/10/2026)
Perfis: Administrador, Gerente, Caixa, Manobrista (padrão; a permissão por módulo pode alterar)

Entradas, saídas e sangrias, do mais recente para o mais antigo, com turno, usuário, forma de pagamento e motivo.

Respostas: 200 Movimentos do caixa, 404 não há caixa aberto.

### GET /api/v1/Caixa/historico — Lista os caixas já fechados (13/10/2026)
Perfis: Administrador, Gerente (padrão; a permissão por módulo pode alterar)

Do mais recente para o mais antigo, com quem abriu, quem fechou e os totais do fechamento.

Parâmetros de query:
- `dataInicio` e `dataFim` (date, opcionais): filtram pelo dia da abertura do caixa (os dois dias inclusos).
- `pagina` (int): padrão 1.
- `tamanhoPagina` (int): padrão 20, máximo 100.

Respostas: 200 Página de caixas fechados, 400 data inicial maior que a final.

### GET /api/v1/Caixa/historico/{caixaId}/movimentos — Lista os movimentos de um caixa fechado (13/10/2026)
Perfis: Administrador, Gerente (padrão; a permissão por módulo pode alterar)

Extrato detalhado do caixa: entradas, saídas e sangrias, do mais recente para o mais antigo, com turno, usuário, forma de pagamento e motivo. Para o caixa aberto, use `GET /Caixa/movimentos`.

Parâmetro de rota: `caixaId` (int64).
Respostas: 200 Movimentos do caixa, 400 o caixa ainda está aberto, 404 caixa não encontrado.

## Enum EFormaPagamento (caixa e pátio)
1 Dinheiro, 2 Pix, 3 Cartão de débito, 4 Cartão de crédito, 5 Boleto, 6 Transferência bancária.
Não confundir com EMetodoPagamento, que é da cobrança da assinatura do sistema.

## Conferência (ConferenciaFormaPagamentoDto)
`{ formaPagamento: EFormaPagamento, valorInformado: number }` — valor contado/conferido de uma forma de pagamento. Formas não informadas são consideradas com valor zero. No dinheiro, sem o fundo do caixa.

</description>
