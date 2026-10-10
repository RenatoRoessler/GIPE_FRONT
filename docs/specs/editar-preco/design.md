# Design Spec: Edição de Preço

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. A edição **reaproveita o wizard de cadastro** (`docs/specs/gerenciamento-precos/design.md`, seção "Cadastro e Edição"): mesmas quatro etapas, mesmos campos e mesmas regras de validação. Este documento descreve só o que muda em relação ao cadastro.

## Direção

Modo **Operate**, igual ao cadastro. Mexer em preço tem consequência financeira, então a edição prioriza **deixar claro o que está sendo alterado** (princípio 2 do `PRODUCT.md`) antes de qualquer elemento decorativo. Nenhuma tela nova: é o mesmo contêiner largo (`Card`) com `Stepper`.

## Componentes do design system

### Reaproveitados
Todos os do cadastro: `Card`, `Stepper`, `Button`, `Input`, `Select`, `Switch`, `ErrorBanner`, `Toast`, `Skeleton`, `Text`, `Link`, `StatusBadge`, e os de feature (`PrecoInfoStepFields`, `PrecoHorariosStepFields`, `PrecoFaixasStepFields`, `PrecoCategoriasStepFields`, `FaixasPreview`, `PrecoResumo`).

### Novos
Nenhum componente novo no design system. `PrecoResumo` ganha um modo de comparação (ver "Etapa 4").

## Telas e estados

### 1. Entrada na edição (`/precos/[id]/editar`)
- **Origem**: ação "Editar" da linha na listagem (já existe). Enquanto a visualização (`/precos/[id]`) não existir, o clique na linha também deve levar à edição, para não cair em página inexistente; quando a visualização existir, volta a abrir o detalhe.
- **Carregando os dados**: o `Card` já aparece com título e `Stepper`; o conteúdo da etapa 1 é um esqueleto (`Skeleton`) com os blocos Identificação, Vigência e tolerâncias, Diária. Região com `role="status"` e `aria-label="Carregando tabela de preço"`. O formulário só monta com os dados prontos, sem campos vazios piscando.
- **Erro ao carregar**: `ErrorBanner` ("Não foi possível carregar a tabela de preço.") + `Button secondary` "Tentar novamente" e `Link` "Voltar para a listagem".
- **Não encontrada**: `Text variant="muted"` "Tabela de preço não encontrada." + `Link` "Voltar para a listagem". Sem `Stepper`.

### 2. Cabeçalho do wizard em modo edição
- Título: **"Editar preço"** (cadastro usa "Novo preço").
- Linha de apoio abaixo do título: nome da tabela em peso `medium` ao lado do `StatusBadge` da situação atual (Vigente, Agendada, Encerrada, Inativa), para o usuário sempre saber o que está editando. A descrição de etapa ("Etapa 2 de 4: ...") continua logo abaixo e segue recebendo o foco ao trocar de etapa.
- **Indicador de alterações**: quando há mudança não salva, um texto discreto "Alterações não salvas" (`Text variant="muted"`) aparece ao lado do título e some depois de salvar. Não é só cor: é texto.

### 3. Etapas 1 a 3
- Idênticas ao cadastro, com os valores atuais preenchidos.
- **Situação ("Ativo")**: na edição o `Switch` ganha texto de apoio logo abaixo: *"Desative para que esta tabela deixe de ser aplicada."* Ao desativar, o texto muda para *"Esta tabela não será aplicada enquanto estiver inativa."*
- **Período da diária**: se o valor salvo não for 6, 12 ou 24 horas, aparece como opção extra já selecionada, com o rótulo derivado dos minutos (ex.: 90 min vira "1 h 30 min"), nunca em branco.
- **Horários**: tabelas antigas podem trazer horários sem hora. Nesse caso a linha vem com os campos de hora vazios e o erro de preenchimento aparece normalmente ao avançar (o usuário completa os horários). Texto definitivo depende do ponto em aberto 5 do PRD.
- **Faixas**: o campo "% conveniada" só aparece quando o tipo de regra é Convênio; se a tabela tiver percentual salvo e o tipo for outro, o valor é preservado sem aparecer.
- **Aviso de tabela vigente** (apenas se o negócio confirmar o ponto em aberto 4 do PRD): quando a situação for Vigente, um `ErrorBanner`-like informativo no topo da etapa 1 em tom `warn`: *"Esta tabela está em vigor. As alterações valem a partir do momento em que você salvar."* Sem confirmação do negócio, **não exibir**.

### 4. Etapa 4 — Categorias e conferência
- Categorias como no cadastro.
- **Resumo com comparação**: o `PrecoResumo` mostra, para cada dado que mudou, o valor anterior riscado e o novo ao lado, em formato textual *"Valor da diária: ~~R$ 50,00~~ → R$ 55,00"*. Para listas (horários, faixas, categorias), indica *"2 faixas adicionadas · 1 removida · 1 alterada"* e a lista final. Sem mudanças: *"Nenhuma alteração em relação à tabela salva."* A comparação só aparece na edição; o cadastro mantém o resumo simples.
- A mudança nunca é indicada só por cor: usa o texto "antes → depois" e o risco no valor antigo (`text-decoration: line-through`) com `colors.textMuted`.
- **Botão final**: "Salvar alterações" (cadastro usa "Salvar"). Desabilitado enquanto não há alterações, com o texto de apoio *"Nenhuma alteração para salvar."* Durante o envio: "Salvando..." e controles desabilitados.

### 5. Resultado
- **Sucesso**: volta a `/precos` com `Toast` "Tabela de preço atualizada." (mesmo mecanismo do cadastro).
- **Erro ao salvar**: `ErrorBanner` com a mensagem, acima das ações da etapa 4; os dados permanecem. Se o erro for de validação do backend, sem detalhe por campo, mostra apenas a mensagem geral.
- **Sair com alterações**: botão "Cancelar" (ou navegação) com mudanças pendentes pede confirmação ("Descartar as alterações feitas nesta tabela de preço?"). Sem mudanças, sai direto.

## Tokens usados
Nenhum token novo. `colors.textMuted` e `text-decoration: line-through` para o valor anterior; `colors.warn`/`colors.onWarn` para o aviso de vigência (se confirmado); `space`, `radii`, `fontSizes` e `fontWeights` do tema como no cadastro.

## Acessibilidade
- Estado de carregamento anunciado (`role="status"`); troca de etapa move o foco para a descrição da etapa, como no cadastro.
- "Alterações não salvas" em região `aria-live="polite"`, para ser anunciada uma vez ao surgir.
- Comparação "antes → depois" legível por leitor de tela: *"Valor da diária: era R$ 50,00, agora R$ 55,00"* via texto visualmente oculto complementar.
- Botão desabilitado explica o motivo por texto visível (não só `disabled`).

## Responsividade
Igual ao cadastro. Em telas pequenas, a linha do nome da tabela e do `StatusBadge` quebra em duas linhas; a comparação "antes → depois" empilha (valor antigo acima do novo); botões das etapas em largura total.
