# Design Spec: Integração da Gestão de Usuários

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Cobre a listagem, o cadastro em duas etapas (CPF → dados), a edição de perfil e status e a troca da própria senha. Todas as telas ficam na área logada (`AppShell`) e substituem o stub atual de `/usuarios` e `/usuario/editar`.

## Direção

Modo **Operate**, tela administrativa de desktop primeiro (ver `PRODUCT.md`). Prioriza duas coisas:

1. **Escaneabilidade da tabela**, para o Administrador saber de relance quem tem acesso e com qual perfil.
2. **Clareza das consequências.** Cada ação diz o que muda, para quem e quando passa a valer ("só nesta empresa", "no próximo login"). É o ponto de confiança da tela. Dar acesso e retirar acesso são decisões de segurança, então o texto da interface é tão importante quanto o layout.

Não há layout ousado aqui: é uma listagem com modais, no mesmo padrão visual das outras telas administrativas. A "diferença" está na linguagem: o perfil aparece sempre como texto, o estado como texto e cor juntos.

## Componentes do design system

### Reaproveitados (todos já existem em `src/components/ui`)
- **Table / TableHead / TableBody / TableRow / TableCell**: listagem. O `data-label` de cada célula vira o rótulo no cartão mobile.
- **StatusBadge**: `tone="success"` para Ativo, `tone="neutral"` para Inativo. Perfil usa `tone="info"`.
- **Button**: `primary` ("Novo usuário", "Continuar", "Salvar"), `secondary` ("Cancelar", "Editar"), `danger` (inativar, via `ConfirmDialog`).
- **Modal**: cadastro em etapas e edição (`size="sm"`; `fullScreenOnMobile` ligado).
- **ConfirmDialog**: confirmar inativação e rebaixamento de Administrador.
- **Input**: CPF, nome, e-mail, celular, senha atual e nova senha (com `error` inline).
- **Select**: perfil.
- **Switch**: "Acesso ativo" na edição.
- **PasswordRequirements**: ao lado da nova senha (a regra desta tela é mínimo de 6 caracteres e diferente da atual; ver "Pontos de atenção").
- **Skeleton**: carregamento da tabela e dos campos.
- **ErrorBanner**: erro de carregamento da lista e erros de regra da API dentro do modal.
- **Toast**: sucesso e erro após uma operação concluída.
- **Pagination**: não usada na v1 (a API devolve a lista inteira); ver "Fora do desenho".
- **Text**: títulos, mensagens de vazio e textos de apoio.

### Novos
Nenhum componente novo no design system. Duas peças específicas da feature, em `src/components/usuarios/`:

- **PerfilBadge**: mapeia o enum de perfil para rótulo em português + `StatusBadge`. Rótulos: 1 Administrador, 2 Gerente, 3 Manobrista, 4 Caixa, 8 Financeiro. Fica na feature porque depende do enum de usuários.
- **UsuarioCpfLookup**: campo de CPF com ação "Continuar" e os quatro resultados da consulta (ver tela 2).

## Telas e estados

### 1. Listagem (`/usuarios`)

**Cabeçalho:** título "Gestão de Usuários" e, à direita, `Button` primary "Novo usuário". No mobile o botão vai para baixo do título, em largura total.

**Tabela (desktop):** colunas **Nome** (com e-mail em `Text variant="muted"` na linha de baixo), **CPF** (com máscara), **Celular**, **Perfil** (`PerfilBadge`), **Status** (`StatusBadge`), **Criado em** (data curta) e **Ações** ("Editar", `secondary`, `sm`).

Ordem das linhas: a da API. Linhas inativas ficam com o texto em `colors.textMuted` para separar visualmente quem ainda tem acesso.

O usuário logado ganha o sufixo "(você)" ao lado do nome. Isso evita que o Administrador tire o próprio acesso sem perceber.

Estados:
- **Carregando:** 5 linhas de `Skeleton` com o mesmo número de colunas, sem salto de layout quando os dados chegam.
- **Vazio:** praticamente impossível (o próprio Administrador está na lista). Se acontecer, `Text variant="muted"` "Nenhum usuário encontrado." e botão "Novo usuário".
- **Erro de carregamento:** `ErrorBanner` com a mensagem e `Button secondary` "Tentar novamente".
- **Sucesso:** `Toast` "Usuário atualizado." depois de qualquer mudança vinda dos modais; a tabela é recarregada.

**Mobile (< `breakpoints.md`):** cada linha vira um cartão (comportamento já do `Table` via `data-label`): Nome em destaque, depois Perfil e Status lado a lado, depois CPF, Celular e Criado em, e "Editar" em largura total ao final.

### 2. Novo usuário (modal em 2 etapas)

