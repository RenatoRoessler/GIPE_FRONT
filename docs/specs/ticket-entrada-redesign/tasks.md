# Tasks: Redesenho do ticket de entrada

Referências: ./prd.md, ./design.md, ./techspec.md, ./prototipo-v5.html

- [x] T1 — `Modal`: nova prop `titleAlign?: "start" | "center"` (padrão `"start"`). Com `"center"`, o `Header` vira grid `36px minmax(0, 1fr) 36px`, com espaçador `aria-hidden` antes do título, e o título fica centralizado e truncado com reticências. A largura de 36px vira uma constante compartilhada com o `CloseButton`.
  - Arquivos: `src/components/ui/Modal/Modal.tsx`, `src/components/ui/Modal/Modal.styles.ts`, `src/components/ui/Modal/Modal.test.tsx`
  - Pronto quando: sem a prop, o cabeçalho de todos os modais não muda; com `"center"`, o diálogo continua nomeado pelo título e "Fechar" continua acessível (teste novo passando); `npm run lint` sem erros.

- [x] T2 — Serviços do veículo no visual do protótipo: `Secao` sem `box-shadow` e com `radii.lg`; `BotaoVazio` com `radii.md`, `fontSizes.sm` e `fontWeights.medium`; remover o ícone `Gota` do título.
  - Arquivos: `src/components/servicos/ServicosDoVeiculo/ServicosDoVeiculo.styles.ts`, `src/components/servicos/ServicosDoVeiculo/ServicosDoVeiculo.tsx`
  - Pronto quando: os textos ("Serviços adicionais", "Serviços · N", "+ Adicionar serviço") não mudam; `ServicosDoVeiculo.test.tsx` passa sem alteração.

- [x] T3 — `TicketItens`: mover o item **Ticket** para depois de "Registrado por" (ordem: Entrada, Tabela de preço, Registrado por, Ticket, Prisma, Quadro de chaves).
  - Arquivos: `src/components/patio/TicketView/TicketItens.tsx`
  - Pronto quando: a ordem no DOM é a nova; prisma e chave continuam aparecendo nos mesmos casos, com as mesmas ações.

- [x] T4 — Estilos novos do ticket: remover `VeiculoBloco`, `Destaques`, `Destaque` e `Acoes`; criar `VeiculoCartao`, `PlacaLinha`, `PermanenciaLinha`, `ValorCartao` (prop `$destaque`: `warnSoft`/`warn`/`accent` × neutro `border`/`textMuted`) e `AcoesRodape` (com `Botoes` em linha a partir de `md`); ajustar `PlacaGrande`, `Descricao`, `Itens`, `Item dd` e `QrBotao` conforme `design.md` §2. Só tokens do tema, sem valores soltos.
  - Arquivos: `src/components/patio/TicketView/TicketView.styles.ts`
  - Pronto quando: todos os estilos de `techspec.md` §3 existem e nenhum valor visual está hardcodado fora do tema (exceto medidas já existentes no arquivo, como 44/48/56px e o 36px do `Modal`). Pode ficar com erro de import em `TicketView.tsx` até a T5, desde que T4 e T5 sejam entregues juntas.

- [x] T5 — `TicketView` com o layout novo: título `Ticket Entrada - <código>` (`"Ticket Entrada"` sem código), `titleAlign="center"`; `janela()` recebe o `rodape` e o repassa a `footer` só no estado padrão. Coluna 1 com `VeiculoCartao` (placa + `StatusBadge` + descrição + permanência com ícone de relógio) e `ValorCartao` (`$destaque={cobrando}`, `data-destaque`); coluna 2 com `TicketItens` e `ServicosDoVeiculo`. Rodapé com `Pendencia`, depois "Comprovante cliente" (ícone de QR, mantém `QR_BOTAO_ID`) ou o aviso "Comprovante indisponível…", depois "Registrar saída" (com valor só quando `cobrando`). Skeletons do carregamento conforme `design.md` §1.C.
  - Arquivos: `src/components/patio/TicketView/TicketView.tsx`
  - Pronto quando: os estados de `design.md` §1.C aparecem como descrito; saída, chave, prisma, serviços e comprovante funcionam como antes; o cartão só fica âmbar quando o botão de saída traz o valor.

- [x] T6 — Testes do ticket: atualizar o título esperado (`"Ticket Entrada - 24024"`) e o nome do botão (`"Comprovante cliente"`); novos casos para o destaque do valor (com cobrança sim; mensalista e valor zero não, via `data-destaque`), para o aviso de comprovante indisponível no rodapé sem o botão e para a ordem Entrada → Tabela de preço → Registrado por → Ticket.
  - Arquivos: `src/components/patio/TicketView/TicketView.test.tsx`
  - Pronto quando: a suíte do ticket passa inteira e os testes de saída, chave, prisma e serviços continuam sem mudança.

- [ ] T7 — Verificação final: `npm run lint`, os testes (`Modal`, `ServicosDoVeiculo`, `TicketView`) e `npm run build`. Conferir no navegador, nos temas claro e escuro: 320px sem rolagem horizontal e com título truncado; rodapé fixo com o corpo rolando; veículo e valor visíveis sem rolar no celular; duas colunas e botões em linha a partir de 768px; contraste do rótulo e do valor sobre o fundo âmbar.
  - Arquivos: —
  - Pronto quando: lint, testes e build passam, e cada item da conferência visual foi checado (com o resultado registrado aqui, inclusive o que não passou).

  - Resultado (2026-11-18):
    - `npm run lint`: 0 erros (95 avisos já existentes em outros arquivos; nenhum nos arquivos alterados).
    - Testes: `Modal`, `servicos` e `patio`: 47 arquivos, 507 testes passando.
    - `npm run build`: passou (a primeira execução saiu com código 1 sem erro de compilação; a segunda passou limpa).
    - Conferência visual no navegador: **pendente**. Precisa de login e dados reais do pátio. Itens a checar: 320px sem rolagem horizontal e título truncado; rodapé fixo; veículo e valor sem rolar no celular; duas colunas a partir de 768px; contraste sobre o âmbar nos dois temas.
