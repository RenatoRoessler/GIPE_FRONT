# Design Spec: Conferência de pátio

Insumo para o Tech Spec. Baseado em `prd.md` (RF-01 a RF-12) e no protótipo `docs/murel-conferencia-patio.html`, que é o modelo pedido: o fluxo, a ordem das telas e os textos seguem o protótipo. Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto. Complementa o pátio (`docs/specs/patio/design.md`), a saída (`docs/specs/saida-veiculos`), a entrada (`docs/specs/entrada-veiculos`) e o leitor de placa (`docs/specs/leitor-placa/design.md`).

> A direção visual já está decidida pelo protótipo, por isso não houve uma nova rodada de exploração de layout. O que a spec faz é traduzir o protótipo para os tokens e componentes reais do GIPE e estender o que ele só mostra em 430px para o computador.

## Direção

Tela **Operate**, usada em pé, no celular, andando entre os carros. Herda o mundo visual do GIPE (asfalto, faixa amarela, fonte do app). O que a define:

- **Uma pergunta por tela.** Iniciar, conferir, resolver divergências e resumir são quatro telas em sequência, cada uma com uma ação principal fixa no rodapé, ao alcance do polegar.
- **O progresso é o número que importa.** "34 de 42 conferidos" e uma barra: o operador sempre sabe quanto falta, sem abrir nada.
- **A placa é o rosto de cada carro**, no mesmo `PlateDisplay` do resto do sistema. O tipo de cliente é um selo redondo com a inicial (P, M, C) nas cores de `colors.cliente`, sempre acompanhado do nome por extenso em algum lugar da tela.
- **Salvo a cada placa.** A tela repete "Salvo a cada placa" e não tem botão de pausar; sair é seguro.
- **Cor nunca fala sozinha.** Verde, vermelho e amarelo reforçam textos como "Conferido", "Sem entrada" e "Em andamento".

O que **não** fazer: tabela no celular; confirmar leitura com modal (o resultado aparece no visor); alertas vermelhos para pendente comum (só divergência é vermelha); pedir confirmação para "Está no pátio" (a ação é desfazível); mostrar posição de chave editável (fora do escopo).

---

## 1. Telas e estados

A conferência é uma sequência de telas dentro da mesma página, em `/conferencia-patio`; o estado (início, conferindo, divergências, resumo) fica no endereço para o botão voltar do navegador e do aparelho funcionar. No celular cada tela é uma coluna única, com o rodapé fixo (`ActionBar`). Do computador (`breakpoints.lg`) em diante, o conteúdo ocupa a coluna central de `layout.contentMaxWidth` e as telas **Conferindo** e **Divergências** ganham duas colunas (ver cada uma).

### A. Entrada no menu

Novo item "Conferência" em `src/lib/nav.ts`, com a mesma área do Pátio (`AREA.Patio`), logo depois de "Caixa" na ordem do menu, e com um ícone novo de prancheta com marca de conferido. No celular ele cabe sozinho no "Mais" (menu estendido) já existente, sem prioridade na barra inferior. O menu não tem linha de apoio por item, então o andamento da conferência aparece só dentro da página.

### B. Início

```
←  Conferência de pátio
   TER 04/11 · 14:32

┌──────────────────────────────────────┐
│ NO SISTEMA AGORA                     │
│ 42  veículos no pátio                │
│ (P) 30 avulsos (M) 8 mensais (C) 4 … │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ Última conferência   hoje 09:12 · Ana │
└──────────────────────────────────────┘

COMO CONFERIR
(•) Ler placas com a câmera
    Caminhe pelo pátio apontando para as placas…
( ) Marcar pela lista
    Para pátio pequeno ou pouca luz…

ⓘ Entradas e saídas continuam funcionando durante a conferência.

[        Iniciar conferência        ]
```

