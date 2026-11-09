# Design Spec: Configuração da empresa — dados obrigatórios na entrada

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. A feature traz uma tela nova de configuração e muda o que os formulários de entrada exigem.

## Direção

Modo **Operate**. A tela é curta e administrativa: três chaves liga/desliga, um botão de salvar e uma linha de auditoria. Sem ornamento. A decisão visual que importa está na **entrada**: o operador, com fila, precisa saber de relance quais campos são obrigatórios e o que falta, sem texto longo.

Princípios:
- Estado dito em texto (o nome da opção + o `switch` com `aria-checked`), nunca só por cor.
- Cada opção explica o efeito em uma frase, para o gestor saber o que está mudando.
- Reaproveita o que existe: `Switch`, `Text`, `Button`, `ErrorBanner`, `Skeleton`, `Toast`, `BackButton`.
- Mobile primeiro (360×640), alvos de toque de 44px ou mais.

## Decisão de lugar (a confirmar)

Página própria **Configurações**, em `/configuracoes`, no grupo **Configurações** do menu, logo depois de "Minha Empresa". Motivo: Minha Empresa tem um único salvamento para os dados cadastrais; esta configuração é gravada à parte e vai crescer com outras opções. Se o produto preferir, a mesma tela cabe como seção de Minha Empresa sem mudar o conteúdo abaixo.

## Componentes do design system

### Reaproveitados
`Switch`, `Text`, `Button`, `ErrorBanner`, `Skeleton`, `Toast`, `StatusBadge` (selo "Somente leitura"), `Card`.

### Novos
- **`ConfiguracaoEntradaForm`** (de feature, `components/configuracoes`): o grupo de três chaves, o botão e a linha de auditoria. Não é componente de design system, porque é específico do domínio.

Nenhum token novo no tema.

## Tela Configurações

Estrutura, de cima para baixo:

1. **Título** "Configurações" (`Text variant="heading" as="h1"`) com texto de apoio `muted`: "Regras da empresa para o dia a dia."
2. **Cartão "Entrada de veículos"** com `fieldset` e `legend` **"Dados obrigatórios na entrada"** e, abaixo, apoio `muted`: "O operador só registra a entrada depois de preencher o que estiver ligado."
3. **Três linhas**, uma por campo, na ordem **Modelo, Cor, Prisma**. Cada linha tem o `Switch` com o nome ("Modelo obrigatório") e, abaixo do nome, a frase do efeito em `muted`:
   - Modelo: "Pede o modelo do carro (ex.: Corolla)."
   - Cor: "Pede a cor do carro."
   - Prisma: "Pede o número do prisma. Mensalista pode entrar sem ele."
   Linhas com borda `border`, `radii.md`, padding `space[3]`, fundo `background`; a linha ligada usa borda `primary` e fundo `primarySoft` (a diferença também é dita pelo `switch`). Coluna única em qualquer largura; no desktop o cartão tem largura máxima de leitura (`maxWidth` do conteúdo de formulário), alinhado à esquerda.
4. **Rodapé do cartão**: botão **Salvar** (`Button`), desabilitado enquanto não há mudança ou durante o envio, com o texto "Salvando…" no envio. No celular o botão ocupa a largura toda.
5. **Linha de auditoria** `muted`, só quando existe alteração: "Última alteração por {nome} em {dd/mm/aaaa às hh:mm}." Se nunca foi alterada, a linha não aparece.

### Estados

| Estado | O que o usuário vê |
| --- | --- |
| Carregando | `Skeleton` com três linhas e o botão; `aria-busy` na região. |
| Padrão, nunca salvo | Modelo e Cor ligados, Prisma desligado; sem linha de auditoria; Salvar desabilitado. |
| Com mudança | Salvar habilitado; texto de status "Alterações não salvas" ao lado do botão. |
| Salvando | Chaves e botão desabilitados, "Salvando…". |
| Sucesso | `Toast` "Configuração salva."; as chaves mostram o valor gravado e a linha de auditoria é atualizada. |
| Erro ao carregar | `ErrorBanner` `role="alert"` com a mensagem e o botão **Tentar novamente**; sem chaves. |
| Erro ao salvar | `ErrorBanner` `role="alert"` acima do botão; as chaves mantêm o que o usuário marcou e o botão volta a ficar habilitado. |
| Somente leitura | Chaves desabilitadas, selo "Somente leitura" no `legend`, sem botão Salvar. |
| Sem acesso | Mesma tela de `ErroSemPermissao` usada nas outras páginas. |

Ao salvar com erro de rede, o foco vai para o `ErrorBanner`.

## Entrada de veículos (pátio e conferência)

Os formulários de entrada já têm os campos modelo, cor e prisma. Muda como eles se comportam conforme a configuração.

- **Campo obrigatório**: o rótulo ganha o marcador padrão de obrigatório do formulário e o campo recebe `aria-required`. Os campos opcionais não ganham marcador.
- **Bloqueio**: o botão de registrar continua habilitado. Ao tentar registrar com campo obrigatório vazio, aparece a mensagem logo abaixo do campo ("Informe o modelo", "Informe a cor", "Informe o prisma") e o foco vai para o primeiro campo com erro. Isso segue a validação por campo dos demais formulários.
- **Mensalista**: quando a entrada é de mensalista, o campo Prisma deixa de ser obrigatório na hora (some o marcador e a mensagem) e vale a regra normal de modelo e cor. Ao trocar de mensalista para não mensalista, o marcador volta.
- **Configuração em carregamento**: enquanto carrega, o formulário usa o padrão (modelo e cor obrigatórios, prisma opcional) e não trava; ao chegar a configuração, os marcadores se atualizam. Se falhar, mantém o padrão.
- **Conferência**: a mesma regra e os mesmos textos, no formulário de entrada da conferência.

## Menu

Novo item **Configurações** (rótulo curto "Config."), ícone de engrenagem na família dos ícones atuais (`NavIcons`), no grupo **Configurações**, visível para os perfis com acesso à área.

## Responsividade

- 360×640: coluna única, linhas de 56px ou mais, botão Salvar de largura total, sem rolagem horizontal.
- A partir de `md`: cartão com largura máxima, botão Salvar alinhado à esquerda com largura do conteúdo.
- Tema escuro herdado do tema; nenhum valor fixo de cor.

## Acessibilidade

- `fieldset` com `legend`; cada `Switch` com nome claro e a frase do efeito ligada por `aria-describedby`.
- Erros em `role="alert"`; mudança de estado de salvamento anunciada pelo `Toast` (`role="status"`).
- Alvos de toque de 44px ou mais; foco visível nas chaves e no botão.
