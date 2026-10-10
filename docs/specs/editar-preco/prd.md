# PRD: Edição de Preço

Complementa `docs/specs/gerenciamento-precos/` (listagem e cadastro já implementados). Este PRD cobre a edição de uma tabela de preço existente, que ali estava pendente por falta de contrato do backend.

## Problema
Hoje é possível cadastrar uma tabela de preço, mas não corrigi-la. Qualquer ajuste (um valor errado, um horário, o encerramento de uma vigência ou a desativação da tabela) exige cadastrar uma nova ou depender de intervenção fora da interface.

## Objetivo
O administrador consegue abrir uma tabela de preço já cadastrada, alterar qualquer um dos seus dados no mesmo fluxo em etapas do cadastro e salvar, com a listagem refletindo a mudança.

## Usuário-alvo
Administradores e gestores que definem e mantêm os preços praticados nos estacionamentos, em desktop.

## Requisitos funcionais
- RF1: Na listagem de preços, a ação "Editar" de cada linha abre a edição daquela tabela.
- RF2: A edição usa o mesmo passo a passo do cadastro (Informações, Horários, Faixas de valores, Categorias), já preenchido com os dados atuais da tabela.
- RF3: Todos os dados do cadastro podem ser alterados: descrição, tipo de regra, início e fim de vigência, tolerâncias, período e valores da diária, situação (ativo/inativo), horários, faixas de valores e categorias.
- RF4: O campo de empresa conveniada continua visível e desabilitado (reservado para o futuro).
- RF5: As mesmas validações do cadastro valem na edição, com os erros indicados por campo antes de avançar e antes de salvar.
- RF6: Ao salvar, a tabela é atualizada com o conjunto completo de dados do passo a passo: horários, faixas e categorias que o usuário removeu deixam de existir e os adicionados passam a existir.
- RF7: Ao salvar com sucesso, o usuário volta à listagem, vê a confirmação "Tabela de preço atualizada." e a listagem mostra os dados novos.
- RF8: Se o salvamento falhar, o usuário vê uma mensagem compreensível e não perde o que alterou.
- RF9: Enquanto os dados da tabela carregam, a tela mostra um estado de carregamento; se a tabela não existir, mostra "Tabela de preço não encontrada." com caminho de volta à listagem.
- RF10: Sair da edição com alterações não salvas pede confirmação.
- RF11: O usuário pode inativar e reativar uma tabela pela edição (campo "Ativo" da primeira etapa).

## Fora de escopo
- Exclusão de tabelas de preço.
- Histórico/auditoria de alterações.
- Vínculo com empresa conveniada.
- Visualização somente leitura (RF3 do PRD de gerenciamento de preços, ainda pendente; a ação "Ver" segue como está).
- Edição em lote de várias tabelas.

## Critérios de aceite
- [ ] Clicar em "Editar" na listagem abre o passo a passo com os dados atuais da tabela em todas as quatro etapas.
- [ ] Alterar um valor de faixa, salvar e voltar à listagem mostra a mudança ao reabrir a tabela.
- [ ] Remover um horário, uma faixa ou uma categoria e salvar faz com que ela não apareça mais ao reabrir a tabela.
- [ ] Adicionar um horário, uma faixa ou uma categoria e salvar faz com que ela apareça ao reabrir a tabela.
- [ ] Inativar a tabela pela edição a mostra como inativa na listagem; reativar a mostra de novo como ativa (vigente, agendada ou encerrada, conforme as datas).
- [ ] Dados inválidos impedem o avanço/salvamento e indicam o campo com erro.
- [ ] Uma falha ao salvar mostra mensagem de erro e mantém tudo o que foi digitado.
- [ ] Abrir a edição de uma tabela inexistente mostra "Tabela de preço não encontrada.".
- [ ] Cancelar ou sair com alterações pendentes pede confirmação; sem alterações, sai direto.
- [ ] O período da diária aparece selecionado corretamente mesmo quando o valor salvo não é 6, 12 ou 24 horas.

## Métricas de sucesso
- Ajustes de preço passam a ser feitos pela interface, sem cadastrar uma nova tabela nem pedir apoio técnico.

## Pontos em aberto (a confirmar antes do Tech Spec)
1. ~~Como carregar uma tabela para editar~~ **Resolvido:** não existe endpoint de consulta por id; a edição obtém os dados da listagem, que já traz a tabela completa.
2. **Percentual da conveniada:** o cadastro envia `null` quando vazio, e o exemplo da atualização envia `0`. Definir qual vale (e se são equivalentes para o backend).
3. **Situação no cadastro:** o contrato de atualização aceita `ativo` na tabela; o de criação não mostrava esse campo. Confirmar se a criação também o aceita.
4. **Impacto em tabelas em uso:** alterar uma tabela vigente passa a valer imediatamente? Existe alguma restrição de negócio (por exemplo, não alterar início de vigência já iniciada ou preços de veículos que já estão no pátio)?
5. **Horários sem hora:** tabelas antigas trazem horários com `horaInicio`/`horaFim` nulos (provável "dia inteiro"). Definir como exibir e se o formulário precisa aceitar essa situação ao editar.
6. **Prioridade:** o contrato de atualização não tem esse campo, o que confirma a remoção feita no cadastro.
