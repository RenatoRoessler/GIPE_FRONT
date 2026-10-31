# Tech Spec: Revisão de UX e Layout do Fluxo de Adesão

## Referências
- PRD: ./prd.md
- Design: ./design.md (decisões visuais completas; a seção "Design" abaixo só resume o que a implementação precisa)
- Mockup: ./mockups/opcao-1.png
- Fluxo atual: `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx`
- Contrato de envio (não muda): `src/lib/api/services/adesao.mapper.ts`

## Design
- **Telas/estados**: 4 etapas (Empresa, Horários, Titular, Conferir). Etapa Empresa em 3 sub-blocos recolhíveis (Identificação, Endereço, Capacidade e pagamentos). Estados: padrão, erro de validação, CEP (buscando/encontrado/não encontrado/erro), enviando, erro do backend (com atalho "Corrigir …"), sucesso (redireciona ao login).
- **Componentes do design system reaproveitados**: `Logo`, `Button`, `Input`, `Select`, `Switch`, `Text`, `ErrorBanner`, `PasswordRequirements`, `Accordion`/`AccordionItem` (sub-blocos; o painel recolhido continua montado, o que preserva valores e erros), `PageBackground`, `Toast` (no login, já existente), `Stepper` (evoluído sem quebrar `PrecoWizard`).
- **Componentes novos** (todos reutilizáveis, em `src/components/ui`):
  - `CredencialEmpresa/` — cartão da credencial (variantes `lateral`, `faixa`, `compacta`).
  - `StripeBar/` — listra diagonal de faixa (decorativa, `aria-hidden`).
  - `ActionBar/` — barra de ações (Voltar/Próximo) com modo fixo no rodapé no celular, respeitando `env(safe-area-inset-bottom)`.
  - `Stepper/` evoluído: props opcionais `onStepClick`, `compact`; sem elas, comportamento idêntico ao atual.
- **Componentes novos específicos da adesão** (em `src/components/adesao`):
  - `AdesaoShell/` — layout da página (barra superior com Logo e stepper, 2 colunas com credencial, `ActionBar`).
  - `ConferirStep/` — resumo por seção com "Editar".
  - `AtalhosHorario/` — chips de atalho de horário.
  - `ResumoCredencial.ts` — função pura que transforma os dados dos formulários em props da credencial.
- **Tokens**: só os do tema atual (`colors.*`, `space`, `fontSizes`, `radii`, `shadows`, `breakpoints`, `layout.stickyTop`, `layout.formGridWide`). Novos em `src/styles/theme.ts`, no grupo `layout`: `touchTarget: "44px"`, `actionBarHeight: "76px"`, `credentialWidth: "330px"`. Nenhum valor visual solto nos componentes.

## Arquitetura da solução

### Arquivos criados
```
src/components/ui/CredencialEmpresa/{CredencialEmpresa.tsx,CredencialEmpresa.styles.ts,CredencialEmpresa.test.tsx,index.ts}
src/components/ui/StripeBar/{StripeBar.tsx,index.ts}
src/components/ui/ActionBar/{ActionBar.tsx,ActionBar.styles.ts,ActionBar.test.tsx,index.ts}
src/components/adesao/AdesaoShell/{AdesaoShell.tsx,AdesaoShell.styles.ts,index.ts}
src/components/adesao/ConferirStep/{ConferirStep.tsx,ConferirStep.styles.ts,ConferirStep.test.tsx,index.ts}
src/components/adesao/AtalhosHorario/{AtalhosHorario.tsx,AtalhosHorario.styles.ts,AtalhosHorario.test.tsx,index.ts}
src/components/adesao/useAdesaoWizard.ts            (+ .test.tsx)
src/components/adesao/credencial.ts                 (+ .test.ts)   // função pura dos dados da credencial
src/components/adesao/horarios.ts                   (+ .test.ts)   // presets de horário (funções puras)
src/lib/api/adesaoErrors.ts                         (+ .test.ts)   // atribui erro do backend a um campo/etapa
```

