# PRD: Leitor de placa sem teclado

## Problema
Na tela "Ler placa" (leitura pela câmera), o teclado de digitação da placa continua aparecendo na parte de baixo da tela, mesmo o operador estando apenas apontando a câmera. Ele ocupa espaço, distrai e não tem função nesse momento. Além disso, o botão de saída da tela se chama "Cancelar", o que não deixa claro que o caminho alternativo é digitar a placa manualmente.

## Objetivo
Enquanto a câmera de leitura estiver aberta, o teclado não aparece e a tela fica focada só na leitura. O botão que hoje diz "Cancelar" passa a se chamar "Digitar Placa", deixando claro que ele leva o operador de volta à digitação manual.

## Usuário-alvo
Operador do pátio, no celular, na entrada de veículo e na busca manual da saída, que toca no ícone de câmera do campo de placa para ler a placa em vez de digitar.

## Requisitos funcionais
- RF1: Enquanto a tela de leitura pela câmera estiver aberta, nenhum teclado (o teclado próprio do sistema nem o do aparelho) é exibido.
- RF2: O botão que hoje tem o texto "Cancelar" na tela de leitura passa a ter o texto "Digitar Placa".
- RF3: Ao acionar "Digitar Placa", a câmera é fechada (e desligada) e o operador volta ao campo de placa sem alteração no valor já digitado, com o teclado de digitação disponível novamente para continuar.
- RF4: Ao fechar a leitura por outro meio (ex.: botão "X" no topo) ou ao confirmar uma placa lida, o comportamento atual se mantém.
- RF5: O nome acessível do botão acompanha o novo texto ("Digitar Placa").

## Fora de escopo
- Mudar o funcionamento da leitura, o reconhecimento da placa ou a confirmação/correção do resultado.
- Mudar o teclado de digitação em si (layout, teclas) fora da tela de leitura.
- Mudar outros botões ou textos da tela de leitura (título, orientação "Aponte a câmera para a placa", botão "X").
- Alterar outras telas que usam câmera (ex.: leitura de QR code na saída).

## Critérios de aceite
- [ ] Ao abrir a leitura pela câmera na entrada de veículo, nenhum teclado aparece enquanto a câmera está ativa.
- [ ] O mesmo vale para a leitura aberta pela busca manual da saída.
- [ ] O botão de saída exibe "Digitar Placa" em vez de "Cancelar".
- [ ] Ao tocar em "Digitar Placa", a câmera desliga, o campo de placa permanece com o valor anterior e o operador consegue digitar.
- [ ] Ao confirmar uma placa lida ou fechar pelo "X", o fluxo segue como antes (campo preenchido / sem alteração) e o teclado volta quando o campo é usado.
- [ ] Texto e foco do botão são anunciados corretamente por leitor de tela.

## Métricas de sucesso (se aplicável)
Não se aplica. Ajuste de usabilidade; validar com o operador em uso real que a área de leitura fica livre e que o caminho para digitar fica claro.

## Referências
- Pedido original: `docs/specs/input.md` (com captura de tela da leitura mostrando o teclado)
- PRD base da funcionalidade: `docs/specs/leitor-placa/prd.md`
