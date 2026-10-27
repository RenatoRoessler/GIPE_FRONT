# Tech Spec: Quadro de Chaves

**Status:** Rascunho
**Data:** 2026-10-27
**PRD:** [./prd.md](./prd.md) · **Design:** [./design.md](./design.md)

Segue as convenções do projeto (Next 16 App Router, styled-components, TanStack Form e Query, zod, vitest), como aplicadas em `docs/specs/minha-empresa/` e `docs/specs/config-pagamento-empresa/`. Esta etapa só especifica; nada é implementado aqui.

## Referências
- PRD: ./prd.md
- Design: ./design.md e a seção "Design" abaixo
- Contrato: swagger local (`/swagger`), endpoints `Patio/quadro-chaves*` e `PUT Patio/{idPatio}/quadro-chave`

## Design

- **Telas/estados:** lista de quadros, configurar quadro (criar e acrescentar posições) e etapa "Quadro de chaves" da entrada de veículos, com todos os estados do design.
- **Reaproveitados:** `Modal`, `Button`, `Input`, `Card`, `InfoCard`, `OptionGroup`, `Tabs`, `PlateDisplay`, `ConfirmDialog`, `ErrorBanner`, `Skeleton`, `Toast`, `Text`.
- **Novos no design system (`src/components/ui`):** `NumberStepper` e `KeyBoardGrid` (o segundo com variante `configurar` e `escolher`).
- **Novos de feature (`src/components/quadros`):** ver árvore abaixo.
- **Tokens:** nenhum novo. Placas e coordenadas usam `fontFamilies.mono`.

## Arquitetura da solução

### Contratos de API (`/api/v1`, já implementados)

| Uso | Chamada | Corpo / resposta |
|---|---|---|
| Listar | `GET /Patio/quadro-chaves` | `QuadroChaves[]` (abaixo) |
| Criar | `POST /Patio/quadro-chaves` | `{ nome, linhas: [{ linha, colunas: number[] }] }` → quadro criado |
| Acrescentar | `POST /Patio/quadro-chaves/{patioQuadroId}` | `[{ linha, colunas }]` → quadro completo |
| Escolher | `PUT /Patio/{idPatio}/quadro-chave` | `{ patioQuadroChaveId }` → `{ patioId, placa, patioQuadroId, quadro, patioQuadroChaveId, linha, coluna }` |
| Excluir posição | `DELETE /Patio/quadro-chaves/{id}` | 204; 400 se em uso |
| Inativar quadro | `DELETE /Patio/quadro-chaves/quadro/{patioQuadroId}` | 204; 400 com as placas |

Perfis: leitura e escolha para Administrador, Gerente, Caixa e Manobrista; criar, acrescentar, excluir e inativar só Administrador e Gerente.

### Tipos (`src/types/quadroChaves.ts`)

```ts
export type PosicaoQuadro = { patioQuadroChaveId: number; coluna: number; disponivel: boolean };
export type LinhaQuadro = { linha: string; colunas: PosicaoQuadro[] };
export type QuadroChaves = { patioQuadroId: number; nome: string; linhas: LinhaQuadro[] };

// Corpo de criação e acréscimo.
export type LinhaQuadroPayload = { linha: string; colunas: number[] };
export type QuadroChavesPayload = { nome: string; linhas: LinhaQuadroPayload[] };

export type ChaveEscolhida = {
  patioId: number; placa: string;
  patioQuadroId: number; quadro: string;
  patioQuadroChaveId: number; linha: string; coluna: number;
};

// Estado de um gancho na grade.
export type EstadoGancho = "livre" | "selecionado" | "ocupado" | "fora";

// Formulário de configuração (valores de tela).
export type QuadroFormValues = {
  nome: string;
  linhas: number;
  colunas: number;
  // Ganchos marcados fora de uso, no formato "A1".
  foraDeUso: string[];
};
```

### Arquivos

