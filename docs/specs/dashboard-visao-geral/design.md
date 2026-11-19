# Design Spec: Dashboard — Visão Geral do Administrador

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. A composição é fixa: segue **exatamente** `referencia-layout.html` (nesta pasta) em estrutura, ordem dos blocos, hierarquia e textos. Esta spec traduz a referência para o design system do GIPE (`src/styles/theme.ts` + `src/components/ui`) e fecha o que a referência não resolve: tokens, componentes, estados, acessibilidade e o comportamento em web e mobile.

## Direção

Modo **Monitor** (`impeccable`): o Administrador abre a tela para *saber como está o negócio*, muitas vezes de passagem, no celular. A tela responde em três níveis de leitura, de cima para baixo:

1. **Quanto entrou e como está vs. antes** — um número domina (faturamento), com a variação logo abaixo.
2. **O que está acontecendo agora** — pátio e pendências, só quando o período é o atual.
3. **Por quê** — distribuição por dia, origem, forma de recebimento, categoria e hora.

Princípios:
- **Número sempre em texto.** Barras reforçam, nunca substituem. Variação tem seta e palavra além da cor (▲ / ▼ + "vs. quinta passada").
- **Ausência é honesta.** Dado não aplicável some, ou vira "—" com uma frase do porquê. Nunca 0 ou "▼ 100%" inventado.
- **Cor com função.** `success` alta, `danger` queda e pendência crítica, `caution` atenção, `info` informativo; `primary` só seleção, destaque de pico e lava-rápido. Origem e forma de pagamento usam as cores da marca que o sistema já usa para essas coisas (`cliente.*`, `pagamento.*`), para o Administrador reconhecer as mesmas cores do Caixa e do Pátio.
- **O shell é do GIPE.** Logo, botão de tema, avatar e a barra inferior da referência **não** são recriados: vêm do `AppShell` (Header, SideNav, BottomNav) já existentes. A tela começa no bloco "Bom dia, …". A nota "Proposta visual · dados fictícios" não vai para o produto.

## Adaptações da referência ao design system

| Referência | GIPE |
| --- | --- |
| Fonte Outfit | `fontFamilies.sans` (Plus Jakarta) do tema |
| `--yellow` como texto (número grande, "Voltar para hoje") | `colors.accent` (amarelo no escuro, asfalto no claro). `primary` só como preenchimento |
| `--yellow` como preenchimento (seletor ativo, barra de ocupação, pico, categorias) | `colors.primary` / `onPrimary` |
| `--card`, `--card-2`, `--line` | `surface`, `surfaceMuted`, `border` |
| `--muted`, `--text`, `--bg` | `textMuted`, `text`, `background` |
| `--green`, `--red` | `success`, `danger` |
| `--orange`, `--blue` (severidade dos alertas) | **novos** `caution`, `info` (ver Tokens) |
| Fundos 14–16% (`color-mix`) | `successSoft` (**novo**), `dangerSoft`, `cautionSoft` (**novo**), `infoSoft` (**novo**), `primarySoft` |
| Cores de origem amarelo/azul/teal/laranja | Avulso `cliente.avulso`, Mensalista `cliente.mensal`, Convênio `cliente.conveniado`, Lava-rápido `primary` |
| Cores de recebimento | `pagamento.pix`, `dinheiro`, `debito`, `credito`; forma sem cor própria usa `steel` |
| Tema claro/escuro próprio | `lightTheme` / `darkTheme` do GIPE |

## Tokens

