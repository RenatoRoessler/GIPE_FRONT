# Design Spec: Redesenho mobile-first do cadastro e da edição de preços

Insumo de UI/UX a partir de `prd.md`. Esta etapa entrega **3 modelos de layout para o usuário escolher um**; só o escolhido segue para o Tech Spec. As telas estão em `layouts.html` (abrir no navegador: celular 360 × 640 e computador; dados fictícios). A consulta de preços (esteira, detalhe, simulador) já foi redesenhada em `../precos-redesign-mobile/` e não muda aqui.

## Contexto e direção

Modo **Operate** numa superfície que já tem mundo visual (tema, componentes e marca do GIPE): os três modelos herdam o tema (`src/styles/theme.ts`) e `src/components/ui`, e variam a **estrutura** da tela e a **navegação**, não os campos. Princípio do produto que guia todos: *entender exatamente que regra de cobrança está ativa e por quê*. Por isso a **placa tarifária** (degraus e diária) e o "antes → depois" ganham destaque em todos.

Estruturas dos três modelos escolhidas por sorteio (`concept-seed`, chave `2d4ce3d5`, deal 4, 2, 3 da minha lista ordenada): o Modelo A lidera a mesa. São estruturas diferentes de verdade, não variações de cor.

### Regras comuns aos três modelos
- **Topo curto (RF11):** uma barra de uma linha (‹ título + estado), sem o título grande, o selo, a frase da etapa e o indicador de etapas empilhados de hoje. O primeiro campo ou o primeiro cartão aparece na primeira tela a 360 × 640.
- **Salvar de qualquer parte na edição (RF4):** barra de ação fixa acima do menu inferior, com **Salvar** sempre à mão, habilitado só com alterações e tabela válida. Com pendência, o toque leva ao primeiro ponto a corrigir e mostra o que falta (premissa do PRD). No cadastro novo a barra mostra o que falta ("Faltam 3: descrição, categoria…") e o botão fica desabilitado até a tabela ficar completa (ou vira **Avançar** no Modelo C).
- **Antes → depois (RF5):** na edição, o valor antigo aparece riscado e o novo em destaque no próprio lugar (linha da seção, cartão ou placa), com um contador "N mudanças" e um toque na barra para a lista completa.
- **Vigência (RF8):** no lugar de dois campos de data e hora completos, duas escolhas rápidas:
  - Início: **Começa hoje** | **Escolher data** (abre o seletor nativo só quando necessário; a hora fica em 00:00 como hoje).
  - Fim: **Sem fim** | **Termina em…** (o seletor só existe quando "Termina em…" está ativo; sem campo vazio visível).
- **Degraus (RF8):** linha compacta de uma linha só (**Horas · Min · Valor**) com o salto para o anterior ao lado do rótulo ("+10") e a lixeira, em vez de três linhas por degrau; modelos prontos como chips acima ("Rotativo 1 h, 2 h, 3 h", "A cada 30 min").
- **Diária e tolerâncias (RF8):** campos com **− / +** (passo de R$ 1,00 para a diária, 5 min para as tolerâncias) além do teclado numérico próprio; a frase de ajuda de cada um continua.
- **Grade de horários (RF9):** mantém os modelos prontos, o resumo em texto e o ajuste fino; passa a ter também uma **faixa rápida**: escolher os dias (chips Seg a Dom) e um **De–Até** para pintar de uma vez, além do toque por célula; vertical (horas nas linhas, 7 dias nas colunas) como já está no celular.
- **Cancelar (RF7):** vira o "‹" do topo (com a confirmação de hoje se houver alterações); sai dos botões empilhados no fim.
- **Alvos de toque** de 44 px (`theme.layout.touchTarget`), foco visível, estado dito em texto (nunca só cor), números tabulares, e a frase de contexto que hoje recebe foco programático passa a ser o título da parte aberta (foco no título, sem contorno extra).

## Os 3 modelos

### A · Página única em seções (a sorteada)
**Ideia:** uma página só, com 4 seções (O básico, Categorias, Quando vale, Quanto cobra). **Só uma fica aberta**; as outras mostram em uma linha o estado (✓, ! ou número) e o resumo ("Padrão · 07/11 → sem fim · Todas"). Tocar numa seção fechada abre ela e fecha a anterior.

