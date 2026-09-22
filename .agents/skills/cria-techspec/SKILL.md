---
name: cria-techspec
description: Creates a technical specification (Tech Spec) from an existing PRD by exploring the codebase, researching libraries, and asking clarification questions. Use when a PRD exists and the team needs an implementation blueprint. Outputs techspec.md to docs/spec/[slug]/. Do not use without a PRD, for pure business documentation, or when implementation has already started.
argument-hint: '[feature-name]'
---

# Criar Tech Spec

## Pré-condições

- Requer PRD existente em `docs/spec/[slug]/prd.md`
- Explorar o projeto ANTES de fazer perguntas de clarificação
- Usar AskUserQuestion tool para coletar informações não deriváveis do código
- Usar Context7 MCP para consultar documentação de libs/frameworks

## Step 1: Explorar o Projeto

1. Leia o PRD em `docs/spec/[slug]/prd.md`.
2. Leia `AGENTS.md` e `GUIDELINE.md` na raiz do repositório para entender os padrões do projeto.
3. Explore as features existentes mais próximas da feature a ser implementada.
4. Identifique:
   - Componentes reutilizáveis disponíveis
   - Stores e hooks existentes que podem ser aproveitados
   - Padrões de API/request já estabelecidos
   - Estrutura de pastas esperada para a nova feature

## Step 2: Pesquisa Técnica

1. Use **Context7 MCP** para consultar documentação das libs/frameworks envolvidos.
2. Faça pelo menos **3 buscas** (web search ou Context7) para validar abordagens técnicas.
3. Identifique alternativas e justifique a escolha de cada tecnologia/abordagem.
4. Se o PRD referenciar uma URL do Figma:
   - Extraia o `fileKey` do path: `figma.com/design/:fileKey/...`
   - Extraia o `nodeId` do query param `node-id`, convertendo `-` para `:` (ex: `1-2` → `1:2`)
   - Chame `get_design_context(nodeId, fileKey)` para obter estrutura de componentes, hierarquia e tokens de design
   - Use os dados retornados para embasar as seções **5 (Componentes)** e **11 (Decisões de Arquitetura)** da Tech Spec
   - Se necessário extrair tokens de cor, tipografia e espaçamento com maior precisão, execute a skill `design-spec-extraction`

## Step 3: Perguntas de Clarificação

Use a **AskUserQuestion tool** para esclarecer apenas o que não pode ser derivado do código ou do PRD:

1. **Decisões de design técnico**: Há preferências de arquitetura para esta feature específica?
2. **Integrações**: Quais APIs externas ou internas serão consumidas? Existe documentação/contrato?
3. **Estado**: O estado desta feature precisa ser global (Zustand) ou local (Context)?
4. **Performance**: Há requisitos especiais de cache, lazy loading ou otimização?
5. **Migrations/breaking changes**: A feature altera fluxos ou dados existentes?

## Step 4: Gerar a Tech Spec

1. Leia o template em `assets/techspec-template.md`.
2. Preencha seguindo a arquitetura do projeto documentada em `GUIDELINE.md`.
3. Defina:
   - Estrutura de pastas completa para a feature
   - Interfaces TypeScript (prefixo `I`) para todos os tipos
   - Contratos de API (request/response shapes)
   - Estrutura de componentes e hierarquia (use o resultado do `get_design_context` se disponível)
   - Fluxo de dados (store → hook → componente)
   - Estratégia de testes por camada
4. Para cada componente identificado no Figma, especifique na seção **5 (Componentes)**:
   - Nome em PascalCase derivado do nó do Figma
   - Se vai para `src/components/features/` ou `src/components/Shared/`
   - Props necessárias com tipos TypeScript
   - Nota indicando que a implementação usará `/figma-connect <url-do-nó>` na execução da task

## Step 5: Revisão e Saída

1. Verifique o checklist:
   - [ ] Alinhado com todos os requisitos do PRD
   - [ ] Segue a estrutura de componentes documentada em `GUIDELINE.md` (atoms/molecules/organisms + features/Shared, conforme o caso)
   - [ ] Interfaces TypeScript definidas
   - [ ] Contratos de API documentados
   - [ ] Estratégia de testes por camada
   - [ ] Sem ambiguidades que bloqueiem implementação
2. Salve em `./docs/spec/[slug]/techspec.md`.
3. Informe o usuário que o próximo passo é criar as tasks com `/criar-tasks`.

## Error Handling

- Se o PRD estiver incompleto ou ambíguo, sinalize e peça revisão antes de prosseguir.
- Se não houver consenso técnico sobre alguma abordagem, documente as opções e a decisão tomada.
