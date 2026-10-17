# Design Spec: Melhoria do fluxo de saída de veículos

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` e do layout de referência `gipe-saida.html`. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. A referência é guia de composição, não cópia: ela usa paleta própria (amarelo/preto) que **não** entra no sistema; as cores vêm do tema.

## Direção

Modo **Operate**. O operador está em pé no portão, com o cliente ao lado e o celular na mão, e quer sair da tela em segundos. A tela tem **uma pergunta por vez**, na ordem em que o operador age: *qual veículo?* → *quanto?* → *como pagou?* → confirmar.

Ousadia contida em dois gestos, o resto é tipografia e espaçamento do tema:
- **Visor de leitura**: a área do QR é o objeto central da tela vazia, um visor quadrado com cantos de mira e linha de varredura. Ao ler, o visor vira o cartão do veículo (transição de estado, sem trocar de tela).
- **Valor como placar**: o valor a cobrar é o maior número da tela (fonte de display, algarismos tabulares), no mesmo lugar sempre, com o botão principal repetindo o valor.

Dado financeiro pede clareza e confiança: sem ornamento, estado dito em texto, nada depende só de cor.

## Componentes do design system

### Reaproveitados
`Modal` (`size="md"`, `closeOnBackdrop={false}`, já em tela cheia no mobile), `Button`, `Input`, `ErrorBanner`, `ConfirmDialog`, `OptionGroup`, `PlateDisplay` (placa do veículo lido, `sm`), `StatusBadge` e `Skeleton`. O recibo reaproveita `ReciboSaidaStep`/`ReciboConteudo`. Os estilos utilitários `Saida.styles` (`ValueLabel`, `TrocoLine`, `Notice`, `OldValue`, `VisuallyHidden`) permanecem; `StepForm`, `StepDescription` e o `Stepper` deixam de ser usados neste fluxo.

### Novos no design system (`src/components/ui`)
- **`PaymentTileGroup`** (novo): escolha única de forma de pagamento em tiles com ícone e rótulo, `role="radiogroup"` com `<input type="radio">` nativos escondidos visualmente (mesmo padrão do `OptionGroup`). Props: `legend`, `options: { value, label, icon }[]`, `value`, `onChange`, `disabled`. Grade de 4 colunas no mobile e desktop; o selecionado usa `primary` de fundo e `onPrimary` de texto, com a marca de seleção também no ícone/texto "selecionado" para leitor de tela, não só pela cor. Altura mínima 64px (alvo de toque ≥ 44px).
  > Se na implementação o `OptionGroup` com ícones for suficiente, estender `OptionGroup` em vez de criar componente novo (decisão no Tech Spec).

### De feature (`src/components/veiculos`)
- **`SaidaVeiculoModal`** (reescrito para tela única).
- **`LeitorQrSaida`**: visor da câmera e seu ciclo de estados.
- **`ResumoSaida`**: cartão com veículo, entrada, permanência e valor.
- **`PagamentoSaida`**: forma de pagamento, valor recebido e troco.
- Os três passos antigos (`ConsultaSaidaStep`, `ConferirSaidaStep`, `PagamentoSaidaStep`) são substituídos. O recibo (`ReciboSaidaStep`) é mantido. Arquivos e contratos ficam no Tech Spec.

## Tokens usados

Nenhum token novo no tema. Reaproveita: `colors.primary`, `onPrimary`, `primarySoft`, `surface`, `background`, `border`, `text`, `textMuted`, `success`, `danger`, `warn`/`onWarn`; `space`, `radii`, `fontSizes`, `fontWeights`; `typography.display*` para o valor, o token e o tempo de permanência; `shadows.sm`.

O amarelo da referência (cantos de mira, linha de varredura, token, botão) é mapeado para `colors.warn` (identidade do pátio, já usada nos cupons) nos cantos e na linha de varredura; o botão principal e o selecionado usam `primary`, como o resto do sistema. O fundo escuro da referência não é trazido: o modal segue o tema claro/escuro do usuário.

## Tela única — Registrar saída (modal)

Modal `md`. Título "Registrar saída". Sem `Stepper` e sem "Etapa X de 4". Coluna única, de cima para baixo:

1. **Visor de leitura** (`LeitorQrSaida`): quadrado centralizado de ~`220px` (limitado a 60% da largura útil), `radii.lg`, fundo `surface`, borda `border`. Quatro cantos de mira em `warn` e linha de varredura animada. Vídeo da câmera preenche o visor com `object-fit: cover`. Abaixo, a linha **Token**: rótulo "TOKEN" à esquerda, campo somente leitura com o token em fonte de display, tracking aberto e cor `text`, e um botão **Limpar** (ícone X + `aria-label="Limpar e ler novamente"`, 44×44) que só aparece após uma leitura.
2. **Divisor** "ou informe sem QR Code": linha fina com rótulo central em `textMuted`, `fontSizes.xs`, caixa alta.
3. **Busca manual**: três campos `Input` (Placa, Código do ticket, Sequencial) em uma linha no desktop e empilhados no mobile, com o comportamento atual (um desabilita os outros e a dica "Limpe o campo X para usar outro."). Ao ler um QR, os três ficam desabilitados com a dica "Leitura por QR ativa. Toque em Limpar para digitar.". Dica de erro em `danger`, `aria-live="polite"`, logo abaixo.
4. **Resumo** (`ResumoSaida`), sempre visível; vazio até haver entrada:
   - Cabeçalho: `PlateDisplay` (`sm`) + "MODELO · COR" + categoria.
   - Linhas (rótulo `textMuted`, valor `text`): Entrada (data · hora), Permanência (`Xh 00min`).
   - **Valor a cobrar**: bloco destacado (`ValuePanel`: borda `primary`, fundo `surface`) com o valor em fonte de display e rótulo "Valor a cobrar"; se `valor` for 0, "Nada a cobrar". Quando a reconsulta muda o valor, mostra o aviso `Notice` (`role="alert"`) com o texto atual e o valor antigo riscado (`OldValue`).
5. **Pagamento** (`PagamentoSaida`): `PaymentTileGroup` com Dinheiro, Crédito, Débito e Pix; **Dinheiro vem selecionado** (como na referência). Em Dinheiro, aparecem `Input` "Valor recebido" (`inputMode="decimal"`, `placeholder="0,00"`) e a linha de **troco** (`TrocoLine`: `success` com "Troco: R$ x", `danger` com "Faltam R$ x", `muted` quando vazio), em região `aria-live="polite"`.
6. **Rodapé fixo do modal**: **Cancelar** (secundário) e **Confirmar Saída · R$ x** (principal), desabilitado sem entrada encontrada ou com pagamento inválido. Durante o envio: "Registrando…".

Quando não há entrada encontrada, os blocos 4 e 5 ficam visíveis porém inativos (resumo com "—", pagamento desabilitado), para a tela não "pular" quando o veículo aparece.

### Estados

- **Visor — ocioso (câmera ainda não aberta)**: ícone de câmera e "Toque para ativar a câmera". O app tenta abrir a câmera ao montar; se o navegador exigir gesto, o toque no visor ativa.
- **Visor — abrindo**: "Abrindo câmera…".
- **Visor — lendo**: vídeo + mira + varredura.
- **Visor — lido**: cantos e borda em `success`, fundo `success` translúcido com ícone de check e "Ticket encontrado" (ou "Token lido" se a busca não achar). Vibração curta onde houver suporte.
- **Visor — QR inválido**: cantos em `danger` por ~1,2 s e mensagem "QR Code não é um ticket GIPE" na dica; a leitura continua.
- **Visor — sem permissão / indisponível**: texto "Permita o acesso à câmera e toque aqui" ou "Câmera indisponível neste navegador", com a busca manual em destaque logo abaixo.
- **Buscando**: `Skeleton` no resumo; campos e botões desabilitados.
- **Não encontrado**: mensagem na dica (`danger`) — "Nenhum ticket aberto com este token." / "…para esta placa." / "Ticket não encontrado." — resumo vazio, botão desabilitado.
- **Encontrado**: resumo preenchido; permanência e valor atualizam sozinhos (intervalo a definir no Tech Spec) com anúncio **não** repetido a cada tick (região `aria-live` só em mudança de valor via reconsulta).
- **Enviando**: campos, tiles e botões desabilitados; modal não fecha.
- **Valor mudou**: `Notice` no topo do pagamento, botão vira "Confirmar novo valor · R$ x"; nada é registrado até nova confirmação.
- **Erro de registro**: `ErrorBanner` `role="alert"` acima do pagamento, dados preservados.
- **Fechar com progresso**: `ConfirmDialog` "Cancelar a saída?" (atual); a câmera é desligada ao fechar.
- **Sucesso**: o conteúdo do modal troca para o recibo.

## Recibo

Mantém o `ReciboSaidaStep` atual (empresa, placa, categoria, modelo/cor, entrada, saída, permanência, tabela, forma, valor, recebido/troco), com **Imprimir** (impressão só do recibo) e **Concluir**. O visual do recibo não muda nesta entrega. Título do modal passa a "Saída registrada".

## Acessibilidade

- Visor é um `button` com `aria-label="Área de leitura do QR Code. Toque para ativar a câmera"`; a área `aria-live="polite"` anuncia "Abrindo câmera", "Ticket encontrado" e erros. A linha de varredura e os cantos são decorativos (`aria-hidden`).
- A busca manual é a alternativa completa à câmera, sempre alcançável por teclado, e não fica escondida atrás de nenhuma ação.
- `PaymentTileGroup`: radios nativos com setas, legenda "Forma de pagamento", foco visível e estado selecionado também em texto para leitor de tela.
- Botão **Limpar** com rótulo textual; o foco volta ao visor após limpar.
- Valor, permanência e troco com `font-variant-numeric: tabular-nums`; troco/"Faltam" em `aria-live="polite"`.
- Alvos de toque ≥ 44px; contraste AA nos quatro temas; estados (encontrado, não encontrado, erro) sempre em texto, nunca só cor.
- Respeita `prefers-reduced-motion`: a linha de varredura vira uma moldura estática e a vibração é só feedback complementar.
- Foco inicial: no visor se a câmera estiver ativa; caso contrário, no campo Placa.

## Responsividade

- **Mobile** (< `md`): modal em tela cheia (`fullScreenOnMobile`), rodapé fixo com o botão principal em cima ocupando a largura toda e **Cancelar** abaixo; busca manual empilhada; tiles de pagamento em 4 colunas compactas (ícone + rótulo). O conteúdo rola dentro do modal e o rodapé permanece visível, sem rolagem horizontal.
- **Desktop**: modal `md` centrado, em duas colunas quando houver espaço (visor + busca manual à esquerda; resumo + pagamento à direita), rodapé com botões lado a lado.
- A câmera usa a traseira por padrão; em desktop sem câmera cai no estado "indisponível" com a busca manual como caminho principal.
