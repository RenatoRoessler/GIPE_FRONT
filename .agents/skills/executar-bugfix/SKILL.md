---
name: executar-bugfix
description: Fixes all bugs listed in bugs.md by diagnosing root causes, implementing fixes, and adding regression tests. Use when bugs.md exists with reported issues. Do not apply superficial workarounds, do not skip tests, and do not mark complete until all bugs are fixed and all tests pass.
argument-hint: '[feature-name]'
---

# Executar Bugfix

## Pré-condições

<<<<<<< HEAD

- Requer `tasks/prd-[nome-funcionalidade]/bugs.md` com bugs listados
- Requer `tasks/prd-[nome-funcionalidade]/prd.md` para entender comportamento esperado
- # Requer `tasks/prd-[nome-funcionalidade]/techspec.md` para entender a implementação
- Requer `docs/spec/[slug]/bugs.md` com bugs listados
- Requer `docs/spec/[slug]/prd.md` para entender comportamento esperado
- Requer `docs/spec/[slug]/techspec.md` para entender a implementação
  > > > > > > > dev
- Iniciar implementação imediatamente após o planejamento — não esperar aprovação

## Step 1: Inventário de Bugs

<<<<<<< HEAD

1. # Leia `tasks/prd-[nome-funcionalidade]/bugs.md` e liste todos os bugs.
1. Leia `docs/spec/[slug]/bugs.md` e liste todos os bugs.
   > > > > > > > dev
1. Para cada bug, identifique:
   - Severidade (Critical / High / Medium / Low)
   - Área de código afetada
   - Comportamento esperado vs. atual
1. Ordene pela severidade para corrigir os mais críticos primeiro.
1. Use **Context7 MCP** para consultar documentação relevante às tecnologias envolvidas.

## Step 2: Diagnóstico (por bug)

Para cada bug, antes de qualquer mudança:

1. Reproduza o bug de forma consistente.
2. Identifique a **causa raiz** — não o sintoma.
3. Rastreie o fluxo: componente → hook → store → service → API.
4. Documente o diagnóstico no próprio arquivo de bug.

## Step 3: Implementar Correção (por bug)

1. Corrija na causa raiz — nunca em camadas superiores para mascarar o problema.
2. Não aplique workarounds ou gambiarras.
3. Mantenha o escopo da correção mínimo — não refatore código não relacionado.
4. Siga os padrões documentados em `AGENTS.md` e `GUIDELINE.md` na raiz do repositório.

## Step 4: Testes de Regressão (por bug)

Para cada bug corrigido:

1. Crie testes que **simulem o problema original** e **validem a correção**.
2. O teste deve falhar com o código antigo e passar com a correção.
3. Execute todos os testes existentes para garantir que a correção não introduziu regressões.
4. Garanta 100% de sucesso antes de avançar para o próximo bug.

## Step 5: Conclusão

1. Marque cada bug como `[x] Corrigido` em `bugs.md`.
2. Execute o suite completo de testes uma última vez.
3. A task **não está completa** até que:
   - [ ] Todos os bugs estejam corrigidos
   - [ ] Testes de regressão existam para cada bug
   - [ ] 100% dos testes passem

## Error Handling

- Se não conseguir reproduzir um bug, solicite mais informações antes de marcar como corrigido.
- Se a correção de um bug revelar outro problema, adicione como novo item em `bugs.md`.
- Se um bug for causado por um requisito ambíguo, consulte o PRD e, se necessário, pergunte ao usuário antes de assumir o comportamento correto.