- **Cabeçalho (RF-02):** `BackButton`, título "Conferência de pátio" e, abaixo, um rótulo em `fontFamilies.mono`, `fontSizes.xs`, caixa alta e espaçamento de letras, em `textMuted`, com o dia e a hora.
- **Cartão "No sistema agora":** `Card`. O total em `fontSizes.xxl` com `fontWeights.extrabold`, `tabular-nums` e `colors.accent` (nunca `primary` como cor de texto); ao lado, "veículos no pátio". Abaixo, três selos de tipo (avulsos, mensais, conveniados) com a contagem. Um divisor tracejado separa a linha "Última conferência" (data, hora e operador; "Incompleta" em texto quando encerrada pelo fechamento do caixa; "nenhuma" se nunca houve).
- **Método (RF-03):** `OptionGroup` (radio) com duas opções, cada uma com ícone, título e descrição. "Câmera" vem escolhida; se a câmera não está disponível (sem permissão ou sem aparelho), a opção fica desabilitada com a frase "Câmera indisponível neste aparelho" e a lista vem escolhida.
- **Aviso:** bloco informativo (`InfoCard`) sobre entradas e saídas continuarem funcionando.
- **Ação:** `Button` grande no rodapé fixo. "Iniciar conferência"; com conferência aberta o grupo de método some, aparece o aviso "Há uma conferência em andamento, iniciada às 08:40 por Ana: **34 de 42** conferidos." e o botão vira "Continuar conferência" (RF-04).
- **Sem caixa aberto:** o botão fica desabilitado e um `ErrorBanner` de aviso explica "Abra o caixa para iniciar a conferência." com o link "Abrir caixa". A conferência em andamento (se houver) continua acessível.

**Computador:** a mesma coluna, centralizada e limitada a 560px, sobre `PageBackground`; o botão deixa de ser fixo no rodapé e fica ao fim do conteúdo.

### C. Conferindo

```
←  Conferindo pátio
   SALVO A CADA PLACA

34 de 42 conferidos                    81%
████████████████████░░░░

┌ Câmera ─────────────────────────────┐
│ ┌                               ┐   │
│          [ BRA 2E19 ]               │
│     ✓ Conferido · Gol               │
│ └                               ┘   │
└─────────────────────────────────────┘

[Faltam 8] [Conferidos 34] [Divergências 2]

[BRA2E19]  Gol · Prata              (P)
           Chave A1 · desde 15:30
  [✓ Está no pátio]  [Não achei]
─────────────────────────────────────
[           Ver resumo              ]
          ⌨ Digitar placa
```

- **Progresso (RF-05):** a frase "34 de 42 conferidos" com o número conferido em `tabular-nums` e `fontWeights.extrabold`, o percentual em `fontFamilies.mono` e `textMuted`, e uma barra (`role="progressbar"` com valor, mínimo, máximo e nome) com trilho `surfaceMuted` e preenchimento `success`, raio `full`.
- **Visor da câmera (só no método câmera):** reaproveita o leitor de placa já existente (`LeitorPlacaModal` e seu hook de câmera) como bloco embutido na página, e não como modal. O visor tem fundo escuro fixo nos dois temas, quatro cantos de enquadramento em `colors.primary` (os mesmos do leitor de QR) e, no centro, a última placa lida em `PlateDisplay size="lg"` e o resultado dela em um selo redondo. A região é `aria-live="polite"`.
  - *Resultados da leitura (RF-06):* "Conferido · {modelo}" (`success`, com ícone de visto); "Já conferido antes" (`textMuted`); "Sem entrada · Registrar agora" (`danger`, é um botão que abre a folha de registrar entrada); "Entrada registrada" (`success`). Placa inválida: `Toast` "Placa inválida. Use o formato ABC1D23 ou ABC-1234." e nada é enviado.
  - *Câmera sem permissão ou sem sinal:* o visor mostra a explicação ("Permita o uso da câmera ou digite a placa") e o botão "Digitar placa"; o método não muda sozinho.
  - Cada placa lida fica em espera de 2 segundos antes de aceitar a mesma placa de novo, para não repetir a leitura (regra do Tech Spec).
