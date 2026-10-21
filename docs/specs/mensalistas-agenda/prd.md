# PRD: Agenda de vencimentos dos mensalistas

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-10-21
**Versão:** 1.0

---

## 1. Objetivo

Dar ao operador uma tela que responda, ao abrir, "quem eu preciso atender agora?". A lista de mensalistas passa a ter uma visão em forma de agenda, organizada por urgência: quem está atrasado, quem vence hoje, quem vence nesta semana e quem ainda não começou a pagar. Cada item leva direto à ação certa, em especial receber o pagamento, no computador e no celular.

O valor é transformar a consulta de cadastros numa fila de trabalho. O operador deixa de procurar mensalista por mensalista e passa a cobrar na ordem em que a cobrança importa.

## 2. Contexto e Motivação

A gestão de mensalistas já permite cadastrar, acompanhar o contrato e registrar o pagamento (`docs/specs/mensalistas/prd.md`, `docs/specs/mensalistas-contrato/prd.md`, `docs/specs/mensalistas-pagamento/prd.md`). O que falta é a leitura da lista:

- A lista tem oito colunas e linhas altas, e cabem poucos mensalistas por tela.
- Não há resumo, filtro por situação nem ordem por vencimento.
- A coluna "Vencimento" mostra o dia do cadastro ("dia 5"), e não a data da próxima cobrança nem o atraso, embora a API já devolva a data do próximo vencimento e os dias até ela.
- Receber o pagamento é um ícone sem texto entre outros dois; só quem aguarda o primeiro pagamento ganha um botão com nome.
- A busca aceita só CPF ou CNPJ, mas o mensalista costuma chegar pelo carro.

A análise e os modelos de layout estão no artefato de apoio da tela. A direção escolhida foi o modelo "Agenda de vencimentos", pensado para computador e celular.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Operador com permissão administrativa | Ver quem cobrar primeiro, receber o pagamento em poucos toques e achar um mensalista pela placa | No balcão ou no pátio, várias vezes ao dia, no computador ou no celular |
| Administrador / gestor | Acompanhar atrasos e cadastros parados (contrato não aceito, primeiro pagamento pendente) | No computador, de vez em quando |

A regra de acesso é a da gestão de mensalistas existente. Quem não tem permissão não vê a página.

## 4. Escopo

### Dentro do Escopo
- Nova visão "Agenda" na página de Mensalistas, ao lado das visões "Lista" e "Tipos de mensalidade".
- Itens agrupados por urgência: atrasados, vencem hoje, vencem esta semana e ainda sem pagamento (primeiro pagamento ou contrato pendente).
- Resumo do período: quantos vencem até o fim da semana e o total a receber.
- Em cada item: data do vencimento e atraso, nome, tipo, placas, valor e a ação principal.
- Receber o pagamento direto do item, usando o fluxo de pagamento que já existe.
- Reenviar o contrato direto do item, nos cadastros que esperam o aceite.
- Abrir a ficha (e, por ela, a edição) a partir do item.
- Busca na agenda por nome, placa ou documento.
- Acesso à lista completa e aos mensalistas em dia.
- Layout pensado para o celular: itens de duas linhas, alvos de toque de 44px, ações principais ao alcance do polegar.
- Estados de carregamento, vazio e erro.

### Fora do Escopo
- Cobrança automática, lembretes por mensagem ou e-mail, e notificações.
- Histórico de cobranças, relatório de inadimplência e exportação.
- Mudar as regras de vencimento, tolerância de atraso ou valor da mensalidade.
- Estorno ou edição de pagamento.
- Reconhecer o mensalista pela placa na entrada e na saída de veículos.
- Visão em quadro por etapas (jornada em colunas).

## 5. Requisitos Funcionais

### RF-01: Ver os mensalistas por urgência
**Critério de aceite:**
- Dado que o operador abre a agenda, então vê os grupos, nesta ordem: **Atrasados**, **Vencem hoje**, **Esta semana** (até domingo) e **Ainda sem pagamento**.
- Dado um grupo sem itens, então ele não aparece.
- Dado um atrasado, então o grupo é ordenado do mais antigo para o mais recente; nos demais, pela data do vencimento.
- Dado um mensalista em dia com vencimento depois do fim da semana, então ele não aparece nos grupos, e há um aviso com a quantidade e o acesso à lista completa.

