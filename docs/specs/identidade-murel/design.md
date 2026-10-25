# Design Spec: Nova identidade Murel e navegação inferior única

Insumo: `prd.md` (RF-01 a RF-09), guia de marca `Marca_Murel.html` v1.1 e o design system atual (`src/styles/theme.ts`, `src/components/ui`).

**Modo de design:** operar (app de uso diário no portão e no balcão). A marca aparece nos detalhes precisos (cor, fonte, logotipo, símbolo), sem enfeite que atrapalhe a leitura de placa, hora e valor. O guia da Murel é o briefing fixo: não há reinterpretação da paleta nem da tipografia.

## 1. Princípios aplicados do guia

- **Asfalto domina, amarelo é tinta de faixa.** Proporção de referência: 60% fundo, 20% superfícies, 10% giz, 10% amarelo. O amarelo marca **uma ação principal por tela** (botão primário, item ativo, símbolo). Mais de um botão amarelo na mesma tela é erro de design.
- **Duas fontes com papéis fixos.** Plus Jakarta Sans fala; JetBrains Mono registra (placas, horários, valores, códigos de ticket, rótulos pequenos).
- **Motivo de marcação de pátio.** Divisórias de seção em traço (`dashed`) na cor de borda, e o símbolo das três vagas como único elemento decorativo. Nada de gradiente, vidro ou brilho: o `glass` e o `glow` do tema atual saem.
- **Voz de gerente de pátio.** Frases curtas, voz ativa, palavras do pátio, sem jargão nem emoji em mensagem de sistema.

## 2. Tokens (`src/styles/theme.ts`)

Os nomes das chaves de `ThemeColors` atuais são mantidos, para que o código existente continue compilando. Muda o valor, e entram poucos tokens novos. Os valores do tema claro são **propostas** (o guia só define o escuro) e devem passar pela checagem de contraste AA na implementação.

### 2.1 Cores

| Token | Tema escuro | Tema claro | Uso |
|---|---|---|---|
| `background` | `#0E1729` asfalto | `#F4F1E8` giz | Fundo da página |
| `surface` | `#16223A` asfalto claro | `#FFFFFF` | Cartões, painéis, campos |
| `text` | `#F4F1E8` giz | `#0E1729` asfalto | Texto principal |
| `textMuted` | `#9AA3B5` névoa | `#5A6478` | Legendas, texto secundário |
| `border` | `#3A4C6B` faixa gasta | `#D9D4C5` | Bordas e divisórias |
| `primary` | `#FFC20E` amarelo faixa | `#FFC20E` | **Preenchimento** de ação principal e destaque |
| `primaryHover` | `#E0A800` | `#E0A800` | Hover do preenchimento |
| `onPrimary` | `#0E1729` | `#0E1729` | Texto/ícone sobre o amarelo |
| `primarySoft` | `rgba(255,194,14,.12)` | `rgba(14,23,41,.08)` | Fundo leve de item ativo |
| `primarySofter` | `rgba(255,194,14,.22)` | `rgba(14,23,41,.14)` | Estado pressionado |
| `link` | `#FFC20E` | `#0E1729` (sublinhado) | Links em texto |
| `warn` | `#FFC20E` | `#E0A800` | Aviso |
| `onWarn` | `#0E1729` | `#0E1729` | Texto sobre aviso |
| `danger` | `#FF5A5F` | `#C8242B` | Atenção, erro, tempo excedido |
| `dangerSoft` | `rgba(255,90,95,.16)` | `rgba(200,36,43,.10)` | Fundo de erro |
| `success` | `#3CCB7F` | `#17795A` | Confirmado |
| `steel` | `#3A4C6B` | `#9AA3B5` | Ícone inativo, apoio |
| `onSign` / `signEdge` | `#0E1729` / `#F4F1E8` | `#FFFFFF` / `#0E1729` | Mantidos para o pórtico de placas; ver 6 |

