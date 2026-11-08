# Design Spec: Menu organizado em grupos

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue `claude-design` (tokens em `src/styles/theme.ts`, componentes em `src/components/ui`) e o contexto de `PRODUCT.md`. Muda o menu lateral do computador (`SideNav`) e o painel "Mais" do celular (`MenuSheet`); a barra inferior fica como está.

## Direção

Modo **Operate**. O menu é infraestrutura: o usuário quer achar a tela e seguir. Por isso a solução é discreta: um título curto por grupo, em tom apagado, e nada de cor, ícone novo ou cartão. O que muda é a estrutura (três blocos com nome em vez de uma lista de 17), não a aparência dos itens, que ficam exatamente como são hoje (ícone, nome, tela atual marcada).

## Grupos e ordem (do PRD)

| Grupo | Itens, em ordem |
|---|---|
| **Financeiro** | Financeiro (fluxo de caixa), Caixa, Faturas, Notas Fiscais |
| **Configurações** | Minha Empresa, Gestão de Preços, Quadros de Chaves, Mensalistas, Gestão de Usuários, Empresas Conveniadas |
| **Operação** | Dashboard, Pátio, Entrada de Veículos, Saída de Veículos, Conferência de pátio |
| *(sem grupo)* | Carimbar ticket, Pátio da conveniada (só perfis de conveniada) |

Os itens sem grupo aparecem como hoje, sem título, depois dos grupos. Grupo sem nenhum item permitido para o perfil não existe: nem título, nem espaço.

## Menu lateral (computador, a partir de `lg`)

```
Recolhido (72px)            Expandido (240px, ao passar o mouse ou focar)
┌──────┐                    ┌────────────────────────┐
│  ──  │  ← traço curto     │ Financeiro             │
│  ▤   │                    │ ▤  Financeiro          │
│  ▣   │                    │ ▣  Caixa               │
│  ▥   │                    │ ▥  Faturas             │
│  ▦   │                    │ ▦  Notas Fiscais       │
│  ──  │                    │ Configurações          │
│  ⌂   │                    │ ⌂  Minha Empresa       │
│  …   │                    │ …                      │
│ v1.0 │                    │ v1.0.371               │
└──────┘                    └────────────────────────┘
```

- **Linha de título de cada grupo:** altura fixa de `space[4]` (24px) **nos dois estados**, para os itens não mudarem de posição quando o menu expande (nada "pula" sob o mouse).
  - **Recolhido:** a linha mostra um traço horizontal curto (24px de largura, 1px, cor `border`), centralizado sobre a coluna dos ícones. É o separador entre os grupos.
  - **Expandido:** o traço some e aparece o título do grupo, com a mesma transição de opacidade do nome dos itens (a que já existe em `Rotulo`).
- **Título:** `fontSizes.xs`, `fontWeights.bold`, cor `textMuted`, sem caixa alta (a marca não usa), alinhado à esquerda do ícone dos itens (mesmo recuo de 17px).
- **Itens:** inalterados (44px de altura, ícone de 22px, tela atual com fundo `primarySoft` e a marca amarela à esquerda).
- **Espaço entre grupos:** só o da própria linha de título (24px); entre itens do mesmo grupo continua o espaço de hoje.
- **Altura da tela:** com os três títulos, o menu de um Administrador fica mais alto (cerca de 60px a mais). Se não couber, a **lista de grupos rola por dentro** (sem barra de rolagem visível, como o resto do app) e o link da versão continua fixo no pé. Hoje o conteúdo seria cortado.
- **Perfil só com itens sem grupo (conveniada):** sem linha de título nem traço; a lista é a de hoje.
- **Carregando:** como hoje, sem itens enquanto a sessão carrega.

## Painel "Mais" (celular e tablet, abaixo de `lg`)

```
┌ Mais ───────────────────── ✕ ┐
│ Financeiro                    │
│  ▤  Financeiro              › │
│  ─────────────────────────    │
│  ▥  Faturas                 › │
│  ─────────────────────────    │
│  ▦  Notas Fiscais           › │
│                               │
│ Configurações                 │
│  ⌂  Minha Empresa           › │
│  …                            │
│                               │
│ Operação                      │
│  ▣  Dashboard               › │
│  ▤  Conferência de pátio    › │
│        v1.0.371               │
└───────────────────────────────┘
```

