# Tech Spec: Permissões padrão por perfil

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só referencia e mapeia para código)

## Design
- **Telas/estados**: menu lateral e barra inferior filtrados (com `Skeleton` enquanto o perfil não é conhecido); tela de acesso negado dentro do `AppShell`; ações restritas ocultas dentro das telas; `Toast`/`ErrorBanner` para 403 da API. Detalhes em `design.md`.
- **Componentes do design system reaproveitados**: `InfoCard`, `Text`, `Button`, `Link`, `ErrorBanner`, `Toast`, `Skeleton` (`src/components/ui`).
- **Componentes novos** (nenhum em `src/components/ui`):
  - `src/components/layout/AcessoNegado/` — conteúdo da tela de acesso negado (`AcessoNegado.tsx`, `AcessoNegado.styles.ts`, `index.ts`).
- **Tokens de tema**: nenhum novo. Usa os já existentes (`colors.surface`, `colors.border`, `colors.textMuted`, `space`, `radii`).

## Arquitetura da solução

Princípio: **uma única fonte da matriz** (`src/lib/permissoes.ts`) consumida por três pontos: o proxy (bloqueio de rota), o menu (filtro) e as telas (ações restritas). Nada de `if (perfil === ...)` espalhado.

### 1. Perfil a partir da role do token — `src/lib/session.ts` (editar)
- Hoje `PERFIL_POR_ROLE` só reconhece o nome em texto (`"Administrador"`) e só os 5 perfis de estacionamento. O token passou a trazer a role numérica (`"1"`, claim `.../identity/claims/role`).
- Passar a aceitar **número ou texto**: converter com um `perfilDaRole(valor: unknown): PerfilUsuario | null` que (a) aceita `number` ou string só de dígitos e confere se está em `PERFIL_USUARIO` (usar `isPerfilConhecido` de `src/components/usuarios/perfil.ts`; se criar dependência `lib → components`, mover a checagem para `src/types/usuario.ts`), (b) mantém o mapa por nome para compatibilidade, agora incluindo `AdministradorConveniada`, `GerenteConveniada` e `UsuarioConveniada`.
- A claim pode vir como array (várias roles): usar a primeira reconhecida. Valor desconhecido continua resultando em `perfil: null`.
- `parseSession` precisa rodar também no proxy (edge): usa só `atob`/`TextDecoder`, sem `document`. `getToken` (cookie no navegador) continua só para o cliente; o proxy lê `request.cookies`. Por isso a função de decodificação é separada da leitura do cookie: extrair `parseSession(token)` (já é pura) e garantir que o módulo não importe nada de browser no topo (hoje importa `getToken` de `@/lib/auth` — mover `getSession` para um arquivo cliente ou confirmar que `@/lib/auth` é seguro em edge).

### 2. Matriz de permissões — `src/lib/permissoes.ts` (novo)
```ts
export const AREA = {
  Inicio: "inicio",
  Patio: "patio",             // inclui entrada e saída de veículos
  Caixa: "caixa",             // abrir/fechar, turnos, passagem, movimentos
  CaixaSangria: "caixa.sangria",
  CaixaHistorico: "caixa.historico",
  Precos: "precos",
  Mensalistas: "mensalistas", // manutenção
  NotasFiscais: "notas-fiscais",
  Relatorios: "relatorios",
  Empresa: "empresa",
  Usuarios: "usuarios",
} as const;
export type Area = (typeof AREA)[keyof typeof AREA];
```
- `PERMISSOES_PADRAO: Record<Area, readonly PerfilUsuario[]>` com a matriz do PRD. Alterar a senha própria e `/atualizacoes` não são áreas (abertas a qualquer autenticado).
- `podeAcessar(perfil: PerfilUsuario | null, area: Area, overrides?: PermissoesPorModulo): boolean`:
  - `perfil === null` → só `Inicio` (RF6).
  - `overrides` (opcional) é o gancho para a permissão por módulo (RF7). Hoje **não é passado por ninguém**; o tipo existe para a feature `docs/specs/permissoes/` plugar depois sem mexer nos consumidores.