Modal `size="sm"`, título "Novo usuário". O indicador de etapa é só texto ("Etapa 1 de 2"), sem `Stepper`, já que são só duas etapas curtas.

**Etapa 1: CPF**
- Campo CPF com máscara. Botão `primary` "Continuar", desabilitado até o CPF ser válido (dígito verificador), com erro inline "CPF inválido" ao perder o foco.
- Enquanto consulta: botão "Consultando…" desabilitado, campo travado.
- Resultado da consulta, nesta ordem de decisão:
  1. **CPF não encontrado:** segue direto para a etapa 2 (formulário completo).
  2. **Encontrado e não vinculado:** segue para a etapa 2 em modo "conferência".
  3. **Encontrado e já vinculado à empresa:** permanece na etapa 1, com `ErrorBanner` (tom informativo) "Esta pessoa já tem acesso a esta empresa." e um link "Editar usuário" que fecha o modal e abre a edição dele. Não há botão para avançar.
  4. **Erro de rede ou da API:** `ErrorBanner` com a mensagem e o campo continua editável.

**Etapa 2a: pessoa nova (CPF não encontrado)**
- Campos: Nome, E-mail, Celular (`Input`) e Perfil (`Select`), todos obrigatórios, com erro inline por campo.
- Texto de apoio abaixo do perfil: "Uma senha temporária será enviada para o e-mail informado. No primeiro acesso, a pessoa será obrigada a trocá-la."
- Rodapé: `secondary` "Voltar" (volta ao CPF sem apagar nada) e `primary` "Cadastrar usuário" ("Cadastrando…" enquanto salva).

**Etapa 2b: pessoa já cadastrada no GIPE (conferência)**
- Bloco de leitura com Nome, E-mail e Celular, com fundo `colors.surface`, sem aparência de campo editável. Rótulo: "Dados da pessoa (apenas conferência)". Texto de apoio: "Estes dados pertencem à própria pessoa e não são alterados por aqui."
- Único campo editável: Perfil (`Select`).
- Texto de apoio: "A pessoa mantém a senha atual e receberá um e-mail avisando do novo acesso."
- Rodapé: `secondary` "Voltar" e `primary` "Dar acesso".

**Sucesso:** o modal fecha, a lista recarrega e aparece um `Toast`. A mensagem muda conforme o caso: "Usuário criado. Senha temporária enviada por e-mail." ou "Acesso concedido. A pessoa foi avisada por e-mail."

**Erro ao salvar:** `ErrorBanner` no topo do modal; o formulário permanece preenchido.

### 3. Editar usuário (modal, `/usuarios` com o modal aberto)

Aberto pelo "Editar" da linha. Título "Editar usuário"; abaixo, nome, CPF e e-mail em leitura. Não há campos de dado pessoal editáveis.

- **Perfil** (`Select`) com os cinco perfis.
- **Acesso** (`Switch` "Acesso ativo nesta empresa"). Texto de apoio: "Desativar tira o acesso apenas a esta empresa. As outras empresas da pessoa não mudam."
- Aviso fixo (tom neutro) abaixo dos controles: "Mudanças de perfil e de acesso valem a partir do próximo login da pessoa."
- Rodapé: `secondary` "Cancelar" e `primary` "Salvar", desabilitado enquanto nada mudou.

Perfil e acesso são salvos como duas chamadas independentes. O botão "Salvar" dispara só as que mudaram. Se uma falha, a outra continua aplicada, e o `ErrorBanner` diz exatamente qual não foi salva.

**Confirmações (`ConfirmDialog`):**
- Desativar acesso: título "Tirar o acesso de {nome}?", mensagem "Ela perde o acesso apenas a esta empresa, a partir do próximo login." Botão `danger` "Tirar acesso".
- Rebaixar o perfil Administrador (de 1 para outro): título "Remover perfil de Administrador?", mensagem com a consequência. Botão `danger` "Rebaixar".

**Regra do último Administrador ativo:** quando o usuário editado é o único Administrador ativo, o `Select` de perfil e o `Switch` ficam desabilitados e um texto de apoio explica: "Esta é a única pessoa com perfil de Administrador ativo. Defina outro Administrador antes de alterar o perfil ou o acesso." Se a API recusar mesmo assim, o erro dela aparece no `ErrorBanner`.

**Editar a si mesmo:** vale o mesmo comportamento, com o aviso extra "Você está editando o seu próprio acesso." acima dos controles.

**Estados:** carregando o usuário (esqueleto nos campos), salvando (botão "Salvando…", controles desabilitados), erro (`ErrorBanner`), sucesso (modal fecha + `Toast`).

### 4. Alterar minha senha

