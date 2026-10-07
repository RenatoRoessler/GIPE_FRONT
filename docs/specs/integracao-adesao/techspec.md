# Tech Spec: Integração do Fluxo de Adesão com o Backend

## Referências
- PRD: ./prd.md
- Design: ./design.md (via skill claude-design)
- Camada de comunicação: `docs/INTEGRACAO-BACKEND.md` (`src/lib/api`)

## Design
- Telas/estados: ver `design.md`. Fluxo de 3 etapas (empresa, funcionamento, titular), com erro do backend em `ErrorBanner` na etapa final.
- Componentes reaproveitados: `Card`, `PageBackground`, `Stepper`, `Button`, `Text`, `Input`, `Select`, `TextField`/`SelectField` (`src/components/form`), `Grid`/`GridItem`, `ErrorBanner`.
- Componentes novos:
  - `Switch` em `src/components/ui/Switch` (compartilhado com a spec `gestao-usuarios`, que prevê o mesmo componente; o primeiro a ser implementado o cria).
  - `SwitchField` em `src/components/form/SwitchField.tsx` (`useFieldContext<boolean>()` + `Switch`), registrado em `form.ts`.
  - `BusinessHoursStepFields` em `src/components/adesao/BusinessHoursStepFields/` (etapa 2).
- Tokens de tema: nenhum novo.

## Arquitetura da solução

### Tipos (`src/types/adesao.ts`)
Reescrita dos tipos do formulário, sem acoplá-los ao formato da API:
```ts
export interface CompanyData {
  cnpj: string; razaoSocial: string; nomeFantasia: string;
  tipoEmpresa: TipoEmpresa | ""; telefone: string;
  cep: string; logradouro: string; numero: string; bairro: string;
  cidade: string; estado: string;
  quantidadeVagasMoto: string; quantidadeVagasCarro: string; // string no form, número no schema/payload
}

export interface DayHours { aberto: boolean; aberto24Horas: boolean; horarioAbertura: string; horarioFechamento: string; }
export interface BusinessHoursData { horarios: DayHours[] } // 7 itens, índice = posição em DIAS_SEMANA

export interface AdminUserData {
  nome: string; cpf: string; email: string; celular: string; senha: string; repetirSenha: string;
}
```
- `DIAS_SEMANA`: lista ordenada `{ codigo: number; label: string }[]` (Domingo..Sábado) com **códigos 1..7, assumindo 1 = domingo**. É o único lugar onde essa correspondência existe; se o backend confirmar outra, só esta constante muda (RF-04 do PRD, [A DEFINIR]).
- `EMPTY_COMPANY_DATA`, `EMPTY_BUSINESS_HOURS_DATA` (segunda a sexta 08:00-18:00 abertos; sábado e domingo fechados) e `EMPTY_ADMIN_USER_DATA` atualizados.

### Utilitários (`src/lib/`)
- `phone.ts`: `formatPhone` (máscara 10/11 dígitos), `isValidPhone` (10 ou 11 dígitos), `isValidCelular` (11 dígitos, terceiro dígito 9). Segue o estilo de `cpf.ts`/`cnpj.ts`.
- `cep.ts`: `formatCEP` (`00000-000`), `isValidCEP` (8 dígitos).
- `estados.ts`: lista das 27 UFs `{ sigla, nome }` para o `Select`.

### Schemas (`src/lib/schemas/adesao.ts`)
- `companySchema`: campos acima; `cep` com `isValidCEP`; `estado` obrigatório e dentro da lista de UFs; `quantidadeVagasMoto`/`Carro`: string numérica inteira ≥ 0 (`z.string().regex` simples sem backtracking + `refine`), convertida só no mapper. Telefone com `isValidPhone`.
- `businessHoursSchema`: `horarios` com exatamente 7 itens; cada dia, via `superRefine`: se `aberto && !aberto24Horas`, abertura e fechamento são obrigatórios (formato `HH:mm`) e `fechamento > abertura` (comparação por minutos; sem virada de meia-noite, conforme PRD). Erros com `path` `["horarios", i, "horarioAbertura"|"horarioFechamento"]`.
- `adminUserSchema`: remove `sobrenome`; `nome` é "Nome completo"; adiciona `celular` com `isValidCelular`; mantém as regras de CPF, e-mail, senha (mínimo 6, [A DEFINIR]) e confirmação.
- `zodFieldErrors` (`src/components/form/zodFieldErrors.ts`) precisa suportar caminhos de array (`horarios[2].horarioAbertura`); verificar o formato atual e estender se necessário.

