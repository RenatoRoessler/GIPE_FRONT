# Design Spec: Campo Modelo com lista local de veículos

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Afeta o campo **Modelo** do modal Registrar entrada (`EntradaVeiculoModal`) e de cada veículo do cadastro de mensalista (`VeiculoItem`). Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e `PRODUCT.md`.

## Direção

Modo **Operate**: o operador está com pressa, muitas vezes no celular, com a placa já digitada. O campo precisa responder na hora (lista local), mostrar poucas opções legíveis e nunca travar o preenchimento. Sem ousadia visual aqui: o ganho é velocidade e clareza. O único gesto de destaque é o trecho digitado em negrito dentro de cada sugestão, que deixa o casamento óbvio de relance.

Hoje o campo é um `TextField` com `<datalist>` nativo: o visual varia por navegador, não destaca o trecho, não rola bem no celular e não dá controle sobre estados. Passa a ser um combobox próprio, igual nas duas telas, com a lista de sugestões **no fluxo**, logo abaixo do campo (não sobreposta): o `Modal` é um `<dialog>` com `overflow` escondido e corpo rolável, que cortaria um lista.

## Componentes do design system

### Reaproveitados
`Field`, `Label`, `ErrorText` e os estilos do `Input` (borda, foco, erro, desabilitado), `Skeleton`/`Text` quando couber, e `TextField`/`useAppForm` de `components/form` (o combobox entra como um novo campo do formulário, com a mesma etiqueta, erro e `disabled`).

### Novo no design system (`src/components/ui`)
- **`Combobox`** (novo): campo de texto livre com lista de sugestões em lista. Props: `label`, `value`, `onChange(texto)`, `onSelect?(opção)`, `options: { id, label }[]`, `loading?`, `maxLength`, `disabled`, `error`, `placeholder`. Padrão ARIA 1.2 *combobox com lista* (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; lista `role="listbox"`, itens `role="option"`). Reaproveita visualmente o campo `Input` (mesmo `StyledInput`/`Field`/`Label`), para não haver dois estilos de campo de texto.
- **Campo de formulário** `ComboboxField` em `components/form`, ligado ao `useAppForm` como `TextField`.

## Tokens usados

Nenhum token novo.

| Parte | Tokens |
|---|---|
| Campo | os do `Input`: `colors.background`, `borderStrong`, `accent` (foco), `primarySoft` (anel), `danger`/`dangerSoft` (erro), `radii.md`, `fontSizes.md` |
| Lista | `colors.background`, `colors.border`, `radii.md`, `space[1]` de folga e de padding |
| Item | `fontSizes.md`, `space[2]`/`space[3]` de padding; altura mínima 44px (alvo de toque) |
| Item ativo (teclado/hover) | `colors.primarySofter`; item selecionado: `fontWeights.semibold` |
| Trecho casado | `fontWeights.bold`, `colors.text` (restante em `colors.textMuted`) |
| Mensagem vazia | `fontSizes.sm`, `colors.textMuted` |

## Comportamento e estados

1. **Repouso**: campo vazio com a etiqueta "Modelo" e, quando útil, placeholder `Ex.: Civic`. Lista fechada.
2. **Digitando (a partir de 1 caractere)**: a lista abre abaixo do campo, empurrando o que vem depois, com até ~6 itens visíveis (`max-height` 240px) e rolagem interna para o resto. Filtro sem acento e sem diferenciar caixa; prioridade: começa com o texto, depois contém. Máximo de itens renderizados limitado (ex.: 50) para manter a rolagem leve.
3. **Foco sem texto**: não abre a lista inteira (seria longa demais); abre ao digitar ou pela seta para baixo (nesse caso mostra os primeiros itens).
4. **Navegação**: ↓/↑ movem o item ativo (com rolagem para mantê-lo visível), Enter escolhe, Esc fecha sem alterar o texto, Tab fecha e segue. Toque/clique em um item escolhe e fecha. Escolher preenche o campo e dispara o comportamento atual de preenchimento associado (`onSelect`).
5. **Texto livre**: sem item ativo, Enter apenas mantém o texto digitado (e, na entrada, submete como hoje). Quando nada casa, o lista mostra uma linha discreta "Nenhum modelo encontrado — vamos usar o que você digitou." (`textMuted`), sem tom de erro, e some ao apagar.
6. **Carregando a lista** (ainda não chegou): o campo é totalmente digitável; o lista, se aberto, mostra uma linha "Carregando modelos…" com `Skeleton`. Nenhum spinner no campo.
7. **Falha ao carregar**: sem banner nem erro no campo. Comportamento de texto livre silencioso (a nova tentativa é do Tech Spec).
8. **Erro de validação do formulário**: igual ao `TextField` (borda e fundo `danger`, `ErrorText` abaixo).
9. **Desabilitado** (`isSending`): igual ao `Input` desabilitado; lista não abre.

## Responsividade

- **Celular (< `breakpoints.md`)**: lista com a largura do campo, abaixo dele, rolando por dentro; como está no fluxo, o corpo rolável do modal acompanha o teclado virtual. Itens de 44px. `autoComplete="off"` e `enterKeyHint` apropriado para não competir com o autopreenchimento do navegador.
- **Dentro de modal**: por estar no fluxo, a lista não é cortada pelo `overflow` do corpo do modal; `overscroll-behavior: contain` evita rolagem dupla.
- **Telas grandes**: mesma largura do campo; hover destaca o item como o item ativo.

## Acessibilidade

- Foco visível no campo (anel do `Input`); item ativo anunciado por `aria-activedescendant`.
- Contagem de resultados em região `aria-live="polite"` ("12 modelos encontrados" / "Nenhum modelo encontrado").
- Contraste do trecho casado e do item ativo conforme os tokens, nos temas claro e escuro.
- Estado nunca só por cor: item ativo tem fundo e o selecionado tem peso de fonte.

## Aplicação nas telas

- **Entrada de veículo (tela A)**: o Modelo continua na posição atual (logo abaixo da placa, antes da cor). Troca `TextField + <datalist>` por `ComboboxField`; o preenchimento automático via `onSelect` e o cadastro por placa seguem como hoje.
- **Cadastro de mensalista (`VeiculoItem`)**: o Modelo de cada veículo troca `TextField` por `ComboboxField`, sem mudar a ordem nem o layout em grade do item. Cada veículo tem seu lista independente (só um aberto por vez).
