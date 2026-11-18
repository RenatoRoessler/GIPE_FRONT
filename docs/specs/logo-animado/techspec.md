# Tech Spec: Logo animado do Murel

## Referências
- PRD: ./prd.md
- Design: ./design.md (skill claude-design)
- Protótipo: ./prototipo.html (só trajeto, tempos e luzes; o desenho é o do símbolo oficial)
- Base: ../identidade-murel/techspec.md (Logo e MurelSymbol atuais)

## Design
- **Estados**: repouso (logo de hoje), animando, parada pelo usuário (fade de 150 ms + 150 ms para o repouso). Linha do tempo em `design.md` §2.
- **Componentes do design system reaproveitados**: `ui/Logo` e `ui/Logo/MurelSymbol` (mesma API pública, com `animated` passando a significar a nova animação).
- **Componentes novos**: nenhum componente de UI novo. Entram dois módulos internos de `ui/Logo`: o trajeto (função pura) e o hook que roda a animação.
- **Tokens**: nenhum token novo no tema. Vagas em `currentColor` (`colors.accent`), palavra em `colors.text`, foco em `colors.focus`. As luzes são constantes de marca no símbolo (`LUZ_FAROL`, `LUZ_FREIO`, `LUZ_RE`), ao lado das já existentes `AMARELO_FAIXA` e `ASFALTO` (`design.md` §5 e §8).

## Arquitetura da solução

Tudo é Client Component: `Logo` e `MurelSymbol` já têm `"use client"`, e todos os pontos de uso (`Header`, `AuthCard`, `AdesaoShell`, páginas públicas e de contrato) também. O render do servidor mostra o repouso; a animação começa no cliente depois de montar.

### 1. `src/components/ui/Logo/carroTrajeto.ts` (novo, função pura)

Toda a matemática do protótipo, em unidades do `viewBox` do símbolo, sem DOM:

```ts
export interface Pose {
  // Deslocamento do carro em relação à vaga (120, 95) e rotação em graus em torno do centro do carro.
  dx: number;
  dy: number;
  angulo: number;
  visivel: boolean; // false durante a fase "logo vazio"
  freio: number;    // 0..1
  re: number;       // 0..1
  facho: number;    // 0..0,5
}

export interface Trilho {
  inicioX: number; // x de entrada (à direita da área do logo, fora da vista)
  fimX: number;    // x de saída (à esquerda, fora da vista)
}

export const FASES: readonly { nome: Fase; duracao: number }[]; // design.md §2, em segundos
export const DURACAO_TOTAL: number; // ≈ 24,1 s (inclui os 0,6 s de assentamento)
export function poseNoTempo(t: number, trilho: Trilho): Pose; // t em segundos desde o início
export function terminou(t: number): boolean;                  // t >= DURACAO_TOTAL
export const POSE_REPOUSO: Pose; // dx 0, dy 0, angulo 0, visivel, luzes apagadas
```

- Geometria: vaga (120, 95), rua y = 168 (logo abaixo das vagas; ver `design.md` §4), raio 60 com centro (180, 108); reta na rua, quarto de círculo e subida, parametrizados por distância como no protótipo (`poseEntrada`). Ré = mesmo trajeto ao contrário até o início do arco; saída = reta até `fimX`.
- Sequência: espera inicial → ciclo (ré, troca, saída, vazio, entrada, estacionado) → ciclo sem o "estacionado" → assentamento (0,6 s com o freio) → repouso.
- Easings do protótipo: `easeOutCubic` (entrada), `easeInOut` cúbico (ré), `easeInQuad` (saída).
- `t >= DURACAO_TOTAL` devolve `POSE_REPOUSO`.

### 2. `src/components/ui/Logo/useAnimacaoDoCarro.ts` (novo, hook)

