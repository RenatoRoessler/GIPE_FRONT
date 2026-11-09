# Tech Spec: Redesenho mobile-first da Gestão de Preços (Modelo A · Cockpit)

## Referências
- PRD: ./prd.md
- Design: ./design.md (Modelo A escolhido) e `./layouts.html` (telas de referência)
- Specs anteriores que esta substitui na interface: `../precos-lista-detalhe/` (lista + detalhe) e `../precos-cadastro-em-etapas/` (parte visual do cadastro). Regras de negócio, campos, validações e contratos de API **não mudam**.

> Antes de implementar: `AGENTS.md` avisa que esta versão do Next.js tem mudanças. Ler o guia relevante em `node_modules/next/dist/docs/` (App Router, `useSearchParams`, `Link`) antes de mexer em rotas.

## Design

### Telas/estados
**Celular (< 768 px)**
1. **Consulta** (`/precos`): barra do módulo (título, Buscar, + Novo) → **esteira** de miniplacas → nome, selo de situação e **Editar** → abas Tarifa / Horários / Informações → placa → **dock do simulador** fixo acima do menu.
2. **Todas as tabelas** (`/precos?lista=1`): lista com busca, chips de situação que quebram linha, itens com valor-resumo, paginação; tocar num item volta à consulta com ele selecionado.
3. **Cadastro** (`/precos/novo`, `/precos/[id]/editar`): barra de 3 segmentos, formulário da etapa, **dock do cadastro** fixo (resumo curto + Avançar/Salvar); tocar no resumo abre a folha "Sua tabela" com o resumo completo e a placa.
4. **Folha do simulador**: categoria e permanência (chips + controle + campo), resultado e explicação.

**Computador (≥ 768 px):** esteira vira faixa de cartões no alto; detalhe com placa à esquerda e simulador em coluna à direita (não há dock); a lista completa abre numa folha lateral (mesmo conteúdo da tela "Todas as tabelas"). Cadastro mantém formulário + painel "Sua tabela" lateral de hoje (≥ 1024 px).

**Estados** (todas as telas): carregando (Skeleton na forma de esteira/placa/linhas), erro com Tentar novamente, vazio ("Nenhuma tabela de preço cadastrada." + Novo preço), busca sem resultado (+ Limpar busca), tabela inexistente, sem permissão (`ErroSemPermissao`), salvo (Toast) — iguais aos de hoje.

### Componentes do design system reaproveitados
`Button`, `Text`, `Tabs` (ganha apresentação segmentada via prop de variante), `StatusBadge`, `Pagination`, `Skeleton`, `ErrorBanner`, `Toast`, `Select`, `Stepper`/`PrecoEtapasNav`, `ErrorDialog`, `BackButton`; da feature: `FaixasPreview`, `PrecoSemana`, `SimuladorCobranca`, `GradeHorarios`, `PrecoResumoAoVivo`, `PrecoBasicoFields`, `PrecoFaixasStepFields` etc. (campos do cadastro **sem alteração de lógica**).

### Componentes novos
No design system (`src/components/ui`):
- **`BottomSheet`**: folha inferior sobre `<dialog>` nativo, no padrão de `ui/Modal` (foco preso, Esc, backdrop, devolve o foco a quem abriu). No celular sobe do rodapé e acima do menu; em ≥ 768 px vira painel lateral. Props: `open`, `title`, `onClose`, `children`, `footer?`.
- **`DockBar`**: barra fixa acima do menu inferior. Aplica `bottom: calc(bottomNavReserved + env(safe-area-inset-bottom))`, esconde-se em ≥ 1024 px por padrão (`$mostrarNoDesktop` opcional) e expõe sua altura na variável CSS `--dock-altura`, usada pelo conteúdo para a folga final.

Na feature (`src/components/precos`):
- **`PrecosCockpit`** (substitui `PrecosMasterDetail`): contêiner da consulta; mantém `usePrecos`, `usePrecosUrlState` e `useSelecaoPrecos` (ver Arquitetura).
- **`EsteiraPlacas`** + **`PlacaMini`**: esteira horizontal (rolagem com `scroll-snap`, próxima placa parcialmente à vista, roving tabindex e setas), cada miniplaca mostra nome, tipo, selo e 2–3 degraus + diária.
- **`PrecoListaCompleta`**: busca + chips + lista + paginação (conteúdo hoje em `PrecosMasterDetail`, extraído) dentro da folha lateral (desktop) ou tela (celular).
- **`ResumoPrecoItem`**: texto de valor-resumo do item ("R$ 15 a 1 h · diária R$ 100") derivado de `PrecoView`.
- **`DockSimulador`**: linha com categoria, permanência e resultado; botão **Ajustar** abre `BottomSheet` com o `SimuladorCobranca` completo.
- **`DockCadastro`**: resumo curto ("Faltam descrição e categoria" / "Pronta para salvar") + botão principal; abre a folha com `PrecoResumoAoVivo` e `FaixasPreview`.
- **`PrecoEtapasBarra`**: barra de 3 segmentos (completa ✓, atual, pendência !), mesmo contrato de `PrecoEtapasNav` (estado dito em texto).

