# Tasks: Preenchimento de Endereço pelo CEP na Adesão

Referências: ./prd.md, ./techspec.md

- [x] T1 — Criar o tipo `CepAddress` (`logradouro`, `bairro`, `cidade`, `estado`, todos `string`, vazio quando ausente).
  - Arquivos: `src/types/cep.ts`
  - Pronto quando: tipo exportado e `npx tsc --noEmit` sem erros.

- [x] T2 — Estender o `Input` do design system com as props opcionais `hint` e `hintTone` (`"muted" | "success" | "danger"`, padrão `"muted"`). O texto fica em `role="status"`, entra no `aria-describedby` e só aparece quando não há `error`. Usar apenas tokens do tema (`fontSizes.xs`, `colors.textMuted/success/danger`).
  - Arquivos: `src/components/ui/Input/Input.tsx`, `src/components/ui/Input/Input.styles.ts`
  - Pronto quando: `Input` sem `hint` renderiza igual a antes; com `hint` mostra o texto no tom pedido; com `error` e `hint` mostra só o erro; sem valores de cor soltos nos estilos.

- [x] T3 — Criar o serviço `fetchAddressByCep(cep, signal)`: `fetch` nativo (sem `api`/axios, sem credenciais, sem headers customizados) em `https://viacep.com.br/ws/{8 dígitos}/json/`, timeout próprio de 8 s combinado ao `signal` recebido, corpo validado com `zod` e mapeamento `localidade→cidade`, `uf→estado`. Retorna `CepAddress`; `null` para `{ erro: true }` ou 400; lança `ApiError` (`network`, `timeout`, `server`, `unknown`) nos demais casos; `AbortError` do chamador é repassado. `estado` fora de `ESTADOS` vira `""`.
  - Arquivos: `src/lib/api/services/cep.ts`
  - Pronto quando: um CEP existente devolve os 4 campos; `00000-000` devolve `null`; offline lança `ApiError` `network`; abortar o `signal` lança `AbortError`; nenhuma requisição leva o header `Authorization`.
  - Depende de: T1

- [x] T4 — Criar o hook `useCepLookup` com estado `idle | loading | found | not_found | error` (com `message`), `lookup(cep)` e `reset()`. Cada busca usa um `AbortController` e aborta a anterior; respostas abortadas não alteram o estado; busca pendente é abortada ao desmontar; sem retentativa. `lookup` devolve o endereço ou `null` (não encontrado, falha ou resposta obsoleta).
  - Arquivos: `src/hooks/useCepLookup.ts`
  - Pronto quando: duas buscas seguidas deixam só a segunda atualizar o estado; `reset` volta a `idle` e cancela a busca pendente; sem `setState` após desmontar.
  - Depende de: T3

- [x] T5 — Ligar o campo CEP de `CompanyStepFields` ao hook. No `onChange`: formatar como hoje; com CEP completo chamar `lookup`, senão `reset`. Ao resolver com endereço (e o CEP do formulário ainda for o consultado), aplicar com `setFieldValue` somente os campos não vazios entre `logradouro`, `bairro`, `cidade` e `estado`. Nunca tocar em `numero`. Passar `hint`/`hintTone` ao `Input` conforme o estado: "Buscando endereço…" (muted), "Endereço preenchido. Confira os dados." (success), "CEP não encontrado. Preencha o endereço manualmente." (danger), "Não foi possível buscar o endereço. Preencha manualmente." (danger).
  - Arquivos: `src/components/adesao/CompanyStepFields/CompanyStepFields.tsx`
  - Pronto quando: os critérios de aceite do PRD passam no roteiro manual do Tech Spec (itens 1 a 8); campos continuam editáveis e nenhum é desabilitado; foco permanece no CEP; o CPF do titular não foi alterado.
  - Depende de: T2, T4

- [ ] T6 — Verificação final: `npm run lint` e `npm run build` sem erros, e roteiro manual completo do Tech Spec (9 passos), incluindo o payload final da adesão inalterado.
  - Arquivos: nenhum (verificação)
  - Pronto quando: lint e build passam e os 9 passos do roteiro foram conferidos.
  - Depende de: T5
