# PRD: Movimentação de Veículos

## Problema
O núcleo da operação do estacionamento é registrar quando um veículo entra, quando sai e quanto deve ser cobrado, aplicando as regras de preço e eventuais descontos de convênio. Hoje não existe nenhum registro de entrada/saída de veículos.

## Objetivo
Um operador (caixa/manobrista) consegue registrar a entrada de um veículo, registrar sua saída com cálculo automático do valor devido e emissão de nota fiscal, e uma empresa conveniada consegue conceder desconto para uma entrada específica informando placa e código.

## Usuário-alvo
Operadores de caixa e manobristas no dia a dia do estacionamento, e representantes de empresas conveniadas que concedem desconto aos seus clientes.

## Requisitos funcionais

### Entrada de veículos
- RF1: Campo placa.
- RF2: Campo hora de entrada.
- RF3: Campo categoria, enum: 1 = Carro, 2 = Moto, 3 = Caminhonete, 4 = SUV, 99 = Todas.
- RF4: Registro do operador que realizou a entrada (pode não ser exibido na tela, mas deve ser persistido).
- RF5: Botão "dar entrada" que registra a entrada do veículo.

### Saída de veículos
- RF6: Campo placa.
- RF7: Campo hora de saída.
- RF8: Valor da cobrança calculado pelo backend com base nas regras de preço vigentes e no tempo de permanência.
- RF9: Exibição do tempo de permanência do veículo.
- RF10: Campo forma de pagamento (enum a definir com o negócio: ex. dinheiro, cartão débito, cartão crédito, PIX).
- RF11: Indicação de convênio aplicado à saída, quando existente.
- RF12: Botão "gerar nota fiscal" que emite a nota fiscal referente à cobrança.

### Desconto para empresa conveniada
- RF13: Campo código da entrada.
- RF14: Campo placa.
- RF15: Botão confirmar, que aplica o desconto da empresa conveniada àquela entrada específica.

## Fora de escopo
- Definição das regras de preço em si (consumidas do PRD de Gestão de Preços).
- Integração fiscal real com SEFAZ/emissor de nota fiscal (apenas o botão e o fluxo de disparo fazem parte deste PRD).
- Pagamento online/gateway de pagamento.
- Controle de vagas/ocupação do pátio.

## Critérios de aceite
- [ ] É possível registrar a entrada de um veículo com placa, hora de entrada e categoria.
- [ ] O operador responsável pela entrada é persistido no registro.
- [ ] Ao dar saída informando a placa, o sistema calcula automaticamente o valor a cobrar com base nas regras de preço vigentes.
- [ ] O tempo de permanência é exibido corretamente na tela de saída.
- [ ] Quando há convênio aplicável, o desconto/condição do convênio é refletido no valor da saída.
- [ ] O botão "gerar nota fiscal" dispara a emissão da nota referente à saída.
- [ ] Uma empresa conveniada consegue aplicar desconto a uma entrada informando código da entrada e placa, e confirmando.
- [ ] Desconto só é aplicado se código da entrada e placa forem coerentes com uma entrada existente e ainda não finalizada.
- [ ] Telas funcionam de forma responsiva em desktop e mobile.

## Métricas de sucesso
- Tempo médio de atendimento na saída (do início do registro até a nota emitida).
- Percentual de saídas com valor calculado automaticamente sem intervenção manual.