### RF-02: Entender cada item de relance
**Critério de aceite:**
- Dado um item de cobrança, então mostra a data do vencimento e, se atrasado, quantos dias de atraso; o nome; o tipo e a categoria; as placas (as primeiras e o total das demais); e o valor da mensalidade.
- Dado um mensalista sem veículos, então a área de placas fica vazia sem quebrar o item.
- Dado um item que espera o primeiro pagamento ou o aceite do contrato, então mostra a situação em texto (por exemplo "Contrato aceito em 20/10" ou "Link vence em 27/10") no lugar da data de vencimento.
- A situação nunca é indicada só por cor.

### RF-03: Receber o pagamento direto da agenda
**Critério de aceite:**
- Dado um item liberado para pagamento, quando o operador toca em "Receber", então abre o registro de pagamento daquele mensalista, sem passar pela ficha.
- Dado o pagamento registrado, então o item sai do grupo em que estava e a agenda se atualiza sem recarregar a página.
- Dado um mensalista que ainda não aceitou o contrato, então o botão "Receber" não é oferecido; o item oferece reenviar o contrato.

### RF-04: Ver o resumo do período
**Critério de aceite:**
- Dado a agenda aberta, então mostra, em uma frase, quantos mensalistas vencem até o domingo e a soma dos valores.
- Dado nenhum vencimento no período, então a frase diz isso em vez de mostrar zero.
- [A CONFIRMAR] se a soma considera o valor da mensalidade do tipo ou o valor da cobrança pendente.

### RF-05: Agir sobre contratos parados
**Critério de aceite:**
- Dado um cadastro com contrato pendente ou com link vencido, então o item oferece "Reenviar", com o mesmo comportamento já existente na lista (mensagem de sucesso com o e-mail, bloqueio só daquele item).
- Dado um cadastro com contrato aceito e sem pagamento, então o item oferece "Receber" como ação principal.

### RF-06: Abrir a ficha e editar
**Critério de aceite:**
- Dado um item, quando o operador toca no nome, então abre a ficha do mensalista.
- Dado a ficha aberta pelo item, então ela oferece editar, registrar o pagamento e, quando cabe, reenviar o contrato, como já faz hoje. A agenda não tem um menu extra de ações.
- Todas as ações têm nome acessível que cita o mensalista.

### RF-07: Buscar na agenda
**Critério de aceite:**
- Dado um texto digitado, então a agenda mostra só os mensalistas cujo nome, placa ou documento contenham o texto, mantendo os grupos.
- Dado um texto sem resultado, então a mensagem diz que nada foi encontrado e oferece limpar a busca.
- [A CONFIRMAR] se a busca por nome e placa é feita pela API ou sobre os dados já carregados.

### RF-08: Chegar à lista completa
**Critério de aceite:**
- Dado a agenda, então há um acesso claro à lista completa, com todos os cadastros, que continua com a busca por documento e passa a aceitar nome e placa.
- Dado o aviso de mensalistas em dia, então o acesso "Ver todos" leva à lista.

### RF-09: Usar no celular
**Critério de aceite:**
- Dado um celular, então cada item é uma linha de duas linhas, sem tabela e sem rolagem horizontal.
- Dado um celular, então botões, formas de pagamento e atalhos têm pelo menos 44px de altura e não ficam colados.
- Dado um celular, então o botão de confirmar o pagamento fica fixo na parte de baixo da tela e continua visível com o teclado aberto.
- Dado um celular, então as visões (Agenda, Lista, Tipos) cabem numa linha de atalhos que rola na horizontal.
- A agenda funciona de 320px até telas largas.

### RF-10: Tratar carregamento, vazio e erro
**Critério de aceite:**
- Dado o carregamento, então a agenda mostra esqueletos no formato dos grupos, sem saltos de layout.
- Dado que não há mensalistas a atender, então a agenda diz que está tudo em dia e mostra o acesso à lista.
- Dado um erro ao carregar, então mostra a mensagem do back em português e permite tentar de novo; um erro de permissão não oferece tentar de novo.

