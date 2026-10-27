# Tech Spec: Quadro de chaves na tela do Pátio

**Status:** Rascunho
**Data:** 2026-10-27
**PRD:** [./prd.md](./prd.md) · **Design:** [./design.md](./design.md)

Segue as convenções do projeto (Next 16 App Router, styled-components, TanStack Query, vitest) e reaproveita o que `docs/specs/quadro-chaves/` já entregou (`useQuadros`, `EscolherGancho`, `KeyBoardGrid`, `escolherQuadroChave`). Esta etapa só especifica; nada é implementado aqui.

## Referências
- PRD: ./prd.md
- Design: ./design.md e a seção "Design" abaixo
- Contrato: `PUT /api/v1/Patio/{idPatio}/quadro-chave` (já tem serviço) e campo `quadroChaves` de `GET /api/v1/Patio`.

## Design

- **Telas/estados:** botão da chave no card (com gancho, sem gancho, sem quadros, carregando), indicador no resumo (N fora, zero, sem quadros) e modal "Guardar chave" (ver design).
- **Reaproveitados:** `Modal`, `Button`, `StatusBadge`, `Toast`, `ErrorBanner`, `Skeleton`, `PlateDisplay`, `Link`, `EscolherGancho` e `KeyBoardGrid`.
- **Novos de feature:** `ChaveBotao` (em `components/patio/PatioView`) e `GuardarChaveModal` (em `components/quadros`). Nenhum componente novo de design system e nenhum token novo.

### Ajuste ao design: troca de gancho sem sugestão
O design diz que o gancho atual vem pré-selecionado. Como o gancho atual não é livre (o back o marca `disponivel: false`), mantê-lo "selecionado" confunde a grade. Decisão: ao **trocar**, o gancho atual aparece como ocupado com a legenda **"aqui"**, **não há sugestão** e o botão principal fica desabilitado ("Escolha um gancho") até o operador tocar em um livre. Isso evita trocar a chave de lugar com um toque acidental na confirmação. Ao **guardar** pela primeira vez (veículo sem gancho), a sugestão continua como na entrada.

## Arquitetura da solução

### Dados: de onde vem "a chave do carro"

`GET /Patio` já devolve `quadroChaves` (hoje lido como `posicaoChave: string | null`). O que faltava:

1. **Posição estruturada.** Para localizar o gancho atual na grade (e marcá-lo "aqui"), o texto não basta. `fromPatioResponse` passa a devolver também `chaveRef`, preenchido a partir de **qualquer** dos dois formatos possíveis do back:
   - objeto `{ quadro?|nome?, linha, coluna }` → direto;
   - texto `"A2"` ou `"Recepção · A2"` → `parseChaveRef` (regex `^(?:(.+) · )?([A-Za-z]{1,10})(\d{1,3})$`).
   Texto que não casa → `chaveRef: null` (o card ainda mostra o texto; só a marcação "aqui" se perde).
2. **Fora do quadro** = `posicaoChave` vazia. A contagem é feita no cliente sobre a lista inteira do Pátio.

```ts
// src/types/patio.ts
export type ChaveRef = { quadro: string | null; linha: string; coluna: number };
export type PatioVeiculo = {
  /* ...campos atuais... */
  posicaoChave?: string | null;
  // Mesma informação de `posicaoChave`, em partes, para achar o gancho na grade.
  chaveRef?: ChaveRef | null;
};
```

### Arquivos

