# Tasks: Novo layout do Pátio, ticket e comprovante

Referências: ./prd.md, ./design.md, ./techspec.md

Regra geral: cada task termina com `npm run lint` limpo e os testes da área passando. Antes das tasks de rota (T10, T12, T13), reler os guias do Next citados no Tech Spec. Rodar `npm run build` ao fim de T9, T13 e T16.

## Fundação (tema, design system, regras puras)

- [x] T1 — Criar o token `colors.surfaceMuted` no tema
  - Arquivos: `src/styles/theme.ts`
  - Pronto quando: `ThemeColors`, `lightTheme` (`#ECE8DA`) e `darkTheme` (`#22304B`) têm o token; `tsc` sem erros; contraste do trilho contra `surface` conferido (se < 3:1, anotar a borda `border` como fallback para T6).

- [x] T2 — Adicionar os tons `avulso` e `mensal` ao `StatusBadge`
  - Arquivos: `src/components/ui/StatusBadge/StatusBadge.styles.ts`, `StatusBadge.tsx` (se o tipo exigir), `StatusBadge.test.tsx`
  - Pronto quando: `tone="avulso"` e `tone="mensal"` usam `colors.cliente.avulso|mensal` com texto `onPrimary`; os tons existentes não mudam; teste cobre os dois novos.

- [x] T3 — Regras puras de tipo em `patio.ts`
  - Arquivos: `src/components/patio/patio.ts`, `patio.test.ts`
  - Pronto quando: `contagemPorTipo(veiculos)` devolve `{ avulso, mensal }`; `rotuloTipo(veiculo)` devolve "Avulso" ou "Mensalista"; testes cobrem pátio vazio, só avulsos e misto; as funções existentes seguem passando.

- [x] T4 — Filtros na URL: `patioUrl.ts` e `usePatioFiltros`
  - Arquivos: `src/components/patio/patioUrl.ts`, `patioUrl.test.ts`, `src/components/patio/usePatioFiltros.ts`, `usePatioFiltros.test.tsx`
  - Pronto quando: `lerFiltros` converte a query string em `PatioFiltros` (valor inválido vira "todos"); `gravarFiltros` omite os padrões; `hrefDoTicket(patioId, filtros)` carrega os filtros; o hook mantém a busca local, grava na URL com `router.replace` depois de 250 ms e muda tipo/categoria/chave com `replace`; testes de ida e volta, valores inválidos e debounce.

- [x] T5 — Hooks de dados do detalhe
  - Arquivos: `src/components/patio/usePatioVeiculo.ts`, `useComprovanteTicket.ts`, `useEstacionamento.ts` (e testes `usePatioVeiculo.test.tsx`, `useComprovanteTicket.test.tsx`)
  - Pronto quando: `usePatioVeiculo(patioId)` devolve `{ veiculo, carregando, ausente }` a partir do cache de `usePatio` (ausente só depois da primeira carga); `useComprovanteTicket(token)` usa a chave `["patio","comprovante",token]`, `staleTime` 15 s, atualização a cada 30 s sem aba escondida, e fica desabilitado com `token` nulo; `useEstacionamento` expõe o nome de `getEmpresa` (campo confirmado em `CompanyData`) ou `null`; testes cobrem token nulo, erro e veículo ausente.

## Lista do Pátio

- [x] T6 — Bloco `PatioResumo` (vagas ocupadas e por tipo)
  - Arquivos: `src/components/patio/PatioView/PatioResumo.tsx`, `PatioView.styles.ts` (estilos do resumo), `PatioResumo.test.tsx`
  - Pronto quando: "Vagas ocupadas" mostra ocupadas/capacidade, barra com `role="img"` e rótulo "N% ocupado", "N livres" e a linha "Carros x/y · Motos x/y"; sem vagas cadastradas o bloco mostra só a contagem; "Por tipo" tem uma linha-botão (`aria-pressed`, nome "Filtrar por Avulso, 24 carros", alvo de 44px) por tipo presente, "Avulso 0" quando vazio, e tocar filtra/desfaz; animação da barra desligada em `prefers-reduced-motion`.

