# Tech Spec: Redesenho mobile-first do cadastro e da edição de preços (Modelo A · Página única em seções)

## Referências
- PRD: ./prd.md
- Design: ./design.md (Modelo A escolhido) e `./layouts.html` (telas de referência)
- Substitui, na interface, a parte visual de `../precos-cadastro-em-etapas/` (3 etapas) e do fluxo de `../editar-preco/`. Campos, regras de validação, `diff`, contratos de API e o que é enviado ao salvar **não mudam**.

> Antes de implementar: `AGENTS.md` avisa que esta versão do Next.js tem mudanças; ler o guia relevante em `node_modules/next/dist/docs/` se mexer em rotas (aqui só mudam componentes de cliente).

## Achado que simplifica a solução
O app já tem o padrão do Modelo A em **Minha empresa**, **Nova empresa** e **Nova conveniada**: `ui/Accordion` (seções com resumo, erro e painel que continua montado) + `ui/PainelCadastro` (trilho de progresso por seção, status em texto, atalhos e ações; barra fixa acima do menu inferior no celular e painel lateral fixo em telas grandes) + `CadastroCorpo`/`irParaSecao`. O cadastro de preços passa a usar **esse mesmo padrão**, o que cumpre o RF12 (coerência) com pouco código novo.

## Design

### Telas/estados
**Celular (< 1024 px)**
1. **Barra de topo curta:** `BackButton` ("‹ Preços", com a confirmação de hoje se houver alterações) + título "Novo preço" / "Editar preço" (e, na edição, nome e situação da tabela numa linha).
2. **Seções em acordeão, uma aberta por vez:** *O básico* (descrição, tipo de regra, empresa conveniada, vigência, situação), *Categorias*, *Quando vale*, *Quanto cobra*. Fechada, cada seção mostra marca de estado (✓, ! ou número), resumo em uma linha e, na edição, "antes → depois" e a etiqueta **Alterado**.
3. **Placa/resumo ao fim** (`PrecoResumoAoVivo`, que já traz as mudanças em "antes → depois") e a **barra do `PainelCadastro`** fixa acima do menu: trilho de 4 segmentos, status ("Faltam: descrição, categoria (+1)" / "2 mudanças" / "Pronta para salvar") e as ações **Cancelar** e **Salvar**.

**Cadastro novo:** começa com *O básico* aberta; **Salvar** desabilitado até a tabela ficar válida (o status diz o que falta); cada seção tem **Continuar** no fim, que abre a próxima e rola até ela.
**Edição:** todas as seções começam **fechadas**, com resumo e "Alterado"; **Salvar** habilitado só com alterações reais (`hasChanges`); salvar de qualquer seção valida tudo e, havendo pendência, abre a primeira seção com problema e mostra o que falta.

**Computador (≥ 1024 px):** duas colunas (padrão do `CadastroCorpo`): seções à esquerda; à direita o `PainelCadastro` lateral fixo (progresso, atalhos por seção, Cancelar/Salvar) e, abaixo dele, o `PrecoResumoAoVivo` com a placa.

**Estados:** carregando (esqueleto das seções, na edição), erro/tabela inexistente (como hoje), erro ao salvar (`ErrorDialog` com Tentar novamente), saída com alterações (`beforeunload` e confirmação), sucesso (volta à consulta com `Toast`).

### Componentes do design system reaproveitados
`Accordion`/`AccordionItem`, `PainelCadastro` + `CadastroCorpo` + `irParaSecao`, `BackButton`, `Button`, `Input`, `Select`, `Switch`, `Checkbox`, `NumberStepper`, `BottomSheet` (opcional, para o resumo completo no celular), `ErrorBanner`, `ErrorDialog`, `Skeleton`, `StatusBadge`; da feature: `FaixasPreview`, `PrecoResumoAoVivo`, `GradeHorarios`, `PrecoFaixasStepFields`, `PrecoCategoriasStepFields`, `TipoRegraCards`, validação (`lib/schemas/preco.ts`) e `diff.ts`.

