# Design Spec: Adesão ao Sistema

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue o design system em `src/styles/theme.ts` + `src/components/ui`.

## Fluxo geral
Wizard de 2 steps em uma única página (`/adesao`), com indicador de progresso no topo ("Step 1 de 2" / "Step 2 de 2"). Sem navegação lateral — layout centralizado, foco total no formulário.

## Telas/estados

### Layout comum (Step 1 e Step 2)
- Container central (`Card`), largura máxima ~640px em desktop, 100% - padding em mobile.
- Cabeçalho: logo/nome "GIPE" + título do step + stepper (2 bolinhas/traço indicando progresso).
- Rodapé do card: botões de ação (Próximo/Salvar, e Voltar a partir do step 2).

### Step 1 — Dados da empresa
- **Padrão**: formulário com CNPJ, Razão Social, Nome Fantasia, Endereço, Telefone, Tipo de Empresa (select).
- **Validação inline**: erro por campo aparece abaixo do input ao perder foco ou ao tentar avançar (ex: CNPJ inválido, campo obrigatório vazio).
- **Erro de submit**: se a validação falhar ao clicar "Próximo", inputs inválidos ficam com borda `danger` e mensagem de erro; foco vai para o primeiro campo inválido.
- **Loading**: não há chamada ao backend neste step (validação é client-side) — botão "Próximo" não precisa de estado de loading.

### Step 2 — Usuário administrador
- **Padrão**: formulário com Nome, Sobrenome, Email, CPF, Senha, Repetir Senha.
- **Validação inline**: mesmos padrões do Step 1; senha/repetir senha mostram erro "as senhas não coincidem" quando diferentes.
- **Botão "Voltar"**: retorna ao Step 1 mantendo os dados já preenchidos.
- **Loading**: ao clicar "Salvar", botão entra em estado loading (spinner + disabled) enquanto a criação de empresa+usuário é processada.
- **Erro de submit (backend)**: erro geral (ex: CNPJ já cadastrado, e-mail já cadastrado) aparece como banner de erro no topo do card, usando `colors.danger`. Formulário permanece preenchido.
- **Sucesso**: redireciona para a tela de login (`/login`) com uma mensagem de sucesso (toast) "Cadastro concluído! Faça login para continuar."

## Componentes

### Reaproveitados de `src/components/ui`
- `Button` (`variant="primary"` para Próximo/Salvar, `variant="secondary"` para Voltar).

### Novos componentes de design system (a criar em `src/components/ui`, pois serão reaproveitados por outras features do fluxo spec-driven, ex: cadastro de usuários, cadastro de empresa conveniada)
- `Card`: container com `background: colors.surface`, `border-radius: radii.lg`, padding em `space`, usado como wrapper de formulários/telas centradas (autenticação também vai precisar).
- `Input`: campo de texto com label, mensagem de erro opcional (`variant="error"` via borda `colors.danger` + texto `colors.danger` em `fontSizes.xs`), estados default/focus/error/disabled.
- `Select`: mesmo padrão visual do `Input`, para os campos enum (Tipo de Empresa).
- `Stepper`: indicador de progresso simples (bolinhas conectadas por linha), usando `colors.primary` para o step atual/concluído e `colors.border` para os pendentes.
- `Toast` (sucesso): usado para a mensagem pós-cadastro na tela de login; reaproveitável por outras features (ex: recuperação de senha).

## Tokens usados
- Cores: `colors.primary` (ações principais, step ativo), `colors.danger` (erros), `colors.surface`/`colors.background` (card e página), `colors.text`/`colors.textMuted` (labels e texto auxiliar), `colors.border` (bordas de input, steps pendentes).
- Espaçamento: `space[3]`/`space[4]` para padding interno do card e gaps entre campos; `space[5]`/`space[6]` para separar seções (stepper, formulário, ações).
- Tipografia: `fontSizes.lg` para título do step, `fontSizes.md` para labels/inputs, `fontSizes.xs` para mensagens de erro/ajuda.
- Radii: `radii.md` para inputs/select, `radii.lg` para o card.
- Nenhum valor visual novo deve ser hardcoded — se faltar um tom (ex: cor de foco de input), adicionar ao `theme.ts` em vez de usar valor solto.

## Responsividade
- Breakpoint `sm` (480px): card ocupa a largura da tela com padding lateral (`space[3]`), stepper permanece no topo, formulário em coluna única (já é o padrão mobile-first).
- Breakpoint `md`+ (768px): card centralizado com largura máxima (~640px), margem automática, fundo da página em `colors.background` (ou `surface` com o card em `background` para dar contraste).
- Botões de ação (Próximo/Voltar/Salvar) empilham em coluna no mobile e ficam lado a lado (Voltar à esquerda, ação principal à direita) a partir do breakpoint `sm`.
