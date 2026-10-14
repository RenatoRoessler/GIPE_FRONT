# Design Spec: Registrar Saída de Veículo

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. O atalho repete o padrão do **Registrar entrada** (`docs/specs/entrada-veiculos/`), e o fluxo em etapas repete o `Stepper` do cadastro de preço.

## Direção

Modo **Operate**, com um momento de foco no pagamento. O operador está no balcão, com o cliente esperando: cada etapa mostra **uma decisão só**, com o número que importa (o valor a cobrar, depois o troco) em destaque tipográfico, não decorativo. Dado financeiro pede clareza e confiança (princípio do `PRODUCT.md`): nada de ornamento, valores sempre em algarismos tabulares, estado dito em texto.

O único gesto visual ousado é o **recibo**: tem aparência de comprovante de balcão (coluna estreita, linhas tracejadas, valor total em destaque), o que reforça "isto é o documento" e favorece a impressão.

## Componentes do design system

### Reaproveitados
`Modal` (tamanho `lg`), `Stepper`, `Button`, `Input`, `ErrorBanner`, `Toast`, `Skeleton`, `StatusBadge`, `Text`, `DiscButton` (atalho), e `TextField`/`useAppForm` de `components/form`.

### Ajustes e novos no design system
- **`Stepper`**: ganha a prop opcional `label` para o `aria-label` da lista (hoje é fixo em "Progresso do cadastro"); aqui usa "Progresso da saída".
- **`OptionGroup`** (novo, `src/components/ui/OptionGroup`): grupo de escolha única exibido como lado a lado de "tiles" (`role="radiogroup"` com `<input type="radio">` nativos escondidos visualmente), para a forma de pagamento. Props: `legend`, `options: { value, label }[]`, `value`, `onChange`, `disabled`, `error`. Vai para `ui/` porque outras telas de pagamento reaproveitam.
- Componentes de feature (em `src/components/veiculos/`): `SaidaVeiculoModal` (orquestra as etapas), `ConsultaSaidaStep`, `ConferirSaidaStep`, `PagamentoSaidaStep`, `ReciboSaidaStep`, e `RegistrarSaidaButton` (atalho). Detalhes de arquivos ficam no Tech Spec.

## Atalho

- `DiscButton` com selo **"S"** e rótulo "Registrar saída", ao lado de "Registrar entrada" na mesma linha de ações da Home (e da tela Saída de Veículos). Mesmo estilo, mesma altura; em telas estreitas os dois ocupam a largura toda, empilhados.

## Estrutura do modal

