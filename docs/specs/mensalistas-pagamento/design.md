# Design Spec: Pagamento do mensalista

Insumo para o Tech Spec. Baseado em `prd.md` (RF-01 a RF-06). Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto. Complementa `docs/specs/mensalistas-contrato/design.md`, que continua valendo para lista, ficha e `StageTrack`.

Superfícies:
- **(A)** ficha do mensalista (`MensalistaFichaModal`): é a "página do mensalista" do PRD e o ponto principal de entrada;
- **(B)** lista de mensalistas: atalho "Receber pagamento" na própria linha;
- **(C)** modal de pagamento: formulário e, no mesmo modal, a confirmação do resultado.

## Direção

Tela **Operate**, usada no balcão com o cliente na frente: o caminho mais curto possível, sem surpresas. Não é um redesenho; a ousadia fica em duas escolhas:

1. **O pagamento é o fim da trilha.** A jornada Cadastro → Contrato → Pagamento já existe na lista e na ficha. O botão de receber nasce na etapa "Pagamento" quando ela é a etapa atual, e o resultado fecha a trilha inteira em verde. O operador vê a feature como "o último passo" e não como um formulário avulso.
2. **O resultado é um comprovante, não um toast.** Receber dinheiro exige que o operador veja o que ficou gravado (valor, forma, data) e o que vem a seguir (próxima cobrança). A confirmação usa a mesma linguagem do selo de aceite e do recibo de saída (borda tracejada, `success`), e não some sozinha.

Não fazer: confirmação em `ConfirmDialog` extra (o botão de confirmar já diz valor e forma); campos para empresa, usuário ou origem (vêm da sessão); desabilitar o botão sem dizer o motivo.

---

## 1. Telas e estados

### A. Ficha do mensalista

Ganha um bloco **Pagamento** logo abaixo de **Contrato**, e a ação no rodapé.

```
┌ Maria Souza ─────────────────────────────── ✕ ┐
│ CPF 123.456.789-00 · Diurno · Carro · R$ 280  │
│                                               │
│ CONTRATO                                      │
│ ●──────●──────◐                               │
│ Cadastro  Contrato   Pagamento                │
│ Contrato aceito em 20/10/26. O mensalista     │
│ fica ativo após o primeiro pagamento.         │
│                                               │
│ PAGAMENTO                                     │
│ Vencimento dia 5 · próxima em 05/11/26        │
│ Mensalidade R$ 280,00                         │
│                                               │
│ VEÍCULOS (1) …                                │
│ [Reenviar contrato] [Editar] [Registrar pagamento]│
└───────────────────────────────────────────────┘
```

- O bloco "Pagamento" mostra o vencimento do cadastro ("dia 5"), a data do próximo vencimento (`dataProximoVencimento`, quando a listagem traz) e o valor da mensalidade do tipo. Não repete o texto do bloco Contrato.
- "Registrar pagamento" é o botão primário do rodapé; "Editar" passa a secundário. Ao clicar, a ficha é trocada pelo modal de pagamento (C), como já acontece com "Editar".

| Situação do mensalista | Botão "Registrar pagamento" | Texto do bloco Pagamento |
|---|---|---|
| Ativo | Habilitado | Vencimento e valor |
| Aguardando 1º pagamento (contrato aceito) | Habilitado, é a ação principal | "Primeiro pagamento ativa o cadastro." |
| Aguardando aceite / link vencido / sem contrato | Aparece **com `aria-disabled`**, focável | "O primeiro pagamento só é liberado depois do aceite do contrato." + o "Reenviar contrato" do rodapé continua à mão |
| Inativo (já pagou antes) | Habilitado | Vencimento e valor |
| Carregando contrato | Habilitado só depois que a situação é conhecida; antes, `Skeleton` no bloco | — |
| Falha ao consultar o contrato | Habilitado (a API decide e devolve o erro tratado em C) | Sem texto extra |

O botão com `aria-disabled` (e não `disabled`) mantém o foco e deixa o leitor de tela ler o motivo, ligado por `aria-describedby` ao texto do bloco. O clique não faz nada. Isso cumpre o RF-05 sem esconder a ação do operador. O bloqueio definitivo continua sendo da API (RF-06).

Mensalista sem cobrança pendente (RF-01): enquanto a API não informar isso à tela ([A CONFIRMAR] no PRD), o botão fica habilitado e a resposta da API é traduzida no modal. Se a listagem passar a informar, o botão fica `aria-disabled` com "Não há cobrança pendente."

### B. Lista de mensalistas

