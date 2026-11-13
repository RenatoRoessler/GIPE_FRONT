# Tech Spec: Layout de Serviços no Ticket do Pátio

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e registra os ajustes que o código existente impôs)
- Base: módulo de Serviços já implementado (`docs/specs/modulo-servicos/`), `src/components/servicos/` e `src/components/patio/TicketView/`.
- API: mesmos endpoints do módulo de Serviços (`/patio/{id}/servico`, `/patio/{id}/servico/{id}/status`, `/cancelar`) e `GET /Patio/comprovante/cliente`. **Nenhum endpoint novo é criado por este trabalho.**

## O que o código revelou (muda o design)

1. **Só o status e o cancelamento existem na API.** Trocar serviço, Responsável e Observação (mockup `4.jpeg`) não têm endpoint: ficam fora, como no PRD.
2. **`BottomSheet` já é responsivo:** sobe do rodapé no celular e vira painel lateral no desktop. Por isso a folha de adicionar e o detalhe usam `BottomSheet` em qualquer largura, em vez de alternar entre `BottomSheet` e `Modal` com `useIsMobile`. (`Modal` ocupa a tela toda no celular, o que não bate com os mockups.)
3. **O ticket já tem rodapé fixo no celular.** `Acoes` em `TicketView.styles.ts` já é `sticky` abaixo de `md`. O aviso de pendência entra dentro de `Acoes`; não é preciso mover nada para o `footer` do `Modal`.
4. **O comprovante do ticket vem de `consultarComprovante`** (`ComprovanteCliente`, `src/types/veiculo.ts`), que hoje **não tem campo de serviços**. O mesmo tipo alimenta o ticket (valor até agora) e a página pública.
5. **Não se sabe se `valorAtual` já inclui os serviços.** O back cobra `valorServicos` na saída junto com a permanência, e o comprovante é "calculado pelo servidor", então a hipótese mais provável é que inclua. Precisa de confirmação com dado real (ver Riscos); a divisão "estadia + serviços" fica isolada em uma função para trocar a hipótese em um lugar só.
6. **O `ServicosDoVeiculo` é dono da consulta**, e o `TicketView` precisa do mesmo dado (subtotal, pendentes) para o resumo do valor e o aviso. O TanStack Query deduplica pela chave, então o `TicketView` pode chamar o mesmo hook sem pedido extra.
7. **Trocar status só faz atualização otimista na fila** (`useAtualizarStatusServico`). O ticket lê `servicosDoVeiculoKey`, então a troca feita no detalhe só apareceria após o refetch. É preciso estender a atualização otimista.
8. **Rótulos de status** (`STATUS_ROTULO` em `status.ts`) são "Aguardando / Em execução / Pronto"; os mockups usam "Na fila / Em andamento / Pronto".

## Design
- **Telas/estados:** ticket com cartão de serviços (vazio, com serviços, carregando, erro, desligado, só leitura), folha "Adicionar serviços", detalhe do serviço, aviso de pendência e comprovante com "Seus serviços". Detalhe e microcopy em `design.md`.
- **Ajustes ao design, fechados aqui:**
  - *`SeletorDeStatus` não será criado.* Usa `OptionGroup` (variante `tile`, `columns={3}`, `legend="Status"`), que já entrega radios nativos, foco e teclado. A aparência fica a do design system; não replicar o botão claro invertido do mockup se exigir CSS novo em `ui`.
  - *Folha de adicionar e detalhe em `BottomSheet`* em todas as larguras (item 2 acima).
  - *Aviso de pendência dentro de `Acoes`* (item 3).
  - *Linha selecionável da folha:* o `Checkbox` atual só aceita texto no rótulo e dica, sem preço à direita. A linha é um componente da feature com `<label>`, `<input type="checkbox">` nativo e o visual do `Checkbox` reaproveitado se possível; se o `Checkbox` não puder ser composto, a linha estiliza o próprio input na feature (sem alterar `ui`).
  - *"Mostrar cancelados" sai do ticket.* O ticket sempre consulta sem cancelados.
  - *Rodapé do detalhe ("Toda alteração fica no histórico do ticket")* só entra se o back registrar; senão, omitir. Fica fora da primeira entrega.