```
src/
├── types/patio.ts                                   # + ChaveRef, PatioVeiculo.chaveRef
├── lib/api/services/patio.ts                        # parseChaveRef + fromPatioResponse preenche chaveRef
├── lib/api/services/patio.list.test.ts              # casos de texto, objeto e formato desconhecido
├── components/
│   ├── patio/
│   │   ├── patio.ts                                 # + contarForaDoQuadro(todos)
│   │   ├── patio.test.ts
│   │   └── PatioView/
│   │       ├── ChaveBotao.tsx                       # novo: botão do card (3 estados)
│   │       ├── ChaveBotao.test.tsx
│   │       ├── PatioLinha.tsx                       # troca o texto "Chave: A2" pelo ChaveBotao; recebe `comQuadros` e `onGuardarChave`
│   │       ├── PatioTabela.tsx                      # repassa as duas props
│   │       ├── PatioView.tsx                        # useQuadros, indicador, estado do modal, `pausado`
│   │       ├── PatioView.styles.ts                  # estilo do botão/indicador e do link "Configurar"
│   │       └── PatioView.chave.test.tsx             # novo: fluxo guardar/trocar, indicador, sem quadros
│   └── quadros/
│       ├── gancho.ts                                # + localizarPosicao(quadros, chaveRef), linhasDaGrade com `atualId`
│       ├── gancho.test.ts
│       ├── GuardarChaveModal/                       # novo: Modal + EscolherGancho para um veículo do pátio
│       │   ├── GuardarChaveModal.tsx
│       │   ├── GuardarChaveModal.test.tsx
│       │   └── index.ts
│       └── EscolherGancho/
│           ├── EscolherGancho.tsx                   # props `atual?`, `rotuloPular?` (omitido = sem botão de adiar)
│           └── useEscolherGancho.ts                 # quadro inicial pelo atual; sem sugestão quando há `atual`
```

### Peças

- **`contarForaDoQuadro(veiculos)`**: `veiculos.filter((v) => !v.posicaoChave).length`. Puro, sobre o pátio inteiro (nunca sobre a lista filtrada).
- **`localizarPosicao(quadros, ref)`**: acha `{ patioQuadroId, patioQuadroChaveId }` do `ref`. Compara linha sem diferenciar caixa e coluna; se `ref.quadro` existe, exige o mesmo nome (sem diferenciar caixa). Devolve `null` se não achar.
- **`linhasDaGrade(quadro, selecionadoId, atualId?)`**: o `atualId` vira `estado: "ocupado"` com `legenda: "aqui"` (e nome acessível "A2, hoje com este veículo").
- **`EscolherGancho`**:
  - nova prop `atual?: ChaveRef | null`: o quadro inicial é o do gancho atual (via `localizarPosicao`) em vez do "mais livres"; sem sugestão; título do cartão "Chave hoje no A2" e instrução "Toque em um gancho livre para trocar"; botão **Escolha um gancho** desabilitado até haver `escolhido`.
  - nova prop `rotuloPular?: string`: na entrada continua "Escolher depois"; no modal do Pátio vira "Cancelar". Sem `onPular` o botão some. O efeito "sem quadros → `onPular()`" só roda quando `onPular` existe; no Pátio o modal nem abre sem quadros.
- **`GuardarChaveModal({ veiculo, onClose, onGuardado })`**: `Modal` `size="md"`, título "Guardar chave", com `EscolherGancho` (`patioId`, `placa`, `modelo`, `cor`, `atual={veiculo.chaveRef}`, `rotuloPular="Cancelar"`). `onGuardado` mostra o toast "Chave guardada no A2." e fecha. `closeOnBackdrop={false}` enquanto houver gancho escolhido ou envio em andamento.
- **`ChaveBotao({ veiculo, onGuardar })`**: `Button` `secondary` `sm`; rótulo e `aria-label` conforme a tabela do design; sem gancho mostra o ponto `warn` (`aria-hidden`) e o texto "Fora do quadro". `type="button"`, `data-chave-botao`.
- **`PatioView`**:
  - `const { data: quadros } = useQuadros();` e `comQuadros = (quadros?.length ?? 0) > 0` (erro ou carregando → `false`: o controle simplesmente não aparece, sem estado extra).
  - estado `chaveDe: PatioVeiculo | null` ao lado de `saida`; `usePatio({ pausado: saida !== null || chaveDe !== null })`.
  - indicador no `Resumo`, calculado de `todos` (não de `visiveis`): `StatusBadge tone="warn"` com `role="status"`, ou o texto "Todas as chaves no quadro", ou nada; sem quadros, o `Link` "Configurar quadro de chaves" se `useCan(AREA.QuadroChaves)`.
  - o modal entra no `extras` (mesma chave estável do modal de saída, para não ser recriado quando a lista troca de estado).
- **Atualização sem recarregar:** `useEscolherGancho` já invalida `PATIO_QUERY_KEY` e `QUADROS_QUERY_KEY` ao guardar. Como o Pátio estava pausado, o `invalidateQueries` força o refetch mesmo assim, e o card e o indicador mudam juntos.

