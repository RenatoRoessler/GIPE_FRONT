# Design Spec: Recibo público da saída

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue `claude-design` (tokens em `src/styles/theme.ts`, componentes em `src/components/ui`) e o contexto de `PRODUCT.md`.

## Direção

Modo **Read**: o cliente abre o link para conferir um documento (quanto pagou, quando saiu, de que veículo) e, se quiser, guardá-lo. A tela precisa ser clara, curta e confiável, sem enfeite.

Não é um visual novo: a página é **irmã do comprovante público da entrada** (`/comprovante/[token]`), que já tem a identidade do cliente final (coluna estreita estilo celular, cabeçalho azul com a empresa, cartão que sobe sobre ele, dados em grade, botões de ação). O cliente que recebe o comprovante na entrada e o recibo na saída vê a mesma família, com a diferença que importa: na entrada o destaque é o tempo em curso; na saída o destaque é **o total pago**. O estado é sempre dito em texto, nunca só por cor.

## Componentes do design system

### Reaproveitados
`PlateDisplay` (placa), `QrCode`, `Button`, `Skeleton`, e a estrutura visual do comprovante público: `Screen`, `Column`, `Top`, `Card`, `Facts`, `Actions`/`ActionButton`, `Message`, `Footnote` (hoje em `ComprovantePublico.styles`). O PDF reaproveita o gerador de recibo em PDF do comprovante (`reciboPdf`), adaptado aos dados da saída.

### Novos (`src/components/veiculos`)
- **`ReciboPublico`**: a página do recibo (carregamento, recibo, não encontrado, erro) e **`ReciboNaoEncontrado`** (usado também pela rota quando o código já é inválido). Mesma estrutura do `ComprovantePublico`.
- **`QrRecibo`**: bloco do QR dentro do recibo da tela de saída (pontilhado, QR, texto e endereço curto).
- Os estilos de página compartilhados com o comprovante (`Screen`, `Column`, `Top`, `Card`, `Facts`, ações) saem de `ComprovantePublico.styles` para um módulo comum, para as duas páginas não divergirem (decisão e arquivos no Tech Spec).

## Tokens usados

Nenhum token novo. `colors.primary`, `onPrimary`, `warn`, `success`, `surface`, `background`, `text`, `textMuted`, `border`; `space`, `radii`, `fontSizes`, `fontWeights`, `typography.display` (valor em destaque), `shadows.sm` e `md`, `breakpoints.md`.

## Página pública do recibo

Coluna única de até 480px (em tela larga, centralizada na moldura de celular do comprovante). De cima para baixo:

1. **Cabeçalho** (`Top`, fundo `primary`): rótulo "Recibo de saída" em `warn` (caixa alta, pequeno), razão social em destaque, endereço e telefone formatados quando houver. Igual ao comprovante, só muda o rótulo.
2. **Cartão do total** (`Card`, sobe sobre o cabeçalho):
   - Linha de status: ponto + **"Saída registrada"** em `success`, e à direita a categoria do veículo em `textMuted`.
   - **Destaque**: rótulo "Total pago", valor em fonte de display grande com algarismos tabulares (`R$ 174,00`), e a forma de pagamento abaixo ("Dinheiro", "Pix"…).
   - **Mensalista**: rótulo "Valor", destaque **"Sem cobrança"** e abaixo a etiqueta **"Mensalista"**. Sem forma de pagamento.
   - **Grade de dados** (`Facts`, 2 colunas): Placa (`PlateDisplay`), Veículo (modelo · cor), Entrada (data e hora), Saída (data e hora), Permanência. Campos que não existirem somem, sem "—" nem "null".
3. **Ações** (`Actions`): **Baixar PDF** (principal) e **Imprimir**. Erro ao gerar o PDF aparece logo abaixo, em `danger`, com `role="alert"`.
4. **Rodapé** (`Footnote`): "Nota fiscal solicitada" quando a consulta indicar; caso contrário, nada.

A página não repete o QR (o cliente já está nela) e não tem menu, login nem links para a área do sistema.

### Estados
- **Carregando:** esqueleto no cabeçalho e no cartão, `role="status"`, `aria-busy`, "Carregando recibo".
- **Recibo:** o descrito acima.
- **Não encontrado** (código inexistente, fora do padrão ou sem recibo no back): ícone, título **"Recibo não encontrado"** e a frase "Confira o QR code ou procure o operador do estacionamento." Não mostra erro técnico.
- **Erro de rede ou servidor:** título "Não foi possível carregar o recibo", frase "Verifique sua conexão e tente novamente." e botão **Tentar novamente** (desabilitado e "Carregando..." enquanto tenta), `role="alert"`.
- **PDF:** botão vira "Gerando..." e fica desabilitado até terminar; falha mostra o erro e permite tentar de novo.
- **Impressão:** só o cartão e o cabeçalho saem no papel; botões e moldura não; em preto sobre branco, legível sem cor.

## QR no recibo da tela de saída

Dentro do recibo (`ReciboConteudo`), depois do total e de uma linha pontilhada (o mesmo recurso do comprovante de entrada):
- QR de 140px centralizado, com `aria-label` "QR code do recibo de saída".
- Título "Leve o recibo no celular" (negrito), frase "Escaneie o código para abrir ou baixar" em `textMuted` e o endereço curto da página (sem `https://`), como o `ShortLink` do comprovante.
- Aparece na tela, **inclusive no recibo de mensalista**, e na impressão (preto sobre branco).
- **Sem código do recibo**: o bloco inteiro some, sem espaço vazio nem mensagem de erro (o operador não precisa saber).

## Acessibilidade

- Razão social em `h1`; dados em lista de definição (`dl`); sem cor como único sinal ("Saída registrada", "Sem cobrança" e "Mensalista" são texto).
- Contraste AA nos temas claro e escuro (a página segue a preferência do aparelho, como o comprovante).
- Botões com pelo menos 44px de alto; foco visível com o contorno amarelo e anel escuro do restante do sistema.
- Estado de carregamento anunciado; erros com `role="alert"`.
- `robots: noindex, nofollow`; o título da aba é "Recibo de saída — GIPE".

## Responsividade

- **Celular:** a coluna ocupa a tela toda, sem moldura.
- **A partir de `md` (768px):** a mesma moldura de celular do comprovante, centralizada, para o documento não esticar em tela larga.
- Grade de dados em 2 colunas em qualquer largura; valores longos (modelo, endereço) quebram linha.
- O bloco do QR no recibo da tela segue a largura do modal (que já é tela cheia no celular).