- **Componentes do design system reaproveitados:** `BottomSheet`, `Modal` (ticket), `Button`, `OptionGroup`, `Input`, `StatusBadge`, `ProgressBar`, `Skeleton`, `ErrorBanner`, `Toast`, `PlateDisplay`, `Switch` (continua na fila), `ConfirmDialog`/`CancelarServicoDialog`.
- **Componentes novos (todos de feature):**
  - `src/components/servicos/ServicoLinha/` — linha do serviço no ticket (nome, valor, pílula de status, botão ⋮).
  - `src/components/servicos/ServicoDetalheSheet/` — detalhe do serviço do veículo.
  - `src/components/servicos/ServicoOpcao/` — linha selecionável da folha de adicionar.
  - `src/components/veiculos/ComprovantePublico/ServicosDoComprovante.tsx` (+ `.styles.ts`) — cartão "Seus serviços".
  - Reescritos: `ServicosDoVeiculo` (cartão do ticket) e `AcrescentarServicosModal` (vira a folha; o nome do componente se mantém para limitar o diff, ou passa a `AcrescentarServicosSheet` na tarefa de renomear, se a equipe preferir).
- **Tokens de tema usados/criados:** nenhum novo. Os de `design.md`. Ícone de gota e relógio/✓ são SVG inline na feature, sem dependência nova.

## Arquitetura da solução

### Fluxo de dados
```
GET  /patio/{id}/servico ............ useServicosDoVeiculo (existente) ──► ServicosDoVeiculo, TicketView (mesma chave, 1 pedido)
POST /patio/{id}/servico ............ useAcrescentarServicos (existente)
PUT  /patio/{id}/servico/{s}/status . useAtualizarStatusServico (estendido: otimista também no ticket)
PUT  /patio/{id}/servico/{s}/cancelar useCancelarServico (existente)
GET  /Patio/comprovante/cliente ..... consultarComprovante (+ serviços do comprovante) ──► useComprovanteTicket, ComprovantePublico
```

### Tipos (`src/types/servico.ts`, `src/types/veiculo.ts`)
- `ServicoDoVeiculo` ganha campos **opcionais**, preenchidos só se o back mandar: `adicionadoEm: string | null`, `adicionadoPor: string | null`, `previsaoEm: string | null`, `prontoEm: string | null`. Ausente = `null`; a interface omite o trecho que depende deles.
- Novo `ServicoDoComprovante` (público: sem ids internos):
  ```ts
  interface ServicoDoComprovante {
    nome: string;
    valorCentavos: number;
    status: StatusServico;
    previsaoEm: string | null;
    prontoEm: string | null;
  }
  ```
- `ComprovanteCliente` ganha `servicos?: ServicoDoComprovante[]` e `valorServicos?: number` (em reais, como o resto do tipo). Ausente é o estado normal hoje e a UI não pode quebrar nem exibir erro.

### Mapper e serviço HTTP
- `src/lib/api/services/servico.mapper.ts`: estender `fromServicoDoVeiculo` com os quatro campos opcionais (nomes tolerantes: `adicionadoEm`/`dataCriacao`/`dataInclusao`, `adicionadoPor`/`usuario`/`usuarioNome`, `previsaoEm`/`previsaoConclusao`, `prontoEm`/`dataPronto`/`concluidoEm`) e exportar `fromServicosDoComprovante(raw: unknown): ServicoDoComprovante[]`, que descarta item inválido e **cancelado**.
- `src/lib/api/services/patio.ts`: `consultarComprovante` e `consultarComprovantePorPlaca` passam `data.servicos` por `fromServicosDoComprovante` antes de devolver. Sem o campo, `servicos` fica `undefined`. Os testes existentes de `patio.test.ts` continuam passando (o campo é opcional).

### Regras puras (`src/components/servicos/resumo.ts`, novo, com `resumo.test.ts`)
- `resumirServicos(dados: ServicosDoVeiculo | undefined)` → `{ ativos: ServicoDoVeiculo[]; pendentes: number; subtotalCentavos: number; prontos: number }`. `ativos` exclui cancelados; `pendentes` conta Aguardando e Em execução; `subtotalCentavos` usa `dados.valorServicosCentavos` do back (fonte da verdade), não a soma no front.
- `avisoDePendentes(n: number): string | null` → `null` para 0; "1 serviço ainda não está pronto." / "N serviços ainda não estão prontos."
- `dividirValor(totalReais: number, servicosCentavos: number)` → `{ estadiaCentavos: number; servicosCentavos: number; totalCentavos: number }`. Hipótese vigente: `valorAtual` **inclui** serviços, então `estadia = total − serviços`, com piso em 0. É o único ponto a mudar se o back confirmar o contrário (então `total = valorAtual + serviços`).
- Sem serviços (`subtotal = 0` ou lista vazia), `dividirValor` não é usado e o valor aparece como hoje.

