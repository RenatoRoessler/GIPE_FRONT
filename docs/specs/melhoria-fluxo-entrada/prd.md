# PRD: Melhoria do fluxo de entrada de veículos

## Problema
O fluxo atual de entrada (registro do veículo, cupom e comprovante do cliente) tem um layout pouco claro para o operador em campo, e o campo **cor** é texto livre, o que gera dados inconsistentes ("prata", "PRATA", "cinza claro"). Além disso, o QR do comprovante identifica a entrada por patioId + placa, informação previsível e fácil de adivinhar, e a página pública do cliente não mostra os dados oficiais do comprovante (permanência, valor atual, dados do estacionamento).

## Objetivo
O operador registra a entrada em uma tela mais clara e rápida, escolhendo a cor de uma lista fixa. O cupom traz um QR que leva o cliente a uma página pública, sem login, com o comprovante atualizado da própria entrada, identificada por um token único.

## Usuário-alvo
- **Operador do pátio / manobrista**: registra a entrada no celular ou tablet, muitas vezes em pé e com pressa, e entrega o cupom ao cliente.
- **Cliente (motorista)**: lê o QR com o celular, sem cadastro, para consultar o comprovante da própria entrada.

## Requisitos funcionais
- RF1: A tela de entrada é redesenhada com base no layout de referência `gipe-entrada.html`: placa, modelo, cor e categoria em seções claras, com ação principal "Confirmar Entrada" só habilitada quando os dados obrigatórios forem válidos.
- RF2: O campo **cor** deixa de ser texto livre e passa a ser uma escolha entre valores fixos: Branco, Preto, Prata, Cinza, Vermelho, Azul, Verde e Bege. O valor padrão sugerido é Prata.
- RF3: Cada cor é apresentada visualmente (amostra da cor) e o nome da cor selecionada fica visível, sem depender só da cor para ser entendida.
- RF4: Ao confirmar a entrada, o cupom exibe um QR code que aponta para a página pública do comprovante, identificada pelo **token** devolvido pelo registro da entrada (substitui o link atual por patioId + placa).
- RF5: A página pública do comprovante não exige login.
- RF6: Ao abrir a página pública, o sistema consulta o comprovante do cliente a partir do token e exibe: razão social, endereço e telefone do estacionamento, placa, modelo, cor, categoria, sequencial, data/hora de entrada, tempo de permanência e valor atual.
- RF7: Se o token for inválido ou não encontrado, a página mostra uma mensagem clara de comprovante não encontrado, sem revelar dados.
- RF8: Enquanto o comprovante carrega, a página mostra estado de carregamento; se a consulta falhar, mostra erro com opção de tentar novamente.
- RF9: A página pública é pensada para celular, que é onde o QR será lido.

## Fora de escopo
- Pagamento, saída do veículo ou QR de saída pela página pública.
- Impressão térmica / formatação específica de cupom.
- Reenvio do comprovante por e-mail ou WhatsApp, e download de PDF.
- Outras cores além das 8 listadas, ou cor configurável por estacionamento.
- Migração de entradas antigas com cor em texto livre.
- Alterações no fluxo de saída.

## Critérios de aceite
- [ ] A tela de entrada segue o layout de referência e é utilizável em celular.
- [ ] O campo cor só aceita uma das 8 opções; não é possível digitar texto livre.
- [ ] A entrada não é confirmada sem placa válida, e a cor enviada é sempre uma das opções.
- [ ] O QR do cupom abre a página pública do comprovante com o token da entrada, sem pedir login.
- [ ] A página exibe todos os dados do RF6 retornados pela consulta do comprovante.
- [ ] Um token inexistente mostra "comprovante não encontrado" sem expor dados.
- [ ] A página trata os estados de carregamento e erro de rede.
- [ ] A página é legível em tela de celular e acessível por teclado/leitor de tela (contraste, rótulos nas cores).

## Pontos em aberto
- **Valores aceitos pelo back para cor**: confirmar se a API espera exatamente esses 8 nomes (ou ids) e em que formato. O token já vem na resposta do registro da entrada (confirmado).
- **Link antigo `/comprovante/<patioId>/<placa>`** (spec `qrcode-entrada`): decidir se é removido ou mantido por compatibilidade com cupons já impressos.
- **Atualização do tempo/valor**: se a página deve se atualizar sozinha enquanto aberta ou apenas na abertura.

## Métricas de sucesso
- Redução de entradas com cor inconsistente ou fora da lista.
- Menor tempo médio para registrar uma entrada.
- Clientes conseguem abrir o comprovante pelo QR sem suporte do operador.
