# Tech Spec: Saída sem cobrança e fila do lavador (mobile)

## Referências
- PRD: ./prd.md
- Design: ./design.md (spec de design via skill `claude-design`; esta seção resume só o que a implementação precisa)

## Design
- **Telas/estados:** modal "Confirmar saída" (com cobrança × sem cobrança) e fila de serviços no celular (abas, contadores do topo). Detalhes em `design.md`.
- **Componentes do design system reaproveitados:** `Modal`, `Button`, `ErrorBanner`, `Hint`, `Tabs` (variante `segmentada`), `Skeleton`, `FilaCard`.
- **Componentes novos:** nenhum. Mudanças em dois existentes:
  - `src/components/ui/Tabs`: aceitar rótulo com conteúdo e nome acessível próprio.
  - `src/components/servicos/ResumoDaFila`: contadores que podem ser botões.
- **Tokens:** só os já existentes no tema (`touchTarget`, `colors.*`, `space`, `fontSizes.xs/sm`, `radii.full`). Nenhum novo.

## Achados do código que moldam a solução
1. **Saída:** `semCobranca` em `useSaidaFlow.ts:324` é `consulta?.mensalista === true`. Por isso o avulso a R$ 0,00 ainda cai no fluxo com pagamento. O caminho do mensalista já faz o que queremos: `confirmar` envia `valor: valorACobrar(consulta)` (0) e `formaPagamento: FORMA_DINHEIRO`, sem lançar nada no caixa, e o recibo trata a forma vazia (correção de `docs/specs/correcoes-regressao`). Pelo que o usuário confirmou ("a API aceita sem forma de pagamento quando é R$ 0,00"), o avulso a R$ 0,00 pode usar o mesmo envio.
2. **Fila:** a aba do celular vem de `statusDaUrl(searchParams.get("status"))`, que devolve `Aguardando` sem parâmetro. `statusDaUrl` é exportada e testada (`statusDaUrl(null) → Aguardando`), então não pode mudar de contrato. A fila carrega de forma assíncrona, então a aba inicial só pode ser decidida depois da primeira resposta.
3. **`Tabs`:** `TabsItem.label` é `string`. Os outros usos continuam funcionando se o tipo passar a aceitar `ReactNode`.
4. **`ResumoDaFila`:** é usado só em `FilaServicos.tsx`. Os `Chip` são `<li>` sem interação.
5. **Alvo de toque:** `Tab` já tem `min-height: 44px`; os chips do resumo não (≈ 28px).

## Arquitetura da solução

### A. Saída sem cobrança (RF1 a RF5)
Arquivos: `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.ts`, `SaidaVeiculoModal.tsx`, `src/components/veiculos/saida.ts` (helper), testes ao lado.

1. **Helper puro em `saida.ts`:** `export function semCobranca(consulta: Pick<SaidaConsulta, "mensalista" | "valor">): boolean { return valorACobrar(consulta) === 0; }`. Mensalista já devolve 0 em `valorACobrar`, então um critério único cobre os dois casos. Comparação com `valoresIguais(valorACobrar(c), 0)` para tratar centavos como o resto do código (`toCents`).
2. **`useSaidaFlow.ts`:**
   - `semCobranca` passa a ser `consulta !== null && semCobranca(consulta)` (nome do helper importado com alias para não colidir com a variável).
   - `pagamento`: com `semCobranca`, `{ canConfirm: true, motivo: undefined }` (igual ao que o mensalista já tem), sem depender de `meios`. Sem cobrança também não exige que os meios de pagamento da empresa tenham carregado.
   - `confirmMutation`: trocar `const mensalista = input.consulta.mensalista` por `const semPagamento = semCobranca(input.consulta)`. O envio fica `formaPagamento: Number(semPagamento ? FORMA_DINHEIRO : input.forma)` e `emDinheiro = !semPagamento && input.forma === FORMA_DINHEIRO`. O corpo da requisição não muda: o `valor` já é `valorACobrar(...)`.
   - **RF5 (valor muda enquanto a tela está aberta):** nos dois pontos que já detectam mudança de valor (o `onSuccess` do tipo `"mudou"` e o `queryFn` da consulta), quando o estado "sem cobrança" virar (zero ↔ maior que zero), além de `setAtalho(null)` e `setRecebido("")` também fazer `setForma(null)`. A condição é "um dos dois valores é zero e o outro não". Sem `useEffect`, para não encadear renderizações.
3. **`SaidaVeiculoModal.tsx`:**
   - Rótulo do botão: `semCobranca` → `"Confirmar Saída · Sem cobrança"` (mantém a caixa alta de "Saída" dos demais rótulos do modal; o `design.md` escreveu "saída" em minúscula, vale o padrão existente). `valorAnterior !== null` com `semCobranca` continua como "Confirmar novo valor · Sem cobrança".
   - O bloco `semCobranca ? <Hint>Sem pagamento nesta saída.</Hint> : <PagamentoSaida … />` já existe e passa a valer para o avulso com R$ 0,00 sem outra mudança.
   - `ANUNCIOS.pagamento`: hoje "Veículo encontrado. Confirme os dados e o pagamento." Com `semCobranca`, "Veículo encontrado. Confirme os dados." Como `ANUNCIOS` é indexado só por fase, a escolha do texto sai para uma pequena função `anuncioDaFase(fase, semCobranca)`.
   - `NotaRodape` de "Carregando meios de pagamento…" já está atrás de `!semCobranca`.
