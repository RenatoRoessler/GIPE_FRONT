# Tech Spec: Gestão de Usuários

## Referências
- PRD: ./prd.md
- Design: ./design.md (via skill claude-design)

## Design
- Telas/estados: ver `design.md` — listagem (`/usuarios`) com tabela/loading-skeleton/vazio/erro, cadastro (`/usuarios/novo`) e edição (`/usuarios/[id]/editar`), ambas com o mesmo formulário base.
- Componentes reaproveitados: `Button`, `Input`, `Select`, `Text`, `Card`.
- Componentes novos: `Table` (+ `TableHead`/`TableRow`/`TableCell`), `StatusBadge`, `Switch` — todos em `src/components/ui`, genéricos para reaproveitamento futuro (preços, veículos, relatórios também vão precisar de tabela/status).
- Tokens: nenhum novo — `Table`/`StatusBadge`/`Switch` usam `colors.border`/`colors.surface`/`colors.success`/`colors.textMuted`/`colors.primary`/`space`/`radii` já existentes.

## Arquitetura da solução

### Tipos (`src/types/usuario.ts`)
```ts
export enum UserRole {
  Admin = 1,
  Caixa = 2,
  Manobrista = 3,
  Gerente = 4,
}

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.Caixa]: "Caixa",
  [UserRole.Manobrista]: "Manobrista",
  [UserRole.Gerente]: "Gerente",
};

export interface ManagedUser {
  id: string;
  cpf: string;
  nome: string;
  sobrenome: string;
  funcao: UserRole;
  ativo: boolean;
}

export type ManagedUserInput = Omit<ManagedUser, "id" | "ativo"> & { ativo?: boolean };
```
Distinto de `src/types/user.ts` (`CurrentUser`, usado só para o nome exibido no header) — `ManagedUser` é o registro administrado por esta feature.

### Serviço de comunicação mockado (RF9-RF11) — `src/lib/services/usersService.ts`
```ts
// "Backend" de usuários: hoje é um mock em memória (array module-level), mas é o
// único lugar que fala com o backend de usuários — quando a API real existir,
// só as funções deste arquivo mudam (voltam a ser fetch()), as telas não mudam.

let db: ManagedUser[] = [ /* alguns usuários de exemplo, para a listagem não nascer vazia */ ];

export function listUsers(): Promise<ManagedUser[]> { /* delay + retorna cópia de `db` */ }
export function getUser(id: string): Promise<ManagedUser> { /* delay + retorna ou rejeita "Usuário não encontrado" */ }
export function createUser(input: ManagedUserInput): Promise<ManagedUser> { /* delay + cria com id novo (crypto.randomUUID()), ativo: true, adiciona a `db` */ }
export function updateUser(id: string, input: ManagedUserInput & { ativo: boolean }): Promise<ManagedUser> { /* delay + atualiza em `db` ou rejeita "Usuário não encontrado" */ }
```
- Delay simulado (~600-900ms, mesma ordem de grandeza dos outros mocks do projeto).
- Erro real e determinístico: `getUser`/`updateUser` rejeitam quando o `id` não existe em `db` — não há falha aleatória injetada (mesma postura de `src/lib/auth.ts`/`src/lib/mockApi.ts`: mock decidido pela entrada, não randômico).
- `db` guarda estado em memória durante a sessão do navegador (perdido ao recarregar a página) — suficiente para RF6/RF7 (cadastro aparece na listagem) dentro de uma mesma sessão de uso.

### Schema (`src/lib/schemas/usuario.ts`)
```ts
export const userSchema = z.object({
  cpf: z.string().trim().min(1, "Informe o CPF").refine(isValidCPF, "CPF inválido"),
  nome: z.string().trim().min(1, "Informe o nome"),
  sobrenome: z.string().trim().min(1, "Informe o sobrenome"),
  funcao: z.union([z.literal(""), z.nativeEnum(UserRole)]).refine((v) => v !== "", "Selecione a função"),
});
```
Reaproveita `isValidCPF` de `src/lib/cpf.ts` (mesmo padrão de `refactor-base-tecnica`, não duplica a lógica de dígito verificador).

### Camada de formulário
Reaproveita `useAppForm`/`withForm` de `src/components/form` (criados em `refactor-base-tecnica`). Novo field component:
```
src/components/form/SwitchField.tsx   # useFieldContext<boolean>() + <Switch> do design system, usado só na edição (campo "ativo")
```

