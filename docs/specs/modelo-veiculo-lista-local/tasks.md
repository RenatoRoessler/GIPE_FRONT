# Tasks: Campo Modelo com lista local de veículos

Referências: ./prd.md, ./techspec.md, ./design.md

- [x] T1 — Busca de modelos: criar helpers puros `normalizarBusca`, `filtrarModelos` (começa com → contém, limite 50) e `destacarTrecho`, com testes.
  - Arquivos: `src/lib/buscaModelo.ts`, `src/lib/buscaModelo.test.ts`
  - Pronto quando: testes cobrem acento, caixa, texto vazio, ordem (começa com antes de contém), limite e destaque; `npm run lint` e testes passam.

- [x] T2 — Serviço sem parâmetro: `listModelos(signal?)` chama `GET /Veiculo/modelos` sem `params`.
  - Arquivos: `src/lib/api/services/veiculo.ts`
  - Pronto quando: a chamada não envia `nome`; nenhum chamador passa `nome`; tipo `ModeloVeiculo[]` mantido.

- [x] T3 — Hook de dados: reescrever `useModelos()` (sem texto/debounce; `queryKey ["veiculo","modelos"]`, `staleTime`/`gcTime` infinitos, sem refetch no foco) e criar `useSugestoesModelo(texto)` que combina a lista com `filtrarModelos`.
  - Arquivos: `src/components/veiculos/useModelos.ts`, `src/components/veiculos/useSugestoesModelo.ts`, testes de ambos
  - Pronto quando: duas montagens do hook geram uma única chamada ao endpoint; digitar não gera chamadas; falha na consulta não lança erro para a tela e a próxima montagem tenta de novo.
  - Depende de: T1, T2

- [x] T4 — Carga ao abrir o sistema: chamar `useModelos()` no `AppShell` para disparar a consulta uma vez.
  - Arquivos: `src/components/layout/AppShell/AppShell.tsx`
  - Pronto quando: ao entrar na área logada ocorre 1 chamada a `Veiculo/modelos`, sem alterar o layout; testes do `AppShell` (se houver) continuam passando.
  - Depende de: T3

- [x] T5 — Componente `Combobox` do design system: campo de texto livre com lista no fluxo (não sobreposta), ARIA 1.2, teclado (↓ ↑ Home End Enter Esc Tab), toque sem perder foco, item 44px com trecho em negrito, estados vazio/carregando/erro/desabilitado, região `aria-live`.
  - Arquivos: `src/components/ui/Combobox/Combobox.tsx`, `Combobox.styles.ts`, `index.ts`, `Combobox.test.tsx`
  - Pronto quando: testes cobrem abrir ao digitar, navegar e escolher por teclado e clique, Esc, Enter sem item ativo (não intercepta), mensagem sem resultado, loading, desabilitado; só tokens do tema; lint passa.

- [x] T6 — `ComboboxField` no formulário: ligar o `Combobox` ao `useAppForm` (valor, blur, erro como no `TextField`) e registrá-lo no `useAppForm`.
  - Arquivos: `src/components/form/ComboboxField.tsx`, registro em `src/components/form/` (onde `TextField` é registrado)
  - Pronto quando: `field.ComboboxField` está disponível em `AppField` e exibe erro de validação igual ao `TextField`.
  - Depende de: T5

- [x] T7 — Entrada de veículo: trocar `TextField` + `<datalist>` por `ComboboxField` com `useSugestoesModelo`; remover `datalistId` e o `useModelos(texto)` antigo; manter `handleModeloChange` (categoria pelo nome exato) e `maxLength={60}`.
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx`, `EntradaVeiculoModal.test.tsx`
  - Pronto quando: sugestões aparecem desde 1 caractere, escolher preenche o modelo e a categoria, texto livre registra a entrada, campo usável com a lista vazia/falha; testes atualizados (mock com nova assinatura) passam.
  - Depende de: T3, T6

- [x] T8 — Cadastro de mensalista: trocar o `TextField` de Modelo de cada veículo por `ComboboxField` com `useSugestoesModelo`; sem preencher categoria.
  - Arquivos: `src/components/mensalistas/MensalistaModal/VeiculoItem.tsx`, `MensalistaModal.veiculos.test.tsx`
  - Pronto quando: cada veículo tem sugestões independentes, `maxLength={80}` mantido, salvar com modelo fora da lista funciona; testes passam.
  - Depende de: T3, T6

- [x] T9 — Atualizar o design: ajustar `design.md` (seção Comportamento/Responsividade) para lista no fluxo em vez de popover sobreposto, conforme decisão 3 do Tech Spec.
  - Arquivos: `docs/specs/modelo-veiculo-lista-local/design.md`
  - Pronto quando: o design descreve a lista no fluxo e não menciona popover absoluto nem z-index.

- [x] T10 — Verificação final: `npm run lint`, testes e `npm run build`; conferir manualmente no celular e no desktop (modal de entrada e de mensalista) que a lista não é cortada e que digitar não chama o endpoint.
  - Arquivos: —
  - Pronto quando: lint, testes e build passam; critérios de aceite do PRD verificados.
  - Depende de: T4, T7, T8, T9