- **Linha em "Aguardando 1º pagamento":** a célula de Situação ganha o botão `Button variant="primary" size="sm"` **"Receber pagamento"** (aria-label "Receber pagamento de Maria Souza"), no mesmo lugar do "Reenviar" das outras situações. É o próximo passo da trilha, então é a única ação em destaque da linha.
- **Demais linhas (ativo, inativo):** um novo `IconButton` "Registrar pagamento" (ícone de cédula) na coluna Ações, entre "Ver ficha" e "Editar", com área de toque de 44px e `title`/`aria-label="Registrar pagamento de Maria Souza"`.
- Linhas que ainda esperam o aceite do contrato não ganham atalho de pagamento; o caminho delas é pela ficha, onde o motivo é explicado.
- Depois do pagamento, a linha atualiza sozinha (situação, vencimento e valor) e o `Toast` confirma. Sem recarregar a página.

`SituacaoMensalista` (`apresentarSituacao`) ganha a ação `"Receber pagamento"` para `aguardando-pagamento`, além de `"Reenviar"` e `"Enviar contrato"`.

### C. Modal de pagamento (`PagamentoMensalistaModal`)

`Modal size="md"`, título "Registrar pagamento". Dois passos no mesmo modal: **formulário** e **comprovante**.

#### Passo 1: formulário

```
┌ Registrar pagamento ─────────────────────── ✕ ┐
│ Maria Souza · Diurno · Carro                   │
│ ●──────●──────◐   Aguardando 1º pagamento      │
│                                                │
│ Valor pago                                     │
│ R$ [ 280,00                  ]                 │
│ Mensalidade do tipo: R$ 280,00                 │
│                                                │
│ Forma de pagamento                             │
│ ( ) Dinheiro   (•) Pix     ( ) Débito          │
│ ( ) Crédito    ( ) Boleto  ( ) Transferência   │
│                                                │
│ Ao confirmar: a cobrança vira paga, o cadastro │
│ fica ativo e a próxima mensalidade é gerada.   │
│                                                │
│            [Cancelar] [Confirmar R$ 280,00 em Pix]│
└────────────────────────────────────────────────┘
```

- **Cabeçalho do modal:** nome, tipo e categoria do mensalista, e o `StageTrack size="sm"` com a situação atual (dá contexto de por que está pagando, sem texto novo).
- **Valor pago:** `Input` monetário (`formatBRL`/`parseMoney` de `@/lib/money`, o mesmo da saída), `inputMode="decimal"`, rótulo "Valor pago", prefixo "R$". Vem **preenchido com a mensalidade do tipo** e com foco no campo, selecionado, para o operador só trocar se necessário. Abaixo, a dica "Mensalidade do tipo: R$ 280,00" (fica visível para o operador notar quando digitar outro valor). Se a API passar a informar o valor da cobrança pendente, a dica e o preenchimento usam esse valor ([A CONFIRMAR] no PRD).
- **Forma de pagamento:** `OptionGroup` com as seis formas, na ordem de `FORMA_PAGAMENTO_OPTIONS` (Dinheiro, Pix, Débito, Crédito, Boleto, Transferência), `columns={3}` no desktop e 2 no celular. Sem ícones, porque Boleto e Transferência não têm ícone no design system e o `OptionGroup` mistura mal tiles com e sem ícone. **Dinheiro vem pré-selecionado**, como na saída. Escolha obrigatória: nunca fica sem seleção.
- **Frase de efeito:** `Text` em `textMuted` explicando o que a confirmação faz; cumpre a expectativa de "uma única transação" sem jargão. No primeiro pagamento, a frase é "O cadastro será ativado."
- **Rodapé:** "Cancelar" (secundário) e o botão primário cujo rótulo carrega o resultado: "Confirmar R$ 280,00 em Pix". O rótulo muda ao vivo com valor e forma. Enquanto o valor é inválido, o rótulo cai para "Confirmar pagamento".
- Enter no campo de valor confirma (mesmo comportamento da saída).