### Serviço e mapeamento (`src/lib/api/services/`)
```
adesao.ts          # saveAdesao(input): Promise<void> -> api.post("/Adesao", toAdesaoPayload(input))
adesao.mapper.ts   # toAdesaoPayload(company, hours, admin): AdesaoPayload (puro, testável)
```
- Endpoint: `POST /Adesao` (a `baseURL` já inclui `/api/v1`). Sem token; o interceptor só anexa se houver cookie.
- `AdesaoPayload` tipado conforme `docs/input.md`:
  - `empresa`: `razaoSocial`, `nomeFantasia` (**assumido dentro de `empresa`**, a confirmar), `cnpj`, `tipoEmpresa`, `telefone`, `endereco { logradouro, bairro, numero, cidade, estado, cep }`, `quantidadeVagasMoto`, `quantidadeVagasCarro`.
  - `horarios[]`: `{ aberto, aberto24Horas, diaDaSemana, horarioAbertura, horarioFechamento }`.
  - `usuario`: `{ nome, cpf, email, celular, senha }` (sem `repetirSenha`).
- Formatos, seguindo o exemplo do backend: `cnpj`, `cpf`, `telefone` e `celular` **só dígitos**; `cep` com hífen (`00000-000`); vagas como inteiros. Esta decisão fica concentrada no mapper ([A DEFINIR] com o backend).
- Dias: `aberto === false` ou `aberto24Horas === true` envia `horarioAbertura`/`horarioFechamento` como `null`; `diaDaSemana` vem de `DIAS_SEMANA[i].codigo`.
- O mapper não loga nem retorna a senha em mensagens; nenhum `console.log` do payload.
- Erros: o serviço não captura; `ApiError` sobe para o `useMutation`.

### Componentes (Client Components, todos usam hooks de formulário)
```
src/components/adesao/CompanyStepFields/CompanyStepFields.tsx            # + endereço em 6 campos, vagas
src/components/adesao/BusinessHoursStepFields/BusinessHoursStepFields.tsx # NOVO: 7 linhas + "Copiar segunda"
src/components/adesao/BusinessHoursStepFields/BusinessHoursStepFields.styles.ts
src/components/adesao/BusinessHoursStepFields/index.ts
src/components/adesao/AdminUserStepFields/AdminUserStepFields.tsx        # nome completo + celular
src/components/adesao/OnboardingWizard/OnboardingWizard.tsx              # 3 etapas + mutation real
src/components/ui/Switch/{Switch.tsx,Switch.styles.ts,index.ts}          # NOVO (ver Design)
src/components/form/SwitchField.tsx                                       # NOVO, registrado em form.ts
```
- `OnboardingWizard`:
  - `STEPS` com 3 itens; estado `step` de 1 a 3; três `useAppForm` (empresa, horários, titular), mesmo padrão atual (`validators.onChange` + `zodFieldErrors`).
  - `useMutation({ mutationFn: ({company, hours, adminUser}) => saveAdesao(...) })`; `onSuccess` mantém `router.push("/login?cadastro=sucesso")`.
  - O botão "Salvar" já fica desabilitado durante `isPending`, o que impede duplo envio; `mutation.error` (tipado `ApiError` via `Register`) alimenta o `ErrorBanner`. O erro some no próximo `mutate`.
  - Dados dos três formulários ficam em memória no componente, então "Voltar" não perde nada.
  - Foco: ao trocar de etapa, mover o foco para o título (`tabIndex={-1}` + `ref`).
- `BusinessHoursStepFields`: `form.Field name="horarios"` com `mode="array"`; para cada índice usa `form.Field name={`horarios[${i}].aberto`}` etc. Regras de UI: desmarcar "Aberto" também desmarca "24 horas"; "24 horas" desabilita os campos de hora (mantém os valores digitados para o caso de reversão). "Copiar segunda" usa `form.setFieldValue` para os índices restantes.
- `src/lib/mockApi.ts`: remover `mockSaveOnboarding` (sem outros usos; conferir com busca antes). As demais funções permanecem.

