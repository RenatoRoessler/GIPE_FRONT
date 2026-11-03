# Tech Spec: Teste Grátis na Adesão

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só resume e aponta para ele)
- Site (origem do parâmetro): `C:\murel\murel-site\docs\specs\teste-gratis\{prd,techspec}.md`. Todas as chamadas do teste abrem `/adesao?tipoPlanoAdesao=0`.
- Fluxo de planos já implementado: `docs/specs/planos-adesao/{prd,design,techspec}.md`
- Next `16.4.3`. Conforme `AGENTS.md`, ler o guia de `useSearchParams` em `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md` antes de mexer na leitura da URL. Nada muda no `Suspense` de `src/app/adesao/page.tsx`, que já existe.

## Estado atual do repositório
- `lerPlanoDaUrl` (`src/lib/planos.ts`) aceita só `"1"` a `"4"`; `"0"` devolve `undefined` e a adesão abre sem plano. É isso que faz o teste grátis virar fluxo pago hoje.
- `useAdesaoWizard.ts` controla `etapa: Etapa` (1 a 5, constantes em `etapas.ts`: Empresa 1, Horários 2, Titular 3, Plano 4, Conferir 5) e o plano em `useState<PlanoVendido | undefined>`. `proximaEtapa`, `voltar` e `irParaEtapa` somam e subtraem 1; `etapas` é a lista fixa de cinco nomes (`ETAPAS`).
- `OnboardingWizard.tsx`: `ultima = etapa === etapas.length`, `proximaEtapa = etapas[etapa]` e `etapaAtual={etapa}` assumem que o número da etapa e a posição no `Stepper` são o mesmo valor. Com quatro etapas visíveis isso deixa de valer.
- `AdesaoShell` mostra `Etapa {etapaAtual} de {etapas.length}` e entrega ao `Stepper` `steps={etapas}` e `currentStep={etapaAtual}`; o `Stepper` devolve em `onStepClick` a posição clicada.
- `AdesaoInput.plano` e `AdesaoPayload.tipoPlanoAdesao` são `PlanoVendido` (1 a 4). `planoSchema` rejeitava `0` (hoje aceita 0 a 4: a etapa Plano oferece o teste grátis).
- `ConferirStep` exige `plano: PlanoVendido` e sempre desenha o bloco "Plano" com valor e total. `buildCredencial` só descreve `PlanoVendido`.
- `LoginForm` mostra "Cadastro concluído! Faça login para continuar." para `?cadastro=sucesso`.
- `TipoPlanoAdesao.Trial = 0` já existe em `src/types/plano.ts`.

## Design
Decisões visuais em `./design.md`. Resumo do que a implementação precisa:
- **Telas/estados:** fluxo de quatro etapas (Empresa, Horários, Titular, Conferir); bloco "Teste grátis por 30 dias" no lugar do bloco "Plano" na Conferir; linha "Plano: Teste grátis · 30 dias" na credencial desde a primeira etapa.
- **Reaproveitados:** `AdesaoShell`, `Stepper`, `Button`, `ErrorBanner`, `CredencialEmpresa`, e na `ConferirStep` os estilos `Secoes`, `Secao`, `SecaoCabecalho`, `SecaoTitulo`, `Lista`, `Termo`, `Detalhe`.
- **Novo:** `ResumoTeste`, interno ao `ConferirStep` (sem pasta própria, não vai para `ui` enquanto só existir ali), com estilos novos em `ConferirStep.styles.ts`.
- **Tokens:** nenhum novo. `colors.primary`, `colors.primarySoft`, `colors.success`, `colors.textMuted`, `radii.lg`, `space`, `fontSizes.sm`, `fontSizes.md`, `fontWeights`. Conferir o contraste sobre `primarySoft` nos dois temas.

## Arquitetura da solução

### Modo da adesão
O modo é decidido uma vez, na abertura, e não tem setter. Isso cumpre RF1 e a parte de RF7 que impede trocar de modo no meio do fluxo.

