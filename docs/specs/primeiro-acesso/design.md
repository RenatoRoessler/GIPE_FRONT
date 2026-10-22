# Design Spec: Primeiro Acesso

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Cobre uma única tela pública, fora da área logada, que aparece entre o login e o sistema quando a senha precisa ser trocada.

## Direção

Fluxo de acesso (mesma família visual de `/login`, `/recuperar-senha` e `/alterar-senha`), não tela de gestão. O usuário acabou de digitar uma senha que veio por e-mail e está num momento de dúvida ("por que não entrei?"). A tela precisa, nesta ordem:

1. **Explicar o motivo** em uma frase: não é erro, é uma etapa obrigatória da primeira entrada.
2. **Mostrar o que fazer**: criar uma senha própria, com o checklist à vista.
3. **Dizer o que vem depois**: "depois você entra com a nova senha". Isso evita a surpresa de voltar ao login.

Sem ousadia visual: é uma tela de confiança e segurança. A composição reaproveita o padrão que o usuário já viu na recuperação de senha, para parecer parte do mesmo processo.

## Componentes do design system

Tudo já existe; nenhum componente novo em `src/components/ui`, nenhum token novo.

- **AuthCard** (`title`, `subtitle`), **Form**, **Footer**: moldura da tela, igual à de "Definir nova senha".
- **TextField** do `useAppForm` (sobre `Input type="password"`): nova senha e confirmação, com alternância de visibilidade.
- **PasswordRequirements**: checklist padrão do cadastro (8 caracteres, maiúscula, minúscula, número, símbolo), sem a prop `rules`.
- **Button** `primary`: ação única.
- **Text** `variant="error"` com `role="alert"`: erros da operação.
- **Link**: caminho de volta ao login.
- **Toast**: não é usado aqui. O aviso de sucesso aparece no login (`LoginForm` já tem a mensagem "Senha alterada! Faça login com a nova senha.").

## Tela e estados

### 1. Primeiro acesso (`/primeiro-acesso`)

**Estrutura (de cima para baixo)**
- Título do card: **"Crie sua senha"**.
- Subtítulo: **"Este é o seu primeiro acesso. Para continuar, troque a senha temporária por uma senha só sua."** É a mensagem do back ("Altere sua senha para continuar.") dita com mais contexto, sem depender do texto dele.
- Campo **Nova senha** (`autoComplete="new-password"`).
- `PasswordRequirements` logo abaixo do campo, antes da confirmação, como na recuperação de senha.
- Campo **Repetir senha** (`autoComplete="new-password"`).
- Texto de apoio (`Text variant="muted"`) acima do botão: **"Depois de salvar, você volta ao login e entra com a nova senha."**
- Botão primary: **"Salvar nova senha"**.
- Rodapé (`Footer`): link **"Voltar ao login"**.

**Estados**
- **Padrão:** botão desabilitado até a senha cumprir todos os requisitos e a confirmação bater (mesmo critério da recuperação de senha). O foco inicial vai para "Nova senha".
- **Digitando:** o checklist atualiza item a item; cada requisito é dito em texto ("cumprida"/"pendente") além do marcador, como o componente já faz.
- **Confirmação diferente:** erro inline no campo "Repetir senha", exibido ao sair do campo ou ao tentar enviar.
- **Salvando:** botão desabilitado com o rótulo **"Salvando..."**; os dois campos ficam desabilitados.
- **Erro do back (regra da senha, conexão, servidor):** `Text variant="error"` com `role="alert"` acima do botão, com a mensagem do back; os campos mantêm o que foi digitado e o botão volta a ficar disponível.
- **Sucesso:** redireciona para `/login` com o aviso de senha alterada. Não há estado de sucesso nesta tela.

### 2. Estado "prazo expirado ou token recusado"

Quando o back recusa o token de troca (expirado, inválido), a tela troca o conteúdo do card, no mesmo padrão do "Link inválido" da recuperação de senha:

- Título: **"Não foi possível trocar a senha"**.
- `Text variant="error"` com `role="alert"`: **"O tempo para criar sua senha acabou. Entre novamente com a senha temporária para recomeçar."**
- Rodapé: botão/link primário **"Ir para o login"**.

