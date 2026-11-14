# Design Spec: Melhorias na Tela de Serviços

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` e dos três protótipos de `docs/specs/input.md` (`Murel Serviços.html` = catálogo e cadastro no desktop, `Murel Serviços Mobile.html` = catálogo e cadastro em passos no celular, `Murel Fila de Serviços.html` = fila). Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e **complementa** `docs/specs/modulo-servicos/design.md`, que continua valendo no que esta spec não altera (ticket do veículo, acrescentar serviços, navegação e permissões).

Os protótipos trazem os próprios tokens (navy, amarelo, `--exec` azul etc.). **Não são fonte de cores**: tudo mapeia para o tema existente (ver "Tokens"). Os protótipos também trazem recursos só de demonstração (alternador Desktop/Celular, troca de perfil, painéis "Para o desenvolvedor", barra superior e menu do protótipo): nada disso é implementado.

## Direção

Dois modos, uma linguagem (como no módulo).
- **Catálogo e cadastro** — **Operate administrativo**. O cadastro deixa de ser uma tabela de campos e vira um fluxo com ponto de partida (modelo), ajuda para repetir valores e uma **prévia ao vivo** do que o operador e o cliente verão. A prévia é o gesto de design da tela: o administrador enxerga a consequência de cada campo.
- **Fila** — **Operate de portão**. De relance: o que fazer agora, quanto falta, o que atrasou. A hierarquia do cartão é placa → serviço → tempo → ação. Uma ação principal por cartão, grande; a correção (voltar) é texto discreto.
- **Status sempre em texto**, cor só reforça. Dinheiro e minutos em numerais tabulares (`fontFamilies.mono` nos valores), sempre "R$" e duas casas. Sem ícone decorativo.
- **Atraso é informação, não alarme**: chip e linha de texto em `danger`, nunca animação.

## Divergências dos protótipos (decisões)

| Protótipo | Decisão |
|---|---|
| Rótulos "Aguardando / Em execução" | Usar os do sistema: **Na fila / Em andamento / Pronto** (`STATUS_ROTULO`). |
| Tokens próprios (`--exec` azul, `--aguarda`, `--pronto`) | Em andamento = `warn`, Pronto = `success`, Na fila = `neutral`, via `StatusBadge`. Não criar token azul. |
| Barra navy + trilho lateral + abas inferiores do protótipo | Já resolvidos pelo shell do app (menu lateral/inferior). Não reproduzir. |
| Botão "Cancelar" no cartão em Aguardando e perfil Lavador sem cancelar | Mantém regra existente (`podeCancelar`: só Na fila) e permissão por perfil da API. |
| Cadastro desktop em página própria (`#novo`, `#editar`) | Mantém `ServicoFormModal` (Modal no desktop, tela cheia no celular). Só passa para página própria se o Tech Spec justificar. |
| Prévia com JSON do desenvolvedor | Não implementar. |

## Dependências de dados (vão para o Tech Spec)

Os protótipos assumem campos que os tipos atuais (`src/types/servico.ts`) **não têm**. A UI deve degradar sem eles, e o Tech Spec decide o contrato com o back:

1. **Duração e tempo grátis por categoria** (hoje `duracaoMinutos` e `tempoPermitidoMinutos` são do serviço, `PrecoServico` só tem valor). Sem esses campos por categoria: manter os dois campos globais do serviço, e a grade de categorias mostra só valor.
2. **Fila**: `ItemFila` não traz `dataCriacao` (entrada na fila), `dataHoraInicio`, `dataHoraPronto`, `duracaoMinutos` nem quantidade de outros serviços do mesmo carro. Sem eles: omitir a linha de tempo, a barra de progresso e o aviso de atraso do que faltar; mostrar apenas o que existir. Nunca inventar ou estimar no cliente.
3. **Modelos de serviço** (lavagem simples, completa…): constantes de front, sem API.

Regra geral: cada elemento novo tem fallback "omitir", nunca valor falso.

## Componentes