- **Filtros (RF-05):** botões em formato de pílula (`radii.full`, `aria-pressed`, com a altura mínima de `touchTarget` ao toque; não é o `Tabs` do design system, que tem painéis): "Faltam 8", "Conferidos 34" e, só quando houver, "Divergências 2" com `danger` na borda e no texto, que leva à tela de divergências. O filtro padrão é "Faltam".
- **Lista de veículos (RF-05, RF-07):** `ul` de itens em `surface`, `radii.md`, `space[3]` de padding. Em cada item:
  - linha 1: `PlateDisplay size="sm"`, modelo · cor em `fontWeights.extrabold`, e à direita o selo do tipo;
  - linha 2: "Chave A1 · desde 15:30" (ou "Sem chave") em `fontFamilies.mono`, `fontSizes.xs`, `textMuted`;
  - ação por situação: **Pendente** → dois botões lado a lado, "Está no pátio" (com visto em `success`) e "Não achei", ambos `secondary` com 44px; **Conferido** → "Conferido 14:20 · câmera" em `success` e o botão de texto "Desfazer"; **Não encontrado** → "Não encontrado" em `danger` e "Procurar de novo".
  - Veículo de conveniada tem o tipo também por extenso, na linha 2 ("Conveniado").
- **Rodapé fixo (`ActionBar`):** a câmera lê placas continuamente, então a ação principal é "Ver resumo" (ou "Resolver divergências", se houver); só quando a câmera parou (sem leitura por um tempo ou sem permissão) a ação principal passa a ser "Ler placas", que a liga de novo. Abaixo, o botão de texto "Digitar placa" abre a folha de placa digitada (seção G).
- **Lista vazia por filtro:** "Nenhum carro faltando. Pode ver o resumo." e "Nenhum carro conferido ainda."

**Computador (≥ `breakpoints.lg`):** duas colunas. À esquerda, fixa com `layout.stickyTop`, o progresso, o visor e as ações ("Ler placas", quando a câmera parou, "Digitar placa" e "Ver resumo"); à direita, os filtros e a lista, que rola sozinha. As ações deixam de ser um rodapé fixo.

### D. Divergências

```
←  Divergências
   2 PARA RESOLVER

NO SISTEMA, NÃO ESTÁ NO PÁTIO
[MNB7880] Gol · Prata                (C)
          Entrada 15:30 · 4h 12min no sistema
ⓘ Conveniado: o valor da saída vai para a fatura…
  [Procurar de novo]  [Dar saída]

NO PÁTIO, SEM ENTRADA
[QWE1R23] Sem ticket aberto
          Lida às 14:10
  [Leitura errada]  [Registrar entrada]

[            Ver resumo             ]
```

- Seções com rótulo em mono, caixa alta, `textMuted`. Cada seção só aparece se tiver itens (RF-08, RF-09).
- Subtítulo do cabeçalho: "2 para resolver" em `danger`, ou "Tudo resolvido" em `success`; sem divergências, "Nenhuma divergência. O pátio bate com o sistema."
- Aviso de conveniado no item "não encontrado": `InfoCard` compacto com a cor `cliente.conveniado` no ícone e o texto "Conveniado: o valor da saída vai para a fatura da conveniada. Confira o horário antes de dar baixa."
- Dois botões lado a lado por item. Depois de qualquer ação, o item some com a transição curta (desligada em `prefers-reduced-motion`) e o foco vai para o item seguinte ou, se não restar nenhum, para o botão "Ver resumo".
- **Fora desta versão:** a seção "Chave fora do lugar" do protótipo não existe (ver `prd.md`, Fora do Escopo).

**Computador:** a lista em uma coluna centralizada de 560px; os botões do item viram uma linha à direita.

### E. Resumo

```
←  RESUMO DA CONFERÊNCIA

        ( ! )
      Quase lá
04/11 · 13:40 às 14:32 · 52min · Ana

 42          34          3
no sistema  conferidos  ajustes feitos

ⓘ Faltam 8 carros. Se finalizar agora, ficam como não encontrados.
⚠ 2 divergências sem resolver. Toque para ver.

AJUSTES
BRA2E19  Saída · saiu sem baixa
QWE1R23  Entrada registrada

OBSERVAÇÃO (OPCIONAL)
[                                    ]

[       Finalizar conferência        ]
```

