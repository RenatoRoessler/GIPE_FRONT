# PRD: Home Hero

## Problema
A página inicial do projeto está com o conteúdo padrão gerado pelo `create-next-app` e não comunica nada sobre o produto GIPE.

## Objetivo
Ter uma página inicial simples com uma seção de destaque (hero) que apresenta o nome do produto, uma frase de valor e uma chamada para ação (CTA), usando o design system do projeto.

## Usuário-alvo
Qualquer visitante que acesse a raiz (`/`) do site pela primeira vez.

## Requisitos funcionais
- RF1: A home deve exibir um título com o nome do produto.
- RF2: A home deve exibir uma frase curta de apresentação/valor abaixo do título.
- RF3: A home deve exibir um botão de CTA (ex: "Começar agora").
- RF4: O layout deve ser responsivo (funcionar bem em mobile e desktop).

## Fora de escopo
- Navegação/menu do site.
- Conteúdo adicional (features, footer, etc.) além do hero.
- Ação real do botão (link/rota de destino) — por ora é só visual/estrutural.

## Critérios de aceite
- [ ] A rota `/` exibe título, subtítulo e botão CTA centralizados na tela.
- [ ] O botão CTA usa o componente `Button` do design system (variant primary).
- [ ] Cores, espaçamentos e tipografia vêm do tema (`theme.ts`), sem valores soltos.
- [ ] Layout não quebra em largura de mobile (~375px).
