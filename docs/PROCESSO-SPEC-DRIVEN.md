# Processo Spec-Driven do projeto GIPE

Este projeto usa um fluxo em 5 etapas, cada uma com sua própria skill do Claude Code, para ir de uma ideia até código implementado de forma rastreável.

```
criar-prd  →  claude-design  →  criar-techspec  →  criar-tasks  →  executar-task
 (o quê)        (como parece)      (como implementar)   (passos)      (código)
```

Cada feature gera uma pasta em `docs/specs/<slug-da-feature>/` com três arquivos:
- `prd.md`
- `techspec.md`
- `tasks.md`

## Como pedir cada etapa

Você não precisa saber o nome técnico da skill — basta pedir em linguagem natural e o Claude Code identifica qual skill usar pela descrição. Exemplos:

| O que pedir | Skill acionada | O que é gerado |
|---|---|---|
| "cria o PRD da feature de login" | `criar-prd` | `docs/specs/login/prd.md` |
| "define o design dessa tela" | `claude-design` | seção/decisões de UI usadas no techspec |
| "cria o techspec do login" | `criar-techspec` | `docs/specs/login/techspec.md` |
| "quebra isso em tasks" | `criar-tasks` | `docs/specs/login/tasks.md` |
| "executa as tasks" | `executar-task` | código implementado + tasks marcadas `[x]` |

Também é possível pedir tudo de uma vez ("cria o PRD, o techspec, as tasks e executa"), como foi feito na feature de exemplo abaixo — o Claude Code passa pelas etapas em ordem.

## 1. `criar-prd` — o quê e por quê
Define o problema, objetivo, requisitos funcionais e critérios de aceite. **Nunca** menciona tecnologia, componentes ou arquivos — isso é assunto do Tech Spec.

Se faltar informação de negócio (objetivo, público, critério de sucesso), o Claude pergunta antes de escrever — não inventa requisito.

## 2. `claude-design` — decisões visuais
Usada sempre que a feature tem UI. Define, a partir do PRD:
- Quais telas/estados existem (padrão, loading, erro, vazio).
- Quais componentes do design system (`src/components/ui`) são reaproveitados e quais precisam ser criados.
- Quais tokens do tema (`src/styles/theme.ts`) são usados.

Essa decisão vira a seção **"Design"** dentro do `techspec.md` — não é um arquivo separado.

Referência de boas práticas de estilo: skill `styled-components-best-practices`.

## 3. `criar-techspec` — como implementar
A partir do PRD + decisões de design, define arquitetura técnica: arquivos afetados/criados, tipos, Server vs Client Component, decisões e trade-offs, riscos.

## 4. `criar-tasks` — quebra em passos pequenos
Transforma a arquitetura do Tech Spec em uma lista ordenada de tarefas pequenas e verificáveis, cada uma com arquivos envolvidos e um critério objetivo de "pronto".

## 5. `executar-task` — implementação
Implementa as tasks pendentes uma a uma, seguindo as skills de qualidade do projeto (`code-best-practices`, `styled-components-best-practices`, `claude-design`), valida (`npm run build` / `npm run lint`) e marca `[x]` no `tasks.md` conforme conclui.

## Exemplo real já executado: `home-hero`
A pasta `docs/specs/home-hero/` contém um exemplo completo e já implementado do fluxo, usado como referência:
- `prd.md` — página inicial com hero (título, subtítulo, CTA).
- `techspec.md` — uso do componente `Button` do design system, novo componente `Hero`.
- `tasks.md` — 4 tasks, todas concluídas (`[x]`).
- Código gerado: `src/components/home/Hero/` e `src/app/page.tsx`.

Use essa pasta como modelo de nível de detalhe ao criar specs de novas features.

## Skills relacionadas (qualidade e design)
- `code-best-practices` — convenções gerais de código React/TypeScript/Next.js do projeto.
- `styled-components-best-practices` — como escrever e organizar `styled-components` neste projeto (App Router + SSR).
- `claude-design` — o design system em si: tema (`theme.ts`) e componentes base (`src/components/ui`).

## Onde tudo fica
```
.claude/skills/
  criar-prd/SKILL.md
  claude-design/SKILL.md
  criar-techspec/SKILL.md
  criar-tasks/SKILL.md
  executar-task/SKILL.md
  code-best-practices/SKILL.md
  styled-components-best-practices/SKILL.md

docs/
  PROCESSO-SPEC-DRIVEN.md      ← este arquivo
  specs/
    home-hero/                ← exemplo completo já implementado
      prd.md
      techspec.md
      tasks.md

src/
  styles/theme.ts              ← tema do design system
  lib/registry.tsx              ← SSR do styled-components + ThemeProvider
  components/ui/                ← componentes base do design system (ex: Button)
  components/<feature>/         ← componentes específicos de cada feature (ex: home/Hero)
```
