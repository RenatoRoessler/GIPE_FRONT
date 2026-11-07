# Tech Spec: Planos vindos do Back-end na Adesão

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e fecha o que ficou em aberto)
- Referência do site: `C:\murel\murel-site\docs\specs\planos-do-backend\` (mesmo endpoint, mesma regra de promoção)

## Design
- **Telas/estados:** etapa Plano com quatro estados (carregando, lista, pré-selecionado, erro ao carregar) mais o erro de "escolha um plano" que já existe; bloco **Plano** da Conferir; linha Plano da credencial. Detalhe em `design.md`.
- **Componentes do design system reaproveitados:** `OptionGroup` (variante `card`), `Skeleton`, `ErrorBanner`, `Button`, `ActionBar`, `Stepper`, `CredencialEmpresa`.
- **Componentes novos:** nenhum no design system. Dentro de `src/components/adesao/PlanoStepFields/`: `PlanosCarregando` e `PlanosErro` (específicos da etapa, não vão para `ui`).
- **Evolução em `ui`:** `OptionGroup` ganha `ariaLabel?: string` por opção (nome acessível completo do cartão, usado no "de R$ 99,90 por R$ 69,90").
- **Tokens:** nenhum novo. Os mesmos de hoje (`textMuted` no riscado, `primary`/`onPrimary` no selo, `accent` na borda do cartão com selo).
- **Decisões que `design.md` deixou em aberto, fechadas aqui:**
  - Nome acessível: `ariaLabel` por opção no `OptionGroup` (e não texto visualmente oculto), aplicado ao `input` de rádio.
  - Nome vindo em caixa alta ("MENSAL"): normalizado no mapeamento para "primeira letra maiúscula, resto minúsculo" ("Mensal", "Teste gratuito").
  - Teste grátis sem a lista (ver "Modo teste" abaixo): não bloqueia; mostra "Teste grátis" sem duração.

## Arquitetura da solução

### Fluxo de dados
```
GET /api/v1/Plano ──► services/plano.ts (valida com zod, descarta item inválido, ordena)
                  ──► plano.mapper.ts (DTO → PlanoAdesao, centavos inteiros)
                  ──► usePlanos() (useQuery, cache 5 min)
                  ──► useAdesaoWizard (resolve seleção, envia tipo)
                  ──► OnboardingWizard ► PlanoStepFields / ConferirStep / credencial
```
Tudo é Client Component (já é, por causa do wizard e do `useSearchParams`). `app/adesao/page.tsx` não muda: continua Server Component com `Suspense`. Nada aqui usa API específica do Next; o fetch é no cliente, via `api` (axios) e TanStack Query, como os demais serviços.

### Tipos (`src/types/plano.ts`)
Substitui `Plano`/`PlanoVendido` (tabela fixa). `AreaDoSistema` fica.
```ts
// Valores do contrato com o backend que o sistema trata de forma especial.
export enum TipoPlanoAdesao { Trial = 0, Mensal = 1, Trimestral = 2, Semestral = 3, Anual = 4 }