### Componentes novos ou estendidos
No design system (`src/components/ui`):
- **`Accordion` (estender):** `summary` passa a aceitar `ReactNode` (para o valor antigo riscado e o novo em destaque); novas props opcionais `marca?: "pronta" | "pendente" | "erro" | number` (círculo de estado à esquerda do título) e `etiqueta?: string` ("Alterado"). Compatível com os usos atuais (Empresa, Faturas, Onboarding etc.), que não passam as novas props.
- **`NumberStepper` (estender):** `step?: number`, `format?: (valor: number) => string` e `decimals?: number` para valores em reais e minutos com passo de 5; hoje só trabalha com inteiros de passo 1.
- **`StepperField`** em `src/components/form/` (liga o `NumberStepper` a um campo de texto do formulário, convertendo texto ↔ número com `parseMoney`/inteiro).

Na feature (`src/components/precos`):
- **`secoes.ts`:** definição das 4 seções (`SECOES`: id, título), funções puras `estadoDaSecao(...)`, `resumoDaSecao(secao, values)` (texto de uma linha) e `mudancasDaSecao(secao, diff)` (lista antes → depois), apoiadas em `diffPreco` e nos formatadores já usados por `PrecoResumoAoVivo`.
- **`PrecoWizard/PrecoSecoes.tsx`:** os 4 `AccordionItem` com os campos de cada seção, o botão **Continuar** (cadastro) e o controle de "uma aberta por vez".
- **`CampoVigencia/`:** início em chips **Começa hoje** | **Escolher data** e fim em **Sem fim** | **Termina em…**; o `datetime-local` nativo só aparece quando preciso. Substitui os dois campos e o checkbox "Sem data de fim" dentro de `PrecoBasicoFields`.
- **`GradeHorarios/FaixaRapida.tsx`:** chips Seg a Dom + **De–Até** (horas) + **Aplicar**, que pinta o intervalo nos dias escolhidos (função pura nova em `grade.ts`: `pintarFaixa(grade, dias, de, ate)`), além do toque por célula, dos modelos e do ajuste fino que já existem.

### Tokens
Nenhum token novo; usa os existentes (`colors.*`, `space`, `radii`, `fontSizes`, `layout.touchTarget`, `layout.formAsideWidth`, `layout.stickyTop`, `layout.bottomNavReserved`).

## Arquitetura da solução

### Estado e fluxo (lógica preservada)
`PrecoWizardForm.tsx` continua dono do estado: 4 `useAppForm` (info, horários, faixas, categorias), `useStore` dos valores, `mutation` (`onSave`), invalidação de cache, `beforeunload`, `hasChanges`/`diffPreco` e `ErrorDialog`. O que muda é o controle de navegação: sai o `step` (1 a 3) e entra `aberta: SecaoId | null`, com:
- `abrir(id)`: define `aberta = id` (as outras fecham), marca a seção como visitada e chama `irParaSecao(id)` no próximo quadro;
- `visitadas: ReadonlySet<SecaoId>`: só depois de visitada uma seção incompleta passa a mostrar "!" (mesma regra de hoje);
- `falhaSecao: SecaoId | null`: seção da última tentativa de salvar que falhou na validação.

### Validação por seção
Em `src/lib/schemas/preco.ts`:
- `validarSecoesPreco(values)` devolve `{ basico, categorias, horarios, cobranca }` (mensagens por seção), separando as de categorias que hoje vão junto com "O básico" em `validarEtapasPreco`; reaproveita os mesmos schemas (`precoInfoSchema`, `precoCategoriasSchema`, `precoHorariosSchema`, `precoFaixasSchema`) e `CAMPOS_BASICO`.
- `findInvalidPrecoSecao(values)` devolve o id da primeira seção (na ordem da tela) com erro, ou `null`.
- `validarEtapasPreco`/`findInvalidPrecoStep` e os testes deles migram para as novas funções e saem quando nada mais as usar (sem código morto).

### Arquivos
**Criar**
- `src/components/precos/secoes.ts` (+ `secoes.test.ts`)
- `src/components/precos/PrecoWizard/PrecoSecoes.tsx` (+ estilos e teste)
- `src/components/precos/CampoVigencia/{CampoVigencia.tsx,CampoVigencia.styles.ts,index.ts,CampoVigencia.test.tsx}`
- `src/components/precos/GradeHorarios/FaixaRapida.tsx` (+ estilos e teste) e `pintarFaixa` em `src/components/precos/grade.ts` (+ teste em `grade.test.ts`)
- `src/components/form/StepperField.tsx`

