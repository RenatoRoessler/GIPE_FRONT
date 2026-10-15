# PRD: QR Code do comprovante de entrada

## Problema
Hoje a entrada de um veículo é registrada, mas o cliente não recebe nada que comprove os dados da entrada (placa, horário, tarifa). Isso dificulta conferir informações depois e gera dúvida na hora da saída.

## Objetivo
Ao registrar uma entrada, o sistema gera um comprovante com um QR code. Ao ler o QR, qualquer pessoa abre uma página pública com os dados daquela entrada.

## Usuário-alvo
- **Operador do pátio**: registra a entrada e entrega o comprovante ao cliente.
- **Cliente (motorista)**: lê o QR com o celular, sem login, para consultar os dados da própria entrada.

## Requisitos funcionais
- RF1: Após registrar a entrada com sucesso, o sistema exibe o comprovante da entrada com um QR code.
- RF2: O QR code contém o link de uma página pública, sem necessidade de login.
- RF3: O link identifica a entrada pelo **patioId + placa**.
- RF4: A página pública exibe os dados da entrada: placa, modelo, cor, categoria, sequencial, mensalista, data/hora de entrada e a descrição da tarifa (rotatividade).
- RF5: A página pública **não** exibe IDs internos (usuário, rotatividade) nem o nome do operador.
- RF6: Se o link for inválido (patioId e placa não correspondem a uma entrada), a página mostra uma mensagem clara de entrada não encontrada, sem revelar dados.
- RF7: A página pública funciona em celular (é onde o QR será lido).

## Fora de escopo
- Impressão em impressora térmica/formatação específica de cupom (a definir à parte).
- Mostrar valor a pagar, saída ou status do pagamento na página pública.
- Reenvio do comprovante por e-mail/WhatsApp.
- Reimprimir comprovante de entradas antigas.

## Critérios de aceite
- [ ] Ao concluir uma entrada, o comprovante é exibido com o QR code.
- [ ] Ler o QR com um celular abre a página pública sem pedir login.
- [ ] A página mostra os dados listados no RF4 e nenhum dado do RF5.
- [ ] Um link com patioId e placa que não conferem mostra "entrada não encontrada".
- [ ] A página é legível e utilizável em tela de celular.

## Pontos em aberto
- **Segurança do identificador**: `patioId` é sequencial e a placa é visível no veículo; quem conhece os dois acessa a página. Decisão do produto é usar patioId + placa; o back deve validar a combinação e não expor mais do que o RF4. Reavaliar um token não adivinhável se isso virar risco.
- **Endpoint público**: depende de o back disponibilizar uma consulta pública por patioId + placa (hoje não confirmado).
- **Quando o comprovante fica disponível**: apenas logo após a entrada, ou também por consulta posterior.

## Métricas de sucesso
- Redução de dúvidas/contestações sobre horário e dados da entrada na saída.