- Cabeçalho do resumo: ícone redondo (visto em `success` se tudo conferido e sem divergência; exclamação em `danger` caso contrário), título "Pátio conferido" ou "Quase lá", e a linha de data, intervalo, duração e operador em mono.
- Três números em `Card`s iguais (`no sistema`, `conferidos`, `ajustes feitos`), em `fontSizes.xl`, `fontWeights.extrabold`, `tabular-nums`. São o resumo de um fechamento, não uma vitrine: sem gráfico.
- Avisos como `InfoCard`: pendentes (informativo) e divergências (botão que leva à tela D, com `danger` no ícone).
- **Ajustes (RF-10):** lista com a placa em mono e a descrição pronta que a API devolve, em `textMuted`. Sem ajustes: "Nenhum ajuste nesta conferência."
- **Observação:** `Input` multilinha, 3 linhas, com contador "0/500" em `textMuted`; opcional.
- **Finalizar:** `Button` principal. Ao concluir: `Toast` "Conferência finalizada · 34 de 42 conferidos" e volta para o início da página (com a "Última conferência" já atualizada). Erro: `ErrorBanner` acima do botão, sem perder a observação digitada.
- Imprimir ou exportar o resumo: fora do escopo.

### F. Folha "Dar saída" (RF-08)

Usa `Modal` (no celular, em formato de folha na base da tela; no computador, caixa centralizada de 480px). Título "Dar saída" e a placa do veículo em `PlateDisplay`.

- **Campo "Motivo":** `Select` com "Saiu sem baixa", "Ticket duplicado", "Entrada registrada por engano" e "Outro".
- **Campo "Descrição":** `Input` multilinha, só aparece e é obrigatório em "Outro", com contador "0/300".
> **Mudança (pedido do usuário):** o "Dar saída" da conferência pede apenas o motivo (e a descrição em "Outro"). Não consulta valor, não pede pagamento e não mostra recibo; envia `valor: 0` e `formaPagamento: 1` (Dinheiro), que o endpoint exige. Prevalece sobre o que está descrito abaixo sobre valor, pagamento e recibo.

- **Valor da saída:** o `ResumoSaida` e o `PagamentoSaida` existentes mostram o cálculo vindo da busca de saída por placa. Quando o valor é zero, a seção de pagamento não aparece e o texto diz "Sem valor a cobrar". Boleto e transferência não são oferecidos.
- **Rodapé:** "Cancelar" (secundário) e "Confirmar saída" (principal). Durante o envio, os dois ficam desabilitados e o principal vira "Registrando…".
- **Estados:** o cálculo carrega com `Skeleton` do tamanho do resumo; erro de cálculo ou "caixa fechado" aparecem como `ErrorBanner` dentro da folha, o botão "Confirmar saída" fica desabilitado e o veículo continua como não encontrado.
- Ao concluir: `Toast` "Saída registrada." e, quando o fluxo de saída já tem recibo, o mesmo recibo (`ReciboSaidaStep`) antes de fechar.

### G. Folhas de placa digitada e de entrada

**Digitar placa:** folha com um único campo `PlateInput` (o componente de placa já usado na entrada e na saída; teclado de placa do app em telas de toque), botões "Cancelar" e "Conferir". Placa inválida: erro do campo e nada é enviado. Depois de conferir, a folha fecha e o resultado aparece no visor (ou, no método lista, em `Toast`: "BRA 2E19 conferido", "BRA 2E19 já estava conferido" ou o aviso de sem entrada).

**Registrar entrada** (placa sem ticket): folha com a placa em `PlateDisplay` e os campos, na ordem:
1. *Categoria* — o seletor de categoria já usado na entrada (`categoriaIcons`);
2. *Modelo* e *Cor* — os mesmos campos da entrada de veículos (modelo até 80, cor até 50), obrigatórios;
3. *Código do ticket* — opcional, numérico;
4. *Mensalista* — `Switch` "Entrar como mensalista" (desligado por padrão).

Se a API recusar o mensalista, o motivo aparece num `ErrorBanner` dentro da folha e o `Switch` volta a desligado, com a frase "Você pode registrar como avulso." Botões: "Depois" (fecha sem descartar) e "Registrar e conferir". Sucesso: `Toast` "Entrada registrada." e a placa some das divergências.

### H. Estados gerais (RF-11)

