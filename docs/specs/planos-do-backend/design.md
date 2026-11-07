# Design Spec: Planos vindos do Back-end na Adesão

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Não é tela nova nem redesenho: a etapa **Plano** (`PlanoStepFields`) e o bloco **Plano** da Conferir já existem. O que muda é a origem dos dados, o preço riscado na promoção, a data vinda do back-end e dois estados novos: **carregando** e **erro ao carregar**. Segue `src/styles/theme.ts` + `src/components/ui` e a spec anterior em `docs/specs/planos-adesao/design.md`. Não há composição nova a propor.

## Direção
- **Tese:** o preço que o visitante viu no site é o que ele confirma na adesão. A etapa mostra o que o back-end informa, sem nada que pareça cópia desatualizada.
- **Modo:** Operate. Clareza acima de expressão.
- **Cor:** restrita. Amarelo (`primary`/`accent`) só marca promoção e seleção; o preço riscado é `textMuted`.

## Mudanças em relação ao que existe
| Hoje | Passa a ser |
|------|-------------|
| Lista fixa em código (Teste grátis + Mensal) | Lista vinda do back-end, na ordem de `ordemExibicao` |
| Teste: "30 dias" fixo | Duração de `validadeDuracaoMeses` (ex.: "1 mês") |
| Mensal: só o preço de lançamento, "nos primeiros 12 meses" | Preço de tabela riscado + preço atual; condição "até <data>" |
| Selo: "Preço de lançamento · assine até 30/06/2027" | Selo "Promoção até <data de promocaoFim>"; sem data, "Promoção" |
| Sem carregamento nem erro | Estados de carregamento e de erro com "Tentar de novo" |

## Telas/estados da etapa Plano

### Carregando
- Cartões-esqueleto no lugar das opções, com a **mesma altura e a mesma grade** dos cartões reais (2 cartões, como a resposta de hoje), para não haver salto de layout quando os dados chegam (RF10).
- Usa `Skeleton` do design system. O grupo recebe `role="status"` e texto acessível oculto: "Carregando planos".
- A lista "Tudo isso incluso no plano" aparece normalmente (é texto fixo, não depende do back-end), então a etapa não fica vazia.
- "Próximo" fica desabilitado; "Voltar" funciona.

### Padrão com planos (lista carregada)
- **Teste gratuito:** nome vindo da resposta ("Teste gratuito"); valor lateral com a duração ("1 mês"); detalhe mantém a promessa de condições do site ("Todas as funcionalidades, sem cartão de crédito e sem compromisso."). Sem preço riscado, sem selo.
- **Plano em promoção** (`emPromocao = true`): ver Cartão.
- **Plano sem promoção:** só o `valorAtual`, sem riscado e sem selo; detalhe "Cobrado todo mês".
- Nenhum cartão selecionado, sem mensagem de erro, a menos que a URL pré-selecione (próximo item).

### Pré-selecionado pela URL
- `tipoPlanoAdesao` casando com um plano da lista: o cartão vem selecionado ao abrir. Nada é anunciado em destaque.
- Valor ausente, inválido ou de plano que não está na lista: estado "padrão", sem aviso.
- A pré-seleção só pode ser resolvida depois da lista carregar; durante o carregamento nada aparece selecionado. Ao carregar, o cartão já entra selecionado, sem animação de troca.

### Erro ao avançar sem escolher
- Igual ao atual: `ErrorBanner role="alert"` no topo ("Escolha um plano para continuar.") + `ErrorText` do `OptionGroup` + foco no primeiro radio.

### Erro ao carregar os planos (falha, lentidão ou lista sem plano utilizável)
- No lugar dos cartões, um bloco de erro: `ErrorBanner role="alert"` com título "Não conseguimos carregar os planos" e texto "Isso é do nosso lado, não dos seus dados. Tente de novo em instantes." (tom da marca: direto, sem jargão técnico, sem culpar o usuário).
- Botão secundário **"Tentar de novo"** (`Button`, variante secundária) logo abaixo; durante a nova tentativa vira o estado de carregamento acima, e o foco permanece no botão até o resultado (sem perder o ponto de leitura).
- Nenhum preço, nem de contingência, é exibido (RF11). A lista de 13 áreas continua visível.
- "Próximo" desabilitado até a lista carregar; os dados já preenchidos das etapas anteriores permanecem (RF13).
- Lista vazia usa o mesmo bloco de erro.