```ts
export interface CarroRefs {
  carro: RefObject<SVGGElement | null>;
  freio: RefObject<SVGGElement | null>;
  re: RefObject<SVGGElement | null>;
  facho: RefObject<SVGPathElement | null>;
}

export function useAnimacaoDoCarro(opcoes: {
  ativo: boolean;              // prop animated
  area: RefObject<HTMLElement | null>; // caixa do logo, para calcular o trilho
  alturaSimbolo: number;       // px; escala = alturaSimbolo / 160
}): { refs: CarroRefs; animando: boolean; parar: () => boolean };
```

- **Início**: num `useEffect`, só se `ativo`, se existe `window.matchMedia` e se `(prefers-reduced-motion: reduce)` não casa. Sem `matchMedia` (jsdom) não anima, o que mantém os testes atuais estáveis.
- **Laço**: `requestAnimationFrame`, escrevendo direto nos atributos via refs (`transform` do grupo do carro, `opacity` de freio, ré e facho, `visibility` no vazio). **Sem `setState` por quadro**. O transform é `translate(dx dy) rotate(angulo 120 95)`, então o carro é desenhado nas coordenadas da vaga.
- **Tempo**: acumulado com `delta` entre quadros, limitado a 50 ms por quadro. Com a aba em segundo plano o navegador suspende o `requestAnimationFrame`, e o limite evita o salto de fase ao voltar (pausa, `design.md` §10).
- **Trilho**: medido no início e com `ResizeObserver` na `area`: `inicioX = larguraDaArea / escala + 40`, `fimX = −40` (40 = meia-comprimento do carro + folga). Com `compactOnMobile` a palavra some e a largura medida é a do símbolo, sem caso especial.
- **Movimento reduzido no meio**: listener em `matchMedia(...).addEventListener("change")`; se passar a `reduce`, chama `parar()`.
- **`parar()`**: se estava animando, cancela o quadro, aplica o fade (opacidade do grupo 1 → 0 em 150 ms, `POSE_REPOUSO`, 0 → 1 em 150 ms, via transição CSS em `opacity`), marca como parado e devolve `true`. Se já estava em repouso, devolve `false`. Depois de parar, não recomeça.
- **Fim natural**: ao `terminou(t)`, aplica `POSE_REPOUSO` e marca `animando = false` (um único `setState`, no fim).
- **Limpeza**: `cancelAnimationFrame`, `disconnect` do observer e remoção do listener no desmontar.

### 3. `src/components/ui/Logo/MurelSymbol.tsx`

- Remover os keyframes `estaciona` e o `Car` com animação CSS.
- Nova prop interna `carro?: CarroRefs` (passada pelo `Logo` quando animado). Com ela, o grupo do carro recebe o ref e passam a existir os elementos de luz:
  - `facho` (trapézio com `radialGradient`, id por `useId`), `freio` (dois retângulos + halo com `feGaussianBlur`, id por `useId`) e `re` (um retângulo + halo), nas posições de `design.md` §5, relativas ao centro (120, 95).
  - Todos com `opacity="0"` no render inicial (repouso sem luzes) e `aria-hidden`.
  - Abaixo de 40 px de altura: sem os pontos dos faróis e das lanternas nítidas, só facho e halos, com `stdDeviation` pela metade.
- Sem `carro`, o símbolo renderiza exatamente como hoje (mesmos elementos, mesma máscara), para cartaz, impressão e usos estáticos.
- O retângulo do carro continua com a máscara `userSpaceOnUse` de hoje: como a máscara é aplicada no retângulo dentro do grupo transformado, os vidros vazados acompanham o carro.
- `tone="onYellow"`: o `Logo` nunca passa `carro` (sem animação, `design.md` §5).

### 4. `src/components/ui/Logo/Logo.tsx` e `Logo.styles.ts`

- Props novas:
  ```ts
  ref?: Ref<LogoHandle>;          // React 19: ref como prop
  pararAoInteragir?: boolean;     // padrão true; o Header passa false e controla pelo ref
  export interface LogoHandle { parar: () => boolean }
  ```