**Alterar**
- `src/components/ui/Accordion/*`: `summary` como `ReactNode`, props `marca` e `etiqueta` (+ testes).
- `src/components/ui/NumberStepper/*`: `step`, `format`, `decimals` (+ testes).
- `src/lib/schemas/preco.ts` e `preco.test.ts`: as duas funções novas.
- `src/components/precos/PrecoWizard/PrecoWizardForm.tsx` e `PrecoWizard.styles.ts`: layout em `CadastroCorpo` + `PrecoSecoes` + `PainelCadastro`; remove `step`, `PrecoEtapasNav`, `DockCadastro`, `PainelNaPagina`, `AcaoDoFormulario` e o `Card` de moldura.
- `src/components/precos/PrecoWizard/PrecoWizard.tsx`: cabeçalho e esqueleto da edição no novo formato.
- `src/components/precos/PrecoBasicoFields/PrecoBasicoFields.tsx`: usa `CampoVigencia`; os blocos "Identificação", "Vigência" e "Situação" ficam dentro da seção *O básico*.
- `src/components/precos/PrecoCobrancaFields/PrecoCobrancaFields.tsx`: diária e tolerâncias com `StepperField` (mantêm o seletor de período e as frases de ajuda).
- `src/components/precos/GradeHorarios/GradeHorarios.tsx`: inclui `FaixaRapida`.
- `src/components/precos/PrecoResumoAoVivo/*`: ajustes de posição (coluna à direita sob o painel em telas grandes; ao fim da página no celular); a lógica de diff e resumo não muda.

**Remover** (quando sem uso): `src/components/precos/PrecoEtapasNav/*`, `src/components/precos/PrecoWizard/DockCadastro.*`.

### Server vs Client
Tudo em `src/components/precos/**` e `ui/**` é Client Component (estado, formulário, `<dialog>`). As rotas `src/app/(app)/precos/novo/page.tsx` e `src/app/(app)/precos/[id]/editar/page.tsx` continuam finas. Nenhum dado novo no servidor nem contrato de API novo.

### Detalhes de comportamento
- **Resumo e "Alterado" por seção:** `resumoDaSecao` produz o texto de uma linha (ex.: "Padrão · 07/11/2026 → sem fim · Todas"); `mudancasDaSecao` devolve os pares antes → depois; quando há mudança, o `Accordion` recebe `etiqueta="Alterado"` e o resumo mostra o valor antigo riscado e o novo em destaque. As mudanças por seção vêm de `diffPreco` agrupando os campos: *O básico* (descrição, tipo, empresa conveniada, vigência, ativo), *Categorias*, *Quando vale* (horários), *Quanto cobra* (faixas, diária, adicional, tolerâncias).
- **Status do painel:** `PainelCadastro.status` = pendências da seção mais próxima ("Faltam: …") no cadastro; "N mudanças" ou "Pronta para salvar" na edição; o trilho tem 4 segmentos (um por seção, no estado `pronta`/`pendente`/`erro`).
- **Salvar:** cadastro, habilitado só com a tabela válida; edição, habilitado com alterações reais. `salvar()` continua validando tudo (`handleSubmit` dos 4 formulários, para marcar os campos) e, com pendência, chama `abrir(findInvalidPrecoSecao(values))` e mostra a lista do que falta num `ErrorBanner` no topo da seção aberta.
- **Cancelar:** `BackButton` e botão do painel pedem a confirmação de hoje quando há alterações; `beforeunload` inalterado.
- **Acordeão:** os painéis recolhidos continuam montados (comportamento do `Accordion`), então valores e erros dos campos se preservam entre seções; `irParaSecao` rola e põe o foco no primeiro controle da seção aberta (substitui o foco programático na frase "Etapa N de 3", que deixa de existir).
- **Vigência:** `CampoVigencia` continua gravando os mesmos valores (`inicioVigencia` em `YYYY-MM-DDTHH:mm`, `fimVigencia` vazio para "Sem fim"); "Começa hoje" usa `inicioVigenciaDeHoje()`; ao voltar de "Termina em…" para "Sem fim" limpa o fim, como o checkbox faz hoje.
- **Degraus:** `PrecoFaixasStepFields` mantém a linha compacta já feita (Horas, Minutos, Valor lado a lado, rótulos curtos com nome acessível completo), os modelos prontos, o salto e os avisos.