- `areaDaRota(pathname: string): Area | null` — tabela prefixo → área (`/precos` e filhas → `Precos`, `/usuarios` → `Usuarios`, `/minha-empresa` → `Empresa`, `/notas-fiscais`, `/patio`, `/caixa`, `/mensalistas`, `/relatorios`, `/dashboard` → `Inicio`). `null` = rota sem restrição de área (ex.: `/usuario/editar`, `/atualizacoes`, `/acesso-negado`).
- Testes (`permissoes.test.ts`): uma asserção por linha da matriz × perfil; `perfil: null`; rota sem área; prefixo não confunde `/usuario/editar` com `/usuarios`.

### 3. Bloqueio por URL — `src/proxy.ts` (editar)
- O proxy já barra quem não tem cookie. Acrescentar: com token válido, decodificar o perfil (`parseSession`), resolver `areaDaRota(pathname)` e, se `!podeAcessar(...)`, **redirecionar** para `/acesso-negado`.
- Por que no proxy e não só no cliente: a tela protegida nunca é renderizada nem enviada (nada vaza, nem esqueleto — pedido do design), e também cobre navegações RSC.
- `/acesso-negado` fica fora da checagem de área (evita loop). Token ilegível → tratar como `perfil: null` (só `Inicio`), não como acesso liberado.
- Rotas públicas permanecem como estão.
- Atenção: antes de editar, ler `node_modules/next/dist/docs/` sobre `proxy` (esta versão do Next tem convenções diferentes; `proxy.ts` já existe e é o ponto correto).

### 4. Tela de acesso negado
- `src/app/(app)/acesso-negado/page.tsx` (Server Component): renderiza `<AcessoNegado />`; fica dentro do grupo `(app)` para herdar `AppShell` e manter o menu visível.
- `AcessoNegado` (Client Component só se precisar de foco programático no `h1` via `ref`/`autoFocus`; caso contrário Server). Textos conforme `design.md`; botão "Ir para o início" é `Button` como link para `/dashboard`.
- `metadata.title` próprio e `robots: noindex` desnecessário (área logada).

### 5. Menu e barra inferior
- `src/lib/nav.ts` (editar): cada `NavItem` ganha `area: Area`. Mapeamento: Início→`Inicio`, Gestão de Preços→`Precos`, Gestão de Usuários→`Usuarios`, Mensalistas→`Mensalistas`, Entrada/Saída→`Patio`, Pátio→`Patio`, Caixa→`Caixa`, Notas Fiscais→`NotasFiscais`, Relatórios→`Relatorios`, Minha Empresa→`Empresa`.
- Nova função `navItemsPermitidos(perfil): NavItem[]` (em `nav.ts`) = `NAV_ITEMS.filter(i => podeAcessar(perfil, i.area))`. `BOTTOM_NAV_ITEMS` hoje é constante derivada em tempo de módulo e lança erro se faltar item; passa a ser `bottomNavItemsPermitidos(perfil)` aplicando o mesmo filtro (a derivação de `NAV_ITEMS` e o rótulo curto continuam).
- Consumidores a ajustar: `Gantry.tsx`, `BottomBar.tsx`, `MenuSheet.tsx` — leem `useCurrentUser()` e chamam as funções acima.
- **Carregando**: `useCurrentUser().isLoading` é `true` no servidor e na hidratação (o token só existe no navegador). Enquanto `isLoading`, os três mostram `Skeleton` no lugar dos itens; nunca o menu completo. Mantém altura/largura para evitar layout shift.
- `nav.test.ts` (editar): cobrir filtro por perfil e a barra inferior sem buracos.

### 6. Ações restritas dentro das telas
- Hook `useCan(area: Area): boolean` em `src/hooks/useCan.ts` (novo, Client): `useCurrentUser()` + `podeAcessar`. Retorna `false` enquanto `isLoading` (ação some até o perfil ser conhecido; evita piscar).
- Aplicação (ocultar, não desabilitar, conforme design):
  - `CaixaHeader`/`TurnoAtual`/`CaixaPage` → botão de sangria só com `useCan(AREA.CaixaSangria)`; histórico (`HistoricoTurnosModal` e seu gatilho) só com `CaixaHistorico`.
  - `MinhaEmpresa`/`EmpresaForm`: como a rota já é só do Administrador via proxy, nenhuma ação extra; nada a ocultar.
  - `mensalistas` e `usuarios`: rota inteira já bloqueada; sem ocultação interna.