### Server vs Client
Tudo Client Component, como o restante do Pátio (consultas, estado local, modal). Nenhuma rota nova.

## Decisões técnicas e trade-offs

- **Botão dentro do card em vez de coluna de ação.** Um controle só, na posição que o operador já olha, sem competir com "Registrar saída". Custo: a célula Veículo fica uma linha mais alta.
- **`chaveRef` ao lado de `posicaoChave`.** Os dois vêm do mesmo campo cru; manter o texto pronto evita remontar a string para exibir, e manter as partes evita parsear texto na UI. Se o back confirmar um formato só, um dos dois parsers some.
- **Contagem no cliente.** O back não oferece o número, e o Pátio já carrega a lista inteira (sem paginação), então contar é de graça e sempre coerente com o que está na tela.
- **Quadros com `useQuadros`, não via `GET /Patio`.** "Existe quadro?" é propriedade da empresa, não do veículo. A consulta é compartilhada (cache) com a entrada e a gestão.
- **Sem sugestão ao trocar** (ver "Ajuste ao design"): troca é intencional, guardar é guiado.
- **Sem otimismo.** O card só muda depois do refetch do Pátio, como na saída; conflito entre terminais é resolvido pelo servidor.
- **Sem abstração nova de "controle de lista".** Só um botão e um selo; extrair algo genérico seria prematuro.

## Riscos / pontos de atenção

- **Formato de `quadroChaves` (confirmado em 2026-10-27):** o back devolve `{ quadroChaveId, posicao: "B2", patioQuadroId, quadro: "Quadro 1" }`, ou nulo sem posição. O mapper lê esse formato e guarda os ids em `chaveRef`; o card mostra "Chave Quadro 1 · B2". O parágrafo a seguir é o risco original, hoje superado.
- **Formato de `quadroChaves` não confirmado (superado).** Hoje o mapper aceita texto e objeto. Se vier outro formato (ex.: só o id da posição), `chaveRef` fica `null`, o gancho atual não é marcado "aqui" (aparece só como ocupado) e o texto do card pode sumir. **[A CONFIRMAR com o back]**; sugestão: devolver `{ patioQuadroId, quadro, patioQuadroChaveId, linha, coluna }`, que dispensa o parser e a busca por nome.
- **Foco depois da saída (regressão provável).** `useFocoAposRemocao` pega o **primeiro `button`** da linha (`[data-patio-linha="id"] button`). Com o `ChaveBotao` na célula Veículo, esse passa a ser o botão da chave. O seletor precisa mirar o botão "Registrar saída" (ex.: `button[data-saida-botao]`, atributo a ser adicionado em `PatioLinha`), e o teste de foco existente deve cobrir isso.
- **Testes existentes do Pátio** (`PatioView*.test.tsx`, `PatioTabela.test.tsx`) passam a montar `useQuadros`: mockar `@/lib/api/services/quadroChaves` (`listQuadros → []`) ou o controle simplesmente não aparece em erro de rede, mas haverá chamada real do axios.
- **Nome do quadro no texto.** Se o back devolver `"Recepção · A2"` e o nome tiver o mesmo separador, o regex pode cortar errado; mitigado por exigir o final `linha+número` e casar a linha com os quadros reais.
- **Reordenação da lista** (ordenada por permanência) enquanto o modal está aberto: mitigado por pausar o refetch, mas o refetch pós-confirmação pode mover a linha; o foco volta ao botão do mesmo `patioId` (por `data-patio-linha`).
- **Lista longa:** o selo conta o pátio todo, não só as 100 linhas exibidas; deve haver teste com mais de 100 veículos.
- **Backend sem "retirar chave":** não há como desfazer; o operador só troca de gancho.

## Fora de escopo técnico

- Retirar a chave do quadro (sem endpoint).
- Filtro "fora do quadro" ao tocar no indicador (o selo não é clicável).
- Placa do veículo em cada gancho ocupado da grade (depende do back).
- Agir sobre várias chaves de uma vez.
- Notificações ou alertas sobre carros sem chave no quadro.
- Mudar a ordenação da lista do Pátio.
