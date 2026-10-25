# PRD: Nova identidade Murel e navegação inferior única

**Status:** Em Revisão
**Autor:** Renato Roessler
**Data:** 2026-10-25
**Versão:** 1.0

---

## 1. Objetivo

Renomear o sistema de GIPE para **Murel**, adotar a identidade visual definida no guia de marca (`Marca_Murel.html`, v1.1) e unificar a navegação: a barra inferior que hoje existe só no celular passa a ser o único menu do sistema, em qualquer tamanho de tela, mostrando quantos itens couberem e levando o restante para um menu estendido.

## 2. Contexto e Motivação

O produto ganhou nome e marca próprios. O guia da Murel descreve o que a marca é, como fala e como aparece (logotipo, paleta, tipografia, tom de voz). Hoje o sistema ainda se apresenta como GIPE em telas, títulos, instalação do app e documentos. Além disso, o menu superior do computador (pórtico de placas) e a barra inferior do celular são duas navegações diferentes, e a barra inferior fixa em quatro itens não aproveita telas mais largas nem se adapta a telas estreitas.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Operador (caixa, manobrista) | Navegar com uma mão, com os atalhos mais usados sempre à vista | Celular ou balcão, em pé, no portão |
| Administrador / gerente | Acessar todas as áreas do sistema com a mesma navegação em qualquer aparelho | Computador, tablet e celular |
| Cliente final do pátio | Reconhecer a marca no ticket e no recibo públicos | Celular, ao ler o QR Code ou receber o recibo |

## 4. Escopo

### Dentro do Escopo
- Trocar o nome GIPE por Murel em textos de interface, títulos de página, mensagens e documentos.
- Aplicar a identidade do guia: paleta (asfalto, amarelo, giz e apoio), tipografia (Plus Jakarta Sans e JetBrains Mono), logotipo (três vagas formando um M, com o carro na vaga do meio, e a palavra "murel") e tom de voz.
- Aplicar a identidade nos **temas claro e escuro**, mantendo o alternador de tema.
- Atualizar o app instalável (nome, nome curto, cores e ícone).
- Aplicar a marca no cabeçalho, login, telas de adesão/acesso e telas públicas (ticket, recibo, comprovante).
- Aplicar a marca no recibo em PDF.
- Remover o menu superior (pórtico) e usar a barra inferior em todas as larguras de tela.
- Ajustar a quantidade de itens visíveis na barra inferior à largura da tela, com o restante no menu estendido.

### Fora do Escopo
- Site institucional, redes sociais, sinalização do pátio e papelaria descritos no guia.
- Novas funcionalidades, mudanças de permissão ou de conteúdo das telas.
- Tema único escuro (o guia o prevê, mas esta entrega mantém claro e escuro).
- Mudar domínio, URLs ou nomes técnicos internos que o usuário não vê.
- Reescrever todos os textos do sistema para o tom de voz do guia além do que já contenha a marca antiga ou seja afetado pela troca.

## 5. Requisitos Funcionais

### RF-01: Nome Murel
**Critério de aceite:**
- Dado qualquer tela, título de aba, mensagem ou documento do sistema, quando o usuário o vê, então o nome exibido é "Murel" e não há ocorrência visível de "GIPE".
- Dado o texto de apresentação do sistema, quando exibido, então não usa mais "Gestão Inteligente para Estacionamentos" e descreve a Murel conforme o guia (sistema de quem cuida de carro: estacionamentos, valets e lava-rápidos).

### RF-02: Logotipo
**Critério de aceite:**
- Dado o cabeçalho, o login e as telas públicas, quando carregam, então mostram o símbolo das três vagas com o carro amarelo na vaga do meio e a palavra "murel".
- Dado um espaço pequeno (por exemplo, o cabeçalho no celular), quando necessário, então pode aparecer apenas o símbolo, legível.
- Dado o alt/rótulo do logotipo, quando lido por leitor de tela, então diz "Murel".

