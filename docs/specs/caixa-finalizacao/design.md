# Design Spec: Finalização do Caixa

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Redesenha a tela `/caixa` (visão melhorada, RF11 a RF17), ajusta os modais existentes ao contrato da API (RF1 a RF3) e cria o histórico de caixas fechados com extrato (RF8, RF9, RF18). Tudo dentro da área logada (`AppShell`).

## Direção

Modo **Operate** (`impeccable`): quem abre esta tela está no meio de uma tarefa — conferir a gaveta, retirar dinheiro, passar o turno, fechar. O contexto é o balcão (tablet, às vezes celular) e a gestão à distância (desktop). A interface tem de se desfazer na tarefa: números grandes e legíveis, sem decoração, estados completos.

**Ideia organizadora: a gaveta.** Hoje a tela abre com cinco cartões iguais (saldo, fundo, entradas, saídas, abertura) que obrigam a fazer conta. A pergunta real do operador é *"quanto tem na gaveta e quanto posso tirar?"*. A tela passa a abrir respondendo isso, e só depois mostra de onde vieram os números.

Princípios:
- **Um número domina por vez.** O destaque é o dinheiro esperado na gaveta, dividido em "fica" (fundo) e "pode retirar" (disponível).
- **Número sempre em texto.** Barras e gráficos reforçam, nunca substituem; diferenças têm palavra além de cor (Sobra, Falta, Sem diferença).
- **Hierarquia por tamanho e espaço, não por moldura.** Sem grade de cartões idênticos, sem painéis dentro de painéis.
- Cor com função: `success` entradas, `danger` saídas e faltas, `primary` só ação principal e seleção.

## Componentes do design system

### Reaproveitados
- **Button** (`primary`, `secondary`, `danger`; `size sm` nas ações de tabela), **Text**, **Modal**, **Table** (com `data-label` para o modo cartão no mobile), **StatusBadge** (tons `success`, `neutral`, `info`; tom de alerta para falta), **Skeleton**, **ErrorBanner**, **Toast**, **Tabs**, **Pagination**, **Select**, **Input**, **Link**.
- **ErroSemPermissao** (`src/components/layout/ErroSemPermissao`) para 403 nas listas novas.
- **Gráficos do pátio** (`src/components/patio/graficos`): `BarrasHorizontais` e o padrão de colunas por hora de `ChegadasPorHora` servem de base. Os dois hoje mostram contagens; os gráficos do caixa precisam de valores em reais e de duas séries (entradas e saídas), então o Tech Spec decide entre generalizá-los (promovê-los a `src/components/ui`) ou criar variantes irmãs.

### Novos (domínio do caixa, em `src/components/caixa`, sem tocar em `ui`)
- **GavetaResumo**: o bloco de destaque (ver "Tela principal").
- **FormasPagamentoTabela**: tabela do turno com barra de proporção embutida por linha.
- **MovimentosLista**: tabela de movimentos com filtros e paginação, reutilizada no caixa aberto e no extrato.
- **LinhaDoTempo**: lista ordenada de eventos do caixa.
- **GraficosCaixa**: os dois gráficos do turno.
- **ResumoFechamento**: conteúdo exibido após fechar o caixa ou passar o turno, com o botão de comprovante.

### Possível novo em `ui` (a decidir no Tech Spec)
- **SegmentedControl** (filtro de tipo dos movimentos): ao menos uma outra tela já precisa de "escolher uma opção entre poucas" (`OptionGroup` existe). Reaproveitar `OptionGroup` antes de criar.

## Tokens
Nenhum token novo no começo. Usar `colors.success`, `danger`, `dangerSoft`, `primary`, `primarySoft`, `surface`, `border`, `textMuted`, `space`, `fontSizes` (`xl` para o número da gaveta), `radii`, `breakpoints`. Se a barra de entradas pedir um fundo suave de sucesso, **adicionar `successSoft` ao tema** (claro e escuro) em vez de um valor solto.

## Telas e estados

### 1. Tela principal `/caixa` (caixa aberto)

Ordem vertical, largura máxima atual (1100px):

1. **Cabeçalho**: título "Caixa", linha de status ("Caixa aberto" em `StatusBadge success`, "desde 08:12 de hoje · aberto por Maria"), e a barra de ações à direita no desktop: `Retirada` (secondary, só Administrador, Gerente e Caixa), `Passar turno` (secondary), `Histórico de turnos` (secondary, todos os perfis), `Fechar caixa` (danger). Para Administrador e Gerente, um `Link` "Caixas anteriores" leva a `/caixa/historico`.