| Estado do formulário | Comportamento |
|---|---|
| Padrão | Valor e forma preenchidos, botão habilitado. |
| Valor vazio, zero, negativo ou com mais de 2 casas | Erro no campo ao confirmar ou ao sair dele: "Informe um valor maior que zero, com até 2 casas decimais." O foco vai para o campo. O botão continua habilitado para o erro aparecer; não fica desabilitado em silêncio. |
| Valor diferente da mensalidade | Sem bloqueio. A dica "Mensalidade do tipo" fica `warn` ("Diferente da mensalidade do tipo: R$ 280,00") para chamar atenção. Se o negócio proibir, a API recusa e o erro entra como `ErrorBanner` ([A CONFIRMAR] no PRD). |
| Enviando | Campo, tiles e botões desabilitados; rótulo "Registrando pagamento…"; o modal não fecha por Esc, clique fora nem ✕ até terminar (evita perder o resultado). |
| Contrato não aceito (400) | `ErrorBanner role="alert"` no topo: "O primeiro pagamento só é liberado depois do aceite do contrato. Reenvie o contrato ao mensalista e tente de novo depois." Botão secundário "Reenviar contrato" dentro do banner (reaproveita `useReenviarContrato`). |
| Sem cobrança pendente | `ErrorBanner`: "Este mensalista não tem cobrança pendente para receber." Só "Fechar". |
| Mensalista ou usuário de outra empresa / sessão inválida | `ErrorBanner` genérico: "Não foi possível registrar o pagamento com este usuário. Entre novamente e tente de novo." |
| Outros erros da API (400/422/500) | `ErrorBanner` com a mensagem traduzida do back, sem detalhe técnico. O formulário volta editável, com valor e forma preservados. |
| Falha de rede / timeout | `ErrorBanner`: "Não conseguimos confirmar se o pagamento foi registrado. Confira a situação do mensalista antes de tentar de novo." Botões "Conferir situação" (recarrega a lista e a ficha; se o mensalista já estiver ativo ou a cobrança paga, mostra o comprovante) e "Tentar de novo". Isso trata o risco de duplicar do PRD. |

#### Passo 2: comprovante

O formulário é substituído, no mesmo modal, pelo comprovante. O título passa a "Pagamento registrado". Foco no título (`tabIndex=-1`), com `role="status"`; o `StageTrack` fecha todo em `success`.

```
┌ Pagamento registrado ────────────────────── ✕ ┐
│ ●──────●──────●  Mensalista ativo              │
│                                                │
│ ┌ - - - - - - - - - - - - - - - - - - - - - ┐ │
│ │  ✓ R$ 280,00 recebidos                     │ │
│ │  Pix · 21/10/26 às 14:32                   │ │
│ │  Maria Souza · Diurno · Carro              │ │
│ └ - - - - - - - - - - - - - - - - - - - - - ┘ │
│                                                │
│ PRÓXIMA COBRANÇA                               │
│ R$ 280,00 · vence em 05/11/26                  │
│                                                │
│                                  [Concluir]    │
└────────────────────────────────────────────────┘
```

- **Bloco de valor:** borda tracejada em `colors.success`, fundo `colors.surface`, `radii.md`, ícone de check; valor em `fontSizes.lg`/`fontWeights.bold`, linha secundária (forma · data e hora no fuso de Brasília) e identificação do mensalista. Mesma linguagem do selo de aceite.
- **Próxima cobrança:** valor e vencimento da cobrança gerada, direto da resposta da API (não recalculado na tela). O vencimento segue a regra do mês sem o dia (ex.: 31/10 → 01/12 → 31/12); se o dia efetivo diferir do dia do cadastro, uma linha de apoio explica: "Dia 31 do cadastro; novembro não tem dia 31, então vence em 01/12." (RF-04).
- **Valor da próxima cobrança diferente da mensalidade antiga:** `StatusBadge tone="info"` "Valor atualizado do tipo" ao lado. Só aparece quando o valor mudou em relação ao que foi pago.
- **Rodapé:** "Concluir" (primário) fecha o modal e devolve o foco ao botão que o abriu. Não há "imprimir recibo" (fora do escopo).
- Ao fechar, a lista e a ficha já estão atualizadas e um `Toast` confirma: "Pagamento registrado. Mensalista ativado." (ou só "Pagamento registrado." quando já estava ativo).

---

## 2. Componentes

**Reaproveitados:** `Modal`, `Button`, `Input`, `OptionGroup`, `ErrorBanner`, `Toast`, `StageTrack`, `StatusBadge`, `Skeleton`, `Text`, `IconButton` e `ViewIcon`/`EditIcon` da lista (para o novo ícone de pagamento seguir o mesmo padrão), `useReenviarContrato`, `formatBRL`/`parseMoney`, `formatDate` e `formaPagamentoLabel` de `caixa/format`, `FORMA_PAGAMENTO_OPTIONS`.

**Novos da feature (`src/components/mensalistas`):**
- `PagamentoMensalistaModal`: formulário (passo 1) e comprovante (passo 2).
- `ComprovantePagamento`: bloco de valor + próxima cobrança, separado para teste.
- Bloco "Pagamento" dentro de `MensalistaFichaModal`.
- Ícone de pagamento (cédula) para o `IconButton` da lista, junto aos outros ícones da lista.