### RF-03: Paleta e tipografia
**Critério de aceite:**
- Dado o tema escuro, quando o usuário navega, então fundos, superfícies, textos e destaques seguem a paleta do guia (asfalto, giz, amarelo como cor de destaque e ação principal).
- Dado o tema claro, quando o usuário navega, então as mesmas cores de marca são usadas de forma equivalente, com contraste suficiente.
- Dado qualquer texto, quando exibido, então usa Plus Jakarta Sans; valores, placas e dados tabulares usam JetBrains Mono, conforme o guia.
- Dado o alternador de tema, quando o usuário o usa, então continua alternando entre claro e escuro.

### RF-04: Aplicativo instalável
**Critério de aceite:**
- Dado que o usuário instala o app, quando vê o ícone e o nome, então aparecem "Murel" e o ícone com o símbolo da marca.
- Dado o app instalado, quando aberto, então a cor da barra e do fundo de abertura seguem a paleta da Murel.
- Dado o botão e as instruções de instalação, quando exibidos, então citam "Murel".

### RF-05: Documentos e telas públicas
**Critério de aceite:**
- Dado o ticket de entrada público, o recibo de saída e o comprovante, quando abertos, então exibem a marca Murel e o visual da nova identidade.
- Dado o recibo em PDF, quando gerado, então traz o nome e o logotipo da Murel.
- Dado o QR Code de ticket, quando lido por um leitor de ticket do sistema, então continua sendo reconhecido como ticket válido, e a mensagem de QR inválido cita "Murel".

### RF-06: Remoção do menu superior
**Critério de aceite:**
- Dado qualquer tela da área logada em qualquer largura, quando carregada, então o pórtico de placas e qualquer menu de navegação no topo não existem.
- Dado o cabeçalho, quando exibido, então mantém logotipo, boas-vindas, tema e menu do usuário.

### RF-07: Barra inferior em todas as larguras
**Critério de aceite:**
- Dado qualquer tela da área logada, quando carregada no computador, tablet ou celular, então a mesma barra de navegação fica fixa na parte de baixo, com o mesmo comportamento.
- Dado a tela atual, quando está entre os itens visíveis, então o item fica destacado e é anunciado como página atual.
- Dado o conteúdo da página, quando o usuário rola até o fim, então nada fica coberto pela barra, nem o link de versão do rodapé.
- Dado o botão flutuante "Novo mensalista", quando exibido, então fica acima da barra.

### RF-08: Itens visíveis conforme a largura
**Critério de aceite:**
- Dado uma tela estreita, quando a barra é exibida, então mostra apenas os itens que cabem com alvo de toque de pelo menos 44 px, e os demais vão para o menu estendido.
- Dado uma tela larga, quando a barra é exibida, então mostra mais itens, até todos os que o usuário pode acessar caberem.
- Dado que alguns itens não cabem, quando a barra é exibida, então o último espaço é um botão de menu estendido ("Mais").
- Dado que todos os itens cabem, quando a barra é exibida, então o botão de menu estendido não aparece.
- Dado que a tela é redimensionada ou o aparelho é girado, quando a largura muda, então a quantidade de itens visíveis se ajusta sem recarregar a página.

### RF-09: Menu estendido
**Critério de aceite:**
- Dado que existem itens fora da barra, quando o usuário toca no botão de menu estendido, então abre um painel com os itens que não couberam, com a tela atual marcada se estiver entre eles.
- Dado o painel aberto, quando o usuário escolhe uma tela, toca fora, toca em fechar ou pressiona Esc, então o painel fecha.
- Dado que a tela atual é um item que está no menu estendido, quando a barra é exibida, então o botão de menu estendido aparece destacado.
- Dado que a lista de itens depende do perfil do usuário, quando a barra é montada, então só aparecem as telas a que o perfil tem acesso.

## 6. Requisitos Não-Funcionais