| Estado | Comportamento |
|---|---|
| Carregando o início ou a conferência | Esqueletos (`Skeleton`) no formato do cartão e de quatro itens da lista, `role="status"` "Carregando a conferência". Sem saltos de layout. |
| Enviando uma marcação | O botão pressionado mostra o estado "ocupado" e fica desabilitado; o item muda de situação só quando a API confirma (o operador nunca vê "Conferido" de algo que não foi gravado). |
| Leitura sem conexão | `Toast` de erro "Não foi possível gravar a placa BRA2E19. Tente de novo.", e a placa não entra no progresso. |
| Erro ao carregar | `ErrorBanner role="alert"` com a mensagem do back e "Tentar novamente"; sem o botão em erro de permissão (403). |
| Outra conferência encerrada por outro operador | `ErrorBanner` de aviso "Esta conferência foi encerrada." com o botão "Voltar ao início"; o que já foi gravado não se perde. |
| Conferência já aberta ao iniciar | A tela se atualiza para o aviso de "em andamento" e o botão "Continuar conferência". |
| Caixa fechado durante a conferência | Mesmo aviso, com "Encerrada no fechamento do caixa (incompleta)". |
| Sem permissão | Mesma tela de acesso negado das outras páginas. |

---

## 2. Componentes

**Reaproveitados:** `Button`, `Card`, `InfoCard`, `ActionBar`, `BackButton`, `OptionGroup`, `Input`, `Select`, `Switch`, `Modal`, `ConfirmDialog`, `PlateDisplay`, `StatusBadge`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`, `PageBackground`, `categoriaIcons`; o leitor de placa (`LeitorPlacaModal` e o hook de câmera), `BuscaManualSaida` e `PlateInput`; `ResumoSaida`, `PagamentoSaida` e `ReciboSaidaStep` do fluxo de saída; o cadastro de entrada (`EntradaVeiculoModal`) para os campos de categoria, modelo e cor.

**Mudanças no design system (`src/components/ui`):**
- **`ProgressBar`** (novo): barra com `role="progressbar"`, trilho `surfaceMuted` e preenchimento `success`; props `value`, `max`, `label`. Hoje a barra é desenhada à mão dentro de cada tela de gráficos; a conferência é o segundo uso.
- **`TipoClienteBadge`** (novo): selo redondo com a inicial (P, M, C) nas cores de `colors.cliente` e o texto por extenso como `title`/`aria-label`; props `tipo` e `size`. A tela de relatórios e os selos já usam essas cores em outros lugares, mas sem um componente comum.
- **`StatusBadge`**: nenhuma mudança; "Conferido", "Não encontrado" e "Sem entrada" usam os tons existentes.

**Mudanças em componentes existentes:**
- `useLeitorPlaca`: nova opção `continuo`, para seguir lendo depois da primeira placa. O visor da conferência usa o hook direto; o `LeitorPlacaModal` não muda.
- `src/lib/nav.ts` e o menu: novo item "Conferência" e um novo ícone no conjunto de ícones do menu (`NavIconId`).
- `SaidaVeiculoModal`/`PagamentoSaida`: precisam aceitar um envio diferente do `POST patio/{id}/saida` (o da conferência), mantendo os mesmos campos (Tech Spec).

**Novos (`src/components/conferencia/`):** `ConferenciaPage` (controla a tela atual), `ConferenciaInicio`, `ConferenciaConferindo`, `ConferenciaItem`, `ConferenciaDivergencias`, `ConferenciaResumo`, `DarSaidaConferenciaModal`, `RegistrarEntradaConferenciaModal`, `DigitarPlacaModal` e as regras puras (totais, filtros, textos de ajuste). Nomes e pastas finais ficam a cargo do Tech Spec.

## 3. Tokens

**Nenhum token novo no tema.**
- **Cores:** `background`, `surface` (cartões e itens), `surfaceMuted` (trilho da barra), `text`, `textMuted`, `border`, `borderStrong` (botões secundários e campos), `primary` (botão principal, cantos do visor), `accent` (números de destaque), `success` (conferido, barra), `danger` e `dangerSoft` (divergência), `cliente.avulso`/`mensal`/`conveniado` (selos de tipo; texto sobre elas é sempre asfalto), `focus`.
- **Espaçamento:** `space[2]` entre selo e texto e entre botões lado a lado; `space[3]` dentro dos itens; `space[4]` entre blocos e no padding da página; `space[5]` em cartões grandes.
- **Tipografia:** `fontFamilies.mono` nos rótulos de seção, na linha de chave/hora e nas placas digitadas; `fontSizes.xxl` no total do início, `xl` nos três números do resumo e no título, `md` e `sm` no corpo; `fontWeights.extrabold` nos números e nos nomes dos carros; `tabular-nums` em toda contagem, hora e porcentagem.
- **Raios:** `radii.md` nos itens, `radii.lg` nos cartões e na folha, `radii.full` nas pílulas, selos e na barra.
- **Layout:** `layout.touchTarget` (44px) em toda ação, `layout.actionBarHeight` no espaço reservado ao rodapé fixo no celular, `layout.contentMaxWidth` e `layout.stickyTop` no computador.
- **Foco:** anel padrão do projeto.
- O fundo do visor da câmera é uma cor fixa de equipamento, igual nos dois temas, e não um token de tema (como a placa e o visor do leitor de QR).

## 4. Responsividade e acessibilidade

**Responsividade**
- Celular (até `breakpoints.md`): uma coluna, rodapé fixo com a ação principal e a ação secundária de texto, folhas na base da tela com `max-height` de 90% e rolagem interna; sem rolagem horizontal a partir de 320px.
- De `breakpoints.md` a `breakpoints.lg`: a mesma coluna, centralizada e limitada a 560px, ações ao fim do conteúdo.
- A partir de `breakpoints.lg`: duas colunas em "Conferindo" (progresso, visor e ações à esquerda; filtros e lista à direita) e coluna central nas demais.
- Dois botões lado a lado nunca quebram o texto em duas linhas: em 320px os rótulos "Está no pátio" e "Não achei" cabem em 44px de altura, e se o texto crescer (zoom do sistema) os botões empilham.
- Áreas de toque de pelo menos 44px; o rodapé respeita a área segura do aparelho.

**Teclado e leitor de tela**
- Um `h1` por tela, com o nome da etapa; o botão voltar tem nome acessível ("Voltar", "Voltar para a conferência") e informa que a conferência fica salva.
- Os botões da lista têm nome com a placa: "Está no pátio: BRA2E19", "Não achei: BRA2E19", "Desfazer: BRA2E19", "Dar saída: MNB7880".
- O resultado da leitura é anunciado (`aria-live="polite"`), com a placa dita letra a letra ("B R A 2 E 1 9") para não ser lida como palavra.
- Progresso com `role="progressbar"`, `aria-valuenow`, `aria-valuemax` e nome "Progresso da conferência"; a frase "34 de 42 conferidos" fica em `role="status"` e só é anunciada após uma marcação, não a cada leitura repetida.
- Os filtros são `aria-pressed`; a quantidade faz parte do nome ("Faltam, 8").
- Tipo de cliente, situação e resultado sempre em texto; a cor só reforça. Contraste mínimo de 4,5:1 nos dois temas (texto sobre os selos `cliente` é asfalto).
- Depois de marcar um carro, o foco vai para o item que passa a ocupar o lugar; ao esvaziar o filtro, para a mensagem de lista vazia. Nas folhas, o foco entra no primeiro campo e volta ao botão que a abriu.
- `prefers-reduced-motion`: sem transição na barra e na saída dos itens.

**Pontos a validar na implementação**
- **Leitor contínuo:** que o leitor de placa funciona como bloco da página (e não só em modal), inclusive ao trocar de aba do navegador e ao voltar do segundo plano no celular.
- **Repetição de leitura:** o intervalo para ignorar a mesma placa lida em sequência e o que o operador vê quando a câmera lê duas placas ao mesmo tempo.
- **Saída pela conferência:** que o cálculo da busca de saída por placa serve para o envio da conferência e que o recibo é o mesmo.
- **Volume:** o comportamento da lista com centenas de veículos (a conferência devolve tudo de uma vez); se necessário, mostrar os primeiros N com "Ver os outros".
- **Estado compartilhado:** como a tela se atualiza quando outro operador também marca placas na mesma conferência (atualizar ao voltar à aba, ao marcar ou sob comando).
- **Valores livres:** modelo e cor vindos da API com texto livre não podem quebrar o layout do item; truncar com reticências e `title`.
- **Fora desta versão:** relatórios de conferências, divergência de chave, exportação em CSV e PDF.
