# PRD: Campo prisma na entrada de veículos

Complementa `../config-entrada-empresa/prd.md`: aquela feature criou a opção "Prisma obrigatório" na configuração da empresa; esta define o campo em si.

## Problema
A configuração da empresa já permite exigir o prisma na entrada, mas o campo ainda não tem regras definidas (que valores aceita) nem como corrigi-lo depois. Hoje o operador que errar o número ao registrar a entrada não tem como acertar com o veículo já no pátio, e o formulário não impede números sem sentido.

## Objetivo
O prisma é um número inteiro de 1 a 999, informado na entrada do veículo quando a empresa usa o prisma, e pode ser corrigido enquanto o veículo estiver no pátio.

## Usuário-alvo
- Operadores que registram a entrada de veículos (pátio e conferência), no celular ou no computador.
- Quem acompanha o pátio e precisa corrigir o prisma de um veículo que já entrou (mesmos perfis que operam o pátio).

## Requisitos funcionais
- RF1: O prisma é um número inteiro entre 1 e 999. Zero, negativos, decimais, texto e valores acima de 999 não são aceitos.
- RF2: O campo só existe quando a configuração da empresa tem "Prisma obrigatório" ligado. Com a opção desligada, o campo não aparece na entrada nem na edição, e nenhum prisma é registrado.
- RF3: Na entrada de veículos (pátio e conferência), com o campo ativo, o prisma é obrigatório, exceto para mensalista, que pode entrar sem ele (regra já definida na configuração). O operador vê qual valor é aceito e, se digitar algo inválido, recebe uma mensagem clara.
- RF4: No celular, o campo abre um teclado numérico.
- RF5: Um veículo que está no pátio pode ter o prisma editado. A edição fica disponível na tela do ticket do veículo, mostra o valor atual e segue as mesmas regras (1 a 999; obrigatório fora de mensalista quando o campo está ativo).
- RF6: O prisma do veículo aparece na tela do ticket (e onde o ticket do veículo for mostrado), quando existe.
- RF7: Se a edição falhar, o usuário vê uma mensagem clara, mantém o que digitou e pode tentar de novo. Salvar com sucesso mostra a confirmação e o novo valor.
- RF8: Veículos que entraram sem prisma (porque o campo não estava ativo, ou mensalista) mostram a edição vazia; o prisma só passa a ser exigido para eles se a empresa o tornar obrigatório e o usuário optar por preencher.

## Fora de escopo
- Edição de outros dados do veículo no pátio (placa, modelo, cor, categoria).
- Garantir que dois veículos não usem o mesmo prisma ao mesmo tempo (a menos que o produto decida; ver questões em aberto).
- Histórico de alterações do prisma.
- Prisma para veículos que já saíram do pátio.
- Impressão do prisma no comprovante.

## Critérios de aceite
- [ ] Com "Prisma obrigatório" desligado, o campo não aparece na entrada do pátio, na conferência nem na edição do ticket.
- [ ] Com a opção ligada, o campo aparece na entrada e aceita só inteiros de 1 a 999; 0, 1000, decimais e texto são recusados com mensagem.
- [ ] Com a opção ligada, a entrada de um veículo comum sem prisma é bloqueada e a de um mensalista sem prisma funciona.
- [ ] No celular, o campo abre o teclado numérico.
- [ ] Na tela do ticket de um veículo no pátio, o usuário abre a edição do prisma, altera, salva e vê o novo valor.
- [ ] Erro ao salvar o prisma mostra mensagem e mantém o valor digitado.
- [ ] O prisma aparece na tela do ticket quando o veículo tem um.
- [ ] A edição não está disponível para veículos que já saíram.

## Métricas de sucesso (se aplicável)
- Queda de entradas registradas com prisma errado que dependiam de intervenção fora do sistema.
- Tempo para corrigir um prisma no pátio abaixo de 30 segundos.

## Questões em aberto
- O que o prisma representa para a operação (por exemplo, o número da peça colocada no veículo)? A redação do produto precisa dizer isso para o texto de apoio ao operador.
- Dois veículos podem ter o mesmo prisma ao mesmo tempo no pátio? Se não, o sistema deve avisar na entrada e na edição.
- Quem pode editar o prisma no pátio: todos os perfis que operam o pátio, ou só alguns?
- A edição existe para qualquer veículo no pátio, inclusive os que entraram quando a opção estava desligada?
