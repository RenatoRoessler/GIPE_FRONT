# Tech Spec: Configuração de meios de pagamento da empresa

**Status:** Rascunho
**Data:** 2026-10-17
**PRD:** [./prd.md](./prd.md) · **Design:** [./design.md](./design.md)

Segue as convenções do projeto (Next 16 App Router, styled-components, TanStack Form e Query, zod, vitest), como já aplicadas em `docs/specs/minha-empresa/`, `docs/specs/adesao-sistema/` e `docs/specs/saida-localizar-e-pagar/`. Esta etapa só especifica; nada é implementado aqui.

## Referências
- PRD: ./prd.md
- Design: ./design.md e a seção "Design" abaixo

## Design

- **Telas/estados:** bloco "Pagamentos" na etapa 1 da adesão e como terceira seção de Minha Empresa; fase de pagamento da saída com carregando, erro, meio único e lista filtrada (ver design).
- **Reaproveitados:** `Switch`/`SwitchField`, `Accordion`/`AccordionItem`, `OptionGroup` com ícones, `ErrorBanner`, `Skeleton`, `Button`, `Text`, `Toast`, `saidaIcons.tsx`.
- **Novos:** `PagamentosFields` (feature, `components/empresa`), mais o hook `useMeiosPagamento` (feature, `components/veiculos`). Nenhum componente novo de design system e nenhum token novo.

## Arquitetura da solução

### Decisão de modelagem: formulário próprio de pagamentos
Os quatro campos formam um **terceiro formulário**, ao lado de `company` e `hours`, em vez de entrar em `CompanyData`:

```
EmpresaFormValues = { company, hours, payments }      // Minha Empresa
AdesaoInput       = { company, hours, payments, adminUser }
```

Motivos: o cabeçalho do acordeão de Minha Empresa precisa saber se **a seção Pagamentos** tem erro, separado de "Dados da empresa" (hoje cada seção tem seu formulário e seu `hasError`); a regra "pelo menos um" é do conjunto, não de um campo; e `CompanyStepFields` é compartilhado por adesão e Minha Empresa, então não carrega um bloco que só um deles usaria.

### Arquivos
```
src/
├── types/
│   ├── adesao.ts                          # + PaymentsData, EMPTY_PAYMENTS_DATA, MEIOS_PAGAMENTO
│   └── empresa.ts                         # EmpresaFormValues ganha `payments`
├── lib/
│   ├── schemas/adesao.ts                  # + paymentsSchema, PAGAMENTOS_MINIMO_MESSAGE
│   └── api/services/
│       ├── adesao.mapper.ts               # AdesaoPayload.empresa + 4 campos; AdesaoInput.payments
│       ├── adesao.ts                      # (recebe payments)
│       ├── empresa.mapper.ts              # EmpresaDto + 4 campos; from/toEmpresaPayload
│       └── empresa.mapper.test.ts         # novo
├── components/
│   ├── empresa/
│   │   ├── PagamentosFields/              # novo
│   │   │   ├── PagamentosFields.tsx
│   │   │   ├── PagamentosFields.styles.ts
│   │   │   ├── PagamentosFields.test.tsx
│   │   │   └── index.ts
│   │   └── MinhaEmpresa/
│   │       ├── EmpresaForm.tsx            # 3º formulário e 3ª seção
│   │       └── MinhaEmpresaSkeleton.tsx   # mais um bloco
│   ├── adesao/OnboardingWizard/
│   │   └── OnboardingWizard.tsx           # etapa 1 valida company + payments
│   └── veiculos/
│       ├── SaidaVeiculoModal/useSaidaFlow.ts   # forma efetiva e estado da configuração
│       ├── PagamentoSaida/PagamentoSaida.tsx   # opções filtradas e estados
│       ├── useMeiosPagamento.ts           # novo: lê a configuração e filtra FORMAS_SAIDA
│       └── saida.ts                       # + mapeamento forma -> chave da configuração
```

Tudo Client Component, como hoje (formulários, query e estado).

## Tipos e contratos

