# Design Spec: Autenticação

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Cobre as 3 telas: login, solicitação de recuperação de senha e alteração de senha.

## Componentes do design system

### Reaproveitados
- **Button** (`src/components/ui/Button`) — variantes `primary` (ações principais: Entrar, Recuperar senha, Alterar senha) e `secondary` (ação secundária, se houver). `disabled` nativo cobre o RF7 (botão desabilitado até CPF válido).

### Novos (a criar em `src/components/ui`, seguindo o padrão do Button: `Component.tsx` + `Component.styles.ts` + `index.ts`, transient props `$variant`/`$size`)

- **Input**
  - Props: `label`, `error?`, `type` (`text` para CPF com máscara, `password` para senha), `disabled`.
  - Estados visuais: default, focus (borda `colors.primary`), error (borda `colors.danger` + texto de erro abaixo em `colors.danger`/`fontSizes.xs`), disabled (opacidade reduzida, `cursor: not-allowed`).
  - Usado em: CPF (login, recuperação), senha (login), nova senha e confirmação (alteração de senha).

- **Text**
  - Props: `variant` (`heading` | `body` | `muted` | `error`), `as` opcional.
  - Mapeia para `fontSizes`/`fontWeights`/`colors.text`/`colors.textMuted`/`colors.danger` do tema. Usado em títulos das telas, mensagens de erro de login (RF: credenciais incorretas) e texto de apoio.

- **AuthCard** (container)
  - Card centralizado na tela, largura máxima fixa (ex.: 400px), fundo `colors.background`, borda `colors.border`, `radii.md`, padding `space[5]` (24px desktop) / `space[4]` (16px mobile), sombra sutil opcional.
  - Usado como wrapper das 3 telas (login, recuperação, alteração de senha) — dá consistência visual e resolve responsividade em um só lugar.

- **Toast** (feedback de sucesso/erro global)
  - Variantes `success` (`colors.success`) e `error` (`colors.danger`), texto branco, `radii.sm`, posicionado no canto superior/inferior da tela, com auto-dismiss.
  - Usado no RF9 (toast de sucesso ao solicitar recuperação) e pode ser reaproveitado para outros fluxos futuros do sistema.

- **Link** (texto clicável estilo link, ex. "Esqueci minha senha")
  - Estilizado com `colors.primary`, sem sublinhado padrão, sublinhado no hover. Usado como RF4 (ir para recuperação) e para "Voltar ao login" nas outras telas.

Nenhum token novo é necessário — a paleta atual (`primary`, `danger`, `success`, `surface`, `border`, `text`, `textMuted`) cobre todos os estados previstos.

## Telas e estados

### 1. Tela de login
- **Padrão**: `AuthCard` com título ("Entrar"), `Input` CPF, `Input` senha (type password), `Button` primary "Entrar", `Link` "Esqueci minha senha" abaixo do botão.
- **Loading**: `Button` "Entrar" em estado disabled + label "Entrando..." (ou spinner inline) enquanto autentica.
- **Erro**: CPF ou senha incorretos → `Text variant="error"` acima dos campos ou abaixo do botão ("CPF ou senha inválidos"); campos não ficam com erro individual (erro é da combinação, não de um campo específico). Usuário permanece na tela (RF de aceite).
- **Redirecionamento não autenticado**: qualquer rota protegida acessada sem sessão cai direto nesta tela (sem tela intermediária de "acesso negado").

### 2. Tela de solicitação de recuperação de senha
- **Padrão**: `AuthCard` com título ("Recuperar senha"), `Input` CPF, `Button` primary "Recuperar senha" **disabled** até CPF ser válido (RF7 — validação de formato/dígito verificador em tempo real), `Link` "Voltar ao login".
- **Loading**: `Button` disabled + label "Enviando..." durante a chamada.
- **Sucesso**: `Toast` variant success ("Enviamos um e-mail com instruções para recuperação") — tela permanece a mesma, sem redirecionamento (RF9).
- **Erro** (ex. falha ao enviar): `Toast` variant error com mensagem genérica; campo permanece preenchido.

### 3. Tela de alteração de senha
- **Padrão**: `AuthCard` com título ("Definir nova senha"), `Input` nova senha (password), `Input` confirmar senha (password), `Button` primary "Alterar senha".
- **Validação inline**: se confirmação não bate com a nova senha, `Input` de confirmação entra em estado `error` com mensagem ("As senhas não coincidem") — validação client-side antes de habilitar o submit ou ao perder foco.
- **Token inválido/expirado (RF15)**: em vez do formulário, `AuthCard` mostra estado de erro — `Text variant="error"` explicando que o link expirou/é inválido + `Link`/`Button secondary` "Solicitar novo link" (leva à tela de recuperação). Não renderizar os campos de senha nesse caso.
- **Sucesso**: após salvar, redireciona para a tela de login (RF14) — sem tela de confirmação intermediária; opcionalmente um `Toast` success rápido antes do redirect.

## Responsividade
- Breakpoint relevante: `sm` (480px) — abaixo dele, `AuthCard` ocupa a largura da tela menos `space[4]` (16px) de margem lateral, padding interno reduz para `space[4]`.
- Acima de `sm`: `AuthCard` centralizado vertical e horizontalmente, largura máxima fixa (~400px), fundo da página em `colors.surface` para destacar o card.
- Inputs e botões sempre full-width dentro do card, em todas as resoluções (evita reflow de layout entre breakpoints).
- `Toast` fixo no topo da viewport em mobile e desktop, largura adaptada (full-width com margem em mobile, largura fixa em desktop).