### Usados
- **Cores**: listadas na tabela acima, mais `focus` (anel de foco e barra selecionada), `borderStrong` (borda das setas).
- **Espaço**: `space[2]` (8) entre itens de linha e dentro de listas, `space[3]` (16) padding dos painéis e gap da grade, `space[4]` (24) entre o cabeçalho da tela e os blocos.
- **Tipografia** (peso/tamanho):
  - Rótulo de painel ("FATURAMENTO HOJE"): `xs`, `semibold`, caixa alta, `letter-spacing: 0.06em`, `textMuted`.
  - Título "Bom dia, Everton": `typography.display*` com `xl` no desktop e `lg` abaixo de `sm`.
  - Faturamento do período: `xxl`, `bold`, `accent`, `displayTracking`. Com centavos.
  - Ocupação do pátio e valores dos indicadores: `xl`, `bold`.
  - Valores secundários (projeção, média, melhor dia): `lg`, `bold`.
  - Linhas de lista e detalhes: `sm`; legendas, eixos e subtextos: `xs`.
  - Todos os números com `font-variant-numeric: tabular-nums`, para não pularem ao trocar de período.
- **Raios**: `xl` nos painéis (igual à referência), `lg` no ícone das pendências e no detalhe da hora, `full` em pílulas (variação, "Fechado", seletor, setas, trilhos de barra), `sm` nas colunas dos gráficos.
- **Layout**: `contentMaxWidth`, `touchTarget` (setas e barras tocáveis no celular), `bottomNavReserved` (folga no fim da tela no celular).

### Novos (adicionar a `ThemeColors`, claro e escuro)
| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `successSoft` | `rgba(23, 121, 90, 0.12)` | `rgba(60, 203, 127, 0.14)` | Fundo da pílula de alta |
| `caution` | `#B35A12` | `#FFA53D` | Ícone e contagem de pendência de atenção (vencendo, veículos parados) |
| `cautionSoft` | `rgba(179, 90, 18, 0.12)` | `rgba(255, 165, 61, 0.16)` | Fundo do ícone de atenção |
| `info` | `#2F63E0` | `#5B8CFF` | Ícone e contagem de pendência informativa (faturas de conveniada) |
| `infoSoft` | `rgba(47, 99, 224, 0.12)` | `rgba(91, 140, 255, 0.16)` | Fundo do ícone informativo |

`warn` não serve para "atenção" aqui: no tema escuro é o mesmo amarelo de `primary`, e a referência separa atenção (laranja) de destaque (amarelo). O Tech Spec confere o contraste dos valores acima: 3:1 para ícone e contagem (texto grande e negrito) e 4,5:1 onde houver texto comum.

## Componentes do design system

### Reaproveitados (`src/components/ui`)
- **Tabs** `variant="segmentada"`: seletor Dia / Semana / Mês (tablist com teclado já resolvido).
- **ProgressBar**: ocupação do pátio.
- **StatusBadge** `tone="neutral"`: marca "Fechado" ao lado do rótulo do faturamento.
- **Skeleton**: carregamento.
- **InlineNotice** (ou **ErrorBanner**): erro da consulta com ação "Tentar de novo".
- **Text**, **Link** (pendências e "Voltar para hoje" como ação de texto).
- **Gráficos do pátio** (`src/components/patio/graficos`): o padrão de colunas de `ChegadasPorHora` é a base do gráfico por hora. O Tech Spec decide entre generalizar (promover para `ui`) ou criar irmão em `dashboard`.

### Novos (domínio, em `src/components/dashboard`)
- **CabecalhoDashboard**: saudação, data/atualização, seletor de período, navegação ‹ rótulo › e "Voltar para hoje".
- **PainelDashboard**: superfície dos blocos (`surface`, borda `border`, raio `xl`, padding `space[3]`) com rótulo em caixa alta. O `Card` de `ui` não serve (limita a largura a 480px e é pensado para formulários).
- **CardFaturamento**: número do período, variação, divisor e a linha de dois indicadores do mês (mês até agora / média por dia / projeção / fechamento / melhor dia, conforme o caso). Também o estado de boas-vindas.
- **CardPatioAgora**: ocupação, pílula "% ocupado", barra, carros/motos, avulsos/mensalistas.
- **IndicadoresPeriodo**: os três indicadores (Saídas, Ticket médio, Permanência).
- **ListaPendencias**: as linhas de "Precisa da sua atenção" e o "Tudo em dia".
- **GraficoFaturamentoDiario**: colunas empilhadas por origem, legenda, eixo e detalhe do dia.
- **Distribuicao**: barra empilhada + linhas (valor e %). Usado em "De onde vem o dinheiro" e "Como você recebe".
- **PorCategoria**: linhas com trilho proporcional e rodapé de totais.
- **MovimentoPorHora**: colunas por hora, detalhe da hora selecionada, maior/menor movimento.
- **Variacao** (pílula ▲/▼): usada no faturamento e, em texto sem fundo, na linha do mês. Se outra tela precisar, sobe para `ui`.

