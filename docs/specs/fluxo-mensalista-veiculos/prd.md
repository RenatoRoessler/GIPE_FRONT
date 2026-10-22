# PRD: Fluxo de Entrada e Saída de Veículos para Mensalista

## Problema
Hoje, na entrada de veículos, o operador precisa marcar manualmente um checkbox "Mensalista". Isso depende da memória do operador, permite erro (marcar um avulso como mensalista ou esquecer de marcar um mensalista) e ignora o cadastro de mensalistas que a empresa já mantém no sistema. Na saída, o operador não tem um aviso claro de que o veículo é de um mensalista, e o fluxo de cobrança não deixa explícito que não há valor a pagar.

## Objetivo
O sistema passa a identificar sozinho se o veículo pertence a um mensalista, avisa o operador com um card visível na entrada e na saída, e permite concluir a saída do mensalista sem cobrança.

## Usuário-alvo
Operador de estacionamento no balcão/portaria, registrando entradas e saídas de veículos no dia a dia, com pouco tempo por atendimento.

## Requisitos funcionais
- RF1: Remover da tela de entrada de veículos o checkbox/opção manual de "Mensalista". A condição de mensalista deixa de ser informada pelo operador.
- RF2: Na entrada, quando o veículo informado for identificado como de um mensalista, exibir um card em destaque informando que se trata de um mensalista (com o nome do mensalista).
- RF3: Na entrada, quando o veículo não for identificado como de mensalista, nenhum card é exibido e o fluxo segue como de um avulso.
- RF3a: Na entrada, quando o veículo for de um mensalista mas estiver fora do plano contratado (ex.: fora do horário), exibir um card de aviso dizendo que o cliente é mensalista, porém a entrada será registrada como rotativo (cobrada normalmente).
- RF4: A entrada de um veículo identificado como mensalista é registrada como mensalista, sem que o operador precise fazer nada além do fluxo normal de entrada.
- RF5: Na saída, quando o veículo for identificado como de um mensalista, exibir um card informando que é um mensalista.
- RF6: Na saída de mensalista, o valor a pagar é zero e o operador conclui a saída sem etapa de pagamento.
- RF7: Na saída de veículo não mensalista, o fluxo de cobrança continua como hoje.

## Fora de escopo
- Cadastro, edição e vínculo de mensalistas e veículos (já existem em "Mensalistas").
- Cobrança, vencimento ou inadimplência da mensalidade; bloquear ou tratar mensalista inativo/inadimplente de forma diferente.
- Alterar tabela de preços, caixa ou relatórios.
- Permitir que o operador force ou corrija manualmente a condição de mensalista.

## Critérios de aceite
- [ ] A tela de entrada de veículos não exibe mais o campo "Mensalista".
- [ ] Ao informar na entrada um veículo de mensalista, aparece um card indicando mensalista (com nome) e a entrada é registrada como mensalista.
- [ ] Ao informar na entrada um veículo que não é de mensalista, nenhum card aparece.
- [ ] Ao informar na entrada um veículo de mensalista fora do horário contratado, aparece o aviso "mensalista, mas entra como rotativo" e a entrada é registrada como rotativo (`mensalista: false`).
- [ ] Na saída de um veículo de mensalista, aparece um card indicando mensalista e o valor a pagar é R$ 0,00.
- [ ] A saída de mensalista é concluída sem pedir forma de pagamento e não gera cobrança no caixa.
- [ ] A saída de um veículo avulso segue com cálculo e pagamento como antes.
- [ ] O card é compreensível por leitores de tela e não depende só de cor.

## Pontos em aberto [A DEFINIR]
- ~~Como o sistema identifica o mensalista na entrada~~ **Definido:** pela consulta da placa (`GET /Veiculo/{placa}`), que devolve `mensalista` e `dadosMensalista`. Fora do horário contratado, o back devolve `mensalista: false` com `dadosMensalista`, e a entrada é rotativa com aviso (RF3a).
- Se o mensalista estiver inativo, ou tiver o contrato pendente de aceite, deve ser tratado como mensalista ou como avulso? (hoje: vale o booleano `mensalista` do back)
- Se a identificação na entrada falhar (erro de rede), o operador segue como avulso ou é bloqueado?
- Se, na saída, a identificação vem da própria entrada registrada ou de nova consulta ao cadastro.

## Métricas de sucesso (se aplicável)
Sem métricas numéricas. Sucesso = zero entradas de mensalista dependentes de marcação manual e nenhuma cobrança indevida na saída de mensalistas.
