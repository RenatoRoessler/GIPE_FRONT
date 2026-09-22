# Tech Spec: Home Hero

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (via skill claude-design)

## Design
- Telas/estados: uma única tela estática, sem estados de loading/erro (não há dados assíncronos).
- Componentes do design system reaproveitados: `Button` (`src/components/ui/Button`, variant `primary`, size `md`).
- Componentes novos necessários: `HeroSection` (apresentação, fica em `src/components/home/Hero`).
- Tokens de tema usados: `colors.background`, `colors.text`, `colors.textMuted`, `space`, `fontSizes.xl` (título), `fontSizes.md` (subtítulo), `breakpoints.md` (ajuste de padding em mobile).

## Arquitetura da solução
- `src/components/home/Hero/Hero.styles.ts` — `styled.section` (wrapper centralizado), `styled.h1` (título), `styled.p` (subtítulo).
- `src/components/home/Hero/Hero.tsx` — Client Component (usa styled-components) que renderiza título, subtítulo e `<Button>`.
- `src/components/home/Hero/index.ts` — barrel local do componente (export único, ok por ser um único componente).
- `src/app/page.tsx` — substitui o conteúdo padrão do `create-next-app` pelo `<Hero />`.

## Decisões técnicas e trade-offs
- `Hero` é Client Component porque usa styled-components diretamente; como a página não tem dados assíncronos, não há custo real de performance em mover tudo para o client nesta feature pequena.
- Não criar prop de customização de texto agora (título/subtítulo fixos) — YAGNI, já que o PRD não pede reuso do Hero em outro lugar.

## Riscos / pontos de atenção
- Garantir que o `ThemeProvider` (já configurado em `src/lib/registry.tsx`) está ativo para o `Hero` renderizar cores corretamente.

## Fora de escopo técnico
- Roteamento do botão CTA (`href`/`onClick`) — fica como `disabled não`, apenas visual por enquanto, conforme PRD.
