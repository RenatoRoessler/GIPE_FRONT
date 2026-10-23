# Design Spec: Adicionar nova empresa

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Cobre duas telas ligadas pela mesma ideia: o **cadastro da nova empresa** (dentro do sistema logado) e a **escolha da empresa no login** (a etapa que passa a existir quando a conta tem mais de uma).

## Direção

Modo **Operate** (`impeccable`): é tarefa de gestão, feita com calma e em desktop, e a etapa de login é um passo rápido que precisa sair da frente. A prioridade é **reaproveitar o que a pessoa já conhece**: o formulário da nova empresa é o mesmo de "Minha empresa" (mesmas três seções, mesmos campos, mesma validação), só que vazio e com outro botão principal. Nada de uma terceira variação visual do mesmo cadastro.

Duas decisões de desenho:
- **Depois de criar, o formulário some e dá lugar a um painel de confirmação.** O usuário não entra na empresa nova sozinho (a API só oferece essa escolha no login), então o painel diz o que fazer em seguida em vez de deixar o formulário preenchido na tela, que convidaria a enviar de novo.
- **Escolher a empresa é um toque.** No login, cada empresa é um botão grande; tocar nela já entra. Sem rádio, sem botão "Continuar" extra.

## Componentes do design system

### Reaproveitados
- `Accordion` / `AccordionItem`, `CompanyStepFields` (com a busca por CEP), `BusinessHoursStepFields`, `PagamentosFields`: o mesmo miolo de `EmpresaForm`.
- `Button` (`primary`, `secondary`), `Text`, `ErrorBanner`, `ConfirmDialog`, `Toast`, `Link`.
- `AuthCard` (+ `Form`, `Footer`): moldura da etapa de escolha no login, a mesma do login e da troca de senha.
- `ErroSemPermissao`: para 403 ao enviar.

### Novos
- **EmpresaCriada** (`src/components/empresa/`): painel de confirmação após criar (ver tela 2).
- **EscolherEmpresa** (`src/components/auth/`): a etapa de escolha no login (ver tela 3).
- Nenhum componente novo em `src/components/ui`. O formulário da nova empresa deve **reaproveitar a lógica de `EmpresaForm`** (três formulários, validação, abrir seção inválida, foco no primeiro erro) em vez de duplicá-la; a forma de compartilhar é decisão do Tech Spec.

### Tokens
Nenhum novo. `surface`, `border`, `primary`, `primarySoft`, `success`, `textMuted`, `space`, `radii`, `fontSizes` do tema atual.

## Telas e estados

### 1. Adicionar empresa (`/minha-empresa/nova`)

**Como se chega aqui:** em "Minha empresa", ao lado do título, um botão `secondary` "Adicionar empresa" (no mobile, abaixo do título, largura total). Só aparece para quem pode (a página já é só do Administrador).

**Layout:** idêntico ao de "Minha empresa": `Page` com título "Adicionar empresa", subtítulo "Cadastre outra empresa na sua conta. Você poderá entrar nela escolhendo a empresa no login.", as três seções em acordeão (**Dados da empresa**, **Funcionamento**, **Pagamentos**), todas abertas, e a barra de ações no fim.

- **Padrão:** campos em branco; Pagamentos com só Dinheiro ligado (como na adesão); horários no padrão da adesão. O CNPJ **não** é travado (em "Minha empresa" ele é). O CEP preenche o endereço, como na adesão.
- **Ações (no fim e à direita no desktop):** `Cancelar` (secondary) e `Criar empresa` (primary). Sem "Descartar alterações": o cancelar já cumpre esse papel. Ambos ficam habilitados desde o início; `Criar empresa` não depende de a pessoa ter mexido (um formulário vazio é inválido e mostra os erros).
- **Cancelar com dados digitados:** abre `ConfirmDialog` ("Descartar os dados da nova empresa?", confirmar "Descartar", cancelar "Continuar editando"). Sem dados digitados, volta direto para "Minha empresa".
- **Validação ao enviar:** a mesma de "Minha empresa": abre as seções com erro (`hasError` no item do acordeão), foca o primeiro campo inválido e não envia.
- **Enviando:** todos os campos e os dois botões desabilitados; o principal passa a "Criando…".
- **Erro da API:** `ErrorBanner` (`role="alert"`) acima das seções com a mensagem devolvida (ex.: CNPJ já cadastrado); o formulário mantém tudo o que foi digitado e volta a ficar editável. **403:** `ErroSemPermissao` no lugar do banner. **Rede ou tempo esgotado:** o banner com a mensagem padrão do sistema.
- **Perfil sem permissão:** barrado antes da tela (acesso negado), como as outras áreas restritas.

