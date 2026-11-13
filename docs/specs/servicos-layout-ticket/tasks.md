# Tasks: Layout de Serviços no Ticket do Pátio

Referências: ./prd.md, ./techspec.md, ./design.md

Cada task termina com `npm run lint` e os testes da área tocada passando (`npx vitest run <caminho>`); rodar `npm run build` ao fim de T10 e T14. Commits por tipo/assunto (skill `commit`). Antes de tocar qualquer `page.tsx`, conferir `node_modules/next/dist/docs/` (AGENTS.md); este trabalho não deve precisar.

## Fase 0 — Confirmar o contrato

- [x] T1 — Confirmar com dado real se `valorAtual` inclui os serviços e quais campos o back devolve
  - Arquivos: `docs/specs/servicos-layout-ticket/techspec.md` (seção "Riscos" atualizada)
  - Pronto quando: com um veículo do pátio que tenha serviço (pedir ao dono do ambiente um exemplo ou autorização; **não gravar no ambiente sem ela**), está registrado no techspec (a) se `GET /Patio/comprovante/cliente` traz `valorAtual` com ou sem serviços, comparando com `valorServicos` e com a consulta de saída; (b) se o comprovante devolve `servicos`/`valorServicos`; (c) os nomes reais de `adicionadoEm`, `adicionadoPor`, `previsaoEm`, `prontoEm`. Sem dado disponível, registrar que as hipóteses do techspec seguem e seguir adiante.

## Fase 1 — Base de dados e regras puras

- [x] T2 — Rótulos de status "Na fila / Em andamento / Pronto"
  - Arquivos: `src/components/servicos/status.ts`, `status.test.ts`, `FilaServicos/FilaServicos.test.tsx`, `useFilaServicos.test.tsx`, `ServicosDoVeiculo/ServicosDoVeiculo.test.tsx`
  - Pronto quando: `STATUS_ROTULO` devolve "Na fila" para Aguardando e "Em andamento" para Em execução; textos de Toast (`avisoDeStatus`) e `aria-label` que citavam os rótulos antigos acompanham; a fila exibe os novos nomes nas colunas/abas; os códigos da API e os rótulos de ação ("Iniciar", "Marcar como pronto") não mudam; testes atualizados passam.

- [x] T3 — Tipos e mapper dos campos opcionais de serviço
  - Arquivos: `src/types/servico.ts`, `src/types/veiculo.ts`, `src/lib/api/services/servico.mapper.ts`, `servico.mapper.test.ts`
  - Pronto quando: `ServicoDoVeiculo` tem `adicionadoEm`, `adicionadoPor`, `previsaoEm`, `prontoEm` (todos `string | null`); existe `ServicoDoComprovante`; `ComprovanteCliente` tem `servicos?` e `valorServicos?`; `fromServicoDoVeiculo` lê os campos com os nomes tolerantes do techspec (ausente vira `null`); `fromServicosDoComprovante` descarta item inválido e cancelado; testes cobrem a forma com e sem os campos e item inválido; os testes existentes não quebram.

- [x] T4 — Serviços do comprovante no serviço HTTP
  - Arquivos: `src/lib/api/services/patio.ts`, `patio.test.ts`
  - Pronto quando: `consultarComprovante` e `consultarComprovantePorPlaca` passam `data.servicos` por `fromServicosDoComprovante`; resposta sem o campo devolve `servicos` indefinido sem erro; teste cobre resposta com e sem serviços; o tratamento de 404/400 continua igual.

- [x] T5 — Regras puras do ticket
  - Arquivos: `src/components/servicos/resumo.ts`, `resumo.test.ts`
  - Pronto quando: `resumirServicos` (ativos sem cancelados, pendentes = Na fila + Em andamento, prontos, subtotal vindo do back), `avisoDePendentes` (nulo para 0; singular e plural corretos) e `dividirValor` (estadia = total − serviços com piso em 0; ajustável para a hipótese contrária em um ponto só) existem e estão testadas, incluindo lista vazia, tudo cancelado e `valorAtual` menor que o subtotal.

- [x] T6 — Formatação da folha de adicionar
  - Arquivos: `src/components/servicos/format.ts`, `format.test.ts`
  - Pronto quando: `formatDuracaoNatural` devolve "cerca de 40 min", "cerca de 1h", "cerca de 1h30" e vazio para `null`; `formatCentavosOuGratis` devolve "Grátis" para 0 e o valor formatado nos demais; `formatDuracao` do catálogo segue igual; testes passam.