- *Cadastro (celular):* barra de topo → seção "O básico" aberta (descrição, tipo de regra em chips com a frase abaixo, vigência) → seções fechadas → barra de ação ("Faltam 3 coisas").
- *Edição (celular):* título da tabela e contador "2 mudanças" → todas as seções **fechadas**, com o "antes → depois" na própria linha e a etiqueta **Alterado** → a placa tarifária compacta ao fim → Salvar fixo.
- *Parte aberta:* a seção "Quanto cobra" com modelos, degraus em linha, diária e tolerâncias com − / +.
- *Computador:* duas colunas: seções à esquerda; à direita resumo e placa fixos; Salvar e Cancelar no topo.
- **Pontos fortes:** é a menor mudança de modelo mental (continua sendo "um formulário em partes"); o estado de tudo aparece numa única tela; funciona igual para criar e editar.
- **Riscos:** abrir e fechar seções muda a altura da página e pode deslocar o que o usuário estava olhando (exige rolagem até a seção aberta); a placa fica no fim e não acompanha a digitação; uma seção "Quanto cobra" aberta ainda é longa.

### B · Painel de cartões
**Ideia:** a tela é o **resumo da tabela**, com a **placa ao vivo** no topo e **um cartão por assunto** (Identificação, Vigência, Categorias, Horários, Degraus, Diária e tolerâncias). Tocar num cartão abre **só aquele editor**, em tela cheia, com **Concluir** que volta ao painel.

- *Cadastro (celular):* placa vazia ("Sua tarifa aparece aqui") → cartões na ordem sugerida, com **Comece** no primeiro e ! nos pendentes, sem obrigar a ordem → Salvar desabilitado ("Faltam 4").
- *Edição (celular):* placa com "antes → depois" → cartões com o resumo; os alterados com borda e **Alterado** → vai direto ao cartão que quer mudar → Salvar fixo.
- *Editor de uma parte:* tela cheia com barra "‹ Horários · Concluir", só os campos daquele assunto e uma barra com o resumo ("Seg–Sex 08:00–18:00").
- *Computador:* lista de cartões e placa em coluna à esquerda; o editor da parte escolhida à direita (mestre e detalhe).
- **Pontos fortes:** o melhor para **editar um valor**: dois toques (cartão → campo) e Salvar; cada editor é curto e foca em uma coisa; a placa e o resumo estão sempre no painel.
- **Riscos:** troca o fluxo por um modelo novo (cartões e editores em vez de etapas), então muda a navegação e os testes; mais telas para manter; no cadastro novo é menos guiado (o usuário escolhe a ordem).

### C · Placa viva fixa
**Ideia:** a **placa tarifária fica fixa no topo**, compacta (degraus e diária em chips), e **muda enquanto o usuário digita**; na edição ela mostra o "antes → depois" nos próprios valores. Embaixo, um controle de **3 abas** (Básico, Horários, Valores) com o estado de cada uma (✓, !, ●).

- *Cadastro (celular):* barra de topo → placa (vazia em "—") → abas → aba **Básico** (descrição, tipo, vigência, categorias) → barra com o que falta e **Avançar** (que leva à próxima aba; na última vira **Salvar**).
- *Edição (celular):* a placa com "antes → depois" (valor antigo riscado, novo em destaque) → abre direto na aba que mudou ou na de Valores → Salvar fixo, de qualquer aba.
- *Aba Valores:* modelos, degraus em linha (cada edição reflete na placa de cima), diária e tolerâncias com − / +.
- *Computador:* placa grande fixa à esquerda (a "placa" de verdade, como na consulta); abas e campos à direita.
- **Pontos fortes:** mantém as **3 partes de hoje** (menos risco e reaproveitamento de validação e testes) e dá resposta imediata ao que se digita; o "antes → depois" é a própria placa, que o gestor já reconhece da consulta.
- **Riscos:** a placa fixa consome cerca de 80 px da altura (compactada, e recolhível por toque); a aba "Valores" ainda é longa com muitos degraus; o conteúdo de cada aba mostra pouco do estado das outras além das marcas.

## Comparação

| | A · Seções | B · Painel de cartões | C · Placa fixa |
|---|---|---|---|
| Topo curto, campo na primeira tela | Sim | Sim (cartões) | Sim, com placa de ~80 px |
| Mudar um valor e salvar | 2 toques + salvar | 2 toques + salvar | 1 toque (aba) + salvar |
| "Antes → depois" | Nas linhas das seções | Na placa e nos cartões | Na própria placa e nos campos |
| Resposta imediata ao digitar | Fraca (placa no fim) | Fraca (volta ao painel) | **Forte (placa fixa)** |
| Guia o cadastro novo | Médio (uma seção por vez) | Menos (ordem livre) | **Mais (Avançar entre abas)** |
| Mudança em relação ao atual | Média | **Alta** | **Baixa** |
| Reaproveita validação, etapas e testes | Em parte | Em parte | **Quase tudo** |
| Custo de implementar | Médio | Alto | **Baixo a médio** |

