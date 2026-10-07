# Tasks: Integração do Fluxo de Adesão com o Backend

Referências: ./prd.md, ./techspec.md, ./design.md

- [x] T1 — Criar utilitários de telefone, CEP e estados
  - Arquivos: `src/lib/phone.ts`, `src/lib/cep.ts`, `src/lib/estados.ts`
  - Pronto quando: `formatPhone` aplica máscara para 10 e 11 dígitos; `isValidPhone` aceita 10 ou 11 dígitos; `isValidCelular` exige 11 dígitos com o terceiro sendo 9; `formatCEP` gera `00000-000`; `isValidCEP` exige 8 dígitos; `estados.ts` exporta as 27 UFs `{ sigla, nome }`; `npm run lint` passa e nenhum regex tem backtracking.

- [x] T2 — Atualizar os tipos e constantes da adesão
  - Arquivos: `src/types/adesao.ts`
  - Pronto quando: `CompanyData` tem endereço em 6 campos e vagas (strings); existem `DayHours`, `BusinessHoursData` e `DIAS_SEMANA` (Domingo a Sábado, códigos 1 a 7, 1 = domingo, com comentário [A DEFINIR]); `AdminUserData` tem `nome` completo e `celular`, sem `sobrenome`; `EMPTY_COMPANY_DATA`, `EMPTY_BUSINESS_HOURS_DATA` (seg-sex 08:00-18:00 abertos, sáb/dom fechados) e `EMPTY_ADMIN_USER_DATA` refletem os novos tipos. O projeto pode não compilar até T10; o ajuste dos consumidores vem nas tasks seguintes.

- [x] T3 — Atualizar os schemas de adesão
  - Arquivos: `src/lib/schemas/adesao.ts`
  - Pronto quando: `companySchema` valida CEP, estado (dentro da lista de UFs), vagas (inteiro ≥ 0) e telefone; `businessHoursSchema` exige 7 itens e, para dia aberto sem 24h, abertura e fechamento `HH:mm` com fechamento posterior à abertura, com erros em `["horarios", i, campo]`; `adminUserSchema` valida `nome`, `celular` e mantém CPF, e-mail, senha (mínimo 6) e confirmação.

- [x] T4 — Suportar caminhos de array em `zodFieldErrors`
  - Arquivos: `src/components/form/zodFieldErrors.ts`
  - Pronto quando: um erro com path `["horarios", 2, "horarioAbertura"]` é mapeado para a chave de campo usada pelo TanStack Form (`horarios[2].horarioAbertura`) e os formulários existentes continuam recebendo os mesmos erros por campo.

- [x] T5 — Criar o componente `Switch` do design system
  - Arquivos: `src/components/ui/Switch/Switch.tsx`, `src/components/ui/Switch/Switch.styles.ts`, `src/components/ui/Switch/index.ts`
  - Pronto quando: usa `role="switch"` e `aria-checked`, rótulo visível, estado desabilitado, anel de foco, alvo de toque de pelo menos 44px e apenas tokens do tema. Antes de criar, conferir se o componente já existe (spec `gestao-usuarios`) e, se existir, reaproveitá-lo.

- [x] T6 — Criar `SwitchField` e registrá-lo no formulário
  - Arquivos: `src/components/form/SwitchField.tsx`, `src/components/form/form.ts`
  - Pronto quando: `SwitchField` usa `useFieldContext<boolean>()` com o `Switch` e está disponível como `field.SwitchField` em `useAppForm`.

- [x] T7 — Criar o mapper e o serviço da adesão
  - Arquivos: `src/lib/api/services/adesao.mapper.ts`, `src/lib/api/services/adesao.ts`
  - Pronto quando: `toAdesaoPayload` gera o JSON do exemplo de `docs/input.md` (`empresa` com `nomeFantasia` e `endereco` aninhado, `horarios` com `diaDaSemana` de `DIAS_SEMANA`, `usuario` sem `repetirSenha`); `cnpj`, `cpf`, `telefone` e `celular` saem só com dígitos, `cep` com hífen e vagas como inteiros; dias fechados ou 24 horas enviam horários `null`; `saveAdesao` faz `POST /Adesao` pela instância `api` e deixa o `ApiError` subir; nada é logado.

- [x] T8 — Ampliar a etapa "Dados da empresa"
  - Arquivos: `src/components/adesao/CompanyStepFields/CompanyStepFields.tsx`
  - Pronto quando: a grade segue `design.md` (CNPJ, razão social, nome fantasia, tipo, telefone, CEP, logradouro, número, bairro, cidade, estado com `Select` de UFs, vagas de moto e carro), com máscaras de telefone e CEP e erros por campo após o toque; o campo único "Endereço" some.

- [x] T9 — Criar a etapa "Funcionamento"
  - Arquivos: `src/components/adesao/BusinessHoursStepFields/BusinessHoursStepFields.tsx`, `src/components/adesao/BusinessHoursStepFields/BusinessHoursStepFields.styles.ts`, `src/components/adesao/BusinessHoursStepFields/index.ts`
  - Pronto quando: renderiza 7 linhas de Domingo a Sábado com `Switch` "Aberto", `Switch` "24 horas" e campos `type="time"`; fechado desabilita "24 horas" e horários, 24 horas desabilita os horários, e desmarcar "Aberto" desmarca "24 horas"; erros por linha aparecem nos campos corretos; o botão "Copiar segunda para os outros dias" replica o estado da segunda; cada linha é um grupo com `aria-label` do dia; layout em blocos empilhados abaixo de `breakpoints.sm` e em colunas acima, só com tokens do tema.

- [x] T10 — Ajustar a etapa "Usuário titular"
  - Arquivos: `src/components/adesao/AdminUserStepFields/AdminUserStepFields.tsx`
  - Pronto quando: a grade segue `design.md` (Nome completo em largura total; CPF e Celular com máscara; E-mail; Senha e Repetir senha); o campo "Sobrenome" some.

- [x] T11 — Integrar as 3 etapas e o envio real no `OnboardingWizard`
  - Arquivos: `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx`
  - Pronto quando: `STEPS` tem 3 itens; há três `useAppForm` com validação por etapa; "Voltar" preserva o que foi preenchido; a mutation chama `saveAdesao` com empresa, horários e titular; "Salvar" e os campos ficam desabilitados durante o envio; o `ErrorBanner` mostra `mutation.error.message` e some em um novo envio com sucesso; o sucesso redireciona para `/login?cadastro=sucesso`; o foco vai para o título ao trocar de etapa.

- [x] T12 — Remover o mock de adesão
  - Arquivos: `src/lib/mockApi.ts`
  - Pronto quando: `mockSaveOnboarding` foi removido, uma busca no projeto confirma que nada mais o referencia e as demais funções do arquivo permanecem.

- [~] T13 — Verificação final
  - Arquivos: nenhum (execução de comandos)
  - Pronto quando: `npx tsc --noEmit`, `npm run lint` e `npm run build` passam; o corpo enviado, conferido no Network ou por script, corresponde ao exemplo de `docs/input.md` (formato dos dias, `null` nos horários fechados, sem `repetirSenha`); a validação manual em 375px e desktop cobre campos novos, os três estados de horário, "Voltar", clique repetido, erro de rede, erro de validação do backend e sucesso com redirect. O que não puder ser testado (ex.: backend sem `nomeFantasia`, CORS, cadastros de teste no backend) é reportado como pendente. Cada envio real grava dados no backend: usar CNPJ/CPF/e-mail de teste identificáveis.