### Ações removidas da tela antiga
- **Gerar cartaz**: já existe em Minha Empresa. Nada a fazer.
- **Instalar app**: já existe no Header (ícone). Nada a fazer.
- **Registrar entrada/saída**: já estão na barra inferior e no Pátio. Nada a fazer.
- **Repetir tour**: só existia na Visão Geral. Proposta: levar ao menu do usuário (Header) para todos os perfis. Decisão final no Tech Spec.

## Tela e composição

Ordem dos blocos, idêntica à referência:

```
┌ Cabeçalho ──────────────────────────────────────────────────────────┐
│ Bom dia, Everton                         [ Dia | Semana | Mês ]      │
│ Quinta, 19 de novembro · atualizado às 15:45   ‹  Hoje · 19 nov  ›   │
│                                                   Voltar para hoje   │
├ Hero (1.4fr | 1fr) ─────────────────────────────────────────────────┤
│ FATURAMENTO HOJE                  │ PÁTIO AGORA                      │
│ R$ 0,00                           │ 17 de 110 vagas                  │
│ ▼ 100% vs. quinta passada         │ 15% ocupado  ▬▬▬▭▭▭▭▭▭▭          │
│ ───────────────────────────────   │ Carros 17/70        Motos 0/40   │
│ Mês até agora  │ Projeção do mês  │ 17 avulsos       0 mensalistas   │
├ Indicadores (3 colunas) ────────────────────────────────────────────┤
│ SAÍDAS  —        │ TICKET MÉDIO  —        │ PERMANÊNCIA  —           │
├ Dois (1.5fr | 1fr) ─────────────────────────────────────────────────┤
│ FATURAMENTO · 30 DIAS ATÉ HOJE  legenda│ PRECISA DA SUA ATENÇÃO      │
│ ▁▃▅█▂ … (colunas empilhadas)           │ ● Mensalistas inadimplentes 1›│
│ 21 out        5 nov          Hoje      │ ● Veículos há mais de 3 d. 15›│
├ Três (2 colunas) ───────────────────────────────────────────────────┤
│ DE ONDE VEM O DINHEIRO                 │ COMO VOCÊ RECEBE            │
│ POR CATEGORIA · SAÍDAS DO DIA          │ VEÍCULOS NO PÁTIO POR HORA  │
└─────────────────────────────────────────────────────────────────────┘
```

### Cabeçalho
- Saudação por horário: "Bom dia" (5h–11h59), "Boa tarde" (12h–17h59), "Boa noite" (18h–4h59), com o **primeiro nome** do usuário. Sem nome, só a saudação.
- Subtítulo: dia da semana e data por extenso + "atualizado às HH:mm" (horário de `dataReferencia`).
- Controles alinhados à direita: seletor (Tabs segmentada), abaixo a navegação ‹ rótulo ›, abaixo "Voltar para hoje" (só fora do período atual, em `accent`, `sm`, `medium`).
- Setas: círculo com borda `borderStrong`, fundo `surface`, ícone de chevron (não o caractere "‹"). Desabilitada: opacidade reduzida, `aria-disabled`, sem foco por clique. `aria-label` "Período anterior" / "Próximo período".
- Rótulo do período: `sm`/`md`, `semibold`, centralizado, `aria-live="polite"` (anuncia o novo período ao navegar). Formatos da referência: "Hoje · 19 nov", "Ontem · 18 nov", "Qua · 11 nov", "Esta semana · 16 – 22 nov", "9 – 15 nov", "26 out – 1 nov", "Outubro 2026". Ano só quando diferente do atual.

