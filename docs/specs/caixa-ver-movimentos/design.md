# Design Spec: Ver movimentos do caixa

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`.

## Direção

Modo **Operate**: é uma tela de conferência, usada com calma em computador. Nada de composição nova: o caixa já tem uma lista de movimentos pronta (`MovimentosLista`, a mesma do extrato de caixas fechados). A tela nova é só a moldura que a leva ao caixa aberto, com o mesmo visual do extrato para a pessoa não reaprender nada.

## Decisões que fecham as pendências do PRD

Valem como proposta até o PRD ser atualizado:
- **Perfis (RF1):** o botão aparece para quem já acessa o Caixa (Administrador, Gerente, Caixa e Manobrista). A conferência não altera nada, então não há motivo para restringir.
- **Período (RF8):** a lista é a do **caixa aberto**, a mesma consulta que alimenta o resumo da tela. O histórico de caixas anteriores continua em `/caixa/historico`.
- **Identificação do pátio (RF5):** a API devolve só o `patioId`, sem placa, e a lista atual não o exibe. Fica **fora** desta versão; a coluna "Motivo" traz a observação quando houver.
- **Filtros e paginação:** `MovimentosLista` já traz filtro por tipo e por turno e paginação de 20 itens. Reaproveitar como está custa menos do que esconder. O PRD lista isso como fora de escopo; sugiro ajustá-lo para "sem novos filtros além dos que a lista já tem".

## Componentes do design system

### Reaproveitados
- `MovimentosLista` (`src/components/caixa/`): tabela com data/hora, tipo (`StatusBadge`: Entrada / Saída / Sangria, com texto, então não depende só de cor), forma, usuário (+ turno), motivo e valor com sinal `+`/`−`. Já trata carregando (`Skeleton`), vazio, filtro sem resultado, erro com "Tentar novamente" (`ErrorBanner` + `Button`) e 403 (`ErroSemPermissao`). Em tela pequena vira cartões (`data-label`), mas esta tela não é oferecida lá.
- `Page`, `TitleGroup`, `Panel`, `InfoList` (`Caixa.styles`) e `Link`, `Text`, `Button`, como em `ExtratoCaixaPage`.
- `Button` `secondary` para o acesso na tela do Caixa.

### Novos
- Nenhum componente em `src/components/ui`.
- **MovimentosCaixaPage** (`src/components/caixa/`): página da lista do caixa aberto, irmã de `ExtratoCaixaPage`.
- Botão **Ver movimentos** dentro de `AcoesCaixa` ou ao lado do bloco de ações em `CaixaPage` (decisão de posição abaixo).

### Tokens
Nenhum novo. `surface`, `border`, `textMuted`, `space`, `radii`, `fontSizes` e `breakpoints.lg` do tema atual.

## Telas e estados

### 1. Tela do Caixa: botão "Ver movimentos"

- **Onde:** só quando há caixa aberto, junto das ações da tela, como botão `secondary`. Fica **separado** do grupo Sangria / Lançar despesa / Fechar caixa (que são ações sobre o caixa): é navegação, e **Fechar caixa** segue com o maior destaque (RF9 do refactor). Sugestão: link-botão alinhado à direita do título "Caixa" no topo, visível só em tela grande.
- **Tela grande:** `breakpoints.lg` (1024px) em diante, via media query `min-width` como o resto de `Caixa.styles`. Abaixo disso o botão não é renderizado visualmente nem exposto a leitores de tela (`display: none`, não só `opacity`).
- **Estados:** com caixa fechado, carregando, erro ou sem permissão: não aparece. Habilitado sempre que há caixa aberto (não depende do turno).
- **Ação:** navega para `/caixa/movimentos` (link, não modal), para o botão voltar do navegador funcionar.

### 2. Movimentos do caixa (`/caixa/movimentos`)

**Layout (desktop):** `Page` com:
1. `TitleGroup`: título "Movimentos do caixa" (`Text` heading, `h1`) e, abaixo, `Link` "Voltar ao caixa" (`/caixa`), no mesmo lugar e peso do "Voltar aos caixas anteriores" do extrato.
2. `Panel` de resumo (`InfoList`): **Aberto em** (data/hora), **Entradas**, **Saídas e retiradas**, calculados dos movimentos como no extrato. Dá a conferência de relance antes da lista.
3. `MovimentosLista`, com `vazio="Ainda não há movimentos neste caixa."` e `turnos` derivados dos movimentos. Sem botões de CSV/PDF (fora de escopo; o `renderAcoes` fica vazio).

**Ordenação (RF3):** mais recente primeiro. Confirmar na implementação que a lista respeita isso, já que a API devolve nessa ordem hoje, mas a lista não a garante.

**Estados:**
| Estado | Comportamento |
|---|---|
| Carregando | 4 `Skeleton` de 44px, com texto oculto "Carregando movimentos…" (já na lista) |
| Lista com itens | Tabela paginada, resumo no topo |
| Vazio | "Ainda não há movimentos neste caixa." e o resumo zerado |
| Filtro sem resultado | "Nenhum movimento com esses filtros." + "Limpar filtros" |
| Erro | `ErrorBanner` com a mensagem + "Tentar novamente" |
| Sem permissão (403) | `ErroSemPermissao` |
| Sem caixa aberto | Título, aviso "Não há caixa aberto." e `Link` "Ir para o caixa" (acesso direto por URL) |

### Como cada informação do PRD aparece
| Dado da API | Coluna |
|---|---|
| `dataHora` | Data/hora |
| `tipo` + `origem` | Tipo (badge: Entrada, Saída, Sangria) |
| `formaPagamento` | Forma |
| `usuario` (+ `turnoId`) | Usuário, com "Turno de …" embaixo |
| `observacao` | Motivo |
| `valor` | Valor, `+` verde / `−` vermelho |

Atenção: no exemplo da API, uma saída com observação "compra de material de limpeza" vem com `origem: 2`, que o mapper hoje classifica como **Sangria**. Se for despesa e não retirada, o rótulo ficará errado; confirmar com o backend o significado de `origem`.

## Responsividade
- **≥ 1024px:** botão visível; a tela de movimentos usa a tabela.
- **< 1024px:** botão oculto. Se alguém abrir `/caixa/movimentos` direto, a lista já se adapta (cartões empilhados) e a página funciona; não é bloqueada.

## Acessibilidade
- Botão e link com texto visível ("Ver movimentos", "Voltar ao caixa"); foco visível padrão do `Button`.
- `h1` único por tela; o resumo e a contagem de resultados já são anunciados (`role="status"`).
- Entrada/saída/sangria distinguidas por texto e sinal, não só por cor.
