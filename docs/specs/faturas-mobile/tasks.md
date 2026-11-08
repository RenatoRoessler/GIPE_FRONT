# Tasks: Faturas otimizado para celular

Referências: ./prd.md, ./design.md, ./techspec.md

Regras para todas as tasks: seguir as skills `code-best-practices` e `styled-components-best-practices`; nenhum valor visual solto (só tokens do tema); testes em Vitest + Testing Library; os testes de computador já existentes continuam passando sem alteração. Ao fim de cada task, `npm run lint` e os testes da área tocada. Antes de mexer em roteamento, conferir `node_modules/next/dist/docs/` (AGENTS.md).

## Fundações (sem mudança visível)

- [x] T1 — Criar as funções puras de vencimento
  - Arquivos: `src/components/faturas/vencimento.ts`, `src/components/faturas/vencimento.test.ts`
  - Pronto quando: existem `LIMITE_PERTO_DE_VENCER_DIAS` (3), `diasParaVencer`, `avisoVencimento`, `ATALHOS_VENCIMENTO_DIAS`, `vencimentoEm` e `atalhoSelecionado`, conforme o Tech Spec; os testes cobrem ontem, hoje, amanhã, 3 e 4 dias, virada de mês e de ano, horário de verão, fatura paga e cancelada sem aviso, e atalho com e sem correspondência; testes passam.

- [x] T2 — Criar `resumoCiclo` em `format.ts`
  - Arquivos: `src/components/faturas/format.ts`, `src/components/faturas/format.test.ts` (criar se não existir; senão, ampliar)
  - Pronto quando: `resumoCiclo(fatura)` devolve "Emitida em 08/11 por Renato R.", "Paga em 12/11 · Pix · R$ 1.250,00" e "Cancelada em 15/11 por Renato R.", pulando partes ausentes (sem usuário, sem forma de pagamento); testes cobrem as três situações e os casos sem dado.

- [x] T3 — Adicionar o token `layout.fabClearance`
  - Arquivos: `src/styles/theme.ts`
  - Pronto quando: `layout.fabClearance` vale `"88px"` com comentário curto no padrão do arquivo; `npm run lint` e o build de tipos passam; Mensalistas não é alterado.

- [x] T4 — Ajustar `Modal`: rodapé com área segura
  - Arquivos: `src/components/ui/Modal/Modal.styles.ts`
  - Pronto quando: `Footer` usa `padding-bottom: calc(space[3] + env(safe-area-inset-bottom, 0px))`; `Modal.test.tsx` segue passando; sem mudança visível em computador.

- [x] T5 — Ajustar `Pagination`: alvo de toque
  - Arquivos: `src/components/ui/Pagination/Pagination.styles.ts`
  - Pronto quando: os botões de `Controls` têm `min-height: layout.touchTarget` dentro de `@media (pointer: coarse)`; o componente continua sem estourar a largura em 320 px; testes existentes passam.

- [x] T6 — Adicionar `hideLabel` ao `Select`
  - Arquivos: `src/components/ui/Select/Select.tsx`, `src/components/ui/Select/Select.styles.ts`, `src/components/ui/Select/Select.test.tsx` (criar se não existir)
  - Pronto quando: a prop opcional `hideLabel` (padrão `false`) oculta o rótulo só visualmente, mantendo `htmlFor` e o nome acessível; teste confirma `getByLabelText` com `hideLabel`; o comportamento sem a prop não muda.

- [x] T7 — Adicionar `columns` ao `OptionField`
  - Arquivos: `src/components/form/OptionField.tsx`
  - Pronto quando: `OptionFieldProps` inclui `columns` e o valor é repassado ao `OptionGroup`; usos existentes compilam sem mudança; `npm run lint` passa.

- [x] T8 — Criar o hook `useRolarAteAviso`
  - Arquivos: `src/components/faturas/useRolarAteAviso.ts`, `src/components/faturas/useRolarAteAviso.test.tsx`
  - Pronto quando: `useRolarAteAviso(ativo)` devolve uma `ref` e chama `scrollIntoView({ block: "nearest" })` quando `ativo` passa a `true`, sem animação; teste com `scrollIntoView` simulado cobre ativar, permanecer ativo e desativar.

## Lista

- [x] T9 — Criar os estilos móveis da feature
  - Arquivos: `src/components/faturas/FaturasMobile.styles.ts`
  - Pronto quando: exporta `ListaCartoes`, `CartaoFatura`, `CartaoSaida`, `EmitirFlutuante`, `BarraAcoes` e `LinhaFiltrando`, usando só tokens do tema (`EmitirFlutuante` no desenho de `NovoFlutuante` com `bottomNavReserved`; `BarraAcoes` `sticky` acima de `bottomNavReserved` no desenho do rodapé de Conferência, `z-index` abaixo da navegação); lint passa. Detalhes de variantes (vencida, cancelada) via transient props.