**Recomendação:** o **Modelo C**. É o que mais ataca o problema (placa e "antes → depois" sempre à vista, salvar de qualquer aba, topo curto) com a menor mudança de estrutura: as 3 etapas de hoje viram 3 abas, e a placa e o resumo já existem. O **Modelo B** é a aposta mais forte se a **edição pontual** for o uso dominante no celular (a decisão sobre o uso por contexto está em aberto no PRD); o **A** é o mais conservador, mas é o que menos muda a experiência de rolagem longa.

## Componentes do design system

### Reaproveitados (todos os modelos)
`Button`, `Input`, `Select`, `Switch`, `Checkbox`, `OptionGroup`, `StatusBadge`, `Tabs` (variante segmentada, já criada), `BottomSheet`, `DockBar` (barra fixa), `ErrorDialog`, `Toast`; da feature: `FaixasPreview`, `PrecoResumoAoVivo` (resumo com diff), `GradeHorarios`, `PrecoFaixasStepFields`, `PrecoCobrancaFields`, `PrecoCategoriasStepFields`, formatadores e validação existentes (`schemas/preco`, `diff.ts`).

### Novos (a confirmar no Tech Spec, conforme o modelo escolhido)
- **Comuns:** `CampoVigencia` (início e fim em chips, com seletor só quando preciso), `StepperValor` (campo com − / +), faixa rápida da grade (dias + De–Até), `BarraDeAcao` (barra fixa de salvar/avançar com resumo do que falta ou do que mudou, sobre `DockBar`).
- **A:** `SecaoRecolhivel` (uma aberta por vez, com estado e resumo na linha fechada).
- **B:** `CartaoParte` e `EditorDeParte` (tela cheia com Concluir; pode reusar a base de `Modal` em tela cheia ou `BottomSheet`).
- **C:** `PlacaFixa` (versão compacta de `FaixasPreview` com o "antes → depois" nos valores e recolhível) e `TabsEtapas` (abas com marcas de estado).

## Tokens usados
Nenhum token de cor ou tipografia novo. Reaproveita `colors.primary`, `accent`, `background`, `surface`, `surfaceMuted`, `border`, `borderStrong`, `text`, `textMuted`, `success`, `warn`, `danger`; `space`, `radii`, `fontSizes`, `fontWeights`; `layout.touchTarget`, `layout.dockHeight`, `layout.bottomNavReserved`. **Possível token novo:** `layout.placaFixaHeight` (altura da placa compacta no Modelo C) e `layout.barraAcaoHeight` (se a barra de ação ficar maior que o dock).

## Estados (todos os modelos)
- *Carregando* (edição): esqueleto na forma da tela (placa, cartões/seções/abas).
- *Erro de carregamento / tabela não encontrada:* mensagens de hoje, com Tentar novamente e link de volta.
- *Pendências:* o que falta aparece na barra de ação e, ao tentar salvar, o foco vai ao primeiro campo com problema (na seção, no cartão ou na aba correspondente).
- *Salvando e erro ao salvar:* botão em "Salvando…"; erro no `ErrorDialog` com Tentar novamente, como hoje.
- *Saída com alterações:* aviso do navegador e confirmação ao cancelar (`‹`), como hoje.
- *Sucesso:* volta à consulta com a tabela atualizada e o `Toast`.

## Responsividade
- **Celular (< 768 px):** composição de cada modelo como descrita, sem rolagem horizontal a partir de 360 px.
- **Tablet (768 a 1023 px):** a mesma estrutura do celular com campos em duas colunas; a barra de ação continua acima do menu inferior.
- **Computador (≥ 1024 px):** A com resumo e placa fixos à direita; B em mestre e detalhe; C com a placa grande à esquerda. O menu lateral substitui o inferior, então a barra de ação vira o topo da tela (Salvar e Cancelar).

## Acessibilidade
- Abas (C) e seções (A) com `aria-selected`/`aria-expanded`, setas, Home e End; cartões (B) como botões com o resumo no nome acessível; editor em tela cheia com foco preso e Esc.
- Estado de cada parte ("completa", "com pendência", "alterada") dito em texto; contagem de mudanças e pendências anunciada de forma discreta (`aria-live="polite"` com atraso).
- Contraste do tema, alvos de 44 px e ordem de leitura igual à visual (a grade vertical segue horas nas linhas).

## Pontos em aberto para a escolha
- Edição pontual ou cadastro novo: qual domina no celular? (decide entre B e C.)
- Salvar de qualquer parte é aceitável? (premissa deste design; se não for, o botão de salvar só aparece na última parte e o resto do modelo continua.)
- A faixa rápida da grade (dias + De–Até) é bem-vinda ou basta o modelo pronto + toque?

## Decisão
**Modelo escolhido: A · Página única em seções** (decisão do usuário em 2026-11-08). Os modelos B e C ficam registrados como alternativas descartadas.
