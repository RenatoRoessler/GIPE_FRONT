# PRD: Módulo de Faturas

## Problema
Quando um veículo de uma empresa conveniada sai do pátio, o sistema calcula quanto cabe à conveniada pagar (a parte dela, de acordo com a regra do convênio). Esses valores ficam acumulados em cada saída, mas não há como juntá-los para cobrar a conveniada. Hoje o estacionamento precisa somar as saídas à mão, sem saber ao certo quais já foram cobradas, e não tem onde registrar se a conveniada pagou. O resultado é cobrança manual, sujeita a erro e a saída cobrada duas vezes ou esquecida.

## Objetivo
O GIPE ganha um módulo de **Faturas** em que o estacionamento junta as saídas ainda não cobradas da conveniada em uma fatura com vencimento, acompanha as faturas emitidas e registra o pagamento ou o cancelamento. Cada saída fica ligada a uma única fatura, e o sistema mostra a situação de cada uma.

## Usuário-alvo
Administrador, Gerente e Financeiro (perfis padrão do módulo; quando a empresa configura a permissão por módulo, ela prevalece). Uso típico: o responsável financeiro do estacionamento, geralmente em computador, fechando a cobrança da conveniada ao fim do período e dando baixa quando o pagamento chega.

## Requisitos funcionais

### Acesso
- RF1: O módulo Faturas aparece na navegação somente para quem tem permissão (padrão: Administrador, Gerente e Financeiro). Sem permissão, a entrada não aparece e o acesso direto às telas é negado, como nas demais áreas.
- RF2: O módulo entra na tela de permissões por módulo, para a empresa poder mudar quais perfis o acessam.
- RF3: Todas as telas do módulo são responsivas e funcionam por completo em computador e em celular.

### Emitir fatura
- RF4: O usuário emite uma fatura para a empresa conveniada do estacionamento, informando o **vencimento** (obrigatório, de hoje em diante) e uma **observação** (opcional, até 500 caracteres). A conveniada pode estar com o convênio inativo e ainda assim ser faturada.
- RF5: A fatura reúne **todas** as saídas dessa conveniada que estão em aberto (ainda sem fatura) e com valor a cobrar da conveniada. Não é possível escolher só algumas saídas.
- RF6: Saídas em que a parte da conveniada é zero não entram na fatura.
- RF7: Ao emitir, as saídas incluídas passam a "Faturado" e ficam ligadas à fatura. A fatura guarda a quantidade de saídas e a soma do valor da conveniada, e registra quem emitiu e quando.
- RF8: Depois de emitir, o usuário vê a fatura criada com as suas saídas.
- RF9: Se não houver nenhuma saída a faturar, a tela informa o motivo e nenhuma fatura é criada.

### Consultar faturas
- RF10: A lista mostra as faturas do estacionamento da mais recente para a mais antiga, paginada (20 por página por padrão, até 100). Cada linha traz, no mínimo: conveniada, quantidade de saídas, valor total, vencimento, situação e data de emissão.
- RF11: A lista pode ser filtrada por **conveniada** e por **situação** (Aberta, Paga ou Cancelada).
- RF12: Ver o detalhe de uma fatura: dados da fatura com emissão (quem e quando), pagamento (quem, quando, forma e valor pago, se houver) e cancelamento (quem e quando, se houver), mais a lista das saídas incluídas, da mais antiga para a mais recente.
- RF13: Cada saída do detalhe mostra placa, modelo, categoria, data e hora de entrada e de saída, tempo de permanência, a tabela de convênio usada, a regra da conveniada (percentual ou valor fixo) e os valores: total da permanência, parte da conveniada e parte do cliente.
- RF14: A situação da fatura (Aberta, Paga, Cancelada) aparece sempre identificada por texto, não só por cor.

### Registrar pagamento
- RF15: Só é possível registrar o pagamento de fatura **aberta**. Informa-se a **forma de pagamento** (obrigatória), o **valor pago** (opcional, maior que zero; vazio = valor total da fatura) e a **data do pagamento** (opcional, até hoje; vazia = agora).
- RF16: Ao registrar, a fatura passa a "Paga" e todas as suas saídas passam a "Pago". A fatura guarda quem registrou e quando.
- RF17: O pagamento da fatura **não entra no caixa** do estacionamento. A tela deixa isso claro antes de confirmar, para o usuário não procurar o valor na conferência do caixa.