- Se uma tela não tiver nenhuma ação visível na barra de ações, não renderizar o container vazio.

### 7. Resposta 403 (rede de segurança)
- `ApiError.kind === "forbidden"` já existe (`src/lib/api/errors.ts`, mensagem "Você não tem permissão para realizar esta ação.") e já é tratado em `IndicadoresPatio` e `mensalistas/ListError`.
- Padronizar: helper `mensagemErro(error)` não é necessário; manter o texto do `DEFAULT_MESSAGES.forbidden`. Nas mutações, o `onError` já mostra `Toast` com `error.message`; verificar que as mutações de caixa/preço/usuário/empresa passam por esse caminho. Em listagens com falha de carga, usar `ErrorBanner` sem "tentar novamente" quando `kind === "forbidden"` (como `ListError` já faz).
- `src/lib/queryClient.ts` já marca `forbidden` como não retentável: nenhuma mudança.

## Decisões técnicas e trade-offs
- **Proxy como barreira principal**: garante que o conteúdo proibido não é nem renderizado. Contra: decodificar o JWT sem validar assinatura. Aceitável porque é só experiência de interface (o back valida em toda chamada, como já documentado em `session.ts`); segurança real continua na API.
- **Ocultar em vez de desabilitar**: segue o design e evita menus com becos sem saída.
- **Matriz em um só arquivo, em código**: a regra padrão é estática (vem do back-end); levá-la a configuração só faz sentido quando a feature de permissão por módulo existir. O parâmetro `overrides` fica como gancho tipado, sem implementação.
- **`useCan` retorna `false` enquanto carrega**: preferimos esconder por um instante a mostrar e retirar uma ação.
- **Área por rota, não por componente de página**: evita ter que lembrar de proteger cada `page.tsx` novo; uma rota nova sem área mapeada fica aberta, por isso o teste da matriz lista todas as pastas de `src/app/(app)`.

## Riscos / pontos de atenção
- **Rota nova sem área mapeada fica liberada**. Mitigação: teste que varre `src/app/(app)` e falha se existir rota sem área nem entrada explícita na lista de abertas.
- **Formato da role no token** (numérico vs texto, string única vs array) não está confirmado; tratar os dois e cobrir em `session.test.ts`.
- **Perfis de conveniada fora da matriz** (Gerente/Usuário Conveniada) caem no acesso mínimo (`Inicio`) até a regra ser definida. Pergunta aberta do PRD.
- **Relatórios** e **Mensalistas para consulta** não estão no `input.md`. Provisório: `Relatorios` = Administrador e Gerente; `Mensalistas` = Administrador e Gerente. Ao decidir o contrário, muda só `PERMISSOES_PADRAO`.
- **`/dashboard` para `perfil: null` e Financeiro**: `IndicadoresPatio` chama API do pátio e retorna 403 para perfis sem acesso. A home precisa esconder/trocar esse bloco por `useCan(AREA.Patio)` (já tratado com `forbidden` hoje, mas deve nem tentar a chamada). Incluído nas tasks.
- **Cache do `useSyncExternalStore`/token**: o provider relê o token a cada troca de rota; após troca de perfil por reset/login, o menu atualiza na navegação seguinte. Aceitável.
- **PWA/service worker**: páginas já em cache offline não passam pelo proxy. Verificar se o `sw.js` cacheia rotas autenticadas; se sim, excluí-las.
- **Proxy no edge**: `parseSession` não pode importar APIs de browser; garantir com teste em `proxy.test.ts` (já existe) para cada perfil × rota.

## Fora de escopo técnico
- Tela de configuração e armazenamento de permissões por módulo (`docs/specs/permissoes/`); só deixamos o parâmetro `overrides`.
- Mudanças no back-end ou emissão de permissões dentro do token.
- Validação de assinatura do JWT no front.
- Permissão granular por ação definida pelo administrador.
- Renomear ou reordenar itens do menu.