**Novos tokens:**
- `colors.accent`: cor para **texto, ícone e linha** de destaque (nunca preenchimento). Escuro `#FFC20E`; claro `#0E1729`. Existe porque o amarelo não tem contraste como texto sobre fundo claro. Todo uso atual de `primary` como cor de texto/ícone/borda (aba ativa, links, rótulos) passa a usar `accent`; `primary` fica só para preenchimento.
- `colors.focus`: anel de foco. Escuro `#FFC20E`; claro `#0E1729`. Substitui o `FOCUS_RING` fixo em `BottomNav.styles.ts` e o contorno `warn`.
- `colors.cliente.{avulso, mensal, conveniado}`: `#4C8DFF`, `#19C2B5`, `#F07A3A` nos dois temas (texto sobre eles sempre `#0E1729`). Usar nos selos de tipo de cliente (`StatusBadge`) e relatórios; mudar para esses valores só onde o tipo de cliente já aparece.
- `colors.pagamento.{dinheiro, pix, credito, debito}`: `#7ED38A`, `#32BCAD`, `#8B7CFF`, `#FF8FA3`. Só onde já existe distinção por forma de pagamento (caixa).

Removidos: `glass`, `glassBorder`, `shadows.glow` (a marca é chapada). Se algum componente ainda os usa, a techspec indica o substituto (`surface` + `border`).

### 2.2 Tipografia

- Novo `fontFamilies`: `sans` = Plus Jakarta Sans; `mono` = JetBrains Mono (ambas com fallback de sistema). Carregadas por `next/font` como variáveis CSS, no lugar de Geist.
- `fontWeights`: acrescentar `semibold: 600` e `extrabold: 800`. Títulos em 800, texto em 400/500, mono em 500/600.
- `typography.display`: peso 800, tracking `-0.02em`, sem caixa alta. Título de página até 40px (`clamp(28px, 4vw, 40px)`); subtítulo 22px/700; texto 16px; rótulo 12px mono, caixa alta, tracking `.12em`.
- `fontSizes`: acrescentar `xxl: "40px"` (título) e `subtitle: "22px"`. Os demais ficam.
- **Papéis da mono** (via componente `Text variant="mono"` ou `Mono`): placa em texto, horário, valor monetário, código/token de ticket, rótulo de seção. Números em colunas usam `font-variant-numeric: tabular-nums`.

### 2.3 Forma e espaço

- `radii`: `sm 6px`, `md 10px` (campos), `lg 14px` (botões, itens), `xl 18px` (cartões, painéis), `full`.
- Sombras: `sm` e `md` ficam, mais discretas; no escuro quase não aparecem (contorno por `border`).
- Espaço: escala atual mantida.
- `layout`: `bottomNavHeight` mantido em 64px; acrescentar `contentMaxWidth: "1120px"` (largura do guia) para limitar o conteúdo da barra e do menu estendido no computador.

## 3. Logotipo (`src/components/ui/Logo`)

- Substitui os PNG/SVG `gipe-*` por **SVG inline** gerado do símbolo do guia (três vagas em M e carro na vaga do meio, com os vidros recortados por máscara). Sem arquivo de imagem, sem troca por tema via `useThemeMode`.
- Props: `variant: "full" | "symbol"`, `size` (altura), `align`, `tone`.
- Cor por fundo, conforme o guia:
  - Fundo asfalto (tema escuro, cabeçalho, login escuro): vagas e palavra em amarelo/giz, carro amarelo.
  - Fundo claro (tema claro): vagas e palavra em asfalto, carro **amarelo**.
  - Fundo amarelo: tudo em asfalto, carro em asfalto com vidros vazados.
- Palavra "murel" sempre em minúsculas, Plus Jakarta Sans 800, tracking `-0.05em`.
- Tamanho mínimo: 24px de altura com palavra, 16px só o símbolo. Área de proteção: uma largura de vaga do símbolo.
- Cabeçalho: `full` a partir de `sm`; abaixo disso, `symbol` se faltar espaço. Login e telas de adesão: `full` grande, com a frase "Seu pátio **sob controle.**" (destaque em `accent`) abaixo.
- Acessibilidade: `role="img"` com rótulo "Murel"; o link do cabeçalho tem `aria-label="Murel — ir para o início"`.
- Máscara do SVG com id único por instância (`useId`), para não colidir quando houver mais de um logotipo na página.
- Animação opcional "estaciona" (carro sobe 46px até a vaga em 1,1s) **apenas** no logotipo grande de login e adesão, e somente sem preferência por movimento reduzido.