### Server vs Client
Todos os componentes acima são Client Components (formulário, estado de etapa, mutation). `src/app/adesao/page.tsx` não muda. `schemas`, `mappers` e utilitários são módulos puros.

## Decisões técnicas e trade-offs
- **Tipos do formulário separados do payload, com mapper puro:** o backend ainda vai mudar (`nomeFantasia`, formatos, dias). Concentrar a tradução em `adesao.mapper.ts` isola essa instabilidade e é o ponto natural de teste. Custo: um arquivo a mais.
- **Vagas como `string` no formulário:** `Input` controlado trabalha com string; converter só no mapper evita estado inválido (`NaN`) no campo.
- **Três formulários independentes, como já é hoje:** mantém validação por etapa e reuso do padrão `withForm`. Alternativa descartada: um formulário único com validação por grupo, que obrigaria reescrever as etapas existentes.
- **Valores iniciais de horário (seg-sex 08:00-18:00):** um padrão mais útil do que uma etapa vazia, mas o usuário pode enviar sem perceber que são valores de exemplo. Mitigação: texto de apoio na etapa e o botão "Copiar segunda" para ajustar rápido. Se o time preferir tudo vazio, basta mudar `EMPTY_BUSINESS_HOURS_DATA`.
- **Sem erros por campo vindos do backend:** o formato de erro é desconhecido; só `ApiError.message`. Isso já está no PRD como fora de escopo.
- **Sem dependência nova:** máscaras e validações seguem as funções próprias já usadas (`cpf.ts`, `cnpj.ts`), sem biblioteca de máscara.
- **Sem testes automatizados:** o projeto ainda não tem runner (ver `integracao-backend`). O mapper e os schemas ficam puros para quando houver. Verificação manual descrita abaixo.

## Verificação
- `npm run lint` e `npm run build`.
- Manual no navegador (desktop e 375px): validação de cada campo novo; etapa de horários nos três estados (fechado, 24h, horário); "Copiar segunda"; "Voltar" preserva dados; envio duplo (clique repetido); falha de rede (backend inacessível), erro de validação do backend (ex.: reenviar o mesmo CNPJ) e sucesso com redirect.
- Conferir no Network o corpo enviado contra o exemplo de `docs/input.md` (formato dos dias, `null` nos horários fechados, sem `repetirSenha`).
- **Atenção:** cada envio com sucesso grava dados reais no backend. Usar CNPJ/CPF/e-mail de teste identificáveis e alinhar a limpeza com o backend.

## Riscos / pontos de atenção
- **Contrato do backend em aberto:** posição do `nomeFantasia`, código dos dias (1 = domingo?), formato de CPF/CNPJ/telefone/CEP e regra de senha. Todos concentrados em `DIAS_SEMANA` e `adesao.mapper.ts` / `adminUserSchema`; alinhar antes de homologar.
- **CORS e conteúdo misto** na primeira chamada real (ver `docs/INTEGRACAO-BACKEND.md`); este é o primeiro fluxo a exercitar a camada de API, então os problemas aparecerão aqui. A senha trafega em HTTP sem TLS.
- **`nomeFantasia` ainda não aceito pelo backend:** enquanto o campo não existir, o backend pode ignorá-lo ou rejeitar o payload; confirmar antes de testar.
- **Complexidade do array de horários no TanStack Form:** caminhos de erro com índice precisam funcionar com `zodFieldErrors`; é o ponto mais provável de retrabalho.
- **Primeiro uso do `Switch`:** se `gestao-usuarios` for implementado em paralelo, coordenar quem cria o componente para não duplicá-lo.
- **Erro de dado de etapa anterior** (CNPJ duplicado) aparece na etapa final, longe do campo; aceito pelo PRD, a revisar quando o formato de erro for conhecido.

## Fora de escopo técnico
- Erros por campo vindos do backend e navegação automática para a etapa do erro.
- Consulta de CEP/CNPJ em serviços externos e preenchimento automático.
- Horários que atravessam a meia-noite e mais de um intervalo por dia.
- Migrar login, recuperação/alteração de senha e demais telas para a API.
- Persistência de rascunho, HTTPS, proxy/rewrites, CORS e testes automatizados.