### Reaproveitados
`Modal`, `BottomSheet`, `Button` (`primary`, `secondary`, `danger`, `sm`), `Input` (incl. `type="search"`), `Textarea` (com contador), `NumberStepper`, `Switch` (categoria "recebe / não recebe"), `Tabs` (`segmentada` nas abas da fila no celular; `linha` onde couber), `OptionGroup` (chips de duração e de tempo grátis; avaliar), `StatusBadge`, `ProgressBar` (barra de progresso do serviço em execução), `PlateDisplay`, `Skeleton`, `ErrorBanner`, `Toast` (com ação **Desfazer**; confirmar suporte a ação no Tech Spec), `ConfirmDialog`, `Stepper` (passos do cadastro no celular), `ActionBar`/`DockBar` (ação principal presa embaixo no celular), `Checkbox`.

### Novos (de feature, em `components/servicos`)
- **`ServicoCard`**: item da lista do catálogo (substitui/estende `ServicoListItem`): nome, faixa de preço ("a partir de" quando varia), duração e "grátis no pátio", pílulas de categorias.
- **`CategoriasAtendidas`**: linha de pílulas (Moto, Pequeno, Médio, Grande, Caminhonete, Caminhão), riscadas e em `textMuted` quando o serviço não atende.
- **`ModelosDeServico`**: chips de modelos prontos no topo do cadastro novo.
- **`CategoriaLinha`** (desktop) e **`CategoriaFolha`** (celular, `BottomSheet`): edição de valor, duração e tempo grátis de uma categoria, com `Switch` "recebe este serviço".
- **`PreviaDoServico`**: bloco "Como aparece ao lançar no carro" + (celular, passo 3) "O que o cliente vê no comprovante" com seletor de categoria.
- **`ResumoDaFila`**: chips de contagem por status e de atrasados.
- **`FilaTempo`**: linha de tempo do cartão por status (e barra de progresso/atraso).
- **`DesfazerStatus`**: não é componente, é comportamento do `Toast` (ver Interação).

`FilaCard`, `FilaServicos`, `ServicoFormModal`, `PrecosPorCategoria`, `CancelarServicoDialog` já existem e são **reescritos na apresentação**, mantendo a lógica de dados (hooks `useFilaServicos`, `useAtualizarStatusServico`, etc.).

Nada novo em `ui`, salvo se `OptionGroup` não servir como chips de seleção única com "outro valor": nesse caso criar variante no próprio `OptionGroup`.

## Tokens usados

Nenhum token novo.
- Cores: `primary`/`onPrimary` (Iniciar, Marcar pronto, Salvar, Novo serviço, Revisar), `accent` (links e rótulo de seção em mono), `success`, `warn`/`onWarn`, `danger`/`dangerSoft` (atraso, categoria que não atende, erro, Cancelar), `surface`, `surfaceMuted` (coluna da fila e pílulas), `background`, `border`, `borderStrong` (campos e chips), `text`, `textMuted`, `focus`, `primarySoft`/`primarySofter` (categoria pronta/selecionada).
- Tipografia: `fontFamilies.mono` para valores, tempos, placa e rótulos de seção em caixa alta; `typography.display*` nos títulos de tela; `fontSizes` `xs`–`xl`; `fontWeights` `semibold`–`extrabold`.
- Forma: `radii.lg`/`xl` nos cartões e colunas, `radii.full` em chips e pílulas, `shadows.sm` no cartão da fila.
- Layout: `layout.touchTarget` (44px) em toda ação da fila e linha de categoria; `layout.actionBarHeight` e `layout.fabClearance` no celular; `layout.bottomNavReserved` no fim das listas; `layout.contentMaxWidth` para limitar o catálogo.
- Tons de status: Na fila `neutral`, Em andamento `warn`, Pronto `success`, Cancelado `danger`.

## Tela 1: Catálogo (lista)

Cabeçalho: eyebrow "Lava-rápido" (mono, caixa alta, `textMuted`), título "Serviços", **Novo serviço** (`primary`) à direita no desktop; no celular, botão flutuante "Novo serviço" respeitando `fabClearance`.