- `Modal` tamanho `lg`; título fixo **"Registrar saída"**.
- Abaixo do título, `Stepper` com as etapas **Consultar · Conferir · Pagamento · Recibo**. Em telas estreitas os rótulos escondem-se e ficam os números, como no cadastro de preço; a etapa atual continua anunciada ("Etapa 2 de 4: Conferir") em um texto que recebe o foco a cada troca de etapa.
- Rodapé do modal: ações da etapa à direita (principal) e **Voltar**/**Cancelar** à esquerda; no mobile, empilhadas com a principal em cima.
- Fechar (×, `Esc`, backdrop) permitido nas etapas 1 a 3, exceto durante o envio. Na etapa 4 só **Concluir** (e o ×) encerram.

## Telas e estados

### Etapa 1 — Consultar
- Texto de apoio: "Informe a placa, o código do ticket **ou** o sequencial do veículo."
- Três campos em coluna única (mobile) ou em três colunas (`sm+`): **Placa**, **Código do ticket**, **Sequencial**. Ticket e sequencial com `inputMode="numeric"`.
- Quando um campo tem valor, os outros dois ficam desabilitados com a dica "Limpe o campo ... para usar outro" (texto de apoio abaixo, não só `disabled`). A placa é normalizada em maiúsculas e valida os padrões antigo/Mercosul, com a mensagem do PRD.
- Foco inicial na placa.
- Ação principal: **Consultar valor**. Estados: ocioso; consultando (botão "Consultando…" desabilitado, campos desabilitados); erro (`ErrorBanner` `role="alert"` acima dos campos, p. ex. "Nenhum veículo no pátio com esse ticket", com os campos preenchidos para corrigir); sem campo preenchido (mensagem de campo "Informe a placa, o ticket ou o sequencial").

### Etapa 2 — Conferir
- Cabeçalho com a **placa em destaque** (`fontSizes.xl`, `fontWeights.bold`, espaçamento de letras do tema) e, ao lado, `StatusBadge` "Mensalista" (tom `info`) quando aplicável.
- Lista de dados em duas colunas (`dl`): Modelo, Cor, Categoria, Código do ticket, Sequencial, Entrada, Saída (momento da consulta), Permanência (formatada "1 h 05 min"), Tabela de preço.
- Bloco **Valor a cobrar** no fim, de largura total: rótulo pequeno em `textMuted` e o valor em `fontSizes.xl` bold, em um painel `surface` com borda `primary`. É o elemento dominante da etapa.
- Etapa somente leitura. Ações: **Voltar** (à etapa 1, mantendo os dados digitados) e **Ir para o pagamento**.
- Texto de apoio discreto: "O valor é calculado até o momento da consulta e será conferido novamente antes de registrar a saída."

### Etapa 3 — Pagamento
- Resumo fixo no topo da etapa: placa + **Valor a cobrar** (mesmo painel da etapa 2, menor).
- `OptionGroup` "Forma de pagamento" com as 6 formas (Dinheiro, Pix, Cartão de débito, Cartão de crédito, Boleto, Transferência bancária) em tiles; nenhuma pré-selecionada, para obrigar a escolha consciente. Erro de campo: "Selecione a forma de pagamento".
- **Dinheiro**: aparece o campo **Valor recebido** (monetário, foco automático) e, logo abaixo, a linha **Troco** em tamanho `fontSizes.lg` bold:
  - recebido ≥ valor: "Troco: R$ x" em `success`;
  - recebido < valor: "Faltam R$ x" em `danger`, com o botão principal desabilitado e o motivo em texto visível;
  - vazio: "Informe o valor recebido".
- Demais formas: nenhum campo extra.
- Valor R$ 0,00 (ex.: mensalista): painel mostra "Nada a cobrar" e a forma de pagamento é exigida do mesmo jeito; sem campo de valor recebido (decisão final no PRD, ponto em aberto).
- Ação principal: **Confirmar pagamento**. Estados:
  - *Enviando*: "Registrando…", campos e botões desabilitados, modal sem fechar.
  - *Valor mudou* (RF6): o painel de valor passa a mostrar o novo valor, com o anterior riscado (`line-through`, `textMuted`) e um aviso `ErrorBanner`-like em tom `warn` com texto: "O valor mudou de R$ 20,00 para R$ 25,00 (permanência de 1 h 02 min). Confira e confirme novamente." O troco é recalculado; o botão passa a "Confirmar novo valor". Nada é registrado até esse clique.
  - *Erro* (sem caixa aberto, veículo que já saiu, permissão, rede): `ErrorBanner` `role="alert"` acima da escolha, dados preservados.
- **Voltar** disponível (volta à etapa 2).

### Etapa 4 — Recibo
- Faixa de sucesso no topo: ícone de confirmação + "Saída registrada" (texto, não só cor). O `Toast` "Saída registrada." também é exibido.
- **Recibo** como comprovante: coluna centralizada de largura máxima `~ 360px`, fundo `background`, borda tracejada (`border`), cantos `radii.md`. Conteúdo, de cima para baixo:
  1. Nome da empresa (título) e, se disponível, CNPJ.
  2. "Recibo de pagamento — Estacionamento" e data/hora da emissão.
  3. Linha tracejada.
  4. Placa (destaque), modelo/cor, categoria, ticket.
  5. Entrada, Saída, Permanência.
  6. Tabela de preço aplicada.
  7. Linha tracejada.
  8. Forma de pagamento; em dinheiro, Valor recebido e Troco.
  9. **Total pago** em `fontSizes.xl` bold, alinhado à direita.
- Linhas em pares rótulo/valor (`dl`), valores com algarismos tabulares.
- Ações: **Imprimir** (principal) e **Concluir** (secundária). **Concluir** fecha o modal e limpa o estado.
- **Impressão**: ao imprimir, só o recibo aparece (resto da página, modal e botões ocultos), em preto sobre branco independentemente do tema claro/escuro, largura confortável para impressora comum e térmica (coluna única, sem sombras nem bordas arredondadas desnecessárias).

## Tokens usados
Nenhum token novo. Reaproveita: `colors.primary`, `primarySoft`, `surface`, `background`, `border`, `text`, `textMuted`, `success`, `danger`, `warn`/`onWarn`; `space`, `radii`, `fontSizes` (`xl` para placa/valor/total), `fontWeights`; `typography.display*` no atalho. Regras de impressão (preto sobre branco) ficam no próprio componente do recibo, dentro de `@media print`, sem novos tokens.

## Acessibilidade
- Troca de etapa move o foco para o texto "Etapa N de 4: …" e o anuncia; `Stepper` com `aria-current="step"`.
- Campos desabilitados na etapa 1 explicam o motivo por texto; erros em `role="alert"`.
- `OptionGroup` navegável por setas (radios nativos), com legenda e foco visível; troco/faltante em região `aria-live="polite"` para ser anunciado ao digitar.
- Valor alterado (RF6) anunciado por `role="alert"`; o valor antigo riscado também tem texto oculto "era R$ x, agora R$ y".
- Modal herda foco preso, `Esc` e retorno do foco ao atalho de origem.
- Contraste AA em ambos os temas; estado (aberto/mensalista/sucesso) nunca só por cor.

## Responsividade
- `md` e acima: modal `lg` (760px), dados do veículo em duas colunas, tiles de pagamento em grade 3×2.
- Abaixo de `md`: modal quase em largura total (margem `space[3]`), dados em coluna única, tiles em grade 2×3, rodapé com botões empilhados em largura total.
- Abaixo de `sm` os rótulos do `Stepper` já se escondem (ficam só os números), comportamento existente do componente.
- O recibo mantém a coluna estreita centralizada em qualquer largura.
