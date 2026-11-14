# Design Spec: Menu de Serviços separado em Operação e Cadastro

> **Revisão (Financeiro fora):** o perfil Financeiro **não** tem acesso a Serviços (nem à fila nem ao catálogo). A documentação do back lista `GET /Servico` só para Administrador, Gerente, Caixa, Manobrista e Lavador, e a decisão foi não pedir a inclusão. Onde este documento ainda fala em Financeiro consultando o catálogo, vale esta nota.

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e a decisão de `docs/specs/menu-grupos/design.md` (menu em grupos, sem ícone ou cartão novo além do necessário). Esta mudança reorganiza a **entrada** de Serviços; o visual interno da fila e do catálogo é tratado em `servicos-melhorias`.

## Direção

Modo **Operate**. Mudança quase toda de estrutura: dois itens no lugar de um, cada um no grupo certo, e a tela de Serviços deixa de ter abas. O menu continua discreto: nada de selo, cor ou aviso para explicar a divisão. Cada nome diz o que a tela é.

## Itens do menu

| Grupo | Item | Rótulo curto (barra inferior) | Endereço | Perfis |
|---|---|---|---|---|
| Operação | **Fila de serviços** | Fila | `/servicos` | Lavador, Manobrista, Caixa |
| Configurações | **Catálogo de serviços** | Catálogo | `/servicos/catalogo` | Administrador, Gerente, Financeiro |

- **Ordem.** Fila de serviços continua sendo o último item de Operação (depois de Conferência de pátio). Catálogo de serviços entra em Configurações logo depois de Gestão de Preços: os dois definem o que se vende e por quanto.
- **Ícones.** A fila mantém a gota (`services`). O catálogo ganha um ícone próprio (`catalog`: uma lista com marcador, no mesmo traço de 2px, 24×24 e cantos arredondados dos demais), para não haver dois itens iguais no mesmo menu. Se o ícone novo não ficar pronto, o catálogo usa a gota enquanto isso, sem bloquear.
- **Barra inferior do celular.** O espaço é de um item curto: "Fila" e "Catálogo" (já cabem; o menu da barra se adapta pela capacidade existente). O painel "Mais" e o menu lateral usam o nome completo.
- **Grupo vazio.** Um perfil que só vê um dos itens (todos, pela regra acima) continua vendo apenas o seu grupo; grupo sem item permitido não aparece, como já é hoje. O Financeiro passa a ter o grupo Configurações com um único item; o título do grupo aparece normalmente.

## Telas

As duas telas perdem o seletor de abas (`Tabs`) e passam a ter um título próprio:

1. **Fila de serviços** (`/servicos`): título "Fila de serviços", aviso de módulo desligado (se for o caso) e a fila.
2. **Catálogo de serviços** (`/servicos/catalogo`): título "Catálogo de serviços", aviso de módulo desligado (se for o caso) e o catálogo em lista e detalhe.

Nada muda dentro do conteúdo. O título de cada tela vem do próprio item do menu (mesmo texto), para o usuário reconhecer onde está.

### Estados
- **Carregando:** o mesmo esqueleto de hoje, com o título certo de cada tela.
- **Sem permissão:** quem digita o endereço de uma tela que o perfil não pode ver recebe a tela de acesso negado existente (`/acesso-negado`). Nenhum conteúdo da tela vaza antes do aviso.
- **Financeiro no catálogo (somente consulta):** vê a lista e o detalhe, sem **Novo serviço**, **Editar** nem **Inativar**; o estado vazio mostra só "Nenhum serviço cadastrado." (sem convite a cadastrar).
- **Módulo desligado:** o `InfoCard` "Os serviços estão desligados nesta empresa" aparece nas duas telas, como antes.

### Endereços antigos
Quem abre um link ou favorito antigo é levado ao lugar certo sem passar pela tela de acesso negado:
- Perfil da fila: continua em `/servicos` (o `?aba=` é ignorado).
- Perfil do catálogo que abre `/servicos` (com ou sem `?aba=`): vai para `/servicos/catalogo`, mantendo `?servico=` se existia.
- `?status=` continua valendo na fila.

## Componentes

### Reaproveitados
`FilaServicos`, `ServicosMasterDetail`, `ServicosDesligados`, `Skeleton`, `ErroSemPermissao`/tela `/acesso-negado`, `NavIcon`, menu lateral, `MenuSheet` e barra inferior (nenhum muda de código além de receber os dois itens).

### Novos (de feature, em `components/servicos`)
- **`FilaServicosPage`**: página da fila (título, aviso de módulo desligado, `FilaServicos`) e o seu esqueleto.
- **`CatalogoServicosPage`**: página do catálogo (título, aviso de módulo desligado, `ServicosMasterDetail`) e o seu esqueleto.
- **Ícone `catalog`** em `components/layout/NavIcons`.

`ServicosPage` (com abas) deixa de existir.

## Tokens usados
Nenhum token novo. Título e esqueleto reaproveitam os estilos que `ServicosPage` já usa (`Tela`, `Titulo`, `Esqueleto`, `theme.space`, `theme.fontSizes`).

## Acessibilidade
- Cada página tem um único `h1` com o nome do item do menu; o item atual do menu fica marcado como página atual, como nos outros itens.
- Sem as abas, desaparece a navegação por setas entre elas; a ordem de foco passa direto do título para o conteúdo.
- O item do menu e o título da tela têm o mesmo texto, para leitor de tela e visão reduzida acharem a mesma coisa nos dois lugares.

## Responsividade
- **Celular:** os dois itens entram na barra inferior ou no painel "Mais", conforme a capacidade; "Fila" e "Catálogo" são os rótulos curtos.
- **Computador:** menu lateral recolhido mostra só os ícones (por isso o ícone próprio do catálogo importa); expandido mostra os nomes completos.
- Telas internas não mudam de layout.
