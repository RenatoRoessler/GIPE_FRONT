# Design Spec: Teclados customizados no celular

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` e dos protótipos de referência em `murel-site/docs/specs/` (`Teclado_Placa_Murel.html`, `Teclado_Numerico_Murel.html`, `Teclado_Alfanumerico_Murel.html`). Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`.

## Direção

Modo **Operate**. O operador está em pé, com uma mão, com o cliente ao lado. O teclado é uma ferramenta: precisa ser previsível, de teclas grandes, e nunca oferecer uma tecla que o campo não aceita. Nada de ornamento.

Os protótipos já definem a composição e o comportamento. Esta spec os traduz para o tema do app (claro e escuro) e para os componentes do design system, sem copiar os valores soltos do HTML. A única marca visual é a tecla de ação amarela (`primary`), que leva ao próximo campo ou conclui.

## Componentes do design system

### Novos em `src/components/ui`
- **`KeyboardSheet`**: a folha fixa na base da tela que hospeda qualquer um dos três teclados. Cuida de posição, área segura, animação de entrada/saída, `role="group"` e de publicar a própria altura (variável CSS) para a tela abrir espaço. Só existe uma folha por vez; trocar de campo troca o conteúdo, sem fechar e reabrir.
- **`Key`**: tecla base. Variantes `char` (letra/dígito), `fn` (apagar, espaço, 123/ABC, ponto, vírgula) e `action` (Próximo/OK, amarela). Props: `label`, `ariaLabel`, `disabled`, `onPress`, `onLongPress` (usado só no ".-" do numérico).
- **`PlateKeyboard`**, **`NumericKeyboard`**, **`AlphaKeyboard`**: os três teclados, montados com `Key` dentro do `KeyboardSheet`.

O nome `KeyBoardGrid` já existe e é o **quadro de chaves** (ganchos), sem relação com isto. Nenhum dos novos componentes usa "KeyBoardGrid" no nome.

### Reaproveitados
- `PlateDisplay` (variante `lg`, com o input dentro) para o campo de placa, que já muda de aspecto Mercosul/antiga.
- `Input`/`TextField` para os campos de texto e número; o campo fica no lugar em que está, com destaque de foco.
- `Modal` (`<dialog>` nativo): ver a regra de hospedagem abaixo.

### Hospedagem dentro de modal
O `Modal` usa `<dialog>` com `showModal()`: tudo fora dele fica inerte e atrás da camada superior. Um teclado fixo montado no `body` ficaria invisível e sem toque quando o campo estiver num modal (caso de **Registrar entrada**, caixa, saída). Então a folha é renderizada **dentro do `<dialog>` aberto mais próximo do campo** (ou no `body`, se não houver modal). O corpo do modal reserva espaço no fim com a altura do teclado, para o campo e o botão principal continuarem alcançáveis ao rolar.

## Tokens usados

Tudo vem do tema, nos dois modos. Mapa dos valores dos protótipos para tokens:

| Parte | Token | Observação |
|---|---|---|
| Fundo da folha | `colors.surface` | no escuro é o `#16223A` do protótipo |
| Borda superior da folha | `colors.border` | |
| Tecla de caractere | `colors.surfaceMuted` | claro: giz; escuro: `#22304B` |
| Tecla de caractere pressionada | `colors.border` | |
| Tecla de função (apagar, espaço, 123/ABC, ponto, vírgula) | `colors.background` | |
| Tecla de função pressionada | `colors.surfaceMuted` | |
| Texto das teclas | `colors.text` | |
| Tecla desabilitada | `colors.steel` (texto) + 40% de opacidade | |
| Tecla de ação (Próximo/OK) | `colors.primary` / `colors.onPrimary` | pressionada: `primaryHover` |
| Anel de foco do campo | `colors.focus` | igual aos demais campos |
| Dígitos e letras | `fontFamilies.mono` | |
| Rótulos de função | `fontFamilies.sans`, `fontWeights.extrabold` | |
| Raio das teclas | `radii.md` | |
| Espaçamento | `space[1]` entre teclas de letras, `space[2]` no bloco numérico | |

Tamanhos de texto: dígitos do bloco numérico `fontSizes.xl`; letras `fontSizes.lg`; rótulos de função `fontSizes.md`; "ESPAÇO" `fontSizes.xs`.

**Tokens novos em `theme.ts` (`layout`)**:
- `keyboardKeyHeight`: `"52px"`, altura padrão da tecla (acima do `touchTarget`).
- `keyboardZIndex`: `50`, acima do cabeçalho e do menu inferior (20) e do comprovante digital (30), abaixo do `Toast` (100).
- `keyboardMaxWidth`: `"560px"`, largura máxima do conteúdo da folha em tablet.

## Teclados

### Estrutura comum
- Fixa na base, de borda a borda, com `padding-bottom` mais a área segura (`env(safe-area-inset-bottom)`). Conteúdo centralizado até `keyboardMaxWidth`.
- Cobre o menu inferior enquanto está aberta e devolve a tela ao fechar.
- Entrada: desliza de baixo em ~180 ms. Com `prefers-reduced-motion`, aparece sem animação.
- O campo focado recebe o anel de foco e rola para o centro da área visível acima do teclado.
- Vibração curta de 10 ms a cada toque, quando suportada.
- Sem seleção de texto nem menu de contexto sobre as teclas.

### Teclado de placa
Mostra só o que cabe na posição atual:

