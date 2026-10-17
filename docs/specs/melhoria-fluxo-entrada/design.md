# Design Spec: Melhoria do fluxo de entrada de veículos

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` e do layout de referência `gipe-entrada.html` (telas A, D e F). Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. A tela A e o cupom D ficam no modal **Registrar entrada** já existente (`docs/specs/entrada-veiculos/`); a tela F vira uma **página pública** nova.

## Direção

Modo **Operate** para o operador, **Consult** para o cliente.

- **Operador (A/D)**: está em pé, com o cliente ao lado. A placa é o objeto central e deve parecer uma placa (faixa "BRASIL" azul no padrão Mercosul, cinza no padrão antigo). Escolher cor e categoria é toque, não digitação. O cupom que sai da confirmação é um documento: coluna estreita, picote entre os dados e o QR.
- **Cliente (F)**: abriu o QR no celular, na rua. Precisa de uma resposta em segundos: "meu carro está no pátio, há quanto tempo e quanto está dando". O tempo de permanência é o número dominante; o valor vem logo abaixo.

Ousadia visual contida em dois gestos (placa que muda de aspecto conforme o padrão, picote do cupom). O resto é tipografia e espaçamento do tema. Dado financeiro pede clareza e confiança: sem ornamento, algarismos tabulares, estado dito em texto.

## Componentes do design system

### Reaproveitados
`Modal`, `Button`, `ErrorBanner`, `Toast`, `Skeleton`, `ConfirmDialog`, `Text`, `QrCode`, `Switch`, `Select` e `TextField`/`SelectField`/`useAppForm` de `components/form`. Cupom e impressão reaproveitam `ReciboEntradaStep` e `Recibo.styles` (`PrintStyles`, `Actions`, `Success`).

### Novos no design system (`src/components/ui`)
- **`ColorSwatchGroup`** (novo): escolha única de cor, em bolinhas lado a lado (`role="radiogroup"` com `<input type="radio">` nativos escondidos visualmente, como o `OptionGroup`). Props: `legend`, `options: { value, label, color }[]`, `value`, `onChange`, `disabled`, `error`. O nome da cor selecionada aparece em texto ao lado da legenda (nunca só pela cor). A cor selecionada tem anel duplo (`background` + `text`), e o foco por teclado tem anel visível distinto.
- **`PlateDisplay`** (novo): exibe uma placa (faixa superior + número em fonte de display). Props: `value`, `variant: "mercosul" | "antiga"`, `size: "sm" | "md" | "lg"`, e opcionalmente `bandLabel` (UF no padrão antigo). Usado no campo de placa do formulário (variante `lg`, envolve o input), no cupom e na página pública (`md`).

### De feature
- `src/components/veiculos/EntradaVeiculoModal` (formulário ajustado, tela A).
- `ReciboEntradaStep` / `ReciboEntradaConteudo` (cupom, tela D) com o novo QR.
- Página pública do comprovante (tela F), em rota própria fora da área logada. Arquivos e rotas ficam no Tech Spec.

## Tokens usados

Nenhum token novo no tema. Reaproveita: `colors.primary`, `onPrimary`, `surface`, `background`, `border`, `text`, `textMuted`, `success`, `danger`, `warn`/`onWarn`; `space`, `radii`, `fontSizes`, `fontWeights`; `typography.display*` para placa, tempo de permanência e número do ticket.

**Cores de pintura (domínio, não tema)**: as 8 amostras (Branco, Preto, Prata, Cinza, Vermelho, Azul, Verde, Bege) são dados do veículo, iguais em tema claro e escuro, e ficam como constante tipada junto do enum de cor (`CORES_VEICULO`), não em `theme.ts`. A borda da amostra usa `colors.border` para o branco não sumir no fundo claro.

## Tela A — Nova entrada (modal)

Modal `sm` hoje; passa a `md` para acomodar a categoria em tiles. Título "Registrar entrada" mantido. Ordem de cima para baixo, uma coluna:

1. **Placa**: campo-placa grande (`PlateDisplay` lg com input transparente dentro), centralizado, em caixa alta, `autoFocus`. Ao digitar o 5º caractere a placa muda de aspecto (Mercosul → faixa azul "BRASIL"; antiga → cinza com hífen e a faixa mostra a UF quando conhecida). Dica abaixo, em texto: "Placa inválida — confira letras e números" (`danger`); "Consultando placa…" / "Dados do cadastro preenchidos." mantidos do fluxo atual.
2. **Modelo**: `TextField` com sugestões (comportamento atual preservado).
3. **Cor**: `ColorSwatchGroup` com as 8 opções; **Prata** pré-selecionada. Ao preencher a placa e o cadastro trazer uma cor, ela é selecionada se existir no enum; se não existir, mantém o valor atual (sem erro).
4. **Categoria**: tiles em grade 3×2 com ícone e rótulo (Moto, Carro pequeno, Carro médio, Carro grande, Caminhonete, Caminhão), `role="radiogroup"` como o `OptionGroup`; categoria sugerida pelo modelo ou cadastro vem selecionada, com a nota "Define a tarifa". Substitui o `Select` atual.
5. **Mensalista**: `Switch` atual, mantido, abaixo da categoria.

Rodapé: **Cancelar** (secundário) e **Registrar entrada** (principal), desabilitado enquanto a placa for inválida ou a categoria vazia.

Estados:
- *Ocioso*: botão desabilitado até haver placa válida e categoria.
- *Consultando placa*: dica "Consultando placa…", formulário editável.
- *Enviando*: "Registrando…", campos e botões desabilitados, modal sem fechar.
- *Erro*: `ErrorBanner` `role="alert"` acima do formulário, dados preservados.
- *Fechar com dados*: `ConfirmDialog` "Descartar entrada?" (atual).

## Tela D — Cupom

Mesmo modal, após o registro (`lg`, como hoje). De cima para baixo:

- Faixa de sucesso "Entrada registrada" (ícone + texto, `success`).
- **Cupom**: coluna centralizada de largura máxima ~`360px`, `background`, `radii.lg`, borda de topo `warn` espessa (identidade do pátio) e o resto em `border`. Cabeçalho: nome do estacionamento, endereço, CNPJ e telefone (dados da empresa, como hoje; omite o que faltar). Linha com a placa (`PlateDisplay` md) e o **número do ticket** (sequencial) em fonte de display, à direita. Grade 2×2: Data, Entrada, Veículo ("MODELO · COR"), Categoria.
- **Picote**: separador com recortes semicirculares laterais e linha tracejada entre os dados e o QR.
- **QR**: `QrCode` com ~`180px` sobre fundo branco (sempre, independente do tema, para leitura confiável), com o texto "Leve o comprovante no celular", "Escaneie o código ou fotografe esta tela" e, abaixo, o endereço curto do link (sem `https://`) em `link`. O link vem do **token** da entrada (RF4 do PRD).
- Rodapé do cupom: tarifa aplicada (`rotatividadeDescricao`) à esquerda, operador à direita, quando disponíveis.
- Ações: **Concluir** (secundária) e **Imprimir** (principal). **Impressão**: só o cupom aparece, preto sobre branco, coluna única, sem sombras; `@media print` no próprio componente, como no recibo atual. O picote vira linha tracejada simples no papel.

