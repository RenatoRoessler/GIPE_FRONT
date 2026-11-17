# Design: Saída sem cobrança e fila do lavador (mobile)

Referências: ./prd.md. Tokens e componentes de `src/styles/theme.ts` e `src/components/ui`. Nenhum valor visual novo: tudo sai do tema.

## 1. Saída sem cobrança

### Estados da tela "Confirmar saída"
| Estado | O que a pessoa vê |
|--------|-------------------|
| Com cobrança (como hoje) | Resumo, "Valor a cobrar", forma de pagamento, "Cliente pagou com" (só em dinheiro). Botão "Confirmar Saída · R$ X", desabilitado até escolher. |
| **Sem cobrança (novo para avulso; já existia para mensalista)** | Resumo, bloco "Valor a cobrar: Nada a cobrar", e a frase "Sem pagamento nesta saída." no lugar das escolhas de pagamento. Botão **"Confirmar saída · Sem cobrança"**, habilitado. |
| Registrando | Botão "Registrando…" desabilitado (igual hoje). |
| Valor mudou | O aviso de valor novo continua como hoje; se passa de maior que zero para zero (ou o contrário), a área de pagamento troca sem manter o que estava escolhido. |
| Erro ao registrar | `ErrorBanner` com `role="alert"` acima da área de pagamento (igual hoje). |

### Layout (celular, 390px)
Mesma estrutura do modal atual (modal em tela cheia, conteúdo rolável, rodapé fixo com o botão principal e "Voltar para a pesquisa"). Só muda o miolo:
- O bloco "Valor a cobrar / Nada a cobrar" permanece em destaque.
- Abaixo dele, no lugar de "Forma de pagamento" e "Cliente pagou com", entra **uma linha de apoio** (`Hint`): "Sem pagamento nesta saída." É o mesmo texto e o mesmo componente que o mensalista já usa, para o operador ver a mesma mensagem nos dois casos.
- O rodapé fixo mostra só o botão principal habilitado e o secundário. Sem texto de motivo de bloqueio, porque não há bloqueio.

### Componentes reaproveitados
- `Modal` (tela cheia no celular), `Button` primário e secundário, `ErrorBanner`.
- `ResumoSaida` (placa, modelo, entrada, permanência, valor a cobrar).
- `Hint` (já usado no estado do mensalista).
- Nenhum componente novo.

### Tokens
Os mesmos da tela atual. Nenhum token novo.

### Recibo
Sem mudança visual: "Pagamento: Sem cobrança", sem "Valor recebido" nem "Troco" (já corrigido em `docs/specs/correcoes-regressao`).

### Acessibilidade
- Ao entrar no estado sem cobrança, o título da fase anuncia "Veículo encontrado. Confirme os dados." (o texto atual fala de "pagamento"; ajustar para não citar pagamento quando não há).
- O botão tem nome acessível claro: "Confirmar saída, sem cobrança".

## 2. Fila do lavador

### Abas no celular (`Tabs` variante `segmentada`)
- **Aba inicial** (só quando a URL não traz `?status=`): a primeira, nesta ordem, que tenha itens: "Em andamento", "Na fila", "Pronto"; se um serviço está atrasado, a aba dele vem antes de todas; tudo vazio, "Na fila". Depois que a pessoa escolhe uma aba, a escolha vai para a URL (como hoje) e não muda mais sozinha.
- **Rótulo da aba, uma linha, sem quebra:** o rótulo e a contagem deixam de ficar na mesma frase. Cada aba mostra a **contagem em cima (negrito)** e o **nome embaixo (`xs`, 12px)**, por exemplo `1` / `Em andamento`. As três abas têm a mesma altura e nenhuma quebra de linha por acidente. O nome fica em uma linha (`white-space: nowrap`), com padding horizontal menor (`space[2]`) para caber "Em andamento" em ~117px de largura.
- **Aba com serviço atrasado:** um ponto `danger` pequeno ao lado da contagem. A cor não é a única pista: o nome acessível da aba inclui "1 passou da previsão".
- Altura mínima da aba: `touchTarget` (44px, já usado pelo `Tabs`).

### Contadores do topo (`ResumoDaFila`)
- Hoje são pílulas só de leitura. Passam a ser **botões**, com a mesma aparência de pílula (mesmos tokens de hoje), mais:
  - altura mínima `touchTarget` (44px) em vez de ~28px;
  - estado de hover/pressionado com `surfaceMuted`;
  - anel de foco com `focus`;
  - a pílula da aba atual fica com borda `text` para mostrar "você está aqui".
- Toque em "na fila" / "em andamento" / "pronto" abre a aba correspondente. Toque em "passou da previsão" abre a aba do item atrasado e **rola até ele**.
- No desktop, as três colunas já estão todas visíveis: os contadores ficam como estão (só leitura), sem virar botão.

### Ordem dentro da coluna
Itens atrasados vêm primeiro, do mais atrasado para o menos; depois os demais na ordem de hoje. O cartão atrasado mantém o destaque atual (`danger`/`dangerSoft`).

### Estados
| Estado | O que a pessoa vê |
|--------|-------------------|
| Carregando | `Skeleton` no lugar dos cartões (igual hoje). |
| Fila vazia | Mensagem atual "Nenhum serviço na fila…". Sem abas selecionadas por prioridade. |
| Aba vazia (escolhida à mão) | "Nenhum carro esperando serviço" etc., como hoje. |
| Busca sem resultado | Mensagem + "Limpar busca" (igual hoje). A aba inicial usa a fila inteira, não o resultado da busca. |
| Sem permissão | `ErroSemPermissao` (igual hoje). |

### Componentes
- Reaproveitados: `Tabs` (segmentada), `ResumoDaFila`, `FilaCard`, `Skeleton`, `Button`.
- **Mudança em componente existente:** `Tabs` precisa aceitar um rótulo com conteúdo (contagem + nome + marca de atrasado) em vez de só texto. Fica no design system, não solto na feature.
- **Mudança em `ResumoDaFila`:** `Chip` vira botão com `onSelecionar`. A versão não interativa (desktop) continua disponível.
- O rótulo "Placa ou prisma" que repete o placeholder fica fora desta versão.

### Tokens usados
`colors.text`, `colors.textMuted`, `colors.border`, `colors.surface`, `colors.surfaceMuted`, `colors.danger`, `colors.dangerSoft`, `colors.focus`, `colors.warn`, `colors.success`; `space[1]`, `space[2]`, `space[3]`; `fontSizes.xs` e `sm`; `fontWeights.bold` e `semibold`; `radii.full`; `touchTarget` (44px). Nenhum token novo.

## 3. Responsividade
- **Celular (≤ ~600px):** o que está descrito acima.
- **Tablet e desktop:** saída igual para os dois casos (modal centralizado em duas colunas: resumo à esquerda, pagamento à direita; no sem cobrança, a coluna direita tem só a frase de apoio). A fila mantém as três colunas e os contadores só de leitura.
- Conferir em 360px (celulares pequenos): "Em andamento" ainda cabe em uma linha.

## 4. Decisões
- **Contagem em cima, nome embaixo** em vez de "Nome (n)": evita a quebra em 3 linhas observada em 390px sem reduzir o texto abaixo de 12px.
- **Contadores como botões** em vez de adicionar um filtro novo: reaproveita o que o lavador já lê, sem poluir a tela com outro controle.
- **Mesma frase para mensalista e saída de R$ 0,00:** a operação entende que ambos são "saída sem pagamento", sem aprender uma mensagem nova.