## Decisões e trade-offs
- **Reusar `Accordion` + `PainelCadastro` em vez de criar `SecaoRecolhivel` e uma barra própria:** é o padrão já aprovado e testado no app (Empresa, Conveniada); reduz o código novo e mantém a coerência. Custo: a barra do celular é a do `PainelCadastro` (trilho + status + ações), um pouco diferente do mock (que tinha texto "Faltam 3 coisas" em duas linhas); o texto vai no `status`.
- **Quatro seções, não três:** *Categorias* sai de *O básico* para ficar com o estado e a validação próprios, como no mock; o preço disso é a nova `validarSecoesPreco` e o agrupamento de mudanças em `secoes.ts`.
- **Uma seção aberta por vez, no cadastro e na edição:** mantém a altura previsível (RF11); no cadastro, **Continuar** conduz a ordem sem obrigá-la (o usuário pode abrir qualquer seção).
- **Não manter o stepper de 3 etapas** nem uma versão paralela para telas grandes: um só layout responsivo (princípio 4 de `PRODUCT.md`), com o painel lateral nas telas grandes pelo próprio `CadastroCorpo`.
- **`NumberStepper` e `StepperField` em vez de campos de texto para diária e tolerâncias:** − / + facilita ajustes pequenos no celular; o campo continua guardando texto no formulário (sem mudar schema nem payload), e o teclado numérico próprio segue disponível ao tocar no valor.
- **Seletor nativo de data só sob demanda:** reduz o peso visual sem trocar o tipo de valor que o formulário e a API esperam.

## Riscos / pontos de atenção
- **Reescrita dos testes do wizard:** `PrecoWizard.test.tsx` (cerca de 400 linhas) navega por "Avançar"/etapas; precisa migrar para seções (abrir seção, Continuar, Salvar). É a maior parte do esforço de teste.
- **Validação por seção:** garantir que a soma das mensagens das 4 seções seja igual à de hoje (mesmos textos, nenhuma perdida ao separar categorias) e que `findInvalidPrecoSecao` siga a ordem visual.
- **`Accordion` compartilhado:** a mudança de `summary` para `ReactNode` e as props novas não podem alterar Empresa, Faturas, Lançamentos, Onboarding, Mensalistas e `FiltroPeriodo` (cobrir com os testes existentes).
- **Barra do `PainelCadastro` sticky:** conferir no celular que não cobre o fim do formulário nem se sobrepõe ao menu; ela é `position: sticky` (não fixa), então o último campo precisa de folga igual à da barra.
- **Foco e leitor de tela:** trocar o foco na frase da etapa por `irParaSecao`; validar `aria-expanded`, o nome acessível dos marcadores de estado e o anúncio de "N mudanças".
- **Grade vertical + faixa rápida:** `pintarFaixa` precisa tratar o intervalo que cruza a meia-noite (ex.: 22h–6h) e a combinação com horários fora da grade (minutos, inativos, períodos), que o ajuste fino preserva.
- **Edição de tabela sem alterações:** Salvar desabilitado e status "Tudo salvo"/"Pronta para salvar" coerentes com `hasChanges`.
- **Verificação visual:** usar capturas da janela visível, não de página inteira (a barra sticky e o menu fixo enganam em capturas de página inteira).

## Fora de escopo técnico
- Mudar API, mapper, schemas Zod dos campos, `diff.ts`, `estimarCobranca` ou permissões.
- Os modelos B e C.
- Rascunho salvo no servidor, duplicar tabela, histórico de alterações, regras de prioridade entre tabelas.
- Revisar a consulta (esteira, detalhe, simulador) e o tema escuro além do que os tokens já fazem.