```ts
// src/lib/planos.ts
// Só o texto exato "0" abre o teste grátis; qualquer outra coisa segue a regra de lerPlanoDaUrl.
export function ehTesteGratisNaUrl(valor: string | null): boolean {
  return valor === "0";
}
```
`lerPlanoDaUrl` não muda: continua devolvendo `undefined` para `"0"`. Quem decide o modo é `ehTesteGratisNaUrl`, e os dois nunca são verdadeiros ao mesmo tempo (`"0"` não casa com `/^[1-4]$/`).

```ts
// src/components/adesao/etapas.ts
export const MODO_ADESAO = { Plano: "plano", Teste: "teste" } as const;
export type ModoAdesao = (typeof MODO_ADESAO)[keyof typeof MODO_ADESAO];

export const NOMES_ETAPAS = ["Empresa", "Horários", "Titular", "Plano", "Conferir"] as const;

// No teste grátis a etapa Plano não existe: nem no Stepper, nem na navegação.
export function etapasDoModo(modo: ModoAdesao): string[];
export function posicaoDaEtapa(etapa: Etapa, modo: ModoAdesao): number;   // 1..4 no teste, 1..5 no pago
export function etapaDaPosicao(posicao: number, modo: ModoAdesao): Etapa; // inverso, para o clique no Stepper
export function proximaEtapa(etapa: Etapa, modo: ModoAdesao): Etapa;      // Titular -> Conferir no teste
export function etapaAnterior(etapa: Etapa, modo: ModoAdesao): Etapa;     // Conferir -> Titular no teste
```
- `ETAPA` não muda (posições fixas, Plano continua 4 e Conferir 5). Só o que o usuário vê é remapeado: o número de etapa interno segue igual, o `Stepper` e o texto "Etapa N de M" usam `posicaoDaEtapa` e `etapasDoModo`. É a resposta do design à pergunta "como mapear sem quebrar as posições fixas de `ETAPA`".
- As funções são puras e testáveis sem React. `proximaEtapa` e `etapaAnterior` saem do hook (hoje `proximaEtapa` é local de `useAdesaoWizard.ts`) e passam a viver aqui.
- `ETAPAS` exportada pelo hook continua existindo (lista do fluxo pago) para não quebrar quem a importa; o hook usa `etapasDoModo(modo)` internamente.

### Arquivos
```
src/
  lib/
    planos.ts                                  # + ehTesteGratisNaUrl; descricaoDoTeste
    planos.test.ts
    api/services/adesao.mapper.ts              # AdesaoInput.plano e AdesaoPayload.tipoPlanoAdesao aceitam Trial
    api/services/adesao.mapper.test.ts
  components/adesao/
    etapas.ts                                  # + modo, nomes, mapeamento posição <-> etapa
    etapas.test.ts                             # novo
    useAdesaoWizard.ts                         # lê o modo; navegação por modo; envia Trial; devolve modo e posição
    credencial.ts                              # buildCredencial aceita Trial
    credencial.test.ts
    ConferirStep/ConferirStep.tsx              # plano: TipoPlanoAdesao; ResumoTeste
    ConferirStep/ConferirStep.styles.ts        # + SecaoTeste, Garantias, Garantia
    ConferirStep/ConferirStep.test.tsx
    OnboardingWizard/OnboardingWizard.tsx      # ultima por ETAPA.Conferir; posição no Shell; plano a conferir por modo
    OnboardingWizard/OnboardingWizard.test.tsx
```
`CredencialEmpresa`, `AdesaoShell`, `Stepper`, `PlanoStepFields`, `OptionGroup`, `planoSchema` e `adesaoErrors` **não mudam**. `AdesaoShell` já aceita `etapas` e `etapaAtual` como props, e `AlvoErro.etapa` (Empresa e Titular) continua válido porque os números internos não mudam.

