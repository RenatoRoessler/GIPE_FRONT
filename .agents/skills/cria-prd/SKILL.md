---
name: cria-prd
description: Creates a structured PRD (Product Requirements Document) by asking clarification questions before writing. Use when starting a new feature, epic, or product initiative. Outputs prd.md to docs/spec/[slug]/. Do not use for technical implementation details, bug fixes without new requirements, or when a PRD already exists for the feature.
argument-hint: "[feature-name]"
---

# Criar PRD

## Pré-condições

- Não gerar o PRD sem antes fazer perguntas de clarificação
- Não incluir detalhes de implementação técnica no PRD
- Usar a AskUserQuestion tool para coletar informações

## Step 1: Entender o Contexto

1. Se `feature-name` foi passado como argumento, use como base para o diretório de saída.
2. Leia qualquer contexto existente no repositório relacionado à feature: issues abertas, documentos em `tasks/`, ou menções no código.
3. Identifique o que já é conhecido e o que precisa ser esclarecido.

## Step 2: Perguntas de Clarificação

Antes de qualquer geração, use a **AskUserQuestion tool** para coletar:

1. **Objetivo de negócio**: Qual problema esta feature resolve? Qual é o valor para o usuário?
2. **Usuários-alvo**: Quem vai usar? Quais são suas necessidades e contexto?
3. **Escopo**: O que está dentro e fora do escopo desta entrega?
4. **Critérios de sucesso**: Como saberemos que a feature foi bem-sucedida? Quais métricas?
5. **Restrições**: Há prazos, limitações técnicas, restrições de negócio ou dependências externas?
6. **Referências**: Existem mockups, fluxos existentes, documentos de produto ou exemplos para seguir?

Agrupe perguntas relacionadas em uma única interação para não sobrecarregar o usuário.

## Step 3: Gerar o PRD

1. Leia o template em `assets/prd-template.md`.
2. Preencha cada seção com base nas respostas coletadas.
3. Mantenha linguagem clara e orientada ao usuário — sem jargão técnico de implementação.
4. Detalhe os requisitos funcionais como critérios de aceite testáveis (formato: "Dado X, quando Y, então Z").
5. Identifique explicitamente o que está **fora do escopo**.

## Step 4: Revisão e Saída

1. Revise o PRD final contra o checklist:
   - [ ] Objetivo de negócio claro
   - [ ] Usuários-alvo definidos
   - [ ] Todos os fluxos principais cobertos
   - [ ] Critérios de aceite testáveis para cada requisito
   - [ ] Escopo e não-escopo explícitos
   - [ ] Nenhum detalhe de implementação técnica
2. Salve em `./docs/spec/[slug]/prd.md`.
3. Informe o usuário que o próximo passo é gerar a Tech Spec com o comando `/cria-techspec`.

## Error Handling

- Se o usuário não souber responder alguma pergunta, marque a seção como `[A DEFINIR]` no PRD e documente a suposição feita.
- Se houver conflito entre requisitos, sinalize explicitamente e peça desempate antes de prosseguir.
