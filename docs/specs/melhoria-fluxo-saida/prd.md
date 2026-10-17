# PRD: Melhoria do fluxo de saída de veículos

## Problema
O fluxo atual de saída é um modal de quatro etapas (Consultar, Conferir, Pagamento, Recibo). Para o operador em campo, com fila e pouco tempo, isso significa vários toques e telas para um atendimento simples. O operador também precisa digitar placa, ticket ou sequencial, embora o cliente já tenha em mãos o cupom de entrada com um QR code que identifica a entrada por token.

## Objetivo
O operador registra a saída em uma **única tela**, aberta no mesmo modal: lê o QR do cupom com a câmera (ou busca manualmente), vê na hora os dados do veículo e o valor atualizado, escolhe a forma de pagamento e confirma. O recibo continua sendo emitido ao final.

## Usuário-alvo
Operadores da portaria e do caixa (Administrador, Gerente, Caixa e Manobrista) no momento em que o cliente retira o veículo, geralmente no celular ou tablet, em pé e com pressa. O registro só é possível com o caixa aberto.

## Requisitos funcionais
- RF1: O modal **Registrar saída** (aberto pelos atalhos já existentes na Home e na tela Saída de Veículos) passa a ser uma tela única, com base no layout de referência `gipe-saida.html`. Ela reúne: leitura de QR, busca manual, resumo do veículo com o valor, forma de pagamento e o botão principal **Confirmar Saída**.
- RF2 (Leitura de QR): a tela oferece uma área de leitura que usa a câmera do dispositivo, preferindo a traseira. Ao ler um QR válido do cupom de entrada, o sistema extrai o token, mostra-o na tela e busca a entrada correspondente. Há feedback visual de leitura bem-sucedida e de QR inválido ("QR Code não é um ticket GIPE").
- RF3: Se a câmera estiver indisponível, sem permissão ou o navegador não suportar, a área de leitura explica o motivo e permite tentar de novo; a busca manual continua disponível.
- RF4 (Busca manual): como alternativa ao QR, o operador informa **um** entre Placa, Token e Sequencial (placa no padrão antigo ou Mercosul; token é o código impresso no cupom, ou o link colado; sequencial só números). O token digitado segue o mesmo caminho do QR. Ao preencher um, os outros ficam desabilitados; ao ler um QR, os campos de busca manual ficam desabilitados.
- RF5: Existe uma ação para **limpar** a leitura/busca atual e recomeçar, reativando a câmera e os campos.
- RF6 (Resumo): encontrada a entrada, a tela exibe: modelo e cor, categoria, data e hora de entrada, tempo de permanência e **valor a cobrar**, com o valor em destaque. Os dados do resumo são somente leitura, e o tempo e o valor se mantêm atualizados enquanto a tela está aberta. Se a entrada não for encontrada (token, placa ou ticket sem veículo no pátio), a mensagem aparece na própria tela e o operador pode corrigir e tentar de novo.
- RF7 (Pagamento): as formas de pagamento são **Dinheiro, Crédito, Débito e Pix**, escolhidas com seleção visual e uma opção sempre marcada. Em Dinheiro, o operador informa o **valor recebido** e o sistema mostra o **troco**; valor recebido menor que o valor a cobrar impede a confirmação. Nas demais formas não há valor recebido nem troco.
- RF8: **Confirmar Saída** só fica habilitado com uma entrada encontrada e um pagamento válido, e mostra o valor no próprio botão.
- RF9: Ao confirmar, o sistema **recalcula o valor antes de registrar**. Se o valor mudou desde a última exibição, o novo valor e o novo tempo são mostrados, o troco é recalculado e o operador precisa confirmar de novo. Se não mudou, a saída é registrada.
- RF10: O registro ocorre uma vez por confirmação; botões ficam bloqueados durante o envio. Se falhar (sem caixa aberto, veículo que já saiu, sem permissão ou falha de rede), o motivo aparece na tela, os dados são mantidos e o operador pode tentar de novo.
- RF11 (Recibo): após registrar, o recibo atual é exibido (empresa, placa, categoria, modelo e cor, entrada, saída, permanência, tabela, forma de pagamento, valor cobrado e, em dinheiro, recebido e troco), com o botão **Imprimir** e o botão **Concluir**, que mostra o aviso "Saída realizada com sucesso."
- RF12: Fechar o modal antes do envio do pagamento com leitura ou dados em andamento pede confirmação para descartar. Ao fechar ou concluir, a câmera é desligada.
- RF13: A tela é pensada para celular e também funciona em desktop. O visual segue o design system do projeto, usando o layout de referência como guia de composição e não como cópia literal.