- [x] T7 — Reescrever `PatioFiltros` (busca + painel recolhível)
  - Arquivos: `src/components/patio/PatioView/PatioFiltros.tsx`, `PatioView.styles.ts`, `PatioFiltros.test.tsx`
  - Pronto quando: campo de busca "Placa, ticket ou tipo" (mantém `BUSCA_ID`); botão "Filtros N" abre/fecha o painel no celular e o painel fica sempre aberto a partir de `breakpoints.md`; painel tem categoria (chips), chave fora/dentro (só com quadros, ou com filtro ativo) e "Limpar filtros"; a barra de proporção e `Segmento` saem; testes cobrem contagem de filtros ativos e limpar.

- [x] T8 — `PatioCard` e `PatioLista`
  - Arquivos: `src/components/patio/PatioView/PatioCard.tsx`, `PatioLista.tsx`, `PatioView.styles.ts`, `PatioCard.test.tsx`, `PatioLista.test.tsx`
  - Pronto quando: o card é um único `Link` para `hrefDoTicket(...)` com placa em mono, permanência em destaque, modelo · cor ("—" quando ausentes), `StatusBadge` do tipo, chave ("Chave A1" ou "Fora do quadro" só se a empresa tem quadros), entrada em mono e nome acessível "Ver ticket do carro PLACA, tipo, permanência"; não há botão dentro do card; a lista é uma `ul` em grade (1 coluna no celular, 2 a partir de `md`, 3 a partir de `lg`) com "Mostrar mais N" (limite inicial 100); estados `:hover`/`:active` com `surfaceMuted`.

- [x] T9 — Reescrever `PatioView` e a página `/patio`
  - Arquivos: `src/components/patio/PatioView/PatioView.tsx`, `PatioView.styles.ts`, `src/app/(app)/patio/page.tsx`, `src/components/patio/index` (se houver), `PatioView.test.tsx`, `src/app/(app)/patio/page.test.tsx`
  - Pronto quando: a view compõe topo (marca, "Pátio", nome do estacionamento, hora sem região viva), `PatioResumo`, `PatioFiltros`, atualização ("Atualizado às" + "Atualizar"), `PatioLista`, gráficos em `details` e `IndicadorChaves`; estados carregando (esqueleto no formato novo), vazio ("Nenhum carro no pátio" + "Registrar entrada"), sem resultado ("Nenhum carro encontrado" + limpar), erro (`ListError`) e atualizando; a página envolve a view em `Suspense` com esqueleto; computador com resumo em 3 colunas; testes portados para a nova estrutura; `npm run lint` e `npm run build` passam.

- [x] T10 — Remover a tabela antiga e o que ficou órfão
  - Arquivos: `src/components/patio/PatioView/PatioTabela.tsx`, `PatioLinha.tsx`, `ChaveBotao.tsx` e seus testes; estilos sem uso em `PatioView.styles.ts` (`Area`, `Linha`, `ProporcaoBarra`, `Segmento`, etc.); `index.ts` da pasta
  - Pronto quando: nenhum import aponta para os removidos (`grep`); `categoriaIcons` e `ComprovanteLink` continuam apenas onde ainda são usados; lint, `tsc` e testes passam. Ficam fora desta remoção os testes de saída e de chave, que migram em T14.

## Detalhe do ticket

- [x] T11 — `TicketItens` e estilos do detalhe
  - Arquivos: `src/components/patio/TicketView/TicketItens.tsx`, `TicketView.styles.ts`, `TicketItens.test.tsx`
  - Pronto quando: lista "Entrada", "Tabela de preço" (`rotatividadeDescricao`), "Registrado por", "Sequencial"/"Ticket" e "Quadro de chaves" (etiqueta com a posição ou "Fora do quadro" + "Alterar"/"Guardar chave" com 44px, só com quadros); itens ausentes mostram "—"; **não** há item "Próxima faixa" nem tipo convênio.

- [x] T12 — `TicketView` (detalhe, ações e modais)
  - Arquivos: `src/components/patio/TicketView/TicketView.tsx`, `TicketView.styles.ts`, `TicketView.test.tsx`
  - Pronto quando: mostra veículo (placa em mono grande, modelo · cor · categoria, tipo), os dois destaques (permanência; valor de `useComprovanteTicket`, "Mensal" para mensalista, esqueleto enquanto carrega, "—" + "Tentar novamente" em erro), `TicketItens`, "Mostrar QR do ticket ao cliente" (só com `token`; sem ele, aviso "Comprovante indisponível") e "Registrar saída" (com o valor quando há cobrança); abre `SaidaVeiculoModal` com `buscaInicial` da placa e `GuardarChaveModal`, pausando `usePatio` enquanto um estiver aberto; saída concluída leva a `/patio?...&saiu=PLACA` com o `Toast`; cancelada mantém o detalhe; estados carregando, "Este carro não está mais no pátio" + "Voltar ao pátio" e erro; no celular as ações ficam fixas acima do menu inferior; no computador, duas colunas.

