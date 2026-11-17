# PRD: Ajustes de UX mobile — saída sem cobrança e fila do lavador

Origem: itens 1 e 2 de `docs/specs/relatorio-regressao-mobile-2026-11-17.md`.

## Problema
**Saída sem cobrança.** Quando o veículo sai e não há nada a cobrar (R$ 0,00, por exemplo dentro do tempo grátis), a tela mostra "Nada a cobrar" mas ainda pede a forma de pagamento e "Cliente pagou com". O botão de confirmar fica desabilitado até o operador escolher "Exato". O operador perde tempo, com o carro esperando, e responde perguntas que não fazem sentido. O recibo ainda registra uma forma de pagamento que não existiu.

**Fila do lavador.** A fila abre sempre na aba "Na fila". Quando ela está vazia, o lavador vê "Nenhum carro esperando serviço" e não percebe que há um carro "em andamento" que já passou da previsão. O que é mais urgente fica escondido atrás de outra aba. Os contadores do topo (na fila, em andamento, pronto, passou da previsão) parecem filtros, mas não levam a lugar nenhum.

## Objetivo
- Registrar uma saída sem cobrança com o mínimo de toques e sem perguntas de pagamento.
- Ao abrir a fila, o lavador cai direto no que precisa da atenção dele, e consegue ir a qualquer grupo pelos contadores do topo.

## Usuário-alvo
- **Operador de pátio e de caixa** (administrador, gerente, caixa, manobrista), usando o celular na saída de veículos.
- **Lavador**, usando o celular durante o dia para acompanhar e atualizar a fila de serviços.

## Requisitos funcionais
### Saída sem cobrança
- RF1: Quando o valor a cobrar é R$ 0,00, a tela de confirmar saída não mostra "Forma de pagamento" nem "Cliente pagou com".
- RF2: Nesse caso o botão "Confirmar saída" já está habilitado, sem nenhuma escolha prévia, e o texto do botão deixa claro que é sem cobrança (por exemplo "Confirmar saída · Sem cobrança").
- RF3: O recibo dessa saída mostra "Pagamento: Sem cobrança" e não mostra valor recebido nem troco. Comportamento já existente e que deve ser mantido.
- RF4: Quando o valor a cobrar é maior que zero, a tela continua exatamente como hoje (forma de pagamento e, em dinheiro, "Cliente pagou com").
- RF5: Se o valor a cobrar mudar entre R$ 0,00 e maior que zero enquanto a tela está aberta, a tela se ajusta, sem manter escolhas que deixaram de valer.

### Fila do lavador
- RF6: Ao abrir a fila no celular, a aba selecionada é a de maior prioridade que tenha itens, nesta ordem: "Em andamento", "Na fila", "Pronto". Se todas estiverem vazias, abre em "Na fila".
- RF7: Se algum serviço passou da previsão, a aba que o contém é a escolhida primeiro, e o item atrasado aparece no topo dela.
- RF8: Os contadores do topo ("na fila", "em andamento", "pronto", "passou da previsão") são tocáveis. Tocar em um leva à aba correspondente. "Passou da previsão" leva à aba que tem o item atrasado.
- RF9: Depois que o lavador escolhe uma aba, a fila não muda de aba sozinha nas atualizações automáticas. A regra do RF6 vale só ao abrir a tela.
- RF10: Os rótulos das abas cabem em uma linha no celular, sem quebrar em várias linhas.

## Fora de escopo
- Mudar a regra de cálculo do valor a cobrar.
- Mudar a saída de mensalista, que já é sem cobrança.
- Mudar o fluxo de saída com cobrança.
- Alterar a versão desktop da fila, a não ser que o comportamento do RF6 já seja o mesmo lá.
- Os demais itens do relatório mobile (alvos de toque, ilustração cortada, compartilhamento do comprovante etc.).

## Critérios de aceite
- [ ] Saída com valor R$ 0,00: não aparece forma de pagamento nem "Cliente pagou com", e o botão de confirmar está habilitado.
- [ ] Confirmar essa saída gera o recibo "Pagamento: Sem cobrança", sem valor recebido nem troco.
- [ ] Saída com valor maior que zero: tela e validações iguais às de hoje (inclusive o botão desabilitado até escolher a forma de pagamento).
- [ ] Fila com 0 na fila, 1 em andamento e 1 pronto abre em "Em andamento".
- [ ] Fila com itens só em "Pronto" abre em "Pronto"; fila toda vazia abre em "Na fila".
- [ ] Com um serviço atrasado, a fila abre na aba dele e ele aparece no topo.
- [ ] Tocar em cada contador leva à aba certa.
- [ ] Depois de escolher uma aba, uma atualização automática não troca a aba.
- [ ] Os rótulos das abas ficam em uma linha em 390px de largura.
- [ ] Os fluxos que já funcionavam (entrada, saída com cobrança, mover serviços na fila) continuam iguais.

## Métricas de sucesso
- Menos toques para registrar uma saída sem cobrança: de 3 (forma, "Exato", confirmar) para 1 (confirmar).
- O lavador chega ao serviço atrasado em 0 toques ao abrir a fila.
- Zero ocorrências de "Forma null" ou de forma de pagamento registrada em saída sem cobrança no relatório de uma nova regressão.

## Pontos em aberto
- **Registro no sistema (resolvido pelo usuário):** a API aceita a saída sem forma de pagamento quando o valor é R$ 0,00. Resta ao Tech Spec confirmar no código como o front envia esse caso (campo omitido ou nulo).
- **Prioridade entre abas:** a ordem proposta no RF6 ("Em andamento" antes de "Na fila") assume que o lavador cuida primeiro do que já começou. Se a operação preferir começar pela fila, a ordem muda.
- **Aba "Pronto" com carro esperando retirada há muito tempo** (hoje um carro aparece "aguardando retirada há 104 h"): fica fora desta versão, mas vale decidir se também merece destaque.