- **Só o que não está na barra:** Pátio, Caixa, Entrada e Saída continuam na barra inferior e **não repetem** no painel. Por isso, para um Administrador, o grupo Financeiro mostra Financeiro, Faturas e Notas Fiscais, e a Operação só Dashboard e Conferência de pátio. Um grupo que ficou sem item (por todos estarem na barra) não aparece.
- **Título do grupo:** `fontSizes.sm`, `fontWeights.bold`, cor `textMuted`, com `space[2]` acima e `space[1]` abaixo; o primeiro não tem espaço acima.
- **Entre grupos:** `space[3]` de respiro. A linha divisória fina entre itens (a de hoje) continua só **dentro** do grupo; não há divisória entre grupos, o título já separa.
- **Linhas e alvos de toque:** inalterados (48px, ícone em quadro, seta à direita, tela atual com `primarySoft`).
- **Rolagem e altura:** como hoje (painel de até 82% da tela, rola por dentro). Com os títulos o painel fica um pouco mais alto, sem mudança de comportamento.
- **Tablet (`md` a `lg`):** o painel continua centralizado acima da barra, com a mesma estrutura.
- **Perfil sem grupo (conveniada):** os itens aparecem em lista simples, sem título, como hoje.

## Acessibilidade

- O **título do grupo não é um cabeçalho** (`h2`/`h3`): menus com cabeçalhos poluem a navegação por títulos da página. Cada grupo é uma lista nomeada pelo seu título (`aria-labelledby` na lista); o leitor de tela anuncia "Financeiro, lista, N itens" ao entrar no grupo.
- No menu lateral recolhido, o título continua no DOM (como o nome dos itens), então o leitor de tela o lê mesmo com o texto invisível. O traço separador é decorativo (`aria-hidden`).
- Ordem de tabulação e de leitura: grupo a grupo, na ordem visual.
- Foco visível, alvos e `aria-current="page"` na tela atual: inalterados.
- Contraste do título: `textMuted` sobre `background` (menu lateral) e sobre `surface` (painel), os mesmos pares já usados pelos nomes inativos.

## Componentes

### Reaproveitados
`NavIcon`, `Rotulo`, `ItemLink`, `ItemButton`, `SheetRow`, `IconTile`, `SheetList`, o painel `Sheet` e todo o comportamento de foco, abertura e fechamento atual.

### Novos
- **Cabeçalho de grupo do menu lateral** e **cabeçalho de grupo do painel**: dois pequenos estilos (título e, no lateral, o traço), nos arquivos de estilo de cada menu. Nada novo em `src/components/ui`: são específicos do layout.

## Tokens

Existentes: `colors.textMuted`, `colors.border`, `space`, `fontSizes.xs` e `sm`, `fontWeights.bold`. **Nenhum token novo.**

## Estados

| Situação | Comportamento |
|---|---|
| Administrador | Os três grupos, cada um com todos os seus itens. |
| Perfil com poucos itens (ex.: Caixa) | Só os grupos com item permitido (Financeiro com Caixa; Operação com o resto). |
| Perfil sem itens de grupo (conveniada) | Lista simples, sem títulos. |
| Tela atual | Marcada dentro do seu grupo; o grupo em si não muda. |
| Reduzir movimento | A transição de opacidade do título só ocorre sem `prefers-reduced-motion`. |
| Temas claro e escuro | Só tokens do tema. |

## Pontos para o Tech Spec

- **Fonte única da estrutura:** a pertença de cada item a um grupo e a ordem dos grupos precisam viver no mesmo lugar que a lista de itens do menu (`nav.ts`), para o menu lateral e o painel não divergirem. Cada tela nova passa a ter de declarar o seu grupo.
- **Ordem dos itens muda:** a ordem de hoje (Pátio, Entrada, Saída, Caixa, Conferência, Dashboard, …) deixa de ser a do menu. A barra inferior tem a sua própria ordem e prioridade, que não deve mudar com isso.
- **Rolagem do menu lateral:** definir como a lista rola sem esconder o foco por teclado.
- **Fora da lista do pedido:** "Financeiro" (item) e os dois itens de conveniada estão decididos no PRD como pontos em aberto; a implementação deve deixar fácil mudar o grupo de um item.