- `animated && tone !== "onYellow"` liga o hook; `useImperativeHandle(ref, () => ({ parar }))`.
- Com `pararAoInteragir`, o `LogoWrapper` chama `parar()` em `onPointerEnter` (só `pointerType === "mouse"`) e em `onPointerDown` (qualquer ponteiro).
- `LogoWrapper` recebe `$animado` quando a animação está ligada:
  - `overflow: hidden` + `padding-bottom` de `0.175 × altura` (28/160). A faixa da rua ocupa espaço no layout, para o carro nunca passar por cima do conteúdo abaixo (correção da T7, `design.md` §4). O alinhamento do símbolo com a palavra não muda (o padding fica fora da caixa de conteúdo).
  - O `svg` do símbolo fica com `overflow="visible"` (já está), e o carro desenha por cima da palavra na ordem do DOM: o símbolo ganha `position: relative; z-index: 1` dentro do wrapper.
  - `@media print`: o grupo do carro com `transform: none !important` (a propriedade CSS vence o atributo SVG e põe o carro na vaga), luzes com `display: none`, e o grupo visível. Impressão sai sempre em repouso, mesmo no meio da animação.
- O nome acessível continua `role="img"` + `aria-label="Murel"` no wrapper.

### 5. `src/components/layout/Header/Header.tsx`

- `const logoRef = useRef<LogoHandle>(null)`; `<Logo ref={logoRef} pararAoInteragir={false} animated align="start" size={28} />`.
- No `BrandLink`:
  - `onPointerEnter={(e) => e.pointerType === "mouse" && logoRef.current?.parar()}`
  - `onFocus={() => logoRef.current?.parar()}`
  - `onClick={(e) => { if (logoRef.current?.parar()) e.preventDefault(); }}`: durante a animação o clique (ou toque) só para; em repouso, `parar()` devolve `false` e o `NextLink` navega.
- Com mouse o hover já parou antes do clique, então o clique navega. Com teclado o foco já parou, então Enter navega.
- O `Header` fica no `AppShell`, que é o layout de `src/app/(app)/layout.tsx`: ele monta uma vez por carregamento e não remonta entre telas, então a animação roda uma vez por abertura do sistema (RF5) sem código extra.

### 6. Pontos de uso

| Arquivo | Mudança |
|---|---|
| `src/components/ui/AuthCard/AuthCard.tsx` | Nenhuma (já usa `animated`). |
| `src/components/adesao/AdesaoShell/AdesaoShell.tsx` | Adicionar `animated`. |
| `src/components/veiculos/ComprovantePublico/ComprovantePublico.tsx` | Adicionar `animated`. |
| `src/components/veiculos/ConsultaTicketPublica/ConsultaTicketPublica.tsx` | Adicionar `animated`. |
| `src/components/veiculos/ReciboPublico/ReciboPublico.tsx` | Adicionar `animated`. |
| `src/components/contrato/ContratoAceite/ContratoAceite.tsx` | Adicionar `animated`. |
| `src/components/contrato/ContratoMensagem.tsx` | Adicionar `animated`. |
| `src/components/empresa/CartazTicket/CartazTicket.tsx` | Nenhuma: continua estático (RF9). |

A documentação da prop `animated` em `Logo.tsx` ("só para logotipos grandes") passa a dizer onde a animação é usada.

### 7. Testes

- `carroTrajeto.test.ts` (novo):
  - `t = 0` e a espera inicial: carro na vaga (`dx 0, dy 0, angulo 0`).
  - Meio da fase "vazio": `visivel === false`.
  - Fim da entrada: de volta à vaga; meio da saída: na rua (`dy` = 95, `angulo` = −90).
  - Freio aceso no fim da entrada e na troca de marcha; ré acesa durante a ré.
  - `DURACAO_TOTAL ≈ 24,1 s` e `poseNoTempo(DURACAO_TOTAL + 10)` igual a `POSE_REPOUSO`.
  - Trilho: com `inicioX` maior, a pose na rua no início da entrada fica mais à direita.