## Fora de escopo
- Pagamento por Boleto e Transferência bancária no fluxo de saída (saem desta tela; as demais regras de negócio permanecem).
- Integração com maquininha ou Pix, pagamento dividido, descontos manuais e alteração do valor calculado.
- Nota fiscal, estorno ou cancelamento de saída já registrada.
- Envio do recibo por e-mail ou mensagem; PDF próprio (permanece apenas a impressão do navegador).
- Mudanças no fluxo de entrada, no cupom de entrada ou na página pública do comprovante.
- O botão "QR de teste" da referência, que é só um recurso de demonstração.
- Alterações nas regras de tarifa e tolerância (o valor continua vindo do cálculo do sistema).

## Critérios de aceite
- [ ] Dado um usuário logado, quando abre o atalho **Registrar saída**, então vê uma única tela com leitura de QR, busca manual, resumo, pagamento e **Confirmar Saída**, sem etapas.
- [ ] Dado o QR de um cupom de entrada, quando a câmera o lê, então o token é exibido, a entrada é encontrada e o resumo mostra veículo, entrada, permanência e valor.
- [ ] Dado um QR que não é do GIPE, quando é lido, então aparece "QR Code não é um ticket GIPE" e a leitura continua.
- [ ] Dado que a câmera foi negada ou não existe, então a área de leitura explica o motivo e a busca manual continua funcionando.
- [ ] Dado a busca manual, quando preenche placa, ticket ou sequencial, então os outros dois ficam desabilitados e a entrada é consultada; placa inválida mostra "Placa inválida. Informe no padrão antigo (ABC1234) ou Mercosul (ABC1D23)".
- [ ] Dado um veículo que não está no pátio, quando é buscado por QR ou manualmente, então a mensagem aparece na tela e o operador pode tentar de novo.
- [ ] Dado um resumo exibido, quando o tempo passa, então permanência e valor são atualizados sem ação do operador.
- [ ] Dado Dinheiro, quando o valor recebido é igual ou maior que o valor a cobrar, então o troco é exibido; quando é menor, **Confirmar Saída** fica desabilitado.
- [ ] Dado Crédito, Débito ou Pix, então não há campo de valor recebido nem troco.
- [ ] Dado que o valor mudou desde a exibição, quando confirma, então o novo valor é mostrado e nada é registrado até nova confirmação.
- [ ] Dado que o valor não mudou, quando confirma, então a saída é registrada e o recibo é exibido, com **Imprimir** imprimindo só o recibo.
- [ ] Dado que não há caixa aberto, quando confirma, então o motivo aparece e os dados informados são mantidos.
- [ ] Dado o envio em andamento, então não é possível confirmar uma segunda vez nem fechar o modal.
- [ ] Dado leitura ou dados em andamento, quando tenta fechar o modal, então é pedida confirmação; ao fechar ou concluir, a câmera é desligada.
- [ ] A tela é utilizável em celular, por teclado e leitor de tela (WCAG 2.2 AA): área de leitura rotulada, forma de pagamento com estado anunciado, resultados de leitura e erros anunciados.

## Pontos em aberto
- **Busca por token na API de saída**: a consulta de saída hoje aceita placa, ticket e sequencial; só o comprovante público usa o token. Confirmar com o back se a consulta/registro da saída aceita token ou se o token deve ser resolvido para a entrada por outro caminho.
- **Formato do QR**: a referência aceita `GIPE-SAIDA:XXXXXX` ou o link `.../c/XXXXXX`. Confirmar com o cupom atual (`qrcode-entrada` e `melhoria-fluxo-entrada`) qual formato o QR traz, para o leitor reconhecê-lo.
- **Boleto e Transferência**: confirmar com o negócio que podem sair do fluxo de saída (a referência traz só 4 formas) e se o back continua aceitando as demais para outros usos.
- **Atualização ao vivo**: confirmar a frequência de atualização do valor (referência usa 30 s) e se o recálculo pelo servidor no momento da confirmação segue como fonte da verdade.
- **Câmera e HTTPS**: a leitura exige contexto seguro; confirmar que os ambientes de uso do operador atendem a isso.

## Métricas de sucesso
- Tempo para dar saída a um veículo (da abertura do modal ao recibo): menos de 30 segundos com QR (hoje a meta é 45 s).
- Parcela de saídas iniciadas por leitura de QR em relação às digitadas.
- Saídas registradas com valor divergente do calculado no momento da cobrança: zero.
