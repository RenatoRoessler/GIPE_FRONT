# Design Spec: Logo animado do Murel

Insumo para o Tech Spec. Baseado em `prd.md` (RF1 a RF16) e em `prototipo.html`. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e as regras de marca de `docs/specs/identidade-murel/design.md`, que esta spec atualiza apenas na parte de animação.

## Direção

A animação é uma **história curta do produto dentro da marca**: um carro chega, estaciona, espera, vai embora, e o pátio volta a ficar pronto para o próximo. Ela tem de ser fiel ao exemplo no movimento e nos detalhes de luz, mas **o carro e as vagas continuam sendo os do símbolo oficial**, não os do protótipo:

- O símbolo continua o mesmo (`viewBox 0 0 240 160`, vagas `M20 140V24H220V140M82 24V140M158 24V140`, carro de 36×66 com para-brisa e vidro traseiro vazados por máscara). O protótipo usa outro desenho de vagas e outro carro; dele vêm só o **trajeto, o tempo e as luzes**.
- O estado de repouso é **o logo de sempre**, com o carro estacionado. É assim que o logo aparece antes da animação, quando ela termina, quando é parada e com movimento reduzido. Nunca há salto visual entre o logo estático e o primeiro quadro da animação.
- Movimento só em `transform` e `opacity`. Nada muda o tamanho do logo nem empurra o layout.

O que **não** fazer: copiar o SVG do protótipo (vagas, carro e fonte Poppins não são a marca); começar com o logo vazio (o carro "sumiria" ao carregar a página); deixar o carro aparecer fora da área do logo; animar no cartaz ou na impressão.

---

## 1. Estados

| Estado | O que se vê | Quando |
|---|---|---|
| **Repouso** | Logo estático: carro na vaga do meio, sem luzes acesas. | Antes do primeiro quadro (render do servidor), depois da animação, depois de parada, com movimento reduzido, na impressão, no cartaz, com `tone="onYellow"` sem animação. |
| **Animando** | O carro percorre a linha do tempo da §2. | Ao montar o logo animado, sem movimento reduzido. |
| **Parada pelo usuário** | Transição curta para o repouso (§3). | Hover, foco ou toque no logo durante a animação. |

Não há estados de carregamento, erro ou vazio: o logo é sempre renderizado.

---

## 2. Linha do tempo

### Fases (durações do protótipo)

| Fase | Duração | Movimento | Luzes |
|---|---|---|---|
| **Espera inicial** | 1,2 s | Parado na vaga. | Faróis acendem nos últimos 0,5 s; luz de ré acende nos últimos 0,4 s. |
| **Ré** | 1,5 s | Sai de ré da vaga refazendo a curva até a rua (easing `inOut` cúbico). | Ré acesa; freio acende nos últimos 15%. |
| **Troca de marcha** | 0,35 s | Parado na rua, de lado. | Freio aceso. |
| **Saída** | 1,7 s | Segue para a esquerda até sair da área do logo (easing `in` quadrático). | Faróis acesos. |
| **Logo vazio** | 1,2 s | Sem carro. | — |
| **Entrada** | 3,4 s | Entra pela direita na rua, faz a curva e sobe até a vaga (easing `out` cúbico). | Faróis acesos; freio acende nos últimos 18%. |
| **Estacionado** | 6 s | Parado na vaga. | Freio aceso nos primeiros 0,6 s; faróis se apagam em 0,6 s; nos últimos 0,5 s os faróis voltam e, nos últimos 0,4 s, a ré acende. |

### Sequência completa (≈ 24 s)

```
Espera inicial → [Ré → Troca → Saída → Vazio → Entrada → Estacionado] → [Ré → Troca → Saída → Vazio → Entrada] → Repouso
     1,2 s                        14,15 s                                          8,15 s                     (fim)
```

- **2 ciclos** (decisão do PRD): o carro sai e volta duas vezes. A segunda chegada termina no **repouso**: freio pisca por 0,6 s, faróis se apagam, e a animação acaba. Total ≈ 23,5 s de movimento + 0,6 s de assentamento. O PRD estimou "cerca de 30 s" contando o ciclo de 14 s do protótipo duas vezes; começar e terminar estacionado tira um trecho parado de 6 s, e o número de ciclos (2 saídas e 2 chegadas) é o decidido.
- Começar parado (e não com o logo vazio, como no protótipo) evita o carro sumir no primeiro quadro e casa com o logo renderizado no servidor.

