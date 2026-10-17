# Tech Spec: Cadastro de Preços em 3 etapas com resumo ao vivo

**Status:** Rascunho
**Data:** 2026-10-17
**PRD:** [./prd.md](./prd.md) · **Design:** [./design.md](./design.md)

Segue as convenções do projeto (Next 16 App Router, styled-components, TanStack Form/Query, zod, vitest). Esta etapa só especifica; nada é implementado aqui.

## Referências
- PRD: ./prd.md
- Design: ./design.md e a seção "Design" abaixo
- Base existente: `src/components/precos/PrecoWizard/PrecoWizardForm.tsx`, `Preco*StepFields`, `PrecoResumo`, `FaixasPreview`, `diff.ts`, `src/lib/schemas/preco.ts`

## Design

- **Telas/estados:** 3 etapas com navegação livre, painel lateral "Sua tabela" com placa, estados completa/pendência/atual, carregando, erro e salvando, como no design.
- **Reaproveitados:** `Card`, `Button`, `Text`, `ErrorBanner`, `Checkbox`, `Switch` (via `SwitchField`), `Select`, `StatusBadge`, `Skeleton`; da feature, `FaixasPreview`, `diff.ts`, `format.ts`, `PrecoHorariosStepFields` e `PrecoFaixasStepFields`.
- **Novos (de feature, em `src/components/precos`):** `PrecoEtapasNav`, `PrecoResumoAoVivo`, `TipoRegraCards`, `PrecoBasicoFields`, `PrecoCobrancaFields`, `resumoHorarios.ts`.
- **Tokens:** nenhum novo.

## Achados no código que moldam a solução

1. **O wizard tem quatro formulários TanStack independentes** (info, horários, faixas, categorias), cada um com `defaultValues`, validador `onChange` (schema zod) e `onSubmit` que só troca de etapa. Os quatro existem ao mesmo tempo (estão no mesmo componente), então os valores sobrevivem à troca de etapa. Isso permite a navegação livre **sem mudar o estado**: só muda quais campos são montados.
2. **O formulário "info" mistura dois assuntos.** Descrição, tipo, vigência e situação vão para "O básico"; diária e tolerâncias vão para "Quanto cobra". Como todos continuam no mesmo formulário `info`, basta **dividir o componente de campos** em dois, ambos ligados ao mesmo `infoForm`. O schema `precoInfoSchema` e o payload não mudam.
3. **Completude por etapa sai dos schemas existentes.** `precoInfoSchema` já devolve o `path` de cada erro; agrupando os caminhos por etapa, sabe-se se "O básico" (descricao, tipoRegra, inicioVigencia, fimVigencia) e "Quanto cobra" (tolerâncias, periodoDiaria, valorDiaria, valorAdicionalDiaria) estão válidos sem criar regra nova.
4. **`findInvalidPrecoStep` hoje devolve 1–4.** Passa a devolver 1–3, e o resumo "Há campos a corrigir na etapa N" usa os novos nomes.
5. **`PrecoCategoriasStepFields` recebe `summary`** (o `PrecoResumo`), que só aparece na última etapa hoje. O resumo passa para o painel e a prop sai.
6. **`PrecoFaixasStepFields` embute a placa** (`Layout` com `FaixasPreview`). A placa sai do componente e vai para o painel, que é onde passa a ser mostrada em todas as etapas.
7. **A comparação "antes → depois" já existe** (`diffPreco`, `hasChanges` em `diff.ts`) e continua sendo a fonte do que mudou na edição.

## Arquitetura da solução

### Arquivos
```
src/
├── lib/schemas/
│   ├── preco.ts                          # + validarEtapasPreco(values): estado por etapa; findInvalidPrecoStep passa a 1|2|3
│   └── preco.test.ts                     # atualizar/estender
└── components/precos/
    ├── PrecoWizard/
    │   ├── PrecoWizardForm.tsx           # reescrito: 3 etapas, navegação livre, painel; mantém salvar/cancelar/beforeunload
    │   ├── PrecoWizardForm.styles.ts     # (ou PrecoWizard.styles.ts estendido) layout em duas colunas
    │   └── PrecoWizard.test.tsx          # ajustar fluxo e novos casos
    ├── PrecoEtapasNav/                   # NOVO: três botões de etapa com estado
    ├── PrecoResumoAoVivo/                # NOVO: painel "Sua tabela" + placa; modo edição com antes → depois
    ├── TipoRegraCards/                   # NOVO: cartões de tipo de regra (radiogroup)
    ├── PrecoBasicoFields/                # NOVO (extraído de PrecoInfoStepFields): descrição, tipo, empresa, vigência, sem fim, ativo
    ├── PrecoCobrancaFields/              # NOVO (extraído de PrecoInfoStepFields): diária e tolerâncias com texto de ajuda
    ├── PrecoInfoStepFields/              # REMOVIDO depois da extração
    ├── PrecoCategoriasStepFields/        # remove a prop `summary`
    ├── PrecoFaixasStepFields/            # remove a placa embutida (Layout) e a prop `diaria`
    ├── PrecoResumo/                      # REMOVIDO se nada mais o usar (o painel assume o papel)
    ├── resumoHorarios.ts                 # NOVO: texto agrupando dias iguais a partir dos valores do formulário
    ├── grade.ts                          # NOVO: converte horários do formulário em grade 7×24 e de volta, sem perder o que a grade não representa
    ├── avisosFaixas.ts                   # NOVO: avisos não bloqueantes das faixas
    ├── GradeHorarios/                    # NOVO: grade 7×24 com pintura, atalhos e resumo
    ├── PrecoHorariosStepFields/          # passa a ser o "Ajuste fino" recolhível da etapa 2
    └── PrecoFaixasStepFields/            # horas+minutos, salto, modelos e avisos
```