```
src/
├── types/quadroChaves.ts                         # novo
├── lib/
│   ├── permissoes.ts                             # + AREA.QuadroChaves
│   ├── nav.ts                                    # + item "Quadros de chaves"
│   ├── schemas/quadroChaves.ts                   # novo: quadroFormSchema
│   └── api/services/
│       ├── quadroChaves.ts                       # novo: list/criar/acrescentar/escolher/excluir/inativar
│       ├── quadroChaves.mapper.ts                # novo: tolerância do GET e conversão form <-> payload
│       └── quadroChaves.test.ts / .mapper.test.ts
├── app/(app)/quadros-chaves/
│   ├── page.tsx                                  # lista (Server Component que renderiza <QuadrosLista />)
│   └── novo/page.tsx                             # configurar (cria); [id]/posicoes/page.tsx acrescenta
├── components/
│   ├── ui/
│   │   ├── NumberStepper/                        # novo (+ .styles, .test, index)
│   │   └── KeyBoardGrid/                         # novo (+ .styles, .test, index)
│   ├── quadros/
│   │   ├── quadrosKeys.ts                        # QUADROS_QUERY_KEY
│   │   ├── useQuadros.ts                         # useQuery da lista
│   │   ├── gancho.ts                             # geração de linhas/colunas e sugestão (puras, com teste)
│   │   ├── QuadrosLista/                         # cards, estados, inativar
│   │   ├── QuadroForm/                           # configurar/acrescentar
│   │   └── EscolherGancho/                       # etapa da entrada (conteúdo + hook useEscolherGancho)
│   ├── patio/PatioView/…                         # card do veículo mostra a posição (RF18)
│   └── veiculos/EntradaVeiculoModal/             # nova etapa entre o formulário e o recibo
```

### Peças e responsabilidades

- **`gancho.ts` (puro, sem React):**
  - `rotuloLinha(indice)` → "A".."Z"; `rotuloGancho(linha, coluna)` → `"A2"`.
  - `gerarPayload({ linhas, colunas, foraDeUso })` → `LinhaQuadroPayload[]`, omitindo as colunas fora de uso e as linhas que ficarem sem coluna (o back exige ao menos uma). É aqui que "fora de uso" vira coluna omitida.
  - `diffAcrescimo(quadro, valores)` → só as posições novas (o back ignora existentes, mas a prévia precisa distingui-las).
  - `sugerirGancho(quadro)` → primeiro `disponivel` na ordem do quadro (linha, depois coluna). Com vários quadros, `escolherQuadroInicial(quadros)` devolve o de mais livres.
- **`NumberStepper`:** controlado (`value`, `min`, `max`, `onChange`, `label`, `hint`); botões − e + de 44px; `role="spinbutton"` com `aria-valuenow/min/max`.
- **`KeyBoardGrid`:** recebe `linhas: { rotulo; ganchos: { id; coluna; estado; rotulo?; placa? }[] }[]`, `modo: "configurar" | "escolher"`, `onToggle`/`onSelect`. Um `role="grid"` com navegação por setas (roving tabindex) e rolagem horizontal com rótulos de linha fixos (`position: sticky`). Props de estilo só transitórias (`$estado`).
- **`useQuadros`:** `useQuery` com `QUADROS_QUERY_KEY`, `staleTime` curto (15 s) e `refetchOnWindowFocus`, porque a disponibilidade muda a cada entrada e saída em qualquer terminal. Todas as mutações (criar, acrescentar, excluir, inativar, escolher) invalidam `QUADROS_QUERY_KEY`; escolher e a saída de veículo também invalidam `PATIO_QUERY_KEY`.
- **`EscolherGancho`:** carrega `useQuadros`; sem quadros chama `onPular()` imediatamente (RF20). Mantém `selecionado` em estado local, inicializado pela sugestão e **recalculado quando a lista refaz o fetch e o escolhido ficou ocupado** (conflito). Confirma com `useMutation(escolherQuadroChave)`. Erro 400 de ocupação: mostra a mensagem do back (placa que ocupa), refaz o fetch e volta à sugestão.
- **Entrada de veículos:** `EntradaVeiculoModal` ganha o estado `etapa: "form" | "gancho" | "recibo"`. Após `registrarEntrada`, vai para `gancho` com o `patioId` e a placa já conhecidos (`EntradaRegistrada.patioId`); ao guardar (ou pular), vai para `recibo`. O recibo de entrada mostra a posição quando houver (opcional, ver riscos). Fechar o modal na etapa `gancho` conta como pular: a entrada já foi registrada.
- **Pátio:** o card passa a mostrar a posição quando `GET /Patio` devolver `quadroChaves`; hoje o campo é ignorado em `fromPatioResponse` e deve ser lido como texto opcional (`PatioVeiculo.posicaoChave: string | null`).
- **Navegação e permissão:** nova `AREA.QuadroChaves` (`"quadros-chaves"`) com leitura para `[Administrador, Gerente]` no menu (a tela de configuração é só desses perfis). O gancho na entrada depende da área `Patio` e da API, não desta área. Item no menu `Mais` com ícone novo em `NavIconId` (`"keys"`) e rota `["/quadros-chaves", AREA.QuadroChaves]` em `AREA_POR_ROTA`. As ações de escrita já são bloqueadas pelo back (403); a tela só as esconde.

