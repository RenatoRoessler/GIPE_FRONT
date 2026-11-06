# PRD: Enviar link do ticket ao cliente

## Problema
Hoje o cliente só recebe o comprovante da entrada se ler o QR code na tela ou no papel do operador. Se o cliente não está com o celular à mão naquele momento, ou perde o papel, não há como entregar o ticket depois. O operador precisa de um jeito rápido de mandar o link do ticket direto para o WhatsApp ou e-mail do cliente.

## Objetivo
O operador consegue, na tela de entrada de veículos e no detalhe do item do pátio, informar o WhatsApp ou o e-mail do cliente e enviar a ele o link do ticket (a página pública do comprovante da entrada), com a mensagem pronta para o envio.

## Usuário-alvo
- **Operador do pátio**: acabou de registrar a entrada, ou está consultando um veículo que já está no pátio, e quer entregar o ticket digital ao cliente sem imprimir.
- **Cliente (motorista)**: recebe o link no celular e abre o ticket sem login.

## Requisitos funcionais
- RF1: A ação "Enviar ticket ao cliente" está disponível na tela de entrada de veículos (após a entrada registrada, junto ao comprovante) e no detalhe do item do pátio.
- RF2: Ao acionar, abre um popup para o operador escolher o canal (WhatsApp ou e-mail, um por vez) e informar o contato do cliente.
- RF3: O contato é validado conforme o canal: WhatsApp com DDD e número válido (formatado enquanto digita); e-mail com formato válido. Enquanto inválido, o envio não é permitido e o motivo é mostrado.
- RF4: Ao confirmar o envio, o sistema abre o aplicativo do operador (WhatsApp ou e-mail) com a mensagem pronta, destinada ao contato informado, contendo o link do ticket daquela entrada. O operador conclui o envio no próprio aplicativo.
- RF5: A mensagem pronta identifica o estacionamento e a placa do veículo, e traz o link do ticket.
- RF6: O contato informado é usado apenas para aquele envio; não é salvo no cadastro do veículo ou do cliente.
- RF7: O popup pode ser fechado/cancelado a qualquer momento sem efeito colateral.
- RF8: Se não for possível montar o link do ticket daquela entrada, a ação informa que não foi possível gerar o link, sem erro técnico.

## Fora de escopo
- Envio automático pelo servidor (o sistema não dispara a mensagem sozinho; quem envia é o operador pelo aplicativo dele).
- Guardar ou reaproveitar o contato do cliente em próximos envios.
- Enviar nos dois canais ao mesmo tempo.
- Enviar o recibo da saída (só o ticket da entrada).
- Histórico/confirmação de entrega ou leitura da mensagem.
- Alterar o conteúdo da página pública do ticket.

## Critérios de aceite
- [ ] A ação aparece na tela de entrada de veículos (após registrar a entrada) e no detalhe do item do pátio.
- [ ] Ao acioná-la, abre um popup com seleção de canal (WhatsApp ou e-mail) e um campo de contato.
- [ ] WhatsApp inválido (sem DDD ou incompleto) ou e-mail inválido bloqueia o envio e mostra a mensagem do motivo.
- [ ] Com contato válido, ao confirmar, abre o WhatsApp ou o e-mail com o destinatário preenchido e a mensagem contendo o link do ticket e a placa.
- [ ] O link enviado abre o ticket público da entrada correta, sem login.
- [ ] Trocar o canal limpa o contato e a validação do canal anterior.
- [ ] Fechar o popup não envia nada e não guarda o contato digitado.
- [ ] O popup é utilizável por teclado e leitor de tela, e confortável em tela de celular.

## Métricas de sucesso
Sem métrica numérica nesta entrega. Funciona quando o operador consegue entregar o ticket digital ao cliente em poucos toques, sem imprimir.