## 4. Navegação

### 4.1 Cabeçalho (RF-06)

- Remove o `Gantry` (pórtico) do `AppShell`, inclusive de telas largas. O cabeçalho vira a única faixa de topo: logotipo à esquerda; à direita, boas-vindas ("Olá, nome"), instalar app, alternador de tema e menu do usuário.
- Fundo `background` com divisória inferior `border` em traço fino (sólido, 1px). Altura igual à atual.
- Em tela estreita, a boas-vindas some (como hoje) e fica logotipo `symbol`/`full` + ações.

### 4.2 Barra inferior (RF-07, RF-08)

**Estrutura.** `nav` fixo na base, em todas as larguras, largura total da janela com o conteúdo interno limitado a `contentMaxWidth` e centralizado. Altura `bottomNavHeight` + área segura. Fundo `surface`, divisória superior `border`.

**Item.** Ícone dentro de pílula (52×30) + rótulo de 12px/500. Alvo mínimo 44px de altura e **64px de largura por slot**. Inativo: ícone e rótulo em `textMuted`. Ativo: ícone em `accent` sobre pílula `primarySoft`, rótulo em `text` com peso 700, e **faixa** de 3px no topo do item na cor `primary` (a "faixa de vaga": é o amarelo único da barra). Foco: contorno 2px `focus` com deslocamento, sem o anel duplo atual.

**Rótulos curtos.** O rótulo da barra tem versão curta (uma palavra quando possível) para caber em 64px: Início, Entrada, Saída, Preços, Usuários, Mensalistas, Pátio, Caixa, Notas, Relatórios, Empresa. O menu estendido usa o nome completo atual. Rótulo longo nunca quebra em duas linhas nem corta sem reticências.

**Quantos itens aparecem (comportamento).**
1. Capacidade `n = floor(larguraÚtil / 64px)`, onde a largura útil é a menor entre a janela e `contentMaxWidth`.
2. Se todos os itens permitidos ao perfil couberem (`total ≤ n`), mostra todos e **não** mostra "Mais".
3. Senão, mostra `n − 1` itens e o botão **Mais** no último slot, com o restante no menu estendido.
4. Mínimo de 3 slots: abaixo disso a barra mostra 2 itens + Mais.
5. Os itens se distribuem em colunas iguais (`grid` com colunas fixas por quantidade), alinhados ao centro; nunca há rolagem horizontal na barra.
6. Recalcula ao redimensionar e ao girar o aparelho, sem recarregar e sem saltos (medir com `ResizeObserver`; primeira pintura usa a largura da janela para não piscar).

**Ordem de prioridade (quando há corte).** Início, Entrada, Saída, e depois a ordem atual de `NAV_ITEMS`. Isso mantém, no celular, o que o operador já tem hoje à mão. *Ajuste em relação ao PRD:* o PRD assumiu "a ordem atual do menu", mas nela Entrada e Saída estão no meio da lista e sairiam da barra em telas estreitas; esta ordem as protege. A techspec registra isso no ponto [A DEFINIR] do PRD.

**Item ativo oculto.** Se a tela atual está no menu estendido, o botão Mais fica no estado ativo (mesmo visual do item ativo) e o painel marca a tela atual.

### 4.3 Menu estendido (RF-09)

