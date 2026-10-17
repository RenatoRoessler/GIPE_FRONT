# PRD: Saída de veículos em duas fases (localizar, depois pagar)

## Problema
Hoje a tela de saída mostra tudo ao mesmo tempo: leitura do QR, busca manual, resumo do veículo e pagamento. No celular, onde o operador trabalha em pé e com pressa, isso cria uma tela longa e cheia: o pagamento aparece vazio antes de existir veículo, e os campos de busca continuam ocupando espaço depois que o veículo já foi encontrado. O operador precisa rolar e decidir o que olhar, e não há um caminho claro para voltar e procurar outro veículo.

## Objetivo
O operador vê primeiro só o que precisa para **localizar** o veículo. Assim que o veículo é encontrado, a tela passa a mostrar apenas os **dados do veículo e o pagamento**, e um botão permite **voltar para a pesquisa** quando a pessoa errou de veículo ou quer procurar outro.

## Usuário-alvo
Operadores da portaria e do caixa (Administrador, Gerente, Caixa e Manobrista) no momento em que o cliente retira o veículo, geralmente no celular ou tablet, com fila e pouco tempo por atendimento. O registro continua exigindo caixa aberto.

## Requisitos funcionais
- RF1 (Fase de pesquisa): ao abrir **Registrar saída**, a tela mostra somente o necessário para localizar o veículo: a leitura de QR Code e a busca manual (placa, token ou sequencial). Não aparecem dados do veículo, valor nem pagamento.
- RF2: a busca e a leitura de QR funcionam como hoje: um identificador por vez, validação de placa, token e sequencial, mensagens para QR inválido, token inexistente e veículo fora do pátio. Essas mensagens aparecem na própria fase de pesquisa e o operador pode corrigir e tentar de novo.
- RF3 (Mudança de fase): quando o veículo é encontrado, por QR ou busca manual, a tela passa automaticamente para a fase de dados e pagamento, sem exigir um botão "continuar".
- RF4 (Fase de dados e pagamento): mostra apenas os dados do veículo (placa, modelo e cor, categoria, entrada, permanência, indicação de mensalista) e o valor a cobrar, seguidos da forma de pagamento e do botão **Confirmar Saída**. A leitura de QR e a busca manual não aparecem nesta fase.
- RF5 (Voltar para a pesquisa): na fase de dados e pagamento existe um botão **Voltar para a pesquisa**, sempre visível e fácil de tocar. Ao usá-lo, o operador retorna à fase de pesquisa com a busca vazia e pronta para um novo veículo, a leitura de QR é reativada e o que foi preenchido no pagamento (forma escolhida e valor recebido) é descartado.
- RF6: o botão **Voltar para a pesquisa** não fica disponível enquanto a saída está sendo registrada, e deixa de existir depois que a saída foi registrada (o recibo só oferece Imprimir e Concluir).
- RF7: o valor e o tempo de permanência continuam sendo atualizados enquanto a fase de dados está aberta, e continuam sendo recalculados antes de registrar; se o valor mudou, o novo valor é mostrado e é preciso confirmar de novo.
- RF8: a forma de pagamento, o cálculo do troco em dinheiro, a confirmação, o tratamento de erro de registro (mantendo os dados) e o recibo com **Imprimir** e **Concluir** continuam como estão.
- RF9: a câmera só fica ligada na fase de pesquisa: desliga ao encontrar o veículo e liga de novo ao voltar para a pesquisa. Fechar o modal em qualquer fase desliga a câmera.
- RF10: fechar o modal na fase de dados e pagamento pede confirmação antes de descartar, como hoje. Na fase de pesquisa, só pede confirmação se houver algo digitado ou lido.
- RF11: a mudança entre fases é anunciada para leitores de tela e o foco vai para o início do conteúdo da nova fase; o título do modal indica a fase atual.

## Fora de escopo
- Mudanças no cálculo de valor, nas regras de preço e nas formas de pagamento oferecidas.
- Mudanças no recibo, na impressão e no fluxo de entrada.
- Pesquisa por outros critérios além de QR, placa, token e sequencial.
- Guardar o último veículo ou a lista de saídas recentes.
- Registrar mais de uma saída sem fechar o modal.

## Critérios de aceite
- [ ] Dado um usuário que abre **Registrar saída**, então vê só a leitura de QR e a busca manual, sem resumo, valor nem pagamento.
- [ ] Dado a fase de pesquisa, quando lê um QR válido ou digita uma placa, token ou sequencial que existe no pátio, então a tela passa sozinha para a fase de dados e pagamento.
- [ ] Dado um QR inválido, token inexistente ou veículo fora do pátio, então a mensagem aparece na fase de pesquisa e o operador continua nela, podendo tentar de novo.
- [ ] Dado a fase de dados e pagamento, então aparecem os dados do veículo, o valor, a forma de pagamento e **Confirmar Saída**, e não aparecem a leitura de QR nem a busca manual.
- [ ] Dado a fase de dados e pagamento, quando toca em **Voltar para a pesquisa**, então volta à pesquisa com os campos vazios, a câmera ligada e o pagamento descartado.
- [ ] Dado que a saída está sendo registrada, então **Voltar para a pesquisa** fica indisponível; depois de registrada, o recibo não mostra esse botão.
- [ ] Dado que o valor mudou desde a última exibição, quando confirma, então o novo valor é mostrado e nada é registrado até nova confirmação.
- [ ] Dado Dinheiro, quando o valor recebido é menor que o valor a cobrar, então **Confirmar Saída** fica desabilitado; em Crédito, Débito e Pix não há valor recebido nem troco.
- [ ] Dado qualquer fase, quando o modal é fechado, então a câmera é desligada; com algo em andamento, pede confirmação antes de descartar.
- [ ] A troca de fase é anunciada por leitor de tela e o fluxo é utilizável por teclado, em celular e desktop (WCAG 2.2 AA).

## Métricas de sucesso (se aplicável)
- Tempo médio para dar saída (da abertura do modal ao recibo) menor do que o fluxo atual em tela única.
- Queda nos casos em que o operador precisa rolar a tela para alcançar o pagamento.
- Saídas registradas para o veículo errado, corrigidas com **Voltar para a pesquisa** antes da confirmação (acompanhar o uso do botão).

## Pontos em aberto
- Ao voltar para a pesquisa, a busca fica vazia (assumido). Alternativa: manter o último texto digitado para o operador corrigir um erro de digitação.
- A mudança para a fase de dados é automática (assumido, sem botão "continuar"). Se o operador quiser conferir o que digitou antes de avançar, pode ser preciso um passo explícito.
- Uma saída em andamento no pagamento é descartada ao voltar para a pesquisa, sem pedir confirmação (assumido, pois nada foi registrado). Confirmar se vale perguntar quando já houver valor recebido preenchido.