- `Logo.test.tsx` (ajustar e ampliar):
  - Os testes atuais continuam passando (sem `matchMedia` no jsdom não há animação).
  - Com `matchMedia` simulado sem movimento reduzido e `requestAnimationFrame` falso: `animated` agenda quadros; com `reduce`, não agenda; `tone="onYellow"` não agenda.
  - `parar()` pelo ref devolve `true` durante a animação e `false` depois; depois de parar não agenda mais quadros.
  - `pointerdown` no logo (com `pararAoInteragir`) para a animação.
  - Sem `animated`, o SVG não tem elementos de luz (cartaz e usos estáticos iguais a hoje).
- `src/components/layout/Header/Header.test.tsx` (novo; o Header ainda não tem testes): clique no link durante a animação não navega e para; segundo clique navega; foco para a animação.

## Decisões técnicas e trade-offs
- **`requestAnimationFrame` + função pura, não keyframes CSS nem SMIL.** O trajeto tem reta, arco e subida com easings diferentes e a distância da reta depende da largura medida do logo. Keyframes CSS precisariam de muitos quadros-chave fixos e não se ajustam à largura; SMIL não para de forma controlada e tem suporte irregular. A função pura (`poseNoTempo`) é a do protótipo, testável sem DOM.
- **Escrever atributos por ref, sem `setState` por quadro.** 60 renderizações por segundo no cabeçalho, durante 24 s, em toda tela do sistema, seriam desperdício e poderiam atrasar a interação (RF13).
- **Carro desenhado na vaga e deslocado por `transform`.** Assim o render do servidor, a impressão (`transform: none`) e o movimento reduzido mostram o repouso sem lógica extra, e a máscara dos vidros acompanha o carro.
- **Recorte por `overflow: hidden` com padding e margem negativa no wrapper**, em vez de um SVG sobreposto do tamanho do logo: um único SVG, sem duplicar o símbolo nem sincronizar dois desenhos, e sem mudar o layout.
- **`ref` com `parar()` no lugar de estado controlado.** O `Header` precisa decidir de forma síncrona, dentro do `onClick`, se cancela a navegação; um booleano em estado poderia estar desatualizado no mesmo evento.
- **Sem `matchMedia`, sem animação.** É o comportamento seguro para ambientes sem a API (testes, navegadores antigos).

## Riscos / pontos de atenção
- **Recorte e foco**: o `overflow: hidden` do wrapper não pode cortar o anel de foco do link, que fica no `BrandLink` (fora do wrapper). Conferir no QA.
- **Faixa da rua**: 5 px no cabeçalho, 6 px na adesão, 9 px no contrato e 10 px no login, reservados no layout. No cabeçalho a barra é sustentada pelos botões (44 px), então a altura dela não muda; o logo sobe cerca de 2 px.
- **Fonte da palavra**: a largura do logo muda quando a fonte termina de carregar; o `ResizeObserver` recalcula o trilho, mas o carro pode começar a entrada de um ponto diferente se a fonte chegar no meio. Aceitável (está fora da vista).
- **`transform` CSS versus atributo no SVG**: a regra de impressão depende de a propriedade CSS `transform` sobrescrever o atributo `transform` do `<g>`, o que vale nos navegadores atuais. Conferir na impressão do comprovante e do contrato.
- **Toque no cabeçalho**: `pointerdown` não é usado no `Header` (só `onClick`), para o primeiro toque não parar e navegar no mesmo gesto.
- **Desempenho em aparelhos fracos**: o halo com `feGaussianBlur` em movimento custa mais. Se pesar, o halo pode virar um retângulo com opacidade menor (sem filtro), sem mudar o design.

## Fora de escopo técnico
- Mudar o desenho do símbolo, a palavra, as cores da marca ou o tamanho do logo.
- Animar o cartaz do ticket, a impressão ou o tom `onYellow`.
- Configuração do usuário para desligar a animação (além de parar pelo logo e da preferência do aparelho).
- Testes E2E da animação no navegador (a conferência visual fica para o QA).
