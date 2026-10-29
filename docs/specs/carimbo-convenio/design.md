# Design Spec: Carimbo de Convênio

Insumo para o Tech Spec, a partir de `prd.md` (RF1 a RF11). Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto.

**Direção:** tela de operação (*Operate*) usada no balcão da conveniada, quase sempre em celular, com o cliente esperando à frente. O leitor de QR é o centro da tela e o resultado precisa ser lido de relance, com uma mão. A ousadia fica no resultado: ele é desenhado como um **ticket carimbado** (selo do convênio na cor `cliente.conveniado` já usada na marca), para a conveniada reconhecer na hora que o carimbo valeu. Nada de decoração além disso: clareza e confiança acima de expressão.

## 1. Telas e estados

Uma rota na área logada: `/carimbo` (menu "Carimbar ticket"). Tudo acontece na mesma tela, sem modal e sem navegação entre leitura e resultado.

```
┌ Carimbar ticket ─────────────────────┐
│ Aponte a câmera para o QR Code do    │
│ ticket de entrada do cliente.        │
│                                      │
│        ┌ ─ ─ ─ ─ ─ ─ ┐               │
│        │   ▢ visor ▢  │  ← leitor    │
│        └ ─ ─ ─ ─ ─ ─ ┘               │
│        Toque para ativar a câmera    │
└──────────────────────────────────────┘
```

| Estado | Comportamento visual |
|--------|----------------------|
| Ocioso | Visor com a mensagem "Toque para ativar a câmera" (mesmo comportamento do leitor da saída). A câmera abre ao tocar, e na primeira visita ou se a permissão estiver pendente. |
| Abrindo / lendo | Visor com a imagem da câmera e as miras de canto (`warn`). Mensagem de apoio sob o visor. |
| QR inválido | Miras em `danger` por instantes e anúncio "QR Code não é um ticket Murel"; a leitura continua sem sair da tela. |
| Carimbando | A câmera pausa, as miras ficam `success` e o visor anuncia "Carimbando…" (`aria-live`). Nenhuma nova leitura é enviada enquanto isso (evita carimbo duplicado). |
| Sucesso | O visor dá lugar ao **ticket carimbado** (ver 1.1). Botão primary "Carimbar outro ticket" volta ao leitor. O resultado **não some sozinho**: fica até a conveniada tocar. |
| Erro de negócio | `ErrorBanner role="alert"` acima do visor com a mensagem do caso; o leitor volta a ficar ativo para tentar outro ticket. |
| Câmera negada | Mensagem "Permita o acesso à câmera e toque aqui" no visor, com o mesmo comportamento do leitor da saída. |
| Câmera indisponível | Visor com "Câmera indisponível neste navegador" e orientação para abrir em outro navegador ou dispositivo (a digitação manual está fora do escopo do PRD). |
| Sem permissão (403) | Bloco de erro com "Você não tem permissão para carimbar tickets.", sem tentar de novo. |
| Falha de conexão | `ErrorBanner` com a mensagem de conexão e botão secondary "Tentar novamente" (reenvia o mesmo token sem exigir nova leitura). |

### 1.1 Resultado: o ticket carimbado

```
┌──────────────────────────────────────┐
│ ✔ Ticket carimbado          ⟨CONVÊNIO⟩│  ← selo (StatusBadge conveniado)
│ ──────────────────────────────────── │
│ ┌ BRASIL ┐                           │
│ │ TEP6I32│  Fusca · Prata            │  ← PlateDisplay
│ └────────┘                           │
│ Estacionamento     teste 2           │
│ Categoria          Carro             │
│ Entrada            29/10 18:15       │
│ Tabela aplicada    convenio mercado 1│
│ Carimbado às       29/10 18:15       │
│                                      │
│ [        Carimbar outro ticket     ] │
└──────────────────────────────────────┘
```

- Título "Ticket carimbado" em `Text heading` com ícone de confirmação em `success`; o texto é quem diz o estado, nunca só a cor.
- Placa em destaque com `PlateDisplay` (tamanho md); modelo e cor ao lado em `Text`.
- Os demais dados em lista de pares rótulo/valor (`textMuted` no rótulo): estacionamento, categoria (nome da categoria, não o número), entrada, tabela de convênio aplicada e hora do carimbo.
- Selo "Convênio" com `StatusBadge tone="conveniado"` no canto do ticket. É o único acento de cor do resultado.
- Entrada leve do ticket (subida curta com opacidade), desligada em `prefers-reduced-motion`.
- Datas no fuso local, formato curto ("29/10 18:15"), como nas demais listas.

