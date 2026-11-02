# Design Spec: Escolha de Plano no Fluxo de Adesão

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue o design system em `src/styles/theme.ts` + `src/components/ui` e a composição já definida em `docs/specs/revisao-fluxo-adesao/design.md` (wizard com credencial ao vivo). Não é uma tela nova nem um redesenho: é uma etapa dentro de um layout que já existe, então não há composição nova a propor. A etapa herda o shell, o stepper, a barra de ações e a credencial. O sistema se chama **Murel** na interface.

## Direção
- **Tese:** o plano é a primeira decisão de quem chega do site com um preço na cabeça. A etapa confirma essa escolha (ou deixa fazê-la) em uma olhada, antes de pedir qualquer dado.
- **Modo:** Operate. Clareza e comparação rápida acima de expressão.
- **Cor:** restrita, como no resto da adesão. Amarelo (`primary`/`accent`) só marca o recomendado e a seleção.
- **Decisão de posição:** a etapa de plano é a **penúltima**, logo antes da Conferir. O cadastro vem primeiro; o plano (já pré-selecionado para quem veio do site) é confirmado ou trocado antes de revisar tudo. A etapa também lista as áreas do sistema, como no site.

## Fluxo
Wizard passa de 4 para **5 etapas**: **Empresa → Horários → Titular → Plano → Conferir**.

| # | Etapa | Conteúdo |
|---|-------|----------|
| 1 | Empresa | (igual) |
| 2 | Horários | (igual) |
| 3 | Titular | (igual) |
| 4 | Plano (nova) | 4 opções de plano, uma selecionável, e a lista "Tudo isso em todos os planos" |
| 5 | Conferir | (igual) + bloco "Plano" |

- Título: "Escolha o seu plano". Descrição: "Todas as funcionalidades valem em todos os planos. O que muda é o tempo e o valor."
- Botão principal: "Próximo: Conferir"; "Voltar" leva ao Titular.
- Stepper e "Etapa X de 5 · Plano" seguem o padrão existente; o nome da etapa 4 é "Plano".

## Telas/estados da etapa Plano

### Padrão, sem plano
- Quatro cartões, nenhum selecionado. Sem mensagem de erro.
- O Anual já mostra o selo de recomendado (é estático, não é seleção).

### Pré-selecionado (parâmetro válido na URL)
- O cartão correspondente aparece selecionado ao abrir. Nada é anunciado em destaque; o estado selecionado do radio basta para leitor de tela.
- Se o plano pré-selecionado for o Anual, ele junta o selo e a seleção sem conflito visual (ver Cartão).
- Usuário troca com um toque. Parâmetro ausente ou inválido cai no estado "sem plano", sem aviso.

### Erro ao avançar sem escolher
- `ErrorBanner role="alert"` no topo da etapa, no padrão `faltamAviso`: "Escolha um plano para continuar."
- A mensagem de erro também aparece junto do grupo de opções (padrão `ErrorText` do `OptionGroup`), e o foco vai para a primeira opção do grupo.

### Voltando de outra etapa ou da conferência
- O plano escolhido continua selecionado. Vindo de "Editar" na conferência, o botão principal vira "Voltar para a conferência" (comportamento já existente do wizard).

## Cartão de plano
Escolha única em **radios nativos** apresentados como cartões. Evolui o `OptionGroup` (ver Componentes); mantém setas, foco e leitor de tela do navegador.

Conteúdo de cada cartão, de cima para baixo:
1. **Nome** (`fontSizes.md`, semibold): Mensal, Trimestral, Semestral, Anual.
2. **Valor por mês** em destaque: "R$ 79,90" em `fontSizes.xl`, `extrabold`, `font-variant-numeric: tabular-nums`, seguido de "/mês" em `textMuted` `fontSizes.sm`.
3. **Total do período** em `fontSizes.sm`, `textMuted`:
   - Mensal: "Cobrado todo mês"
   - Trimestral: "R$ 404,70 por 3 meses"
   - Semestral: "R$ 719,40 por 6 meses"
   - Anual: "R$ 958,80 em uma cobrança única"
4. **Economia** (só em Trimestral, Semestral e Anual), `fontSizes.sm`, semibold, cor `success`, com ícone de check decorativo: "Economia de R$ 45,00 (10%)", "Economia de R$ 180,00 (20%)", "Economia de R$ 840,00 (47%)". O Mensal não tem essa linha (a altura do cartão não muda: a linha some e o cartão alinha pelo topo).
5. **Marca de seleção**: o `Mark` redondo do `OptionGroup` (anel + ponto) no canto superior direito. A seleção também muda a borda e o fundo (`primarySoft`), nunca só a cor.

**Selo do recomendado (Anual):** etiqueta "Mais econômico" no topo do cartão, sobreposta à borda, fundo `primary`, texto `onPrimary`, `fontFamilies.mono`, `fontSizes.xs`, `radii.full`. É texto, então não depende de cor. Mesmo texto do site. O cartão do Anual tem borda `accent` de 2px mesmo sem seleção; selecionado, ganha também `primarySoft` e o ponto do `Mark`.

**Estados:** hover (borda `accent`), foco (anel `focus` 2px com offset 2px, via `:focus-within`), selecionado, desabilitado durante o envio (não ocorre nesta etapa, mas o grupo respeita `disabled`), erro (borda `danger`).

## Layout
- **Cartões:** grade que reaproveita o `Options` do `OptionGroup`.
  - `< md` (celular): 1 coluna, na ordem Mensal → Anual (mantém a comparação por tempo; o Anual não sobe ao topo). Cartão em linha: nome e economia à esquerda, valor à direita, para caber em 360 px sem ficar alto demais.
  - `md` (≥ 768px): 2 colunas (2x2).
  - `lg` (≥ 1024px): 2 colunas também, porque a coluna do formulário tem ~640px e a credencial ocupa a lateral. Quatro colunas em 640px ficariam estreitas demais para o valor em destaque.