- [x] T7 — Atualização otimista do status também no ticket
  - Arquivos: `src/components/servicos/useAtualizarStatusServico.ts`, `useServicosDoVeiculo.test.tsx` (ou teste novo do hook)
  - Pronto quando: ao trocar o status, o item correspondente muda na hora nas consultas de `SERVICOS_DO_VEICULO_KEY` além da fila; se a API recusar, as duas famílias voltam ao estado anterior; `onSettled` continua invalidando pátio e fila; testes cobrem sucesso e rollback.

## Fase 2 — Folha de adicionar

- [x] T8 — Linha selecionável do serviço
  - Arquivos: `src/components/servicos/ServicoOpcao/ServicoOpcao.tsx`, `ServicoOpcao.styles.ts`, `index.ts`, `ServicoOpcao.test.tsx`
  - Pronto quando: a linha inteira alterna a seleção (≥ 44px, `<label>` com `<input type="checkbox">` nativo), mostra nome, descrição · duração natural e preço (ou "Grátis"); estado selecionado com realce por tokens do tema; desabilitada mostra "Não atende esta categoria" e "—"; teclado e leitor de tela funcionam (foco visível, rótulo acessível); sem cor ou espaço solto fora do tema.

- [x] T9 — Reescrever `AcrescentarServicosModal` como folha do mockup
  - Arquivos: `src/components/servicos/AcrescentarServicosModal/AcrescentarServicosModal.tsx` (+ `.styles.ts`), `ServicosDoVeiculo/ServicosDoVeiculo.test.tsx`
  - Pronto quando: usa `BottomSheet`; cabeçalho com placa e "Categoria · preços desta categoria" (novas props `placa` e `categoriaRotulo`); busca local por nome com `normalizarBusca` e foco inicial nela; lista de `ServicoOpcao` com seleção múltipla; rodapé com "N serviços selecionados", "+ R$ total" e botão "Adicionar ao ticket · + R$ X" (desabilitado sem seleção, "Adicionando..." ao enviar); estados de carregando, erro de catálogo, catálogo vazio, busca sem resultado (com "Limpar busca") e erro ao enviar (seleção preservada); Esc/✕ fecha sem adicionar; testes cobrem seleção, total, busca, "Grátis", erro e sucesso.

## Fase 3 — Cartão de serviços e detalhe no ticket

- [x] T10 — Linha do serviço no ticket
  - Arquivos: `src/components/servicos/ServicoLinha/ServicoLinha.tsx`, `ServicoLinha.styles.ts`, `index.ts`, `ServicoLinha.test.tsx`
  - Pronto quando: mostra nome (quebra em até 2 linhas), valor em fonte mono e pílula de status com ícone + texto (Na fila neutro, Em andamento `warn`, Pronto `success`); botão ⋮ com `aria-label` "Ações de {nome}" e alvo ≥ 44px; sem ⋮ quando o chamador não permite; nada estoura a largura (`min-width: 0`), sem rolagem horizontal em 320px; testes cobrem os três status e o clique no ⋮.

- [x] T11 — Detalhe do serviço
  - Arquivos: `src/components/servicos/ServicoDetalheSheet/ServicoDetalheSheet.tsx`, `ServicoDetalheSheet.styles.ts`, `index.ts`, `ServicoDetalheSheet.test.tsx`
  - Pronto quando: `BottomSheet` com nome, valor e "adicionado às HH:MM por X" (omite o que faltar); `OptionGroup` de status (Na fila / Em andamento / Pronto) ligado a `useAtualizarStatusServico`, desabilitado ao enviar e com erro visível ao falhar; "Remover serviço" (lixeira, `danger`) só para serviço Na fila e com `AREA.ServicosPatio`, abrindo o `CancelarServicoDialog` existente (motivo obrigatório); fora da fila mostra a explicação no lugar do botão; trocar status exige `AREA.Servicos`; testes cobrem trocar, erro, remover e a regra por status e permissão.

- [x] T12 — Reescrever o cartão `ServicosDoVeiculo` no layout do mockup
  - Arquivos: `src/components/servicos/ServicosDoVeiculo/ServicosDoVeiculo.tsx`, `ServicosDoVeiculo.styles.ts`, `ServicosDoVeiculo.test.tsx`
  - Pronto quando: cartão "Serviços adicionais" com estados do design (desligado → nada; carregando → `Skeleton`; erro → `ErrorBanner` + "Tentar novamente"; vazio → botão tracejado "Adicionar serviço"; com serviços → "Serviços · N", "Adicionar", linhas e "Subtotal serviços"); cancelados não aparecem; "Mostrar cancelados" e o resumo "tempo permitido / livre até" saem do ticket; sem `AREA.ServicosPatio` fica só leitura; abre a folha de adicionar (T9) e o detalhe (T11); avisa o `TicketView` quando uma folha abre ou fecha (para pausar o polling); testes cobrem cada estado e as permissões.

