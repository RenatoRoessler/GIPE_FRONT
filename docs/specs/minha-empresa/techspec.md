# Tech Spec: Minha Empresa

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (via skill claude-design; não há `design.md` separado, a tela é pequena e reaproveita quase tudo da adesão)
- Camada de comunicação: `docs/INTEGRACAO-BACKEND.md` (`src/lib/api`)
- Contratos recebidos: `docs/specs/input.md` (`GET /Empresa` e `PUT /Empresa`)
- Fluxo reaproveitado: `docs/specs/integracao-adesao/techspec.md`

## Design
- **Telas/estados**: página `/minha-empresa` dentro do `AppShell` (já protegida pelo `proxy.ts`). Estados: carregando (esqueleto/texto de carregamento), erro de carga (mensagem + "Tentar novamente"), formulário carregado, salvando, erro ao salvar (`ErrorBanner` no topo da página) e sucesso (`Toast`).
- **Composição**: título "Minha empresa" + descrição, seguido de 2 seções em accordion ("Dados da empresa" e "Funcionamento") e, ao final, a barra de ações ("Descartar alterações" e "Salvar"). A terceira seção ("Usuário titular") não existe nesta versão (ver Decisões). As duas seções começam abertas em desktop para mostrar todos os dados de uma vez; o usuário recolhe o que não precisa.
- **Accordion**: cada item tem cabeçalho clicável com título, resumo curto quando recolhido (ex.: "Funcionamento: 5 dias abertos") e indicador de erro (borda/ícone em `danger`) quando há campo inválido dentro. Conteúdo recolhido permanece montado (apenas oculto), para não perder o que foi digitado.
- **Barra de ações**: "Salvar" só fica habilitado quando há alteração (`isDirty`) e não há envio em andamento; "Descartar alterações" também depende de `isDirty`. Em mobile os dois botões ocupam a largura toda.
- **Componentes do design system reaproveitados**: `Card`, `Button`, `Text`, `Input`, `Select`, `Toast`, `TextField`/`SelectField`/`SwitchField` (`src/components/form`), `Grid`/`GridItem` e os campos de adesão já prontos (`CompanyStepFields`, `BusinessHoursStepFields`), que trazem máscaras, validação, busca de CEP e "Copiar segunda para os outros dias".
- **Componentes novos**:
  - `Accordion` / `AccordionItem` em `src/components/ui/Accordion/` (`Accordion.tsx`, `Accordion.styles.ts`, `index.ts`).
  - `ErrorBanner` extraído de `OnboardingWizard.styles.ts` para `src/components/ui/ErrorBanner/` (passa a ser usado por duas telas).
  - `MinhaEmpresa` em `src/components/empresa/MinhaEmpresa/` (container: consulta, formulários, salvamento) e `EmpresaForm` no mesmo diretório (formulários já com dados carregados).
  - Ícone `company` em `src/components/layout/Sidebar/NavIcons.tsx` e item de menu.
- **Tokens de tema**: nenhum novo. Cores `danger`, `border`, `surface` e escala `space[*]` do `theme.ts`; nada hardcoded.

## Arquitetura da solução

### Rota e navegação
- `src/app/(app)/minha-empresa/page.tsx`: Server Component simples que renderiza `<MinhaEmpresa />`.
- `src/lib/nav.ts`: `NavIconId` ganha `"company"` e `NAV_ITEMS` ganha `{ label: "Minha Empresa", href: "/minha-empresa", icon: "company" }`. O ícone entra em `NavIcons.tsx`, seguindo o padrão dos existentes.

### Serviço e mapeamento (`src/lib/api/services/`)
```
empresa.ts          # getEmpresa(): Promise<EmpresaFormValues>; updateEmpresa(values): Promise<void>
empresa.mapper.ts   # fromEmpresaResponse(dto) e toEmpresaPayload(values): funções puras
```
- Endpoints: `GET /Empresa` e `PUT /Empresa` (a `baseURL` já inclui `/api/v1`). O token já é anexado pelo interceptor de `client.ts`; a empresa é identificada pelo token (claim `empresa_guid`), então não há id na URL.
- `EmpresaDto` (corpo do `PUT` do `input.md`; **a resposta do `GET` é assumida com o mesmo formato**, a confirmar): `razaoSocial`, `nomeFantasia`, `cnpj`, `tipoEmpresa`, `telefone`, `endereco { logradouro, bairro, numero, cidade, estado, cep }`, `quantidadeVagasMoto`, `quantidadeVagasCarro`, `horarios[] { aberto, aberto24Horas, diaDaSemana, horarioAbertura, horarioFechamento }`. Diferente da adesão, **o corpo é plano** (sem o wrapper `empresa`).
- `fromEmpresaResponse(dto): { company: CompanyData; hours: BusinessHoursData }`:
  - Formata para exibição: `formatCNPJ`, `formatPhone`, `formatCEP`; vagas viram string.
  - Horários: localiza cada dia por `diaDaSemana` em `DIAS_SEMANA` (não pela posição no array), ordena na ordem de exibição e preenche com "fechado" qualquer dia ausente. Horas `"HH:mm:ss"` viram `"HH:mm"` (`slice(0, 5)`); `null` vira `""`.
  - Tolerante: campo ausente vira `""`/`false` em vez de quebrar a tela.
