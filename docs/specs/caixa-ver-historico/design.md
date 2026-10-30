# Design Spec: Ver histórico do caixa

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Caminho curto: o botão leva a uma tela que já existe (`/caixa/historico`, `HistoricoCaixasPage`) e não muda. A decisão visual é só onde o botão entra na tela do Caixa, ao lado do "Ver movimentos" que acabou de entrar.

## Direção

Modo **Operate**. Os dois acessos ("Ver movimentos" e "Ver Histórico") são navegação para conferência, não ações sobre o caixa. Ficam juntos, no topo, em uma faixa própria, separados do grupo Sangria / Lançar despesa / Fechar caixa, que continua com **Fechar caixa** em destaque.

## Decisão que fecha a pendência do PRD (RF6)

Proposta, até confirmação:
- **Caixa aberto:** o botão **Ver Histórico** aparece ao lado de "Ver movimentos".
- **Caixa fechado:** em tela grande, "Ver Histórico" **substitui** o link "Caixas anteriores" (mesmo destino, mesma permissão; dois acessos para a mesma tela só confundem). Em tela pequena o link "Caixas anteriores" continua como hoje: o PRD limita o botão a tela grande e tirar o link do celular seria uma regressão.

## Componentes do design system

### Reaproveitados
- `Link` (`src/components/ui/Link`), com o visual de botão secundário já criado para "Ver movimentos" (`VerMovimentos` em `CaixaResumo.styles.ts`: contorno `borderStrong`, `radii.lg`, `primarySoft` no hover, `display: none` abaixo de `breakpoints.lg`).
- `Button` secundário como referência visual.
- `useCan(AREA.CaixaHistorico)` para a visibilidade (já usado em `CaixaFechado`).

### Novos
- Nenhum componente em `src/components/ui`.
- Generalizar o styled `VerMovimentos` para um nome neutro (ex.: `AcessoRapido`), reaproveitado pelos dois botões, em vez de duplicar o CSS.
- **Faixa de acessos** (container flex alinhado à direita, com `gap: space[2]`) que agrupa os links no topo da tela com caixa aberto.

### Tokens
Nenhum novo: `space`, `colors.borderStrong`, `colors.primarySoft`, `colors.text`, `radii.lg`, `fontSizes.md`, `fontWeights.extrabold`, `breakpoints.lg`.

## Telas e estados

### 1. Tela do Caixa, caixa aberto
- Faixa de acessos no topo, acima de `AberturaCaixa`, alinhada à direita, com a ordem **Ver Histórico**, **Ver movimentos** (do mais amplo para o mais específico do caixa atual; a ordem pode ser invertida sem impacto).
- "Ver Histórico" só aparece para quem tem `AREA.CaixaHistorico` (Administrador e Gerente por padrão). "Ver movimentos" continua para todos que acessam o Caixa. Para Caixa e Manobrista a faixa mostra só "Ver movimentos".
- Se nenhum dos dois links for visível (celular), a faixa não ocupa espaço (sem margem ou altura reservada).
- Destino: `/caixa/historico`, como link de navegação (botão voltar do navegador funciona).

### 2. Tela do Caixa, caixa fechado
- ≥ `breakpoints.lg`: botão **Ver Histórico** no lugar do link "Caixas anteriores", abaixo de "Abrir caixa" no painel, com o mesmo visual de botão secundário.
- < `breakpoints.lg`: o link "Caixas anteriores" segue como hoje.
- Visibilidade pela mesma permissão.

### 3. Carregando, erro e sem permissão
- Carregando e erro do caixa: nenhum dos acessos aparece (como hoje).
- Sem permissão no Caixa: `ErroSemPermissao`, sem acessos.

### 4. Tela de histórico
Sem alteração: lista paginada do mais recente para o mais antigo, com quem abriu, quem fechou, totais do fechamento e filtro por período (RF3 a RF5 já atendidos). O "Voltar" dela e o extrato de cada caixa permanecem.

## Responsividade
- ≥ 1024px: botões visíveis.
- < 1024px: botão oculto com `display: none` (sai da árvore de acessibilidade); o link "Caixas anteriores" do caixa fechado continua visível.
- A rota `/caixa/historico` continua acessível por URL em qualquer largura.

## Acessibilidade
- Texto visível nos botões ("Ver Histórico", "Ver movimentos"); foco visível herdado de `Link`.
- A faixa é navegação: se os dois links ficarem em um `nav`, dar `aria-label="Acessos do caixa"`; caso contrário, apenas links soltos.
- O rótulo do botão é "Ver Histórico", com H maiúsculo, como pedido (diferente de "Ver movimentos" em minúsculas; manter o texto exato).
