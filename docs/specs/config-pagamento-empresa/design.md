# Design Spec: Configuração de meios de pagamento da empresa

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. Não há tela nova: a feature acrescenta um bloco **Pagamentos** à adesão e a Minha Empresa, e muda o que a fase de pagamento da saída oferece.

## Direção

Modo **Operate**. O bloco de configuração é um formulário curto e administrativo: quatro chaves liga/desliga, sem ornamento, na mesma linguagem dos demais campos do cadastro. A decisão visual que importa está na **saída**: o operador, com fila, só vê o que pode usar, e nunca fica diante de uma lista vazia sem explicação.

Princípios:
- Estado dito em texto (nome + "ligado/desligado" pelo próprio `switch`), nunca só por cor.
- A regra "pelo menos um ligado" aparece **na hora** em que o último é desligado, não só ao salvar.
- Reaproveita o que já existe: `Switch`, `AccordionItem`, `OptionGroup`, `ErrorBanner`, `Skeleton`, ícones de forma de pagamento já criados para a saída.

## Componentes do design system

### Reaproveitados
`Switch` (e `SwitchField` de `components/form`), `Accordion`/`AccordionItem`, `Text`, `ErrorBanner`, `Button`, `Skeleton`, `OptionGroup` com ícones (pagamento da saída), `Toast`. Ícones `DinheiroIcon`, `CreditoIcon`, `DebitoIcon`, `PixIcon` de `components/veiculos/saidaIcons.tsx`.

### Novos
- **`PagamentosFields`** (de feature, `components/empresa`): grupo de 4 chaves, usado nos dois cadastros. Props: formulário e `disabled`. Não é componente de design system porque é específico do domínio.

Nenhum token novo no tema.

## Bloco "Pagamentos" (adesão e Minha Empresa)

Estrutura única, reutilizada nos dois lugares:

- `fieldset` com `legend` **"Meios de pagamento aceitos"** e, abaixo, texto de apoio `Text variant="muted"`: "Só os meios ligados aparecem na saída de veículos."
- Quatro linhas, uma por meio, na ordem **Dinheiro, Pix, Cartão de crédito, Cartão de débito**. Cada linha: ícone (decorativo, `aria-hidden`), o nome como rótulo do `Switch` e o estado `aria-checked` do próprio `switch`.
- Layout: coluna única no celular; duas colunas (2×2) a partir de `sm`. Linhas com borda `border`, `radii.md`, padding `space[3]`, fundo `background`; a linha ligada usa borda `primary` e fundo `primarySoft` (a diferença também é dita pelo `switch`).
- Erro do grupo: `ErrorText`/`role="alert"` logo abaixo das linhas, "Selecione ao menos um meio de pagamento", em `danger`. O `fieldset` recebe `aria-invalid` e as linhas ficam com borda `danger` enquanto o erro existir.

Estados:
- *Padrão na adesão*: só **Dinheiro** ligado.
- *Erro*: aparece assim que o último meio é desligado, e permanece até algum ser ligado. Ao tentar avançar/salvar com erro, o foco vai para o primeiro `switch` do grupo.
- *Desabilitado*: durante o salvamento ou envio da adesão, os quatro `switch` ficam `disabled` (visual do `Switch` existente).
- *Carregando* (Minha Empresa): o `Skeleton` da tela já cobre a seção nova (mais um bloco na lista de seções).

### Na adesão
Dentro da **etapa de dados da empresa**, como último bloco, depois das vagas: um divisor visual simples (espaço `space[4]` e o `legend`) separa "Pagamentos" dos campos anteriores. Não vira etapa nova do `Stepper`. Mensagem de erro bloqueia o **Próximo** da etapa (mesmo comportamento da validação dos demais campos da etapa).

### Em Minha Empresa
Uma **terceira seção expansível**, **Pagamentos**, depois de "Funcionamento":
- Resumo no cabeçalho do acordeão: lista dos meios ligados, por exemplo "Dinheiro, Pix" (ou "Dinheiro, Pix, Crédito e Débito" quando todos, abreviando "Cartão de crédito" e "Cartão de débito" para "Crédito" e "Débito" só no resumo).
- Com erro, o cabeçalho mostra "Há campos para corrigir" e a seção abre sozinha ao tentar salvar, como as outras.
- Aberta por padrão, igual às demais seções; salvar, descartar, toast de sucesso e banner de erro seguem como hoje, num único salvamento.

## Saída de veículos — fase de pagamento

A fase de pagamento continua com o `OptionGroup` de ícones (4 colunas), mas a lista vem da configuração da empresa.

| Situação | O que o operador vê |
| --- | --- |
| Configuração carregada, vários meios | Só os tiles dos meios aceitos, na ordem Dinheiro, Crédito, Débito, Pix; o primeiro da lista vem marcado (Dinheiro, se aceito). Os tiles mantêm o tamanho de uma grade de 4 colunas, alinhados à esquerda (sem esticar para ocupar a linha). |
| Um único meio | Um tile marcado, com o texto de apoio "Único meio de pagamento aceito pela empresa." abaixo da legenda. |
| Sem Dinheiro aceito | Sem campo "Valor recebido" nem troco; ao escolher outro meio, o comportamento é o já existente. |
| Carregando a configuração | `Skeleton` no lugar dos tiles, `aria-busy`, botão **Confirmar Saída** desabilitado. |
| Falha ao carregar | `ErrorBanner` `role="alert"` no lugar dos tiles com a mensagem e o botão **Tentar novamente**; **Confirmar Saída** desabilitado. |

A configuração é carregada quando o modal abre (antes de o operador chegar ao pagamento), para a fase de pagamento já abrir pronta na maioria dos casos. Se ela falhar, o aviso só aparece na fase de pagamento, sem atrapalhar a pesquisa do veículo.

## Acessibilidade

- Cada meio é um `role="switch"` com nome do meio e estado anunciado; o grupo tem `legend`; o erro do grupo é `role="alert"` e ligado ao `fieldset` por `aria-describedby`.
- O estado ligado também é dito pela marca visual do `Switch`, pela borda e pelo texto de resumo, não só pela cor.
- Alvos de toque ≥ 44px (a linha inteira é clicável pelo rótulo do `Switch`).
- Foco visível; ordem de tab segue a ordem visual; o primeiro `switch` recebe foco quando a validação bloqueia o envio.
- Na saída, o carregamento é anunciado (`aria-busy`), o erro por `role="alert"` e o botão desabilitado explica o motivo por texto ao lado ("Carregando meios de pagamento…").

## Responsividade

- **Mobile** (< `sm`): as quatro linhas empilhadas, largura total; na adesão o bloco fica no fim da etapa, com o teclado do formulário já usado. Na saída, a grade de tiles segue com 4 colunas compactas (ícone + rótulo) e o aviso/erro ocupa a largura toda.
- **Desktop**: grade 2×2 nas linhas de configuração; o acordeão de Minha Empresa mantém a largura da página.