### Tipos e contrato com o backend
```ts
// adesao.mapper.ts
export interface AdesaoPayload {
  tipoPlanoAdesao: TipoPlanoAdesao; // 0 = Trial, 1..4 = planos pagos
  ...
}
export interface AdesaoInput {
  plano: TipoPlanoAdesao;
  ...
}
```
- `toAdesaoPayload` continua copiando `plano` para `tipoPlanoAdesao`, na raiz do corpo (a assunção de `planos-adesao` vale; o campo `tipoPlanoAdesao` é o mesmo, só ganha o valor `0`). Nada mais muda no payload, e **nenhum dado de cobrança é enviado** (RF5).
- `planoSchema` aceita 0 a 4: a etapa Plano oferece "Teste grátis" como primeira opção (`PlanoStepFields`, valor `0`, sem preço). Quem escolhe o teste ali mantém as cinco etapas, vê o resumo do teste na conferência **com** "Editar Plano" (`planoEditavel`) e envia `0`. Só o teste vindo do site (`?tipoPlanoAdesao=0`) esconde a etapa Plano e não tem "Editar".
- Garantia dos dois sentidos de RF7, no próprio hook (ver abaixo): no teste, `plano` nunca é lido para o envio; no pago, chega a `saveAdesao` o que a pessoa escolheu na etapa Plano (0 a 4), nunca outro valor.

### Hook `useAdesaoWizard`
```ts
const searchParams = useSearchParams();
const parametro = searchParams.get(PARAMETRO_PLANO);
// Decidido na abertura; não há setter, então o modo não muda no meio do fluxo.
const [modo] = useState<ModoAdesao>(() => (ehTesteGratisNaUrl(parametro) ? MODO_ADESAO.Teste : MODO_ADESAO.Plano));
const [plano, setPlano] = useState<PlanoVendido | undefined>(() => lerPlanoDaUrl(parametro));
```
- **Navegação:** `avancar` usa `proximaEtapa(atual, modo)`; `voltar` usa `etapaAnterior(atual, modo)`; `irParaEtapa(posicao)` converte com `etapaDaPosicao(posicao, modo)` antes de comparar com `etapa`. No teste, a etapa Plano não é alcançável por nenhum caminho (botão, Stepper, "Editar" ou `corrigir`).
- **`validarEtapa`:** o ramo `ETAPA.Plano` nunca roda no teste (a etapa não é exibida). Sem mudança nele.
- **`enviar`:** 
  ```ts
  const planoEnviado = modo === MODO_ADESAO.Teste ? TipoPlanoAdesao.Trial : plano;
  if (planoEnviado === undefined) { editar(ETAPA.Plano); return; } // só no pago, sem plano escolhido
  await mutation.mutateAsync({ plano: planoEnviado, company, hours, payments, adminUser });
  ```
- **`credencial`:** `buildCredencial({ company, hours, payments, plano: planoEnviado })`, onde `planoEnviado` é a mesma expressão acima (extraída para um `const` único usado na credencial e no envio, para os dois nunca divergirem). No teste, a credencial já mostra o plano desde a primeira etapa.
- **Retorno do hook:** devolve `modo`, `etapas: etapasDoModo(modo)` e `posicao: posicaoDaEtapa(etapa, modo)`, além de `etapa` (interna). `dados.plano` segue sendo o `PlanoVendido` escolhido (fica `undefined` no teste).
- O efeito de foco no título compara a etapa anterior com a atual (interna) e segue valendo no teste: a troca Titular -> Conferir muda `etapa`.
- `mutation.onSuccess` mantém `router.push("/login?cadastro=sucesso")`. Sobre RF9 ver "Mensagem do login".

### `OnboardingWizard`
- `ultima = etapa === ETAPA.Conferir` (no lugar de `etapa === etapas.length`, que daria `5 === 4` no teste).
- `rotuloPrincipal`: o nome da próxima etapa vem de `etapas[posicao]` (posição 1-based da etapa atual = índice da próxima), no lugar de `etapas[etapa]`. No teste, na etapa Titular (posição 3), o rótulo é "Próximo: Conferir" (design).
- `AdesaoShell` recebe `etapas={wizard.etapas}`, `etapaAtual={wizard.posicao}` e `onEtapaClick={wizard.irParaEtapa}`. `TITULOS` e `DESCRICOES` seguem indexados pela etapa interna (`etapa - 1`), sem mudança de conteúdo.
- Conferir: `const planoConferido = modo === Teste ? TipoPlanoAdesao.Trial : dados.plano;` e `ConferirStep` só renderiza se `planoConferido !== undefined`, no lugar da checagem atual `dados.plano !== undefined`.

