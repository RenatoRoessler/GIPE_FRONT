# Tech Spec: Campo Modelo com lista local de veículos

## Referências
- PRD: ./prd.md
- Design: ./design.md (resumido na seção "Design" abaixo)

## Design
- Telas/estados: campo Modelo do modal Registrar entrada (`EntradaVeiculoModal`) e de cada veículo do cadastro de mensalista (`VeiculoItem`). Estados: repouso, digitando com sugestões, sem resultado, carregando a lista, falha (silenciosa), erro de validação, desabilitado.
- Componentes do design system reaproveitados: estilos de `Field`, `Label`, `StyledInput` e `ErrorText` de `ui/Input/Input.styles.ts`; `Skeleton` para a linha "Carregando modelos…".
- Componentes novos:
  - `src/components/ui/Combobox/` (`Combobox.tsx`, `Combobox.styles.ts`, `index.ts`, `Combobox.test.tsx`): campo de texto livre com lista de sugestões, padrão ARIA 1.2.
  - `src/components/form/ComboboxField.tsx`: liga o `Combobox` ao `useAppForm`, como o `TextField`.
- Tokens de tema: nenhum novo. Ver tabela do design. A lista fica **dentro do fluxo** (ver decisão 3), então não há token de z-index.

## Arquitetura da solução

### Dados (a lista inteira, uma vez)
- `src/lib/api/services/veiculo.ts`: `listModelos(signal?)` deixa de receber `nome` e chama `GET /Veiculo/modelos` sem `params`. Retorno continua `ModeloVeiculo[]` (`src/types/veiculo.ts`, sem mudança).
- `src/components/veiculos/useModelos.ts` é reescrito. Sem `texto`, sem debounce:
  - `useModelos()` → `useQuery({ queryKey: ["veiculo", "modelos"], queryFn: ({ signal }) => listModelos(signal), staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false })`. A lista vive no cache do React Query durante a sessão da aba; recarregar a página busca de novo (decisão 1).
  - Retorna também `modelos` já normalizados para busca (ver filtro), via `select` memoizado: `{ ...modelo, chave: normalizarBusca(modelo.nome) }`, para não normalizar 1 vez por tecla.
- **Carga ao abrir o sistema**: `AppShell` (já `"use client"`, envolve toda a área logada) chama `useModelos()` uma vez, só para disparar a consulta. Sem tela de loading; falha não é exibida. Como os campos usam a mesma `queryKey`, compartilham o cache e não geram nova chamada. Se a consulta falhar, o retry padrão do `createQueryClient` (até 3) vale; depois disso, o próximo `useModelos()` montado (ao abrir um modal) refaz a tentativa por ser consulta em erro sem dados — atende RF7 sem código extra.

### Filtro
- `src/lib/buscaModelo.ts` (novo, puro, testável): 
  - `normalizarBusca(texto)`: `trim`, `toLowerCase`, `normalize("NFD")` e remoção de marcas diacríticas.
  - `filtrarModelos(modelos, texto, limite = 50)`: retorna os que **começam** com o texto normalizado, depois os que **contêm**, preservando a ordem da lista dentro de cada grupo, cortado em `limite`. Texto vazio → `[]`.
  - `destacarTrecho(nome, texto)`: devolve `{ antes, casado, depois }` usando o índice da `chave` normalizada (a normalização NFD sem diacríticos mantém o comprimento dos caracteres base; casos em que o comprimento diverge caem em "sem destaque").
- Sem dependência nova (`es-toolkit` só se já houver helper útil; não é necessário).