2. **Gaveta** (`GavetaResumo`), o foco da tela:
   - Rótulo "Na gaveta agora" e, em `fontSizes.xl`, o dinheiro esperado.
   - Uma **barra segmentada** de largura total: trecho "Fundo de caixa — fica na gaveta" (`border`/`surface`) e trecho "Pode retirar" (`primarySoft`/`primary`), com os dois valores em texto logo abaixo, cada um com seu rótulo.
   - Ao lado do "Pode retirar", o botão `Retirada` (mesma regra de perfil), para o gesto mais comum ficar a um toque do número que o limita. Sem permissão, o botão some e o número fica.
   - Linha secundária compacta, sem cartões: **Entradas** (verde), **Saídas** (vermelho), **Saldo do caixa**, separadas por divisores finos. Valores vêm prontos da API, sem conta própria.
   - Estados: carregando (`Skeleton` na altura do bloco), sem turno (bloco substituído por "Sem turno aberto" com a causa), erro (`ErrorBanner` + `Tentar novamente`; em 403, `ErroSemPermissao`).

3. **Turno atual**: faixa de contexto (responsável, início, "fundo do turno") e a **tabela por forma de pagamento** (`FormasPagamentoTabela`): colunas Forma · Entradas · Saídas · Esperado, com uma barra fina atrás/abaixo do valor de Entradas proporcional ao maior valor, para ver qual forma concentra o movimento. Dinheiro vem primeiro; boleto e transferência só aparecem quando a API os devolve. No mobile, cada forma vira uma linha-cartão.

4. **Atividade do caixa** (abas, `Tabs`): **Movimentos** · **Linha do tempo** · **Gráficos**. A aba ativa fica na URL (`?aba=`), como nas notas fiscais, para o link e o voltar funcionarem.

   **Movimentos** (`MovimentosLista`):
   - Barra de filtros: grupo de opções **Todos · Entradas · Saídas · Sangrias** (botões com `aria-pressed` ou radio) e um `Select` "Turno" (Todos os turnos / um por responsável e horário).
   - Tabela: Data/hora · Tipo (`StatusBadge`: Entrada verde, Saída vermelho, Sangria âmbar) · Forma · Turno e usuário · Motivo · Valor (alinhado à direita, `+`/`−` e cor). A coluna Motivo só tem conteúdo quando a API o devolve.
   - 20 por página (`Pagination`), filtro aplicado no navegador (a lista vem completa).
   - Estados: carregando (linhas esqueleto), **vazio** ("Ainda não há movimentos neste caixa." + nota de que as entradas vêm das saídas de veículos no pátio), **vazio por filtro** ("Nenhum movimento com esses filtros" + `Limpar filtros`), erro com nova tentativa, 403 com `ErroSemPermissao`.
   - Mobile: cada movimento vira uma linha de duas camadas — valor e tipo em cima, forma, usuário e hora embaixo.

   **Linha do tempo** (`LinhaDoTempo`): lista vertical ordenada (`<ol>`), do mais recente ao mais antigo, com marcador por tipo de evento: *Caixa aberto*, *Retirada de R$ x — motivo*, *Passagem de turno de Fulano para Beltrano*, *Caixa fechado*. Cada item mostra hora e autor. Eventos derivados de turnos e movimentos já carregados. Vazia: só "Caixa aberto". Sem animação decorativa.

   **Gráficos** (`GraficosCaixa`): dois painéis com título:
   - *Por forma de pagamento*: barras de entradas e saídas lado a lado, valor em texto à direita.
   - *Por hora do turno*: colunas de entradas (verde) e saídas (vermelho) por hora, com resumo textual acima ("Pico de entradas às 14h: R$ …"), `role="img"` com `aria-label` e a tabela equivalente acessível por leitor de tela.
   - Vazio: "Sem movimentos para o gráfico".

5. **Estado caixa fechado** (já existe, `CaixaFechado`): mensagem + `Abrir caixa`. Acrescenta, para Administrador e Gerente, o `Link` "Caixas anteriores" abaixo do botão, porque é o que quem chega a um caixa fechado costuma querer.

### 2. Modais existentes ajustados ao contrato

- **Abrir caixa** (sem mudança visual): campo "Fundo de caixa".
- **Retirada** (`SangriaModal`): topo do modal repete a mesma barra segmentada em miniatura ("Na gaveta R$ x · Fica R$ y · Pode retirar R$ z"). Campos: Valor e Motivo (obrigatório). Erro de limite: "O valor passa do que pode ser retirado (R$ z). O fundo de caixa fica na gaveta." Nenhuma menção a troco padrão. Erro 400 da API aparece como veio.
- **Passar turno** (`PassarTurnoModal`): conferência por forma de pagamento (como hoje) e o campo renomeado para **"Fundo de caixa do novo turno"** (dinheiro que fica na gaveta). Ajuda abaixo: "Se deixar em branco, fica o fundo do turno atual mais o dinheiro que você conferiu: R$ x" (valor calculado ao vivo). Dinheiro conferido com a nota "sem o fundo de caixa".
- **Fechar caixa** (`FecharCaixaModal`): conferência por forma de pagamento (dinheiro "sem o fundo") e novo campo opcional **"Fundo de caixa contado na gaveta"** (não negativo) com a ajuda "Opcional. Informe o que há na gaveta no fechamento, além do dinheiro conferido." Observação opcional. Confirmação em duas etapas, como hoje: formas em branco contam como zero e isso é dito antes de confirmar.
- **Histórico de turnos** (`HistoricoTurnosModal`): sem mudança de layout; passa a abrir para os quatro perfis.

