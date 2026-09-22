---
name: criar-prd
description: Cria um PRD (Product Requirements Document) para uma nova feature deste projeto. Use quando o usuário pedir para criar/documentar uma feature, funcionalidade ou tela nova antes de qualquer código ou tech spec.
---

# Criar PRD

Primeira etapa do fluxo spec-driven deste projeto:

```
criar-prd → claude-design → criar-techspec → criar-tasks → executar-task
```

## Quando usar
Sempre que uma feature nova for pedida e ainda não existir um PRD para ela em `docs/specs/<slug-da-feature>/prd.md`.

## Processo
1. Definir um slug curto em kebab-case para a feature (ex: `home-hero`) — vira o nome da pasta `docs/specs/<slug>/`.
2. Se faltarem informações essenciais (objetivo, usuário-alvo, critério de sucesso), perguntar ao usuário antes de escrever. Não inventar requisitos de negócio.
3. Escrever o PRD em `docs/specs/<slug>/prd.md` usando o template abaixo.
4. O PRD descreve **o quê e por quê**, nunca **como** (sem stack, componentes React, nomes de arquivo — isso é do Tech Spec).

## Template (`prd.md`)
```markdown
# PRD: <Nome da Feature>

## Problema
O que motiva essa feature? Qual dor do usuário/negócio ela resolve?

## Objetivo
O que deve ser verdade quando a feature estiver pronta (1-3 frases).

## Usuário-alvo
Quem usa isso e em que contexto.

## Requisitos funcionais
- RF1: ...
- RF2: ...

## Fora de escopo
O que explicitamente não faz parte desta versão.

## Critérios de aceite
- [ ] Critério verificável 1
- [ ] Critério verificável 2

## Métricas de sucesso (se aplicável)
Como saberemos que funcionou.
```

## Próximo passo
Depois do PRD aprovado pelo usuário, seguir para a skill `claude-design` (spec de UI/UX) e então `criar-techspec`.