### Card de faturamento (hero, esquerda)
- Rótulo: "Faturamento hoje" | "Faturamento de qua, 18 nov" | "Faturamento da semana" | "Faturamento do mês" | "Outubro fechou em", seguido do `StatusBadge` "Fechado" quando `periodo.fechado`.
- Número: `xxl`, `accent`, com centavos.
- Variação: pílula `Variacao` com `successSoft`/`success` (▲) ou `dangerSoft`/`danger` (▼), texto `xs` `semibold`, ex.: "▼ 100% vs. quinta passada". Sem `comparacao` ou sem `variacaoPercentual`, a pílula não aparece.
- Divisor (`border`) e duas colunas de indicadores do mês (rótulo `xs` muted, valor `lg` bold, subtexto `xs` muted; subtexto de variação em `success`/`danger` com seta):
  - Dia/Semana, mês em andamento: **Mês até agora** (+ "▲ 12% vs. out até dia 19" ou "desde 7 nov") | **Projeção do mês** (+ "outubro fechou R$ X" ou "estimativa com base em N dias").
  - Mês em andamento: **Média por dia** ("em 13 dias de uso no mês") | **Projeção do mês**.
  - Projeção indisponível: valor vira "Disponível com 5 dias de uso" (`sm`, `medium`, muted) e subtexto "faltam N dias de uso".
  - Mês fechado: **Média por dia** ("N dias com movimento") | **Melhor dia** ("sex, 14 nov").
  - Dia/Semana em mês fechado: **Outubro fechou em** (+ variação vs. mês anterior) | **Média por dia** ("no mês de outubro").
- **Boas-vindas** (empresa nova): ícone de gráfico em quadrado `primarySoft`/`accent` (raio `lg`), título "Seu faturamento aparece aqui" (`lg`, `semibold`), texto "Assim que a primeira saída for registrada, você acompanha o dia, o mês e a projeção de fechamento." (`sm`, muted, máx. ~42ch).

### Pátio agora (hero, direita) — só no período em andamento
- "17 de 110 vagas" (número `xl` bold; "de 110 vagas" `lg` muted medium), pílula "15% ocupado" (`primarySoft` + `accent`), `ProgressBar`, duas linhas `xs` muted: "Carros 17/70 · Motos 0/40" e "17 avulsos · 0 mensalistas" (a segunda some quando a empresa não tem mensalistas, como na referência).
- Fora do período atual o card some e o faturamento ocupa a linha inteira.

### Indicadores do período
- Três painéis iguais: rótulo, valor `xl` bold, subtexto `xs` muted.
  - Saídas: "veículos atendidos" | Ticket médio: "por saída paga" | Permanência: "média das saídas", formato "1h 52min" (só minutos abaixo de 1h; "2d 3h" acima de 24h).
- Sem dado: valor "—" em `textMuted` e subtexto "sem saídas no período" / "sem saídas pagas".

### Faturamento por dia
- Cabeçalho com rótulo à esquerda e legenda à direita (quadrado de 9px no raio `sm` + nome), só origens com valor no recorte.
- Colunas empilhadas (de baixo para cima: Avulso, Mensalista, Convênio, Lava-rápido), altura proporcional ao maior dia, gap de 4px (2px no celular), raio `sm`.
- Destaque: no Dia, a coluna do dia escolhido tem contorno `focus` e as outras ficam com opacidade reduzida; na Semana, os dias da semana ficam cheios e o resto reduzido; no Mês em andamento, só hoje tem contorno; mês fechado sem destaque.
- Dia antes do início do uso: coluna inteira com borda tracejada `border`, sem preenchimento. Dia futuro: espaço vazio.
- Eixo `xs` muted com três marcas: primeiro dia, dia do meio, último ("Hoje" quando for hoje).
- Detalhe: passar o mouse, focar ou tocar uma coluna mostra acima do gráfico uma linha "qua, 18 nov · R$ 100,00" com o valor de cada origem. Toque fora ou Esc fecha. O gráfico inteiro tem `role="img"` com resumo ("Faturamento dos últimos 30 dias: total R$ X, melhor dia Y") e as colunas também são navegáveis por teclado (setas ←/→).
- Altura: 170px no desktop, 130px abaixo de `sm` (valores de layout do componente; se outra tela precisar, viram tokens).
- Vazio: "O gráfico começa a aparecer a partir do primeiro dia com saídas registradas."