- [x] T13 — Valor, resumo e aviso de pendência no `TicketView`
  - Arquivos: `src/components/patio/TicketView/TicketView.tsx`, `TicketView.styles.ts`, `TicketView.test.tsx`
  - Pronto quando: o ticket usa `useServicosHabilitados` + `useServicosDoVeiculo` (mesma chave do cartão, sem pedido extra) e `resumirServicos`; com serviços, "Valor até agora" mostra o total e a linha "X estadia + Y serviços" via `dividirValor`; sem serviços, igual a hoje; mensalista continua "Mensal"; dentro de `Acoes`, acima dos botões, aparece o aviso `role="status"` de `avisoDePendentes` quando há pendente e some quando todos estão prontos; "Registrar saída" **nunca** é desabilitado por pendência e seu valor inclui os serviços; o polling do ticket pausa com a folha de serviços aberta; testes cobrem com e sem serviços, com pendente, todos prontos e mensalista.

- [ ] T14 — Revisão visual do ticket no celular e no desktop
  - Situação (2026-11-13): `npm run lint` (0 erros) e `npm run build` passam; **a conferência visual nos breakpoints e temas não foi feita** (não há sessão logada no ambiente para abrir o ticket). Falta alguém abrir o ticket com serviços e comparar com os mockups.
  - Arquivos: `src/components/patio/TicketView/*`, `src/components/servicos/*` (ajustes de estilo apenas)
  - Pronto quando: conferido em 320px, 390px, 768px e desktop, nos temas claro e escuro, contra as imagens `WhatsApp Image 2026-11-12 at 20.55.25.jpeg`, `2.jpeg`, `3.jpeg` e `4.jpeg` (ticket vazio, folha, ticket com serviços, detalhe): sem rolagem horizontal, rodapé de ações visível, alvos ≥ 44px, foco visível, Esc fecha só a folha e não o ticket; `npm run lint` e `npm run build` passam; diferenças aceitas em relação ao mockup anotadas no techspec.

## Fase 4 — Comprovante do cliente

- [x] T15 — Cartão "Seus serviços" do comprovante público
  - Arquivos: `src/components/veiculos/ComprovantePublico/ServicosDoComprovante.tsx`, `ServicosDoComprovante.styles.ts`, `ServicosDoComprovante.test.tsx`
  - Pronto quando: recebe `ServicoDoComprovante[]` e não renderiza nada se vazio ou indefinido; mostra "Seus serviços", "X de N prontos" com `ProgressBar` (`aria-label`) e uma linha por serviço com ícone, nome, status em texto, horário só quando existir ("Em andamento · previsão 22:20", "Pronto às 21:40") e valor; lista com `aria-live="polite"`; usa só tokens do tema; testes cobrem 0 serviços, parcial, todos prontos e horário ausente.

- [x] T16 — Valor e serviços no `ComprovantePublico`
  - Arquivos: `src/components/veiculos/ComprovantePublico/ComprovantePublico.tsx`, `ComprovantePublico.styles.ts`, `ComprovantePublico.test.tsx`
  - Pronto quando: com serviços, o bloco de valor ganha as linhas "Estadia" e "Serviços (N)" (via `dividirValor` com a soma dos serviços não cancelados) e o cartão `ServicosDoComprovante` entra entre o cartão de dados e as ações; sem serviços (ou sem o campo no back), a tela é idêntica à atual; PDF, recibo e demais consumidores de `ComprovanteCliente` não mudam; testes cobrem com e sem serviços e confirmam que nada quebra quando `servicos` não vem.

## Fase 5 — Fechamento

- [ ] T17 — Verificação final e registro
  - Situação (2026-11-13): lint (0 erros) e build passam; suíte completa com 4609 testes, 3 falhando de forma consistente e 1 instável, todos fora desta feature: `CaixaPage`, `MinhaEmpresa` e `UsuariosList` esperam o link "Ir para o início" em `/dashboard` e recebem `/` (`ErroSemPermissao`/`AcessoNegado`, não tocados aqui), e `MensalistaModal.veiculos` estoura o tempo só com a suíte inteira. O histórico de atualizações é gerado dos commits (`scripts/generate-changelog.mjs`): citar a mudança de rótulos no commit. Falta conferir os critérios do PRD com dado real (comprovante depende do back).
  - Arquivos: `docs/specs/servicos-layout-ticket/tasks.md`, `src/generated/changelog.json` (se o fluxo de changelog do projeto o exigir)
  - Pronto quando: `npm run lint`, a suíte de testes completa e `npm run build` passam; cada critério de aceite do `prd.md` está conferido (os do comprovante marcados como "dependente do back" se o endpoint ainda não devolver serviços); a mudança de rótulos de status consta no histórico de atualizações; o resultado de T1 está refletido no techspec.