- [x] T13 — Rotas do detalhe e "Voltar"
  - Arquivos: `src/app/(app)/patio/[patioId]/page.tsx`, `loading.tsx` (se útil), botão Voltar em `TicketView.tsx`, `page.test.tsx` da rota
  - Pronto quando: `/patio/123` renderiza o detalhe (`params` com `await`; `patioId` não numérico chama `notFound()`); "Voltar" usa `router.back()` quando veio do Pátio e, no acesso direto, vai para `/patio` com os filtros guardados; recarregar a página mantém o detalhe; `npm run build` passa com as rotas novas.

- [x] T14 — Migrar os testes de saída e de chave para o detalhe e tratar o foco/anúncio da saída
  - Arquivos: `PatioView.saida.test.tsx` → `TicketView.saida.test.tsx`, `PatioView.chave.test.tsx` → `TicketView.chave.test.tsx`, `PatioView.tsx` (consumo de `?saiu=`), ajuste em `useFocoAposRemocao` (uso) se preciso
  - Pronto quando: ao voltar com `?saiu=PLACA`, a lista anuncia "PLACA saiu do pátio.", foca o primeiro card (ou a busca se a lista esvaziou) e remove o parâmetro com `replace` (não repete ao recarregar); testes cobrem saída concluída, cancelada, veículo já fora do pátio, guardar e alterar chave, e empresa sem quadros; nenhum teste antigo foi só apagado sem equivalente.

## Comprovante digital

- [x] T15 — `useWakeLock`
  - Arquivos: `src/components/patio/ComprovanteDigital/useWakeLock.ts`, `useWakeLock.test.tsx`
  - Pronto quando: pede `navigator.wakeLock.request("screen")` ao montar, solta ao desmontar e ao ficar escondido, pede de novo ao voltar a ficar visível; sem suporte ou com erro, não faz nada e não lança; testes cobrem sem suporte, perda de visibilidade e desmontagem.

- [x] T16 — `ComprovanteDigital` e rota
  - Arquivos: `src/components/patio/ComprovanteDigital/ComprovanteDigital.tsx`, `ComprovanteDigital.styles.ts`, `ComprovanteDigital.test.tsx`, `src/app/(app)/patio/[patioId]/comprovante/page.tsx`
  - Pronto quando: camada `fixed` em tela cheia acima do `Header` e do `BottomNav` (`z-index` conferido contra `Modal` e `Toast`), com `ThemeProvider` do `lightTheme`; mostra estabelecimento (razão social, CNPJ e telefone formatados, endereço; campos ausentes omitidos), "Comprovante Digital" como `h1`, `QrCode` com `${origin}/comprovante/${encodeURIComponent(token)}` (se o QR falhar, mostra o endereço em texto), placa, modelo · cor, entrada e ticket, e as duas instruções; "✕", "Pronto" e Esc voltam ao detalhe; foco inicial no `h1`; o foco retorna ao botão de origem; sem `token` mostra "Comprovante indisponível"; rota com `robots: { index: false }`; `npm run lint` e `npm run build` passam.

## Fechamento

- [ ] T17 — Verificação responsiva e de acessibilidade
  - Arquivos: ajustes pontuais nos estilos de `PatioView`, `TicketView` e `ComprovanteDigital`
  - Pronto quando: sem rolagem horizontal a partir de 320px nas três telas; alvos de 44px no celular; foco visível e navegação por teclado completas; contraste de 4,5:1 nos textos e nos selos e 3:1 na barra de ocupação, nos dois temas; conferido no navegador (skill `run`/`agent-browser`) em ~390px e em desktop, com pátio cheio, vazio e busca sem resultado.

- [ ] T18 — Regressão final
  - Arquivos: —
  - Pronto quando: `npm run lint`, a suíte de testes inteira e `npm run build` passam; `IndicadoresPatio` da home e as telas de entrada e saída seguem funcionando; nenhuma função do Pátio anterior se perdeu (checklist do PRD); `git status` não inclui `docs/specs/input.md` sem revisão do token.
