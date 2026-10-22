# PRD: Nota Fiscal

## Problema
Quem paga a saída e precisa de nota fiscal hoje depende de pedir ao operador, que anota os dados por fora do sistema. O cliente não tem como solicitar a nota sozinho, a empresa não vê quais notas estão pendentes de lançamento, e nada garante que o valor pedido bate com o do recibo. O recibo online já guarda se uma nota foi solicitada (`notaFiscalSolicitada`), mas não há por onde solicitá-la nem onde acompanhar.

## Objetivo
O cliente (ou o operador, por ele) solicita a nota fiscal de uma saída paga na hora, pelo recibo da tela de saída ou pela página pública do recibo, e a empresa acompanha em uma tela as notas pendentes de lançamento e as já lançadas.

## Usuário-alvo
- **Cliente do estacionamento:** pede a nota pela página pública do recibo, sem login, no celular.
- **Operador (caixa):** depois de registrar a saída, oferece a nota na hora, quando o cliente pede ao balcão.
- **Administrador / gestor e operador com permissão administrativa:** acompanham as notas pendentes e lançadas e fazem o lançamento fora do sistema.

## Requisitos funcionais
- RF1: Depois de registrar uma saída com cobrança, o recibo da tela de saída oferece **"Gerar nota fiscal"**, que abre o modal de solicitação.
- RF2: A página pública do recibo oferece **"Solicitar nota fiscal"** para saídas com cobrança que ainda não têm nota solicitada; o botão abre o mesmo modal.
- RF3: O modal pede **e-mail** (obrigatório, até 150 caracteres), pergunta se é **pessoa jurídica** (caixa de seleção, desmarcada por padrão = pessoa física) e pede o documento: para pessoa física, o **CPF** é opcional (se informado, válido); para pessoa jurídica, o **CNPJ** é **obrigatório** e válido (inclusive o alfanumérico). O documento aceita máscara. O modal mostra o **valor do recibo**, que não pode ser alterado.
- RF4: Ao confirmar, a solicitação é registrada como **pendente de lançamento** na empresa e o usuário vê a confirmação com a data da solicitação. É uma nota por recibo.
- RF5: Se a nota daquele recibo já foi solicitada, o botão deixa de aparecer e a página/recibo informam "Nota fiscal solicitada".
- RF6: Saídas sem cobrança (mensalista) e recibos sem código não oferecem a nota.
- RF7: Erros do modal são ditos com clareza: dados inválidos (campo a campo), nota já solicitada para o recibo, excesso de tentativas (limite de 10 por minuto por endereço), recibo não encontrado ou não pago, e falha de rede, com opção de tentar de novo.
- RF8: Nova tela **"Notas Fiscais"** no menu, com duas abas: **Pendentes** (solicitações aguardando lançamento) e **Lançadas** (já lançadas), esta com filtro de período que começa no mês atual.
- RF9: Cada nota listada mostra, no mínimo: valor, data da solicitação e dados de quem a solicitou (documento e e-mail), além de a que saída ela se refere. As colunas exatas dependem do que a consulta devolve **[A DEFINIR]**.
- RF10: A tela de notas é só de consulta: o lançamento da nota continua sendo feito fora do sistema.
- RF11: Estados da tela: carregando, vazio ("Nenhuma nota pendente", "Nenhuma nota lançada neste período"), erro com "Tentar novamente".
- RF12: O acesso segue a regra das telas administrativas (as mesmas de Preços e Usuários): quem não tem permissão abre a tela e recebe o aviso "Você não tem permissão para acessar esta página", sem ver nenhuma nota. O menu hoje não esconde itens por perfil, então o item aparece para todos.

## Fora de escopo
- Emitir ou lançar a nota fiscal dentro do sistema (a empresa lança fora e o acompanhamento é só de consulta).
- Marcar uma nota como lançada, cancelar ou editar uma solicitação.
- Download, envio ou visualização do arquivo da nota; envio de e-mail ao cliente.
- Solicitar nota de saídas antigas por dentro do sistema, fora do recibo.
- Notas para saídas sem cobrança.
- Relatórios e exportação das notas.

## Critérios de aceite
- [ ] Depois de uma saída com cobrança, o recibo da tela oferece "Gerar nota fiscal", que abre o modal com o valor do recibo travado.
- [ ] Na página pública do recibo, o cliente solicita a nota pelo mesmo modal, sem login.
- [ ] E-mail vazio ou inválido, CPF inválido (quando preenchido) e, com pessoa jurídica marcada, CNPJ vazio ou inválido, são recusados com a mensagem no campo e nada é enviado.
- [ ] Marcar ou desmarcar "Pessoa jurídica" troca o campo entre CPF (opcional) e CNPJ (obrigatório), com a máscara certa, e limpa o documento digitado.
- [ ] Solicitação aceita mostra a confirmação com a data e muda o recibo para "Nota fiscal solicitada", sem o botão.
- [ ] Segunda solicitação para o mesmo recibo mostra que já foi solicitada.
- [ ] Saída de mensalista e recibo sem código não mostram a opção de nota.
- [ ] A tela "Notas Fiscais" lista as pendentes e, em outra aba, as lançadas do período escolhido (padrão: mês atual).
- [ ] Cada aba tem estado de carregando, vazio e erro com nova tentativa.
- [ ] Usuário sem permissão abre a tela e vê o aviso de acesso negado, sem nenhuma nota na tela.
- [ ] Modal e telas funcionam no celular e no computador, nos temas claro e escuro, e por teclado.

## Métricas de sucesso (se aplicável)
Sem métricas numéricas. Sucesso = o cliente solicita a nota sozinho, sem pedir ao operador por fora do sistema, e a empresa enxerga todas as pendentes em um lugar.

## Pontos em aberto
- **Formato das listas:** o exemplo não traz as respostas de pendentes e lançadas; as colunas da tela (RF9) dependem delas.
- **Código do recibo na saída:** a opção depois da saída precisa do `tokenRecibo` na resposta que registra a saída (mesmo ponto pendente do recibo público).
- **Campo de documento e e-mail do operador:** o modal é o mesmo para o operador e para o cliente; se o operador deve poder preencher pelo cliente ou se o e-mail é sempre do cliente está assumido como o mesmo fluxo.
- **Dados pessoais:** documento e e-mail aparecem só na tela de notas, para quem tem acesso, e não devem ser registrados em logs.
- **Token real no `input.md`:** o exemplo inclui um token de acesso real; não foi copiado para nenhum arquivo e recomenda-se revogá-lo ou trocá-lo.