### Trajeto (unidades do `viewBox` do símbolo)

Mesma geometria do protótipo, ajustada ao símbolo oficial (as vagas têm a mesma altura de 160 unidades nos dois):

| Ponto | Valor |
|---|---|
| Vaga (centro do carro estacionado) | x = 120, y = 95, apontando para cima (0°) |
| Rua | y = 168, logo abaixo da linha de baixo das vagas (ver nota da §4) |
| Raio da curva | 60, centro em (180, 108) |
| Na rua | carro deitado, apontando para a esquerda (−90°) |
| Entrada | começa logo depois da borda direita da **área do logo** (§4), fora da vista |
| Saída | termina logo depois da borda esquerda da área do logo, fora da vista |

Com a palavra "murel", o carro entra pela direita da palavra e passa por baixo dela, como no protótipo. Só com o símbolo, entra pela direita do símbolo: a reta é mais curta, as durações não mudam.

---

## 3. Parar pelo logo (RF14 a RF16)

- **Gatilhos**: `pointerenter` com mouse, `focus` (incluindo `focus-visible` do link do cabeçalho) e toque (`pointerdown` com dedo ou caneta).
- **Transição**: o carro some em 150 ms (opacidade 1 → 0), é posicionado na vaga e reaparece em 150 ms (0 → 1), com as luzes apagadas. Sem trajeto de volta: parar não pode ser mais movimento.
- Depois de parada, a animação **não recomeça** enquanto a página estiver aberta (nem ao tirar o mouse ou perder o foco), nem pelo reinício de 2 minutos.
- **Reinício (revisão de 2026-11-18):** terminada sozinha, a sequência recomeça 2 minutos depois, com o carro saindo da vaga. Interagir com o logo durante esse intervalo cancela o próximo reinício (o toque, nesse caso, não é uma parada: no cabeçalho, ele navega).
- **Cabeçalho** (o logo é o link "Murel — ir para o início"):
  - Toque ou clique **durante** a animação: só para; a navegação daquele toque é cancelada.
  - Toque ou clique **com a animação em repouso**: navega para o início, como hoje.
  - Teclado: o foco já para a animação; Enter navega. O anel de foco do link continua o mesmo.
  - Com mouse, o hover já parou a animação antes do clique, então o clique navega direto.
- **Fora do cabeçalho** o logo não é interativo; o toque só para. O cursor não muda (nada indica um botão que não existe).

---

## 4. Área do logo e recorte

- A **área visível** do carro é a caixa do logo inteira (símbolo + palavra, ou só o símbolo), **estendida para baixo** até caber a rua: 28 unidades do símbolo abaixo da base do `viewBox` (rua em y 168 + meia largura do carro, 18, com folga). Em pixels: ≈ 17,5% da altura do símbolo (5 px no cabeçalho de 28 px, 10 px no login de 56 px).
- Fora dessa área o carro é recortado (some), como no protótipo, que recorta pelo `viewBox`.
- A faixa da rua **ocupa espaço no layout**, como no protótipo (que reserva a rua dentro do próprio desenho do logo).
- **Correção da verificação (T7):** a primeira versão punha a rua 50 unidades abaixo das vagas (y 190) e não reservava espaço, transbordando por cima do que vem abaixo do logo. No login o carro passava por cima da frase "Seu pátio sob controle." (RF11). A rua subiu para logo abaixo das vagas e a faixa passou a ser reservada; no cabeçalho a reserva cabe na altura que os botões já dão à barra.
- O carro passa **por cima** da palavra? Pode encostar no fim dela: o topo do carro deitado fica em y 150 e a palavra termina perto de y 152. O carro é desenhado acima de tudo do logo.

---

## 5. Carro e luzes

O carro animado é o **mesmo retângulo do símbolo** (36×66, `rx 12`, com para-brisa e vidro traseiro vazados), mais as luzes do protótipo, posicionadas nas proporções do carro oficial:

| Elemento | Forma (relativa ao centro do carro, apontando para cima) | Cor |
|---|---|---|
| Faróis | dois círculos r 2,4 em (±10, −30) | creme do farol |
| Facho | trapézio de (±15, −33) até (±27, −84), gradiente radial do creme a transparente | creme do farol, opacidade 0 a 0,5 |
| Luz de freio | dois retângulos 8×3,5 (`rx` 1,75) em (±10, 29), com halo desfocado | vermelho do freio |
| Luz de ré | um retângulo 9×3 no centro (0, 30), com halo desfocado | branco |