- `toEmpresaPayload({ company, hours }): EmpresaPayload`:
  - Mesmos formatos do mapper da adesão: `cnpj`/`telefone` só com dígitos, `cep` com hífen, vagas como inteiros. Reaproveita os helpers (`onlyDigits`, `formatCEP`) e a regra de `aberto24Horas`.
  - Horários: `"HH:mm"` vira `"HH:mm:00"` (formato do exemplo do `PUT`); dia fechado ou 24 horas envia `null` nas duas horas, como na adesão. `diaDaSemana` vem de `DIAS_SEMANA[i].codigo`.
  - Para evitar duplicar a lógica de endereço/horários, extrair de `adesao.mapper.ts` as funções internas `toEnderecoPayload` e `toHorariosPayload` e importá-las nos dois mapeadores.
- Erros: os serviços não capturam; o `ApiError` (já normalizado em `client.ts`) sobe para o React Query.
- Nunca logar token nem payload.

### Dados e estado (Client Components)
```
src/components/empresa/MinhaEmpresa/MinhaEmpresa.tsx   # useQuery, estados de carga/erro
src/components/empresa/MinhaEmpresa/EmpresaForm.tsx    # formulários, accordion, salvar/descartar
src/components/empresa/MinhaEmpresa/MinhaEmpresa.styles.ts
src/components/empresa/MinhaEmpresa/index.ts
```
- `MinhaEmpresa`: `useQuery({ queryKey: ["empresa"], queryFn: getEmpresa, refetchOnWindowFocus: false })`. Enquanto carrega mostra "Carregando…"; em erro mostra `ErrorBanner` com a mensagem do `ApiError` e `Button` "Tentar novamente" (`refetch`). Só quando há dado monta `<EmpresaForm initial={data} />`.
- `EmpresaForm` recebe os valores iniciais por prop, e **eles viram `defaultValues`** dos formulários. Assim um refetch não sobrescreve o que o usuário está editando, e não é preciso `useEffect` para popular o formulário.
- Dois `useAppForm` independentes, como na adesão (`companyForm` com `companySchema`; `hoursForm` com `businessHoursSchema`), reaproveitando os mesmos schemas e `zodFieldErrors`. Reaproveita `CompanyStepFields` e `BusinessHoursStepFields` sem alterar o contrato, exceto o item abaixo.
- `CompanyStepFields` ganha a prop opcional `lockCnpj?: boolean` que deixa o campo CNPJ desabilitado (ver Decisões). O valor continua no formulário e segue no `PUT`.
- **Salvar** (um único botão para as duas seções):
  1. `await Promise.all([companyForm.validate("submit"), hoursForm.validate("submit")])` e marca os campos como tocados (`handleSubmit` não é usado diretamente, pois há dois formulários).
  2. Se algum formulário tiver erro, abre a(s) seção(ões) com erro, move o foco ao primeiro campo inválido e interrompe.
  3. Se estiver tudo válido, `useMutation` com `updateEmpresa({ company, hours })`.
  4. `onSuccess`: `queryClient.setQueryData(["empresa"], savedValues)`, `companyForm.reset(savedCompany)` / `hoursForm.reset(savedHours)` (zera `isDirty` com os novos valores-base) e `Toast` de sucesso via `useToast`.
  5. `onError`: `ErrorBanner` com `mutation.error.message` no topo da página, mantendo os dados digitados. O erro some no próximo `mutate`.
- **Descartar**: `companyForm.reset()` e `hoursForm.reset()` voltam aos `defaultValues` (últimos dados salvos), limpam erros e `ErrorBanner`.
- **Proteção contra envio duplicado**: durante `isPending`, "Salvar", "Descartar" e todos os campos ficam desabilitados (prop `disabled` dos campos).
- `isDirty` combinado: `useStore(companyForm.store, s => s.isDirty) || useStore(hoursForm.store, ...)`.
- **Sair com alterações não salvas**: fora desta versão (ver abaixo).

### `Accordion` (`src/components/ui/Accordion/`)
- API composta e controlada, no estilo dos demais componentes da pasta:
```tsx
<Accordion>
  <AccordionItem id="empresa" title="Dados da empresa" summary="..." open={open.empresa}
                 onOpenChange={...} hasError={companyHasError}>
    ...conteúdo
  </AccordionItem>
</Accordion>
```
- Acessibilidade (WAI-ARIA accordion): cabeçalho é `<button aria-expanded aria-controls>` dentro de um título (`<h2>`); o painel é `role="region"` com `aria-labelledby`. Painel recolhido usa o atributo `hidden` (continua montado). Teclado: Enter/Espaço alternam; foco visível via token. Sem animação de altura (respeita `prefers-reduced-motion` e evita bugs de medida); apenas troca de ícone.
- É Client Component (interação). Estilos com `styled-components` e transient props (`$open`, `$hasError`), tokens do tema.

