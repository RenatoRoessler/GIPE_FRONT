# Design Spec: Ticket do cliente por placa e cartaz do ticket

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue `claude-design` (tokens em `src/styles/theme.ts`, componentes em `src/components/ui`) e o contexto de `PRODUCT.md`.

## Direção

São duas superfícies com propósitos diferentes:

1. **Tela pública de consulta** (cliente, no celular, de pé no estacionamento): modo **Do**. Uma única tarefa, "digitar a placa e ver o ticket". Tem que ser óbvia em 3 segundos e funcionar com o polegar. Não é um visual novo: é **irmã do comprovante público** (`/comprovante/[token]`) e do recibo público (`/recibo/[token]`), com a mesma coluna estreita, cabeçalho `primary` e cartão que sobe sobre ele. O cliente que digita a placa aqui cai no comprovante e deve sentir que continua no mesmo lugar.
2. **Cartaz A4** (operador imprime, o cliente lê de longe): não é tela do sistema, é um **objeto impresso**. A composição já foi decidida pela referência `Cartaz Ticket Digital · A4 retrato@1x.png` (cabeçalho escuro com a marca, título grande com marcador amarelo, três passos numerados, QR em cartão, faixa de benefícios, rodapé). A spec não redesenha o cartaz: fixa o que é fiel à referência, o que muda (o QR real) e como ele se comporta na impressão.

Há ainda um terceiro ponto, discreto: o botão "Gerar Cartaz do Ticket", que entra nas telas internas já existentes (Home e tela da empresa) com o componente `Button` padrão.

## Componentes do design system

### Reaproveitados
- `PlateDisplay` (tamanho `lg`, como no campo de placa dos formulários) para o campo de placa.
- `Button` (`primary`, `size` padrão), `Skeleton`, `QrCode`, `Logo`.
- Estrutura visual das páginas públicas: `Screen`, `Column`, `Top`, `Card`, `Message`, `Footnote` (hoje em `ComprovantePublico.styles`; o Tech Spec decide o módulo comum, como já feito para o recibo público).
- Home (`/dashboard`, linha de ações) e `MinhaEmpresa` (tela da empresa): só recebem o botão, sem mudar o layout.

### Novos
- **`ConsultaTicketPublica`** (`src/components/veiculos`): a página de consulta (formulário, carregando, não encontrado, erro, link inválido).
- **`CartazTicket`** (`src/components/empresa`, ao lado de quem o usa): o cartaz A4, renderizado só para impressão.
- **`GerarCartazButton`**: o botão "Gerar Cartaz do Ticket", reaproveitado na Home e na tela da empresa, para os dois pontos não divergirem.

Nenhum componente vai para `src/components/ui`: todos são específicos desta feature. O cartaz usa `QrCode` e `Logo` do design system.

## Tokens usados

Tela de consulta: nenhum token novo. `colors.primary`, `onPrimary`, `warn`, `surface`, `background`, `text`, `textMuted`, `border`, `borderStrong`, `danger`, `dangerSoft`, `focus`; `space`, `radii`, `fontSizes`, `fontWeights`, `typography.display`, `shadows.md`, `layout.touchTarget`, `breakpoints.md`.

Cartaz: é um objeto de marca, **igual nos dois temas** e não segue a preferência do aparelho. As cores fixas da referência (asfalto `#0E1729`, amarelo faixa `#FFC20E`, giz `#F4F1E8`) são exatamente `text`/`primary`/`background` do tema claro, então o cartaz usa os tokens do `lightTheme` explicitamente, sem valores soltos. Cinza do texto de apoio: `textMuted`. Não cria token.

## Tela pública de consulta

Coluna única de até 480px (moldura de celular a partir de `md`, igual ao comprovante). De cima para baixo:

1. **Cabeçalho** (`Top`, fundo `primary`): rótulo "Ticket digital" em caixa alta pequena, título **"Consulte seu ticket"** em destaque e uma frase: "Digite a placa do seu veículo." Não mostra o nome da empresa: a consulta só devolve a empresa depois da busca (e o link inválido não deve revelar nada).
2. **Cartão do formulário** (`Card`, sobe sobre o cabeçalho):
   - **Placa**: `PlateDisplay` em tamanho `lg` com o campo de texto dentro, como nos formulários (a placa muda de aspecto Mercosul/antiga conforme o que é digitado), rótulo visível "Placa do veículo" e exemplo `ABC1D23` como placeholder.
   - **Dica** abaixo do campo, em `textMuted`: "Informe do jeito que está na placa. Hífen e espaço não importam."
   - **Botão Buscar** (`primary`, largura total, 44px ou mais de altura).
3. **Rodapé** (`Footnote`): "Dúvidas? Fale com o operador do estacionamento."

Sem menu, sem login, sem links para a área do sistema. O botão fica **abaixo** do campo, em largura total, para ser alcançado com o polegar.

### Estados
- **Padrão:** campo vazio e foco no campo da placa ao abrir. Botão habilitado (a validação acontece ao tocar, para o cliente ver o motivo em vez de um botão cinza sem explicação).
- **Placa incompleta/vazia:** mensagem em `danger` abaixo do campo ("Informe a placa completa, com 7 caracteres"), campo com `aria-invalid` e foco devolvido a ele. Nenhuma consulta é feita.
- **Buscando:** botão vira "Buscando..." e fica desabilitado; campo desabilitado; região `role="status"` anuncia "Buscando ticket". Sem esqueleto de página: a tela não muda de forma, só o botão.
- **Encontrado:** não há tela de sucesso. O cliente é levado direto ao comprovante (RF-03); o botão permanece em "Buscando..." até a navegação acontecer, para não aparecer um instante de formulário parado.
- **Não encontrado (404):** mensagem **dentro do cartão**, acima do botão, sem trocar de tela e sem apagar a placa: título **"Ticket não encontrado"** e a frase "Confira a placa digitada. Se estiver certa, fale com o operador do estacionamento." Fundo `dangerSoft`, `role="alert"`, ícone e texto (nunca só cor). O cliente corrige a placa e busca de novo no mesmo lugar.
- **Erro de rede/servidor:** mesma região, título "Não foi possível consultar", frase "Verifique sua conexão e tente novamente." O botão principal vira **Tentar novamente** e a placa é mantida.
- **Link inválido** (sem empresa ou empresa em formato inválido): o cartão do formulário não aparece. Entra o padrão `Message` das páginas públicas: ícone, título **"Link inválido"** e a frase "Leia novamente o QR code do estacionamento ou fale com o operador."