### Tokens
Sem token de cor/tipografia novo. Reaproveita os existentes (`colors.*`, `space`, `radii`, `fontSizes`, `typography.display*`, `shadows`, `layout.bottomNavReserved`, `layout.touchTarget`, `layout.actionBarHeight`, `layout.fabClearance`). **Novos em `theme.ts` (`shared.layout`):**
- `dockHeight: "72px"` (altura do dock com uma linha de conteúdo);
- `placaMiniWidth: "152px"` (largura da miniplaca na esteira).

## Arquitetura da solução

### Rotas e estado (sem mudar contratos)
- A API de dados continua `listAllPrecos` (carga completa, **já com faixas, diária e regras em `PrecoView`**): o valor-resumo por item e as miniplacas **não exigem chamada nova**. Busca, filtro e paginação continuam em memória em `usePrecos`.
- `usePrecosUrlState` ganha o parâmetro **`lista=1`** (lista completa aberta) e mantém `preco`, `q`, `situacao`, `pagina`, `salvo`. Recarregar ou compartilhar o endereço volta ao mesmo ponto (RF3).
- `useSelecaoPrecos`: no Modelo A **sempre há tabela selecionada** (a esteira não tem "estado sem seleção"): `detalheAberto` deixa de existir; a seleção padrão (primeira vigente, senão a primeira) passa a valer também no celular, **sem gravar no endereço**. `maiorId` após criar continua igual.
- Histórico no celular: abrir a lista completa faz `push`; trocar de tabela na esteira faz `replace` (não enche o histórico); o Voltar do navegador fecha a lista completa.

### Arquivos
**Criar**
- `src/components/ui/BottomSheet/{BottomSheet.tsx,BottomSheet.styles.ts,index.ts,BottomSheet.test.tsx}`
- `src/components/ui/DockBar/{DockBar.tsx,DockBar.styles.ts,index.ts,DockBar.test.tsx}`
- `src/components/precos/PrecosCockpit/{PrecosCockpit.tsx,PrecosCockpit.styles.ts,index.ts,PrecosCockpit.test.tsx}`
- `src/components/precos/EsteiraPlacas/{EsteiraPlacas.tsx,PlacaMini.tsx,EsteiraPlacas.styles.ts,index.ts,*.test.tsx}`
- `src/components/precos/PrecoListaCompleta/{PrecoListaCompleta.tsx,PrecoListaCompleta.styles.ts,index.ts,*.test.tsx}` (move a lógica de lista/filtros/paginação de `PrecosMasterDetail`)
- `src/components/precos/resumoPreco.ts` (+ teste): valor-resumo de um `PrecoView` (primeira faixa e diária; "Sem valores" quando não há faixa)
- `src/components/precos/DockSimulador/*`, `src/components/precos/PrecoWizard/DockCadastro.tsx`, `src/components/precos/PrecoEtapasBarra/*`

**Alterar**
- `src/components/precos/PrecosMasterDetail/*` → substituído por `PrecosCockpit` (remover a pasta ao final; `index.ts` de `precos` e `src/app/(app)/precos/page.tsx` apontam para o novo).
- `src/components/precos/PrecoDetalhe/PrecoDetalhe.tsx` e `.styles.ts`: cabeçalho compacto (sem `BackButton "Preços"` no celular; o título e **Editar** na mesma linha), abas segmentadas, `SimuladorCobranca` sai do corpo no celular (vai para o dock/folha) e permanece lateral no desktop.
- `src/components/precos/PrecoListItem/*`: passa a mostrar `ResumoPrecoItem`; reaproveitado na lista completa.
- `src/components/precos/PrecoWizard/PrecoWizardForm.tsx` e `PrecoWizard.styles.ts`: troca `PrecoEtapasNav` por `PrecoEtapasBarra` no celular, adiciona `DockCadastro`, move `Actions` para o dock no celular (≥ 768 px mantém como hoje), remove o `Card` de moldura no celular. **Lógica de formulário, validação, `salvar`, diff e `beforeunload` não mudam.**
- `src/components/precos/PrecoResumoAoVivo/*`: renderizável dentro da folha (prop para esconder o título duplicado); corrige a linha **Faixas** (RF14): só conta como preenchida se `faixasForm` foi editado (`isDirty`) ou veio de uma tabela existente — o padrão `EMPTY_PRECO_FORM_VALUES` com 7 degraus deixa de aparecer como "7 degraus · diária —" preenchido.
- `src/components/ui/Tabs/*`: nova prop `variant?: "linha" | "segmentada"`.
- `src/styles/theme.ts`: tokens `dockHeight` e `placaMiniWidth`.
- `src/components/precos/PrecoSemana`: sem mudança de dados; garantir legibilidade a 360 px.

### Server vs Client
Tudo em `src/components/precos` e `ui/BottomSheet`/`DockBar` é **Client Component** (estado, URL, `<dialog>`, rolagem). As páginas em `src/app/(app)/precos/**` continuam finas (Server Component que renderiza o cliente). Nenhum dado novo no servidor.

