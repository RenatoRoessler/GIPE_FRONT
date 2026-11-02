# Tech Spec: Escolha de Plano no Fluxo de Adesão

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só resume e aponta para ele)
- Site (origem dos planos e do parâmetro): `C:\murel\murel-site\docs\specs\planos-adesao\{prd,techspec}.md`
- Fluxo atual: `docs/specs/revisao-fluxo-adesao/{design,techspec}.md`
- Next `16.4.3`. Conforme `AGENTS.md`, o guia relevante (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`) foi lido: em build de produção, uma página estática que chama `useSearchParams` precisa de `Suspense`.

## Estado atual do repositório
- `src/app/adesao/page.tsx` renderiza `<OnboardingWizard />` sem `Suspense` e sem ler a URL.
- `useAdesaoWizard.ts` controla `etapa: 1 | 2 | 3 | 4` (Empresa, Horários, Titular, Conferir) e quatro formulários (`companyForm`, `paymentsForm`, `hoursForm`, `adminUserForm`). Índices de etapa aparecem em `ETAPAS`, `proximaEtapa`, `editar(1|2|3)`, `corrigir` e `OnboardingWizard` (`etapa === 1/2/3`, `TITULOS`, `DESCRICOES`).
- `adesaoErrors.ts` tem `AlvoErro.etapa: 1 | 3` (CNPJ na etapa 1, CPF e e-mail na 3). Esses números mudam com a nova etapa.
- `adesao.mapper.ts` (`toAdesaoPayload`) é o único ponto que monta o contrato; `AdesaoInput` tem `company`, `hours`, `payments`, `adminUser`.
- `OptionGroup` (`src/components/ui`) aceita só `value`, `label` e `icon` por opção, em tiles de uma linha.
- `buildCredencial` e `CredencialEmpresa` não têm campo de plano. `ConferirStep` tem cinco blocos, nenhum de plano.
- `/adesao` já é pública em `proxy.ts`; a query string não é alterada.
- Nenhuma referência a `tipoPlanoAdesao` ou a preços de plano existe no código.

## Design
Decisões visuais estão em `./design.md`. Resumo do que a implementação precisa:
- **Telas/estados:** etapa 1 "Plano" (sem plano, pré-selecionado, erro ao avançar sem escolher, retorno de outra etapa); bloco "Plano" na Conferir; linha "Plano" na credencial.
- **Reaproveitados:** `OptionGroup`, `ErrorBanner`, `Text`, `Button`, `ActionBar`, `Stepper`, `AdesaoShell`, `CredencialEmpresa`.
- **Novos:** `PlanoStepFields` em `src/components/adesao/` e uma variante de cartão no `OptionGroup`.
- **Tokens:** nenhum novo (ver `design.md`, "Tokens usados").

## Arquitetura da solução

### Fluxo de etapas
`Etapa = 1 | 2 | 3 | 4 | 5` = Empresa, Horários, Titular, Plano, Conferir.

Para não deixar números mágicos espalhados, o hook passa a expor constantes nomeadas:
```ts
// useAdesaoWizard.ts
export const ETAPA = { Empresa: 1, Horarios: 2, Titular: 3, Plano: 4, Conferir: 5 } as const;
export type Etapa = (typeof ETAPA)[keyof typeof ETAPA];
export type EtapaEditavel = Exclude<Etapa, typeof ETAPA.Conferir>;
export const ETAPAS = ["Empresa", "Horários", "Titular", "Plano", "Conferir"];
```
`proximaEtapa` passa a limitar em 5. O restante do hook usa `ETAPA.*` no lugar de literais. `AlvoErro.etapa` segue `1 | 3` (empresa e titular), agora escrito com os nomes de `ETAPA`, expresso com os mesmos nomes (`adesaoErrors.ts` importa de uma constante compartilhada; para evitar dependência circular com o hook, `ETAPA` mora em `src/components/adesao/etapas.ts` e o hook a reexporta).

### Arquivos
```
src/
  app/adesao/page.tsx                             # + <Suspense> em volta do wizard
  types/plano.ts                                  # TipoPlanoAdesao, PlanoVendido, Plano
  lib/planos.ts                                   # PLANOS, calcularCondicoes, lerPlanoDaUrl, formatarReais
  lib/planos.test.ts
  lib/areasDoSistema.ts                           # as 13 áreas do sistema, iguais às do site
  lib/schemas/adesao.ts                           # + planoSchema
  lib/api/services/adesao.mapper.ts               # + tipoPlanoAdesao no payload; AdesaoInput.plano
  lib/api/services/adesao.mapper.test.ts
  lib/api/adesaoErrors.ts                         # AlvoErro.etapa 1|3 -> 2|4
  lib/api/adesaoErrors.test.ts
  components/adesao/
    etapas.ts                                     # ETAPA (constante nomeada)
    useAdesaoWizard.ts                            # 5 etapas, estado do plano, leitura da URL
    credencial.ts                                 # + plano em DadosCredencial / buildCredencial
    credencial.test.ts
    PlanoStepFields/
      PlanoStepFields.tsx
      PlanoStepFields.test.tsx
      index.ts
    ConferirStep/ConferirStep.tsx                 # + bloco "Plano"; onEditar passa a EtapaEditavel
    ConferirStep/ConferirStep.test.tsx
    OnboardingWizard/OnboardingWizard.tsx         # etapa 1 = plano; TITULOS/DESCRICOES com 5 itens
    OnboardingWizard/OnboardingWizard.test.tsx
  components/ui/
    OptionGroup/OptionGroup.tsx                   # + variante "card"
    OptionGroup/OptionGroup.styles.ts
    OptionGroup/OptionGroup.test.tsx
    CredencialEmpresa/CredencialEmpresa.tsx       # + linha "Plano"
    CredencialEmpresa/CredencialEmpresa.test.tsx
```
Uma pasta por componente, com `index.ts`, como o restante de `src/components/adesao`.

### Tipos e dados
```ts
// src/types/plano.ts
export enum TipoPlanoAdesao { Trial = 0, Mensal = 1, Trimestral = 2, Semestral = 3, Anual = 4 }

// Trial existe no backend, mas não é oferecido na adesão (PRD).
export type PlanoVendido = Exclude<TipoPlanoAdesao, TipoPlanoAdesao.Trial>;

export interface Plano {
  tipo: PlanoVendido;
  nome: string;            // "Mensal" ...
  meses: 1 | 3 | 6 | 12;
  centavosPorMes: number;  // 14990, 13490, 11990, 7990
  recomendado?: boolean;   // só o Anual
}
```
- `enum` segue `TipoEmpresa` em `types/adesao.ts`.
- Preços em **centavos inteiros**, como no site, para total e economia saírem exatos.

```ts
// src/lib/planos.ts
export const PLANOS: readonly Plano[]; // Mensal, Trimestral, Semestral, Anual, nessa ordem
export function calcularCondicoes(plano: Plano): {
  totalCentavos: number;       // centavosPorMes * meses
  economiaCentavos: number;    // mensal.centavosPorMes * meses - total
  economiaPercentual: number;  // Math.round(economia / (mensal * meses) * 100)
};
export function formatarReais(centavos: number): string; // Intl.NumberFormat pt-BR, criada uma vez no módulo
export function lerPlanoDaUrl(valor: string | null): PlanoVendido | undefined;
```
- Resultados esperados: Trimestral 40470 / 4500 / 10%; Semestral 71940 / 18000 / 20%; Anual 95880 / 84000 / 47%; Mensal 14990 / 0 / 0.
- `lerPlanoDaUrl` aceita só os textos exatos `"1"`, `"2"`, `"3"` e `"4"`; qualquer outra coisa (ausente, `"0"`, `"9"`, `"abc"`, `"1.5"`, `" 2"`) devolve `undefined`, sem erro (PRD RF5).
- Texto do total por plano (`design.md`) sai de uma função `descreverTotal(plano)` no mesmo arquivo, para o cartão e a conferência usarem a mesma redação: Mensal "Cobrado todo mês"; Trimestral e Semestral "R$ X por N meses"; Anual "R$ X em uma cobrança única".
- Os valores são a mesma tabela do site. Não há pacote compartilhado entre os dois repositórios; duplicação aceita (ver Riscos).

### Estado do plano e leitura da URL
- `useAdesaoWizard` chama `useSearchParams()` e inicializa o estado uma vez:
  ```ts
  const searchParams = useSearchParams();
  const [plano, setPlano] = useState<PlanoVendido | undefined>(
    () => lerPlanoDaUrl(searchParams.get("tipoPlanoAdesao")),
  );
  const [erroPlano, setErroPlano] = useState<string>();
  ```
  O parâmetro só vale na abertura. Trocar o plano na tela não reescreve a URL.
- Plano no próprio `useState`, e não em um quinto `useAppForm`: é um único valor de escolha, sem campos de texto, máscara nem validação por tecla. A regra fica em `planoSchema` (`lib/schemas/adesao.ts`) com a mensagem "Escolha um plano para continuar.", para o hook e o teste usarem a mesma fonte.
- `validarEtapa` na etapa Plano: `planoSchema.safeParse({ plano })`. Se falhar, `setErroPlano(mensagem)`, `setFaltam(1)`, foca a primeira opção do grupo (mesmo `focarPrimeiroInvalido`; o `OptionGroup` marca `aria-invalid` no `fieldset`, então o seletor existente `[aria-invalid="true"]` acharia o `fieldset`, que não é focável: o foco deve ir ao primeiro `input[type="radio"]` do grupo, ajustando `focarPrimeiroInvalido` ou usando um seletor próprio). Ao escolher um plano, limpa `erroPlano` e `faltam`.
- O hook devolve `plano`, `escolherPlano`, `erroPlano`; `dados` passa a incluir `plano`.
- `credencial` passa a depender de `plano` (`buildCredencial({ company, hours, payments, plano })`).
- `enviar()` chama `saveAdesao({ plano, company, hours, payments, adminUser })`. Como o botão "Criar conta" só existe na Conferir e a etapa Plano é obrigatória, `plano` é definido nesse ponto; o tipo de `AdesaoInput.plano` é `PlanoVendido` (não opcional) e o hook garante isso com uma checagem antes de enviar (se `plano` for `undefined`, volta à etapa Plano em vez de enviar).

### `Suspense` na página
```tsx
// src/app/adesao/page.tsx
export default function AdesaoPage() {
  return (
    // useSearchParams (plano na URL) exige Suspense.
    <Suspense fallback={null}>
      <OnboardingWizard />
    </Suspense>
  );
}
```
Mesmo padrão de `src/app/(app)/precos/page.tsx`. `metadata` continua exportada da página.

### Contrato com o backend
```ts
// adesao.mapper.ts
export interface AdesaoPayload {
  tipoPlanoAdesao: PlanoVendido; // 1..4
  empresa: { ... }; horarios: [...]; usuario: {...};
}
// toAdesaoPayload({ plano, company, hours, payments, adminUser })
```
- O valor enviado é o próprio número do enum (1 a 4). Trial (0) nunca é enviado pelo sistema.
- **Posição do campo no JSON:** o `input.md` só diz que o back "adicionou o campo `tipoPlanoAdesao`". Assumido na **raiz** do corpo, ao lado de `empresa`, `horarios` e `usuario`. Tudo fica isolado em `toAdesaoPayload`; se estiver dentro de `empresa`, é uma linha a mudar. Confirmar com o backend antes de implementar (ver Riscos).

### `OptionGroup` com variante de cartão
- `OptionGroupOption` ganha campos opcionais, sem quebrar os usos atuais (tipo de empresa, categorias, etc.):
  ```ts
  interface OptionGroupOption {
    value: string; label: string; icon?: ReactNode;
    detail?: ReactNode;   // conteúdo rico abaixo do label (valor, total, economia)
    badge?: string;       // selo de texto sobreposto ao cartão ("Mais econômico")
  }
  ```
  E `OptionGroupProps` ganha `variant?: "tile" | "card"` (padrão `"tile"`).
- Em `variant="card"`: layout empilhado (nome, `detail`), selo `badge` sobreposto no topo, `Mark` no canto, borda `accent` fixa quando houver `badge`. Colunas: `columns` (2 em `md`+) e 1 abaixo de `md`; em celular o cartão vira linha com valor à direita (CSS por `@media`, sem JS).
- O `Tile` continua sendo um `<label>` com radio nativo; o nome acessível sai do texto do próprio cartão (nome + valor + total + economia + selo), como pede o `design.md`. Ícones e `Mark` ficam `aria-hidden`.
- `PlanoStepFields` monta as opções a partir de `PLANOS` + `calcularCondicoes`, e passa `value={String(plano ?? "")}`, `onChange={(v) => escolherPlano(Number(v))}` e `error={erroPlano}`.

### Conferir e credencial
- `ConferirStep` recebe `plano` e renderiza o bloco "Plano" no topo (nome, valor por mês, total via `descreverTotal`). `onEditar(ETAPA.Plano)` volta à etapa 1; a prop `onEditar` muda de `(etapa: 1|2|3, bloco?)` para `(etapa: EtapaEditavel, bloco?: GrupoEmpresa)`. Os blocos existentes passam a chamar com `ETAPA.Empresa`, `ETAPA.Horarios` e `ETAPA.Titular`.
- `editar` no hook: `setBlocosAbertos([bloco])` só quando `destino === ETAPA.Empresa && bloco`.
- `buildCredencial` devolve `plano?: string` (ex.: "Anual · R$ 79,90/mês", `undefined` enquanto vazio). `CredencialEmpresa` mostra a linha "Plano:" com o traço apagado quando `undefined`, no padrão de `Pagamentos`.

### Server vs Client
| Peça | Tipo | Motivo |
|---|---|---|
| `app/adesao/page.tsx` | Server | só `metadata` e `Suspense` |
| `OnboardingWizard`, `PlanoStepFields`, `ConferirStep`, `OptionGroup` | Client | estado, formulário, `useSearchParams` |
| `lib/planos.ts`, `types/plano.ts` | puros | sem dependência de React |

## Decisões técnicas e trade-offs
1. **Plano como penúltima etapa e constantes nomeadas `ETAPA`.** O plano entra antes da Conferir, então só a Conferir muda de índice (4 para 5); mesmo assim os literais viram `ETAPA.*` para não ficarem números mágicos.
2. **`useState` para o plano, não um `useAppForm`.** É um valor único de escolha. Evita montar campo de formulário para um radio e mantém a regra em um schema compartilhado.
3. **Evoluir `OptionGroup` em vez de criar `PlanoRadioGroup`.** Já resolve radios nativos, foco, erro e grade. O custo é um pouco mais de superfície em um componente base; os campos novos são opcionais e o padrão não muda.
4. **Parâmetro lido uma vez, estritamente.** `lerPlanoDaUrl` só aceita 1 a 4. A URL não é reescrita na troca de plano, para não causar navegação nem perder o estado do formulário.
5. **Preços duplicados do site em `lib/planos.ts`.** Sem pacote compartilhado, copiar é o caminho mais simples e testável; o teste de `calcularCondicoes` trava os valores esperados.
6. **Texto do total em uma função só** (`descreverTotal`), usada no cartão, na conferência e no nome acessível, para as três nunca divergirem.
7. **`tipoPlanoAdesao` na raiz do payload** (assunção a confirmar), isolado no mapper.

## Riscos / pontos de atenção
- **Posição de `tipoPlanoAdesao` no JSON.** Assumida na raiz; se o backend o espera em `empresa`, a conta é criada sem plano ou falha. Confirmar o corpo exato antes de implementar.
- **A Conferir passa a ser a etapa 5.** `OnboardingWizard.test.tsx` assumia 4 etapas e precisou ganhar o passo do plano nos fluxos até a conferência. CNPJ (etapa 1) e CPF/e-mail (etapa 3) não mudam.
- **Mocks de `next/navigation`.** O teste do wizard mocka só `useRouter`; passará a precisar de `useSearchParams` também (padrão em `usePatioFiltros.test.tsx`).
- **`Suspense` ausente quebra o `npm run build`** da rota estática `/adesao`. Validar com `npm run build`.
- **Foco no erro.** O `OptionGroup` põe `aria-invalid` no `fieldset`, e `focarPrimeiroInvalido` hoje focaria algo não focável; precisa mirar o primeiro radio.
- **Duplicação de preços com o site.** Mudar um valor exige mudar nos dois repositórios. Registrar no `docs` do site e do sistema.
- **Valor não confirmado de cobrança para Trimestral e Semestral.** O texto "R$ X por N meses" é neutro de propósito; ajustar se o negócio definir a forma de cobrança.
- **Contraste** de `success` sobre `primarySoft` e de `textMuted` no cartão selecionado, nos dois temas. Conferir na QA.
- **Conteúdo do cartão no celular.** Cartão em linha com valor à direita precisa caber em 360 px sem rolagem horizontal.

## Testes (Vitest + Testing Library)
- `lib/planos.test.ts`: quatro planos na ordem e com os valores do PRD; totais 14990, 40470, 71940, 95880; economias 0, 4500, 18000, 84000; percentuais 0, 10, 20, 47; só o Anual `recomendado`; `lerPlanoDaUrl` com `"1"`..`"4"` → plano e com `null`, `"0"`, `"5"`, `"abc"`, `""`, `"2.0"` → `undefined`; `descreverTotal` dos quatro; `formatarReais(7990)` = "R$ 79,90".
- `adesao.mapper.test.ts`: `tipoPlanoAdesao` = 1, 2, 3 e 4 conforme o plano; Trial nunca aparece.
- `adesaoErrors.test.ts`: CNPJ → etapa 2; CPF e e-mail → etapa 4.
- `credencial.test.ts`: linha de plano vazia → `undefined`; escolhido → "Anual · R$ 79,90/mês".
- `OptionGroup.test.tsx`: variante `card` renderiza `detail` e `badge`; seleção por clique e por setas; erro com `role="alert"`; o padrão `tile` não muda.
- `PlanoStepFields.test.tsx`: quatro opções na ordem; lista das 13 áreas sob "Tudo isso em todos os planos"; valores e economias na tela; só o Anual tem selo; mensal sem linha de economia.
- `ConferirStep.test.tsx`: bloco "Plano" com valor por mês e total; "Editar Plano" chama `onEditar(1)`.
- `OnboardingWizard.test.tsx` (atualizar e ampliar): cinco etapas no stepper; abre na etapa "Escolha o seu plano"; `?tipoPlanoAdesao=1..4` pré-seleciona; parâmetro ausente ou inválido não seleciona e não mostra erro; avançar sem plano mostra "Escolha um plano para continuar." e mantém na etapa; plano e dados preservados ao voltar e avançar; "Editar Plano" na conferência volta e retorna à conferência; `saveAdesao` recebe o plano escolhido; os testes antigos seguem com os novos índices.
- Verificação final: `npm run lint`, `npm run build`, conferência manual em 360 px e desktop (sem rolagem horizontal), nos dois temas, e envio real dos quatro planos contra o backend.

## Fora de escopo técnico
- Pagamento, cupom e cobrança.
- Trial como opção e troca de plano depois do cadastro.
- Reescrever a URL ao trocar o plano, rascunho e persistência da escolha entre recarregamentos.
- Medição de cliques e analytics (métricas do PRD seguem `[A DEFINIR]`).
- Pacote compartilhado de preços entre o site e o sistema.
- Exibir o plano contratado em outras telas (Minha empresa etc.).