- Mantém o `dialog` modal atual (Esc, clique fora e foco devolvido ao botão Mais), mas **lista só os itens que não couberam** na barra.
- Celular: painel que sobe da base, largura total, cantos superiores `xl`, "alça" no topo, rolagem interna até 82dvh.
- A partir de `md`: o mesmo painel, mas com largura máxima de 480px, centralizado e ancorado logo acima da barra (não cobre a barra), sem alça.
- Linha do item: tile 36×36 `radii.md` em `border`/`surface` com o ícone em `accent`, nome completo 15px/600, chevron `textMuted`. Linha da tela atual: fundo `primarySoft`, nome em 700, `aria-current="page"`. Altura mínima 48px.
- Fundo do `::backdrop`: asfalto a 60% de opacidade nos dois temas.
- Se não houver itens fora da barra, o botão Mais e o painel não são renderizados.

### 4.4 Espaço do conteúdo (RF-07)

- `Main` e `AppFooter` ganham `padding-bottom` de `bottomNavHeight` + área segura em **todas** as larguras (hoje só abaixo de `lg`). O link de versão do rodapé fica visível ao final da rolagem.
- Botões flutuantes (ex.: "Novo mensalista") se posicionam acima da barra em todas as larguras, com o mesmo cálculo.

## 5. Telas, estados e componentes

| Superfície | Estados | Componentes do design system | Observações de marca |
|---|---|---|---|
| Barra inferior | carregando (4 slots em `Skeleton`), todos os itens, com Mais, item ativo, item ativo oculto, foco | novo `BottomBar` adaptável, `Skeleton` | Um único amarelo: a faixa do item ativo |
| Menu estendido | fechado, aberto, tela atual marcada, sem itens (não existe) | `Sheet` (dialog) ajustado | Tile com ícone `accent` |
| Cabeçalho | carregando boas-vindas, logado | `Logo`, `Text`, `UserMenu` | Sem menu de navegação |
| Login, adesão, primeiro acesso, recuperar e alterar senha | padrão, erro, carregando, sucesso | `AuthCard`, `Input`, `Button`, `Logo` grande | Frase "Seu pátio sob controle." no login; botão primário amarelo é o único da tela |
| Ticket, recibo e comprovante públicos | padrão, carregando, erro, ticket inválido | `PlateDisplay`, `QrCode`, `Card`, `Logo` | Fundo giz com texto asfalto em página pública clara; QR sobre fundo giz; valores e horas em mono |
| Recibo em PDF | gerado | — | Faixa superior asfalto com símbolo amarelo e "murel" em giz; dados em tabela simples; textos em Helvetica se a fonte do guia não puder ser embutida (decisão da techspec) |
| App instalado | ícone, abertura | — | Ver 7 |

**Componentes base afetados:**
- `Button`: `primary` = fundo `primary`, texto `onPrimary`, peso 800, raio `lg`, hover `primaryHover`. `secondary`/ghost = borda 1.5px `#6B80A4` (escuro) / `#0E1729` (claro), texto `text`. Perigo mantém o vermelho do guia. A regra "um primário por tela" é revisada tela a tela na implementação.
- `Input`, `Select`: fundo `surface`, borda 1px na cor de controle (`#6B80A4` escuro / `#8A93A5` claro), raio `md`, foco com `focus`. Rótulos 12px; valores de placa em mono.
- `Card`, `InfoCard`, `Modal`: fundo `surface`, raio `xl`, sem vidro nem brilho.
- `StatusBadge`: aplicar cores de cliente onde o tipo aparece; texto `#0E1729`.
- `PlateDisplay`: placa Mercosul (branca, faixa azul `#1F4DB3`) e modelo antigo (cinza), valores em JetBrains Mono 600, como no guia.
- `PageBackground`: fundo chapado `background`; sem decoração. Nas telas de autenticação, no máximo o símbolo grande em `border` com baixa opacidade, atrás do cartão.
- `Table`, `Tabs`, `Stepper`, `Switch`, `Checkbox`: só herdam os novos tokens; `accent` onde hoje usam `primary` como texto/linha.

## 6. Pontos de atenção de contraste e coerência