### Server vs Client
- `page.tsx`: Server Component.
- `MinhaEmpresa`, `EmpresaForm`, `Accordion`: Client Components (hooks, estado, formulário).
- Mappers, schemas e utilitários: módulos puros.

### Tipos
- Reaproveita `CompanyData`, `BusinessHoursData` e `DIAS_SEMANA` de `src/types/adesao.ts`. Novo `src/types/empresa.ts` com `EmpresaFormValues = { company: CompanyData; hours: BusinessHoursData }`. Os DTOs ficam em `empresa.mapper.ts`, junto da tradução, como em `adesao.mapper.ts`.

## Decisões técnicas e trade-offs
- **Duas seções, não três:** `GET`/`PUT /Empresa` não tratam usuário titular. Inventar a terceira seção exigiria um endpoint inexistente. Se o time confirmar a necessidade, entra como nova seção com seu próprio serviço, sem alterar o resto.
- **CNPJ somente leitura (premissa):** o CNPJ identifica a empresa; permitir editá-lo na tela é risco maior que benefício. É a leitura conservadora do ponto "A definir" do PRD; se o backend aceitar a troca, basta remover `lockCnpj`.
- **Reuso dos componentes da adesão sem mover de pasta:** `CompanyStepFields` e `BusinessHoursStepFields` já são independentes do wizard. Renomear/mover geraria um diff grande sem ganho agora; fica anotado como refactor futuro (ex.: `components/empresa/fields`).
- **Dois formulários e um "Salvar" coordenado, em vez de um formulário único:** os campos reaproveitados são `withForm` atrelados ao formato de cada formulário. Unificar obrigaria reescrevê-los. Custo: o `Salvar` coordena validação e `reset` dos dois.
- **Dados iniciais como `defaultValues` (formulário montado após o carregamento):** evita `useEffect` + `reset`, evita flash de campos vazios e impede que um refetch apague edições.
- **Conteúdo do accordion sempre montado (oculto):** preserva valores, estado de erro e a busca de CEP; o custo de renderizar campos ocultos é irrelevante nesta tela.
- **Salvar bloqueado sem alterações:** evita `PUT` inócuo e deixa claro o estado da tela.
- **Sem dependência nova:** nada de biblioteca de accordion; o componente é pequeno e segue o design system próprio.
- **Sem testes automatizados:** o projeto não tem runner configurado ainda; mapper e schemas ficam puros, prontos para teste quando houver.

## Verificação
- `npm run lint` e `npm run build`.
- Manual no navegador (desktop e 375px): carga dos dados reais; alternar seções sem perder edição; validação por campo; erro em seção recolhida abre a seção e foca o campo; dia fechado/24h; "Copiar segunda"; busca de CEP; salvar com sucesso e recarregar a página; descartar; clique repetido em "Salvar"; falha de rede e `401`/expiração na carga; erro de validação do backend.
- Conferir no Network o corpo do `PUT` contra o exemplo do `input.md` (corpo plano, `HH:mm:ss`, dígitos em CNPJ/telefone, `null` nos dias fechados).
- **Atenção:** o `PUT` altera dados reais da empresa do token usado. Testar com empresa de teste e restaurar os valores depois.

## Riscos / pontos de atenção
- **Formato do `GET` não documentado:** assumido igual ao do `PUT`. Se vier com wrapper, outros nomes ou horas em outro formato, só `fromEmpresaResponse` muda. Conferir com uma chamada real antes da implementação final.
- **Contrato do backend em aberto:** código dos dias (1 = domingo?), formato de máscaras e comportamento de `null` em horas de dia fechado. Concentrados em `DIAS_SEMANA` e nos mappers.
- **Perfis/permissões:** o usuário atual ainda é um mock (`CurrentUserContext`), sem papel. A tela fica disponível a todo usuário logado e o backend deve ser a barreira de autorização (o token traz o papel `Administrador`). Quando houver sessão real e a spec de permissões, esconder o item de menu e/ou travar a edição por perfil.
- **Alteração do `ErrorBanner`:** a extração toca `OnboardingWizard`; conferir que a adesão segue idêntica.
- **Erro vindo do backend sem detalhe por campo:** só `ApiError.message` (mesma limitação da adesão).
- **Acessibilidade do accordion e foco em campo dentro de seção oculta:** abrir a seção antes de focar o campo; é o ponto mais provável de retrabalho.
- **Token no `input.md`:** o arquivo contém um JWT real nos exemplos `curl`. Remover/invalidar o token e não copiá-lo para código, docs ou logs.

## Fora de escopo técnico
- Seção/edição do usuário titular e troca de senha.
- Alerta de alterações não salvas ao navegar para outra tela.
- Controle de acesso por perfil no front (depende de sessão real e da spec de permissões).
- Erros por campo vindos do backend.
- Horários que atravessam a meia-noite e mais de um intervalo por dia.
- Histórico/auditoria, upload de logo e testes automatizados.
