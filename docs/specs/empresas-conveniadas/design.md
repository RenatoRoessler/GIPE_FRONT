# Design Spec: Empresas Conveniadas

Insumo para o Tech Spec, a partir de `prd.md` (RF-01 a RF-09). Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto.

**Direção:** tela administrativa de operação (*Operate*), usada em desktop e, às vezes, no celular. Herda a composição já estabelecida em Mensalistas e Preços (cabeçalho com ação primária, tabela, estado vazio tracejado) e o formulário em seções do cadastro de adesão. A ousadia está na clareza: hierarquia da listagem, formulário dividido em dois blocos com propósito claro ("Empresa" e "Responsável") e mensagens de resultado que dizem exatamente o que aconteceu. Sem conceito visual novo.

## 1. Telas e estados

Duas rotas na área logada (`AppShell`):

- `/empresas-conveniadas`: listagem.
- `/empresas-conveniadas/nova`: cadastro em página própria, com link "Voltar" para a listagem.

### 1.1 Listagem

```
┌ Empresas conveniadas ──────────────[Nova conveniada]┐
│ (Todos) Ativos  Encerrados                          │  ← filtro de situação
│                                                     │
│ Empresa          CNPJ          Contato     Situação Desde
│ Auto Peças Sul   12.345.…      (11) 9…     ● Ativo  12/03/2026
│  Razão Social    Rua X, 10 – Centro, SP                      │
└─────────────────────────────────────────────────────┘
```

| Estado | Comportamento visual |
|--------|----------------------|
| Carregando | `Skeleton` em 6 linhas com a mesma contagem de colunas, `role="status"` com rótulo "Carregando conveniadas". |
| Lista | `Table`. Colunas: Empresa (nome fantasia ou razão social em destaque; razão social em linha secundária `textMuted` quando há fantasia), CNPJ formatado, Contato (telefone e endereço resumido em linha secundária), Situação (`StatusBadge` Ativo/Encerrado), Desde (data de cadastro do convênio). Ordem vinda do back (por nome). |
| Atualizando (troca de filtro) | Tabela mantém os dados anteriores com opacidade reduzida e `aria-busy`, como na lista de Mensalistas. |
| Vazio (sem filtro) | `EmptyState` tracejado: "Nenhuma empresa conveniada ainda." + `Button` primary "Nova conveniada". |
| Vazio (com filtro) | "Nenhum convênio ativo." / "Nenhum convênio encerrado." + `Button` secondary "Ver todos". |
| Erro | `ErrorBanner role="alert"` + `Button` secondary "Tentar novamente". |
| Sem permissão (403) | Mesmo bloco de erro com "Você não tem permissão para acessar esta página.", sem botão de tentar novamente. |

**Filtro de situação (RF-03):** `OptionGroup` com três opções (Todos, Ativos, Encerrados), "Todos" selecionado ao abrir. O filtro fica na URL (`?situacao=ativos`) para link direto e botão voltar.

**Sem paginação nesta entrega** (PRD: `[A DEFINIR]`). A tabela não impõe limite de linhas; o Tech Spec avalia o volume real.

### 1.2 Cadastro

```
← Voltar para conveniadas
Nova conveniada
Cadastre a empresa e quem vai administrá-la.

┌ Empresa ───────────────────────────────┐
│ CNPJ*            Telefone*             │
│ Razão social*                          │
│ Nome fantasia                          │
│ CEP*  Logradouro*          Nº*         │
│ Bairro*   Cidade*   UF*                │
└────────────────────────────────────────┘
┌ Responsável ───────────────────────────┐
│ Nome*                  CPF*            │
│ E-mail*                Celular*        │
│ ℹ Se o CPF já tem cadastro, ele ganha  │
│   acesso a esta conveniada e não       │
│   recebe e-mail.                       │
└────────────────────────────────────────┘
                    [Cancelar] [Cadastrar]
```

Dois `Card` empilhados, cada um com título de seção em `Text`. Campos em duas colunas a partir de `breakpoints.md`, uma coluna abaixo. Largura máxima do conteúdo no mesmo padrão do formulário de adesão.

| Campo | Componente | Observações |
|-------|------------|-------------|
| CNPJ | `Input` com `formatCNPJ` | Validação com `lib/documento`. Erro inline "CNPJ inválido". |
| Telefone | `Input` com `formatPhone` | |
| Razão social | `Input` | Obrigatória. |
| Nome fantasia | `Input` | Opcional; sem marcador de obrigatório. |
| CEP | `Input` com `formatCEP` + `useCepLookup` | Mesmo comportamento e dicas do `CompanyStepFields` ("Buscando endereço…", "Endereço preenchido. Confira os dados.", falha com preenchimento manual). |
| Logradouro, Número, Bairro, Cidade | `Input` | Preenchidos pelo CEP, sempre editáveis; número nunca é preenchido pela consulta. |
| Estado | `Select` com `ESTADOS` | |
| Nome, CPF, E-mail, Celular do responsável | `Input` com máscaras de `lib` | CPF validado. |