## Cartaz A4

Retrato, uma folha, impresso no tema claro. Fiel à referência:

1. **Faixa de cabeçalho** em asfalto: `Logo` Murel e o selo "TICKET DIGITAL" (pílula amarela, fonte mono, caixa alta).
2. **Título** "Seu ticket está no celular." em extrabold muito grande, com a palavra "celular." sobre um marcador amarelo, e o parágrafo de apoio abaixo.
3. **Dois blocos lado a lado**:
   - **Esquerda, os 3 passos**: número em quadrado asfalto com o numeral amarelo, título em negrito e texto em `textMuted`. O passo 2 traz uma miniplaca de exemplo (`MUR3L26`) com `PlateDisplay` pequeno, como na referência.
   - **Direita, cartão do QR**: contorno asfalto e cantos arredondados, rótulo "APONTE A CÂMERA", **o QR real no lugar do espaço pontilhado**, e abaixo o ícone de câmera com "Use a câmera do celular". O texto "Cole aqui o QR Code do estacionamento" **não** aparece (RF-06).
4. **Faixa de benefícios** com linha pontilhada em cima: "Sem baixar app · Sem cadastro · Sem papel", cada um com seu ícone.
5. **Rodapé**: "Dúvidas? Fale com o operador." com a frase de apoio, a marca e `murel.com.br`.
6. **Faixa amarela** na borda inferior.

### O QR do cartaz
- Tamanho mínimo de **5 cm** de lado impresso (cerca de 190px a 96dpi), para ler de 1 a 2 metros; ocupa o cartão da direita, centralizado.
- Preto sobre branco com margem, como o `QrCode` já faz (o contraste não depende do tema).
- `aria-label` "QR code para consultar o ticket".
- O conteúdo é a tela de consulta (RF-01) com a empresa na URL; o endereço curto pode aparecer em texto pequeno sob o QR para quem não consegue ler o código.

### Comportamento na impressão
- Ao tocar no botão, o cartaz é montado fora da tela e a impressão do navegador abre com **só o cartaz**: sem menu, sem cabeçalho do sistema, sem outros botões.
- Página **A4 retrato, sem margem do navegador**, com `print-color-adjust: exact` para preservar o fundo asfalto, o giz e o amarelo. Cabe em uma folha; nada quebra em duas páginas.
- Sem imagem externa: logo e ícones em SVG, para não depender de carregamento no momento de imprimir.
- Se o navegador impedir o fundo, o cartaz continua legível: o texto escuro do giz nunca depende do cabeçalho escuro, e o cabeçalho tem a marca em `Logo` com contraste próprio.

## Botão "Gerar Cartaz do Ticket"

- **Home (`/dashboard`):** na linha de ações, depois de Entrada e Saída, como ação secundária (`variant` secundária do `Button`), para não competir com a ação principal. Rótulo exato "Gerar Cartaz do Ticket".
- **Tela da empresa:** no cabeçalho da seção, ao lado das ações existentes, mesma variante.
- Ícone de impressora à esquerda do texto; no celular o botão ocupa a largura da área, em desktop a largura do conteúdo.
- **Gerando:** o botão fica desabilitado por instantes enquanto a impressão abre (evita duplo clique).
- **Sem `empresaGuid`:** o clique mostra um `Toast` de erro "Não foi possível gerar o cartaz agora. Tente novamente em instantes." e não abre a impressão (RF-05).

## Acessibilidade

- Cabeçalho da consulta em `h1`; campo com `label` visível associado (não só placeholder); dica ligada ao campo por `aria-describedby`.
- Erros e "não encontrado" com `role="alert"`; busca anunciada com `role="status"`.
- Estado nunca só por cor: erro tem ícone e texto.
- Alvos de toque de pelo menos 44px (`layout.touchTarget`); foco visível com o contorno do sistema.
- Contraste AA nos temas claro e escuro da tela de consulta; o cartaz é sempre o tema claro com asfalto sobre giz (contraste alto).
- Teclado de celular: o campo pede teclado de letras e números com maiúsculas automáticas (`autocapitalize`) e sem correção ortográfica. [A CONFIRMAR no Tech Spec: se o teclado customizado de placa do sistema (`useTecladoCampo`) vale para a página pública, que não tem o resto do aplicativo. Se não valer, usar o teclado nativo.]
- `robots: noindex, nofollow`; título da aba "Consultar ticket — GIPE".

## Responsividade

- **Celular:** a coluna ocupa a tela toda; o campo da placa e o botão em largura total; o campo recebe foco ao abrir sem o teclado cobrir o botão (o botão sobe junto com o teclado).
- **A partir de `md` (768px):** a mesma moldura de celular centralizada do comprovante e do recibo.
- Mensagens longas quebram linha; nada rola na horizontal.
- **Cartaz:** tamanho fixo A4 independente da tela; em tela só existe durante a impressão, então não há versão responsiva.
