# PRD: Registrar Entrada de Veículo

## Problema
Hoje não há como lançar a entrada de um veículo no pátio pelo sistema. O operador precisa registrar cada entrada de forma rápida, na portaria, e sem erros de digitação (placa, categoria, ticket), porque esses dados definem a cobrança e evitam duplicidades no pátio.

## Objetivo
Ao final, o operador consegue registrar a entrada de um veículo em poucos passos, a partir de um botão **Registrar entrada** na Home e na tela Entrada de Veículos, em um modal que valida a placa, aproveita dados já cadastrados do veículo e gera o ticket automaticamente.

## Usuário-alvo
Operadores da portaria e do caixa (Administrador, Gerente, Caixa e Manobrista) durante o expediente, muitas vezes com fila de veículos e pouco tempo por atendimento. O registro só é possível com o caixa aberto.

## Requisitos funcionais
- RF1: A Home exibe o botão **Registrar entrada**, no mesmo estilo visual do botão de ação do modelo B de sinalização (`docs/design/layouts/modelo-b-sinalizacao.html`). A tela Entrada de Veículos também oferece o mesmo botão. Ambos abrem o mesmo modal.
- RF2: O modal tem os campos: Placa, Categoria, Código do ticket, Mensalista, Modelo e Cor.
- RF3: **Placa** é texto. Aceita o padrão antigo (ABC1234) e o Mercosul (ABC1D23), sem diferenciar maiúsculas de minúsculas. Placa fora do padrão mostra a mensagem "Placa inválida. Informe no padrão antigo (ABC1234) ou Mercosul (ABC1D23)" e impede o registro.
- RF4: Quando uma placa válida é informada (ao sair do campo), o sistema consulta se o veículo já tem cadastro. Se tiver, preenche Modelo, Cor e Categoria com os dados encontrados, que continuam editáveis. Se não tiver, os campos ficam como estão, sem erro.
- RF5: **Categoria** é uma lista de escolha obrigatória com: Moto, Carro pequeno, Carro médio, SUV/Pick-up, Caminhonete, Caminhão e Carro grande. A opção "Todas" não aparece (existe apenas na tabela de preço).
- RF6: **Código do ticket** é exibido desabilitado, gerado automaticamente a partir da hora da entrada. Se o sistema informar que o ticket já está em uso, um novo código é gerado e o registro é tentado novamente sem exigir ação do usuário.
- RF7: **Mensalista** é uma escolha Sim/Não, com Não como padrão.
- RF8: **Modelo** é texto livre com sugestões: a partir de 2 caracteres digitados, o sistema oferece modelos correspondentes. Escolher uma sugestão preenche a Categoria correspondente (editável). Digitar um modelo que não está na lista é permitido.
- RF9: **Cor** é texto livre.
- RF10: Ao confirmar com dados válidos, a entrada é registrada, o modal fecha e aparece o aviso "Entrada registrada." O botão e o modal ficam bloqueados enquanto o registro é enviado, evitando envio duplicado.
- RF11: Se o registro falhar (sem caixa aberto, veículo já no pátio, dados inválidos, sem permissão ou falha de rede), o motivo é exibido no modal, os dados digitados são preservados e o usuário pode corrigir e tentar de novo.

## Fora de escopo
- Registro de saída e cobrança.
- Impressão ou envio do ticket ao cliente.
- Cadastro, edição ou exclusão de veículos e modelos fora do fluxo de entrada.
- Leitura de placa por câmera ou leitor.
- Exibir comprovante/resumo da entrada após o registro (apenas o aviso de sucesso).
- Listagem do pátio e remoção de uma entrada já registrada.

## Critérios de aceite
- [ ] Dado um usuário logado, quando abre a Home ou a tela Entrada de Veículos, então vê o botão **Registrar entrada** e ele abre o modal.
- [ ] Dado o modal aberto, quando digita uma placa fora dos dois padrões, então vê "Placa inválida. Informe no padrão antigo (ABC1234) ou Mercosul (ABC1D23)" e não consegue registrar.
- [ ] Dado uma placa válida de veículo já cadastrado, quando sai do campo, então Modelo, Cor e Categoria são preenchidos com os dados cadastrados.
- [ ] Dado uma placa válida sem cadastro, quando sai do campo, então o formulário segue editável, sem mensagem de erro.
- [ ] Dado o campo Modelo, quando digita 2 ou mais caracteres, então aparecem sugestões; com menos de 2, não aparecem.
- [ ] Dado que escolhe uma sugestão de modelo, então a Categoria é preenchida e continua editável.
- [ ] Dado o modal aberto, então o Código do ticket está preenchido e desabilitado, e Mensalista está em "Não".
- [ ] Dado que a Categoria não foi escolhida, quando tenta registrar, então vê mensagem de campo obrigatório.
- [ ] Dado dados válidos e caixa aberto, quando confirma, então a entrada é registrada, o modal fecha e aparece "Entrada registrada."
- [ ] Dado que o ticket gerado já está em uso, quando confirma, então o sistema gera outro código e conclui o registro sem o usuário precisar agir.
- [ ] Dado que não há caixa aberto ou o veículo já está no pátio, quando confirma, então o motivo aparece no modal e os dados digitados são mantidos.
- [ ] Dado o registro em andamento, então não é possível enviar uma segunda vez.
- [ ] O modal pode ser fechado com a tecla Esc e é utilizável por teclado e leitor de tela (WCAG 2.2 AA), em desktop e mobile.

## Métricas de sucesso (se aplicável)
- Tempo para registrar uma entrada de veículo já cadastrado: menos de 15 segundos.
- Redução de entradas rejeitadas por placa inválida ou categoria faltando: [A DEFINIR] baseline.

## Pontos em aberto
- **Código do ticket:** a descrição original pedia um valor alfanumérico, mas o contrato recebido usa número. Decisão: numérico, gerado a partir da hora, com nova tentativa se já estiver em uso. Confirmar com o backend se haverá formato alfanumérico no futuro.
- Se o veículo cadastrado tiver uma categoria diferente da sugerida pelo modelo, vale a do cadastro do veículo (a confirmar).