### 3. Resumo após fechar e após passar turno (`ResumoFechamento`)

Substitui o fechamento "silencioso". Mostrado dentro do mesmo modal, no lugar do formulário, depois do sucesso:
- Título "Caixa fechado" ou "Turno passado".
- Tabela por forma de pagamento: Esperado · Informado · Diferença (com palavra: *Sobra R$ x*, *Falta R$ x*, *Sem diferença*) e uma linha de total.
- Responsáveis, horário, observação.
- Botões: `Baixar comprovante (PDF)` (primary) e `Fechar` (secondary). O PDF gera no navegador; durante a geração o botão fica desabilitado com "Gerando…". Falha na geração: `ErrorBanner` no modal, sem perder o resumo.
- Depois de fechado o caixa, a tela volta ao estado "caixa fechado".

### 4. Histórico de caixas `/caixa/historico` (só Administrador e Gerente)

- Cabeçalho com título "Caixas anteriores" e `Link` de volta para `/caixa`.
- **Filtro por período**: dois campos de data (De / Até) e `Filtrar`. Data inicial maior que a final: erro no campo ("A data inicial não pode ser depois da final"), sem chamar a API.
- **Tabela**: Aberto em · Fechado em · Abriu · Fechou · Entradas · Saídas · Diferença · ação `Ver extrato`. As colunas de totais seguem o que a resposta real trouxer (ver Questões do PRD). Diferença com palavra e cor. Paginação do servidor (`Pagination`), 20 por página.
- Mobile: cada caixa vira um cartão com as datas em cima, totais embaixo e `Ver extrato`.
- Estados: carregando (esqueleto), vazio ("Nenhum caixa fechado nesse período."), erro com nova tentativa, 403 com `ErroSemPermissao`.

### 5. Extrato de um caixa fechado `/caixa/historico/[caixaId]`

- Cabeçalho: "Caixa de 12/10 — 08:00 às 18:30", quem abriu e fechou, e `Link` "Voltar aos caixas anteriores".
- Resumo em linha (mesmo vocabulário da gaveta: fundo, entradas, saídas, diferença).
- `MovimentosLista` igual à do caixa aberto, com os mesmos filtros de tipo e de turno.
- Barra de ações do extrato: `Baixar CSV` e `Baixar PDF` (secondary). Exportam **o que está filtrado na tela**, e o rótulo avisa quando há filtro ativo ("Baixar CSV (filtrado)").
- Estados: carregando, caixa não encontrado (404: "Caixa não encontrado" + link de volta), caixa ainda aberto (400: mensagem da API + link para `/caixa`), erro, 403.

### 6. Comprovante e extrato em PDF (folha A4)

Fora da interface, mas parte do design: cabeçalho com razão social e CNPJ, título do documento (Fechamento de caixa / Passagem de turno / Extrato do caixa), período e responsáveis, tabela por forma de pagamento (esperado, informado, diferença) ou a lista de movimentos, observação e duas linhas de assinatura (quem entrega e quem recebe no turno). Só preto, cinzas e um acento; funciona impresso em preto e branco. Rodapé com data e hora da geração.

## Responsividade

- **`< breakpoints.sm` (480px)**: Gaveta empilha (valor, barra, "fica" e "pode retirar" um sobre o outro); `Retirada` em largura total logo abaixo; linha de Entradas/Saídas/Saldo vira três linhas; tabelas viram cartões; barra de ações do cabeçalho em coluna (já é assim hoje).
- **`sm` a `md`**: Gaveta em duas colunas (número à esquerda, barra e divisão à direita); tabelas ainda em modo cartão até `md`.
- **`≥ lg` (1024px)**: ações do cabeçalho à direita do título; tabelas completas; gráficos lado a lado.
- Tablet no balcão é o alvo operacional: alvos de toque de pelo menos 44px nos botões de filtro e nas ações; nada depende de hover.

## Acessibilidade (AA)

- Todo valor monetário em texto; barras e colunas com `aria-hidden` e o texto equivalente ao lado, ou `role="img"` com resumo.
- Diferença nunca só por cor: *Sobra*, *Falta*, *Sem diferença*.
- Filtros de tipo como grupo com `aria-pressed`/radio, com rótulo; mudança de resultado anunciada (`aria-live="polite"` com "12 movimentos").
- Abas com o `Tabs` existente (setas, Home, End).
- Modais com foco gerenciado (o `Modal` já faz); após o sucesso, o foco vai para o título do resumo.
- Botões que geram PDF/CSV anunciam o estado ("Gerando…").
- Tabela de movimentos com cabeçalhos de coluna e, no mobile, rótulos por célula (`data-label`).

## Fora desta spec de design
- Escolha de biblioteca de PDF e geração de CSV (Tech Spec).
- Esquemas de resposta da API (a validar com a API liberada).
- Mudanças no pátio, mensalistas ou notas fiscais.