### `ConferirStep` e `ResumoTeste`
- `plano` da prop passa de `PlanoVendido` para `TipoPlanoAdesao`.
- Ramo no fim do componente:
  ```tsx
  {plano === TipoPlanoAdesao.Trial
    ? <ResumoTeste />
    : <Bloco titulo="Plano" onEditar={() => onEditar(ETAPA.Plano)}>...</Bloco>}
  ```
  `buscarPlano(plano)` só é chamado no ramo pago (`plano` é `PlanoVendido` ali; o estreitamento vem da comparação com `Trial`).
- `ResumoTeste` é um componente local ao arquivo, fora do corpo de `ConferirStep` (regra de não declarar componentes em render):
  - `<SecaoTeste aria-label="Teste grátis por 30 dias">` com `SecaoCabecalho` > `SecaoTitulo` "Teste grátis por 30 dias". **Sem botão "Editar"**, logo não é um `Bloco`.
  - Frase (`fontSizes.sm`): "Use o sistema completo por 30 dias. No fim do teste, você escolhe o plano que fizer mais sentido."
  - `<Garantias as="ul">` com três `<Garantia as="li">`: "Todas as funcionalidades", "Sem cartão de crédito", "Sem compromisso". O texto das garantias sai de uma constante do arquivo (`GARANTIAS_DO_TESTE`) para a lista e o teste usarem a mesma fonte. Check em SVG de traço, 14px, `aria-hidden`, `colors.success`, o mesmo de `PlanoStepFields`.
  - Se o mesmo SVG aparecer em três lugares (`PlanoStepFields`, `ConferirStep` e um terceiro), extrair para `ui`; com dois, fica duplicado e comentado (design.md).
- `ConferirStep.styles.ts`:
  - `SecaoTeste = styled(Secao)` com `border-color: colors.primary` e `background-color: colors.primarySoft`.
  - `Garantias` (`ul` sem marcadores, `display: flex; flex-direction: column`; a partir de `breakpoints.sm`, `flex-direction: row; flex-wrap: wrap`, `gap` do tema) e `Garantia` (`li` com `min-height: layout.touchTarget`, check à esquerda, `fontSizes.sm`). O alvo de 44 px abaixo de `sm` sai de `layout.touchTarget`, o mesmo token do botão "Editar".
  - Nada de cor fixa, nenhum valor visual fora do tema.

### Credencial
- `buildCredencial` aceita `plano?: TipoPlanoAdesao`. `descricaoDoPlano(Trial)` devolve `"Teste grátis · 30 dias"`; os quatro planos pagos seguem como hoje. O texto do teste mora em `lib/planos.ts` (`descricaoDoTeste`), junto das demais descrições, e `credencial.ts` o importa.
- `CredencialEmpresa` já mostra `Plano: {plano ?? "—"}`, então "Plano: Teste grátis · 30 dias" aparece sem tocar no componente.

### Mensagem do login (RF9, `[A CONFIRMAR]`)
- **Padrão desta entrega:** manter `/login?cadastro=sucesso` e a mensagem atual. É o comportamento "como hoje" do RF9 e não exige decisão do negócio.
- **Se o negócio quiser a mensagem do teste:** mudança pequena e isolada. `useAdesaoWizard` empurra `/login?cadastro=teste` quando `modo === Teste`; `LoginForm` ganha `cadastro: { sucesso: "...", teste: "Cadastro concluído! Seu teste de 30 dias começou. Faça login para continuar." }` em `NOTICES`; o teste do wizard troca a URL esperada. Não é feito agora para não escrever um texto que o backend ainda não garante.

### Server vs Client
| Peça | Tipo | Motivo |
|---|---|---|
| `app/adesao/page.tsx` | Server | só `metadata` e `Suspense`, sem mudança |
| `OnboardingWizard`, `ConferirStep`, `useAdesaoWizard` | Client | já são: estado, formulário, `useSearchParams` |
| `ResumoTeste` | Client (herda de `ConferirStep`) | usa `styled-components`, mora no mesmo arquivo |
| `etapas.ts`, `lib/planos.ts` | puros | sem dependência de React |

