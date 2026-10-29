# PRD: Campo Modelo com lista local de veículos

## Problema
O endpoint de modelos de veículo (`Veiculo/modelos`) mudou: não recebe mais parâmetros de busca e sempre devolve a lista completa. Hoje o campo Modelo da entrada de veículo consulta o backend a cada digitação (a partir de 2 caracteres) e, no cadastro de mensalista, nem oferece sugestões — o usuário digita tudo à mão. A experiência é lenta, depende de rede a cada tecla e é inconsistente entre as duas telas.

## Objetivo
Ao carregar o sistema, a lista completa de modelos é obtida uma vez e fica disponível para consulta imediata. O campo Modelo, na entrada de veículo e no cadastro de mensalista, ajuda o usuário a escolher o modelo de forma rápida e confortável, sem esperar rede.

## Usuário-alvo
Operador de pátio/caixa registrando a entrada de veículos (muitas vezes com pressa, no celular) e administrador/atendente cadastrando veículos de mensalistas.

## Requisitos funcionais
- RF1: Ao carregar o sistema (após o usuário estar autenticado), a lista completa de modelos é consultada uma única vez e mantida salva para uso nas telas.
- RF2: O campo Modelo da tela de entrada de veículo usa essa lista salva para sugerir modelos, sem nova consulta ao backend a cada digitação.
- RF3: O campo Modelo do cadastro de mensalista (cada veículo do mensalista) passa a oferecer a mesma experiência de sugestão do campo da entrada.
- RF4: A busca nas sugestões filtra a lista conforme o usuário digita, desde o primeiro caractere, ignorando maiúsculas/minúsculas e acentos.
- RF5: O campo é de fácil uso em toque e teclado: as sugestões são claramente visíveis, rolam quando muitas, podem ser escolhidas com um toque/clique ou pelas setas + Enter, e destacam o trecho digitado.
- RF6: O usuário pode informar um modelo que não está na lista (texto livre continua válido); o campo não bloqueia o preenchimento.
- RF7: Se a lista ainda estiver carregando ou a consulta falhar, o campo continua utilizável como texto livre, sem mensagem de erro bloqueante; a consulta é tentada novamente em momento oportuno.
- RF8: Ao escolher um modelo existente que já traz informações associadas (ex.: o comportamento atual de preencher dados a partir da sugestão), esse comportamento é mantido.

## Fora de escopo
- Alterações no backend ou no contrato do endpoint além do já informado.
- Cadastro, edição ou remoção de modelos pelo usuário.
- Sugestões para outros campos (cor, categoria, placa).
- Funcionamento offline completo do sistema.

## Critérios de aceite
- [ ] Após o login, o sistema consulta `Veiculo/modelos` uma vez; digitar no campo Modelo não gera novas chamadas a esse endpoint.
- [ ] Na entrada de veículo, digitar parte de um modelo (inclusive 1 caractere, sem acento ou em outra caixa) mostra sugestões imediatamente.
- [ ] No cadastro de mensalista, cada veículo tem o campo Modelo com as mesmas sugestões.
- [ ] Escolher uma sugestão por toque/clique e por teclado preenche o campo.
- [ ] É possível salvar a entrada e o mensalista com um modelo digitado que não consta na lista.
- [ ] Com a consulta lenta ou com falha, o campo permanece digitável e a tela não quebra.
- [ ] O campo é usável em tela de celular (sugestões legíveis, sem cortar fora da tela).

## Métricas de sucesso (se aplicável)
- Zero chamadas a `Veiculo/modelos` por digitação (apenas 1 por carregamento do sistema).
- Redução do tempo médio de preenchimento do campo Modelo na entrada.
- Aumento da proporção de veículos de mensalistas cadastrados com modelo preenchido.