- Amarelo sobre fundo claro nunca é texto nem ícone fino: usar `accent` (asfalto). O amarelo só aparece como preenchimento com `onPrimary` (asfalto) por cima.
- Texto sobre as cores de cliente e de pagamento é sempre asfalto.
- `danger`/`success` no claro foram escurecidos em relação ao guia para atingir AA como texto; no escuro seguem o guia.
- `onSign`/`signEdge`/`warn` ficam disponíveis só enquanto algum componente ainda os referenciar; com o pórtico removido, a techspec confirma se `onSign`, `signEdge` e `NavSign` podem ser apagados.
- Dois botões amarelos na mesma tela, ou amarelo fora de ação principal/ativo/símbolo, contam como defeito de revisão visual.

## 7. App instalável e metadados

- `theme_color` e `background_color`: `#0E1729`; `viewport.themeColor`: `#0E1729` no escuro e `#F4F1E8` no claro (`media: prefers-color-scheme`).
- Ícones 192, 512, maskable 512 e apple-touch: fundo asfalto `#0E1729`, símbolo amarelo centralizado. O maskable mantém o símbolo dentro dos 60% centrais.
- `name`: "Murel"; `short_name`: "Murel"; descrição: "Controle de entrada, saída e caixa de estacionamentos, valets e lava-rápidos." Títulos de aba: "Nome da tela — Murel".
- Favicon: símbolo (16px mínimo permitido pelo guia).

## 8. Responsividade

| Largura | Cabeçalho | Barra inferior | Menu estendido |
|---|---|---|---|
| < 480px | Símbolo + ações; sem boas-vindas | 4–5 slots de 64px, resto em Mais | Folha de largura total |
| 480–767px | Logotipo completo | 5–11 slots conforme a largura | Folha de largura total |
| 768–1023px | Logotipo + boas-vindas | Mais slots; pode mostrar todos | Folha centralizada, máx. 480px |
| ≥ 1024px | Idem; **sem pórtico** | Conteúdo limitado a 1120px; mostra todos que couberem | Idem |

## 9. Movimento e acessibilidade

- Folha do menu sobe em 220ms; "estaciona" só no logotipo grande; troca de tema sem transição de cor demorada. Tudo desligado com `prefers-reduced-motion`.
- Barra: `nav` rotulada "Navegação principal"; item atual com `aria-current="page"`; botão Mais com `aria-haspopup="dialog"`, `aria-expanded` e `aria-controls`.
- Alvos de toque ≥ 44px; contraste AA nos dois temas (texto ≥ 4,5:1; controles e ícones ≥ 3:1); foco sempre visível.
- Rótulos de ícone nunca dependem só de cor: o ativo também muda peso do rótulo e ganha a faixa superior.

## 10. Texto de interface (tom de voz)

Troca de marca nos textos existentes, sem reescrever o resto. Frases novas obrigatórias:
- Login e adesão: "Seu pátio sob controle."
- Apresentação curta: "A Murel controla entrada, saída e caixa de estacionamentos, valets e lava-rápidos. Sem impressora e sem cadastro do cliente."
- Instalação: "Acesse a Murel direto da tela inicial ou da área de trabalho." / "Para instalar a Murel: toque em Compartilhar e depois em “Adicionar à Tela de Início”."
- QR inválido: "QR Code não é um ticket Murel."
- Evitar "plataforma", "solução", "otimizar", pedidos de desculpa vagos e emoji em mensagens de sistema.

## 11. Fora desta spec

Site, redes sociais, sinalização do pátio e papelaria do guia; tema único escuro; reescrita de todo o texto do sistema; mudanças de permissão ou de conteúdo das telas.

## 12. Para a techspec decidir

- Estratégia de medição da largura da barra (ResizeObserver no contêiner) e valor inicial no servidor para evitar piscada.
- Como gerar os ícones PNG do app a partir do SVG do símbolo e como embutir (ou não) as fontes no PDF.
- Varredura de usos de `primary` como cor de texto/ícone para migrar a `accent`, e dos usos de `glass`, `glow`, `onSign`, `signEdge`, `NavSign` e `Gantry` antes de removê-los.
- Teste visual dos dois temas nas telas principais, com checagem de contraste.