### Combobox (`ui/Combobox`) — Client Component
- API: `label`, `value`, `onChange(texto)`, `onSelect?(opção)`, `options: { id: string | number; label: string; destaque?: {antes; casado; depois} }[]`, `loading?`, `maxLength`, `disabled`, `error`, `placeholder`, `emptyText?`. O componente **não filtra**: recebe `options` já filtradas (quem usa decide), para continuar genérico no design system.
- Estrutura: `Field` > `Label` + `StyledInput` (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant`) + `Listbox` (`ul role="listbox"`) + região `aria-live="polite"` visualmente escondida com a contagem.
- Estado interno: `aberto`, `ativo` (índice). Abre ao digitar e com ↓; fecha com Esc, Tab, blur (com `onMouseDown`/`onPointerDown` `preventDefault` nos itens para o clique não perder o foco antes de escolher) e depois de escolher.
- Teclado: ↓/↑ (circular), Home/End, Enter (escolhe o ativo; sem ativo, **não** intercepta, o formulário submete como hoje), Esc. `scrollIntoView({ block: "nearest" })` no item ativo.
- Item: altura mínima 44px, trecho casado em `fontWeights.bold`; ativo com `colors.primarySofter`.
- Estilos em `Combobox.styles.ts` com transient props (`$active`, `$hasError`), reexportando/compondo de `Input.styles.ts` para não duplicar o visual do campo.
- Props de `input` repassadas (`autoComplete="off"`, `enterKeyHint`) via `...rest`, com `ref` encaminhado.

### Campo de formulário
- `components/form/ComboboxField.tsx`: `useFieldContext<string>()`, erro como no `TextField`; recebe `options`, `loading`, `onSelect`, e demais props do `Combobox`. Registrado em `components/form/form.ts(x)` como `ComboboxField` (mesmo ponto onde `TextField` é registrado).

### Telas
- `EntradaVeiculoModal.tsx`:
  - Remove `useModelos(modeloTexto)`, `modelosRef`, `<datalist>` e `datalistId`; usa `const { data: modelos, isPending } = useModelos()` e `useMemo(() => filtrarModelos(modelos ?? [], modeloTexto), …)`.
  - Mantém `useStore(form.store, … modelo)` para o texto, e `handleModeloChange` (casa por nome exato e define a categoria). O `modelosRef` continua necessário só se o listener de campo capturar uma closure antiga; manter o padrão atual, apontando para `modelos`.
  - Campo vira `field.ComboboxField label="Modelo" maxLength={60}`.
- `VeiculoItem.tsx`: o campo vira `field.ComboboxField`. Como `VeiculoItem` é `withForm` e não tem o texto do modelo em mãos, usa `form.useStore` do valor `veiculos[index].modelo`, ou, preferível, o próprio `ComboboxField` recebe `modelos` e filtra internamente via helper `useSugestoesModelo(texto)` (hook novo em `components/veiculos/useSugestoesModelo.ts` que combina `useModelos` + `filtrarModelos`). **Decisão**: criar `useSugestoesModelo(texto)` e usá-lo nas duas telas, deixando `useModelos` só para dados.
- Mensalista **não** preenche categoria a partir do modelo (fora do escopo; a categoria vem do tipo de mensalidade ou do select).

### Server vs Client
Tudo é Client Component (`"use client"`): `Combobox`, `ComboboxField`, hooks. `AppShell` já é client; nenhuma mudança em Server Components.

## Decisões técnicas e trade-offs
1. **Cache em memória (React Query), não `localStorage`.** "Deixar salva" no PRD = carregada uma vez e reaproveitada. Em memória com `staleTime/gcTime: Infinity` cumpre as métricas (1 chamada por carregamento) sem invalidação, versão ou limite de tamanho do storage. Contra: cada recarga da página rebusca a lista completa. Se o volume (milhares de modelos) tornar isso lento, o próximo passo é persistir em `localStorage` com `@tanstack/react-query-persist-client` ou ETag; deixado fora até haver medição.
2. **Filtro no cliente, `options` já filtradas no `Combobox`.** Mantém o componente do design system genérico; a regra de busca por modelo mora em `lib/buscaModelo.ts`, testável sem DOM.
3. **Lista dentro do fluxo, não em popover absoluto.** O `Modal` é um `<dialog>` com `overflow: hidden` e o corpo com `overflow-y: auto` (`Modal.styles.ts`), o que cortaria um popover absoluto, e portal para fora do `<dialog>` ficaria atrás dele (top layer). A lista como bloco abaixo do campo (`position: static`, `max-height` ~240px com rolagem interna) é segura em modal, no celular com teclado virtual e em qualquer pai com overflow. Custo: empurra os campos abaixo enquanto aberta; aceitável porque fecha ao escolher. **Isso ajusta o design.md**, que previa popover sobreposto; atualizar a seção "Comportamento" do design ao implementar.
4. **Combobox próprio, sem biblioteca.** O projeto não usa Radix/Headless UI nos componentes `ui`, e o escopo é pequeno; evita dependência. O padrão ARIA é coberto por testes.
5. **Texto livre como padrão.** `Enter` sem item ativo não intercepta, e nada valida contra a lista; o backend segue recebendo `modelo` como texto (como hoje).

## Riscos / pontos de atenção
- **Tamanho da resposta**: a lista inteira pode ser grande e é pedida no carregamento. Medir o tempo/tamanho no ambiente real; renderizar no máximo 50 itens evita custo de DOM.
- **Contrato do backend**: confirmar que `GET /Veiculo/modelos` sem parâmetros devolve `ModeloVeiculo[]` no mesmo formato (`modeloId`, `nome`, `categoria`). Se vier outro formato, só `listModelos` muda.
- **Chamadas antigas com `nome`**: o backend pode ignorar ou rejeitar o parâmetro `nome`; removê-lo no mesmo deploy.
- **Foco/teclado em celular**: o clique em item não pode causar blur antes de `onSelect`; coberto por `preventDefault` no pointer down e por teste.
- **Listener de `modelo` na entrada** (`handleModeloChange`) depende da lista; com lista carregada uma vez deixa de haver janela de lista desatualizada, mas ainda deve tolerar lista ausente (carregando/falha).
- **Testes existentes**: `EntradaVeiculoModal.test.tsx` mocka `listModelos` com `mockResolvedValue([])` e `MensalistaModal.veiculos.test.tsx` renderiza o campo; ambos devem ser ajustados (assinatura nova, ausência do `<datalist>`).

## Fora de escopo técnico
- Persistência da lista entre recargas (`localStorage`/IndexedDB) e revalidação por versão.
- Alterações no backend.
- Preencher categoria a partir do modelo no cadastro de mensalista.
- Virtualização da lista (limite de 50 resultados basta).
- Outros campos com sugestão (cor, categoria).