1. **Busca** (`Input type="search"`, rótulo oculto "Buscar serviço"). Desktop busca por nome e descrição; celular por nome. Filtro local, imediato; mantém foco e cursor ao filtrar.
2. **Resumo** (chips): "N ativos" e "N com tempo grátis no pátio", `aria-live="polite"`.
3. **Itens** (`ServicoCard`): título semibold; meta em `textMuted` ("30 min a 1h · até 2h grátis" ou "cobra permanência"); `CategoriasAtendidas`; à direita o preço: valor único, ou "a partir de" (xs) + valor mínimo, em mono. Toque no item abre o detalhe/edição (mantém o master-detail do módulo no desktop).

Estados: *Carregando* (oito `Skeleton`), *Sem resultado* ("Nenhum serviço com "x"" + "Confira a grafia ou cadastre um serviço novo." + **Limpar busca**), *Vazio* (mensagem "Cadastre o primeiro serviço" + texto "Lavagem, polimento, higienização: o que você cadastrar aqui aparece para lançar no carro que está no pátio." + **Novo serviço**), *Erro* (`ErrorBanner` + **Tentar novamente**).

## Tela 2: Cadastro e edição

`Modal size="lg"` no desktop, tela cheia (`BottomSheet`) no celular. Título "Novo serviço" / "Editar serviço · #id" (eyebrow).

### Desktop: uma página rolável, duas seções numeradas
**1 · Dados do serviço**
- (Só em cadastro novo) **Modelos**: rótulo "Comece por um modelo e ajuste o que precisar" + chips (`ModelosDeServico`). Escolher um modelo preenche nome, descrição e categorias; não bloqueia nada.
- **Nome** (obrigatório, máx. 100), **Descrição** (`Textarea`, opcional, contador "N/255"; ajuda: "Aparece no recibo do cliente, junto com o valor.").

**2 · Preço e tempos por categoria**
- Ajuda: "Preencha cada categoria que recebe o serviço. Desligue a que não recebe." + ação secundária **Repetir a 1ª linha nas vazias**.
- Grade de 6 linhas (`CategoriaLinha`), cabeçalho de colunas **Valor · Duração · Grátis no pátio**; por linha: nome da categoria com exemplos em `xs` (Carro pequeno: "Mobi, Kwid, HB20"), campo de valor com prefixo "R$" (máscara monetária), campos de minutos com sufixo "min", e `Switch` "recebe este serviço". Categoria desligada: linha esmaecida, "Não faz" no lugar dos campos, texto "Não recebe este serviço".
- Texto de ajuda fixo: "Duração: previsão para o lavador. Grátis no pátio: enquanto o carro espera o serviço, a permanência não é cobrada; passou disso, ou com 0, cobra o avulso normal."
- **Prévia** (`PreviaDoServico`), cartão `surfaceMuted` com rótulo mono "Como aparece ao lançar no carro": o mesmo `ServicoOpcao` que o operador verá (nome, meta, preço) + "Não aparece para: …" quando houver categorias desligadas. Atualiza a cada tecla.
- **Inativar serviço** (só edição), botão de texto em `danger`, abre `ConfirmDialog`.
- **Barra de ações** presa embaixo do modal: **Cancelar** (`secondary`) e **Cadastrar serviço / Salvar alterações** (`primary`).

