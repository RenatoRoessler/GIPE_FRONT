# Tech Spec: [Nome da Feature]

**Status:** Rascunho | Em Revisão | Aprovado  
**Autor:** [Nome]  
**Data:** [YYYY-MM-DD]  
**PRD:** [link para prd.md]

---

## 1. Visão Técnica

> Resumo da abordagem técnica e decisões de arquitetura principais.

## 2. Estrutura de Pastas

```
src/features/[feature-name]/
├── components/
│   ├── [ComponentName]/
│   │   ├── index.tsx
│   │   ├── [ComponentName].styles.ts
│   │   └── use[ComponentName].ts
├── hooks/
│   └── use[FeatureName].ts
├── store/
│   └── [featureName].store.ts
├── services/
│   └── [featureName].service.ts
├── types/
│   └── [featureName].types.ts
└── index.ts
```

## 3. Interfaces e Tipos

```typescript
// Entidade de domínio
interface I[EntityName] {
  id: string
  // ...
}

// Payload de request
interface I[EntityName]Payload {
  // ...
}

// Response da API
interface I[EntityName]Response {
  data: I[EntityName][]
  total: number
}
```

## 4. Contratos de API

### GET /api/[endpoint]

**Request:**

```typescript
// query params ou body
```

**Response:**

```typescript
I[EntityName]Response
```

### POST /api/[endpoint]

**Request:** `I[EntityName]Payload`  
**Response:** `I[EntityName]`

## 5. Componentes

### [ComponentName]

**Responsabilidade:** [o que faz]  
**Props:**

```typescript
interface I[ComponentName]Props {
  // ...
}
```

**Hook:** `use[ComponentName]` — gerencia [estado/lógica]

## 6. Gerenciamento de Estado

**Estratégia:** [Zustand global | Context local]

```typescript
interface I[FeatureName]Store {
  // estado
  // actions
}
```

## 7. Fluxo de Dados

```
[API] → [Service] → [Store/Hook] → [Component] → [UI]
```

## 8. Estratégia de Testes

| Camada     | Ferramenta | O que testar                      |
| ---------- | ---------- | --------------------------------- |
| Unitário   | Jest       | hooks, stores, utils              |
| Componente | Jest + RTL | renderização, interações          |
| Integração | Jest       | fluxos completos com mocks de API |
| E2E        | Playwright | fluxos críticos end-to-end        |

## 9. Dependências

| Pacote   | Versão | Motivo    |
| -------- | ------ | --------- |
| [pacote] | [x.x]  | [por que] |

## 10. Riscos Técnicos

| Risco   | Probabilidade    | Mitigação |
| ------- | ---------------- | --------- |
| [risco] | Alta/Média/Baixa | [ação]    |

## 11. Decisões de Arquitetura

| Decisão   | Alternativas Consideradas | Motivo da Escolha |
| --------- | ------------------------- | ----------------- |
| [decisão] | [opção A, opção B]        | [justificativa]   |