## Decisões técnicas e trade-offs
1. **Número de etapa interno fixo, posição exibida derivada.** Manter `ETAPA` (Plano 4, Conferir 5) evita reescrever `AlvoErro`, `editar`, `corrigir` e os índices de `TITULOS`/`DESCRICOES`. O custo é um par de funções de mapeamento em `etapas.ts`. A alternativa, uma tabela de etapas por modo com números diferentes, mexeria em todos esses pontos e em `adesaoErrors.ts` por um ganho só de leitura.
2. **Modo como `useState` sem setter, não derivado da URL a cada render.** O parâmetro só vale na abertura (mesmo princípio de `planos-adesao`), então o modo não muda se a URL mudar e não existe caminho de troca no fluxo (PRD, fora de escopo).
3. **Trial pelo mesmo `plano`/`AdesaoInput`, não um campo `teste: boolean` à parte.** O contrato do backend já é `tipoPlanoAdesao`; um único número no payload representa os dois modos e não cria um segundo caminho de envio. A distinção entre "pago exige 1..4" e "teste envia 0" fica no hook e em `planoSchema`.
4. **`planoSchema` aceita 0.** Decisão posterior: a etapa Plano passou a oferecer o teste grátis. O envio de `0` deixou de ser um erro do fluxo pago e passou a ser uma escolha explícita na tela.
5. **`ResumoTeste` dentro de `ConferirStep`, não em `ui`.** Existe um único uso, e o conteúdo é específico desta conferência.
6. **Sem componente novo de etapa nem rota nova.** `/adesao?tipoPlanoAdesao=0` é a mesma rota; o resto é ramificação de dados no fluxo existente.
7. **Mensagem de login fica como hoje** até o negócio confirmar o texto, porque a promessa "teste de 30 dias começou" depende de o backend aplicar o período (ver riscos).

## Riscos / pontos de atenção
- **O backend aceita `tipoPlanoAdesao=0` neste fluxo?** `planos-adesao` diz que o campo existe, mas não foi confirmado que o cadastro com Trial funciona sem dado de cobrança e que a empresa recebe os 30 dias. **Confirmar com o backend antes de publicar**: se recusar `0`, o botão "Criar conta" do teste falha e o site promete "sem cartão" para um fluxo quebrado.
- **Posição do campo `tipoPlanoAdesao` no JSON** segue a assunção da raiz (herdada). Se estiver em `empresa`, é uma linha em `toAdesaoPayload`.
- **Regras do teste sem fonte** (sem cobrança automática, pausa do acesso, retenção de 30 dias, conversão): a adesão só afirma as três garantias e o aviso de escolha do plano ao fim. Nenhum texto do modo teste cita retenção de dados (design e PRD).
- **Sem fluxo de assinatura depois do teste.** Quem terminar os 30 dias não tem tela para escolher plano. Fora do escopo, mas precisa de PRD próprio antes de o primeiro teste expirar.
- **`etapa === etapas.length` e `etapas[etapa]`** são os dois pontos do `OnboardingWizard` que quebram em silêncio se esquecidos: no teste a conferência nunca seria "última" e o rótulo do botão ficaria `Próximo: undefined`. Cobertos por teste do wizard.
- **Stepper por posição.** O clique no `Stepper` chega como posição (1 a 4); sem `etapaDaPosicao`, clicar em "Conferir" já concluído levaria à etapa Plano. Coberto em `etapas.test.ts` e no teste do wizard.
- **Contraste** do texto sobre `primarySoft` e do check (`success`) nos dois temas; verificar na QA.
- **Garantias empilhadas em 360 px:** cada item com ao menos 44 px de altura útil, sem rolagem horizontal.
- **Valores digitados à mão:** `?tipoPlanoAdesao=0` digitado por uma pessoa também abre o teste. Aceito (PRD): não há como distinguir dos cliques do site.
- **Mocks de teste:** o wizard já mocka `useSearchParams` com `consulta.atual`; os novos casos só trocam o valor da consulta.

