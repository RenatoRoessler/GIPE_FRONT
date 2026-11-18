# Tech Spec: Redesenho do ticket de entrada

## Referências
- PRD: ./prd.md
- Design: ./design.md (skill claude-design)
- Protótipo: ./prototipo-v5.html
- Base anterior: ../patio-layout-ticket/techspec.md (rota, dados e fluxos do ticket continuam os de lá)

## Design
- **Telas/estados**: ticket no celular (coluna única, rodapé fixo) e no computador (`Modal size="lg"`, duas colunas, rodapé com botões em linha). Estados: padrão com cobrança, valor carregando, valor com erro, valor zero, mensalista, sem comprovante, serviços pendentes, serviços desligados, carregando o ticket, erro, carro fora do pátio. Tabela completa em `design.md` §1.C.
- **Componentes do design system reaproveitados**: `Modal` (cabeçalho, corpo rolável e `footer` fixo), `Button`, `StatusBadge` (tons `avulso`/`mensal`/`conveniado`), `Skeleton`, `Toast`. Também `ListError`, `GuardarChaveModal`, `EditarPrismaModal`, `SaidaVeiculoModal` e `ServicosDoVeiculo`, sem mudança de comportamento.
- **Componentes novos**: nenhum componente de UI novo. Muda o `Modal` (nova prop `titleAlign`) e entram styled-components locais do ticket (`VeiculoCartao`, `PermanenciaLinha`, `ValorCartao`, `AcoesRodape`) em `TicketView.styles.ts`.
- **Tokens**: só tokens existentes (`warnSoft`, `warn`, `accent`, `border`, `borderStrong`, `surfaceMuted`, `text`, `textMuted`, `cliente.*`, `fontFamilies.mono`, `fontSizes`, `fontWeights`, `radii.lg/md`, `space`, `layout.touchTarget`, `breakpoints.md`). **Nenhum token criado.** Tabela em `design.md` §3.

## Arquitetura da solução

Nenhuma mudança de rota, dados, tipos ou API. A página `src/app/(app)/patio/[patioId]/page.tsx` continua renderizando `TicketView`. Tudo é Client Component (já é: `"use client"` em `TicketView`, `Modal` e `ServicosDoVeiculo`), porque o ticket tem estado local, atualização periódica e modais.

### 1. `src/components/ui/Modal/` — título centralizado (design system)

- `Modal.tsx`: nova prop opcional `titleAlign?: "start" | "center"` (padrão `"start"`), repassada ao `Header` como `$titleAlign`.
- `Modal.styles.ts`: `Header` recebe `$titleAlign`. Com `"center"`:
  ```
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 36px;   /* 36px = CloseButton */
  ```
  Um espaçador vazio (`<span aria-hidden="true" />`) é renderizado antes do `Title` só nesse modo, para manter a simetria. `Title` ganha `text-align: center`, `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap` nesse modo. `36px` passa a ser uma constante local compartilhada entre `CloseButton` e o grid (hoje é literal no `CloseButton`).
- `Modal.test.tsx`: caso novo — com `titleAlign="center"` o diálogo continua nomeado pelo título e o botão "Fechar" continua acessível; sem a prop, o cabeçalho não muda.

### 2. `src/components/patio/TicketView/TicketView.tsx`

- Título: `Ticket Entrada - ${codigo}`; o `codigo` continua sendo `codigoTicket` ou `Seq. ${sequencial}`. Sem código (carregando/erro/ausente): `"Ticket Entrada"`. `Modal` com `titleAlign="center"` e `size="lg"`.
- A função `janela(conteudo, codigo?)` ganha um terceiro parâmetro `rodape?: React.ReactNode`, repassado a `footer`. Só o estado padrão passa rodapé; carregando, erro e ausente não.
- Corpo (estado padrão), em `Colunas` (mantido):
  - Coluna 1: `VeiculoCartao` (placa + `StatusBadge` + descrição + `PermanenciaLinha`) e `ValorCartao`.
  - Coluna 2: `TicketItens` e `ServicosDoVeiculo`.
  - `Aviso` "Comprovante indisponível…" sai do corpo e vai para o rodapé.