### Server vs Client

- `page.tsx` das rotas: Server Component fino, que renderiza o componente de feature dentro de `Suspense` quando usar `useSearchParams` (não é o caso aqui).
- Tudo em `components/quadros`, `NumberStepper` e `KeyBoardGrid`: Client Component (estado, query, formulário).

### Validação (`quadroFormSchema`, zod)

- `nome`: trim, 1 a 100 caracteres (duplicidade é do back, tratada como erro de campo no 400).
- `linhas`: inteiro 1–26. `colunas`: inteiro 1–255.
- Regra do conjunto: ao menos um gancho em uso (`linhas * colunas - foraDeUso.length > 0`), erro no campo `foraDeUso`.
- Limite prático de tela: `linhas * colunas` ≤ 600 para a prévia não travar; acima disso o `NumberStepper` do outro eixo mostra o limite.

## Decisões técnicas e trade-offs

- **Grade única para configurar e escolher.** Evita dois componentes divergentes e garante o mesmo símbolo de "fora de uso". Custo: um componente com dois modos; se crescer, dividir em composição (`KeyBoardGrid.Root/Cell`) em vez de mais props.
- **"Fora de uso" é coluna omitida**, não um campo do back. O back aceita colunas não sequenciais (ex. sem a 5) e não guarda o motivo. Consequência: ao acrescentar posições, uma posição omitida antes aparece na prévia como "não cadastrada" e pode ser criada; não há como distinguir "fora de uso" de "ainda não criada". Aceito.
- **Sugestão no cliente.** O back não sugere gancho; "primeiro livre" é calculado em `sugerirGancho`. Como a lista já vem ordenada, a regra é trivial e testável.
- **Sem atualização otimista.** A disponibilidade é compartilhada entre terminais; confiar no resultado do servidor e refazer o fetch no conflito é mais seguro que reverter estado local.
- **Etapa no modal de entrada, não rota.** Mantém o contexto do veículo recém-entrado e o fluxo atual (formulário → recibo); a lista e a configuração são rotas porque são telas de gestão.
- **Nomear só por número não é implementado:** o contrato recebe `linha` como texto e `colunas` como inteiros; a opção do layout fica oculta (pergunta em aberto do PRD). O `OptionGroup` de nome só entra quando houver mais de uma opção.
- **Sem estado global.** Query + estado local bastam; nada de Zustand.

## Riscos / pontos de atenção

- **Placa nos ganchos ocupados:** `GET /Patio/quadro-chaves` só devolve `disponivel`. Sem a placa, o gancho ocupado aparece como "ocupado" sem identificação (a placa só é conhecida no 400 do PUT). **[A CONFIRMAR com o back]** incluir `placa` na posição ocupada.
- **Formato de `quadroChaves` no `GET /Patio`:** hoje ignorado e o formato é desconhecido (o teste existente usa `"A-12"`). **[A CONFIRMAR]** se vem como "A2", com o nome do quadro ou como objeto; `fromPatioResponse` deve tolerar texto ou objeto e normalizar para o texto do card.
- **Concorrência:** dois terminais podem escolher o mesmo gancho; coberto pelo 400 do PUT e pela recarga. Cobrir em teste.
- **Quadros grandes:** 26 × 255 não cabe em tela; a rolagem horizontal e o limite de 600 posições na prévia mitigam. Testar a 320px.
- **Permissão por módulo:** a regra padrão é do back e pode ser sobrescrita; a nova `AREA` precisa entrar no mapa de overrides de `permissoes.ts` e na tela de permissões, se ela listar áreas.
- **Saída de veículo:** o back libera o gancho sozinho; a lista de quadros só atualiza no próximo fetch. A saída deve invalidar `QUADROS_QUERY_KEY`.
- **Teste de entrada existente:** `EntradaVeiculoModal.test.tsx` assume formulário → recibo; passa a precisar do mock de `GET quadro-chaves` (vazio mantém o comportamento atual).

## Fora de escopo técnico

- Nomeação só numérica de ganchos.
- Editar nome do quadro ou remover várias posições de uma vez.
- Placa nos ganchos ocupados (depende do back).
- Etapa de gancho na edição posterior do veículo no pátio (trocar a chave de lugar depois da entrada); o `PUT` já suporta, mas a tela fica para uma próxima versão.
- Impressão de etiquetas e histórico de movimentação de chaves.
- Tempo real (WebSocket/SSE) da disponibilidade; só refetch por foco e por invalidação.