export interface PlanoAdesao {
  id: number;                // planoAdesaoId
  tipo: number;              // tipoPeriodoPlano: é o que vai em `tipoPlanoAdesao` no cadastro
  nome: string;              // já normalizado ("Mensal")
  meses: number;             // validadeDuracaoMeses
  centavosTabela: number;    // valor
  centavosAtual: number;     // valorAtual
  emPromocao: boolean;
  promocaoAte?: string;      // "AAAA-MM-DD", só a data de promocaoFim
}
```
- `tipo` passa a `number`: o endpoint pode devolver períodos além de `0` e `1` (RF1). O enum só nomeia o que o código usa de forma explícita (`Trial`).
- Onde hoje se lê `TipoPlanoAdesao` como tipo de valor (`adesao.mapper.ts`, `credencial.ts`, `ConferirStep`, `PlanoStepFields`, `useAdesaoWizard`, `OnboardingWizard`), trocar para `number`.

### Contrato e mapeamento
- **`src/lib/api/services/plano.ts`** (novo): `listPlanos(signal)` faz `api.get("/Plano", { signal })` (a `baseURL` já inclui `/api/v1`, como nos outros serviços). Valida a resposta com zod; **item que não passa na validação é descartado**, não derruba a lista. Ordena por `ordemExibicao`. Se sobrar lista vazia, lança `ApiError("unknown")` para cair no estado de erro (RF11).
- **`src/lib/api/services/plano.mapper.ts`** (novo): `fromPlanoResponse(dto): PlanoAdesao`.
  - `centavosTabela = Math.round(valor * 100)`, `centavosAtual = Math.round(valorAtual * 100)`: sem ponto flutuante na exibição (RF6).
  - `emPromocao = dto.emPromocao && centavosAtual < centavosTabela`. Protege contra dado incoerente (riscado menor que o atual).
  - `promocaoAte`: os 10 primeiros caracteres de `promocaoFim` quando não nulo (`"2027-06-30T00:00:00"` → `"2027-06-30"`). **Sem `new Date()`**, para o fuso do navegador nunca mudar o dia (resolve o ponto de "Datas e fuso" do PRD: o dia é o que o back-end informa).
  - `nome`: minúsculas com a primeira letra maiúscula.
  - `diferencaPercentual`, `promocaoInicio` e `valorPromocional` não entram no domínio (PRD: fora de escopo; `valorAtual` já traz o preço vigente).
- **Decisão:** o cliente **não** confere `promocaoInicio`/`promocaoFim` contra a data atual. Quem diz se a promoção vale é o back-end (`emPromocao` + `valorAtual`). Isso evita divergir do que o site e o back-end mostram e dispensa relógio do cliente.

### Consulta (`src/components/adesao/usePlanos.ts`, novo)
```ts
useQuery({
  queryKey: ["planos"],
  queryFn: ({ signal }) => listPlanos(signal),
  staleTime: 5 * 60_000,
  refetchOnWindowFocus: false,
  retry: 1,
});
```
- `staleTime` de 5 minutos, igual à proposta do site. `refetchOnWindowFocus: false` evita o preço mudar sob o usuário no meio do cadastro.
- `retry: 1` (o padrão do projeto são 3 tentativas com espera crescente): o usuário está olhando a tela de carregamento; falhar rápido para o estado de erro vale mais que insistir.
- Chave `["planos"]` exportada como constante, no padrão de `conveniadasKeys.ts`.
- O tempo máximo da chamada é o `TIMEOUT_MS` do `api` (RF11, "demorar demais"). Sem timeout próprio.
- **Prefetch:** `useAdesaoWizard` chama `usePlanos()` na abertura da adesão, então a lista já está carregando durante as etapas 1 a 3. Quando o usuário chega ao Plano, normalmente já está pronta e o esqueleto raramente aparece.

### Regras de apresentação (`src/lib/planos.ts`, reescrito)
Sai: `PLANO_MENSAL`, `PLANOS`, `FIM_DO_LANCAMENTO`, `ROTULO_FIM_DO_LANCAMENTO`, `lancamentoVigente`, `valorPorMes`. Fica `formatarReais` (centavos). Funções puras, testáveis:
- `formatarDataPromocao(promocaoAte: string): string` → `"30/06/2027"` (corta e inverte a string, sem `Date`).
- `descreverDuracao(meses: number): string` → `"1 mês"`, `"2 meses"`.
- `descreverCondicao(plano): string`:
  - em promoção com data: `"R$ 69,90/mês até 30/06/2027; depois, R$ 99,90/mês."`
  - em promoção sem data: `"R$ 69,90/mês em promoção."`
  - sem promoção: `"Cobrado todo mês"`.
- `rotuloDoSelo(plano): string | undefined` → `"Promoção até 30/06/2027"`, `"Promoção"` ou `undefined`.
- `descreverParaLeitor(plano): string` → nome acessível do cartão ("Mensal, de R$ 99,90 por R$ 69,90 por mês, promoção até 30/06/2027").
- `descricaoNaCredencial(plano?: PlanoAdesao, tipo?: number): string | undefined` → `"Mensal · R$ 69,90/mês"`; teste: `"Teste grátis · 1 mês"`, ou só `"Teste grátis"` sem dados.
- `lerPlanoDaUrl(valor: string | null): number | undefined`: aceita só inteiro positivo em texto (`/^[1-9]\d*$/`); o resto vira `undefined`, sem erro. A existência do plano na lista é verificada depois, na resolução da seleção.
- `ehTesteGratisNaUrl(valor)`: igual a hoje (`"0"`).
- `planoDoTipo(planos, tipo): PlanoAdesao | undefined`.
- Em `descreverCondicao`, `centavosTabela` aparece como "depois, R$ X/mês" sem checar mais nada: se `emPromocao` é verdadeiro, o preço depois da promoção é o de tabela.

### Seleção e wizard (`useAdesaoWizard.ts`)
- `const consulta = usePlanos()`; `planos = consulta.data`.
- Estado `plano` continua `number | undefined`, inicializado por `lerPlanoDaUrl(parametroPlano)` (valor cru da URL, pode ainda não existir na lista).
- **Seleção efetiva:** `planoSelecionado = planoDoTipo(planos, plano)`. Se `plano` não existir na lista, vale `undefined`: o cartão não aparece marcado e "Próximo" falha com "Escolha um plano para continuar." (cobre RF8 sem efeito colateral e sem aviso extra). Ao carregar a lista, a pré-seleção aparece sem nenhum `useEffect` de sincronização (é derivada no render).
- `planoEnviado`: `modo === Teste ? TipoPlanoAdesao.Trial : planoSelecionado?.tipo`. É o `tipoPeriodoPlano` do plano escolhido (RF7).
- `validarEtapa` (etapa Plano): falha com a mensagem existente se não há `planoSelecionado`; se `consulta.status !== "success"`, retorna `false` sem mensagem de campo (o estado de erro/carregamento da etapa já explica).
- `planoSchema` vira fábrica: `criarPlanoSchema(tiposValidos: number[])`, que valida `plano` como um dos tipos carregados, com `PLANO_OBRIGATORIO_MESSAGE`. Substitui o refine fixo em `Trial | Mensal`. `PlanoValues` continua.
- `enviar()`: igual a hoje (sem `planoEnviado`, volta à etapa Plano). Garante que um plano que sumiu da lista depois de um refetch não é enviado.
- O hook passa a devolver `planos: { status, dados, refazer, refazendo }` (ou `consulta` inteira, a definir na implementação), mais `planoEscolhido?: PlanoAdesao` e `planoTeste?: PlanoAdesao` (o item de `tipo === Trial`, para a duração).
- **Modo teste (URL `?tipoPlanoAdesao=0`):** a etapa Plano não existe, então a lista é consultada só para obter a duração. **A falha dessa consulta não bloqueia o cadastro.** O texto cai para "Teste grátis" sem número; nenhum prazo local é inventado. O envio continua com `Trial` (valor `0` do contrato).

### Componentes
- **`PlanoStepFields`** (reescrito): props `{ consulta: { status, planos?, onRetry, refazendo }, plano?: number, onChange, error? }`.
  - `status === "pending"` → `PlanosCarregando`.
  - `status === "error"` → `PlanosErro`.
  - `status === "success"` → `OptionGroup variant="card"` montado a partir de `planos`, na ordem recebida. Cada opção:
    - `label`: `plano.nome`.
    - `ariaLabel`: `descreverParaLeitor(plano)`.
    - `aside`: `<ValorAtual>` com `/mês`; em promoção, antes dele `<PrecoRiscado aria-hidden>` com `formatarReais(centavosTabela)`. Trial: `<Valor>{descreverDuracao(meses)}</Valor>` sem "/mês".
    - `detail`: `descreverCondicao(plano)`; Trial: texto fixo "Todas as funcionalidades, sem cartão de crédito e sem compromisso." (RF12: texto da marca).
    - `badge`: `rotuloDoSelo(plano)`.
  - A lista "Tudo isso incluso no plano" (`AREAS_DO_SISTEMA`) fica em todos os estados.
  - Trial ainda é opção da etapa (como hoje); a decisão do PRD antigo de não oferecer Trial foi superada pelo teste grátis.
- **`PlanosCarregando`**: `role="status"`, texto oculto "Carregando planos", duas cartas de `Skeleton` com a mesma grade e altura mínima do cartão em promoção. `PLANOS_ESPERADOS = 2` como dica de layout (não é dado de negócio; se vierem mais, o conteúdo se acomoda sem salto relevante).
- **`PlanosErro`**: `ErrorBanner role="alert"` com "Não conseguimos carregar os planos" + frase de apoio + `Button variant="secondary"` "Tentar de novo". Em TanStack v5 a consulta com erro continua em `status: "error"` enquanto refaz (`fetchStatus: "fetching"`); portanto o bloco **não desmonta** durante a nova tentativa, o foco fica no botão, o rótulo muda para "Tentando de novo…" e recebe `aria-busy`. Sem o esqueleto no meio (design: foco não se perde).
- **`OnboardingWizard`**: monta `PlanoStepFields` com a consulta; `Button` principal `disabled={enviando || (etapa === ETAPA.Plano && planos.status !== "success")}` (RF11); passa `planoEscolhido` e `planoTeste` ao `ConferirStep`. `planoConferido` continua distinguindo teste de plano.
- **`ConferirStep`**: troca `plano: TipoPlanoAdesao` por `plano: number` e recebe `dadosDoPlano?: PlanoAdesao` e `planoTeste?: PlanoAdesao`. Bloco **Plano** com as linhas `Plano` (nome), `Valor por mês` (valor atual; em promoção, `<s aria-hidden>` do tabela + texto de leitor) e `Condição` (`descreverCondicao`). `ResumoTeste` recebe a duração: título `Teste grátis por ${descreverDuracao(meses)}` e frase "Use o sistema completo por 1 mês…" quando há dados; sem dados, "Teste grátis" e "Use o sistema completo durante o teste. No fim, você decide se quer assinar.". Se `plano` for pago e `dadosDoPlano` estiver indefinido (lista sumiu), o bloco não é renderizado e o wizard já impede de chegar aqui (ver `enviar()`).
- **`credencial.ts`**: `buildCredencial` troca `plano?: TipoPlanoAdesao` por `plano?: string` já pronto (`descricaoNaCredencial`), calculado no hook. A credencial deixa de importar `lib/planos`.
- **`OptionGroup`**: `OptionGroupOption.ariaLabel?: string`, repassado a `aria-label` do `RadioInput`. Sem mudança de visual. Teste de unidade para o novo atributo.
- **`adesao.mapper.ts`**: `tipoPlanoAdesao: number` (linhas 17 e 60). Sem outra mudança de payload.

### Arquivos
| Ação | Arquivo |
|------|---------|
| novo | `src/lib/api/services/plano.ts`, `plano.mapper.ts` (+ testes) |
| novo | `src/components/adesao/usePlanos.ts` (+ constante da chave) |
| novo | `src/components/adesao/PlanoStepFields/PlanosCarregando.tsx`, `PlanosErro.tsx` |
| reescrever | `src/lib/planos.ts` (+ `planos.test.ts`), `src/types/plano.ts` |
| alterar | `src/lib/schemas/adesao.ts` (`criarPlanoSchema`), `src/lib/api/services/adesao.mapper.ts` |
| alterar | `src/components/adesao/useAdesaoWizard.ts`, `credencial.ts`, `OnboardingWizard.tsx`, `ConferirStep.tsx`, `PlanoStepFields.tsx` e `.styles.ts` (`PrecoRiscado`, esqueleto) |
| alterar | `src/components/ui/OptionGroup/OptionGroup.tsx` (+ teste) |
| atualizar | testes: `schemas/adesao.test.ts`, `PlanoStepFields.test.tsx`, `ConferirStep.test.tsx`, `credencial.test.ts`, `OnboardingWizard.test.tsx`, `adesao.mapper.test.ts` |

## Decisões e trade-offs
- **`useQuery` + service próprio (e não `fetch` direto, como o ViaCEP).** O endpoint é do nosso back-end e o `api` já resolve base URL, proxy de dev e normalização de erro. A chamada leva o header `Authorization` se houver sessão, o que é inofensivo (endpoint é público).
- **Sem cópia local de preço.** O site tomou a mesma decisão. Consequência na adesão: back-end fora do ar impede o avanço da etapa Plano. Mitigação: prefetch na abertura, nova tentativa visível e `retry: 1`. A saída "teste grátis sem lista" (PRD, Riscos) está **em aberto** e custa pouco: uma segunda ação no `PlanosErro` que troca para o modo teste. Fica fora até o negócio decidir.
- **Seleção derivada, sem efeito.** Guardar o tipo bruto e resolvê-lo contra a lista no render evita `useEffect` de sincronização e um estado intermediário em que o cartão "pisca" selecionado.
- **Centavos inteiros em vez de `number` decimal.** Reaproveita `formatarReais(centavos)` e a regra do projeto de nunca somar/arredondar em ponto flutuante.
- **Data como string `AAAA-MM-DD`.** Evita erro de fuso do `Date` no navegador. A regra "vale até o fim desse dia" fica do lado do back-end (`emPromocao` já vem calculado), então o cliente não precisa decidir.
- **Tipos `number` em vez de união fechada.** O contrato aceita períodos que o front ainda não conhece; a lista de planos, e não o código, define o que é escolhível.
- **Sem camada global de estado para planos.** O cache do TanStack Query basta (chave `["planos"]`); não vale Zustand ou contexto.
- **Esqueleto fixo em 2 cartões.** É dica de layout baseada na resposta de hoje. Se o back-end passar a devolver mais, a pior consequência é um deslocamento pequeno, sem erro funcional.

## Riscos / pontos de atenção
- **Dependência do back-end na adesão** (RF11). Medir, depois do lançamento, a taxa de sessões que caem em `PlanosErro` (métrica do PRD, ainda a definir).
- **Preço mudar entre exibir e enviar.** O cadastro envia só o tipo; o valor cobrado é o do back-end. Aceito: a lista fica 5 minutos em cache e o usuário vê o valor na Conferir. Se o back-end passar a exigir confirmação de valor no cadastro, o contrato muda.
- **Dado incoerente do back-end.** Item sem campo obrigatório é descartado; lista toda descartada vira erro. `emPromocao` com `valorAtual >= valor` é tratado como sem promoção.
- **Nome acessível via `aria-label` no rádio** substitui o texto do cartão para leitores de tela: `descreverParaLeitor` precisa conter tudo que o cartão mostra (nome, valor, condição, selo). Cobrir com teste.
- **Foco no erro/retentativa.** Depende de `status: "error"` persistir durante o refetch (comportamento do TanStack Query v5). Cobrir com teste de interação.
- **Regressão dos testes existentes.** Muitos testes de adesão importam `PLANO_MENSAL`/`lancamentoVigente` ou assumem "30 dias" e "12 meses"; precisam de fixture de planos e do mock do serviço (seguir o padrão de `OnboardingWizard.test.tsx`).
- **CORS em dev:** continua pelo proxy do Next (`DEV_API_PROXY_PATH`); sem mudança.
- **Documentação:** `docs/specs/planos-adesao/` descreve a tabela fixa e fica como histórico; não editar.

## Fora de escopo técnico
- Alterar o back-end ou o contrato de `/api/v1/Plano`.
- Cache persistente (localStorage) ou renderização no servidor da lista de planos.
- Total e economia por período (Trimestral/Semestral/Anual); só entram se o back-end passar a devolvê-los e o produto pedir.
- Exibir `diferencaPercentual`.
- Troca de plano pós-cadastro e exibição do plano em outras telas.
- Ação de teste grátis dentro do estado de erro (aguarda decisão do negócio).