- Rodapé (`AcoesRodape`), nesta ordem no DOM: `Pendencia` (se houver), `QrBotao` ou `Aviso` (sem token), `SaidaBotao`.
- Lógica derivada (existe hoje, só reorganizada):
  - `cobrando = !mensalista && valor !== null && valor > 0` → controla `$destaque` do `ValorCartao` **e** o texto do botão de saída. Uma única variável para os dois, para a cor e o botão nunca divergirem.
  - `valorTexto`, `divisao`, `avisoPendentes`, `semToken`: sem mudança.
- Textos novos: botão "Comprovante cliente" (era "Mostrar QR do ticket ao cliente"). Para não perder contexto no leitor de tela, `aria-label="Comprovante do cliente com QR do ticket de ${placa}"` **não** é usado: o nome acessível fica igual ao texto visível (WCAG 2.5.3), e o ícone de QR é `aria-hidden`.
- Ícones de relógio e QR: SVG inline, `aria-hidden`, `currentColor` — o padrão já usado no arquivo (`Pendencia`). Ficam em funções locais pequenas (`IconeRelogio`, `IconeQr`) no próprio `TicketView.tsx`, ou em `TicketIcones.tsx` se passarem de ~20 linhas.

### 3. `src/components/patio/TicketView/TicketView.styles.ts`

- **Remover**: `VeiculoBloco`, `Destaques`, `Destaque`, `Acoes` (o `position: sticky` com margens negativas some; o `Footer` do `Modal` já é fixo e trata `safe-area-inset-bottom`).
- **Criar**:
  - `VeiculoCartao` (`section`): contorno `inset 0 0 0 1px border`, sem fundo, `radii.lg`, padding `space[3]`.
  - `PlacaLinha`: `flex`, `align-items: center`, `gap: space[2]`, `flex-wrap: wrap`.
  - `PermanenciaLinha` (`dl`): `border-top: 1px dashed border`, `margin-top`/`padding-top` `space[3]`, `space-between`; `dt` com ícone, `sm`, `textMuted`; `dd` `lg`, `bold`, `tabular-nums`.
  - `ValorCartao` (`dl`, prop transiente `$destaque: boolean`): `flex-wrap: wrap`, `space-between`, `align-items: center`, padding `space[3]`, `radii.lg`. `$destaque` → fundo `warnSoft`, contorno `warn`, `dt` em `accent`; sem destaque → sem fundo, contorno `border`, `dt` em `textMuted`. `dd` `xl`, `extrabold`, `-0.03em`, `tabular-nums`. `Apoio` e `TentarValor` com `flex-basis: 100%` e `text-align: right`/`align-self: flex-end`.
  - `AcoesRodape`: `flex: 1` (filho único do `Footer`, que é `row` a partir de `sm`), `flex-direction: column`, `gap: space[2]`; a partir de `md`, um wrapper interno `Botoes` em `row` com `flex: 1` nos dois botões.
- **Ajustar**: `PlacaGrande` (`letter-spacing: 0.06em`); `Descricao` (`medium`, cor `text`); `Itens` (sem fundo, mantém contorno); `Item dd` (`semibold`); `QrBotao` (`gap: space[2]` para o ícone).
- Breakpoint: reutilizar o helper `desktop` já existente no arquivo.

### 4. `src/components/patio/TicketView/TicketItens.tsx`

- Mover o item **Ticket** para depois de "Registrado por" (ordem final: Entrada, Tabela de preço, Registrado por, Ticket, Prisma, Quadro de chaves). Nada mais muda.

### 5. `src/components/servicos/ServicosDoVeiculo/`

- `ServicosDoVeiculo.styles.ts`: `Secao` sem `box-shadow` e com `radii.lg`; `BotaoVazio` com `radii.md`, `fontSizes.sm`, `fontWeights.medium`.
- `ServicosDoVeiculo.tsx`: remover `Gota` e seu uso no `Titulo`. Textos ("Serviços adicionais", "Serviços · N", "+ Adicionar serviço") não mudam.
- O componente só é usado no ticket (`TicketView.tsx`), então a mudança visual não afeta outra tela.

