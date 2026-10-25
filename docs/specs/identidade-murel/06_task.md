# Task 06: Componentes base na nova identidade

**Status:** ✅ Concluída  
**Dependências:** Task 01

## Objetivo

> Aplicar os tokens Murel nos componentes de `src/components/ui`, para todas as telas herdarem a identidade por eles.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar (estilos e, se preciso, props):**
- `src/components/ui/Button/*` — `primary`: fundo `primary`, texto `onPrimary`, peso 800, raio `lg`, hover `primaryHover`; `secondary`/ghost: borda 1.5px de controle, texto `text`; foco com `colors.focus`.
- `Input`, `Select`, `Checkbox`, `Switch`, `OptionGroup`, `ColorSwatchGroup` — fundo `surface`, raio `md`, borda de controle, rótulos 12px, foco `focus`.
- `Card`, `InfoCard`, `Modal`, `ConfirmDialog`, `AuthCard`, `Accordion` — fundo `surface`, raio `xl`, sem `glass` nem `glow` (substituir por `surface` + `border`).
- `StatusBadge` — cores de cliente (`cliente.*`) onde o tipo aparece; texto asfalto.
- `PlateDisplay` — manter cores reais de placa; fonte `fontFamilies.mono`.
- `PageBackground` — fundo chapado.
- `Table`, `Tabs`, `Stepper`, `Pagination`, `Toast`, `ErrorBanner`, `Text`, `Link`, `DiscButton` — usar `accent` onde hoje `primary` é texto/linha/ícone; `Text` heading com peso 800 e tracking do tema; `Link` com `link` (sublinhado no tema claro).

## Critérios de Aceite

- [x] Nenhum componente de `ui` usa `colors.primary` como cor de texto, ícone fino ou borda (só preenchimento).
- [x] Nenhum componente de `ui` usa `glass`, `glassBorder` ou `shadows.glow`.
- [x] Nenhum valor visual solto (hex, px de raio/espaço) onde já existe token; exceções (placa, logo) comentadas.
- [x] Foco visível em todos os controles, nos dois temas.
- [x] Texto sobre amarelo e sobre cores de cliente é sempre asfalto, com contraste AA.

## Testes

- [x] Testes existentes dos componentes atualizados e passando.
- [x] `Button`: variantes `primary` e `secondary` aplicam os tokens esperados.
- [x] `StatusBadge`: tipos de cliente usam as cores certas.
- [ ] Revisão visual manual dos componentes nos dois temas (registrar no PR/notas). Pendente: passa para a Task 11 (nenhuma captura de tela foi feita).

## Notas de Implementação

> Design.md seção 5 (componentes base afetados). Siga as skills `styled-components-best-practices` e `claude-design`. Não alterar API pública dos componentes além do necessário.

## Registro da execução

- `Button`: `primary` (amarelo, texto asfalto, peso 800, raio `lg`, foco com `colors.focus`); `secondary` virou só contorno de 1,5px (`borderStrong`) sem preenchimento; `danger` usa o novo token `colors.onDanger` (asfalto no escuro, branco no claro), porque o branco fixo sobre `#FF5A5F` não chegava a 4,5:1.
- Novo token `colors.onDanger` em `theme.ts` (não estava no design.md). Contrastes calculados: escuro 5,86:1, claro 5,61:1. Texto asfalto sobre as cores de cliente: avulso 5,59, mensal 8,03, conveniado 6,44. Borda de controle (`borderStrong`) sobre `surface`/`background`: claro 4,14/3,67; escuro 3,96/4,47 (todas ≥ 3:1).
- `Card` ficou chapado: `surface`, borda `border`, raio `xl`, sombra `sm`; sem vidro, desfoque, brilho nem a moldura em gradiente. `PageBackground` virou fundo `background` sem gradiente.
- `Input`, `Select`, `Checkbox`, `Switch`, `OptionGroup`, `DiscButton`, `CameraButton`: borda de controle em `borderStrong`; borda de foco/seleção em `accent`; erro usa `dangerSoft` no lugar dos `rgba` fixos.
- `Stepper`, `Tabs`, `StageTrack`, `OptionGroup`: o que era `primary` como linha/borda/texto passou a `accent`. As cores `primary` que sobram em `ui` são todas preenchimento (botão, caixa marcada, trilho do Switch, etapa concluída, disco do `DiscButton`).
- Foco: todo `outline` de `ui` agora é 2px em `colors.focus` (antes `primary` ou `warn`, 2 a 3px). `Link` ganhou sublinhado permanente e foco visível.
- `PlateDisplay`: a faixa da placa Mercosul passou a ser o azul real da placa (`#1F4DB3`, texto branco) em vez do `primary`; o número usa JetBrains Mono 600.
- `StatusBadge`: novos tons `avulso`, `mensal` e `conveniado` (cor do tipo de cliente, texto asfalto). Ainda não são usados nas telas; a Task 07 os aplica onde o tipo aparece.
- `Text` (heading) usa `typography.displayWeight` (800). `InfoCard` usa borda `borderStrong`. `Modal` usa raio `xl`.
- Testes novos: `Button.test.tsx` (3) e 3 casos de tipo de cliente em `StatusBadge.test.tsx`. Os 12 arquivos de teste de `src/components/ui` passam (51 testes); `tsc` e ESLint sem erros em `ui` e `styles`.
- Não conferido em navegador: a revisão visual manual dos componentes nos dois temas listada na task. Fica para a Task 11. `Accordion`, `Table`, `Toast`, `ErrorBanner`, `Pagination`, `Skeleton`, `ColorSwatchGroup` e `AuthCard` só herdam os tokens (o foco passou a `focus`); não revisei o desenho deles um a um.