### Precisa da sua atenção — só no período em andamento
- Linhas separadas por `border`, cada uma é um link para a tela da pendência: ícone 36px em quadrado de raio `lg` (fundo `*Soft`, ícone na cor), título `sm`/`md` medium, resumo `xs` muted, contagem `lg` bold na cor da severidade, chevron muted.
- Ordem fixa por severidade, igual à referência:

| Pendência | Severidade | Resumo | Destino (confirmar no Tech Spec) |
| --- | --- | --- | --- |
| Mensalistas inadimplentes | `danger` | "R$ 250 em atraso" | Mensalistas (filtro inadimplentes) |
| Caixa fechado com diferença | `danger` | "Turno de ontem · −R$ 35,00" (ou resumo do total nos 7 dias) | Histórico do caixa |
| Veículos há mais de 3 dias | `caution` | "Mais antigo: LMA8376 · 11d 0h" | Pátio (ticket do mais antigo) |
| Mensalidades vencem em 5 dias | `caution` | "R$ 2.310 a receber" | Mensalistas |
| Faturas de conveniadas abertas | `info` | "R$ 1,50 a receber" | Faturas |

- Sem nenhuma: uma linha com ícone de check em `successSoft`/`success`, "Tudo em dia" / "Nenhuma pendência no momento", sem link.
- Fora do período atual o card some e o gráfico ocupa a linha inteira.

### De onde vem o dinheiro / Como você recebe
- Rótulo + " · outubro" quando o mês de referência não é o atual.
- Barra empilhada de 12px, raio `full`, segmentos com 2px de espaço entre si; abaixo, linhas com marcador de cor, nome, valor `semibold` e % `xs` muted.
- Nomes: Avulso, Mensalistas, Convênios, Lava-rápido; recebimento usa a `descricao` da API.
- Vazio: "Aparece quando houver faturamento no período." / "Aparece quando houver recebimentos no período."

### Por categoria
- Rótulo "Por categoria · saídas do dia | da semana | do mês".
- Linhas em grade `nome | trilho | quantidade + valor`: trilho `surfaceMuted` com preenchimento `primary` proporcional à maior quantidade; quantidade `semibold`, valor `xs` muted. Rodapé com divisor: "N saídas" | "R$ X em estacionamento avulso".
- Vazio: "Aparece quando houver saídas no período."

### Veículos no pátio por hora
- Rótulo "Veículos no pátio por hora · hoje | qua, 18 nov | média da semana | média do mês".
- 24 colunas (0h–23h): valor `xs` semibold acima de cada coluna, coluna `surfaceMuted` com borda `border`; as três horas do maior movimento em `primary`. Hora que ainda não chegou: coluna tracejada vazia.
- Seleção: cada coluna é um botão (`aria-pressed`); a selecionada tem contorno `text` e o valor em `text`. Padrão: a hora atual hoje; senão a hora após o início do pico.
- Detalhe abaixo (`surfaceMuted`, raio `lg`): "10h – 11h" (`md` semibold) / "17 veículos no pátio · 15% das vagas" / "3 entradas nessa hora"; na média, "em média".
- Eixo: 0h, 6h, 12h, 18h, 23h. Linhas "Maior movimento 11h – 14h · 30 veículos" e "Menor movimento …".
- **Agrupar de 2 em 2 horas** abaixo de `sm`, ou abaixo de `lg` quando os valores tiverem 3 dígitos (os rótulos não cabem). O detalhe passa a mostrar "10h – 12h".
- Vazios: "Aparece a partir do primeiro dia com veículos no pátio." e, em Semana/Mês com menos de 7 dias de uso, "As médias por hora aparecem depois de 7 dias de uso. No seletor Dia você já vê cada dia."