### 2. Empresa criada (painel de confirmação)

Substitui o formulário, na mesma rota, depois do sucesso.

- Título "Empresa criada" e, abaixo, o nome da empresa (razão social) em destaque.
- Texto: "Para entrar nela, saia e faça login de novo. Você vai escolher em qual empresa quer entrar."
- Ações: `Sair e escolher a empresa` (primary; encerra a sessão e leva ao login) e `Voltar para Minha empresa` (secondary).
- O foco vai para o título ao aparecer; o painel tem `role="status"` para o leitor de tela anunciar.
- Não há botão "Adicionar outra"; quem quiser cadastrar mais uma volta pela tela anterior (evita reenvio por engano).

### 3. Escolher a empresa (etapa do login)

Aparece no lugar do formulário de login, dentro do mesmo `AuthCard`, quando o login responde que há mais de uma empresa.

- Título "Escolha a empresa", subtítulo "Você tem acesso a mais de uma empresa. Em qual quer entrar agora?".
- **Lista de empresas:** uma coluna de botões grandes (ao menos 56px de altura, largura total), cada um com o **nome da empresa** (nome fantasia, ou razão social se faltar) em destaque e, abaixo em `textMuted`, o **CNPJ** com máscara. Ao toque, entra naquela empresa.
- **Entrando:** o botão tocado mostra "Entrando…" e todos os outros ficam desabilitados; nenhum aviso de sucesso intermediário, a sessão abre e a pessoa segue para o sistema.
- **Erro ao escolher:** `Text variant="error"` (`role="alert"`) acima da lista; a lista continua clicável para tentar de novo. **Escolha expirada ou recusada (401):** mensagem "Sua escolha expirou. Entre novamente." e a lista é substituída por um botão "Voltar ao login". **Muitas tentativas (429):** a mensagem da API, lista mantida.
- **Rodapé:** `Link` "Voltar" que descarta a etapa e mostra o login de novo (o token de pré-autenticação não é guardado em lugar nenhum além da memória da tela).
- **Quando a troca de senha temporária também é exigida:** aparece primeiro a tela de primeiro acesso; só depois desta etapa de escolha.
- **Sem estado vazio:** a etapa só aparece com duas ou mais empresas. Se a lista vier vazia ou inválida, trata-se como erro de login (mensagem padrão), nunca como tela em branco.
- **Lembrar senha** continua valendo do login e não muda aqui.

**Pontos que dependem da API (a confirmar na Tech Spec):** os nomes dos campos de cada empresa na resposta do login (identificador, nome, CNPJ) e se a lista traz o perfil do usuário em cada empresa (se trouxer, aparece como `StatusBadge` neutro ao lado do CNPJ).

## Responsividade

- **`< breakpoints.sm`:** em "Minha empresa", o botão "Adicionar empresa" desce para baixo do título em largura total; as ações do formulário empilham em largura total (`Criar empresa` em cima); a lista de empresas já é uma coluna.
- **`sm` a `md`:** o formulário segue o layout atual de "Minha empresa" (grade de duas colunas dentro das seções).
- **`≥ md`:** botão "Adicionar empresa" à direita do título; ações do formulário à direita.
- Alvos de toque de pelo menos 44px; a lista de empresas, 56px.

## Acessibilidade (AA)

- Formulário: rótulos e erros associados aos campos (como já é), foco no primeiro campo inválido ao enviar, seções com erro sinalizadas por texto além da cor.
- Painel "Empresa criada": `role="status"` e foco no título.
- Escolha de empresa: lista como `<ul>` de botões; cada botão tem como nome acessível "Entrar em {empresa}, CNPJ {número}"; o estado "Entrando…" é anunciado; erros em `role="alert"`.
- `ConfirmDialog` com foco no botão seguro ("Continuar editando"), como já é.
- Nenhuma informação só por cor.

## Fora desta spec de design
- Seletor de empresa dentro do sistema e indicação da empresa atual no cabeçalho (questões em aberto do PRD).
- Edição de empresa existente (continua em "Minha empresa").
- Mudanças na adesão.