4. **Recibo e demais telas:** sem mudança (`ReciboConteudo` já mostra "Sem cobrança" com forma vazia; `podeGerarNota` já exige `valor > 0`).

### B. Fila do lavador (RF6 a RF10)
Arquivos: `src/components/servicos/fila.ts`, `FilaServicos/FilaServicos.tsx` e `.styles.ts`, `ResumoDaFila/ResumoDaFila.tsx` e `.styles.ts`, `src/components/ui/Tabs/Tabs.tsx` e `.styles.ts`, testes ao lado.

1. **`fila.ts`, funções puras novas (com testes):**
   - `statusInicialDaFila(itens: ItemFila[], agora: number): StatusDaFila`: se há item atrasado, `EmExecucao`; senão a primeira com itens na ordem `EmExecucao`, `Aguardando`, `Pronto`; se não houver nenhum item, `Aguardando`. Recebe a fila inteira (sem o filtro da busca).
   - `ordenarColuna(itens: ItemFila[], agora: number): ItemFila[]`: atrasados primeiro, do maior para o menor `minutosAtrasado`; os demais mantêm a ordem recebida (ordenação estável). Só tem efeito em `EmExecucao`, já que `minutosAtrasado` é 0 nos outros status.
   - `resumirFila` não precisa mudar: um serviço atrasado está sempre em `EmExecucao` (ver `minutosAtrasado`).
2. **`FilaServicos.tsx`:**
   - `statusDaUrl` fica como está.
   - Estado novo `statusInicial: StatusDaFila | null`. Um efeito roda uma vez, quando a fila termina de carregar e há itens: `setStatusInicial(statusInicialDaFila(fila.itens, agora))`. Depois de definido, não recalcula (RF9).
   - `statusAtual = searchParams.get(PARAM_STATUS) !== null ? statusDaUrl(searchParams.get(PARAM_STATUS)) : (statusInicial ?? STATUS_SERVICO.Aguardando)`. Escolher uma aba continua gravando `?status=` na URL, e a URL passa a mandar. Não se grava a aba inicial na URL (não polui o histórico nem o link compartilhado).
   - Só vale no celular; no desktop as três colunas aparecem e `statusAtual` não é usado.
   - Em `colunaDe`, aplicar `ordenarColuna(porStatus(status), agora)`.
   - **Abas:** montar os itens com `label` em JSX (contagem em cima, nome embaixo, ponto de atraso na aba de `EmExecucao` quando `atrasados > 0`) e `ariaLabel` (`"Em andamento, 1 serviço, 1 passou da previsão"`). Peças visuais pequenas em `FilaServicos.styles.ts` (`AbaConteudo`, `AbaContagem`, `AbaNome`, `PontoAtraso`).
   - **Contadores como botões (só no celular):** `<ResumoDaFila itens agora statusAtual={statusAtual} onSelecionar={celular ? selecionarDoResumo : undefined} />`. `selecionarDoResumo(alvo)` chama `escolherStatus(String(status))` (atrasados → `EmExecucao`) e, no próximo quadro, leva o primeiro cartão da coluna à vista: `requestAnimationFrame(() => document.querySelector("[data-acao-card]")?.scrollIntoView({ block: "nearest" }))`, reaproveitando o seletor que já existe para devolver o foco. Como atrasados vêm primeiro, o primeiro cartão é o atrasado.
3. **`ResumoDaFila.tsx`:**
   - Props novas opcionais: `statusAtual?: StatusDaFila`, `onSelecionar?: (alvo: "aguardando" | "execucao" | "pronto" | "atrasados") => void`.
   - Sem `onSelecionar`: renderiza exatamente como hoje (desktop e testes atuais).
   - Com `onSelecionar`: cada pílula vira `<li><ChipBotao type="button" aria-pressed={…}>…</ChipBotao></li>`. `aria-pressed` só nas três de status e só na atual; "passou da previsão" é um botão simples.
   - `ResumoDaFila.styles.ts`: `ChipBotao` com os mesmos tokens do `Chip`, mais `min-height: touchTarget`, `cursor: pointer`, hover com `surfaceMuted`, `:focus-visible` com `colors.focus`, e `aria-pressed="true"` com borda `colors.text`. `Atrasados` ganha a variante botão com `danger`/`dangerSoft`.
4. **`Tabs.tsx`/`.styles.ts`:**
   - `TabsItem`: `label: ReactNode` e `ariaLabel?: string` (aplicado como `aria-label` do botão quando presente).
   - Estilos da variante `segmentada`: `white-space: nowrap` e `padding: 0 theme.space[2]px` (hoje `space[3]`), para "Em andamento" caber em uma linha em ~117px. A organização interna (contagem em cima, nome embaixo) fica no conteúdo do rótulo, no lado da feature.
   - Nenhum outro uso de `Tabs` muda de comportamento (`label` string continua válido).