### Estado do wizard (`PrecoWizardForm`)
- `step` (1–3) e `visitadas` (conjunto de etapas já abertas) em `useState`. Qualquer botão da navegação chama `irParaEtapa(n)`; **Avançar** e **Voltar** usam a mesma função. Não há mais validação para trocar de etapa.
- Valores vivos vêm dos quatro formulários via `useStore` (como hoje) e alimentam: `validarEtapasPreco` (completude), `PrecoResumoAoVivo` e, na edição, `hasChanges`/`diffPreco`.
- **Estado por etapa** (derivado, não guardado): `completa` quando a etapa passa na validação; `pendencia` quando está em `visitadas`, não é a atual e não está completa; senão `neutra`/`atual`. "Pronta para salvar" = as três completas.
- **Salvar** (na etapa 3 e também de qualquer etapa quando as três estão completas, via botão do painel/rodapé fixo é opcional; a decisão mínima é só na etapa 3):
  1. Roda `handleSubmit` em cada formulário com `onSubmit` vazio, para marcar os campos como tocados e exibir erros.
  2. `findInvalidPrecoStep(values)`: se houver etapa inválida, `irParaEtapa(n)` e `ErrorBanner` "Há campos a corrigir na etapa N (Nome)." com a lista das mensagens da etapa (vinda do `safeParse`, não dos campos), para não depender de o campo estar montado.
  3. Tudo válido: `mutation.mutateAsync(values)` com a mesma `useMutation`, invalidações e redirecionamento de hoje (`savedFlag`, `savedPrecoId`, `savedRef`, trava de duplo envio).
- Foco ao trocar de etapa: mantém o `useEffect` atual (foca a descrição da etapa).
- `beforeunload` e `handleCancel` não mudam.

### Divisão das validações
`validarEtapasPreco(values): { basico: string[]; horarios: string[]; cobranca: string[] }` (mensagens de erro por etapa; vazio = completa).
- `basico`: issues de `precoInfoSchema` com path em `descricao|tipoRegra|inicioVigencia|fimVigencia`, mais `precoCategoriasSchema`.
- `horarios`: issues de `precoHorariosSchema`.
- `cobranca`: issues de `precoInfoSchema` com os demais paths, mais `precoFaixasSchema`.
Os schemas em si ficam intactos, o que garante o mesmo payload e as mesmas regras de hoje (ex.: "fim posterior ao início", faixa repetida, "Todas" exclusiva).

### Componentes
- **`PrecoEtapasNav`** (`"use client"`): props `{ etapas: { titulo; apoio; estado }[]; atual: number; onSelect(n) }`. Lista de botões; atual com `aria-current="step"`; rótulo acessível com o estado ("O básico, completa").
- **`PrecoResumoAoVivo`** (`"use client"`): props `{ values: PrecoFormValues; original?: PrecoFormValues; etapasCompletas: boolean[] }`. Monta a lista de conferência; com `original`, usa `diffPreco` para "antes → depois" e o marcador "Alterado". Renderiza abaixo a `FaixasPreview` (`diaria` e faixas convertidas como em `PrecoFaixasStepFields` hoje). Região `aria-live="polite"` com o texto anunciado atualizado com *debounce* (~600 ms), para não anunciar a cada tecla.
- **`TipoRegraCards`**: `role="radiogroup"` com `role="radio"` por cartão, setas movem a seleção; recebe `value`, `onChange`, `disabled`. Textos de apoio como constantes no próprio componente. Alimenta o campo `tipoRegra` do `infoForm` (valor string do enum).
- **`PrecoBasicoFields`** (`withForm`): descrição (`TextField`), `TipoRegraCards`, empresa conveniada desabilitada (como hoje), vigência (`datetime-local`), `Checkbox` "Sem data de fim", `SwitchField` "Ativo". Props: `{ disabled?, mode, categoriasForm }` — as categorias (formulário separado) renderizam logo abaixo via `PrecoCategoriasStepFields`.
- **`PrecoCobrancaFields`** (`withForm`): período, valor e adicional da diária e as duas tolerâncias, com `hint` explicativo (o `TextField` já aceita `hint`).
- **`resumoHorarios(horarios): string`**: agrupa dias consecutivos com o mesmo intervalo ("Seg–Sex 06:00–22:00"). Usa `DIAS_SEMANA_PRECO` para o rótulo e ordem; horário inativo é ignorado; sem horários devolve "nenhum ainda". Função pura e testada.