Acessível a qualquer perfil. Não pertence à gestão de usuários, então o ponto de entrada fica no `UserMenu` (item "Alterar senha"), que abre um modal `size="sm"`.

- Campos: **Senha atual**, **Nova senha**, **Confirmar nova senha** (`Input type="password"` com a mesma alternância de visibilidade usada no login).
- `PasswordRequirements` abaixo da nova senha mostra os critérios desta tela (mínimo de 6 caracteres e diferente da atual) com ✓ / •, sempre também em texto.
- Texto de apoio fixo: "Sua senha vale para todas as empresas em que você tem acesso. Você continuará logado neste dispositivo."
- Rodapé: `secondary` "Cancelar" e `primary` "Alterar senha", desabilitado até todos os critérios serem atendidos e a confirmação bater.
- **Senha atual incorreta:** erro inline no campo "Senha atual" e os demais campos mantêm o valor.
- **Sucesso:** o modal fecha e um `Toast` mostra "Senha alterada."

Rota `/usuario/editar` (stub atual) fica sem uso para a edição de outro usuário; ver "Pontos de atenção".

## Tokens usados

Nenhum token novo.

- Cores: `colors.surface` (bloco de conferência, cabeçalho da tabela), `colors.border` (divisórias), `colors.textMuted` (linhas inativas, textos de apoio), `colors.success`/`danger` via `StatusBadge`, `Button` e `ErrorBanner`.
- Espaçamento: escala `space` (8/16/24); gaps entre campos no modal em `space[3]`.
- Tipografia: `fontSizes.sm` para apoio e linha secundária da célula, `md` para o corpo, `typography.display` apenas no título da página.
- Raios: `radii.md` nos blocos de leitura.

## Responsividade

- `>= breakpoints.md`: tabela completa; modais centralizados com `size="sm"`.
- `< breakpoints.md`: tabela em cartões (via `data-label`); botão "Novo usuário" em largura total; modais em tela cheia (`fullScreenOnMobile`) com o rodapé de ações fixo e sempre visível; `ConfirmDialog` continua como diálogo curto.
- Alvos de toque de 44px nas ações de linha e no `Switch`.

## Acessibilidade (WCAG 2.2 AA)

- Perfil e status são sempre texto; a cor só reforça (como `StatusBadge` já garante).
- Cada botão "Editar" tem nome acessível com o usuário: `aria-label="Editar {nome}"`.
- Erros inline ligados aos campos via `aria-describedby`; erros de API em `ErrorBanner` com `role="alert"`.
- Foco: ao abrir o modal, vai para o primeiro campo (CPF na etapa 1; Select de perfil na edição); ao fechar, volta ao botão que o abriu (o `Modal` baseado em `<dialog>` já faz isso). Ao trocar de etapa, o foco vai para o título da nova etapa.
- `ConfirmDialog` abre com foco em "Cancelar", para evitar confirmação acidental de ação destrutiva.
- Controles desabilitados pela regra do último Administrador têm a explicação no texto vinculado com `aria-describedby`, não só no `title`.
- Resultado do `Toast` anunciado por região `aria-live` (comportamento do componente existente).

## Textos (pt-BR)

Perfis: Administrador, Gerente, Manobrista, Caixa, Financeiro. Status: Ativo / Inativo. Evitar "usuário deletado" ou "removido": a ação é sempre "tirar o acesso" / "inativar", e a mensagem diz que vale só nesta empresa.

## Fora do desenho

- Paginação, busca e filtros: a API não pagina nem filtra; uma empresa tem poucos usuários. Se a lista crescer, `Pagination` e um campo de busca entram em outra spec.
- Reenvio de senha temporária e exclusão definitiva de usuário.
- Edição de nome, e-mail e celular de outra pessoa.

## Pontos de atenção para o Tech Spec

- **Rota de edição:** a edição foi desenhada como modal sobre `/usuarios`. O stub `/usuario/editar` deve ser removido ou redirecionar para `/usuarios`; confirmar com o dono do produto.
- **Regra de senha:** `PasswordRequirements` hoje usa `getPasswordRuleResults` de `@/lib/password`, com as regras do cadastro/recuperação. A troca de senha tem regra própria (mínimo de 6 e diferente da atual); o Tech Spec precisa decidir entre parametrizar o componente ou exibir uma lista própria.
- **Quem é o usuário logado** (para "(você)" e para a regra de edição de si mesmo) precisa vir da sessão; o Tech Spec define a fonte.
- **Contagem de Administradores ativos** para desabilitar os controles pode ser calculada a partir da lista carregada; a API continua sendo a palavra final.
- **Perfil Financeiro (8):** o rótulo e o `Select` já o incluem, mas ele só deve ser liberado depois que o PRD de Permissões definir o que ele enxerga.
