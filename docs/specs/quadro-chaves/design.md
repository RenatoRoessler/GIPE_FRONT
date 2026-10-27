# Design Spec: Quadro de Chaves

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` e dos dois layouts de referência (`docs/specs/WhatsApp Image 2026-10-27 at 14.35.54.jpeg` = configurar, `...542.jpeg` = escolher gancho). Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. Mobile primeiro (~390px); no desktop o conteúdo fica centralizado em coluna estreita.

## Direção

Modo **Operate**. O quadro na tela é um **espelho do quadro na parede**: a mesma grade de linhas e colunas, para o manobrista bater o olho e achar o gancho sem ler. A decisão é uma só por tela:

- *Configurar*: "quantas linhas e colunas, e quais ganchos não existem?" — a prévia é o próprio controle.
- *Escolher*: "em qual gancho vou pendurar?" — o sugerido já vem marcado; trocar é um toque.

Gestos visuais, contidos:
- **O gancho selecionado é o único elemento em `primary` cheio** na grade; o botão de confirmação repete a posição ("Guardar no gancho A2"), fechando o laço entre o que se viu e o que se faz.
- **Livre = borda tracejada + rótulo "livre"; ocupado = esmaecido com a placa em mono**; estado dito em texto, nunca só em cor ou opacidade.
- **Fora de uso = texto riscado, sem borda**, igual nas duas telas, para o usuário reconhecer o mesmo símbolo ao configurar e ao escolher.

## Telas e estados

### 1. Quadros de chaves (lista) — rota em "Mais › Quadros de chaves"

Cabeçalho com voltar, título **Quadros de chaves** e subtítulo "Mais". Cada quadro é um `Card` com nome, "N ganchos · X livres", e a ação **Inativar** (só Administrador/Gerente) e **Adicionar posições**. Rodapé fixo com **Novo quadro** (`Button` primary, só para quem tem permissão).

Estados:
- *Carregando*: 2 `Skeleton` no formato do card.
- *Vazio*: texto "Nenhum quadro cadastrado. Cadastre o quadro da parede para saber onde cada chave fica." + **Criar primeiro quadro** (quem não tem permissão vê só o texto).
- *Erro de rede*: `ErrorBanner` com **Tentar novamente**.
- *Inativar bloqueado* (chaves no pátio): `ConfirmDialog` informativo listando as placas (`PlateDisplay` pequeno) e só botão **Entendi**.
- *Inativar permitido*: `ConfirmDialog` destrutivo ("Inativar quadro Recepção? O nome fica livre para outro quadro.").

### 2. Configurar quadro (criar / acrescentar posições)

Título **Configurar quadro**, subtítulo "Mais › Quadros de chaves". De cima para baixo (layout 1):

1. **Nome do quadro** (`Input`, máx. 100, contador só perto do limite). Erro inline para vazio ou nome já usado.
2. **Linhas** e **Colunas**: dois `Stepper` numéricos lado a lado (− valor +), cada um com o intervalo resultante em `textMuted` ao lado do valor ("A–E", "1–6"). Limites: 1 a 26 linhas (A–Z) e 1 a 255 colunas; botões − e + desabilitam no limite.
3. **Nome dos ganchos**: `OptionGroup` segmentado com **Letra e número · A1**. A opção "Só número · 1 a 30" fica **oculta** nesta versão (pergunta em aberto no PRD); o controle só aparece quando houver mais de uma opção.
4. **Prévia · N ganchos** + dica "Toque para marcar fora de uso": grade em `surface` com todos os ganchos. Toque alterna normal ⇄ fora de uso (riscado, `textMuted`). N conta só os ganchos em uso.
5. **+ Adicionar outro quadro** (link-botão `accent`): salva o atual e abre um formulário limpo.
6. **Salvar quadro** (`Button` primary, largura total, fixo no rodapé no mobile).

Ao **acrescentar posições** a quadro existente: o nome fica somente leitura, linhas/colunas começam no tamanho atual; ganchos já existentes aparecem na prévia como "já cadastrado" (bloqueados, sem toque) e só os novos são alternáveis.

Estados:
- *Padrão*: valores iniciais **3 linhas × 4 colunas**, para a prévia já parecer um quadro.
- *Salvando*: botão desabilitado "Salvando…", campos desabilitados.
- *Erro de validação do servidor* (nome duplicado, etc.): `ErrorBanner` acima do botão, dados mantidos.
- *Todos fora de uso*: **Salvar** desabilitado com dica "Mantenha ao menos um gancho em uso."
- *Sucesso*: `Toast` "Quadro Recepção salvo" e volta à lista (ou formulário limpo se veio de "Adicionar outro quadro").

### 3. Quadro de chaves (escolher gancho) — etapa final da entrada do veículo

Título **Quadro de chaves**, subtítulo "Escolha onde a chave vai ficar". Vem como etapa do fluxo de entrada (tela cheia no mobile, via `Modal`), depois de registrar a entrada.

1. **Cartão do veículo** (`Card`): `PlateDisplay` à esquerda; modelo · cor e "Valet · vaga C03" (quando existir) à direita.
2. **Seletor de quadro** (`Tabs`/chips): só quando a empresa tem mais de um quadro; o quadro com mais livres vem primeiro e já selecionado.
3. **Sugestão** (`InfoCard` com borda `accent`): letra grande da posição (`typography.display*`) + "Gancho sugerido" + "Primeiro livre, perto da porta. Toque em outro livre para trocar." Atualiza ao trocar o gancho (o título passa a "Gancho escolhido").
4. **Grade do quadro**: cabeçalho de colunas, rótulo de linha à esquerda, ganchos como botões quadrados (alvo de toque ≥ 44px; em quadros largos a grade rola na horizontal com rótulos de linha fixos, nunca encolhe os alvos).
5. **Instrução** em `textMuted`: "Pendure a chave no A2. A posição aparece no card do carro no pátio."
6. **Guardar no gancho A2** (`Button` primary, fixo no rodapé).

Estados do gancho:

| Estado | Visual | Interação |
|---|---|---|
| Livre | Borda tracejada `borderStrong`, rótulo "livre" | Selecionável |
| Selecionado | Preenchimento `primary`, texto `onPrimary`, rótulo "aqui" | Tocar de novo não desmarca |
| Ocupado | Texto `textMuted`, placa em mono (se a API informar); sem borda tracejada | Desabilitado, `aria-disabled` |
| Fora de uso | Texto riscado, sem borda | Não focável; é uma posição que não existe |

Estados da tela:
- *Carregando*: `Skeleton` da grade.
- *Sem quadros*: a etapa **não aparece**; a entrada termina normalmente. Quem tem permissão vê no recibo da entrada um aviso discreto "Cadastre um quadro de chaves" com link.
- *Quadro lotado*: sugestão substituída por aviso "Todos os ganchos deste quadro estão ocupados" e, se houver outro quadro, atalho para ele; **Guardar** desabilitado.
- *Conflito* (outro veículo pegou o gancho): `ErrorBanner` `role="alert"` com "A5 já está com a chave de ABC1D23", grade recarregada, seleção volta para a nova sugestão.
- *Enviando*: botão "Guardando…" e grade desabilitada.
- *Sucesso*: `Toast` "Chave guardada no A2" e fecha a etapa.
- Pergunta em aberto no PRD: se for permitido pular, adicionar link **Escolher depois** abaixo do botão (secundário).

## Componentes do design system

### Reaproveitados
`Modal`, `Button`, `Input`, `Card`, `InfoCard`, `OptionGroup`, `Tabs`, `PlateDisplay`, `ConfirmDialog`, `ErrorBanner`, `Skeleton`, `Toast`, `Text`.

### Novos (em `src/components/ui`, por serem reutilizáveis)
- **`NumberStepper`** (− valor +, com sufixo/intervalo e limites min/max): a base de `Stepper` já existente é de progresso, não serve. Props: `label`, `value`, `min`, `max`, `onChange`, `hint`.
- **`KeyBoardGrid`** (grade de ganchos): recebe linhas, colunas e o estado de cada gancho (`livre | selecionado | ocupado | fora`), com modo `configurar` (alterna fora de uso) e modo `escolher` (seleciona). Um só componente garante o mesmo símbolo nas duas telas. Navegação por teclado em grade (setas), `role="grid"`/`gridcell`.

### De feature
Cartão do quadro na lista, cabeçalho do veículo e o bloco de sugestão.

## Tokens usados

Nenhum token novo. `colors.primary/onPrimary` (selecionado), `accent` (destaque da sugestão e links), `borderStrong` (tracejado do livre), `border`, `surface`, `text`, `textMuted`, `danger`/`dangerSoft` (erro), `success` (toast); `fontFamilies.mono` para placas e rótulos de coordenada; `typography.display*` para a letra grande da sugestão; `space`, `radii.md/lg`, `fontSizes`, `fontWeights`.

## Responsividade

- **Mobile (≤ 480px)**: uma coluna, ações principais fixas no rodapé, respeitando a área segura do aparelho e a `BottomNav` quando for página (no modal da entrada o rodapé é do próprio modal). Gancho com lado mínimo de 44px.
- **`md` (≥ 768px)**: conteúdo centralizado com largura máxima ~480px na tela de configuração; na tela de escolha, a grade cresce até 6–8 colunas sem rolagem e o botão deixa de ser fixo.
- Quadros com muitas colunas: rolagem horizontal da grade, rótulos de linha fixos à esquerda e sugestão sempre visível acima.

## Acessibilidade

- Cada gancho tem nome acessível completo: "A2, livre", "B1, ocupado pela placa GHJ5K22", "B6, fora de uso".
- Troca de gancho anunciada em `aria-live="polite"` ("Gancho A2 selecionado").
- Foco visível em `colors.focus`; foco inicial na grade com o gancho sugerido.
- Contraste do texto esmaecido de gancho ocupado ≥ 4,5:1 (usar `textMuted`, nunca opacidade sobre `text`).
- Respeita `prefers-reduced-motion`: a troca de seleção é instantânea, sem animação de destaque.