### "Sem data de fim"
Estado local `semFim` no wizard, inicial `initial.info.fimVigencia === ""` (então, no cadastro, começa marcado, equivalente ao "em branco" de hoje). Marcar limpa `fimVigencia` e desabilita o campo; desmarcar apenas reabilita (o campo continua opcional no schema, então desmarcar sem preencher também salva sem fim — comportamento igual ao atual). Não entra no payload nem no schema.

### Server vs Client
Tudo `"use client"` (formulário, estado e `useStore`). As páginas `app/(app)/precos/novo` e `.../[id]/editar` não mudam.

### Grade de horários e faixas (escopo ampliado após a revisão do layout)
- **`grade.ts`**: `horariosParaGrade(horarios)` marca a célula (dia, hora) quando há horário ativo, sem período específico, cobrindo a hora inteira. `gradeParaHorarios(grade, outros)` gera um horário por intervalo contínuo de cada dia (`HH:00`; fim às 24 h vira `23:59`) e acrescenta `outros`: os horários que a grade não representa (minutos quebrados, inativos ou com período). Assim pintar nunca apaga o que só o ajuste fino edita.
- **`GradeHorarios`** (`withForm` sobre o formulário de horários): lê `horarios`, aplica a pintura com `setFieldValue("horarios", ...)`; pointer events para arrastar e clique/teclado (`aria-pressed`) para alternar.
- **Faixas:** o limite continua guardado em minutos (`minutosLimite`); a linha mostra dois campos (h e min) que o recompõem. `avisosFaixas(faixas, diariaValor)` é função pura e testada; o salto usa a ordem já mantida por `sortFaixas`. Modelos substituem a lista inteira.

## Decisões técnicas e trade-offs
- **Manter os quatro formulários** em vez de fundir em um só: evita reescrever validação, `isDirty` e `defaultValues` e mantém o risco baixo. O preço é que os campos de uma etapa só "aparecem" no formulário quando montados; por isso erros e completude vêm do `safeParse` dos valores, não do estado dos campos.
- **Completude derivada dos valores, não de `touched`:** o ✓/! reflete a verdade dos dados mesmo sem o usuário ter tocado nos campos (ex.: valores padrão das faixas).
- **Dividir `PrecoInfoStepFields` em dois componentes** em vez de criar um segundo formulário para diária/tolerâncias: o schema e o `isDirty` do formulário info permanecem únicos.
- **`Stepper` do design system não é alterado**: a navegação clicável é um componente de feature, porque o `Stepper` é só visual e é usado em outros cadastros.
- **Remover `PrecoResumo`** (se sobrar sem uso) em vez de mantê-lo morto; o painel ao vivo cobre o antes → depois com o mesmo `diffPreco`.
- **Confirmação ao cancelar** continua com `window.confirm` nesta entrega (trocar por `ConfirmDialog` fica como melhoria opcional, sem exigência do PRD).

## Riscos / pontos de atenção
- **Regra de "etapa completa"** (ponto em aberto do PRD): adotada como "passa nos schemas atuais"; "Quando vale" exige ao menos um horário (já é regra do schema). Revisar se o negócio quiser outra.
- **Valores padrão geram ✓ cedo:** as faixas sugeridas (`DEFAULT_PRECO_FAIXAS`) e a diária pré-preenchida fazem "Quanto cobra" parecer completo antes de o usuário revisar. Mitigado porque a diária inicia vazia (`valorDiaria`/`valorAdicionalDiaria` vazios) e, portanto, a etapa começa pendente.
- **Erros de campos não montados:** por isso o `ErrorBanner` lista as mensagens da etapa; ao entrar na etapa os campos tocados mostram o erro individual também.
- **Foco e leitor de tela:** trocar de etapa com a navegação livre precisa mover o foco para o título da etapa e o painel não pode anunciar a cada tecla (debounce).
- **Testes existentes** (`PrecoWizard.test.tsx`) usam "Avançar" 3 vezes e `Etapa N de 4`; precisam ser reescritos para 3 etapas e os textos novos.
- **Cartão de tipo versus `Select`:** o valor continua string do enum (`"1"`–`"4"`); a troca para Convênio continua exibindo o campo de % conveniada nas faixas.
- **Código do dia da semana** segue "a confirmar com o backend" (`DIAS_SEMANA_PRECO`); o resumo de horários usa só essa constante.

## Fora de escopo técnico
- Edição em página única com revisão antes de salvar (proposta D).
- Mudanças em API, mapper (`preco.mapper.ts`), tipos de payload ou regras de negócio.
- Persistir rascunho entre sessões.
- Trocar `window.confirm` por `ConfirmDialog`.
