# Tasks: Quadro de chaves na tela do Pátio

Referências: ./prd.md, ./techspec.md, ./design.md

Cada task termina com `npm run lint` limpo e seus testes passando (vitest).

## Dados

- [x] T1 — Ler a posição da chave em partes (`chaveRef`)
  - Arquivos: `src/types/patio.ts`, `src/lib/api/services/patio.ts`, `src/lib/api/services/patio.list.test.ts`
  - Pronto quando: `PatioVeiculo` tem `chaveRef?: ChaveRef | null`; `fromPatioResponse` preenche `chaveRef` a partir de objeto (`quadro`/`nome`, `linha`, `coluna`) e de texto ("A2", "Recepção · A2"); formato desconhecido ou vazio vira `null`; `posicaoChave` continua igual; testes cobrem texto, objeto, com e sem nome do quadro e formatos inválidos.

- [x] T2 — Contar veículos fora do quadro
  - Arquivos: `src/components/patio/patio.ts`, `src/components/patio/patio.test.ts`
  - Pronto quando: `contarForaDoQuadro(veiculos)` conta os sem `posicaoChave` (nulo, ausente ou vazio) sobre a lista que receber; teste com lista vazia, todos no quadro e mistura.

- [x] T3 — Localizar o gancho atual na grade
  - Arquivos: `src/components/quadros/gancho.ts`, `src/components/quadros/gancho.test.ts`
  - Pronto quando: `localizarPosicao(quadros, ref)` devolve `{ patioQuadroId, patioQuadroChaveId }` comparando linha sem diferenciar caixa e coluna, e exigindo o nome do quadro quando `ref.quadro` existir; `linhasDaGrade` aceita `atualId` e marca esse gancho como `ocupado` com legenda "aqui"; testes cobrem achou, não achou, nome de quadro divergente e vários quadros.

## Escolha de gancho

- [x] T4 — Adaptar o `EscolherGancho` para trocar a chave de um veículo
  - Arquivos: `src/components/quadros/EscolherGancho/EscolherGancho.tsx`, `src/components/quadros/EscolherGancho/useEscolherGancho.ts`, `src/components/quadros/EscolherGancho/EscolherGancho.test.tsx`
  - Pronto quando: com `atual`, o quadro inicial é o do gancho atual, não há sugestão, o cartão diz "Chave hoje no A2", o gancho atual aparece como "aqui" e o botão principal fica "Escolha um gancho" desabilitado até tocar em um livre; `onPular` e `rotuloPular` são opcionais (sem `onPular` o botão de adiar some e o efeito "sem quadros" não roda); o comportamento da entrada não muda e seus testes seguem passando; testes novos cobrem a troca.

- [x] T5 — Modal "Guardar chave"
  - Arquivos: `src/components/quadros/GuardarChaveModal/GuardarChaveModal.tsx`, `index.ts`, `GuardarChaveModal.test.tsx`
  - Pronto quando: abre um `Modal` com título "Guardar chave" para um `PatioVeiculo`, usa `EscolherGancho` com `atual={veiculo.chaveRef}` e "Cancelar" como saída; ao guardar chama `onGuardado` com a chave escolhida; não fecha pelo fundo com gancho escolhido ou envio em andamento; testes cobrem guardar, trocar, cancelar e conflito (placa que ocupa).

## Tela do Pátio

- [x] T6 — Botão da chave no card
  - Arquivos: `src/components/patio/PatioView/ChaveBotao.tsx`, `ChaveBotao.test.tsx`, `PatioView.styles.ts`
  - Pronto quando: renderiza "Chave A2" (ou "Chave Recepção · A2") com `aria-label` "Trocar a chave de ABC1D23, hoje no gancho A2", ou "Guardar chave" com o texto "Fora do quadro" e ponto `warn` decorativo e `aria-label` "Guardar a chave de ABC1D23 no quadro"; altura de toque de 44px no celular; só tokens do tema; teste dos dois estados e do clique.

- [x] T7 — Encaixar o botão na linha e na tabela
  - Arquivos: `src/components/patio/PatioView/PatioLinha.tsx`, `PatioTabela.tsx`, `PatioTabela.test.tsx`
  - Pronto quando: a célula Veículo troca o texto "Chave: A2" pelo `ChaveBotao` quando `comQuadros` é verdadeiro e não mostra nada de chave quando é falso; `PatioLinha` e `PatioTabela` repassam `comQuadros` e `onGuardarChave`; o botão "Registrar saída" ganha `data-saida-botao`; testes atualizados (o do "Chave: A2" muda para o novo botão).

- [x] T8 — Foco depois da saída mira o botão certo
  - Arquivos: `src/components/patio/PatioView/PatioView.tsx`, `PatioView.saida.test.tsx`
  - Pronto quando: o `alvoDe` de `useFocoAposRemocao` usa `[data-patio-linha="id"] [data-saida-botao]` em vez do primeiro `button`; teste confirma que, com o botão da chave presente, o foco vai para "Registrar saída" do vizinho.

- [x] T9 — Indicador "fora do quadro" e modal no `PatioView`
  - Arquivos: `src/components/patio/PatioView/PatioView.tsx`, `PatioView.styles.ts`
  - Pronto quando: usa `useQuadros` (`comQuadros` falso em erro ou carregando); o resumo mostra `StatusBadge warn` "N fora do quadro" (singular para 1), "Todas as chaves no quadro" com zero, nada sem quadros e, para quem tem `AREA.QuadroChaves`, o link "Configurar quadro de chaves"; a contagem usa o pátio inteiro e ignora busca e filtros; `chaveDe` abre o `GuardarChaveModal` no `extras`; o refetch automático pausa com o modal aberto; ao guardar, o `Toast` aparece e o card e o indicador atualizam.

- [x] T10 — Testes do fluxo no Pátio e ajustes dos testes existentes
  - Arquivos: `src/components/patio/PatioView/PatioView.chave.test.tsx` (novo), `PatioView.test.tsx`, `PatioView.saida.test.tsx`
  - Pronto quando: os testes existentes mockam `@/lib/api/services/quadroChaves` (`listQuadros → []`) e continuam passando; o arquivo novo cobre guardar a chave de um carro sem gancho, trocar de gancho (liberando o antigo), conflito, indicador com mais de 100 veículos, indicador ignorando filtros, empresa sem quadros (nada aparece, link de configurar só para quem gerencia) e atualização do contador depois de guardar.

## Fechamento

- [ ] T11 — Verificação final
  - Arquivos: —
  - Pronto quando: `npm run lint`, `npm test` e `npm run build` passam; fluxo conferido no navegador a 390px (carro sem chave → Guardar chave → card e indicador mudam; trocar de gancho; empresa sem quadros) com o back no ar; critérios de aceite do PRD checados.
  - Status: lint (0 erros), `npm test` (2464 testes) e `npm run build` passaram. Falta a conferência manual no navegador a 390px, que depende do back (`localhost:5000`) no ar.