Qualquer outro erro do back (por exemplo, senha recusada por regra própria) **não** usa este estado: fica no formulário, como descrito acima, para o usuário corrigir sem perder o que digitou.

### 3. Acesso direto sem passar pelo login

Sem o token de troca (endereço digitado, página recarregada), a tela não mostra formulário nenhum: redireciona imediatamente para `/login`. Não há tela intermediária e não há mensagem de erro, porque o usuário não fez nada de errado. O Tech Spec decide o mecanismo (servidor ou cliente), garantindo que o formulário nunca pisque na tela antes do redirecionamento.

### 4. Alteração no login (`/login`)

Nenhuma mudança visual. Ao receber a resposta que exige troca de senha, o login **não** mostra erro nem toast: a transição para a tela de primeiro acesso é a resposta. Enquanto a requisição de login corre, vale o estado "Entrando..." que já existe.

## Tokens usados

Nenhum token novo. Tudo vem do `AuthCard`, `Input`, `Button`, `Text` e `PasswordRequirements` existentes: `colors.danger` e `colors.textMuted` pelo `Text`, `space` e `radii` pelo `AuthCard`. O tema da tela é o do fluxo de acesso (claro e escuro "Confiança Azul / Grafite Coral"), não o de sinalização da área logada.

## Responsividade

Igual às demais telas de acesso: card centralizado, largura limitada em desktop e ocupando a largura útil em mobile. Abaixo de `breakpoints.sm` o card mantém o respiro lateral do `AuthCard`; o botão ocupa a largura toda (como no login). O checklist quebra em linhas curtas sem rolagem horizontal. Alvo de toque mínimo de 44px no botão e no alternador de visibilidade da senha.

## Acessibilidade (WCAG 2.2 AA)

- Foco inicial em "Nova senha" ao abrir; `autoFocus` só nesse campo.
- Cada campo com `label` visível; erro ligado ao campo por `aria-describedby` (comportamento do `Input`).
- Erros da operação em `role="alert"`, anunciados sem mover o foco.
- Requisitos de senha comunicados em texto, não só por cor ou marcador.
- Alternância de visibilidade da senha com nome acessível (já no `Input`).
- Título da página (`<title>`) próprio: **"Primeiro acesso — GIPE"**, para o leitor de tela anunciar a mudança de contexto depois do login.
- O token de troca nunca aparece na interface, em `aria-label` ou em `title`.

## Textos (pt-BR)

Tom direto e tranquilizador; "senha temporária" e "senha nova" sempre com os mesmos nomes, sem "token" ou "código" na tela. Nada de "erro de login" nem "acesso negado": a pessoa acertou a senha temporária.

## Fora do desenho

- Entrar direto no sistema após a troca.
- Escolher empresa nesta tela.
- Indicador de tempo restante para concluir a troca (o prazo não está documentado).
- Opção de "lembrar" login nesta tela: a credencial lembrada, se existir, é a senha temporária e deve ser descartada ao trocar.

## Pontos de atenção para o Tech Spec

- **Rota pública:** `/primeiro-acesso` precisa entrar na lista de rotas sem login do `src/proxy.ts`.
- **Transporte do token de troca:** não pode ir na URL (PRD, RF-01). Precisa de um mecanismo em memória entre `/login` e `/primeiro-acesso`, sem persistência, e que sobreviva à navegação do cliente mas não ao recarregamento.
- **Credencial lembrada:** se "lembrar login" estiver ativo, o login não deve gravar a senha temporária como lembrada; ao trocar a senha, a lembrada antiga deve ser limpa. Definir no Tech Spec.
- **Reaproveitamento:** a tela é muito parecida com `ResetPasswordForm` (mesmo esquema de senha e confirmação, mesmo checklist). Avaliar compartilhar o formulário em vez de duplicar, mantendo textos e destino próprios.
- **Mensagem de sucesso no login:** reaproveitar `?senha=alterada`, que já existe em `LoginForm`.