- **Cores das luzes** são da marca e iguais nos dois temas (como o amarelo do carro, que já é constante no símbolo): creme `#FFF6CC`/`#FFF8DA`, vermelho `#FF3B3B`/`#FF5A5A`, branco `#FFFFFF`. Ficam como constantes nomeadas no próprio símbolo, ao lado de `AMARELO_FAIXA` e `ASFALTO`. **Não** usam `colors.danger`: a luz de freio não é um estado de erro e não pode mudar com o tema.
- **Tamanhos pequenos**: abaixo de 40 px de altura (cabeçalho, páginas públicas) faróis e lanternas ficam com menos de 1 px e o halo desfocado vira mancha. Nesses tamanhos desenham-se **só o facho e o halo das lanternas** (sem os pontos nítidos) e o desfoque cai pela metade. A partir de 40 px (login, adesão), tudo.
- **`tone="onYellow"`**: sem animação (o carro e as vagas são asfalto sobre amarelo e as luzes não têm contraste). Hoje esse tom só é usado em superfícies estáticas.

---

## 6. Onde anima

| Lugar | Logo | Animação |
|---|---|---|
| Cabeçalho do sistema | completo, 28 px | sim, uma vez por carregamento do sistema (o cabeçalho persiste entre as telas) |
| Login (`AuthCard`) | completo, 56 px | sim, substitui a "estaciona" atual |
| Adesão (`AdesaoShell`) | completo, 32 px; só símbolo abaixo de `sm` | sim |
| Comprovante digital, consulta do ticket, recibo | completo, 28 px | sim |
| Aceite e mensagem do contrato | completo, 48 px | sim |
| Cartaz do ticket | 48 e 32 px | **não** |
| Impressão (`@media print`) de qualquer página | — | **não**: repouso |

---

## 7. Componentes

- **`ui/Logo` + `ui/Logo/MurelSymbol`**: a prop `animated` passa a significar a nova animação. A animação "estaciona" (keyframes de 1,1 s) sai. Nenhum componente novo de design system; o motor da animação fica dentro de `ui/Logo` (detalhe no Tech Spec).
- **Header**: o `BrandLink` passa a interceptar o clique durante a animação (§3). Sem mudança visual.
- Nenhum outro componente muda de aparência.

## 8. Tokens

| Uso | Token / constante |
|---|---|
| Vagas | `colors.accent` (via `currentColor`, como hoje) |
| Carro | `AMARELO_FAIXA` (constante da marca, como hoje) |
| Palavra | `colors.text` (como hoje) |
| Luzes | constantes novas da marca no símbolo: `LUZ_FAROL`, `LUZ_FREIO`, `LUZ_RE` (§5) |
| Foco do link do cabeçalho | `colors.focus` (como hoje) |
| Transição de parada | 150 ms + 150 ms (constante local da animação; o tema não tem tokens de duração) |

Nenhum token novo no tema.

## 9. Responsividade

- O trajeto é definido em unidades do símbolo, então escala com o `size` do logo em qualquer tela.
- Com `compactOnMobile` (adesão abaixo de `sm`), a área do logo é só o símbolo, e o carro entra e sai pelas bordas do símbolo.
- Telas grandes não mudam nada além do hover (§3).

## 10. Acessibilidade

- **Movimento reduzido** (`prefers-reduced-motion: reduce`): repouso direto, sem nenhum quadro de animação. Se a preferência mudar durante a animação, ela para (como na §3).
- **WCAG 2.2.2**: a animação passa de 5 s e por isso pode ser parada pelo próprio logo (§3) por mouse, teclado e toque.
- **Leitor de tela**: o logo continua `role="img"` com o nome "Murel" (e, no cabeçalho, o link "Murel — ir para o início"). Carro e luzes são `aria-hidden`; nada é anunciado.
- **Sem flashes**: freio e ré acendem no máximo duas vezes por ciclo, bem abaixo de 3 por segundo (WCAG 2.3.1).
- **Aba em segundo plano**: a animação pausa e continua de onde estava ao voltar, para não "pular" de fase.
