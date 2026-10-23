# PRD: Finalização do Caixa

## Problema
A tela de Caixa existe (`docs/specs/caixa/`), mas foi construída sobre um contrato parcial da API. Com o swagger completo do módulo Caixa em mãos (`docs/specs/input.md`), a comparação com o que existe mostra:

**Divergências com a API (o que está feito pode estar errado)**
- O fechamento do caixa é chamado por um método HTTP diferente do definido na API (a API define `PUT`; a tela usa `POST`), e a API aceita o fundo de caixa contado na gaveta no fechamento, que a tela não envia.
- Na passagem de turno, a API chama o dinheiro que fica na gaveta de "fundo de caixa"; a tela envia com outro nome, então a informação pode ser ignorada e a API assumir o valor padrão.
- A regra de retirada (sangria) mudou: o que fica na gaveta é o fundo do caixa, e o troco padrão da empresa deixou de limitar a retirada. Os textos e a validação da tela ainda falam em troco padrão.
- Os campos do turno que a tela lê (esperado, informado, diferença, valor inicial, troco padrão) não foram conferidos contra a resposta real da API, que agora descreve fundo do turno, saldo, total de saídas e diferença por turno.

**Funcionalidades da API sem tela**
- Movimentos do caixa aberto (entradas, saídas e sangrias, com turno, usuário, forma de pagamento e motivo).
- Histórico de caixas já fechados, com filtro por período e paginação.
- Extrato de movimentos de um caixa fechado.

**Regressão de permissão a corrigir**
- Na regra de permissões por perfil, o "Histórico de turnos" do caixa aberto foi restrito a Administrador e Gerente. Na API, listar os turnos do caixa aberto é permitido também a Caixa e Manobrista; a restrição a Administrador e Gerente vale para o histórico de caixas fechados e seus movimentos.

**Visão do caixa**
- A tela mostra os números, mas não ajuda o operador e o gestor a enxergar rapidamente o que importa: quanto há na gaveta, quanto pode retirar, o que entrou por forma de pagamento e onde estão as diferenças.

## Objetivo
O caixa funciona de acordo com a API em todas as operações, cobre todas as consultas que a API oferece e apresenta o estado do caixa e do turno de forma clara, de modo que operador e gestor entendam a situação e as diferenças sem fazer contas.

## Usuário-alvo
- **Caixa e Manobrista**: operam o turno (abrir, retirar, passar turno, fechar), consultam movimentos e turnos do caixa aberto.
- **Gerente e Administrador**: tudo o que os anteriores fazem, mais auditar caixas fechados e seus movimentos.

## Requisitos funcionais

### Correção do que existe
- RF1: O fechamento do caixa segue o contrato da API, incluindo a possibilidade de informar o fundo de caixa contado na gaveta (opcional, não negativo) e a observação.
- RF2: A passagem de turno envia o dinheiro que fica na gaveta com o campo definido pela API; quando não informado, o usuário é avisado de que a API assume o fundo do turno encerrado mais o dinheiro conferido.
- RF3: A retirada (sangria) mostra e valida o limite como "dinheiro esperado menos o fundo de caixa", sem mencionar troco padrão. Valor acima do disponível é impedido com o limite informado; motivo é obrigatório.
- RF4: Os dados exibidos do caixa e do turno (saldo, entradas, saídas, esperado, informado, diferença, fundo) correspondem aos campos reais da resposta da API, sem cálculos próprios que a API já entrega.
- RF5: Formas de pagamento boleto e transferência bancária só aparecem quando a API as retorna (têm movimento no turno).
- RF6: O "Histórico de turnos" do caixa aberto volta a estar disponível para Administrador, Gerente, Caixa e Manobrista. Retirada (sangria) fica para Administrador, Gerente e Caixa.

### Funcionalidades novas
- RF7: **Movimentos do caixa aberto.** Lista de entradas, saídas e sangrias, do mais recente para o mais antigo, com data/hora, tipo, turno, usuário, forma de pagamento, valor e motivo. Disponível a todos os perfis com acesso ao caixa.
- RF8: **Histórico de caixas fechados.** Lista paginada, do mais recente para o mais antigo, com quem abriu, quem fechou e os totais do fechamento, com filtro por período (dia da abertura, início e fim inclusos). Só Administrador e Gerente.
- RF9: **Extrato de um caixa fechado.** Ao escolher um caixa do histórico, mostra seus movimentos como em RF7. Só Administrador e Gerente.
- RF10: Estados de carregamento, vazio e erro em todas as consultas novas, incluindo permissão negada. Nos erros de regra de negócio (400) mostra-se a mensagem devolvida pela API; só se ela vier vazia entra um texto padrão.

