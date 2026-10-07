# Tech Spec: Preenchimento de Endereço pelo CEP na Adesão

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (via skill claude-design)
- Contexto: `src/components/adesao/CompanyStepFields/CompanyStepFields.tsx`, `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx`, `src/lib/cep.ts`, `src/lib/api/errors.ts`

## Design
- **Telas/estados** (somente o campo CEP da etapa "Dados da empresa"; o restante do formulário não muda):
  - *Padrão*: como hoje.
  - *Buscando*: abaixo do campo, texto de apoio "Buscando endereço…" (tom neutro). Nenhum campo é desabilitado (RF3).
  - *Sucesso*: texto de apoio "Endereço preenchido. Confira os dados." (tom sucesso) e campos de endereço preenchidos, editáveis.
  - *Não encontrado*: texto de apoio "CEP não encontrado. Preencha o endereço manualmente." (tom danger). Campos de endereço intactos.
  - *Falha de comunicação* (rede, timeout, serviço fora do ar): texto de apoio "Não foi possível buscar o endereço. Preencha manualmente." (tom danger). Não bloqueia avanço.
  - *Erro de validação do CEP* (obrigatório/formato): continua via `error` do `Input`, e tem precedência visual sobre o texto de apoio.
- **Componentes do design system reaproveitados**: `Input` (estendido), `Grid`/`GridItem` já usados na etapa. Nenhum componente novo de UI.
- **Extensão do design system**: `Input` ganha as props opcionais `hint?: string` e `hintTone?: "muted" | "success" | "danger"` (padrão `"muted"`). O texto de apoio é renderizado em `role="status"` (região `aria-live="polite"`) para anunciar progresso e resultado a leitores de tela, e referenciado em `aria-describedby`. Quando há `error`, o `hint` não é exibido (um só texto sob o campo, sem deslocamento duplo).
- **Tokens de tema**: `fontSizes.xs`, `space[1]`, `colors.textMuted`, `colors.success`, `colors.danger`. Nenhum token novo.
- **Responsividade**: sem mudança de layout; o texto de apoio quebra linha em telas estreitas.

## Arquitetura da solução

### Arquivos
| Arquivo | Ação | Tipo |
|---|---|---|
| `src/types/cep.ts` | Novo: `CepAddress` (`logradouro`, `bairro`, `cidade`, `estado`, todos `string`, vazio quando ausente) | tipos |
| `src/lib/api/services/cep.ts` | Novo: `fetchAddressByCep(cep, signal)` | módulo (client) |
| `src/hooks/useCepLookup.ts` | Novo: estado e controle da busca | hook (client) |
| `src/components/ui/Input/Input.tsx`, `Input.styles.ts` | Editar: props `hint`/`hintTone` | Client Component (já é) |
| `src/components/adesao/CompanyStepFields/CompanyStepFields.tsx` | Editar: ligar o campo CEP ao hook e preencher o formulário | Client Component (já é) |

Nenhum Server Component novo; tudo roda no cliente porque depende de digitação e do estado do formulário.

### Serviço (`src/lib/api/services/cep.ts`)
- Consulta o ViaCEP: `GET https://viacep.com.br/ws/{8 dígitos}/json/`. O serviço público tem CORS aberto e não exige chave.
- **Usa `fetch` nativo, não a instância `api` (axios)**. A instância `api` tem `baseURL` do backend e injeta o `Authorization: Bearer` do usuário no interceptor; reutilizá-la enviaria o token a um terceiro.
- `fetch` sem `credentials` (padrão `same-origin`, sem cookies) e sem headers customizados, para evitar preflight de CORS.
- Timeout próprio de 8 s (constante local), combinado com o `signal` recebido via `AbortSignal.any([signal, AbortSignal.timeout(ms)])`. Não reaproveita `env.TIMEOUT_MS` (15 s é longo demais para um auxílio de digitação).
- Contrato:
  - Retorna `CepAddress` quando encontra.
  - Retorna `null` quando o CEP não existe (resposta 200 com `{ "erro": true }`, ou 400 para formato recusado pelo serviço).
  - Lança `ApiError` (`src/lib/api/errors.ts`) nos demais casos: `"network"` (falha de `fetch`), `"timeout"` (timeout próprio), `"server"` (status 5xx ou demais não-OK), `"unknown"` (corpo fora do formato esperado). Reaproveita as mensagens-padrão em português já existentes. Cancelamento por `AbortError` do chamador **não** vira `ApiError`; é repassado e ignorado pelo hook.