## Estados

| Estado | Comportamento |
| --- | --- |
| Carregando (primeira vez) | Esqueleto com a mesma grade: cabeçalho real (saudação e seletor já utilizáveis), `Skeleton` no lugar de cada painel, com a altura aproximada do conteúdo. Sem spinner de tela cheia. |
| Trocando de período | Mantém o conteúdo anterior com opacidade reduzida e `aria-busy` até chegar o novo; os controles continuam ativos (a última escolha vence). Sem salto de layout. |
| Erro | `InlineNotice` no topo dos blocos: "Não foi possível carregar a visão geral." + "Tentar de novo". Se havia dados, eles continuam visíveis abaixo. |
| Sem permissão (403) | Comportamento padrão de área sem permissão do sistema. |
| Empresa nova | Boas-vindas no faturamento, setas desabilitadas, indicadores "—", vazios de uma frase nos demais, pendências "Tudo em dia" (ou as que existirem). |
| Período fechado | Sem Pátio e sem Pendências; hero e linha do gráfico em uma coluna; "Fechado" no rótulo. |
| Valores nulos | Bloco, linha ou pílula some; indicador vira "—". Nunca "R$ 0" ou "0%" no lugar de nulo. |

## Responsividade

Breakpoints do tema (`sm` 480, `md` 768, `lg` 1024). A referência quebra em 820/520; usar `md`/`sm`.

- **≥ `md`**: como o diagrama. Hero 1.4fr/1fr, indicadores em 3 colunas, gráfico+pendências 1.5fr/1fr, quatro painéis inferiores em 2×2. Largura máxima `contentMaxWidth`.
- **< `md`**: uma coluna. Ordem: cabeçalho, faturamento, pátio, indicadores, **Precisa da sua atenção** (sobe para antes do gráfico, como na referência), gráfico de faturamento, origem, recebimento, categoria, por hora.
- **< `sm`**:
  - Controles ocupam a largura toda: seletor com os três botões dividindo o espaço; navegação com setas nas pontas e rótulo no meio.
  - Setas e colunas tocáveis com `touchTarget` (44px) de área de toque, mesmo que o desenho seja menor.
  - Indicadores em 2 colunas, Permanência ocupando a linha inteira.
  - Faturamento um degrau menor; título da saudação `lg`.
  - Gráfico diário com 130px de altura e gap de 2px; por hora agrupado em 2h.
  - Folga no fim de `bottomNavReserved` para a barra inferior não cobrir o último painel.
- Sem rolagem horizontal em nenhuma largura (rótulos longos quebram ou cortam com reticências; valores nunca são cortados).

## Acessibilidade
- Contraste: textos 4,5:1, números grandes e ícones 3:1, nos dois temas (conferir `caution` e `info` novos e os textos `xs` muted).
- Cor nunca sozinha: variação com seta e texto; severidade com ícone diferente por tipo; gráficos com resumo textual (`role="img"` + `aria-label`) e valores no detalhe.
- Foco visível (`focus`) em setas, seletor, colunas, pendências e "Voltar para hoje"; ordem de tabulação igual à visual (no celular, pendências antes do gráfico).
- `prefers-reduced-motion`: sem transição de altura nas colunas nem fade entre períodos.

## Fora desta spec
Contrato da API, cache, como o período vai para a URL, guarda de rota e menu por perfil, e onde fica "Repetir tour": tudo isso é do Tech Spec.