### Voltando de outra etapa ou da conferência
- O plano escolhido continua selecionado (a lista já está em memória). Vindo de "Editar", o botão principal vira "Voltar para a conferência", como hoje.

## Cartão de plano
Mantém a variante `card` do `OptionGroup`: radios nativos, `Mark` redondo, hover com borda `accent`, foco `focus` 2px, selecionado com borda e `primarySoft`, erro com `danger`.

Conteúdo, de cima para baixo:
1. **Nome** (`CardLabel`): vem do campo `plano`, no formato de título (o back-end devolve em caixa alta, como "MENSAL"; exibir "Mensal"). Decisão de formatação fica no mapeamento do Tech Spec.
2. **Valor** (`aside`), em `fontSizes.xl`, `extrabold`, `tabular-nums`, seguido de "/mês" em `textMuted`:
   - **Em promoção:** o preço de tabela vem **antes**, menor e riscado (`fontSizes.sm`, `textMuted`, `text-decoration: line-through`), e o preço atual em destaque ao lado ou abaixo. No celular o riscado fica acima do atual, alinhado à direita, para caber em 360 px.
   - **Sem promoção:** só o atual.
3. **Condição** (`detail`), `fontSizes.sm`, `textMuted`:
   - Em promoção com data: "R$ 69,90/mês até 30/06/2027; depois, R$ 99,90/mês."
   - Em promoção sem `promocaoFim`: "R$ 69,90/mês em promoção." (sem data, sem "depois").
   - Sem promoção: "Cobrado todo mês".
4. **Selo** (`badge`, já existe como texto sobreposto à borda): "Promoção até 30/06/2027" ou "Promoção" quando não há data. Fundo `primary`, texto `onPrimary`, `fontFamilies.mono`, `fontSizes.xs`, `radii.full`. É texto, não depende de cor. O cartão com selo mantém a borda `accent` de 2px mesmo sem seleção (comportamento atual de `$highlight`).

**Preço riscado e leitor de tela:** o riscado não pode ser lido solto como "R$ 99,90" seguido de "R$ 69,90". O nome acessível do cartão usa texto oculto: "Mensal, de R$ 99,90 por R$ 69,90 por mês, promoção até 30/06/2027". O elemento riscado visual é `aria-hidden` e o texto oculto cobre a leitura (RF3).

## Layout
- **Cartões:** mesma grade de hoje (`Options` do `OptionGroup`). Com 2 itens: 1 coluna abaixo de `md`; 2 colunas a partir de `md`. Se o back-end passar a devolver mais planos, a grade segue a mesma regra sem mudança de código.
- **Cartão em linha no celular** (nome e condição à esquerda, valor à direita), como na spec anterior. O riscado empilha sobre o atual no bloco da direita.
- **Esqueleto** replica essa grade e as alturas do cartão com promoção (o mais alto), para o pior caso não gerar salto.
- **Bloco de erro** ocupa a largura do grupo; ocupa altura próxima à dos cartões para minimizar deslocamento.
- **Lista de funcionalidades** abaixo, inalterada. Sem rolagem horizontal em 320 px; folga sob a `ActionBar` fixa.

## Conferir
- Bloco **"Plano"** mantém `Editar` (`aria-label="Editar Plano"`), mas as linhas passam a vir dos dados do plano escolhido:
  - **Plano:** nome.
  - **Valor por mês:** valor atual; em promoção, com o riscado e a leitura "de R$ 99,90 por R$ 69,90" (mesma regra de acessibilidade do cartão).
  - **Condição:** a mesma frase do cartão.
- Teste gratuito segue o `ResumoTeste` atual, com a duração vinda do back-end em vez de "30 dias".
- Se a lista estiver indisponível ao chegar na Conferir (ex.: recarregou a página e a falha persistiu), o usuário volta à etapa Plano pelo fluxo normal; a Conferir não mostra valor sem dado.