- Mapeamento: `logradouro→logradouro`, `bairro→bairro`, `localidade→cidade`, `uf→estado`. O corpo é validado com `zod` (`safeParse`) antes do uso. `estado` só é aceito se a sigla existir em `ESTADOS` (`src/lib/estados.ts`); caso contrário vira `""` para não deixar o `Select` com valor sem opção correspondente.

### Hook (`src/hooks/useCepLookup.ts`)
```ts
type CepLookupStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "found" }
  | { state: "not_found" }
  | { state: "error"; message: string };

function useCepLookup(): {
  status: CepLookupStatus;
  lookup: (cep: string) => Promise<CepAddress | null>; // null: não encontrado, falha ou resposta obsoleta
  reset: () => void;
};
```
- Mantém um `AbortController` por chamada; iniciar nova busca ou chamar `reset` aborta a anterior (RF7). Respostas de buscas abortadas não alteram o estado.
- `reset` volta a `idle`; chamado quando o CEP deixa de estar completo.
- Aborta a busca pendente ao desmontar (cleanup de `useEffect`), evitando `setState` após desmontar e vazamento de requisição ao avançar de etapa.
- Sem retentativa automática: a falha mostra a mensagem e o usuário preenche à mão (RF6). Alterar o CEP aciona nova busca.

### Integração no formulário (`CompanyStepFields`)
- O `render` do `withForm` é um componente, então o hook pode ser chamado nele.
- No `onChange` do campo `cep`:
  1. `field.handleChange(formatCEP(valor))` como hoje.
  2. Se `isValidCEP(valorFormatado)`: `lookup(valorFormatado)`; senão `reset()` (RF9: nenhuma busca para CEP incompleto).
  3. Ao resolver com endereço: para cada campo (`logradouro`, `bairro`, `cidade`, `estado`) com valor **não vazio**, `form.setFieldValue(campo, valor)`. Campos vazios na resposta não tocam no que o usuário já tem (RF8). O número nunca é tocado (RF2).
- Chamadas de `setFieldValue` dos quatro campos de endereço rodam a validação `onChange` do formulário (já existente, via `companySchema`); os erros só aparecem após `isTouched`, então não surgem erros prematuros nos campos preenchidos.
- A resposta só é aplicada se o CEP atual do formulário ainda for o consultado (`form.getFieldValue("cep")`), defesa extra além do abort.
- Props do `Input` do CEP: `hint`/`hintTone` derivados de `status` (tabela do Design). `error` do campo continua vindo do estado do formulário.
- O foco permanece no campo CEP; nada é movido automaticamente.

### Dados enviados ao backend
Sem mudança: `src/lib/api/services/adesao.mapper.ts` continua formatando o CEP com `formatCEP`, e os campos de endereço seguem o mesmo contrato.