- [x] T10 — Criar `VencimentoAviso`
  - Arquivos: `src/components/faturas/VencimentoAviso/VencimentoAviso.tsx`, `src/components/faturas/VencimentoAviso/index.ts`, `src/components/faturas/VencimentoAviso/VencimentoAviso.test.tsx`
  - Pronto quando: recebe um `AvisoVencimento` e mostra ícone decorativo (`aria-hidden`) mais o texto, nos tons perigo, ênfase e neutro; o texto está sempre presente (nunca só cor); testes cobrem os quatro tipos.

- [x] T11 — Criar `FaturaCard`
  - Arquivos: `src/components/faturas/FaturaCard/FaturaCard.tsx`, `src/components/faturas/FaturaCard/index.ts`, `src/components/faturas/FaturaCard/FaturaCard.test.tsx`
  - Pronto quando: cartão com número, conveniada, `StatusBadge`, valor, `VencimentoAviso` (só aberta; paga e cancelada mostram "Vencimento dd/mm" neutro), "N saídas · emitida dd/mm"; cancelada com valor riscado; o número é o link esticado ao detalhe (`faturaUrl`); `aria-label` completo; fundo de perigo suave para vencida ou que vence hoje; testes cobrem os textos por situação e o `href`.

- [x] T12 — Criar `FiltrosFaturas`
  - Arquivos: `src/components/faturas/FiltrosFaturas/FiltrosFaturas.tsx`, `src/components/faturas/FiltrosFaturas/index.ts`, `src/components/faturas/FiltrosFaturas/FiltrosFaturas.test.tsx`
  - Pronto quando: em computador renderiza o mesmo bloco de hoje (Select "Conveniada" com "Todas" e `OptionGroup` de situação); no celular usa `OptionGroup` de 4 colunas, `Select` com `hideLabel` e opção "Todas as conveniadas", e a linha "Filtrando: …" com "Limpar" apenas com filtro ativo; trocar filtro chama `onChange` com página 1 e "Limpar" devolve `SEM_FILTROS`; testes nos dois arranjos (stub de `matchMedia`).

- [x] T13 — Usar `FiltrosFaturas` e o botão flutuante em `FaturasPage`
  - Arquivos: `src/components/faturas/FaturasPage/FaturasPage.tsx`, `src/components/faturas/FaturasPage/FaturasPage.test.tsx`
  - Pronto quando: a página usa `FiltrosFaturas`; no celular o botão do cabeçalho some e aparece `EmitirFlutuante` (que abre o mesmo modal), exceto no vazio sem filtro (o `EmptyState` já traz o botão); a página reserva `layout.fabClearance` no fim no celular; em computador nada muda; testes existentes passam e há novos para o celular.

- [x] T14 — `FaturasLista` em cartões no celular
  - Arquivos: `src/components/faturas/FaturasLista/FaturasLista.tsx`, `src/components/faturas/FaturasLista/FaturasLista.test.tsx`
  - Pronto quando: abaixo de `md` a `Table` dá lugar à lista de `FaturaCard` (com `hoje` calculado uma vez), esqueleto de 4 cartões e rolagem ao topo ao trocar de página; paginação e estados (carregando, vazio com e sem filtro, erro, 403, atualizando) funcionam como hoje; em computador a tabela e o clique na linha seguem iguais; testes existentes passam e novos cobrem o celular.

## Detalhe

- [x] T15 — Criar `AcoesFatura`
  - Arquivos: `src/components/faturas/AcoesFatura/AcoesFatura.tsx`, `src/components/faturas/AcoesFatura/index.ts`, `src/components/faturas/AcoesFatura/AcoesFatura.test.tsx`
  - Pronto quando: renderiza "Cancelar fatura" (secundário) e "Registrar pagamento" (primário) conforme `podeCancelar`/`podePagar`, chama `onCancelar`/`onPagar`, e não renderiza nada para fatura paga ou cancelada; testes cobrem as três situações.

- [x] T16 — Criar `ObservacaoFatura`
  - Arquivos: `src/components/faturas/ObservacaoFatura/ObservacaoFatura.tsx`, `src/components/faturas/ObservacaoFatura/index.ts`, `src/components/faturas/ObservacaoFatura/ObservacaoFatura.test.tsx`
  - Pronto quando: mostra "Obs.: …" limitada a 3 linhas no celular, com "Ver mais"/"Ver menos" (`aria-expanded`) só acima de 120 caracteres; em computador mostra o texto inteiro sem botão; sem observação não renderiza nada; testes cobrem curto, longo e alternância.

- [x] T17 — Criar `SaidaCard`
  - Arquivos: `src/components/faturas/SaidaCard/SaidaCard.tsx`, `src/components/faturas/SaidaCard/index.ts`, `src/components/faturas/SaidaCard/SaidaCard.test.tsx`
  - Pronto quando: mostra placa, modelo e categoria, entrada → saída, permanência, tabela de convênio, regra da conveniada, valor da conveniada em destaque e "Total … · Cliente …" com rótulos escritos; sem estado pressionado nem aparência de botão; teste confere todos os dados do RF10.

