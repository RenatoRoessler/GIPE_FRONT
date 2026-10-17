# Design Spec: Cadastro de Preços em 3 etapas com resumo ao vivo

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` e da proposta **A · Cadastro em 3 etapas** aprovada na avaliação de layouts. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. Vale para criar e editar: é o mesmo componente (`PrecoWizardForm`). Os campos, as regras de validação e o que é enviado ao servidor não mudam.

## Direção

Modo **Operate**. O princípio do produto que guia a tela: *entender exatamente que regra de cobrança está ativa e por quê*. Quem cadastra deve ver a tabela se formando enquanto preenche, em vez de descobrir o resultado na última etapa.

Gestos visuais, todos contidos:
- A **placa tarifária** em azul de sinalização (`FaixasPreview`) fica sempre visível ao lado, como o único bloco de cor cheia da tela. O resto é tipografia, linhas e o estado das etapas.
- O **indicador de etapas** deixa de ser decoração e vira navegação: três botões largos com número, nome e uma linha de apoio, que viram ✓ (completa) ou ! (pendência) conforme o preenchimento.
- O painel **Sua tabela** é uma lista de conferência: cada item ganha ✓ quando preenchido. Dado financeiro pede estado dito em texto, não só em cor.

## Componentes do design system

### Reaproveitados
`Card`, `Button`, `Text`, `ErrorBanner`, `Checkbox` ("Sem data de fim"), `Switch` ("Ativo"), `Select`, `Input` (via campos do formulário), `StatusBadge`, `OptionGroup` (chips de categoria, como hoje).

Da feature: `FaixasPreview` (a placa; tamanho `md`), `PrecoResumo` (aproveitado no modo edição para o "antes → depois"), formatadores de `components/precos/format.ts`, `semana.ts` (agrupar dias iguais no resumo de horários) e `situacao.ts`.

Os campos de cada etapa atual (`PrecoInfoStepFields`, `PrecoHorariosStepFields`, `PrecoFaixasStepFields`, `PrecoCategoriasStepFields`) são reorganizados, não reescritos.

### Novos
- **`PrecoEtapasNav`** (feature): a navegação das 3 etapas, com estado por etapa. Substitui o uso de `Stepper` neste wizard; o `Stepper` do design system continua para os outros cadastros.
- **`PrecoResumoAoVivo`** (feature): o painel "Sua tabela" com barra de progresso, lista de conferência e, no modo edição, o destaque do que mudou.
- **`TipoRegraCards`** (feature): os quatro cartões de tipo de regra com texto explicativo. Se outra tela passar a precisar, sobe para `components/ui`.

Nenhum componente novo de design system.

## Tokens usados

Nenhum token novo. Reaproveita: `colors.primary`, `primarySoft`, `onPrimary`, `success`, `warn`/`onWarn` (estado "pendência"), `danger`, `surface`, `background`, `border`, `text`, `textMuted`; `space`, `radii`, `fontSizes`, `fontWeights`; `typography.display*` nos títulos de etapa; `shadows.sm` no painel.

Estados da etapa: atual = borda e número em `primary`; completa = número em `success` com ✓; pendência (visitada e incompleta) = número em `warn` com !; ainda não visitada = número em `surface`/`textMuted`. Cada estado também é dito em texto para leitor de tela, nunca só por cor.

## Tela (desktop)

Moldura única (`Card` largo, ~1120px, no lugar dos 960px de hoje).

**Cabeçalho**: título ("Novo preço" ou "Editar preço"), na edição o nome e a `StatusBadge` da situação e o aviso "Alterações não salvas" (como hoje). À direita, o andamento em `StatusBadge`: "Rascunho · 2 de 3 etapas" (tom neutro) ou "Pronta para salvar" (tom sucesso). Na edição, o texto fica "Editando · N alterações" enquanto houver mudanças.

**Navegação de etapas** (`PrecoEtapasNav`), logo abaixo: três botões lado a lado.
1. **O básico**: "Nome, tipo, vigência, categorias".
2. **Quando vale**: "Dias e horários de cobrança".
3. **Quanto cobra**: "Degraus, diária e tolerâncias".

Cada botão tem no mínimo 48px de altura; o atual é destacado e carrega `aria-current="step"`.

**Corpo em duas colunas** (a partir de `lg`): formulário da etapa à esquerda (flexível) e painel lateral de 320px à direita, fixo ao rolar (`position: sticky`). Abaixo de `lg`, uma coluna só.

### Etapa 1 · O básico
Em ordem: **Descrição**; **Tipo de regra** em quatro cartões (Padrão: "Tarifa de uso geral do dia a dia"; Convênio: "Com desconto para empresas conveniadas"; Promocional: "Para campanhas por tempo limitado"; Evento: "Para dias específicos, como jogos e shows"), selecionado com borda de 2px em `primary` e fundo `primarySoft`; **Empresa conveniada** (desabilitada, "Disponível em breve", como hoje); **Início** e **Fim da vigência** lado a lado, com **Sem data de fim** logo abaixo (marcar desabilita e limpa o fim; desmarcar reabilita); **Categorias de veículo** em chips, com "Todas" exclusivo como hoje; **Ativo** no fim, com a frase "Ativa: é aplicada durante a vigência" / "Inativa: não será aplicada".

Ações: **Cancelar** e **Avançar: quando vale**.

### Etapa 2 · Quando vale
**Grade semanal** (7 linhas × 24 colunas): nome do dia à esquerda (alterna o dia inteiro), horas no topo (alterna a coluna), quadrados em `primary` para cobrança e `surface` com borda para sem cobrança; clique ou arraste pinta. Acima, os atalhos (Comercial, Rotativo, 24 horas, Só fim de semana, Limpar, Copiar segunda para os outros dias) em botões `sm`. Abaixo, a legenda, o **resumo em texto** (um grupo de dias por linha) e "N de 168 horas com cobrança". Em telas pequenas a grade rola na horizontal dentro do próprio contêiner (largura mínima ~640px).
No fim, um bloco recolhível **Ajuste fino** com as linhas atuais (dia, início, fim, ativo, período específico, "Aplicar a todos os dias", "Adicionar horário"), para minutos quebrados, horários inativos e períodos específicos. Ação: **Voltar** e **Avançar: quanto cobra**.

### Etapa 3 · Quanto cobra
Três blocos em sequência, com título de seção:
1. **Faixas de valores**: modelos prontos no topo ("Rotativo", "A cada 30 min até 2 h"); cada linha tem o limite em **horas e minutos** (dois campos numéricos), o valor, o **salto** em relação ao degrau anterior ("+ R$ 4,00", em `textMuted`) e, em Convênio, a % da conveniada. Abaixo das linhas, "Adicionar faixa" e a lista de **avisos** (limite repetido, degrau mais barato que o anterior, diária menor que o último degrau) em `warn`; sem avisos, "Faixas sem problemas." em `success`. A pré-visualização lateral que existe hoje sai da etapa e passa a ser a placa do painel.
2. **Diária**: período, valor e adicional.
3. **Tolerâncias**: entrada e alteração de faixa, cada uma com uma frase de apoio logo abaixo do campo: "Minutos iniciais sem cobrança." e "Minutos extras antes de passar para o degrau seguinte."

Ações: **Voltar** e **Salvar** (ou **Salvar alterações** na edição). Erro do servidor em `ErrorBanner` acima das ações.

### Painel lateral (todas as etapas)
**Sua tabela** (`PrecoResumoAoVivo`): título em `display` pequeno, barra de progresso (3 segmentos, um por etapa completa) e a lista de conferência:
- Descrição (ou "ainda sem nome"), Tipo, Vigência ("01/11/2026 → sem fim"), Categorias, Horários (texto agrupando dias iguais, por exemplo "Seg–Sex 06:00–22:00 · Sáb 08:00–18:00", ou "nenhum ainda") e Faixas ("7 degraus · diária R$ 70,00").
- Item preenchido mostra ✓ em `success`; vazio mostra ○ em `textMuted`.
- Na edição, itens que mudaram em relação ao salvo mostram "antes → depois" (o antes riscado em `textMuted`) e um marcador "Alterado" em `warn`.

Abaixo, a **placa tarifária** (`FaixasPreview`): degraus em ordem de tempo e a diária em destaque. Sem faixas, mostra "Adicione faixas para ver a tarifa.".

O painel anuncia mudanças com `aria-live="polite"`, agrupadas (não a cada tecla): anuncia ao sair do campo ou depois de uma pausa na digitação.

## Estados

- **Etapa completa / pendência / atual / não visitada**: como descrito nos tokens. "Pendência" só aparece depois de a etapa ter sido visitada e deixada incompleta, para o formulário não parecer erro antes de ser usado.
- **Salvar com pendência**: o usuário vai para a primeira etapa incompleta e vê, acima das ações, `ErrorBanner` "Há campos a corrigir na etapa 2 (Quando vale)." com os erros de cada campo visíveis.
- **Salvando**: botões desabilitados e "Salvando...". Erro do servidor: `ErrorBanner` com a mensagem, sem sair da etapa.
- **Edição sem alterações**: **Salvar alterações** desabilitado e o texto "Nenhuma alteração para salvar." junto do botão.
- **Carregando** (edição, antes de existir o formulário): `Skeleton` com o formato da navegação, do formulário e do painel, como o carregamento de hoje.
- **Erro ao carregar / tabela inexistente**: inalterados (`ErrorBanner` com **Tentar novamente**, ou aviso com link para a listagem).

## Responsividade

- `lg` (~1024px) e acima: duas colunas, painel fixo.
- Abaixo de `lg`: uma coluna. A navegação de etapas fica no topo, os três botões se reorganizam em grade de uma coluna ou rolagem horizontal sem perder o nome da etapa; o painel **Sua tabela** e a placa descem para depois do formulário.
- Celular: botões e cartões com alvo de toque de no mínimo 44px, sem rolagem horizontal da página; as linhas de faixa e de horário já empilham como hoje.

## Interações e acessibilidade

- A navegação de etapas é uma lista de botões (não `tablist`): cada botão leva à etapa e o atual tem `aria-current="step"`. O rótulo acessível inclui o estado ("O básico, completa", "Quando vale, com pendência").
- Ao trocar de etapa, o foco vai para o título da nova etapa (mantém o comportamento atual de focar a descrição).
- Os cartões de tipo de regra são um grupo de opção única (`role="radiogroup"`) com setas, seguindo o padrão do `OptionGroup`.
- "Sem data de fim" é um `Checkbox` com rótulo visível; ao ligar, o campo de fim fica desabilitado e vazio, e o resumo mostra "sem fim".
- Cancelar continua pedindo confirmação quando há alterações (confirmação nativa hoje; trocar por `ConfirmDialog` do design system é uma melhoria opcional, decidida no Tech Spec).
- Todo texto de ajuda é associado ao campo (`aria-describedby`).