### Celular: três passos
Cabeçalho do modal com voltar, título, "N de 3" (mono) e fechar; `Stepper` fino de 3 segmentos. Ação principal presa embaixo (`ActionBar`).
- **Passo 1 · Dados**: modelos (só novo), nome, descrição ("Aparece no comprovante do cliente · N/255"). CTA "Próximo: categorias".
- **Passo 2 · Categorias**: título "Valor e tempos de cada carro". Contador "N de M prontas" e, ao lado, "K sem valor" (`danger`) ou "Tudo certo" (`success`). Lista de 6 botões de categoria (≥ 56px): nome + resumo em uma linha ("R$ 70,00 · 1h · 2h grátis", "Toque para definir", "Não faz"); estados `pronta` (`primarySoft`), `não faz` (esmaecida), `falta` (borda `danger` após tentar avançar). Toque abre `CategoriaFolha`. CTA "Revisar".
- **`CategoriaFolha`** (`BottomSheet`): cabeçalho com nome e exemplos; `Switch` "Faz este serviço"; **Valor** (prefixo R$, teclado numérico); **Quanto tempo leva** com chips (15 min, 30 min, 45 min, 1h, 1h30, 2h, 3h, 4h) + campo "Outro" em min; **Tempo grátis no pátio** com chips (Nenhum, 30 min, 1h, 2h, 3h, 4h) + "Outro"; ajuda "Enquanto espera o serviço, o carro não paga estacionamento. Passou disso, cobra a tabela normal."; caixa "Usar também nas N categorias sem valor" quando houver vazias. Botões **Fechar** e **Salvar**. Chip selecionado = `primary` com `onPrimary`.
- **Passo 3 · Revisão**: nome e descrição; lista por categoria (nome, valor mono, "leva 1h · 2h grátis no pátio" ou "Não faz" riscado) + link "Alterar categorias"; bloco **"O que o cliente vê no comprovante"** com seletor segmentado de categoria e o texto ("Após iniciar o serviço, finaliza em cerca de 1 hora." / "Seu carro pode ficar 2 horas no pátio sem pagar estacionamento. Depois disso, cobra a tabela normal."). CTA "Cadastrar serviço" / "Salvar alterações". Inativar aparece no passo 1 na edição.

### Validação
Mensagem junto ao campo (nunca só cor), `aria-invalid` + `aria-describedby`; foco vai ao primeiro erro. Regras e textos:
- Nome: "Dê um nome ao serviço"; duplicado: "Já existe um serviço ativo com esse nome. Use outro nome ou edite o existente."
- Categoria ativa sem valor: "Informe o valor de {categoria}" (celular: a categoria fica em `falta` e vai ao topo da mensagem).
- Nenhuma categoria ativa com valor: "Preencha o valor de ao menos uma categoria".
- Duração incoerente com tempo grátis: mensagem na própria categoria.
- Erro 400/401/403 do servidor: `ErrorBanner` no topo do formulário.
Sucesso: `Toast` "Serviço criado." / "Serviço atualizado."; o serviço fica selecionado na lista.

## Tela 3: Fila de serviços

Cabeçalho: eyebrow "Lava-rápido · agora HH:MM" (mono), título "Fila de serviços", `ResumoDaFila` à direita (chips "N na fila", "N em andamento", "N prontos", cada um com ponto de cor do status; e "N passou da previsão" em `danger` quando houver). Busca "Placa ou prisma" (maiúsculas automáticas; ignora hífen e espaços).

### Estrutura
- **Desktop (≥ `md`)**: quadro de 3 colunas (`surfaceMuted`, `radii.xl`, borda `border`). Cabeçalho da coluna: ponto, título, contagem em pílula. Coluna vazia: caixa tracejada com mensagem própria.
- **Celular (< `md`)**: `Tabs` segmentadas fixas no topo com contagem (**Na fila 3 · Em andamento 2 · Pronto 2**), um status por vez, a aba no endereço (`?status=`). Ao mudar o status de um cartão, a aba acompanha o serviço **somente se o usuário pediu a ação** (como no protótipo), com anúncio ao leitor de tela.

### Cartão (`FilaCard`), de cima para baixo
1. **Placa** (`PlateDisplay` compacto) e, à direita, selo "P 12" (prisma, mono) quando houver.
2. **Veículo**: "Onix prata · Carro médio" (`textMuted`).
3. **Serviço**: nome semibold; ao lado, "+N no carro" (xs, `textMuted`) quando o mesmo veículo tiver outros serviços na fila.
4. **Tempo** (`FilaTempo`), por status:
   - Na fila: "Na fila há **12 min**" · "leva ~1h".
   - Em andamento: "Iniciado às **14:32** · há 48 min" · "termina ~**15:32**" + `ProgressBar` (`role="progressbar"` com valor). Passou da previsão: o cartão ganha borda `danger`, e abaixo uma linha "Passou 20 min da previsão" (`danger`, semibold).
   - Pronto: "Pronto às **15:10**" · "aguardando retirada há 26 min".