## Tela F — Comprovante público (celular do cliente)

Página própria, **sem** shell logado (sem menu, sem login), mobile-first, em coluna única de largura máxima ~`480px` centralizada. Segue o tema do sistema (claro/escuro) com a preferência do aparelho.

Estrutura:
1. **Cabeçalho** de fundo escuro (`text` sobre `background` invertido do tema, ou `primary` quando o tema for claro): rótulo "Comprovante de entrada" em `warn`, razão social em `fontSizes.lg` bold, endereço e telefone em `textMuted`.
2. **Cartão sobreposto** ao cabeçalho (margem negativa), com:
   - Linha de estado: ponto + texto **"Veículo no pátio"** (`success`) e "Ticket Nº {sequencial}" à direita.
   - **Tempo de permanência** como número dominante (fonte de display, ~56px, algarismos tabulares), rótulo "Tempo de permanência" acima e **"Valor até agora: R$ x"** abaixo, valor em bold.
   - Grade 2×2 com separador superior: **Placa** (`PlateDisplay` sm), **Entrada** (data · hora), **Veículo** (modelo · cor), **Categoria**.
3. **Ação "Ligar"** (link `tel:` com o telefone do estacionamento), botão secundário de largura total, 44px de altura mínima. Sem Baixar PDF, Como chegar nem QR de saída (fora de escopo).
4. Rodapé discreto: "Valor calculado em {data e hora da consulta}" (`textMuted`, `fontSizes.xs`), para o cliente saber a que momento o valor se refere.

Estados:
- *Carregando*: `Skeleton` no cabeçalho, no tempo e na grade; estado anunciado com `aria-busy`.
- *Sucesso*: como descrito. Sem atualização automática nesta versão (ponto em aberto do PRD); o rodapé informa o horário da consulta.
- *Não encontrado* (token inexistente): ícone neutro, título "Comprovante não encontrado", texto "Confira o QR code ou procure o operador do estacionamento." Sem dados, sem detalhes técnicos.
- *Erro de rede/servidor*: título "Não foi possível carregar o comprovante", botão **Tentar novamente**, `role="alert"`.
- *Valor 0*: "Valor até agora: R$ 0,00" (sem tratamento especial; mensalista fica fora desta versão).
- *Campos ausentes* (modelo/cor/telefone vazios): omite o item ou mostra "—"; nunca exibe `null`/`undefined`. Telefone ausente oculta o botão **Ligar**.

Formatação: telefone com máscara (DDD + número), CNPJ não é exibido, tempo vem pronto da API ("0h 0min") e é mostrado como "0h 00min"; datas em `pt-BR`; valor em BRL.

## Acessibilidade

- Placa e cor do formulário com rótulo ligado ao campo; dica de placa em região `aria-live="polite"`.
- `ColorSwatchGroup` e tiles de categoria navegáveis por setas (radios nativos), com legenda, foco visível e nome textual da opção selecionada; o estado selecionado nunca é só por cor/anel.
- Amostras de cor têm `aria-label`/texto oculto com o nome ("Prata"); alvo de toque mínimo de 44px (a amostra de 38px do HTML ganha área clicável de 44px).
- QR com `role="img"` e `aria-label="QR Code do comprovante"`; o link em texto é alternativa.
- Página pública: um `h1` (razão social), landmarks (`main`), estado de erro em `role="alert"`, carregamento com `aria-busy`, contraste AA nos dois temas, texto redimensionável sem quebra do layout.
- Estado ("no pátio", "não encontrado", "erro") sempre em texto, não só cor.
- Respeita `prefers-reduced-motion` (a transição da placa Mercosul/antiga é só de cor e some sem animação).

## Responsividade

- Tela A/D: abaixo de `md` o modal ocupa quase a largura toda (margem `space[3]`), categoria em tiles 3×2 (2×3 abaixo de `sm`), rodapé com botões empilhados e o principal em cima. De `md` para cima, modal `md` centrado, botões lado a lado.
- Cupom: mantém a coluna estreita centralizada em qualquer largura.
- Tela F: pensada para ~360–430px; acima disso, a coluna fica centralizada em ~`480px` sobre `surface`. Sem scroll horizontal; cabeçalho e cartão ocupam a largura toda no mobile, com gutter de `space[3]`.