### 6. Testes

- `TicketView.test.tsx`:
  - Atualizar o título esperado: `"Ticket Entrada - 24024"` (teste "abre como um diálogo…").
  - Atualizar o nome do botão: `"Comprovante cliente"` (teste "Mostrar QR abre o comprovante…").
  - Novo: com cobrança, o cartão de valor está destacado e o botão traz o valor; mensalista e valor zero não destacam. Verificar por um atributo estável (`data-destaque="true"` no `ValorCartao`), não por cor.
  - Novo: sem token, "Comprovante indisponível…" aparece no rodapé, e não há botão de comprovante.
  - Novo: os itens aparecem na ordem Entrada, Tabela de preço, Registrado por, Ticket.
  - Os demais testes (saída, chave, prisma, serviços, estados) continuam valendo sem mudança; se algum quebrar, é regressão.
- `ServicosDoVeiculo.test.tsx`: sem mudança esperada (textos iguais).
- `Modal.test.tsx`: caso do `titleAlign` (item 1).

## Decisões técnicas e trade-offs
- **Rodapé pelo `footer` do `Modal`, não `sticky` no corpo.** O `Modal` já separa corpo rolável e rodapé fixo, com área segura do aparelho. O `sticky` com margens negativas acoplava o ticket ao padding interno do `Body`. Custo: o `Footer` é `column-reverse`/`row` e tem `justify-content: flex-end`; um filho único com `flex: 1` (`AcoesRodape`) neutraliza isso sem mexer no `Modal`.
- **`titleAlign` no `Modal`, não um cabeçalho próprio no ticket.** Reescrever o cabeçalho perderia o nome acessível do diálogo (`aria-labelledby`) e o botão de fechar padrão. A prop é opt-in e não muda nenhum outro modal.
- **Cartões locais em vez de usar `ui/Card`/`ui/InfoCard`.** São composições específicas do ticket (linha de permanência, destaque condicional do valor); generalizar agora seria abstração sem segundo uso.
- **Uma variável `cobrando` para cor e botão.** Evita o cartão âmbar com o botão sem valor (ou o contrário).
- **`data-destaque` para teste.** Os testes não dependem de cor computada, que o jsdom não resolve de forma confiável com styled-components.

## Riscos / pontos de atenção
- **Altura do rodapé no celular**: com aviso de pendentes + dois botões, o rodapé fica com ~150px. Em telas de 568px de altura o corpo continua rolando, mas conferir no QA que veículo e valor aparecem sem rolar (métrica do PRD).
- **Teclado de toque**: o `Modal` já desconta `--teclado-altura`; o ticket não abre teclado, mas os modais de prisma/serviço por cima dele abrem. Conferir que o rodapé não fica sobre o teclado.
- **Contraste da borda `warn` no tema claro** (< 3:1, decorativa, ver `design.md` §5). Conferir rótulo `accent` e valor `text` sobre `warnSoft` nos dois temas com uma ferramenta de contraste.
- **Título truncado**: "Ticket Entrada - Seq. 123456" em 320px. O grid com `minmax(0, 1fr)` e reticências cobre; validar.
- **Textos mudados em testes E2E**: não há E2E referenciando "Mostrar QR do ticket ao cliente" nem "Ticket de entrada" (verificado); só os testes unitários do item 6.

## Fora de escopo técnico
- Mudanças na lista do Pátio, no comprovante digital (tela do QR, aberta por `hrefDoComprovante`), na página pública ou nos modais de saída, chave, prisma e serviços.
- Devolver o foco ao botão de comprovante ao voltar do comprovante (não existe hoje; não entra aqui).
- Tokens novos no tema ou componentes novos em `src/components/ui`.
- Qualquer mudança em API, tipos (`src/types/patio.ts`) ou hooks (`usePatioVeiculo`, `useComprovanteTicket`, `useServicosDoVeiculo`).