### Arquivos alterados
- `OnboardingWizard.tsx` — passa a ser composição fina: usa `useAdesaoWizard`, renderiza `AdesaoShell` e a etapa atual. Sem lógica de formulário inline.
- `OnboardingWizard.styles.ts` — remove estilos que migram para `AdesaoShell`/`ActionBar`.
- `CompanyStepFields.tsx` — nova prop opcional `grupo?: "identificacao" | "endereco" | "capacidade"`. Sem a prop, renderiza os 3 grupos como hoje (usado por `EmpresaSecoes` e `ConveniadaEmpresaFields`, que não podem mudar de comportamento).
- `BusinessHoursStepFields.tsx` (+ `.styles.ts`) — troca a barra "Copiar segunda…" por `AtalhosHorario`; "24 horas" passa de segundo `Switch` para chip por dia; linha vira cartão de duas linhas em < `md`.
- `AdminUserStepFields.tsx` — botão mostrar/ocultar senha e texto de apoio; mesmo `form`/schema.
- `Stepper.tsx` / `Stepper.styles.ts` — props opcionais (ver acima).
- `src/styles/theme.ts` — 3 tokens em `layout`.
- `PagamentosFields` — **sem alteração**; apenas é renderizado dentro do 3º sub-bloco.
- Testes existentes: `OnboardingWizard.test.tsx` é reescrito para as 4 etapas; `Stepper` ganha testes das novas props.

### Não mudam
`src/lib/schemas/adesao.ts`, `src/types/adesao.ts`, `adesao.mapper.ts`, `adesao.ts` (serviço), `src/app/adesao/page.tsx`, rota e redirecionamento `/login?cadastro=sucesso`. O contrato com o backend permanece idêntico (PRD: fora de escopo).

### Modelo de estado (`useAdesaoWizard`)
- Mantém os 4 formulários atuais (`companyForm`, `paymentsForm`, `hoursForm`, `adminUserForm`) com os mesmos schemas Zod. O hook centraliza o que hoje está espalhado no componente:
  - `etapa: 1 | 2 | 3 | 4` e `etapasConcluidas: Set<number>` (uma etapa é "concluída" quando seus schemas passam; recalculado ao avançar, não a cada tecla).
  - `blocoAberto: "identificacao" | "endereco" | "capacidade" | null` e `blocosConcluidos` — controla os `AccordionItem` da etapa 1. Concluir um bloco o recolhe e abre o próximo; "Editar" reabre.
  - `irParaEtapa(n)`: só permite voltar a etapas já concluídas (ou à atual); avançar passa por `avancar()`.
  - `avancar()`: valida os formulários da etapa; se houver erro, abre os blocos com erro, move o foco ao primeiro `[aria-invalid="true"], [data-invalid="true"]` (mesma técnica de hoje) e expõe `faltam: number` para o aviso "Faltam N campos".
  - `enviar()`: `useMutation` com `saveAdesao`; ao falhar, `atribuirErro(error)` define `erroBackend: { mensagem, alvo?: { etapa, campo, rotulo } }`.
  - `corrigir(alvo)`: `irParaEtapa(alvo.etapa)`, abre o bloco certo e foca o campo (por `name`).
- Credencial: componentes assinam os 3 stores com `useStore(form.store, selector)` (padrão já usado em `AdminUserStepFields`) e passam o resultado por `credencial.ts` → props de `CredencialEmpresa`. Seletores estreitos (nome fantasia, CNPJ, tipo, vagas, horários, pagamentos) para evitar re-render a cada tecla em campos que a credencial não mostra.
- Os dados de todas as etapas permanecem em memória na mesma sessão (RF9); o `Accordion` mantém painéis montados e os `form` vivem no hook, então voltar não perde nada.

### Funções puras
- `credencial.ts`: `buildCredencial({ company, hours, payments }) → { nome, cnpj, tipoLabel, vagasCarro, vagasMoto, dias: { sigla; estado: "aberto"|"24h"|"fechado" }[], pagamentos: string[] }`. Campo vazio → `undefined` (a UI desenha o traço apagado; nunca placeholder falso). Reaproveita `TIPO_EMPRESA_LABEL` e `MEIOS_PAGAMENTO[].curto`.
- `horarios.ts`: `aplicarSegSex(hours)`, `aplicarTodosOsDias(hours)`, `aplicar24Horas(hours)`, `copiarSegunda(hours)` (a lógica de `copyMondayToOtherDays` sai do componente). Todas retornam um novo `BusinessHoursData` sem mutar. "Seg–Sex 08–18" usa 08:00–18:00 segunda a sexta e fecha sábado e domingo (equivale ao `EMPTY_BUSINESS_HOURS_DATA` atual); índices vêm de `DIAS_SEMANA` (nunca números mágicos).
- `adesaoErrors.ts`: `atribuirErro(error: unknown) → { mensagem; alvo? }`. Para `ApiError` de `kind === "validation"`, procura palavras-chave (`cnpj`, `cpf`, `e-mail`/`email`) em `details[].code`/`message` e na mensagem; mapeia para `{ etapa, campo }` (CNPJ → etapa 1/`cnpj`; CPF e e-mail → etapa 3). Sem correspondência, devolve só a mensagem (comportamento atual). Mensagens de rede/timeout/servidor vêm do `ApiError` como hoje.