## Testes (Vitest + Testing Library)
- `lib/planos.test.ts`: `ehTesteGratisNaUrl` verdadeiro só para `"0"`; falso para `null`, `""`, `"1"`, `"00"`, `"abc"`; `lerPlanoDaUrl("0")` continua `undefined`; `descricaoDoTeste()` = "Teste grátis · 30 dias".
- `etapas.test.ts`: `etapasDoModo(teste)` = Empresa, Horários, Titular, Conferir; `etapasDoModo(plano)` mantém as cinco; `posicaoDaEtapa(Conferir, teste)` = 4 e `(Conferir, plano)` = 5; `etapaDaPosicao(4, teste)` = Conferir; `proximaEtapa(Titular, teste)` = Conferir e `(Titular, plano)` = Plano; `etapaAnterior(Conferir, teste)` = Titular e `(Conferir, plano)` = Plano; a etapa Plano nunca é devolvida no teste.
- `adesao.mapper.test.ts`: `tipoPlanoAdesao` = 0 para Trial, mantendo 1 a 4 para os pagos; o payload do teste não traz nenhuma chave de cobrança.
- `credencial.test.ts`: Trial gera `plano` = "Teste grátis · 30 dias"; sem plano segue `undefined`.
- `ConferirStep.test.tsx`: com `Trial` mostra a seção "Teste grátis por 30 dias" (por `aria-label`), a frase, as três garantias numa lista, **sem** "Editar Teste grátis", sem "Valor por mês", sem "Total" e sem `R$`; com plano pago o bloco "Plano" não muda e "Editar Plano" chama `onEditar(ETAPA.Plano)`.
- `OnboardingWizard.test.tsx` (ampliar), com `consulta.atual = "tipoPlanoAdesao=0"`:
  - o `Stepper` mostra Empresa, Horários, Titular, Conferir (4 itens, sem "Plano") e o texto "Etapa 1 de 4";
  - da etapa Titular, o botão é "Próximo: Conferir" e leva à Conferir sem passar pela etapa Plano; "Etapa 4 de 4 · Conferir";
  - nenhuma tela do fluxo mostra `R$`, "plano" como escolha ou "cartão" como exigência (o texto "Sem cartão de crédito" é permitido);
  - na Conferir aparece "Teste grátis por 30 dias" e o botão é "Criar conta";
  - **payload:** `saveAdesao` é chamado com `plano: 0`;
  - "Voltar" da Conferir volta ao Titular; voltar e avançar mantém os dados e o modo;
  - clicar em um passo já concluído do `Stepper` vai para a etapa certa (por exemplo "Titular", posição 3, vai à etapa Titular);
  - o foco vai para o título ao trocar de etapa;
  - credencial: "Plano: Teste grátis · 30 dias" desde a etapa 1;
  - sucesso leva a `/login?cadastro=sucesso`.
- `OnboardingWizard.test.tsx`, regressão do fluxo pago: `tipoPlanoAdesao=1..4` continua com cinco etapas, plano pré-selecionado e `saveAdesao` com o plano certo; ausente, `9` e `abc` abrem sem plano e sem erro, com a etapa Plano obrigatória; `saveAdesao` nunca recebe `0` fora do modo teste.
- Verificação final: `npm run lint`, `npm run build`, conferência manual em 360 px e desktop, nos dois temas (sem rolagem horizontal, foco visível, só teclado), e um cadastro real de teste contra o backend, conferindo que a empresa nasce com Trial e que o titular consegue entrar pelo login.

## Fora de escopo técnico
- Mudanças no site (`murel-site`): o envio de `tipoPlanoAdesao=0` já é dele.
- Backend: período de teste, pausa, retenção, conversão e e-mails de lembrete.
- Tela ou fluxo para o cliente em teste escolher plano e assinar depois do cadastro.
- Mostrar o tempo restante do teste em outras telas.
- Cobrança, cartão ou contratação na adesão.
- Trocar de modo (teste para pago, ou o inverso) dentro do fluxo; reescrever a URL.
- Prorrogação, prazo diferente de 30 dias ou teste por tipo de operação.
- Medição de cliques, analytics e as métricas do PRD (seguem `[A DEFINIR]`).
- Mensagem própria no login para o teste (RF9), enquanto o texto não for confirmado.
