# Design Spec: Permissões padrão por perfil

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Esta feature quase não cria telas: ela **filtra** o que já existe (menu, barra inferior, ações dentro das telas) e adiciona uma tela de "acesso negado". Tudo dentro da área logada (`AppShell`).

## Direção

Modo **Operate** (mesma linha de `docs/specs/estrutura-projeto-logado/design.md` e `gestao-usuarios/design.md`): quem usa é o operador no dia a dia. O melhor resultado é o usuário **nunca** esbarrar no que não pode usar. A tela de acesso negado é a rede de segurança, não o caminho normal, então é sóbria e sempre oferece uma saída.

Princípio: **ocultar o que o perfil nunca poderá fazer; desabilitar só quando houver um motivo útil a explicar**. Um menu com itens que levam a "sem permissão" é ruído.

## Componentes do design system

### Reaproveitados (nenhum componente novo em `src/components/ui`)
- **Text** — título e descrição do acesso negado (`variant="muted"` para a explicação).
- **Button** — ação principal "Ir para o início" (`primary`) e, quando fizer sentido, "Voltar" (`secondary`).
- **Link** — alternativa discreta de retorno.
- **InfoCard** — moldura da mensagem de acesso negado, com o mesmo padrão visual dos cartões informativos já usados nas telas.
- **ErrorBanner** — aviso quando a API responde 403 dentro de uma tela permitida (ação negada pelo servidor).
- **Toast** — feedback curto para 403 disparado por uma ação pontual (ex.: salvar), quando um banner fixo seria exagero.
- **Skeleton** — enquanto o perfil ainda não foi resolvido (ver "Carregando").

Nenhum token novo: usar `colors.surface`, `colors.border`, `colors.textMuted`, `colors.danger`/`dangerSoft`, `space`, `radii` do tema existente.

## Telas e estados

### 1. Menu lateral e menu mobile (itens de `NAV_ITEMS`)
- **Padrão**: exibe somente os itens permitidos ao perfil; a ordem e os ícones permanecem os atuais. Sem separador "vazio" nem grupos órfãos: se um grupo ficar sem itens, ele some.
- **Barra inferior (celular)**: os atalhos Início, Entrada e Saída seguem a mesma regra. Perfil sem acesso ao Pátio (ex.: Financeiro) vê só os atalhos permitidos; a barra se reorganiza ocupando a largura disponível, sem buracos.
- **Item "Início"**: sempre visível a quem está autenticado.
- **Carregando perfil**: enquanto o perfil não é conhecido, o menu mostra `Skeleton` no lugar dos itens, nunca o menu completo que depois encolhe (evita piscar itens proibidos).
- **Perfil desconhecido / sem role**: só o mínimo (Início, alterar a própria senha e sair, que ficam no `UserMenu`).

### 2. Acesso negado (acesso por URL direta)
- **Padrão**: dentro do `AppShell` (menu continua visível para o usuário se reorientar), conteúdo centralizado em `InfoCard`: título "Você não tem acesso a esta área", `Text variant="muted"` ("Seu perfil não permite abrir esta tela. Se precisar dela, fale com o administrador da empresa."), `Button primary` "Ir para o início".
- **Sem dados vazados**: a tela protegida não chega a renderizar, nem em esqueleto (o esqueleto revelaria a estrutura).
- **Foco e leitura de tela**: foco no título ao carregar; `role="alert"` não é necessário (é página, não aviso) — título como `h1`.
- Mesma tela para qualquer área negada; não há variações por módulo.

### 3. Ações restritas dentro de telas permitidas
Aplica ao RF4 do PRD. Regra de escolha:
- **Ocultar** a ação quando o perfil não a terá nunca (padrão): "Nova sangria" para Manobrista; botões de edição na tela da empresa para quem só consulta; ações de manutenção de mensalista; ações de gestão de usuários.
- **Desabilitar com explicação** só quando a ação existe para o perfil em outro momento (ex.: depende de estado), com `title`/texto de apoio dizendo o motivo.
- A página continua com layout estável: remover um botão não deve deixar espaço vazio nem mudar o alinhamento dos demais (o container colapsa naturalmente; barra de ações vazia não é renderizada).
- **Tela somente leitura**: se a tela for acessível para consulta mas sem ações de edição, os campos aparecem como texto, não como inputs desabilitados.

### 4. Resposta 403 da API (rede de segurança)
- **Ação pontual** (salvar, excluir, abrir caixa): `Toast` com "Você não tem permissão para fazer isso." e a tela permanece como está.
- **Carga da tela** (listagem que falha com 403): `ErrorBanner` no lugar do conteúdo com o mesmo texto e o `Button secondary` "Ir para o início"; sem botão "Tentar novamente" (repetir não resolve).
- O texto é o mesmo em todo o sistema: sem jargão ("403", "forbidden").

## Matriz visual de referência (o que cada perfil enxerga no menu)

| Item de menu | Admin | Gerente | Caixa | Manobrista | Financeiro |
|---|:-:|:-:|:-:|:-:|:-:|
| Início | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gestão de Preços | ✓ | ✓ | — | — | — |
| Gestão de Usuários | ✓ | — | — | — | — |
| Mensalistas | ✓ | ✓ | — | — | — |
| Entrada / Saída de Veículos | ✓ | ✓ | ✓ | ✓ | — |
| Pátio | ✓ | ✓ | ✓ | ✓ | — |
| Caixa | ✓ | ✓ | ✓ | ✓ | — |
| Notas Fiscais | ✓ | ✓ | — | — | ✓ |
| Relatórios | a definir | a definir | a definir | a definir | a definir |
| Minha Empresa | ✓ | — | — | — | — |

Derivada da matriz do PRD. Pontos ainda em aberto (ver "Questões em aberto" do PRD): Mensalistas para Caixa/Manobrista (consulta), Relatórios e quais telas o Financeiro acessa além de notas fiscais. A decisão final muda só esta tabela, não o desenho.

Dentro de Caixa: **Histórico** só para Admin/Gerente; **Sangria** para Admin/Gerente/Caixa.

## Responsividade
- Breakpoint relevante: `breakpoints.md` (768px), onde o menu lateral vira o menu mobile + barra inferior.
- **Barra inferior**: com menos atalhos, os itens dividem a largura igualmente; o item "Menu" continua sempre presente.
- **Acesso negado**: `InfoCard` com largura máxima confortável no desktop; full-width com margem de `space[3]` no celular; botão principal em largura total abaixo de `breakpoints.sm`.
- **Ações ocultas**: em mobile, onde as ações já empilham, remover uma não pode deixar linha em branco.

## Acessibilidade
- Itens ocultos saem da árvore de acessibilidade (não usar `aria-hidden` num item ainda focável).
- Ação desabilitada com motivo: o motivo é texto acessível associado (`aria-describedby`), não só tooltip.
- Acesso negado: título `h1` recebe foco; botão de retorno alcançável por teclado.
- Contraste de `Text variant="muted"` sobre `InfoCard` dentro do mínimo AA nos dois temas (claro e escuro).

## Fora desta spec de design
- Tela de configuração de permissões por perfil (`docs/specs/permissoes/`).
- Qualquer mudança visual de menu além da filtragem (ícones, ordem, nomes).