### Cancelar fatura
- RF18: Só é possível cancelar fatura **aberta**; fatura paga não pode ser cancelada. O cancelamento pede confirmação, que explica que as saídas voltam a ficar em aberto.
- RF19: A fatura cancelada não é apagada: continua na lista como "Cancelada", com quem cancelou e quando.
- RF20: As saídas de uma fatura cancelada voltam a "Aberto", sem fatura, e entram na próxima fatura emitida para a conveniada.

## Fora de escopo
- Acesso da própria conveniada à fatura (por link, portal ou perfil de conveniada), envio por e-mail ou mensagem.
- Gerar PDF, imprimir ou exportar a fatura.
- Escolher saídas específicas, emitir por período ou incluir saídas manualmente.
- Editar uma fatura emitida (vencimento, observação ou saídas).
- Registrar pagamento parcial em mais de uma parcela, juros, multa ou desconto por atraso.
- Cobrança automática, lembretes e marcação automática de fatura vencida.
- Lançar o pagamento no caixa ou no fluxo de caixa do módulo Financeiro.
- Emissão de nota fiscal da fatura.

## Critérios de aceite
- [ ] Quem tem permissão vê "Faturas" no menu e abre o módulo; quem não tem não vê a entrada e tem o acesso direto negado.
- [ ] Emitir fatura com vencimento válido reúne todas as saídas em aberto com valor da conveniada, e elas passam a "Faturado".
- [ ] Saídas com a parte da conveniada zerada não aparecem na fatura.
- [ ] A fatura emitida mostra a quantidade de saídas e o valor total iguais à lista de saídas exibida.
- [ ] Vencimento anterior a hoje e observação com mais de 500 caracteres são recusados com mensagem clara.
- [ ] Sem saídas a faturar, nenhuma fatura é criada e a tela explica o motivo.
- [ ] A lista mostra as faturas da mais recente para a mais antiga, pagina, e filtra por conveniada e por situação.
- [ ] O detalhe mostra emissão, pagamento e cancelamento (quando houver) e as saídas na ordem da mais antiga para a mais recente, com todos os dados do RF13.
- [ ] Registrar pagamento de fatura aberta muda a fatura para "Paga" e as saídas para "Pago"; sem informar valor, o valor pago é o total; data futura é recusada.
- [ ] A tela de pagamento avisa que o valor não entra no caixa.
- [ ] Fatura paga ou cancelada não oferece pagar nem cancelar.
- [ ] Cancelar fatura aberta (com confirmação) a deixa "Cancelada", com quem e quando, e as saídas voltam a "Aberto" e entram na próxima fatura.
- [ ] Todas as telas funcionam em celular e em computador, nos temas claro e escuro.

## Métricas de sucesso (se aplicável)
Sem métricas numéricas. Sucesso = o estacionamento fecha a cobrança de uma conveniada em poucos passos, sem somar saídas fora do sistema, e nenhuma saída aparece em duas faturas.

## Pontos em aberto
- **Onde fica no menu:** esta versão assume um item próprio "Faturas", com permissão própria, e não uma tela dentro de Financeiro. Confirmar.
- **Valor pago diferente do total:** o pedido permite informar um valor pago, mas não diz o que acontece se for menor ou maior que o total (a fatura fica quitada mesmo assim?). Esta versão registra o valor informado e marca a fatura como paga; confirmar se isso basta ou se deve haver aviso ou restrição.
- **Conveniada única:** o pedido trata a conveniada "do estacionamento" como um dado informado ao emitir (`empresaConveniadaId`). A tela deve deixar o usuário escolher a conveniada, entre as do estacionamento; confirmar se a lista é a das empresas conveniadas já cadastradas.
- **Identificador para a conveniada:** a fatura gera um identificador único que "vai para a conveniada". Como ela o usa (link, consulta) não está definido e fica fora desta versão.
- **Endereço do pagamento:** o texto do pedido descreve o pagamento mas não mostra o caminho da chamada correspondente; isso é detalhe técnico a confirmar no Tech Spec.