## 2. Mensagens

Sucesso: o próprio ticket carimbado é o retorno (sem `Toast`), para a conveniada ler os dados com o cliente à frente.

Erro (`ErrorBanner`). O back devolve a mensagem de regra de negócio e o client a coloca em `ApiError.message`; a tela a exibe como veio, sem mapear por texto. Só duas mensagens são da própria tela:

| Caso | Texto |
|------|-------|
| QR que não é de ticket Murel (lido no aparelho) | "QR Code não é um ticket Murel" |
| Sem permissão (403) | "Você não tem permissão para carimbar tickets." |
| Demais casos (já carimbado, mensalista, fora do pátio, sem tabela aplicável) | Mensagem do back. Se o back passar a mandar um código estável, a tela pode trocar por textos próprios (o Tech Spec decide). |

## 3. Decisões que o design assume (revisar no PRD)

- **RF3, confirmação antes de carimbar:** recomendação de **carimbar direto** na leitura. Ler o QR já é o gesto deliberado, o cliente está presente e uma confirmação a cada ticket deixaria o balcão lento. O risco (sem desfazer) é coberto pelo resultado explícito e pelo erro claro de "já carimbado". Se o produto preferir confirmar, o ticket carimbado vira uma tela de confirmação com "Carimbar" e "Cancelar" antes da chamada.
- **Entrada digitada:** fora do escopo, conforme o PRD. Sem câmera, a tela só informa a limitação.

## 4. Componentes do design system

### Reaproveitados
- **Leitor de QR da saída** (`LeitorQrSaida` + `useLeitorQr`): já cuida de câmera, permissão, mira, vibração e extração do token do comprovante. O Tech Spec decide entre reutilizar como está ou promover para um nome neutro, sem o "Saida".
- **PlateDisplay**, **StatusBadge** (tom `conveniado`), **Button**, **Card**, **Text**, **ErrorBanner**, **Skeleton** (se houver carregamento da sessão).
- **ErroSemPermissao** para o 403.

### Novos
Nenhum componente em `ui`. O ticket carimbado é peça da própria feature (`components/carimbo`).

## 5. Tokens usados

- Cores: `surface`/`border` (cartão do resultado e do visor), `success` (confirmação e miras ao carimbar), `danger` (erro e mira de QR inválido), `warn` (miras em espera), `textMuted` (rótulos), `cliente.conveniado` (selo, via `StatusBadge`), `focus`.
- Espaçamento da escala `space`; tipografia de `fontSizes`/`fontWeights`; título da página com `typography.display`.
- Raios `radii.lg` no cartão. Nenhum token novo.

## 6. Responsividade

- **Celular (principal):** coluna única, conteúdo com a largura toda menos a margem padrão. O visor mantém o tamanho do leitor da saída; o botão "Carimbar outro ticket" ocupa a largura toda e fica ao alcance do polegar, com alvo de 44px no mínimo.
- **Tablet e desktop:** coluna centralizada com largura máxima do conteúdo (~480px), sem layout em duas colunas: a tela é de uma tarefa só. O visor segue o mesmo tamanho e o ticket carimbado ocupa o lugar dele.
- Mantém o menu padrão do aplicativo (lateral em telas grandes, barra inferior no celular).

## 7. Acessibilidade

- Resultado e erros anunciados: o ticket carimbado entra com `role="status"` e foco no título, para leitores de tela; `ErrorBanner` com `role="alert"`.
- O estado "Carimbando…" é anunciado uma única vez (`aria-live="polite"`), como no leitor da saída.
- O visor é um botão com nome acessível; toda ação é operável por teclado e o foco volta ao visor ao tocar em "Carimbar outro ticket".
- O estado do carimbo nunca depende só da cor (texto "Ticket carimbado" e ícone com rótulo). Contraste AA nos dois temas.
- Respeita `prefers-reduced-motion` na entrada do ticket e na varredura da mira.

## 8. Navegação

- Item "Carimbar ticket" (rótulo curto "Carimbo") no menu lateral e na barra inferior, visível conforme a permissão do módulo; precisa de um ícone novo de carimbo no conjunto de ícones do menu.
- A tela inicial dos perfis de conveniada deveria ser `/carimbo`: hoje o dashboard deles é praticamente vazio, porque os indicadores do pátio só aparecem para quem tem acesso ao pátio. Decisão para o Tech Spec.
- O dashboard continua visível a todos os perfis, e o carimbo só aos perfis de conveniada (padrão), ajustável pela permissão por módulo.