```ts
// src/types/adesao.ts
export interface PaymentsData {
  dinheiro: boolean;
  pix: boolean;
  cartaoCredito: boolean;
  cartaoDebito: boolean;
}

// Padrão da adesão: só dinheiro ligado (PRD).
export const EMPTY_PAYMENTS_DATA: PaymentsData = {
  dinheiro: true, pix: false, cartaoCredito: false, cartaoDebito: false,
};

// Ordem de exibição na configuração, com rótulo longo e curto (o curto vai no resumo do acordeão).
export const MEIOS_PAGAMENTO = [
  { key: "dinheiro",      label: "Dinheiro",            curto: "Dinheiro" },
  { key: "pix",           label: "Pix",                 curto: "Pix" },
  { key: "cartaoCredito", label: "Cartão de crédito",   curto: "Crédito" },
  { key: "cartaoDebito",  label: "Cartão de débito",    curto: "Débito" },
] as const satisfies readonly { key: keyof PaymentsData; label: string; curto: string }[];
```

```ts
// src/lib/schemas/adesao.ts
export const PAGAMENTOS_MINIMO_MESSAGE = "Selecione ao menos um meio de pagamento";

export const paymentsSchema = z
  .object({ dinheiro: z.boolean(), pix: z.boolean(), cartaoCredito: z.boolean(), cartaoDebito: z.boolean() })
  .refine((v) => v.dinheiro || v.pix || v.cartaoCredito || v.cartaoDebito, {
    message: PAGAMENTOS_MINIMO_MESSAGE,
    path: ["dinheiro"],            // `zodFieldErrors` ignora issue sem path; o erro do grupo mora no 1º campo
  });
```

### Contratos de API (alterados)

**GET /Empresa** e **PUT /Empresa** (corpo plano): ganham `dinheiro`, `pix`, `cartaoCredito`, `cartaoDebito` (booleanos) no mesmo nível de `razaoSocial`.

**POST de adesão**: os quatro campos entram no objeto `empresa`.

**[A CONFIRMAR com o back]**: nomes e posição exatos (os nomes seguem o pedido; a posição, plana no PUT e dentro de `empresa` na adesão, é a mesma regra dos demais campos da empresa).

Tolerância do GET (`fromEmpresaResponse`): campo ausente ou `null` vira **`true`** (empresas já cadastradas continuam aceitando tudo até o administrador revisar; sugestão do PRD). Só um `false` explícito desliga. Esse é o único lugar que define o padrão de empresas antigas.

```ts
// empresa.mapper.ts
const payments: PaymentsData = {
  dinheiro: dto.dinheiro ?? true,
  pix: dto.pix ?? true,
  cartaoCredito: dto.cartaoCredito ?? true,
  cartaoDebito: dto.cartaoDebito ?? true,
};
// toEmpresaPayload(values) -> { ...campos atuais, ...payments }
```

## Componentes

### `PagamentosFields`
```ts
export const PagamentosFields = withForm({
  defaultValues: EMPTY_PAYMENTS_DATA,
  props: {} as { disabled?: boolean },
  render: ({ form, disabled }) => { /* fieldset + 4 linhas + erro do grupo */ },
});
```
- `fieldset` com `legend` "Meios de pagamento aceitos" e texto de apoio; quatro `form.AppField` (`SwitchField`) na ordem de `MEIOS_PAGAMENTO`, cada linha com o ícone de `saidaIcons.tsx` (decorativo).
- Erro do grupo: lido do campo `dinheiro` (`fieldMeta.dinheiro.errors`) e exibido abaixo das linhas (`role="alert"`, `aria-describedby` no `fieldset`, `aria-invalid`). Aparece quando algum `switch` foi tocado **ou** houve tentativa de envio, para surgir assim que o último é desligado mas não antes de qualquer interação.
- Estilos em `PagamentosFields.styles.ts` (linha com `$checked`, grade 1 coluna e 2 colunas a partir de `sm`), só tokens do tema.

### Minha Empresa
Em `EmpresaForm.tsx`: `paymentsForm = useAppForm({ defaultValues: initial.payments, validators: onChange: paymentsSchema })`, igual a `hoursForm`; `setOpen` ganha a chave `pagamentos`; `handleSave` valida os três formulários juntos (`Promise.all`) e abre a seção com erro e foca o primeiro campo inválido; `mutation.mutate({ company, hours, payments })`; `onSuccess` faz `paymentsForm.reset(values.payments)` e o `setQueryData` já grava o objeto inteiro; `handleDiscard` e `isDirty` incluem o novo formulário. Resumo do acordeão: nomes curtos dos meios ligados separados por vírgula.

### Adesão
`OnboardingWizard`: o formulário da etapa 1 passa a disparar `companyForm.handleSubmit()` e `paymentsForm.handleSubmit()` e só avança se **os dois** forem válidos (mesmo padrão do `handleSave` de Minha Empresa); `CompanyStepFields` seguido de `PagamentosFields`. O `payments` entra no `mutateAsync` final e em `toAdesaoPayload`.