| Posição | Aceita | Layout |
|---|---|---|
| 1 a 3 | Letras | QWERTY (3 linhas) + linha com apagar |
| 4 | Número | Bloco numérico com apagar no canto superior direito |
| 5 | Letra (Mercosul) ou número (antiga) | Linha de números 1-0 + QWERTY + apagar |
| 6 e 7 | Número | Bloco numérico |
| Completa | Nada | Teclas desabilitadas até a folha fechar sozinha (~150 ms) |

- Não há tecla de Próximo: a folha fecha sozinha ao completar uma placa válida.
- Trocar o conteúdo entre letras e números acontece sem animação, para não distrair.
- O campo é a `PlateDisplay` lg: faixa azul "BRASIL" no Mercosul, cinza no padrão antigo, com a dica de validação em texto abaixo (`danger` ou `success`).

### Teclado numérico
- Grade de 4 colunas, no layout de discador: `1 2 3 ⌫` / `4 5 6 Próximo` / `7 8 9 .-` / `· 0 · ,` (as células vazias ficam em tom escuro, sem função).
- Todas as teclas têm a altura padrão (`keyboardKeyHeight`).
- `.-` : toque insere ponto; **segurar ~450 ms** insere hífen (só no modo livre). O rótulo acessível diz as duas coisas.
- Teclas que o modo do campo não aceita ficam desabilitadas: vírgula em campo inteiro, ponto/hífen fora do modo livre, vírgula repetida ou no início do decimal; todos os dígitos ao atingir o limite.
- "Próximo" vira "OK" no último campo e fecha a folha.

### Teclado alfanumérico
- **Letras**: QWERTY em 3 linhas, com ⌫ na terceira. Última linha: `123` à esquerda, `ESPAÇO` no meio (flexível) e **Próximo/OK** (amarela) à direita.
- **Números**: o mesmo bloco do teclado numérico, com `ABC` no lugar da primeira célula vazia da última linha e `ESPAÇO` e vírgula completando-a.
- Sempre maiúsculas, sem acento. Ao mudar de campo, volta ao modo letras.
- `ESPAÇO` fica desabilitado quando o campo está vazio ou já termina em espaço.
- Os campos de **modelo** e **cor/observação** usam este teclado. A variante só de letras do protótipo de placa (sem `123`) fica descartada.

## Estados

| Estado | Comportamento |
|---|---|
| Fechado | Folha fora da tela, sem foco e sem ocupar espaço |
| Aberto | Campo com anel de foco; conteúdo sob a folha reserva espaço no fim |
| Tecla pressionada | Cor de pressão do mapa de tokens, sem deslocamento |
| Tecla desabilitada | Opacidade reduzida e `aria-disabled`; não responde ao toque |
| Campo cheio | Teclas de caractere desabilitadas; apagar e ação continuam ativas |
| Troca de campo | Folha continua aberta; muda o teclado se o tipo do próximo campo for outro |
| Dispositivo com mouse | Folha nunca aparece; campo usa teclado físico, com o mesmo filtro |

Sem estados de carregamento ou erro: o teclado só reage ao toque. A mensagem de erro de validação continua sendo a do campo.

## Acessibilidade

- A folha é `role="group"` com nome ("Teclado de placa", "Teclado numérico", "Teclado de letras e números"), e o campo aponta para ela com `aria-controls`.
- Cada tecla é um `<button type="button">`: letras e dígitos com o próprio caractere como nome; funções com nome falado ("Apagar", "Espaço", "Próximo campo", "Concluir", "Ponto, segure para hífen", "Vírgula", "Mostrar números", "Mostrar letras").
- Tocar numa tecla mantém o foco no campo (`pointerdown` com `preventDefault`), para o leitor de tela não perder a posição.
- Contraste AA do texto das teclas e da tecla amarela (`onPrimary` sobre `primary`) nos dois modos.
- Altura das teclas de pelo menos `touchTarget` (44 px). A **largura** das teclas de letra no QWERTY é de ~32–36 px em celular de 360–390 px de largura, como em todo teclado de letras; com o vão entre teclas o alvo efetivo fica acima do mínimo de 24 px do WCAG 2.2 (2.5.8). Nas teclas de função e no bloco numérico, a largura passa de 44 px.
- Estado de cada tecla (desabilitada, pressionada) nunca só por cor: o desabilitado também perde opacidade e deixa de responder.
- Texto das teclas não escala com o zoom do sistema (a folha tem altura fixa); o campo acima respeita o tamanho de fonte do aparelho.

## Responsividade

- **Celular em retrato (≥ 360 px)**: folha de borda a borda; letras com `flex: 1` e largura máxima de 44 px por tecla.
- **Tablet e celular grande**: conteúdo centralizado até `keyboardMaxWidth`, teclas na mesma altura, folha ainda de borda a borda.
- **Celular em paisagem (altura < 480 px)**: a folha ocuparia mais da metade da tela; as teclas descem para `touchTarget` (44 px) de altura e o campo rola para ficar visível acima dela.
- **Computador**: não aparece (RF1). A detecção usa `hover: none` e `pointer: coarse`, não a largura da tela, para um navegador estreito no computador não receber o teclado de toque.

## Pontos em aberto para o Tech Spec

- Variável CSS que expõe a altura da folha, e como o corpo do `Modal` (inclusive em tela cheia no celular) e as telas fora de modal reservam esse espaço.
- Confirmar que `position: fixed` da folha funciona dentro do `<dialog>` do `Modal` (sem `transform` em ancestrais).
- Forçar o cursor para o fim do campo ao focar e ao tocar, já que o teclado só insere e apaga no fim.
- Saída de emergência para quem depende do teclado do sistema (voz, comutador, teclado Bluetooth): hoje não há tecla "teclado do sistema". Decidir com o produto se entra uma tecla discreta no canto da folha.