## Credencial
- A linha **Plano** da credencial ao vivo usa o nome e o valor atual do plano escolhido (ex.: "Mensal · R$ 69,90/mês"); o teste mostra "Teste grátis · 1 mês". Sem plano, traço "—". Sem tratamento visual novo.

## Componentes

### Reaproveitados
`OptionGroup` (variante `card`), `Skeleton`, `ErrorBanner`, `Button`, `Text`, `ActionBar`, `Stepper`, `CredencialEmpresa`, `AdesaoShell`.

### A evoluir/criar
- `PlanoStepFields`: três ramos (carregando, erro, lista) no lugar do renderizador único atual; recebe os dados do back-end por props em vez de importar a tabela fixa.
- `OptionGroup`: o `aside` já é `ReactNode`, então comporta o riscado + atual sem mudança de API. Precisa só de uma variação para o nome acessível com texto oculto (`label` mais descritivo ou `ariaLabel` opcional na opção). [Detalhar no Tech Spec]
- Esqueleto de planos: composição de `Skeleton` dentro de `PlanoStepFields` (não vira componente do design system, é específico da etapa).
- `ConferirStep`, `credencial.ts`: ler dados do plano escolhido em vez de `PLANO_MENSAL`.

## Tokens usados
- **Cores:** `text`, `textMuted` (riscado e condição), `primary`/`onPrimary` (selo), `primarySoft` (selecionado), `accent` (borda do cartão em promoção), `danger` (erro), `borderStrong`, `focus`.
- **Espaçamento:** `space[1]` entre riscado e atual, `space[2]` entre cartões, `space[3]` de padding, `space[5]` entre grupo e lista.
- **Tipografia:** atual `fontSizes.xl`/`extrabold`/`displayTracking`; riscado `fontSizes.sm`; selo `fontFamilies.mono` `fontSizes.xs`.
- **Raios:** `radii.lg` (cartão), `radii.full` (selo).
- **Layout:** `breakpoints.md`, `layout.touchTarget` (44px).
- **Novos tokens:** nenhum previsto.

## Movimento
- Esqueleto → lista: troca direta, sem animação de deslocamento (o espaço já estava reservado). Fade curto de ~150ms opcional.
- Seleção e entrada da etapa: iguais às de hoje.
- `prefers-reduced-motion`: sem transição e sem pulso no esqueleto.

## Acessibilidade
- Estado de carregamento anunciado por `role="status"` ("Carregando planos"); erro por `role="alert"`. Ao carregar com sucesso, não anunciar nada além do conteúdo.
- "Tentar de novo" com foco visível, alcançável por teclado; o foco não se perde ao alternar entre erro e carregamento.
- Preço riscado sem ambiguidade para leitor de tela (texto oculto "de ... por ...").
- Selo e condição são texto; seleção não depende só de cor.
- Contraste AA nos dois temas: conferir `textMuted` riscado sobre `primarySoft` no cartão selecionado (o riscado é informação secundária, mas legível).
- Alvo ≥ 44px; foco vai ao título da etapa ao entrar; em erro de validação, ao primeiro radio.

## Responsividade (resumo)
| Faixa | Cartões | Cartão por dentro |
|-------|---------|-------------------|
| < 768px | 1 coluna | Em linha: nome e condição à esquerda; valor atual com riscado acima, à direita |
| ≥ 768px | 2 colunas | Empilhado: nome, riscado + atual, condição |

## Texto (tom da marca)
- "Carregando planos" (oculto) · "Não conseguimos carregar os planos" · "Tente de novo em instantes." · "Tentar de novo" · "Escolha um plano para continuar."
- Sem emojis, sem exageros, sem jargão ("API", "servidor", "erro 500").

## Pontos em aberto
- Se o negócio mantiver o teste disponível sem a lista (PRD, Riscos), o estado de erro ganha uma segunda ação "Começar o teste grátis" sem preço. Sem essa decisão, o erro bloqueia o avanço. [Confirmar com o negócio]
- Formatação do nome vindo em caixa alta ("MENSAL" → "Mensal"): regra a fechar no Tech Spec.

## Fora desta spec
Contrato de `GET /api/v1/Plano`, cache/frescor, tipos, leitura do parâmetro da URL e envio de `tipoPlanoAdesao` ficam para o Tech Spec.
