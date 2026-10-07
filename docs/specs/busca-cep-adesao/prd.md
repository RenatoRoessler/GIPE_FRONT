# PRD: Preenchimento de Endereço pelo CEP na Adesão

## Problema
Na etapa "Dados da empresa" do fluxo de adesão, o responsável digita o CEP e depois precisa digitar à mão logradouro, bairro, cidade e estado. É trabalho repetitivo, sujeito a erro de digitação e aumenta o atrito num fluxo que já tem 3 etapas.

A busca de endereço por CEP foi deixada explicitamente fora do escopo em `docs/specs/integracao-adesao`; esta feature a traz para dentro.

## Objetivo
Ao informar um CEP válido na etapa "Dados da empresa", os campos de endereço correspondentes são preenchidos automaticamente, e o usuário só precisa completar o que a busca não trouxe (como o número) e conferir o resultado.

## Usuário-alvo
Responsável pela empresa (futuro titular) preenchendo a adesão a partir de um link recebido, em desktop ou celular.

## Premissas
- O texto original diz "no campo cpf", mas a busca por CEP só faz sentido no campo **CEP** da etapa "Dados da empresa". O campo CPF (usuário titular) não é alterado. **[CONFIRMAR]**
- A busca é disparada automaticamente quando o CEP fica completo (8 dígitos), sem botão.
- Os campos preenchidos continuam editáveis.

## Requisitos funcionais
- RF1: Quando o CEP informado estiver completo e válido, o sistema busca o endereço correspondente sem ação adicional do usuário.
- RF2: Em caso de sucesso, preenche logradouro, bairro, cidade e estado. O número nunca é preenchido pela busca.
- RF3: Enquanto a busca está em andamento, o usuário vê indicação de progresso e não perde o que já digitou.
- RF4: Os campos preenchidos automaticamente continuam editáveis; o usuário pode corrigir qualquer valor.
- RF5: Se o CEP não for encontrado, o usuário vê uma mensagem clara no campo CEP e pode preencher o endereço manualmente.
- RF6: Se a busca falhar (sem conexão, tempo esgotado, serviço indisponível), o usuário vê uma mensagem compreensível em português e pode preencher manualmente, sem bloqueio do fluxo.
- RF7: Se o CEP for alterado depois de uma busca, uma nova busca é feita com o novo valor.
- RF8: Quando a busca não trouxer algum campo (ex.: CEP genérico de cidade, sem logradouro ou bairro), esse campo não é apagado nem sobrescrito e fica disponível para digitação.
- RF9: A validação existente do CEP (obrigatório, formato válido) continua valendo e a busca não é disparada para CEP incompleto ou inválido.

## Fora de escopo
- Consulta de CNPJ ou qualquer outro preenchimento automático externo.
- Busca de CEP a partir do endereço (busca reversa).
- Preenchimento do número, complemento ou coordenadas.
- Alterações no campo CPF ou na etapa do usuário titular.
- Uso da busca de CEP em outras telas além da adesão.
- Cache ou histórico de CEPs consultados.

## Critérios de aceite
- [ ] Dado um CEP válido e existente digitado por completo, quando o oitavo dígito é informado, então logradouro, bairro, cidade e estado são preenchidos sem clicar em nada.
- [ ] Dado que a busca está em andamento, então há indicação visível de progresso e o restante do formulário continua utilizável.
- [ ] Dado que o endereço foi preenchido automaticamente, quando edito qualquer campo, então meu valor é mantido.
- [ ] Dado um CEP com formato válido mas inexistente, então vejo mensagem no campo CEP e os campos de endereço permanecem editáveis e vazios.
- [ ] Dado que o serviço de busca está indisponível ou sem conexão, então vejo mensagem em português, consigo preencher manualmente e avançar normalmente.
- [ ] Dado um CEP incompleto ou inválido, então nenhuma busca é feita e a mensagem de validação atual é exibida.
- [ ] Dado que troco o CEP por outro válido, então o endereço é atualizado para o novo CEP.
- [ ] Dado que a busca não retornou bairro ou logradouro, então esses campos não são apagados e ficam livres para digitação.
- [ ] Dado que o preenchimento automático ocorreu, então o resultado é anunciado a leitores de tela (WCAG 2.2 AA) e o foco não é movido de forma inesperada.
- [ ] O valor enviado ao backend no cadastro continua no mesmo formato de antes.
- [ ] O campo CPF do usuário titular permanece inalterado.

## Métricas de sucesso (se aplicável)
- Redução do tempo de preenchimento da etapa "Dados da empresa" (baseline a medir).
- Proporção de adesões em que o endereço veio da busca e foi mantido sem edição (a medir).
- Falhas de busca com mensagem compreensível: 100% dos tipos de falha cobertos.

## Pontos em aberto
- **[CONFIRMAR]** que "campo cpf" no pedido original é, na verdade, o campo CEP.
- **[A DEFINIR]** o serviço de consulta de CEP a ser usado (decisão do Tech Spec; pode ser serviço público externo ou endpoint do backend próprio).
- **[A DEFINIR]** se o estado preenchido automaticamente deve ficar bloqueado para edição (assumido: não, continua editável).
