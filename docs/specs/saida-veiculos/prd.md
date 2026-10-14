# PRD: Registrar Saída de Veículo

## Problema
Hoje não há como dar saída a um veículo no pátio pelo sistema. O operador precisa localizar o veículo (que nem sempre está com a placa à mão: o cliente pode ter só o ticket), ver quanto deve ser cobrado, receber o pagamento e entregar um comprovante, sempre com rapidez e sem erro de valor.

## Objetivo
Ao final, o operador consegue dar saída a um veículo em um fluxo guiado de quatro etapas, aberto por um atalho na Home: consultar o veículo e o valor, conferir os dados, receber o pagamento (com troco, quando for em dinheiro) e emitir o recibo.

## Usuário-alvo
Operadores da portaria e do caixa (Administrador, Gerente, Caixa e Manobrista) no momento em que o cliente retira o veículo, geralmente com fila e pouco tempo por atendimento. O registro só é possível com o caixa aberto.

## Requisitos funcionais
- RF1: A Home exibe o atalho **Registrar saída**, no mesmo estilo do atalho **Registrar entrada**. A tela Saída de Veículos também oferece o mesmo atalho. Ambos abrem o mesmo modal, que tem quatro etapas: Consultar, Conferir, Pagamento e Recibo, com indicação da etapa atual.
- RF2 (Etapa 1 — Consultar valores): o usuário informa **um** entre Placa, Código do ticket e Sequencial. Ao preencher um, os outros dois ficam desabilitados; ao limpá-lo, são liberados. A placa segue os padrões antigo (ABC1234) e Mercosul (ABC1D23), com a mensagem "Placa inválida. Informe no padrão antigo (ABC1234) ou Mercosul (ABC1D23)". Ticket e sequencial aceitam só números inteiros. Sem nenhum campo preenchido, não é possível avançar.
- RF3: Ao consultar, o sistema busca o veículo no pátio e calcula o valor até aquele momento. Se o veículo não estiver no pátio, a mensagem é exibida na própria etapa e o usuário pode corrigir o dado e tentar de novo.
- RF4 (Etapa 2 — Conferir): exibe os dados retornados pela consulta: placa, modelo, cor, categoria, código do ticket, sequencial, se é mensalista, data e hora de entrada, data e hora da saída (momento da consulta), tempo de permanência, tabela de preço aplicada e **valor a cobrar**. Esta etapa é somente leitura. O usuário pode voltar à etapa 1 para consultar outro veículo, ou avançar.
- RF5 (Etapa 3 — Pagamento): o usuário escolhe a forma de pagamento: Dinheiro, Pix, Cartão de débito, Cartão de crédito, Boleto ou Transferência bancária. O valor a cobrar é exibido e não pode ser alterado. Em dinheiro, o usuário informa o **valor recebido** e o sistema mostra o **troco**; valor recebido menor que o valor a cobrar impede a confirmação. Nas demais formas não há valor recebido nem troco.
- RF6: Ao confirmar o pagamento, o sistema **recalcula o valor antes de registrar a saída**. Se o valor mudou desde a consulta, o novo valor e o novo tempo de permanência são mostrados, o troco é recalculado e o usuário precisa confirmar novamente. Se não mudou, a saída é registrada.
- RF7: O registro da saída só ocorre uma vez por confirmação; botões ficam bloqueados enquanto o envio está em andamento. Se falhar (sem caixa aberto, veículo que já saiu, sem permissão ou falha de rede), o motivo é exibido na etapa de pagamento, os dados informados são mantidos e o usuário pode tentar de novo.
- RF8 (Etapa 4 — Recibo): após a saída registrada, o recibo é exibido no modal com: nome da empresa, placa, categoria, modelo e cor, entrada, saída, tempo de permanência, tabela aplicada, forma de pagamento, valor cobrado e, em dinheiro, valor recebido e troco. O recibo tem o botão **Imprimir** (impressão do navegador, inclusive salvar como PDF), que imprime só o recibo.
- RF9: O modal pode ser fechado a qualquer momento antes do envio do pagamento. Depois que a saída é registrada, o usuário só encerra pelo botão **Concluir** (ou ao fechar o modal), e um aviso "Saída registrada." é exibido.
- RF10: Mensalistas e valor zero: se o valor a cobrar for R$ 0,00, a etapa de pagamento ainda é exibida para confirmar a saída, sem exigir valor recebido. [A DEFINIR] com o negócio se mensalista pula o pagamento.

## Fora de escopo
- Emissão de nota fiscal.
- Pagamento dividido em mais de uma forma, ou integração com maquininha/Pix.
- Descontos manuais, desconto de convênio e alteração do valor calculado.
- Estorno ou cancelamento de uma saída já registrada.
- Envio do recibo por e-mail ou mensagem; geração de arquivo PDF próprio (apenas impressão do navegador).
- Listagem do pátio.

## Critérios de aceite
- [ ] Dado um usuário logado, quando abre a Home ou a tela Saída de Veículos, então vê o atalho **Registrar saída** e ele abre o modal na etapa 1.
- [ ] Dado a etapa 1, quando preenche um dos três campos, então os outros dois ficam desabilitados; quando o limpa, voltam a ficar habilitados.
- [ ] Dado a etapa 1 sem nenhum campo preenchido, quando tenta consultar, então vê a orientação de preencher um e não avança.
- [ ] Dado uma placa fora dos padrões, quando tenta consultar, então vê "Placa inválida. Informe no padrão antigo (ABC1234) ou Mercosul (ABC1D23)".
- [ ] Dado um veículo que não está no pátio, quando consulta, então vê a mensagem na etapa 1 e pode tentar de novo.
- [ ] Dado uma consulta bem-sucedida, então a etapa 2 mostra todos os dados do RF4 e o valor a cobrar, e permite voltar à etapa 1.
- [ ] Dado a etapa 3 com Dinheiro, quando informa valor recebido igual ou maior que o valor a cobrar, então o troco é exibido corretamente; quando menor, não consegue confirmar.
- [ ] Dado Pix, cartões, boleto ou transferência, então não há campo de valor recebido nem troco.
- [ ] Dado que o valor mudou desde a consulta, quando confirma, então o novo valor é exibido e nada é registrado até nova confirmação.
- [ ] Dado que o valor não mudou, quando confirma, então a saída é registrada e a etapa 4 é exibida.
- [ ] Dado que não há caixa aberto, quando confirma, então o motivo aparece na etapa de pagamento e os dados informados são mantidos.
- [ ] Dado o envio em andamento, então não é possível confirmar uma segunda vez nem fechar o modal.
- [ ] Dado o recibo, quando clica em **Imprimir**, então imprime apenas o recibo, com todas as informações do RF8.
- [ ] O fluxo é utilizável por teclado e leitor de tela (WCAG 2.2 AA), com a etapa atual anunciada, em desktop e mobile.

## Métricas de sucesso (se aplicável)
- Tempo para dar saída a um veículo (da abertura do modal ao recibo): menos de 45 segundos.
- Saídas registradas com valor divergente do calculado no momento da cobrança: zero.

## Pontos em aberto
- Mensalista (valor zero) pula a etapa de pagamento? [A DEFINIR]
- O atalho também na tela Saída de Veículos foi assumido, por coerência com a entrada (a descrição pede só a Home).
- O nome e demais dados da empresa no recibo vêm do cadastro da empresa; confirmar quais campos devem aparecer (CNPJ, endereço).
- Confirmar se a consulta recalcula o valor a cada chamada (a data/hora de saída muda a cada consulta), base do RF6.