## Decisões técnicas e trade-offs
- **Critério único `valorACobrar === 0` em vez de dois ramos (mensalista × valor zero):** menos código e as duas situações compartilham mensagem, botão e envio. Custo: um avulso a R$ 0,00 passa a ser tratado como "sem pagamento". É o objetivo do PRD.
- **Reaproveitar o envio do mensalista** (`valor: 0`, `FORMA_DINHEIRO`) em vez de omitir a forma: o back já aceita esse contrato para o mensalista, então não há mudança de API. Se a equipe do back preferir um contrato sem forma, é uma troca de uma linha na `mutationFn`.
- **Aba inicial em estado local, não na URL:** a URL só guarda escolha explícita da pessoa. Gravar a inicial faria `router.replace` ao abrir, gerando entrada de histórico e um link que "prende" a aba.
- **Decidir a aba inicial uma vez:** a fila atualiza sozinha; recalcular a cada atualização tiraria a pessoa da aba onde ela está (RF9).
- **Contagem em cima, nome embaixo** em vez de encurtar o texto: não depende de abreviar nem de reduzir abaixo de 12px.
- **`Tabs` com `ReactNode`** em vez de criar um novo componente de abas: a feature fica com o conteúdo visual, o design system fica com o comportamento (teclado, ARIA).
- **Não criar abstração de "ordenação da fila" além de `ordenarColuna`:** uma função pura e testada resolve.

## Riscos / pontos de atenção
- **Contrato com o back (saída a R$ 0,00 de avulso):** o PRD registra que a API aceita; o mensalista já prova o caminho (`valor 0` + forma padrão), mas o avulso a R$ 0,00 nunca foi enviado por este código. Validar uma vez em homologação (saída de avulso dentro do tempo grátis) antes de considerar pronto.
- **`getPagamentoStatus` usa `consulta.valor`** (e não `valorACobrar`). Com `semCobranca` ele deixa de ser chamado para esse caso; fora dele, `valor > 0`, então o comportamento antigo se mantém.
- **Testes que assumem aba padrão `Aguardando` no celular:** `FilaServicos.test.tsx` e `FilaServicos.melhorias.test.tsx` (`navegacao.celular = true`) podem passar a abrir em outra aba; ajustar as expectativas, não a regra.
- **Testes do modal de saída com avulso e valor zero** (se existirem) passam a ver o estado sem cobrança.
- **`Tabs` em outras telas:** conferir os usos de `label` como string (Financeiro, Mensalistas etc.) após o tipo mudar.
- **Foco ao tocar um contador:** o foco permanece no botão; o `scrollIntoView` não deve roubar o foco (usar só rolagem).
- **Contadores como botões no celular, listas como `<ul>`:** manter semântica de lista (`<li>` com botão dentro).

## Testes (Vitest + Testing Library)
- `saida.test.ts`: `semCobranca` para avulso com valor 0, avulso com valor > 0 e mensalista.
- `useSaidaFlow.test.tsx`: avulso a R$ 0,00 → `pagamento.canConfirm` verdadeiro sem escolher nada; `confirmar` envia `{ valor: 0, formaPagamento: 1 }` e `recebido`/`troco` nulos; valor sobe de 0 para > 0 (e o inverso) reseta forma, recebido e atalho.
- `SaidaVeiculoModal.test.tsx`: avulso a R$ 0,00 mostra "Sem pagamento nesta saída." e o botão "Confirmar Saída · Sem cobrança" habilitado, sem "Forma de pagamento"; avulso com valor mantém o comportamento atual; anúncio sem a palavra "pagamento".
- `fila.test.ts`: `statusInicialDaFila` (atrasado, só em andamento, só pronto, tudo vazio, só na fila) e `ordenarColuna` (atrasados primeiro, maior atraso primeiro, estabilidade).
- `FilaServicos.test.tsx` / `.melhorias.test.tsx`: celular abre na aba inicial correta; `?status=` na URL vence; a aba não muda depois de uma atualização; tocar em cada contador troca a aba; "passou da previsão" abre "Em andamento" e rola ao primeiro cartão; desktop não renderiza botões nos contadores.
- `ResumoDaFila.test.tsx`: sem `onSelecionar` igual a hoje; com `onSelecionar` há botões com `aria-pressed` correto e `onSelecionar` recebe o alvo certo.
- `Tabs.test.tsx`: `label` como JSX e `ariaLabel` aplicado; navegação por setas igual a antes.
- Verificação manual em 360px e 390px: "Em andamento" em uma linha; saída de avulso a R$ 0,00 em homologação.

## Fora de escopo técnico
- Mudar o cálculo do valor a cobrar ou o contrato da API.
- Os demais itens do relatório mobile (alvos de toque nas outras telas, ilustração cortada, compartilhar comprovante, textos de 11px).
- Destaque para serviços parados em "Pronto" por muito tempo.
- Ordem das abas configurável pela empresa.
