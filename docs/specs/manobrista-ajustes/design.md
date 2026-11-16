# Design Spec: Ajustes de agilidade no app do manobrista

Referências: [prd.md](./prd.md) · tokens em `src/styles/theme.ts` · componentes base em `src/components/ui`.
Não há redesenho de tela: são ajustes pontuais sobre telas existentes, mantendo o layout atual (por isso sem a skill `impeccable`). Nenhuma cor, espaçamento ou tamanho novo é hardcoded: tudo vem do tema.

## Pontos de partida no código
| Ajuste | Onde vive hoje |
|---|---|
| 1, 3, 4, 8, 9 (entrada) | `veiculos/EntradaVeiculoModal` (formulário), `veiculos/LeitorPlacaModal` (câmera), `ui/PlateKeyboard`, `teclado/*` |
| 2 (saída) | `veiculos/SaidaVeiculoModal` + `veiculos/PagamentoSaida` + `veiculos/ResumoSaida` |
| 5 (menu, só o cartão do operador) | `layout/BottomNav/MenuSheet` |
| 6, 7 | `LeitorPlacaModal`, `LeitorQrSaida`, `layout/BottomNav`, `ui/OptionGroup` |

## Tokens
- **Nenhum token novo é obrigatório.** Mapeamento:
  - Troco/"Sem troco" positivo: `colors.success`; erro/"Faltam R$": `colors.danger` + `dangerSoft` (fundo do campo); dica neutra ("Faltam N caracteres"): `colors.textMuted`, `fontSizes.sm`.
  - Borda de leitura certa: `colors.success`; leitura duvidosa: `colors.warn` (texto sobre ela: `onWarn`).
  - Faixa "Câmera indisponível": `surface` + `border`, texto `textMuted`, ação com `colors.link`.
  - Espaçamento: `space[2]`/`space[3]` entre blocos (já usado no formulário); alvos de toque `layout.touchTarget` (44px) mínimo em todos os atalhos.
  - Teclado: `layout.keyboardKeyHeight` / `keyboardZIndex` existentes.
- **Um token a avaliar (opcional):** `layout.cameraRevealMs` não é necessário; durações de animação seguem as já usadas no `Modal`. Se faltar, adicionar ao tema, nunca solto.

## Componentes
Reaproveitados: `Button`, `OptionGroup` (formas de pagamento e categorias), `Input`, `PlateDisplay`, `PlateKeyboard`, `NumericKeyboard`, `ErrorBanner`, `ConfirmDialog`, `StatusBadge`, `Text`.

Novos (entram em `src/components/ui`, não soltos na feature):
1. **`QuickAmountChips`** – grupo de botões de valor (`Exato`, `R$ 250`, `R$ 300`, `Outro`), semântica de rádio (`role="radiogroup"`), um selecionado por vez, alvo ≥ 44px, rótulo acessível "Cliente pagou com". Variante visual igual à de `OptionGroup` (chip), sem ícone.
2. **`ChangeDisplay`** (troco) – bloco com rótulo "Troco" e valor grande (`fontSizes.xl`, `fontWeights.extrabold`) em `success`; estado "Sem troco" quando 0; estado de falta em `danger` ("Faltam R$ X,XX"). `aria-live="polite"`. Substitui o `TrocoLine` atual de `Saida.styles`.
3. **`InlineNotice`** – faixa de uma linha com texto + ação (usada em "Câmera indisponível · Tentar câmera"). Variantes `neutral` e `warning`.

Alterados: `PlateKeyboard`/teclado de toque (ocultar rodapé e rótulo, ver abaixo), `PlateDisplay` (suportar slots vazios "•••" para a dica de caracteres faltando).

## Telas e estados

### Ajuste 1 · Placa já no pátio → atalho de saída (`EntradaVeiculoModal`)
Estados do formulário quando a placa digitada/lida está no pátio:
- **Padrão (nova):** o bloco `JaNoPatio` deixa de ser um alerta vermelho de bloqueio e vira um **cartão informativo** (`surface` + `border`, título "Este veículo já está no pátio"), com: valor em destaque (`fontSizes.lg`, `bold`), linha "Modelo · cor · categoria", e duas linhas rótulo/valor: **Entrada** e **Permanência**. Valor/permanência vêm do mesmo cálculo da saída (loading: `Skeleton` no lugar do valor; erro ao calcular: some o valor e o botão vira "Dar saída" sem valor).
- Modelo, categoria, cor e prisma **somem** nesse estado.
- Rodapé: botão principal `Dar saída · R$ valor` (variant `primary`), abaixo ação textual "Corrigir placa" (variant `ghost`/link). Sem "Registrar entrada" e sem texto "Esta placa já está no pátio." (`Pendencia`).
- "Corrigir placa": limpa o campo, devolve o foco e o teclado de placa; estado volta ao padrão de digitação.
- Tocar em "Dar saída" fecha o modal de entrada e abre `SaidaVeiculoModal` com `buscaInicial` (fase "Confirmar saída"), sem passar pela pesquisa.

