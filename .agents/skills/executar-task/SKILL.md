---
name: executar-task
description: Implements a specific task from tasks.md following the Tech Spec and project architecture. Loads required skills, uses Context7 for documentation, starts immediately after planning, and marks the task complete. Always runs the task-reviewer at the end. Use when a task file exists and is ready for implementation. Do not use for planning, PRD creation, or tasks without Tech Spec.
argument-hint: '[feature-name] [task-number]'
---

# Executar Task

## Pré-condições

- Requer `docs/spec/[slug]/prd.md`
- Requer `docs/spec/[slug]/techspec.md`
- Requer `docs/spec/[slug]/tasks.md`
- Requer o arquivo da task: `docs/spec/[slug]/[num]_task.md`

## Step 1: Setup e Contexto

1. Leia o arquivo da task específica: `docs/spec/[slug]/[num]_task.md`.
2. Leia a Tech Spec para entender contratos e estrutura esperada.
3. Leia `AGENTS.md` e `GUIDELINE.md` na raiz do repositório para seguir os padrões do projeto.
4. Identifique as tecnologias envolvidas e carregue as skills necessárias:
   - Se React/TSX: skill `react`
   - Se styled-components: skill `styled-components`
   - Se Zustand: skill `zustand`
   - Se Jest: skill `jest-unit-testing` (este repo usa Jest, não Vitest — ver `jest.config.js` na raiz)
   - Se TypeScript avançado: skill `typescript-advanced`
5. Use **Context7 MCP** para consultar documentação das libs/frameworks da task.
6. Atualize o status da task para 🔄 Em progresso em `tasks.md`.

## Step 2: Planejar a Implementação

1. Liste os arquivos a criar e editar com base na task e na Tech Spec.
2. Identifique a ordem de implementação (tipos → serviços → store → componentes → testes).
3. **Inicie a implementação imediatamente** — não espere aprovação adicional.

## Step 3: Implementar

1. Siga exatamente a Tech Spec — não desvie de interfaces, contratos ou estrutura definidos.
2. Implemente na ordem planejada no Step 2.
3. Não adicione funcionalidades além do escopo da task.
4. Aplique os padrões documentados em `GUIDELINE.md` a cada arquivo criado.

## Step 4: Testes

1. Implemente todos os testes listados nos critérios da task.
2. Execute os testes: `npm run test` ou equivalente.
3. Garanta 100% de sucesso antes de prosseguir.
4. Se algum teste falhar, corrija a implementação (não o teste).

## Step 5: Revisão e Conclusão

1. Marque todos os critérios de aceite como `[x]` no arquivo da task.
2. Atualize o status para ✅ Concluída em `tasks.md`.
3. Execute o **task-reviewer** (skill `executar-review`) para validação final.

## Error Handling

- Se a Tech Spec for ambígua em algum ponto, use a abordagem mais próxima dos padrões existentes do projeto e documente a decisão.
- Se um teste falhar de forma não relacionada à task, registre como bug separado e não bloqueie a conclusão da task.
- Nunca aplique workarounds ou gambiarras — resolva a causa raiz.