### Saída de veículos

**Fonte da configuração.** Hoje `useSaidaFlow` carrega `getEmpresa` (`EMPRESA_QUERY_KEY`) só depois de achar o veículo, para o recibo. Passa a carregar **na montagem do modal** (`enabled: true`), com `staleTime: 0` neste uso, para refletir a configuração a cada abertura do modal (RF-07) sem esperar os 5 minutos do recibo, e `refetchOnWindowFocus: false`. O resultado cacheado aparece na hora enquanto a revalidação corre.

```ts
// components/veiculos/useMeiosPagamento.ts
export type MeiosPagamento =
  | { status: "carregando" }
  | { status: "erro"; mensagem: string; refetch: () => void }
  | { status: "vazio" }                                   // todos desligados: configuração inválida
  | { status: "pronto"; opcoes: typeof FORMAS_SAIDA[number][] };   // já filtradas e na ordem da saída
```
Filtra `FORMAS_SAIDA` pelas chaves de `payments` por meio de um mapa em `saida.ts`: `Dinheiro -> dinheiro`, `CartaoCredito -> cartaoCredito`, `CartaoDebito -> cartaoDebito`, `Pix -> pix`.

**Forma efetiva derivada.** `useSaidaFlow` troca `forma` (estado, padrão Dinheiro) por `formaEscolhida: string | null`. A forma usada é `formaEscolhida` se ainda estiver em `opcoes`, senão a primeira de `opcoes`. Assim a "primeira aceita vem marcada" (RF-06) não precisa de efeito, e `limpar`/`voltar` só zera para `null`. `getPagamentoStatus`, o `confirmar` e o recibo usam a forma efetiva.

**`PagamentoSaida`.** Recebe `meios: MeiosPagamento` (no lugar da lista fixa `OPTIONS`):
- `pronto` → `OptionGroup columns={4}` com as `opcoes` (ícones iguais), e, com uma só, o texto "Único meio de pagamento aceito pela empresa.";
- `carregando` → `Skeleton` com `aria-busy`;
- `erro` → `ErrorBanner role="alert"` com a mensagem e botão **Tentar novamente**;
- `vazio` → `ErrorBanner` "Nenhum meio de pagamento configurado. Peça ao administrador para revisar em Minha Empresa."
- Em todos, exceto `pronto`, o botão **Confirmar Saída** fica desabilitado, e o modal mostra ao lado o motivo em texto ("Carregando meios de pagamento…").

## Decisões técnicas e trade-offs

| Decisão | Alternativas | Motivo |
| --- | --- | --- |
| Terceiro formulário `payments` | Campos dentro de `CompanyData` | Erro e resumo por seção em Minha Empresa; validação do conjunto; `CompanyStepFields` continua igual nos dois contextos |
| Erro do grupo no campo `dinheiro` | Campo virtual `pagamentos` no objeto de valores | `zodFieldErrors` ignora issues sem path e o objeto de valores fica idêntico ao payload; custo é o 1º campo carregar o erro do grupo, escondido atrás do `PagamentosFields` |
| Campo ausente no GET = `true` | Ausente = só dinheiro | Não bloqueia nem reduz o que empresas antigas aceitam hoje; o administrador revisa quando quiser |
| Configuração lida de `/Empresa` na saída | Endpoint próprio de meios aceitos | Não exige endpoint novo e reaproveita o cache do recibo e de Minha Empresa; **risco de permissão** (ver abaixo) |
| `staleTime: 0` só no uso da saída | `staleTime` global menor | A saída precisa ver mudanças feitas em outro aparelho; Minha Empresa e o recibo mantêm 5 min |
| Forma efetiva derivada | Efeito que reajusta `forma` | Sem estado duplicado nem render extra; consistente com a fase derivada do fluxo de saída |
| Configuração carregada na abertura do modal | Carregar só na fase de pagamento | A fase de pagamento já abre pronta; falha só se manifesta onde importa |
| Bloqueia a saída quando a lista falha ou vem vazia | Cair para as 4 formas | É o que o PRD pede; a alternativa vira ponto a confirmar se o risco de permissão se confirmar |
| Sem `Boolean` por meio no `Switch` de design system | Novo componente "ToggleTile" | O `Switch` com a linha estilizada resolve; reaproveita acessibilidade pronta |

## Estratégia de testes

Ferramenta: **vitest + Testing Library** (`renderWithTheme`, `renderWithProviders`).