## 6. Requisitos Não-Funcionais

- **Performance:** a agenda abre rápido em conexão móvel comum; o resumo e os grupos aparecem juntos, sem se reordenar depois de carregados.
- **Acessibilidade:** WCAG 2.2 nível AA; cada grupo é uma seção com título; itens e ações navegáveis por teclado; foco visível; contraste mínimo de 4,5:1 nos textos e selos; atraso e situação sempre em texto.
- **Compatibilidade:** navegadores atuais de celular e computador, nos temas claro e escuro.
- **Consistência:** reutiliza os componentes e o fluxo de pagamento e de contrato já existentes, sem criar um segundo fluxo de pagamento.
- **Segurança:** só quem tem acesso à gestão de mensalistas vê a agenda; nenhum dado é exposto além do que a lista de mensalistas já mostra.

## 7. Fluxos Principais

### Fluxo 1: Cobrar quem está atrasado
1. O operador abre a agenda e vê o grupo "Atrasados" no topo.
2. Toca em "Receber" no primeiro item.
3. Informa o valor e a forma de pagamento e confirma.
4. O item sai de "Atrasados" e a agenda segue para o próximo.

### Fluxo 2: Achar o mensalista pela placa
1. O mensalista chega ao balcão; o operador digita a placa na busca.
2. A agenda mostra só aquele mensalista, no grupo em que ele está.
3. O operador abre a ficha ou recebe o pagamento.

### Fluxo 3: Destravar um contrato parado
1. O operador vê, em "Ainda sem pagamento", um cadastro com o link do contrato vencido.
2. Toca em "Reenviar".
3. O sistema avisa para qual e-mail o novo link foi enviado, e o item passa a mostrar a nova validade.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Toques do operador da agenda até o pagamento confirmado | Abrir ficha ou ícone, depois o pagamento | Do botão "Receber" ao pagamento, sem abrir a ficha |
| Atrasados identificados sem filtrar nem ordenar à mão | Não é possível hoje | O operador os vê ao abrir a tela |
| Uso no celular sem rolagem horizontal e com alvos de 44px | Tabela de 8 colunas | Atende em 320px |
| Atrasos que ficam sem cobrança por semana | [A DEFINIR] | [A DEFINIR] |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| A listagem é paginada por cadastro e não por vencimento; a agenda precisa dos mensalistas por urgência e dos totais | Alto | [A CONFIRMAR] com o back: ordenação por próximo vencimento, filtro por situação e totais. Sem isso, a agenda agrupa só a página carregada e o resumo fica incompleto |
| A listagem não diz se a cobrança está atrasada nem desde quando; traz `dataProximoVencimento` e `diasAteProximoVencimento` | Alto | [A CONFIRMAR] como o back marca o atraso (dias negativos, texto de `situacao`, tolerância de atraso do tipo) |
| A busca por nome e placa não existe na API (só por documento) | Médio | [A CONFIRMAR] um parâmetro de busca no back; alternativa: filtrar os dados já carregados |
| O valor a receber pode diferir da mensalidade do tipo | Médio | Mostrar o valor da mensalidade e deixar o valor real para o momento do pagamento |
| O pagamento ainda depende do `usuarioId` numérico que o token não traz (`docs/specs/mensalistas-pagamento`) | Alto | A agenda leva ao pagamento, então só entrega valor completo depois que o back resolver essa pendência |
| Uma agenda com muitos mensalistas pode ficar longa | Médio | Limitar os grupos de "esta semana" e "ainda sem pagamento" com "ver mais" e deixar os em dia na lista |

## 10. Referências

- Gestão de mensalistas: `docs/specs/mensalistas/prd.md`
- Veículos, contrato e aceite: `docs/specs/mensalistas-contrato/prd.md`
- Pagamento do mensalista: `docs/specs/mensalistas-pagamento/prd.md`
- Modelos de layout (análise da tela e modelo B no computador e no celular): https://claude.ai/artifact/XzKzxUJG7D9xfcJC9njZK3
- Dados já devolvidos pela listagem: `situacao`, `dataProximoVencimento`, `diasAteProximoVencimento`, `veiculos` (ver `docs/specs/mensalistas-contrato/techspec.md`)