### Server vs Client Component
- `src/app/adesao/page.tsx` continua Server Component (só `metadata` + `<OnboardingWizard />`).
- Todos os componentes novos de adesão e de UI interativa são **Client Components** (`"use client"`): usam styled-components, estado de formulário e foco. `StripeBar` e a parte de apresentação de `CredencialEmpresa` não têm estado, mas seguem Client por usarem styled-components (mesmo padrão de `Tagline`). As funções puras (`credencial.ts`, `horarios.ts`, `adesaoErrors.ts`) não têm marca de client e são testáveis sem DOM.
- Antes de codar, ler `node_modules/next/dist/docs/` nos tópicos tocados (Client Components e metadata), conforme `AGENTS.md`; nenhuma mudança de rota/API é esperada.

### Layout e responsividade
- `AdesaoShell` usa CSS grid: `<md` coluna única com `ActionBar` fixa e `CredencialEmpresa variant="compacta"` fixa no topo (toque abre painel com a versão completa, via `Modal` existente em modo inferior se suportado, senão `Modal` padrão); `md`–`lg` credencial `variant="faixa"` sob o título; `≥lg` duas colunas (`1fr` + `layout.credentialWidth`) com a credencial `position: sticky; top: layout.stickyTop`.
- Grade dos campos reaproveita `FieldGroup`/`FieldCell` (container queries já respondem à largura do formulário).
- Conteúdo ganha `padding-bottom` = `layout.actionBarHeight` + safe-area quando a barra é fixa.
- Alvos de toque: `min-height: layout.touchTarget` em botões, chips e switches da adesão.

### Movimento e acessibilidade
- Troca de etapa: transição CSS (deslizamento curto + opacidade, 200–250ms) no contêiner da etapa; `@media (prefers-reduced-motion: reduce)` desliga transições (padrão já usado em `Accordion.styles.ts` e `PainelCadastro`).
- Foco: ao mudar de etapa, foco no título da etapa (`tabIndex={-1}`), mantendo o comportamento atual do `stepDescriptionRef`.
- Stepper: `aria-current="step"`; etapas concluídas viram `<button>` com `aria-label="Voltar para <etapa>"`; futuras não são interativas.
- Credencial: `role="region"` com `aria-label="Resumo da credencial"`, **sem** `aria-live` (evita ruído a cada tecla); versão fixa do celular exposta ao leitor uma única vez.
- Atalhos de horário: `<button aria-pressed>`; chip "24 horas" por dia com `aria-label` incluindo o dia (como os `aria-label` atuais).
- Erros: por campo via `aria-describedby` (já feito por `TextField`/`Input`); avisos gerais com `role="alert"` (`ErrorBanner`).
- Senha mascarada na conferência; nunca em `aria-label`, log ou mensagem de erro.
- Contraste da credencial: no tema claro fundo `colors.text` com texto `colors.background`; no escuro fundo `colors.surfaceMuted` com texto `colors.text` (validar 4.5:1). Listra usa `colors.primary` e a cor de fundo da credencial.