### Ajuste 2 · Atalhos de valor recebido (`PagamentoSaida`)
Visível só com forma = Dinheiro (Pix/crédito/débito: nada muda, sem campo de valor).
Ordem vertical: Valor a cobrar → Forma de pagamento → **Cliente pagou com** (`QuickAmountChips`) → **Troco** (`ChangeDisplay`) → botão de confirmar.
- **Chips:** `Exato` primeiro; depois até 2 próximas notas redondas **maiores** que o valor (R$ 220 → 250, 300; regra: próximos múltiplos de 50 e depois de 100, sem repetir o valor nem mostrar menor); por fim `Outro`. Valor ≥ 1000 mantém a mesma regra, com no máximo 2 sugestões.
- **Nada selecionado (inicial):** `Dinheiro` marcado, nenhum chip ativo, `ChangeDisplay` oculto, botão de confirmar desabilitado com a pendência "Escolha quanto o cliente pagou." (textMuted).
- **Chip selecionado:** preenche o recebido; `ChangeDisplay` mostra troco em `success` (ou "Sem troco" no Exato); linha "recebido R$ X" em `textMuted`; botão habilitado; teclado fechado se aberto.
- **Outro:** o `Input` "Valor recebido" aparece já focado com teclado numérico (decimal). Troco calculado ao digitar. Valor menor: campo com borda `danger`, fundo `dangerSoft`, mensagem "Faltam R$ X,XX para o valor cobrado." e botão desabilitado. Valor ≥ cobrado: `ChangeDisplay` verde.
- **Trocar a forma e voltar a Dinheiro:** estado reinicia (nada selecionado). **Valor cobrado muda** (novo cálculo na revalidação): chips recalculados, seleção descartada, mensagem existente de "novo valor" mantida.
- **Resumo compacto:** `ResumoSaida` mostra "Entrada 14/11 12:20 · 35h 23min" numa linha (permanência ao lado da entrada) para caber sem rolar em 360×640.
- Enter no campo "Outro" continua confirmando (comportamento atual).

### Ajuste 3 · Validação de placa (`field.PlateField`)
- Antes de 7 caracteres: dica **cinza** sob a placa: "Faltam N caracteres" (singular: "Falta 1 caractere"); campo sem borda vermelha; `PlateDisplay` mostra slots vazios.
- Com 7 caracteres: se válida, dica some (ou mostra o hint do cadastro); se fora do padrão, erro vermelho existente ("Placa inválida. Informe no padrão antigo (ABC1234) ou Mercosul (ABC1D23).").
- Ao tentar enviar com placa incompleta: erro vermelho (comportamento de submit atual), não antes.
- Campo vazio: sem dica (não gritar "Faltam 7" ao abrir).

### Ajuste 4 · Câmera negada/indisponível → teclado direto (`LeitorPlacaModal` + `EntradaVeiculoModal`)
- Estados `negada`, `indisponivel` e erro de abertura: o leitor **fecha sozinho** e o formulário assume com o teclado de placa aberto e foco no campo (mesmo caminho de `handleDigitarPlaca`), sem exibir a tela de passos.
- No formulário aparece `InlineNotice` (neutral) acima da placa: "Câmera indisponível. Digite a placa." + ação **Tentar câmera**.
- "Tentar câmera" reabre o leitor; se ainda negada, volta ao formulário e **só então** exibe, dentro da faixa expandida, os passos de `PassosLiberarCamera` (cadeado → Permissões → Câmera). Passos só aparecem após tocar na ação.
- `sem-leitura` (timeout de 15 s sem placa) mantém o comportamento atual (mensagem + Tentar de novo / Digitar); só negada/indisponível/erro mudam.
- A faixa some quando a câmera volta a funcionar ou uma placa é lida.

### Ajuste 8 · Câmera instantânea (`LeitorPlacaModal` / `useLeitorPlaca`)
Estados visuais do visor:
1. **Abrindo (stream ainda não respondeu):** visor com `surfaceMuted` e mira (cantos) já desenhada; sem texto grande.
2. **Imagem ao vivo, leitor carregando:** vídeo visível; "Preparando leitura…" vira **pílula pequena** sobre a imagem (parte inferior do visor, `textMuted` sobre fundo semitransparente do tema), `aria-live="polite"`.
3. **Lendo:** a pílula some; mensagem "Aponte a câmera para a placa" abaixo do visor (como hoje).
4. **Falha:** ver ajuste 4.
- **Escopo (decisão do produto):** só a opção "b" do PDF. O teclado de placa e o botão "Digitar" continuam como hoje; câmera ligada entre entradas, pré-carga e demais opções ficam fora.
- Sem animação extra de entrada na câmera (evitar atraso): o visor aparece imediatamente.

