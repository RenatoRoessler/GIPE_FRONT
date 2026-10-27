# Tasks: Quadro de Chaves

Referências: ./prd.md, ./techspec.md, ./design.md

Cada task termina com `npm run lint` limpo e seus testes passando (vitest).

## Base de dados e API

- [x] T1 — Criar os tipos do quadro de chaves
  - Arquivos: `src/types/quadroChaves.ts`
  - Pronto quando: `PosicaoQuadro`, `LinhaQuadro`, `QuadroChaves`, `LinhaQuadroPayload`, `QuadroChavesPayload`, `ChaveEscolhida`, `EstadoGancho` e `QuadroFormValues` existem e compilam.

- [x] T2 — Criar o serviço de API e o mapper do quadro de chaves
  - Arquivos: `src/lib/api/services/quadroChaves.ts`, `src/lib/api/services/quadroChaves.mapper.ts`, `quadroChaves.test.ts`, `quadroChaves.mapper.test.ts`
  - Pronto quando: existem `listQuadros`, `criarQuadro`, `acrescentarPosicoes`, `escolherQuadroChave`, `excluirPosicao` e `inativarQuadro` chamando os endpoints do techspec; o GET tolera campos ausentes ou fora do formato; testes cobrem sucesso, 400 (ocupado/nome duplicado/quadro com veículos) e 404.

- [x] T3 — Lógica pura de ganchos
  - Arquivos: `src/components/quadros/gancho.ts`, `src/components/quadros/gancho.test.ts`
  - Pronto quando: `rotuloLinha`, `rotuloGancho`, `gerarPayload` (omite colunas fora de uso e linhas vazias), `diffAcrescimo`, `sugerirGancho` e `escolherQuadroInicial` funcionam e têm testes (inclui B6 fora de uso e quadro lotado).

- [x] T4 — Schema de validação do formulário
  - Arquivos: `src/lib/schemas/quadroChaves.ts`, teste
  - Pronto quando: `quadroFormSchema` valida nome (1–100), linhas (1–26), colunas (1–255), ao menos um gancho em uso e o limite de 600 posições, com mensagens em português.

- [x] T5 — Chave de query e hook da lista
  - Arquivos: `src/components/quadros/quadrosKeys.ts`, `src/components/quadros/useQuadros.ts`, teste
  - Pronto quando: `useQuadros` carrega a lista com staleTime de 15 s e refetch no foco; teste confirma que invalidar `QUADROS_QUERY_KEY` recarrega.

## Componentes de design system

- [x] T6 — `NumberStepper`
  - Arquivos: `src/components/ui/NumberStepper/*`
  - Pronto quando: controlado, com min/max, botões de 44px desabilitando nos limites, `role="spinbutton"` com `aria-valuenow/min/max` e dica de intervalo; teste de clique, limites e teclado.

- [x] T7 — `KeyBoardGrid`
  - Arquivos: `src/components/ui/KeyBoardGrid/*`
  - Pronto quando: renderiza linhas e colunas nos estados livre/selecionado/ocupado/fora; modo `configurar` alterna fora de uso e modo `escolher` seleciona só livres; navegação por setas, nome acessível por gancho ("A2, livre"), rolagem horizontal com rótulos de linha fixos; só tokens do tema; testes de estados, seleção e teclado.

## Permissão e navegação

- [x] T8 — Área, rota e item de menu "Quadros de chaves"
  - Arquivos: `src/lib/permissoes.ts`, `src/lib/nav.ts`, `src/components/layout/BottomNav/BottomBarIcons.tsx` (ícone `keys`), `src/lib/permissoes.test.ts`, `src/lib/nav.test.ts`
  - Pronto quando: `AREA.QuadroChaves` existe com padrão Administrador e Gerente, a rota `/quadros-chaves` está mapeada, o item aparece no menu para esses perfis e não aparece para os demais; testes atualizados.

## Telas de gestão

- [x] T9 — Lista de quadros
  - Arquivos: `src/app/(app)/quadros-chaves/page.tsx`, `src/components/quadros/QuadrosLista/*`
  - Pronto quando: mostra cards com nome e "N ganchos · X livres", estados carregando/vazio/erro, ação Novo quadro e Adicionar posições só para quem tem permissão; teste dos estados.

- [x] T10 — Inativar quadro e excluir posição
  - Arquivos: `src/components/quadros/QuadrosLista/*` (ações e `ConfirmDialog`)
  - Pronto quando: inativar pede confirmação, e quando o back devolve 400 mostra as placas com as chaves no pátio com botão "Entendi"; sucesso invalida a lista e mostra `Toast`; testes cobrem permitido e bloqueado.

- [x] T11 — Formulário de configurar quadro (criar)
  - Arquivos: `src/components/quadros/QuadroForm/*`, `src/app/(app)/quadros-chaves/novo/page.tsx`
  - Pronto quando: nome, steppers de linhas/colunas (padrão 3×4), prévia com contagem e toque para fora de uso, "Adicionar outro quadro" e Salvar; erro do servidor em `ErrorBanner`; Salvar desabilitado com todos fora de uso; testes de prévia, payload enviado e erro de nome duplicado.

- [x] T12 — Acrescentar posições a quadro existente
  - Arquivos: `src/components/quadros/QuadroForm/*`, `src/app/(app)/quadros-chaves/[id]/posicoes/page.tsx`
  - Pronto quando: nome somente leitura, tamanho inicial igual ao atual, posições existentes bloqueadas na prévia e só as novas enviadas; teste do payload.

## Entrada de veículos e pátio

- [x] T13 — Etapa "Escolher gancho"
  - Arquivos: `src/components/quadros/EscolherGancho/*` (componente e `useEscolherGancho`)
  - Pronto quando: cartão do veículo, seletor de quadro (se houver mais de um), sugestão pré-selecionada, troca por toque, texto "Guardar no gancho X", estados lotado/enviando/erro; conflito mostra a placa ocupante, recarrega e volta à sugestão; sem quadros chama `onPular`; testes cobrem esses casos.

- [x] T14 — Encaixar a etapa na entrada de veículos
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx`, `EntradaVeiculoModal.test.tsx`
  - Pronto quando: fluxo formulário → gancho → recibo; fechar na etapa de gancho vale como pular; escolher invalida `PATIO_QUERY_KEY` e `QUADROS_QUERY_KEY`; testes existentes passam com a lista vazia mockada e há teste novo do fluxo com quadro.

- [x] T15 — Posição da chave no card do pátio
  - Arquivos: `src/types/patio.ts`, `src/lib/api/services/patio.ts`, `src/lib/api/services/patio.list.test.ts`, `src/components/patio/PatioView/*`
  - Pronto quando: `PatioVeiculo.posicaoChave` é lido de `quadroChaves` tolerando texto ou objeto e exibido no card quando existir; o teste que dizia que o campo não é lido é atualizado. Formato do campo a confirmar com o back.

- [x] T16 — Saída de veículo libera o gancho na tela
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/*`
  - Pronto quando: registrar a saída também invalida `QUADROS_QUERY_KEY`; teste confirma a invalidação.

## Fechamento

- [ ] T17 — Verificação final
  - Arquivos: —
  - Pronto quando: `npm run lint`, `npm test` e `npm run build` passam; fluxo conferido no navegador a 390px (configurar um quadro, dar entrada, escolher gancho, ver no pátio, dar saída e ver o gancho livre) e checados os critérios de aceite do PRD.
  - Status: lint (0 erros), `npm test` (2427 testes) e `npm run build` passaram. Falta a conferência manual no navegador a 390px, que depende do back (`localhost:5000`) no ar.