- **Performance:** a troca da quantidade de itens ao redimensionar não causa saltos visíveis nem atrasa a interação. As fontes novas não bloqueiam a exibição do texto.
- **Acessibilidade:** WCAG 2.2 nível AA nos dois temas (contraste do amarelo e do giz sobre os fundos, foco visível, alvos de toque de 44 px); barra identificada como navegação; item atual anunciado; painel fecha com Esc; sem animação com movimento reduzido.
- **Compatibilidade:** navegadores atuais de computador e celular, incluindo aparelhos com barra de gestos (respeitar a área segura).
- **Segurança:** a barra e o menu estendido exibem apenas telas permitidas ao perfil; a troca de nome não altera autenticação, sessões nem tokens de ticket.

## 7. Fluxos Principais

### Fluxo 1: Navegar no celular estreito
1. Usuário abre qualquer tela da área logada.
2. Sistema mostra a barra inferior com os itens que cabem e o botão "Mais".
3. Usuário toca em "Mais".
4. Sistema abre o painel com os demais itens.
5. Usuário escolhe uma tela.
6. Sistema fecha o painel e abre a tela escolhida.

### Fluxo 2: Navegar no computador
1. Usuário abre qualquer tela da área logada.
2. Sistema mostra a barra inferior com mais itens visíveis (todos, se couberem) e sem menu no topo.
3. Usuário toca ou clica em um item.
4. Sistema abre a tela e destaca o item.

### Fluxo 3: Instalar e abrir o app
1. Usuário instala o app pelo navegador.
2. Sistema oferece o nome "Murel" e o ícone da marca.
3. Usuário abre o app.
4. Sistema mostra a abertura e as telas com a nova identidade.

### Fluxo 4: Cliente abre o ticket público
1. Cliente lê o QR Code do ticket.
2. Sistema abre a página pública com a marca Murel, o tempo de permanência e o valor.
3. Cliente aciona o recibo ao sair.
4. Sistema mostra o recibo (e o PDF) com a marca Murel.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Ocorrências visíveis de "GIPE" no sistema | Presente em todas as telas | 0 |
| Telas da área logada com menu no topo | Todas, no computador | 0 |
| Itens da barra inferior que não cabem e ficam inacessíveis | Não se aplica | 0 (todo item está na barra ou no menu estendido) |
| Contraste de texto e controles nos dois temas | A verificar | WCAG 2.2 AA |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| O guia define tema único escuro; o sistema mantém claro e escuro | Médio | Definir equivalentes claros das cores da marca e validar o contraste; registrar como decisão [A DEFINIR] com o dono da marca |
| Amarelo de marca sobre fundo claro tem contraste baixo para texto | Alto | Usar a variante escura do amarelo do guia para texto e destaques no tema claro |
| Fontes do guia vêm de serviço externo | Baixo | Garantir texto legível com fonte alternativa enquanto carrega |
| Barra inferior no computador muda hábito de usuários do pórtico | Médio | Manter nomes e ordem dos itens; registrar a mudança no histórico de atualizações |
| Marca antiga em arquivos de teste, ícones e arquivos gerados | Médio | Varredura por "GIPE" e conferência dos ícones do app antes de finalizar |
| Muitos itens ao mesmo tempo em tela larga | Baixo | Limite de largura da barra e rótulos curtos |

## 10. Referências

- Guia de marca: `C:\Users\renat\Downloads\Marca_Murel.html` (v1.1, out/2026)
- Pedido original: `docs/specs/input.md`
- Spec anterior da barra inferior: `docs/specs/menu-mobile-inferior/prd.md`
- Decisões que eram pontos em aberto: valores das cores do tema claro definidos em `design.md` (seção 2.1) e validados com contraste AA; ícones do app gerados em 192, 512, maskable 512 e 180 (Apple) por `scripts/gerar-icones.mjs`; ordem de prioridade dos itens quando há corte na barra: Início, Entrada e Saída primeiro e depois a ordem do menu (ajuste em relação à suposição inicial de "ordem atual do menu", que deixaria Entrada e Saída no painel em telas estreitas).