### Formatação (`src/components/servicos/format.ts`)
- `formatDuracaoNatural(minutos: number | null): string` → "cerca de 40 min", "cerca de 1h", "cerca de 1h30"; `null` devolve vazio. A de hoje (`formatDuracao`, "90 min · 1 h 30 min") continua para o catálogo.
- `formatCentavosOuGratis(centavos: number): string` → "Grátis" para 0, `formatCentavos` nos demais.

### Status (`src/components/servicos/status.ts`)
- `STATUS_ROTULO`: Aguardando → "Na fila", Em execução → "Em andamento" (Pronto e Cancelado iguais). Os textos de ação da fila ("Iniciar", "Marcar como pronto") e os códigos da API não mudam.
- `avisoDeStatus` e qualquer texto de Toast/aria que cite os rótulos antigos acompanham.

### Atualização otimista (`useAtualizarStatusServico.ts`)
- Além da fila, `onMutate` aplica o destino nas consultas de `SERVICOS_DO_VEICULO_KEY` (cada `ServicosDoVeiculo` em cache: trocar `status` do item com o `patioServicoId`), guardando o snapshot das duas famílias de chave; `onError` restaura as duas. `onSettled` já invalida `PATIO_QUERY_KEY` (que cobre o ticket e o comprovante do ticket) e `FILA_SERVICOS_KEY`.
- `TrocaDeStatus` não muda; o detalhe passa `idPatio`, `patioServicoId` e `destino`.

### Ticket (`src/components/patio/TicketView/`)
- `TicketView.tsx`:
  - Chama `useServicosHabilitados()` e `useServicosDoVeiculo(veiculo.patioId, false, habilitado)`; deriva `resumirServicos`.
  - Cartão "Valor até agora": quando `ativos.length > 0` e `valor !== null`, mostra o total e a linha de apoio com `dividirValor`; senão, como hoje. Mensalista segue "Mensal".
  - Dentro de `Acoes`: acima dos botões, `<Aviso role="status">` com `avisoDePendentes(pendentes)` quando houver. **Não altera** o `disabled` do "Registrar saída". O rótulo do botão continua `formatBRL(valor)`, agora com o total que inclui os serviços (hipótese do item 5).
  - Continua com `pausado` do `usePatioVeiculo` quando uma folha de serviços está aberta (ver abaixo).
- `TicketView.styles.ts`: `Aviso` já existe; criar variante de alerta (ícone + texto em `warn`) só se o atual não servir. Nada de cor solta: tokens do tema.
- **Folhas abertas pausam o polling:** como a saída, a chave e o prisma já fazem, o ticket não pode se atualizar debaixo da folha. `ServicosDoVeiculo` expõe `onAbrirFolha`/`onFecharFolha` (ou o estado sobe para o `TicketView`, que passa `pausado` incluindo "folha de serviços aberta").

### Cartão de serviços (`ServicosDoVeiculo`)
- Props: `idPatio`, `placa`, `categoria`, `onAviso` (inalteradas) + os callbacks de pausa.
- Remove o `Switch` "Mostrar cancelados" e o resumo textual ("Serviços R$ ... · tempo permitido ... · livre até ..."). O tempo permitido e "livre até" **deixam de aparecer no ticket** (decisão a confirmar com o produto; ver Riscos); o subtotal passa a ser a linha "Subtotal serviços".
- Estados: `!habilitado` → `null`; carregando → `Skeleton`; erro → `ErrorBanner` + "Tentar novamente"; sem serviço → botão tracejado "Adicionar serviço" (se `podeGerir`); com serviço → cabeçalho "Serviços · N", "Adicionar" (se `podeGerir`), `ServicoLinha` por item e "Subtotal serviços". Sem `podeGerir`: só leitura (sem "Adicionar" nem ⋮ de remover).
- Cada `ServicoLinha` abre o `ServicoDetalheSheet` (estado `detalheDe: ServicoDoVeiculo | null`).