## Decisões técnicas e trade-offs
- **ViaCEP direto do navegador (e não via backend próprio):** o PRD deixou a escolha em aberto. Não há endpoint de CEP no backend, e criar um dependeria de outro time. O serviço do ViaCEP é gratuito, com CORS liberado e resposta simples. Trade-off: dependência de terceiro (ver Riscos). A troca fica isolada em `fetchAddressByCep`, então migrar para um endpoint do backend depois muda um único arquivo.
- **`fetch` em vez de axios:** evita vazar o token do usuário e o `baseURL` do backend para um serviço externo.
- **Hook com `AbortController` em vez de `useQuery`:** a busca é pontual, disparada por evento e precisa de cancelamento por digitação. `useQuery` traria cache, `refetchOnWindowFocus` e a política de retentativa global (até 3 vezes com `retry` padrão para erros de rede), o que reabriria o preenchimento e sobrescreveria edições do usuário. Trade-off: não há cache entre CEPs repetidos (aceitável; fora de escopo no PRD).
- **Disparo no `onChange` do campo e não em `useEffect`:** evita efeito reagindo a estado do formulário, que repetiria a busca em re-renders e poderia sobrescrever edições.
- **Preencher só valores não vazios:** cumpre RF8 sem lógica extra e preserva o que o usuário digitou quando o CEP é genérico (sem logradouro/bairro).
- **Campos de endereço seguem editáveis, estado inclusive:** assumido no PRD (ponto em aberto resolvido assim); mantém o fluxo para CEPs de divisa ou dados desatualizados do serviço.
- **`hint` no `Input` do design system** (e não texto solto dentro da feature): outros formulários podem precisar de texto de apoio acessível; segue a regra de não deixar UI solta fora de `src/components/ui`.
- **Sem testes automatizados novos:** o projeto não tem framework de testes configurado (`package.json` sem vitest/jest). Verificação por `npm run lint`, `npm run build` e roteiro manual abaixo. Se o projeto adotar Vitest, `fetchAddressByCep` é o primeiro candidato (mapeamento, `{erro:true}`, estado inválido, timeout).

## Riscos / pontos de atenção
- **Terceiro fora do ar ou com limite de uso:** coberto pelo estado de falha, que não bloqueia o preenchimento manual. O ViaCEP não oferece SLA; avaliar endpoint no backend se a adesão virar fluxo de alto volume.
- **Privacidade:** o CEP digitado é enviado ao ViaCEP (dado de baixa sensibilidade, sem outros identificadores da empresa). Nenhum dado de usuário ou token vai na requisição.
- **Política de segurança de conteúdo (CSP):** hoje o projeto não define CSP (`next.config.ts` sem headers). Se for adicionada, incluir `https://viacep.com.br` em `connect-src`.
- **Conteúdo misto:** o backend está em HTTP; o ViaCEP é HTTPS. Se o front for servido em HTTPS, não há bloqueio para a chamada ao ViaCEP.
- **Dados do serviço desatualizados ou com grafia diferente:** o usuário confere e edita (texto "Confira os dados" no sucesso).
- **`estado` fora da lista:** tratado (vira vazio), evitando `Select` com valor inválido.
- **Corrida entre respostas:** tratada por `AbortController` e checagem do CEP atual antes de aplicar.
- **Leitor de tela:** `role="status"` pode repetir texto se o `hint` mudar com frequência; os estados só mudam em transições discretas (buscando → resultado).

## Fora de escopo técnico
- Cache de consultas, retentativa automática, botão "buscar" manual.
- Endpoint de CEP no backend e variável de ambiente para trocar a URL do serviço.
- Consulta de CNPJ e qualquer outro preenchimento automático.
- Reuso da busca em outras telas (a extração para um componente de endereço compartilhado fica para quando houver um segundo uso).
- Infraestrutura de testes automatizados.

## Roteiro de verificação manual
1. CEP válido existente (ex.: `01310-100`): logradouro, bairro, cidade e estado preenchidos; número vazio; mensagem de sucesso.
2. Editar um campo preenchido e depois alterar o CEP para outro válido: campos retornados são atualizados; campos não retornados mantêm o valor.
3. CEP genérico de cidade (sem logradouro): logradouro e bairro digitados antes permanecem.
4. CEP inexistente (ex.: `00000-000`): mensagem "não encontrado"; campos intactos; avançar de etapa possível após preencher manualmente.
5. Sem rede (DevTools offline): mensagem de falha; fluxo segue manual.
6. Apagar um dígito do CEP durante a busca: busca cancelada, estado volta ao padrão, validação existente aparece.
7. Teclado e leitor de tela: mensagens anunciadas, foco permanece no CEP.
8. Confirmar que o cadastro final envia o mesmo payload de antes.
9. `npm run lint` e `npm run build` sem erros.