### Ajuste 9 · Entrada digitada com mais espaço (`EntradaVeiculoModal`)
Estado **digitando placa (teclado aberto):**
- Título do modal compacto; **sem rótulo "Placa"** (o `PlateDisplay` é autoexplicativo); caixa da placa logo abaixo do título (`space[2]`).
- Modelo (se exigido) e as 6 categorias em **duas linhas de 3**, todas visíveis acima do teclado em 360×640 com teclado aberto. Se não couber (cor/prisma exigidos), a área de campos rola; o `PlateDisplay` fica fixo no topo.
- Rodapé (Registrar entrada / Cancelar / pendência) **oculto** com qualquer teclado aberto (de toque Murel ou do sistema ao digitar o modelo).
Estado **placa completa (7 caracteres):** teclado fecha sozinho, rodapé reaparece com "Registrar entrada" e a pendência existente ("Falta: categoria."). Cancelar continua pelo "‹"/fechar do cabeçalho, com `ConfirmDialog` se houver dados.
Estado **teclado do sistema (modelo):** detectar via `visualViewport`; rodapé oculto enquanto o viewport estiver reduzido.
- Desktop/teclado físico (sem teclado de toque): nenhuma mudança (rodapé sempre visível).

### Ajuste 5 · Menu "Mais" (`MenuSheet`) — 2ª entrega
- **Só o cartão do usuário** no topo, abaixo do cabeçalho "Mais": avatar com inicial (círculo `primarySoft`, texto `accent`), nome (`bold`), linha "Perfil · Caixa aberto/fechado" (`textMuted`; `StatusBadge` verde para aberto). Loading do estado do caixa: `Skeleton` curto; erro ou perfil sem acesso ao caixa: omite a situação do caixa.
- **Ordem e grupos do menu ficam como estão** (decisão do produto): nenhuma mudança em `lib/nav.ts`.
- Largura grande (`SideNav`): sem alteração (já tem `UserMenu`).

### Ajuste 6 · Confirmação ao ler (`LeitorPlacaModal`, `LeitorQrSaida`) — 2ª entrega
- **Leitura certa:** cantos da mira em `success` por ~0,5 s, 1 vibração curta, bip curto, segue sozinho.
- **Leitura duvidosa (baixa confiança):** cantos em `warn`, 2 vibrações, sem bip, vai à etapa "Confirmar placa" com o caractere em dúvida destacado (`warn` + sublinhado) e mensagem "Confira o último caractere".
- Respeitar `prefers-reduced-motion` (sem transição de cor animada; mantém troca instantânea).
- Falha de `navigator.vibrate`/áudio é silenciosa. Som respeita volume/silencioso do aparelho (sem controle no app).

### Ajuste 7 · Nomes acessíveis — 2ª entrega
- Botões da barra: `aria-label` "Pátio", "Caixa", "Registrar entrada", "Registrar saída", "Mais" (hoje o de Entrada é só ícone).
- `OptionGroup` de categoria: o rótulo do `radio` é o nome ("Carro médio"); o valor numérico segue só no `value`.

## Responsividade
- Foco total no celular (≥ 320px; teste em 360×640 e 390×844). Os modais já viram folha cheia em `< breakpoints.sm`.
- Telas grandes (`md`+): ajustes 1, 2, 3, 4, 9 valem do mesmo jeito (os teclados de toque só aparecem em `MEDIA_TOQUE`); ajuste 9 (ocultar rodapé) só se aplica quando há teclado de toque/sistema aberto.
- `QuickAmountChips` quebra em 2 linhas se faltar largura; nunca corta rótulo.

## Acessibilidade
- Alvos ≥ `layout.touchTarget`; foco visível via `colors.focus`.
- Troco, "Faltam N caracteres" e faixa da câmera em regiões `aria-live="polite"`.
- Contraste: textos sobre `success`/`warn` usam `onSuccess`/`onWarn`; nunca `success` como texto em fundo claro sem conferir (usar `accent` para texto de destaque, como o tema pede).
- Estado nunca só por cor: erro de valor tem texto ("Faltam R$…"), leitura duvidosa tem texto e vibração dupla.

## Perguntas em aberto (para o Tech Spec)
1. Regra exata das notas sugeridas (múltiplos de 50/100) — confirmar com a operação; spec propõe as 2 próximas notas redondas acima do valor.
2. Valor da permanência/valor a cobrar no cartão do ajuste 1 exige consulta de saída antes de abrir o modal (custo/latência); alternativa: calcular ao abrir a saída e mostrar só entrada + permanência no cartão.
3. Fonte da situação do caixa no menu (query existente de caixa vs. nova).