### Folha de adicionar (`AcrescentarServicosModal`)
- Troca `Modal` por `BottomSheet`. Mantém `useServicos(true)`, `useAcrescentarServicos` e `precoParaCategoria`.
- Novo: campo de busca (estado local, filtra com `normalizarBusca` de `catalogo.ts`), cabeçalho com placa e categoria (recebe `placa` e o rótulo da categoria do `TicketView`/`ServicosDoVeiculo`), linhas `ServicoOpcao` e rodapé com contagem, total e botão "Adicionar ao ticket · + R$ X".
- A lista renderiza: nome, `descricao`, `formatDuracaoNatural(duracaoMinutos)` e o preço (`formatCentavosOuGratis`). Serviço sem preço para a categoria fica desabilitado com "Não atende esta categoria", como hoje.
- Foco inicial no campo de busca (`data-autofocus`). `closeOnBackdrop` continua desligado enquanto há seleção.
- Props novas: `placa: string`, `categoriaRotulo: string`.

### Detalhe (`ServicoDetalheSheet`)
- `BottomSheet` com título do serviço; valor e "adicionado às HH:MM por X" (omitido se `adicionadoEm` for `null`; só "adicionado às HH:MM" se faltar `adicionadoPor`).
- `OptionGroup` de status (Na fila, Em andamento, Pronto; `Cancelado` não é opção) ligado a `useAtualizarStatusServico`. Desabilitado enquanto envia; erro volta o valor e mostra `ErrorBanner` na folha. A permissão para trocar status é mais larga que a de adicionar/remover (inclui Lavador, ver `modulo-servicos`): usar `AREA.Servicos` para trocar e `AREA.ServicosPatio` para adicionar e remover.
- "Remover serviço" (só se `podeCancelar(status)` e `AREA.ServicosPatio`) abre o `CancelarServicoDialog` existente, que já exige o motivo. Fora da fila, mostra a explicação em vez do botão.

### Comprovante público (`ComprovantePublico`)
- `ServicosDoComprovante.tsx` recebe `servicos: ServicoDoComprovante[]`. Não renderiza nada se a lista for vazia ou `undefined` (RF14, e a dependência do back).
  - Título "Seus serviços" e "X de N prontos" (`ProgressBar` com `aria-label`, `value=prontos`, `max=N`).
  - Uma linha por serviço: ícone de status, nome, status em texto com horário ("Em andamento · previsão 22:20" só se `previsaoEm`; "Pronto às 21:40" só se `prontoEm`) e valor. `aria-live="polite"` na lista.
- `Comprovante` (em `ComprovantePublico.tsx`): com serviços, o bloco "Elapsed" ganha as linhas "Estadia" e "Serviços (N)" calculadas por `dividirValor(comprovante.valorAtual, soma dos serviços não cancelados)`. Sem serviços, **não muda**. O restante do layout atual do comprovante (cabeçalho, ações, QR) **não é redesenhado** por este trabalho (ver Fora de escopo).
- O cartão entra entre o cartão de dados e as ações.
- Outros consumidores de `ComprovanteCliente` (`reciboPdf.ts`, `pdfCupom.ts`, comprovante da entrada em `app/(app)/patio/[patioId]/comprovante`) **não mudam**; o PDF não lista serviços nesta versão.

### Server vs Client
- Todas as peças novas são **Client Components** (estado, TanStack Query, `<dialog>`). Nenhuma rota nova: `app/comprovante/[token]/page.tsx` e a rota do ticket continuam como estão (Server Component fino que renderiza o cliente). Não há API específica do Next nova, então não é necessário reler `node_modules/next/dist/docs/` para esta mudança; se alguma tarefa tocar uma `page.tsx`, conferir antes (AGENTS.md).

## Decisões técnicas e trade-offs