5. **Ações** (≥ 44px; no celular a principal em largura total):
   - Na fila: **Iniciar** (`primary`) + **Cancelar** (texto `danger`, só quem pode).
   - Em andamento: **Marcar como pronto** (`primary`) + **Voltar** (texto, `title`/rótulo "Voltar para Na fila").
   - Pronto: **Voltar para em andamento** (texto).

Cada elemento de tempo só aparece se o dado existir (ver "Dependências de dados").

### Interação
- Mudar status: atualização otimista; `Toast` com mensagem por destino ("Lavagem completa · RTZ4E21 em andamento." / "…pronto. O cliente já vê no comprovante.") e botão **Desfazer** por ~5 s. Desfazer reenvia o status anterior. Falha da API: o cartão volta e `Toast` de erro.
- Cancelar: `CancelarServicoDialog` (`BottomSheet` no celular, `Modal` no desktop). Título "Cancelar {serviço em minúsculas}?"; resumo com placa e modelo + efeito: "O serviço sai do valor e do tempo grátis do carro; sem outro serviço, a permanência volta a ser cobrada desde a entrada."; **motivos rápidos** (chips: Cliente desistiu, Cliente com pressa, Sem horário hoje, Lançado por engano) que preenchem o `Textarea` "Motivo" (obrigatório, máx. 200); botões **Manter** (`secondary`) e **Cancelar serviço** (`danger`, desabilitado sem motivo).
- Atualização automática a cada 30 s e ao recuperar o foco da aba, preservando rolagem; "Atualizado há N s" em `textMuted`. Cartão em ação não é reordenado durante o toque.
- Foco: após mudar o status, vai ao próximo cartão da mesma coluna (ou à coluna, se esvaziou).

Estados: *Carregando* (3 `Skeleton` de cartão por coluna), *Coluna vazia* ("Nenhum carro esperando serviço." / "Ninguém lavando agora." / "Nenhum carro pronto aguardando retirada."), *Fila toda vazia* ("Nenhum serviço na fila. Os serviços acrescentados aos veículos aparecem aqui."), *Busca sem resultado* (mensagem + **Limpar busca**), *Erro* (`ErrorBanner` + **Tentar novamente**, mantendo os cartões já carregados), *Sem permissão* (acesso negado existente).

## Acessibilidade

- Colunas como regiões nomeadas com contagem ("Em andamento, 2 serviços"); cartão como `article` com `aria-label` "{serviço} do carro {placa}".
- Mudança de status e atraso anunciados em `aria-live="polite"`; atraso nunca só por cor (texto + borda).
- `ProgressBar` com `aria-valuenow/min/max`; chips de seleção com `aria-pressed`; `Switch` com `role="switch"` e nome "{categoria} recebe este serviço".
- Campos de valor e minutos com `inputMode="numeric"`, rótulo visível ou `aria-label` ("Duração para Moto em minutos").
- Foco visível `colors.focus`; ao fechar `BottomSheet`/`Modal`, o foco volta ao gatilho. Respeita `prefers-reduced-motion`.
- Contraste AA nos quatro temas; alvos ≥ `layout.touchTarget`.

## Responsividade

- **≥ `lg`**: catálogo em master-detail; fila em 3 colunas; cadastro em `Modal` largo com grade de categorias em colunas (Valor, Duração, Grátis).
- **`md`**: mesmas estruturas, listas mais estreitas; grade de categorias empilha Duração/Grátis abaixo do Valor se faltar largura.
- **< `md`**: catálogo em lista → detalhe em tela cheia; cadastro em 3 passos; fila em abas.
- **`sm` (480px) e 360px**: ação principal do cartão e CTA do passo em largura total; chips quebram em linhas; sem rolagem horizontal em nenhum tamanho; respeitar `layout.bottomNavReserved`, `actionBarHeight` e `fabClearance` no fim das telas.
- Tema claro e escuro via tokens; nada de cor fixa do protótipo.