- **Nota abaixo dos cartões:** `Text variant="muted"`, "O valor por mês é o mesmo em todo o período do plano." Só se o negócio confirmar; do contrário, omitir. [Confirmar no Tech Spec/negócio]
- **Lista de funcionalidades** abaixo dos cartões, sob "Tudo isso em todos os planos": as 13 áreas do site, cada uma com título e frase, em 1 coluna no celular e 2 a partir de `md`, com um filete de acento à esquerda. Textos idênticos aos do site.
- **Rolagem:** sem rolagem horizontal em 320 px; folga inferior sob a `ActionBar` fixa, como nas outras etapas.

## Credencial
- A credencial ao vivo ganha uma linha **Plano** (ex.: "Anual · R$ 79,90/mês"), com traço apagado "—" enquanto nada foi escolhido, como os demais campos.
- Não ganha destaque especial; segue o fade de entrada de valor já existente.
- Na etapa Plano, a credencial fica quase toda vazia (nada foi preenchido além do plano). Isso é esperado e não precisa de tratamento extra.

## Conferir
- Novo bloco **"Plano"**, no fim da lista (mesma ordem do fluxo), com `Editar` que leva à etapa 4 e, ao corrigir, volta à conferência.
- Linhas: **Plano** ("Anual"), **Valor por mês** ("R$ 79,90"), **Total** ("R$ 958,80 em uma cobrança única" / "Cobrado todo mês" para o Mensal / "R$ 404,70 por 3 meses" etc.).
- Mesma estrutura do `Bloco`/`Linha` existente, `aria-label="Editar Plano"`.

## Componentes

### Reaproveitados de `src/components/ui`
`OptionGroup` (base de escolha única com radios nativos), `ErrorBanner`, `Text`, `Button`, `ActionBar`, `Stepper`, `CredencialEmpresa` e o `AdesaoShell`.

### A evoluir/criar
- `OptionGroup`: hoje só aceita `value`, `label` e `icon` por opção. Para o cartão de plano precisa de conteúdo rico por opção (valor, total, economia, selo). Evoluir com uma variante de cartão (`variant="card"` ou opção com `children`), mantendo `columns`, `error` e acessibilidade, em vez de criar um segundo componente de radios. [Detalhar no Tech Spec]
- `SeloDestaque` (ou parte do cartão): etiqueta "Mais econômico". Pequena; pode viver dentro da variante de cartão do `OptionGroup`.
- Etapa de plano (`PlanoStepFields`): conteúdo da etapa, no padrão dos outros `*StepFields`.
- `ConferirStep`: novo bloco "Plano".
- `credencial.ts` / `CredencialEmpresa`: nova linha de plano.

## Tokens usados
- **Cores**: `background`, `surface`, `text`, `textMuted`, `primary`/`onPrimary` (selo), `primarySoft` (selecionado), `accent` (borda do Anual e seleção), `success` (economia), `danger` (erro), `borderStrong` (borda padrão), `focus`.
- **Espaçamento**: `space[2]` entre cartões e dentro de linhas, `space[3]` de padding do cartão, `space[4]` entre grupo e aviso.
- **Tipografia**: valor `fontSizes.xl` com `fontWeights.extrabold` e `displayTracking`; nome `fontSizes.md` semibold; total e economia `fontSizes.sm`; selo `fontFamilies.mono` `fontSizes.xs`.
- **Raios**: `radii.lg` no cartão, `radii.full` no selo.
- **Layout**: `breakpoints.md` (2 colunas), `layout.touchTarget` (alvo mínimo de 44px; o cartão inteiro é o alvo).
- **Novos tokens:** nenhum previsto. Se a sobreposição do selo exigir um deslocamento fixo, usar `space` em vez de valor solto.

## Movimento
- Seleção: troca de borda/fundo e do ponto do `Mark` em ~150ms, igual ao `OptionGroup`.
- Entrada da etapa: o deslizamento lateral + fade que o shell já aplica (`Etapa key={etapaAtual}`).
- `prefers-reduced-motion`: sem transição, mudanças instantâneas.

## Acessibilidade
- Grupo em `fieldset` com `legend` ("Plano"; pode ser visualmente oculta, já que o título da etapa diz o mesmo) e radios nativos, como o `OptionGroup`.
- Nome acessível de cada opção deve incluir nome, valor por mês e total, por exemplo: "Anual, R$ 79,90 por mês, R$ 958,80 em uma cobrança única, mais econômico". Ícone de check e `Mark` são `aria-hidden`.
- Economia e selo são texto; seleção não depende só de cor (marca + borda + fundo).
- Foco vai ao título da etapa ao entrar nela (comportamento do wizard); em erro, vai à primeira opção do grupo.
- Alvo de toque ≥ 44px; contraste AA nos dois temas (conferir `success` sobre `primarySoft` e `textMuted` no cartão selecionado).
- Erro com `role="alert"`, ligado ao grupo por `aria-describedby`.

## Responsividade (resumo)
| Faixa | Cartões | Cartão por dentro |
|-------|---------|-------------------|
| < 768px | 1 coluna | Em linha: nome e economia à esquerda, valor à direita |
| ≥ 768px | 2x2 | Empilhado: nome, valor, total, economia |

## Fora desta spec
Pagamento, cupom, troca de plano depois do cadastro e plano Trial como opção (ver PRD). Contrato de envio ao backend e leitura do parâmetro na URL ficam para o Tech Spec.
