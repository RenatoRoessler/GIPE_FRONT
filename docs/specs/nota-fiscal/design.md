# Design Spec: Nota Fiscal

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue `claude-design` (tokens em `src/styles/theme.ts`, componentes em `src/components/ui`) e o contexto de `PRODUCT.md`. Nada de visual novo: a tela é irmã das listas de Mensalistas, e o modal segue o padrão dos demais modais do sistema.

## Direção

Modo **Operate** para a tela da empresa (acompanhar o que está pendente, achar uma nota) e **Read/Operate** curto para o modal (preencher dois campos e confirmar, no balcão ou no celular do cliente). Sem ornamento: dado financeiro e dado pessoal pedem clareza, hierarquia firme e estados ditos em texto.

## Componentes do design system

### Reaproveitados
`Tabs`, `Table` (vira cartões no celular, como nas listas de Mensalistas), `Modal`, `Input`, `Button`, `ErrorBanner`, `Skeleton`, `StatusBadge`, `Toast`, `Text`, `PlateDisplay`, e da feature de Mensalistas: `ListError`, `EmptyState`, `TableArea`, `SkeletonRows`, `Toolbar`, `Primary`.

### Novos (`src/components/notas`)
- **`NotasFiscaisPage`**: cabeçalho, abas e conteúdo.
- **`NotasList`**: tabela de uma aba (pendentes ou lançadas) com carregando, vazio e erro.
- **`FiltroPeriodo`**: dois campos de data e a ação de aplicar, só na aba Lançadas.
- **`NotaFiscalModal`**: formulário e confirmação; usado também fora da tela de notas (recibo da saída e página pública do recibo).
- Item de menu **"Notas Fiscais"** com ícone novo de documento, no mesmo traço dos demais (2,4).

## Tokens usados

Nenhum novo. `colors.primary`, `primarySoft`, `background`, `surface`, `text`, `textMuted`, `border`, `success`, `danger`; `space`, `radii`, `fontSizes`, `fontWeights`, `typography.display` (valor da nota no modal), `breakpoints.md`.

## Tela "Notas Fiscais"

- Título "Notas Fiscais" em `Text heading`, e abas **Pendentes** e **Lançadas** (a aba ativa fica na URL, como em Mensalistas, para atualizar a página não perder o lugar).
- **Pendentes:** tabela com *Solicitada em*, *Cliente* (documento formatado, quando houver, e e-mail), *Saída* (placa) e *Valor* à direita, com algarismos tabulares. Ordem: mais antigas primeiro, porque são as que esperam há mais tempo. Uma linha de resumo acima: "N notas pendentes · R$ total".
- **Lançadas:** o filtro de período no topo, com *De* e *Até* (campos de data) e o botão **Filtrar**, começando no mês atual até hoje; a tabela traz as mesmas colunas e mais *Lançada em*. Ordem: mais recentes primeiro. Resumo: "N notas · R$ total no período".
- Colunas **[A DEFINIR]** conforme o que a consulta devolver; a tabela mostra só as colunas para as quais há dado e nunca "null".
- Celular: cada nota vira um cartão com os rótulos em linha ("Solicitada em", "Cliente", "Valor"), como nas listas de Mensalistas.
- **Estados:** carregando (linhas de esqueleto com `role="status"` e nome "Carregando notas"), vazio ("Nenhuma nota pendente." e "Nenhuma nota lançada neste período.", esta com a sugestão de ampliar o período), erro com a mensagem e "Tentar novamente"; 403 mostra só "Você não tem permissão para acessar esta página.", sem nova tentativa.
- **Filtro inválido:** *Até* antes de *De* mostra o erro no campo e não consulta; período vazio volta ao padrão.

## Modal "Gerar nota fiscal"

Modal pequeno (`sm`), em tela cheia no celular, sem fechar ao clicar no fundo enquanto há dados digitados.

