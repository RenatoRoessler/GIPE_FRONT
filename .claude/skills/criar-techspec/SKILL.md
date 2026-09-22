---
name: criar-techspec
description: Cria o Tech Spec (especificação técnica) de uma feature a partir do PRD e da spec de design existentes. Use depois que o PRD (e, se houver UI, a spec de design) já existirem para essa feature.
---

# Criar Tech Spec

Terceira etapa do fluxo spec-driven:

```
criar-prd → claude-design → criar-techspec → criar-tasks → executar-task
```

## Pré-requisitos
- Deve existir `docs/specs/<slug>/prd.md`.
- Se a feature tem UI, use a skill `claude-design` para definir telas/estados/componentes/tokens antes de escrever o Tech Spec (a seção "Design" do Tech Spec referencia essa decisão, não a redefine).

## Processo
1. Ler o PRD da feature.
2. Definir a solução técnica: componentes/arquivos afetados ou criados (respeitando a estrutura de `src/` deste projeto Next.js + TS + styled-components — ver skill `code-best-practices`), contratos de dados/tipos, e reaproveitamento de componentes de `src/components/ui` do design system.
3. Escrever em `docs/specs/<slug>/techspec.md` usando o template abaixo.
4. Não implementar código nesta etapa — apenas especificar.

## Template (`techspec.md`)
```markdown
# Tech Spec: <Nome da Feature>

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (via skill claude-design)

## Design
- Telas/estados: ...
- Componentes do design system reaproveitados: ...
- Componentes novos necessários (e onde ficam em src/components): ...
- Tokens de tema usados/criados: ...

## Arquitetura da solução
- Arquivos/pastas afetados ou criados (paths reais em src/).
- Tipos/dados envolvidos (src/types se aplicável).
- Server Component vs Client Component para cada peça nova.

## Decisões técnicas e trade-offs
Escolhas relevantes e por quê (ex: por que Client Component aqui, por que não criar abstração X ainda).

## Riscos / pontos de atenção
Riscos técnicos, dependências externas, coisas que podem quebrar.

## Fora de escopo técnico
O que não será resolvido nesta implementação.
```

## Próximo passo
Depois do Tech Spec aprovado, seguir para a skill `criar-tasks` para quebrar em tarefas executáveis.