### Detalhes de comportamento
- **Esteira:** ordem = ordem da lista filtrada da página (vigentes primeiro, como a seleção padrão). Selecionada fica à vista (`scrollIntoView({inline:"center"})` ao trocar). "Ver todas (N)" abre a lista completa. Setas ← → movem o foco; Enter seleciona.
- **Dock do simulador:** estado do simulador (categoria, permanência) é local ao `DockSimulador`; `key={rotatividadeId}` zera ao trocar de tabela (mesma regra do `SimuladorCobranca` atual). O resultado vem de `estimarCobranca` (sem mudança) e é anunciado em `aria-live="polite"`; o aviso "Estimativa. O valor real é calculado no momento da saída." aparece na folha e como `title`/texto auxiliar no dock.
- **Folga do conteúdo:** `DockBar` publica `--dock-altura`; o contêiner rolável da consulta e do cadastro usa `padding-bottom: calc(var(--dock-altura, 0px) + <espaço>)` para o último item nunca ficar atrás do dock (RF11).
- **Cadastro:** `DockCadastro` mostra "Faltam: descrição e categoria" usando `pendentesDaEtapa`; botão = Avançar ou Salvar conforme a etapa, com os mesmos `disabled` de hoje (`pendentesDaEtapa`, `saving`, `isEdit && !hasPendingChanges`). Na edição o dock mostra "Alterações não salvas".
- **Teclado de toque:** o dock sobe junto com o teclado nativo? Não: com o teclado aberto o dock fica **oculto** (`visualViewport` / `--teclado-altura` já usado no `AppShell`) para não comer a área do campo.

## Decisões e trade-offs
- **`BottomSheet` novo no design system** em vez de reusar `Modal` em tela cheia: o sheet mantém o contexto visível e reúne foco e Esc do `<dialog>`; a base é a mesma de `Modal` (menos código novo, mesma acessibilidade).
- **Dock e Modelo A só no celular:** em ≥ 1024 px o layout atual de duas colunas já funciona bem e o menu é lateral; o ganho está no celular, então o desktop ganha só a faixa de cartões e a coluna do simulador. Evita duas implementações divergentes (princípio 4 de `PRODUCT.md`): **um** `PrecosCockpit` com CSS responsivo, sem `window.matchMedia` para decidir estrutura (a exceção atual `selecionar(push)` deixa de ser necessária).
- **Seleção sempre presente (sem `detalheAberto`):** simplifica o estado e evita a tela "só lista" no celular; custa uma pequena mudança em `useSelecaoPrecos` e nos testes.
- **Não paginar a esteira:** a esteira mostra a página atual da lista filtrada (até 20) e delega o resto a "Ver todas"; evita carregar mais cartões e mantém o desempenho.
- **Sem chamada de API nova** e sem mexer em `preco.ts`/mapper: o risco de divergência com o backend é zero.
- **Não criar `useMediaQuery`:** CSS cobre as diferenças; só o histórico (`push`/`replace`) é decidido por interação (abrir a lista completa vs trocar de tabela).

## Riscos / pontos de atenção
- **Altura em telas baixas** (≈ 568 px de altura útil): menu + dock + esteira comem espaço; mitigar com dock de uma linha (`dockHeight` 72 px), esteira de altura fixa e testes visuais a 360 × 640 e 320 × 568.
- **Esteira com muitas tabelas:** depende de "Ver todas" e da ordenação; testar com 1, 2, 20 e 100 tabelas.
- **Acessibilidade da esteira** (rolagem horizontal, foco e `scroll-snap`): precisa de `aria-label`, roving tabindex e pista visual de continuidade; validar com leitor de tela.
- **`<dialog>` em iOS Safari** (altura com barra de endereço, `100dvh`): testar a folha do simulador e a de resumo com o teclado aberto.
- **Regressão no cadastro:** o wizard concentra validação e salvamento; mudar só apresentação e conferir com os testes existentes (`PrecoWizard.test.tsx`, etc.).
- **Dados do `PrecoView`** com `faixas` vazias ou `tipoRegra` nulo: `resumoPreco` e `PlacaMini` precisam de fallback ("Sem valores", "—").
- **Link antigo** `/precos?preco=ID` deve continuar funcionando (mesmo parâmetro).
- **Falso positivo do diagnóstico:** a captura de página inteira mostrou o menu sobre o conteúdo; verificar sempre com captura da janela visível, não com página inteira.

## Fora de escopo técnico
- Mudar API, mapper, schemas Zod, `estimarCobranca`, regras de negócio ou permissões.
- Os modelos B e C.
- Busca e filtro no servidor, ordenação interativa, histórico de alterações, exclusão/duplicação, empresa conveniada.
- Reestruturar `GradeHorarios` e os campos do cadastro (só ajustes de espaçamento/toque se a 360 px houver problema).
- Modo escuro: usa os mesmos tokens e vem de graça, mas não há revisão visual dedicada nesta entrega.