### Páginas (Client Components — todas usam `useQuery`/`useMutation`/`useAppForm`)
```
src/app/(app)/usuarios/page.tsx                  # listagem — substitui o placeholder criado em estrutura-projeto-logado
src/app/(app)/usuarios/novo/page.tsx             # cadastro
src/app/(app)/usuarios/[id]/editar/page.tsx      # edição (rota dinâmica por id)
```
- Importante: `/usuarios/[id]/editar` (plural, gestão de qualquer usuário por um admin) é **diferente** de `/usuario/editar` (singular, já existe como placeholder da spec `estrutura-projeto-logado` — autoedição do próprio perfil pelo dropdown do header). Não há conflito de rota, mas os nomes são parecidos o suficiente para merecer essa nota.
- `proxy.ts` já protege `/usuarios/:path*` (matcher existente da spec de login funcional) — cobre `/usuarios/novo` e `/usuarios/[id]/editar` automaticamente, sem mudança no proxy.

### Componentes de tela
```
src/components/usuarios/UsersTable/UsersTable.tsx        # tabela + skeleton/vazio, usa listUsers via useQuery(['usuarios'])
src/components/usuarios/UserForm/UserForm.tsx             # form compartilhado por cadastro/edição (useAppForm + userSchema)
```
- `UserForm` recebe uma prop `mode: "create" | "edit"` e (no modo edit) os dados iniciais do usuário (via `useQuery(['usuarios', id], () => getUser(id))`) — mesmo componente, evita duplicar o formulário entre as duas telas.
- `onSubmit` do `UserForm`: modo `create` chama `useMutation({ mutationFn: createUser })`; modo `edit` chama `useMutation({ mutationFn: (input) => updateUser(id, input) })`. Ambos, em `onSuccess`, invalidam a query `['usuarios']` (`queryClient.invalidateQueries`) e navegam para `/usuarios`.

### Componentes de UI novos
```
src/components/ui/Table/Table.tsx + Table.styles.ts + index.ts       # Table, TableHead, TableRow, TableCell
src/components/ui/StatusBadge/StatusBadge.tsx + .styles.ts + index.ts
src/components/ui/Switch/Switch.tsx + .styles.ts + index.ts
```

## Decisões técnicas e trade-offs
- **`UserForm` único para criar/editar**: os campos são os mesmos (só a edição ganha o `Switch` de ativo); duplicar o formulário custaria manter duas cópias de validação/layout em sincronia à toa.
- **Estado mockado vive em `usersService.ts`, não em `useState` da página**: sem isso, dar F5 na listagem depois de cadastrar um usuário mostraria a lista "resetada" de forma confusa; manter no serviço (ainda que só em memória) é o comportamento menos surpreendente dentro de uma sessão, e é exatamente o ponto de ter um serviço central (RF10).
- **Sem falha aleatória no mock**: mantém consistência com os outros mocks do projeto (`auth.ts`, `mockApi.ts`) — comportamento determinístico e testável manualmente, erro só onde faz sentido de verdade (id inexistente).
- **`Table` nasce genérica (não específica de usuários)**: é a primeira tabela do design system e o PRODUCT.md já prevê várias outras listagens (preços, veículos, relatórios) — vale o custo extra de generalizar agora a criar 4 tabelas ad-hoc depois.

## Riscos / pontos de atenção
- Estado mockado em memória (`usersService.ts`) se perde ao recarregar a página — aceitável para este mock, mas pode confundir em QA manual ("cadastrei e sumiu depois do F5"); vale deixar isso claro para quem for testar.
- `Table` sendo o primeiro componente de tabela do design system, o comportamento responsivo (linha → cartão em mobile, ver `design.md`) precisa ser testado com cuidado — é o componente com maior chance de precisar de ajuste depois de visto na prática.
- Migrar o placeholder atual de `/usuarios` (texto estático da spec `estrutura-projeto-logado`) para a listagem de verdade — conferir que nada mais referencia esse placeholder.
- Testar manualmente: cadastrar usuário (válido/inválido), listar, editar (incluindo inativar/reativar), tentar editar um id inexistente (deve mostrar "não encontrado").

## Fora de escopo técnico
- Qualquer chamada de rede real — `usersService.ts` é inteiramente mockado (RF9-RF11 do PRD).
- Persistência entre sessões/recarregamentos (ex. `localStorage`) — fora do pedido do PRD, mock vive só em memória durante o uso.
- Regras de permissão por perfil sobre quem pode acessar `/usuarios` — já registrado como dívida técnica futura em `docs/specs/refactor-base-tecnica/prd.md`.
- Exclusão definitiva de usuário (fora de escopo do PRD).