O bloco informativo do responsável usa o mesmo estilo de aviso já adotado nos formulários (`InfoCard` ou texto `textMuted` com ícone), nunca cor solta.

| Estado | Comportamento visual |
|--------|----------------------|
| Padrão | Campos vazios; foco no CNPJ ao abrir. |
| Erro de campo | Mensagem sob o campo em `colors.danger`, exibida ao tentar salvar; foco vai ao primeiro campo com erro. |
| Enviando | Todos os campos e "Cancelar" desabilitados; botão primary com rótulo "Cadastrando…" e `aria-busy`. |
| Erro de negócio | `ErrorBanner role="alert"` no topo do formulário, com os textos do item 2; dados preservados. Exceção: e-mail de outro usuário vira erro no campo e-mail. |
| Sucesso | Redireciona à listagem e mostra `Toast` conforme o item 2. |
| Descartar | "Cancelar"/"Voltar" com campos alterados abre `ConfirmDialog` "Descartar o cadastro?". |

## 2. Mensagens de resultado (RF-08 e RF-09)

Sucesso (`Toast`, tom `success`). A mensagem combina duas partes (empresa + responsável):

| Resultado | Texto |
|-----------|-------|
| Empresa nova | "Empresa cadastrada e convênio registrado." |
| Empresa já conveniada em outro estacionamento | "Empresa já cadastrada: dados mantidos e convênio registrado." |
| Convênio encerrado reativado | "Convênio reativado." |
| Usuário novo | "O responsável recebeu o acesso por e-mail." |
| Usuário existente | "O usuário já cadastrado ganhou acesso a esta conveniada." |

Erro (`ErrorBanner`):

| Caso (400) | Texto |
|------------|-------|
| CNPJ de empresa de outro tipo | "Este CNPJ pertence a uma empresa que não é conveniada e não pode ser usado aqui." |
| Convênio já ativo | "Esta empresa já é conveniada deste estacionamento." |
| E-mail de outro usuário | Erro no campo e-mail: "Este e-mail já pertence a outro usuário." |
| Demais falhas | "Não foi possível cadastrar. Tente novamente." |

O `Toast` com duas frases curtas fica legível: a primeira trata da empresa/convênio, a segunda do responsável.

## 3. Componentes do design system

### Reaproveitados
- **Table**, **StatusBadge**, **Skeleton**, **OptionGroup** (filtro), **Button**, **Input**, **Select**, **Card**, **Text**, **ErrorBanner**, **Toast**, **ConfirmDialog**.
- Formulário e hooks do cadastro de adesão: `useCepLookup`, formatadores de `lib` (CNPJ, CPF, CEP, telefone, `ESTADOS`) e o grid de `components/form/FormGrid.styles`.
- `EmptyState` tracejado já usado na lista de Mensalistas: se hoje ele vive só em `components/mensalistas/Mensalistas.styles.ts`, o Tech Spec decide entre promovê-lo a `components/ui` ou duplicar o mínimo; preferir promover.

### Novos
Nenhum componente de UI novo.

## 4. Tokens usados

- Cores: `surface`/`border` (cards e divisórias da tabela), `textMuted` (linhas secundárias), `danger` (erros), `success` (Ativo), `primary`/`onPrimary` (ação principal), `focus`.
- Espaçamento da escala `space`; tipografia de `fontSizes`/`fontWeights`; título da página com `typography.display`.
- Raios `radii.lg` nos cards. Nenhum token novo.

## 5. Responsividade

- **Listagem:** abaixo de `breakpoints.md`, cada linha vira um cartão empilhado (empresa, CNPJ, contato, situação e data) reutilizando a mesma `Table` com a troca de `display`, como nas outras listagens. O botão "Nova conveniada" ocupa a largura toda acima do filtro.
- **Filtro:** `OptionGroup` com rolagem horizontal desnecessária evitada: três opções curtas cabem em 320px.
- **Cadastro:** uma coluna abaixo de `breakpoints.md`; barra de ações com "Cadastrar" em largura total e "Cancelar" abaixo; alvos de toque de 44px no mínimo.
- Teclado: ordem de tabulação segue a leitura; Enter envia o formulário.

## 6. Acessibilidade

- Todo campo com rótulo visível; obrigatórios marcados e anunciados (`aria-required`); erros ligados ao campo por `aria-describedby`.
- `ErrorBanner` com `role="alert"`; `Toast` com `role="status"`.
- `StatusBadge` nunca depende só da cor: leva o texto "Ativo"/"Encerrado".
- Foco visível com `colors.focus`; contraste AA nos dois temas (claro e escuro).

## 7. Navegação

Item "Empresas conveniadas" no menu lateral e na barra inferior (se couber no "Mais"), visível conforme a permissão do módulo; ícone coerente com os existentes. Rotas protegidas pelo mesmo mecanismo das demais telas administrativas (acesso negado em `acesso-negado`).