**Mudanças em existentes:**
- `apresentarSituacao`/`SituacaoMensalista`: ação `"Receber pagamento"` para `aguardando-pagamento`.
- `MensalistaFichaModal`: rodapé com "Registrar pagamento" e bloco Pagamento.
- `MensalistasList`: novo `IconButton` e callback `onReceberPagamento`.

**Nada novo no design system (`src/components/ui`).** O `OptionGroup` sem ícones, o `Input` e o `StageTrack` resolvem. Nomes finais e pastas ficam a cargo do Tech Spec.

## 3. Tokens usados

**Nenhum token novo.**
- **Cores:** `text`, `textMuted` (frase de efeito, dicas, vencimento), `border`, `surface`, `background`; `primary` (foco, botão primário, trilha atual); `success` (comprovante, trilha concluída); `warn`/`onWarn` (valor diferente da mensalidade); `danger` (erros de campo); `primarySoft` (badge `info`).
- **Espaçamento:** `space[2]`–`space[3]` entre dica e campo, `space[3]` entre campos (como os demais formulários), `space[4]` entre blocos e no padding do comprovante.
- **Tipografia:** `fontSizes.xs` (dicas, identificação), `sm` (frase de efeito, próxima cobrança), `md` (campos), `lg` + `fontWeights.bold` (valor recebido); títulos de seção iguais aos da ficha (`xs`, `bold`, `textMuted`, caixa alta).
- **Raios e sombras:** `radii.md` (comprovante, tiles), sem sombra extra além da do `Modal`.
- **Foco:** anel padrão `outline: 3px solid colors.primary; outline-offset: 2px`.

## 4. Responsividade e acessibilidade

**Responsividade**
- Celular: `Modal` ocupa a largura útil com rodapé fixo; o `OptionGroup` em 2 colunas; os botões do rodapé empilham em largura total, com o primário no topo. Alvo de toque de 44px em tiles, botões e `IconButton`.
- Desktop: modal `md`, tiles em 3 colunas, botões à direita.
- O rótulo longo do botão ("Confirmar R$ 1.280,00 em Transferência bancária") pode quebrar em duas linhas; o botão cresce, sem truncar.
- Lista no celular: o `IconButton` de pagamento aparece junto de "Ver ficha" e "Editar" nas ações do cartão.

**Teclado e leitor de tela**
- Foco inicial no campo de valor, com o conteúdo selecionado. Ordem: valor → formas (setas entre tiles, `radio` nativo) → Cancelar → Confirmar.
- Erros ligados ao campo por `aria-describedby`; o `OptionGroup` já anuncia o seu erro com `role="alert"`. Ao confirmar com erro, o foco vai para o primeiro problema.
- O `ErrorBanner` usa `role="alert"` (anunciado uma vez). O comprovante usa `role="status"` e recebe o foco.
- Botão com `aria-disabled` na ficha liga o motivo por `aria-describedby`.
- Valores sempre em formato brasileiro e escritos (não só "R$" por ícone). A situação nunca depende só de cor: a trilha tem formas e texto, e o comprovante tem o ícone de check mais o texto "recebidos".
- Ao fechar o modal, o foco volta ao elemento que o abriu (botão da ficha, botão da linha ou ícone da lista).

**Confiabilidade no envio**
- Um único envio por vez: o botão fica desabilitado durante a chamada, e Enter repetido não envia de novo.
- O resultado só aparece depois da resposta da API; nunca um sucesso otimista.
- Depois do sucesso, o botão de confirmar não existe mais; para pagar de novo é preciso abrir outra vez, já com a nova cobrança.

**Segurança**
- Empresa, usuário que recebeu e origem não aparecem como campos nem podem ser editados; o Tech Spec os preenche a partir da sessão.
- Ação oferecida só a quem tem a permissão de mensalistas, na mesma regra de edição existente (para quem só consulta, a ficha mostra o bloco Pagamento sem o botão).

**Pontos a validar na implementação**
- **Cobrança pendente na listagem/ficha:** valor, vencimento e se existe ([A CONFIRMAR] com o back; decide a dica de valor e o estado "sem cobrança pendente").
- **Mensalista que já pagou antes:** como a tela sabe, para tratar RF-05 sem depender só do erro da API.
- **Valor diferente da mensalidade:** aceito ou recusado pela API.
- **Formato da data de pagamento retornada:** fuso e hora, exibir sempre no horário de Brasília.
- **Fora do escopo:** impressão de recibo, estorno e pagamento antecipado de várias parcelas. Se entrarem, precisam de design próprio.