## Decisões técnicas e trade-offs
- **Manter os 4 formulários TanStack e os schemas Zod** em vez de unificar num só: o schema único exigiria reescrever validações e o `PagamentosFields` (que tem form próprio por regra do conjunto). Custo: o hook precisa orquestrar validação entre formulários; ganho: zero mudança no contrato, nos schemas e nos testes de schema.
- **Hook `useAdesaoWizard` em vez de estado no componente**: o wizard cresceu (4 etapas, sub-blocos, atribuição de erro); isolar a lógica a torna testável sem renderizar o layout e mantém `OnboardingWizard` como composição.
- **Sub-blocos com `Accordion` existente**: já mantém painéis montados (preserva valores/erros) e tem tratamento de `hasError`. Evita criar um componente novo; se o estilo do `Accordion` não atender ao visual do design, adicionar uma `variant` nele em vez de duplicar.
- **Credencial derivada por função pura + seletores estreitos**: separa regra (testável) de apresentação e limita re-renders. Não é um estado novo: nada é duplicado nem persistido.
- **Atribuição de erro por palavra-chave**: o formato de erro do backend ainda é pouco conhecido (PRD de integração: "erros por campo… até o formato ser conhecido"). A heurística é isolada em `adesaoErrors.ts` para ser trocada por um mapeamento por código quando o contrato existir; o fallback preserva a mensagem única no topo.
- **Stepper evoluído, não duplicado**: props opcionais mantêm `PrecoWizard` intacto; testes garantem a regressão zero.
- **`Modal` existente para a credencial no celular** em vez de criar bottom sheet novo (YAGNI); se a experiência ficar fraca, extrair bottom sheet depois.
- **Sem biblioteca de animação**: CSS puro, suficiente para os 3 movimentos descritos.
- **Sem persistência entre sessões** (rascunho fora de escopo): nada em `localStorage`.

## Riscos / pontos de atenção
- **Regressão em telas que reutilizam `CompanyStepFields`, `Stepper` e `Accordion`** (`EmpresaSecoes`, `ConveniadaEmpresaFields`, `PrecoWizard`, listas financeiras): mudanças só por props opcionais; rodar os testes dessas telas e `npm run lint`/`build`.
- **Validação entre 3 formulários na etapa 1**: `handleNextFromCompany` já faz `Promise.all` dos submits; manter o padrão e testar o caso "empresa válida, pagamentos inválidos" e o inverso.
- **Foco em sub-bloco recolhido**: campo inválido dentro de painel `hidden` não recebe foco; abrir o bloco antes de focar (`requestAnimationFrame` como hoje).
- **Credencial fixa no celular + teclado virtual + barra de ações fixa** podem consumir muita altura: testar em 320×568 e com teclado aberto; a credencial compacta ocupa uma linha só.
- **Heurística de erro do backend** pode não casar com mensagens reais: fallback mantém mensagem no topo; ajustar com exemplos reais do backend (CNPJ/CPF/e-mail duplicado).
- **Backend em HTTP / senha em trânsito**: risco já registrado em `integracao-adesao`; sem mudança aqui.
- **Códigos de dia da semana** (`DIAS_SEMANA`, "A DEFINIR" no backend): os presets de horário e a credencial dependem dos índices dessa constante; qualquer correção lá se propaga.
- **Contraste e tema escuro** da credencial e da listra: validar nos dois temas.
- **`PRODUCT.md`** ainda cita adesão em 2 etapas e marca greenfield; defasado, fora do escopo desta feature.
- **Métricas de conclusão/abandono** do PRD exigem instrumentação que não existe no projeto; ver "Fora de escopo técnico".

## Estratégia de testes (Vitest + Testing Library)
- Unitários: `credencial.ts`, `horarios.ts`, `adesaoErrors.ts` (todos os casos, inclusive campo vazio e erro sem correspondência).
- Componentes: `CredencialEmpresa` (vazio × preenchido × dia 24h/fechado), `AtalhosHorario` (`aria-pressed`, aplica preset), `ConferirStep` (seções, senha mascarada, "Editar"), `ActionBar`, `Stepper` (novas props e regressão).
- Integração: `OnboardingWizard.test.tsx` cobre: fluxo feliz de 4 etapas com envio e redirecionamento; avanço bloqueado com foco no primeiro inválido e "Faltam N campos"; voltar sem perder dados; envio com botões desabilitados (sem duplicidade); erro de CNPJ duplicado leva à etapa 1 mantendo o preenchimento; falha de rede com nova tentativa.
- Verificação manual em 320, 390, 768, 1024 e 1440px, tema claro e escuro, teclado, leitor de tela e `prefers-reduced-motion`. Antes de finalizar: `npm run lint` e `npm run build`.

## Fora de escopo técnico
- Mudança no contrato `POST /Adesao`, nos schemas Zod ou nos tipos de `src/types/adesao.ts`.
- Salvamento de rascunho entre sessões e consulta externa de CNPJ.
- Instrumentação de analytics para taxa de conclusão/abandono (as métricas do PRD precisam de uma feature própria de medição).
- Mapeamento de erros do backend por código (aguarda o formato do contrato).
- Atualização de `PRODUCT.md` e de `DESIGN.md`/documentação de marca.
- Bottom sheet genérico para a credencial no celular.