1. **Cabeçalho do modal:** "Gerar nota fiscal".
2. **Resumo da nota:** bloco `surface` com o rótulo "Valor da nota" e o valor grande em fonte de display ("R$ 15.100,00"), e abaixo, em `textMuted`, "Saída de HZB-5188" quando a placa for conhecida. O valor não é editável e vem do recibo.
3. **Campos:** **E-mail** (obrigatório, tipo e-mail, até 150 caracteres, com contador a partir de 120); caixa de seleção **Pessoa jurídica** (desmarcada = pessoa física), com a dica "Marque se a nota for para uma empresa: o CNPJ passa a ser obrigatório."; e o documento, que muda com ela: **CPF** (opcional, máscara de CPF, dica "Opcional. Informe para constar na nota.") ou **CNPJ** (obrigatório, máscara de CNPJ, dica "Obrigatório para pessoa jurídica."). Trocar o tipo limpa o documento e o erro que ele tinha. Nada de campo de valor.
4. **Rodapé:** **Cancelar** e **Solicitar nota** (principal; "Enviando…" durante o envio, tudo desabilitado). Em tela estreita, o principal fica em cima.
5. **Confirmação (substitui o formulário):** ícone de check em `success`, título **"Nota fiscal solicitada"**, a data e hora da solicitação, o valor, e a frase "A empresa vai lançar a nota com os dados informados." Um único botão **Concluir**.

### Estados do modal
- **Padrão:** botão principal habilitado só com e-mail preenchido; validação ao sair do campo e ao enviar.
- **Erro de campo:** mensagem abaixo do campo ("Informe um e-mail válido", "CPF inválido", "Informe o CNPJ", "CNPJ inválido") e foco no primeiro campo inválido.
- **Já solicitada:** `ErrorBanner` com "A nota fiscal deste recibo já foi solicitada." e o botão passa a **Fechar**; quem abriu atualiza para "Nota fiscal solicitada".
- **Limite de tentativas:** "Muitas tentativas. Aguarde um minuto e tente de novo.", com o formulário preservado.
- **Recibo não encontrado ou não pago:** mensagem do back em `ErrorBanner`; formulário preservado.
- **Falha de rede ou servidor:** mensagem com o motivo; formulário e dados preservados para tentar de novo.
- **Fechar com dados digitados:** confirmação "Descartar a solicitação?" (como nos demais modais).

## Onde o modal é aberto

- **Recibo da tela de saída:** depois do total e do QR, ao lado de **Imprimir** e **Concluir**, o botão secundário **Gerar nota fiscal** (não sai na impressão). Depois de solicitada, o botão dá lugar ao texto "Nota fiscal solicitada" com ícone de check. Não aparece para saída de mensalista nem sem código do recibo.
- **Página pública do recibo:** um terceiro botão na linha de ações, **Solicitar nota**, com ícone de documento; some depois de solicitada e o rodapé mostra "Nota fiscal solicitada." Mesma regra para mensalista e valor zero.
- O modal abre por cima do que estiver aberto (o modal de saída, no caso do operador), e ao fechar o foco volta ao botão que o abriu.

## Menu

Novo item **"Notas Fiscais"**, depois de Caixa, com ícone de documento com linhas, no pórtico, no painel do celular. Fora da barra inferior (que continua com quatro itens). Aparece para todos os perfis (o menu hoje não filtra por perfil); quem não tem permissão abre a tela e vê o aviso de acesso negado.

## Acessibilidade

- Abas com navegação por setas (componente `Tabs`); tabela com cabeçalhos de coluna e `caption` oculta ("Notas fiscais pendentes").
- Modal: foco inicial no e-mail, erro com `role="alert"`, rótulos visíveis, `autocomplete="email"` no e-mail, Enter envia.
- Confirmação anunciada (`role="status"`), foco movido para o título da confirmação.
- Estados em texto, nunca só em cor; alvos de toque de pelo menos 44px; contraste AA nos quatro temas.
- Datas e valores com formato brasileiro e algarismos tabulares.

## Responsividade

- **Celular:** tabela em cartões; modal em tela cheia; filtro de período com os dois campos empilhados.
- **A partir de `md`:** tabela completa e filtro em uma linha.
