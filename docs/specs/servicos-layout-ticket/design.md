# Design Spec: Layout de Serviços no Ticket do Pátio

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` e das imagens de `docs/specs/input.md` (`WhatsApp Image 2026-11-12 at 20.55.25.jpeg` = ticket, `2.jpeg` = adicionar, `3.jpeg` = depois de adicionado, `4.jpeg` = detalhe, `6.jpeg` = comprovante). Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o `design.md` do módulo de Serviços, que continua valendo para catálogo e fila.

Os mockups já definem a composição; esta spec os traduz em estados, componentes e tokens, e registra onde eles divergem do que existe hoje.

## Direção

Modo **Operate**, no celular, de pé no pátio. O ticket é um popup (`Modal size="lg"`) sobre a lista do Pátio.
- **Hierarquia do ticket:** placa → permanência e valor → serviços → dados da entrada → ações de saída. O dinheiro e o que falta para sair vêm antes do detalhe.
- **Serviços são um bloco único** dentro de um cartão com a própria identidade (gota, rótulo em mono caixa-alta, `surface` um degrau acima do fundo), não uma seção solta. O estado vazio é um botão tracejado grande ("Adicionar serviço"): convida à ação sem competir com "Registrar saída".
- **Uma ação principal por tela:** "Registrar saída" é o único botão `primary` do ticket. "Adicionar" e "Mostrar QR" são secundários; "Adicionar ao ticket" é o `primary` da folha de seleção.
- **Status sempre em texto** (pílula com rótulo); a cor só reforça. Dinheiro em fonte mono/tabular, sempre com "R$" e duas casas.
- **Comprovante do cliente** é tema claro, mais editorial: o valor é o herói, os serviços são uma lista com progresso. Sem ornamento além do que o mockup traz.

## Vocabulário de status (decisão a fechar no Tech Spec)

Os mockups e o PRD usam **Na fila · Em andamento · Pronto**; o módulo hoje usa **Aguardando · Em execução · Pronto** (`status.ts`). Recomendação: unificar os rótulos em todo o sistema (ticket, detalhe, comprovante e fila do lavador) para os do mockup, trocando só os textos em `STATUS_ROTULO`; os códigos da API não mudam. Mesmo termo para a mesma coisa em todas as telas.

## Componentes do design system

### Reaproveitados
`Modal` (ticket, detalhe no desktop), `BottomSheet` (folha de adicionar e detalhe no celular), `Button` (`primary`, `secondary`, `sm`), `Checkbox` ou item de seleção (linha selecionável da folha), `Input type="search"` (busca), `StatusBadge`, `PlateDisplay`, `ProgressBar` (comprovante), `Skeleton`, `ErrorBanner`, `Toast`, `Text`, `ConfirmDialog`/`CancelarServicoDialog` (remover, com motivo).

### Novos (de feature, em `components/servicos` e `components/veiculos/ComprovantePublico`)
- **`ServicosDoVeiculo`** (já existe): reescrito no formato do cartão "Serviços adicionais"; mantém a lógica de dados, muda a apresentação.
- **`ServicoLinha`**: linha do serviço no ticket (nome, valor, pílula de status, menu ⋮).
- **`ServicoDetalheSheet`**: detalhe de um serviço do veículo (substitui a ação "Cancelar serviço" solta na linha).
- **`SeletorDeStatus`**: controle segmentado de três opções (Na fila / Em andamento / Pronto). Se não houver equivalente em `ui` (`OptionGroup`, `Tabs`), avaliar usar `OptionGroup`; criar só se nenhum servir, e então no design system.
- **`AcrescentarServicosModal`** (já existe): vira a folha do mockup (busca, linhas selecionáveis com preço, rodapé com resumo).
- **`ServicosDoComprovante`**: cartão "Seus serviços" do comprovante público.
- **`ResumoValor`** (se já não existir no comprovante): linhas "Estadia" e "Serviços (N)".

Nenhum componente novo vai para `ui` a menos que o `SeletorDeStatus` não possa reaproveitar o que há.

## Tokens usados

Nenhum token novo.
- Cores: `colors.surface`, `surfaceMuted`, `background`, `border`, `borderStrong`, `text`, `textMuted`, `primary`/`onPrimary` (Registrar saída, Adicionar ao ticket), `accent` (links "Adicionar", "Alterar"), `success` (Pronto), `warn`/`onWarn` (Em andamento e aviso), `danger` (Remover), `focus`.
- Tipografia: `fontFamilies.mono` para placa, valores e rótulos de seção; `fontFamilies.sans` no resto; `typography.display*` no valor do comprovante; `fontSizes` `xs` (rótulos em caixa alta), `sm`, `md`, `lg`, `xl`; `fontWeights` `medium`, `semibold`, `bold`.
- Espaço/forma: `space`, `radii.lg`/`xl` nos cartões, `radii.full` nas pílulas, `shadows.sm` no cartão do comprovante.
- Layout: `layout.touchTarget` (44px) em toda linha tocável, botões e itens do menu ⋮; `layout.stickyTop` se o cabeçalho do ticket ficar fixo.
- Tons de status via `StatusBadge`: Na fila `neutral`, Em andamento `warn`, Pronto `success`, Cancelado `danger`. Tracejado do estado vazio e divisórias dos itens com `colors.border`.

## Tela 1: Ticket do veículo (`WhatsApp Image...jpeg`, `3.jpeg`)

Ordem vertical, uma coluna no celular (duas colunas no desktop, como já está em `Colunas`):

1. **Veículo**: placa grande (mono), categoria em caixa alta, selo do tipo de cliente ("Avulso").
2. **Destaques lado a lado**: "Permanência" e "Valor até agora". Com serviços, o valor ganha uma linha de apoio abaixo: "40,00 estadia + 50,00 serviços" (`xs`, `textMuted`). Mensalista continua mostrando "Mensal".
3. **Cartão "Serviços adicionais"** (só com serviços ligados na configuração; ver estados).
4. **Dados da entrada** (`TicketItens`: Entrada, Tabela de preço, Registrado por, Prisma com "Alterar"), como já existe.
5. **Rodapé fixo do popup**: aviso de serviço pendente (se houver), "Mostrar QR do ticket ao cliente" (`secondary`), "Registrar saída · R$ X" (`primary`).

### Cartão de serviços: estados
- **Sem serviços (mockup 1):** cabeçalho com gota + rótulo "SERVIÇOS ADICIONAIS" (mono, caixa alta, `textMuted`); abaixo, botão de largura total com borda tracejada: "+ Adicionar serviço". Altura ≥ 44px.
- **Com serviços (mockup 3):** cabeçalho "SERVIÇOS · N" à esquerda e "+ Adicionar" (`accent`, semibold) à direita. Lista de linhas separadas por tracejado fino; em cada uma, à esquerda nome (semibold, quebra em até 2 linhas) e valor (mono, `textMuted`) abaixo; à direita a **pílula de status** (contorno, ícone + texto: relógio "Em andamento", ✓ "Pronto", neutro "Na fila") e o menu **⋮**. Fecha com "Subtotal serviços" e o valor em negrito.
- **Cancelados** não aparecem na lista nem no subtotal. O interruptor "Mostrar cancelados" sai do ticket (fica na fila, se necessário); se o Tech Spec quiser manter, vai dentro do detalhe, não no ticket.
- **Carregando:** `Skeleton` de duas linhas dentro do cartão, mantendo a altura para não saltar.
- **Erro:** `ErrorBanner` dentro do cartão + "Tentar novamente". O restante do ticket continua utilizável.
- **Serviços desligados na empresa:** o cartão não aparece (como hoje).
- **Sem permissão de gerir serviços:** o cartão aparece em leitura; "Adicionar" e o ⋮ de remover somem; trocar status segue a permissão da API.

### Aviso de serviço pendente (mockup 3)
Linha acima de "Mostrar QR": ícone de alerta `warn` + "1 serviço ainda não está pronto." (`sm`). Plural: "2 serviços ainda não estão prontos." Aparece quando há ao menos um serviço Na fila ou Em andamento; some quando todos estão prontos. É texto informativo: **não desabilita** "Registrar saída". Usar `role="status"` (muda sem o usuário agir).

### Responsividade
- **Celular (≤ md):** uma coluna; rodapé de ações fixo no fim do popup; a área de conteúdo rola, as ações não.
- **Desktop (≥ md):** duas colunas como hoje (veículo e valores à esquerda; serviços, dados e ações à direita).
- **Regra a corrigir:** o mockup 3 mostra barra de rolagem horizontal no conteúdo; não deve existir. Linhas longas quebram, nunca estouram.

## Tela 2: Folha "Adicionar serviços" (`2.jpeg`)

Folha de baixo para cima no celular (`BottomSheet`), modal centralizado no desktop (`Modal size="md"`), com alça de arrasto no celular.

- **Cabeçalho:** título "Adicionar serviços" e fechar (✕). Abaixo, em uma linha: placa (mono, negrito) · "Carro médio · preços desta categoria".
- **Busca:** campo com ícone de lupa, rótulo "Buscar serviço"; filtra a lista carregada pelo nome (sem chamada à API).
- **Lista:** cada serviço é uma linha selecionável de toque inteiro (≥ 44px, na prática ~64px): checkbox à esquerda, **nome** (semibold) e abaixo **descrição curta · duração** ("Externa · cerca de 40 min", `textMuted`, `xs`), e **preço** à direita em mono ("R$ 30,00" ou **"Grátis"** quando 0). Selecionado: borda `focus`/`primary` mais forte e fundo `surfaceMuted`. A duração é exibida em linguagem natural ("cerca de 1h30"), não em "90 min".
- **Serviço que não atende a categoria:** linha desabilitada, preço "—", texto "Não atende esta categoria" (como hoje).
- **Rodapé fixo:** à esquerda "N serviços selecionados" (`textMuted`), à direita "+ R$ total" (mono, negrito); abaixo, botão `primary` de largura total "Adicionar ao ticket · + R$ 50,00". Sem seleção: o botão fica desabilitado e o texto é "Adicionar ao ticket". Enviando: "Adicionando...".
- **Estados:** carregando (`Skeleton` em 4 linhas), erro de catálogo (`ErrorBanner` + "Tentar novamente"), catálogo vazio ("Nenhum serviço ativo no catálogo."), busca sem resultado ("Nenhum serviço encontrado" + "Limpar busca"), erro ao enviar (`ErrorBanner` no topo da lista, com a mensagem do back; a seleção é mantida).
- **Foco:** abre com o foco no campo de busca; Esc/✕ fecha sem adicionar; no celular o teclado não deve cobrir o rodapé.

## Tela 3: Detalhe do serviço (`4.jpeg`)

Aberto pelo ⋮ (ou toque na linha). `BottomSheet` no celular, `Modal size="sm"` no desktop, sobre o ticket.

- **Cabeçalho:** nome do serviço (grande, semibold) e fechar. Abaixo: valor em mono + "adicionado às 21:10 por Everton" (`textMuted`).
- **Seção "STATUS"** (rótulo mono caixa-alta): `SeletorDeStatus` segmentado com três opções; a atual em destaque (fundo claro/`text` invertido, como o mockup). Trocar aplica na hora (atualização otimista, como a fila) e o ticket atrás reflete.
- **Remover serviço** (texto/linha com ícone de lixeira, `danger`): só quando permitido (serviço Na fila). Abre o diálogo de motivo (obrigatório) já existente. Em Em andamento/Pronto a linha não aparece, e um texto curto explica: "Só é possível remover serviço que ainda está na fila."
- **Rodapé informativo:** "Toda alteração fica no histórico do ticket." Só exibir se o back realmente registrar; senão, omitir (o PRD deixa o histórico fora de escopo).
- **Fora desta versão (PRD):** as linhas "Trocar serviço", "Responsável" e "Observação" do mockup **não entram**. O layout deixa a estrutura de lista (linha com ícone, título, subtítulo e chevron) pronta para recebê-las quando a API existir, mas hoje elas não são renderizadas, nem desabilitadas.
- **Estados:** trocar status em andamento (segmento com carregando, sem desabilitar a folha inteira); erro ao trocar (reverte o segmento e mostra `Toast` de erro/`ErrorBanner`); remover pede confirmação.

## Tela 4: Comprovante de entrada do cliente (`6.jpeg`)

Página pública, tema claro, coluna única de largura de celular. Ordem:

1. **Topo escuro** com "COMPROVANTE DE ENTRADA", nome da empresa e endereço/telefone (como já existe).
2. **Cartão de valor:** "VALOR ATÉ AGORA" (mono, caixa alta, `textMuted`) e o total grande (`typography.display*`, ~`xxl`), com "há 8h 14min no pátio" abaixo. Em seguida, linhas **"Estadia — R$ 40,00"** e **"Serviços (2) — R$ 50,00"** (só quando há serviços), "Atualizado às 21:51" e "Ver tabela de preços" (link sublinhado).
   - O aviso amarelo "Às 22:37 a estadia passa para R$ 45,00" e o link "Ver tabela de preços" aparecem no mockup, mas **não fazem parte deste PRD**. Só entram se já existirem hoje ou forem escopo de outra feature; não criar por aqui.
3. **Cartão do veículo:** placa em mono grande, ações em ícone (baixar, mapa, contato); VEÍCULO, CATEGORIA, ENTRADA e CLIENTE em grade 2×2.
4. **Cartão "Seus serviços"** (só com serviços): título em semibold e à direita "1 de 2 prontos". `ProgressBar` (verde `success`) com `aria-label` "Serviços prontos". Abaixo, uma linha por serviço separada por tracejado: ícone redondo de status (relógio cinza = em andamento/na fila, ✓ verde = pronto), **nome** (semibold), **status em texto** com horário ("Em andamento · previsão 22:20" em `textMuted`; "Pronto às 21:40" em `success`) e **valor** à direita em mono. Cancelados não aparecem.
5. **QR de saída** (como já existe), rodapé de funcionamento e assinatura "Ticket digital por Murel".

### Estados do comprovante
- **Sem serviços:** o cartão de serviços e as linhas "Estadia/Serviços" não aparecem; o cartão de valor fica como hoje (PRD RF14).
- **Back sem dados de serviços (dependência do PRD):** o cartão não aparece e nada quebra. Sem mensagem de erro ao cliente.
- **Todos prontos:** barra cheia e "2 de 2 prontos"; nenhuma mensagem extra.
- **Previsão ausente:** mostrar só o status ("Em andamento"), sem horário inventado.
- **Carregando/erro/não encontrado:** inalterados.
- **Atualização:** o status muda enquanto o cliente olha; a lista usa `aria-live="polite"` para anunciar a mudança e o horário "Atualizado às" reflete a última consulta.

## Acessibilidade e microcopy
- Todo alvo de toque ≥ 44px (`layout.touchTarget`); linhas selecionáveis inteiras são clicáveis, com `Checkbox` real por baixo (não só visual).
- Pílulas de status: texto + ícone, nunca só cor. Contraste de texto sobre `warn`/`success` conforme `onWarn`/`onSuccess` do tema.
- Menu ⋮ com `aria-label` "Ações de {nome do serviço}"; folhas com foco preso e retorno do foco ao gatilho ao fechar.
- Totais e resumo da folha em `aria-live="polite"`; aviso de pendência em `role="status"`.
- Dinheiro: `formatBRL`/`formatCentavos` existentes; "Grátis" só para valor 0. Horários no formato 24h ("21:40").
- Copy do PRD: "Serviços adicionais", "Adicionar serviço", "Adicionar ao ticket · + R$ X", "N serviço(s) ainda não está(ão) pronto(s)", "Seus serviços", "X de N prontos".

## Pontos para o Tech Spec decidir
1. Unificar os rótulos de status (Na fila/Em andamento/Pronto) em todo o sistema, ou só nestas telas.
2. `SeletorDeStatus`: reaproveitar `OptionGroup`/`Tabs` ou criar.
3. De onde vem o "adicionado às 21:10 por Everton" (campos do serviço do veículo) e a "previsão HH:MM" e "pronto às HH:MM" do comprovante: confirmar na API.
4. Se o endpoint público do comprovante devolve os serviços (dependência do PRD).
5. "Valor até agora" com serviços: usar o total do back (já cobra `valorServicos` na saída) em vez de somar no front.