- [x] T18 — `ItensFatura` em cartões no celular
  - Arquivos: `src/components/faturas/ItensFatura/ItensFatura.tsx`, `src/components/faturas/ItensFatura/ItensFatura.test.tsx`
  - Pronto quando: abaixo de `md` mostra o cabeçalho "N saídas · R$ total", os `SaidaCard` e o rodapé "Total da fatura"; o total exibido confere com `fatura.valorTotal`; fatura cancelada e lista vazia mantêm os avisos; em computador a tabela segue igual; testes existentes passam e novos cobrem o celular.

- [x] T19 — `FaturaDetalhe` no celular
  - Arquivos: `src/components/faturas/FaturaDetalhe/FaturaDetalhe.tsx`, `src/components/faturas/FaturaDetalhe/FaturaDetalhe.test.tsx`
  - Pronto quando: no celular, o herói mostra `VencimentoAviso` (aberta) e `ObservacaoFatura`; o ciclo vira `Accordion` fechado com título "Ciclo da fatura" e resumo de `resumoCiclo`; `AcoesFatura` fica em `BarraAcoes` (último filho da página) só com fatura aberta, e os botões saem do herói; em `md` ou mais, herói com botões e cartão do ciclo como hoje; modais, Toast e voltar inalterados; testes existentes passam e novos cobrem aberta, paga e cancelada no celular.

## Fluxos

- [x] T20 — `EmitirFaturaModal` no celular
  - Arquivos: `src/components/faturas/EmitirFaturaModal/EmitirFaturaModal.tsx`, `src/components/faturas/EmitirFaturaModal/EmitirFaturaModal.test.tsx`
  - Pronto quando: no celular, `OptionGroup` "Prazo" (7, 15, 30 dias) abaixo do vencimento preenche a data e fica marcado só quando o valor coincide; observação com 3 linhas; o banner de erro rola até a vista (`useRolarAteAviso`); validações, envio e mensagens iguais às de hoje; em computador nada muda; testes cobrem os atalhos, a data digitada desmarcando o atalho e o erro "sem saídas a faturar" mantendo o modal aberto.

- [x] T21 — `PagarFaturaModal` no celular
  - Arquivos: `src/components/faturas/PagarFaturaModal/PagarFaturaModal.tsx`, `src/components/faturas/PagarFaturaModal/PagarFaturaModal.test.tsx`
  - Pronto quando: no celular, forma de pagamento por `field.OptionField` em 2 colunas (obrigatória, com o erro "Escolha a forma de pagamento."), aviso "Este pagamento não entra no caixa" logo abaixo do `Resumo`, e data recolhida atrás de "Data: agora · Alterar" (envio sem data quando não aberta); banner de erro com `useRolarAteAviso`; em computador `Select`, aviso no fim e campo de data visível como hoje; testes existentes passam e novos cobrem o celular.

- [x] T22 — Conferir `CancelarFaturaDialog` no celular
  - Arquivos: `src/components/faturas/CancelarFaturaDialog/CancelarFaturaDialog.tsx`, `src/components/faturas/CancelarFaturaDialog/CancelarFaturaDialog.test.tsx`
  - Pronto quando: no celular, "Manter fatura" (foco inicial) aparece **acima** do botão de perigo e ambos têm largura total e ≥ `layout.touchTarget`; se a ordem estiver invertida, ela é corrigida apenas no celular; testes existentes passam.

## Fechamento

- [ ] T23 — Verificação final
  - Arquivos: todos os tocados; `docs/specs/faturas-mobile/tasks.md`
  - Pronto quando: `npm run lint`, os testes do módulo (`src/components/faturas`, `ui/Modal`, `ui/Pagination`, `ui/Select`, `form`) e `npm run build` passam; o detector `impeccable detect --json` roda sobre os arquivos de UI alterados e os achados são tratados ou justificados; checklist dos critérios de aceite do PRD revisado em 360 e 390 px, temas claro e escuro, incluindo teclado aberto em cada campo, voltar preservando filtros e página, e a barra de ações sem faixa estranha acima da navegação; qualquer reprovação de RF11, RF13 ou RF15 registrada como follow-up conforme "Fora de escopo técnico" do Tech Spec.

> Status da T23 (mantida pendente): `npm run lint` (0 erros), testes do módulo e dos compartilhados (184 passam), `tsc`, `npm run build` e o detector do `impeccable` (sem achados) estão verdes. Falta a revisão visual manual em 360 e 390 px, nos temas claro e escuro, com teclado aberto em cada campo, o voltar preservando filtros e página, e a barra de ações sobre a navegação. Na suíte completa, `CaixaPage` e `MinhaEmpresa` (testes de 403) falham também sem estas mudanças.