### Visão melhorada do caixa
- RF11: **Resumo do caixa e do turno em destaque**: saldo, entradas, saídas, fundo de caixa, dinheiro esperado na gaveta e disponível para retirada, com o que pode ser retirado agora visível sem abrir a retirada.
- RF12: **Quebra por forma de pagamento** do turno atual (entradas, saídas e esperado), com leitura rápida de qual forma concentra o movimento.
- RF13: **Diferenças de conferência destacadas** (sobra, falta, sem diferença) em turnos fechados e no resumo de fechamento, sem depender só de cor.
- RF14: **Movimentos do caixa aberto na própria página do caixa**, abaixo do resumo (não em modal nem em outra rota), com filtro por tipo (entradas, saídas, sangrias) e por turno.
- RF15: **Gráficos** do turno atual: entradas e saídas por forma de pagamento e por hora do turno.
- RF16: **Linha do tempo** do caixa aberto, com os eventos em ordem (abertura, retiradas, passagens de turno, fechamento) e quem fez cada um.
- RF17: **Comprovante em PDF** do fechamento do caixa e da passagem de turno, com resumo por forma de pagamento (esperado, informado, diferença), responsáveis e observação.
- RF18: **Extrato de caixa fechado com filtro, CSV e PDF**: filtro por tipo e por turno (como em RF14), exportação dos movimentos em CSV e geração do extrato em PDF.

## Fora de escopo
- Lançamento de cobranças e pagamentos (entradas); a origem delas é o pátio e os mensalistas.
- Edição ou estorno de movimentos já registrados.
- Configuração do troco padrão da empresa.
- Mais de um caixa aberto por empresa.
- Exportação e impressão além de CSV e PDF do extrato (RF18) e do comprovante (RF17), como relatórios consolidados de vários caixas.

## Critérios de aceite
- [ ] Fechar o caixa usa o método e o corpo definidos pela API, com fundo de caixa opcional, e a tela mostra o resumo devolvido.
- [ ] Passar o turno com dinheiro que fica na gaveta informado resulta, no turno novo, nesse fundo; sem informar, o aviso aparece e o fundo é o definido pela API.
- [ ] A retirada acima de (dinheiro esperado − fundo de caixa) é impedida e o limite aparece; nenhuma mensagem fala em troco padrão.
- [ ] Caixa e Manobrista veem e abrem o histórico de turnos do caixa aberto; Manobrista não vê a retirada.
- [ ] A lista de movimentos do caixa aberto aparece para os quatro perfis e mostra tipo, forma de pagamento, usuário, turno, valor e motivo.
- [ ] Administrador e Gerente veem o histórico de caixas fechados, filtram por período, paginam e abrem o extrato de um caixa; Caixa e Manobrista não veem essa área.
- [ ] Período com data inicial maior que a final mostra mensagem clara e não chama a API.
- [ ] Caixa fechado, sem movimentos, sem caixas no período e erro de rede têm estado próprio e claro.
- [ ] Diferenças de conferência são identificáveis por texto além da cor.
- [ ] Os movimentos do caixa aberto aparecem na página do caixa, filtráveis por tipo e por turno.
- [ ] Os gráficos e a linha do tempo refletem os mesmos números do resumo e dos movimentos.
- [ ] O PDF de fechamento e de passagem de turno traz esperado, informado e diferença por forma de pagamento.
- [ ] O extrato de um caixa fechado pode ser filtrado, baixado em CSV e gerado em PDF.
- [ ] Erros 400 da API aparecem com a mensagem devolvida por ela.
- [ ] Tudo funciona em desktop e mobile, com acessibilidade nível AA nas telas e modais novos.

## Métricas de sucesso
- Nenhuma divergência entre o que a tela envia e o contrato da API nas operações de caixa.
- Operador consegue ver o saldo, o disponível para retirada e as diferenças sem abrir um modal.
- Gestão consegue auditar um caixa fechado (totais e extrato) sem sair do sistema.

## Decisões tomadas
- Elementos extras da visão melhorada: gráficos, linha do tempo e comprovante em PDF (RF15 a RF17).
- Movimentos do caixa aberto ficam na própria página do caixa (RF14).
- Extrato de caixa fechado com filtro por tipo e turno, CSV e PDF (RF18).
- Erros de regra de negócio (400) mostram a mensagem da API.

## Questões em aberto
- O formato real das respostas de turno, caixa, histórico e movimentos ainda precisa ser conferido: o swagger só traz descrições em texto. Combinado: liberar o acesso à API (por regra de permissão) para consultar as respostas reais antes do design e da tech spec.
- O PDF e o CSV são gerados no navegador ou pela API? A API do swagger não oferece exportação, então a premissa é gerar no navegador, a confirmar na tech spec.