- **`BottomSheet` em todas as larguras** em vez de `Modal` no desktop: menos código e comportamento já testado; no desktop a folha vira painel lateral, uma variação aceitável do mockup (que é só mobile).
- **Subtotal e total vêm do back** (`valorServicosCentavos`, `valorAtual`), nunca somados no front, para o ticket nunca divergir do que a saída cobra. A divisão estadia/serviços é derivada e isolada em `dividirValor`.
- **`OptionGroup` em vez de um seletor novo:** reaproveita acessibilidade pronta; custo é a aparência não ser idêntica ao mockup.
- **Campos opcionais com mapper tolerante** (`adicionadoEm`, `previsaoEm`, ...): como o contrato de resposta nunca foi confirmado (herdado do módulo), a UI mostra o que existir e omite o resto, em vez de bloquear a entrega.
- **Rótulos de status globais:** mudar `STATUS_ROTULO` uma vez muda ticket, fila e comprovante. Evita dois vocabulários para o mesmo estado; o custo são testes que citam os textos antigos.
- **Sem bloqueio na saída:** o aviso é só texto; `Registrar saída` nunca fica desabilitado por serviço pendente (PRD).
- **Sem abstração nova de "folha de seleção":** só há uma folha de seleção (adicionar serviços); extrair para `ui` fica para quando houver um segundo uso.

## Riscos / pontos de atenção

1. **`valorAtual` inclui serviços?** Se não incluir, o ticket e o botão "Registrar saída" mostrariam menos do que a saída cobra. Mitigação: a primeira tarefa confirma com um ticket real que tenha serviço (comparar `valorAtual` com a consulta de saída); `dividirValor` é o único ponto a ajustar.
2. **Comprovante público sem serviços na resposta (dependência do PRD).** Hoje o back pode simplesmente não devolver `servicos`. O front fica pronto e invisível até o back entregar; RF12 a RF14 só podem ser verificados com o endpoint atualizado. Registrar com o back-end e anotar o resultado em `tasks.md`.
3. **Nomes de campo desconhecidos** (`adicionadoEm`, `previsaoEm`, `prontoEm`, `servicos` no comprovante): mapper tolerante e testes com fixtures de duas formas; apertar quando houver resposta real.
4. **Remoção do resumo "tempo permitido / livre até" do ticket.** Era informação útil do módulo original (PRD `modulo-servicos` RF/design) e os mockups não a mostram. Decidir com o produto se ela volta como linha discreta dentro do cartão; até lá, sai.
5. **Atualização otimista em duas famílias de cache:** risco de inconsistência se a chave de `servicosDoVeiculoKey` mudar. Testar o rollback do detalhe em `useAtualizarStatusServico.test`.
6. **Rótulos de status mudam em telas já em produção.** Operadores e lavadores veem "Na fila / Em andamento" onde viam "Aguardando / Em execução". Avisar no changelog (`logs-atualizacoes`).
7. **Foco e `<dialog>` aninhado:** a folha abre sobre o `Modal` do ticket (dois `showModal`). O foco volta ao gatilho ao fechar (comportamento do `BottomSheet`), mas testar Esc em ambos para não fechar o ticket junto.
8. **Barra de rolagem horizontal do mockup 3:** garantir `min-width: 0` e quebra de linha em `ServicoLinha`; teste visual no celular.

## Registro da T1 (2026-11-13)
Não havia ticket com serviço disponível no ambiente, e gravar dado nele exige autorização do dono, que não foi dada. **Nada foi confirmado com resposta real**: segue valendo a hipótese de que `valorAtual` inclui os serviços (constante `VALOR_ATUAL_INCLUI_SERVICOS` em `src/components/servicos/resumo.ts`, único ponto a mudar), e os nomes de campo são os tolerantes do mapper. Confirmar com a primeira resposta real: comparar `valorAtual` de `GET /Patio/comprovante/cliente` com `valorServicos` e com a consulta de saída; ver se o comprovante traz `servicos`.

## Fora de escopo técnico
- Trocar serviço, Responsável e Observação (sem endpoint).
- Histórico/auditoria do ticket ("Toda alteração fica no histórico").
- Redesenho do comprovante público além do cartão de serviços e das linhas de valor: cabeçalho, grade 2×2, ícones de ação, aviso "a estadia passa para R$ 45" e "Ver tabela de preços" do mockup `6.jpeg` não são feitos aqui.
- Serviços no PDF/cupom do comprovante, no recibo de saída, no caixa e na nota fiscal.
- Mudança nas permissões, no catálogo e na fila do lavador (exceto os rótulos de status).
- Qualquer endpoint novo ou alteração de contrato; a dependência do comprovante público é do back-end.