| Camada | O que testar |
| --- | --- |
| Schema | `paymentsSchema` aceita cada combinação com ao menos um ligado e rejeita todos desligados com a mensagem, no campo `dinheiro` |
| Mappers | `fromEmpresaResponse`: com os quatro campos, com `false` explícito, com campos ausentes e `null` (viram `true`); `toEmpresaPayload` envia os quatro; `toAdesaoPayload` inclui os quatro em `empresa` |
| Serviços | `getEmpresa`/`updateEmpresa`/`saveAdesao` repassam o corpo esperado |
| `PagamentosFields` | quatro `switch` com nome e estado; alternar chama o formulário; erro do grupo aparece ao desligar o último (e só depois de interação), some ao ligar um; `disabled` trava os quatro; `fieldset` com `legend` |
| `EmpresaForm` | seção Pagamentos com resumo certo; salvar envia os quatro; erro abre a seção, marca o cabeçalho e foca o primeiro `switch`; descartar volta ao último salvo; `isDirty` inclui pagamentos |
| `OnboardingWizard` | etapa 1 mostra o bloco com só Dinheiro ligado; não avança com todos desligados; envia `payments` ao concluir |
| `useMeiosPagamento` | filtra e ordena; `carregando`, `erro` (com `refetch`), `vazio`, `pronto`; empresa antiga (campos ausentes) = quatro opções |
| `PagamentoSaida` / `SaidaVeiculoModal` | só os meios aceitos; primeira aceita marcada quando Dinheiro está desligado; meio único com o texto de apoio; carregando e erro desabilitam **Confirmar Saída**; **Tentar novamente** refaz; sem Dinheiro não há "Valor recebido"; a configuração é lida na abertura do modal; fixtures de saída existentes passam a mockar `getEmpresa` com configuração (o mock atual `mockRejectedValue("sem empresa")` passaria a bloquear a saída) |
| Manual | adesão ponta a ponta (padrão só Dinheiro); Minha Empresa em outro navegador mudando um meio e a saída refletindo ao reabrir o modal; empresa antiga sem os campos; operador de caixa e manobrista na saída |

Rodar `npm run lint`, `npm test` e `npm run build` ao final.

## Riscos / pontos de atenção

| Risco | Prob. | Mitigação |
| --- | --- | --- |
| **`GET /Empresa` negado a perfis que só operam a saída** (manobrista, caixa) | Média a alta | O PRD bloqueia a saída em caso de erro: nesse caso nenhum operador desses perfis daria saída. Confirmar com o back antes de implementar a parte da saída; se necessário, expor os meios aceitos em endpoint legível por todos os perfis (a leitura fica isolada em `useMeiosPagamento`) |
| Contrato do back diferente (nomes ou posição dos campos) | Média | Concentrado em `empresa.mapper.ts` e `adesao.mapper.ts`; ver "A CONFIRMAR" |
| Empresas já cadastradas sem os campos | Alta | Padrão `true` no mapper; testado |
| Configuração mudada com uma saída aberta | Baixa | A revalidação roda só na abertura do modal, sem intervalo; a fase de pagamento não reavalia a lista no meio da operação |
| Testes de saída existentes bloqueiam por causa do novo estado de erro | Alta (esperado) | Atualizar os mocks de `getEmpresa` na mesma task que muda a saída |
| Adesão: validar dois formulários na mesma etapa | Média | Mesmo padrão do `handleSave`; cobrir com teste de etapa |
| Erro do grupo preso ao campo `dinheiro` confunde manutenção | Baixa | Comentário no schema e no `PagamentosFields`; teste dedicado |

## Fora de escopo técnico
- Endpoint novo ou mudança de contrato além dos quatro campos; permissões de perfil.
- Boleto e transferência; taxas, limites ou integração com maquininha.
- Filtrar formas no caixa, no histórico de turnos ou em relatórios.
- Migrar dados de empresas antigas (o padrão `true` é só de leitura até alguém salvar).
- Atualização em tempo real da lista na saída enquanto o modal está aberto.

## Pontos a confirmar antes de implementar
1. Os nomes e a posição dos quatro campos no GET/PUT `/Empresa` e na adesão.
2. Se `GET /Empresa` pode ser lido por todos os perfis que dão saída; caso contrário, qual endpoint expõe os meios aceitos.
3. Que empresas já cadastradas assumam "todos ligados" quando o back não devolver os campos.
4. Se a saída deve **bloquear** quando a configuração não carrega, ou ter um padrão de segurança.
