# Design Spec: Lembrar Senha no Login

Insumo para o Tech Spec. Baseado em `prd.md` (RF-01 a RF-06). Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto.

## 1. Telas e estados

Única tela afetada: `LoginForm` (dentro de `AuthCard`). Muda só o formulário; o restante do card permanece.

Ordem dos elementos: **CPF → Senha → Checkbox "Lembrar senha" (+ dica) → erro (se houver) → Entrar → rodapé "Esqueci minha senha"**.

```
┌ Entrar ─────────────────────────┐
│ CPF      [ 000.000.000-00     ] │
│ Senha    [ ••••••••           ] │
│ [✓] Lembrar senha               │
│     Não use em computadores     │
│     compartilhados.             │
│ [          Entrar             ] │
│       Esqueci minha senha       │
└─────────────────────────────────┘
```

| Estado | Comportamento visual |
|--------|----------------------|
| Padrão (sem dados salvos) | Campos vazios, checkbox desmarcado, dica visível. |
| Com dados salvos | CPF e senha preenchidos, checkbox marcado. Preencher no primeiro render do cliente (sem "piscada" de vazio → preenchido). |
| Marcado / desmarcado | Caixa preenchida com `colors.primary` e check em `colors.onPrimary` / caixa vazia com borda `colors.border` e fundo `colors.surface`. |
| Foco (teclado) | Anel `outline: 2px solid colors.primary; outline-offset: 2px` (mesmo padrão do `Switch`). |
| Loading (login em andamento) | Checkbox desabilitado, `opacity: 0.5`, `cursor: not-allowed` (igual aos demais campos). |
| Erro de login | Mensagem de erro existente (`Text variant="error"`) permanece; checkbox mantém o estado. Nada é salvo. |
| Armazenamento indisponível (RF-06) | Sem diferença visual: sem mensagem de erro. |

Sem estados de vazio ou sucesso próprios: o sucesso continua sendo o redirecionamento ao dashboard.

## 2. Componentes

**Reaproveitados:** `AuthCard`, `Form`, `Footer`, `Input`, `Button`, `Text`, `Link`, `Toast`.

**Novo, a criar no design system:** `src/components/ui/Checkbox` (`Checkbox.tsx`, `Checkbox.styles.ts`, `index.ts`). Hoje não existe checkbox genérico; o `ChipInput` de `PrecoCategoriasStepFields` é específico de chips e não deve ser reaproveitado. Não deixar o componente solto dentro de `LoginForm`.

API proposta:

```ts
interface CheckboxProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  hint?: string;       // texto de apoio sob o rótulo (usado na dica de segurança)
  disabled?: boolean;
  name?: string;
}
```

Estrutura e acessibilidade:
- `<label>` (`Wrapper`) com `display: inline-flex`, `align-items: flex-start`, `gap: space[2]`, `min-height: 44px` (alvo de toque, igual ao `Switch`).
- `<input type="checkbox">` nativo sobreposto e invisível (`opacity: 0`, posicionado sobre a caixa), como já feito em `ChipInput`: preserva teclado (Espaço), foco e leitura por leitor de tela sem reimplementar o papel. Não usar `role="switch"`.
- Caixa visual (`Box`) 20×20px, `border-radius: radii.sm`, com ícone de check em SVG inline (sem dependência nova).
- `hint` ligado ao input por `aria-describedby`.
- Foco via `input:focus-visible + Box`.

Rótulo exibido na tela: **"Lembrar senha"** (conforme PRD RF-01; o pedido original citava "lembrar Senha").

Dica (`hint`): "Não recomendado em computadores compartilhados." Discreta, para cumprir o requisito de segurança do PRD sem poluir a tela.

## 3. Tokens usados

Todos já existem em `theme.ts`; nenhum token novo.

| Uso | Token |
|-----|-------|
| Espaço entre caixa e texto | `space[2]` (8px) |
| Espaço entre campos do formulário | já dado por `Form` (`space[3]`) |
| Borda caixa desmarcada | `colors.border` |
| Fundo caixa desmarcada | `colors.surface` |
| Caixa marcada | `colors.primary` (fundo e borda) |
| Check | `colors.onPrimary` |
| Foco | `colors.primary` |
| Rótulo | `colors.text`, `fontSizes.sm`, `fontWeights.medium` |
| Dica | `colors.textMuted`, `fontSizes.xs`, `fontWeights.regular` |
| Cantos da caixa | `radii.sm` |

Transição de `0.15s ease` em cor de fundo/borda, igual ao `Switch`. O contraste de `colors.text`/`textMuted` e do anel de foco deve ser conferido nos temas claro e escuro (WCAG 2.2 AA).

## 4. Responsividade

- Layout em coluna única já existente; o checkbox ocupa a largura do formulário e a dica quebra linha naturalmente.
- Mobile (< `breakpoints.sm`, 480px): sem mudança de layout; alvo de toque mínimo de 44px de altura mantido.
- Sem breakpoints novos.

## 5. Decisões e pontos em aberto

- Checkbox **desmarcado por padrão** quando não há dados salvos; **marcado** quando há (PRD RF-03).
- Posição logo abaixo da senha (e acima do botão): fluxo natural de leitura e proximidade com o que ele controla.
- Ícone/identidade: nada além do check; tela de login segue sóbria, coerente com `PRODUCT.md` (dados operacionais sérios). Não se justifica um layout inovador, pois é um ajuste pontual.
- **[A DEFINIR]** (herdado do PRD): texto final da dica, após decisão sobre o nível de proteção do armazenamento.

## 6. Próximo passo

Rodar `criar-techspec` com `prd.md` + este `design.md`.
