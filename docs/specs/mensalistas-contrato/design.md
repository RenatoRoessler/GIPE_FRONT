# Design Spec: Finalização do fluxo de mensalista (veículos, contrato e aceite)

Insumo para o Tech Spec. Baseado em `prd.md` (RF-01 a RF-07). Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto. Complementa `docs/specs/mensalistas/design.md`, que continua valendo para o que não muda aqui.

Três superfícies:
- **(A)** lista de mensalistas: veículos e situação do contrato (operador);
- **(B)** modal de mensalista: seção de veículos e condutores (operador);
- **(C)** página pública `/contrato?t=<token>`: leitura e aceite (mensalista, no celular).

## Direção (impeccable)

**A e B são *Operate*:** herdam o mundo visual da gestão de mensalistas (tabela, modais, `Accordion` do cadastro de preço). A ousadia aqui fica na **leitura da situação**: em vez de um badge "Inativo" que não explica nada, cada linha mostra **onde o mensalista está na jornada** (Cadastro → Contrato → Pagamento). Isso resolve o risco do PRD ("o mensalista pode estranhar continuar inativo após o aceite") do lado do operador, sem texto extra.

**C é *Read* com um único ato no final.** A página não deve parecer formulário, e sim **um documento que se assina**: folha de papel sobre o `PageBackground`, medida de leitura confortável, texto do contrato como protagonista, o aceite como fecho do documento (não um modal nem um botão flutuante). Depois do aceite, o bloco vira um **selo de aceite** com data, hora e identificação do texto. A confiança vem de três sinais: o mensalista vê o próprio nome, vê o que fica registrado e vê a identificação (hash) do texto aceito.

O que **não** fazer: gate de "role até o fim para liberar o botão" (inacessível e irritante); modal de termos; checkbox pré-marcado; esconder o texto atrás de "ver contrato".

---

## 1. Telas e estados

### A. Lista de mensalistas (`MensalistasList`)

```
Nome            Documento   Tipo      Mensalidade  Venc.  Veículos           Situação                         Ações
Maria Souza     123.456…    Diurno    R$ 280,00    dia 5  [ABC1D23]          ●──●──○ Aguardando 1º pagamento   👁 ✎
maria@…                     Carro                                            Contrato aceito em 20/10/26
Transp. XYZ     12.345…     Integral  R$ 900,00    dia 10 [BRA2E19] [+2]     ●──◐──○ Aguardando aceite         👁 ✎
                            Todas                                            Enviado · vence 27/10  Reenviar
João Lima       987.654…    Noturno   R$ 200,00    dia 1  —                  ●──⚠──○ Link do contrato vencido  👁 ✎
                                                                                                      Reenviar
```

**Coluna "Veículos" (RF-03), nova, entre Vencimento e Situação:**
- Até 2 placas em `PlateDisplay size="sm"`; a partir da terceira, um chip "+N" (`StatusBadge tone="neutral"`).
- Sem veículos: "—" em `textMuted`.
- As placas e o "+N" são um único botão ("Ver veículos de Maria Souza") que abre a **ficha** (abaixo). Não há tooltip: no celular ele não funciona.

**Coluna "Situação" (RF-04), redesenhada:** `StageTrack` compacto (3 marcas: Cadastro, Contrato, Pagamento) + rótulo principal + linha secundária. O texto sempre diz a situação; a trilha só reforça.

| Situação derivada | Trilha | Rótulo (tom) | Linha secundária | Ação inline |
|---|---|---|---|---|
| Ativo | ●──●──● | "Ativo" (`success`) | — | — |
| Contrato pendente, link válido | ●──◐──○ | "Aguardando aceite" (`info`) | "Enviado · link vence em 27/10" | "Reenviar" |
| Contrato pendente, link vencido | ●──⚠──○ | "Link do contrato vencido" (`warn`) | "Peça o reenvio ao mensalista" | "Reenviar" |
| Contrato aceito, inativo | ●──●──◐ | "Aguardando 1º pagamento" (`info`) | "Contrato aceito em 20/10/26" | — |
| Desativado (já foi ativo) | sem trilha | "Inativo" (`neutral`) | — | — |
| Situação do contrato não informada pela API | sem trilha | "Ativo"/"Inativo" como hoje | — | — |

> **Resolvido no Tech Spec:** a listagem não traz o contrato, mas traz `situacao` ("Aguardando Primeiro Pagamento" distingue de "desativado"). O status, a validade do link e a data do aceite vêm de `GET /Mensalista/{id}/contrato`, consultado só para essas linhas. Contrato inexistente ou cancelado mostra "Enviar contrato".

**Reenviar (RF-05):** `Button variant="secondary" size="sm"` na própria célula, com nome acessível "Reenviar contrato para Maria Souza". Não pede confirmação: só envia e-mail e não tem efeito destrutivo.
- Enviando: rótulo "Reenviando…", botão desabilitado; só aquela linha é afetada.
- Sucesso: `Toast` "Novo link enviado para maria@exemplo.com. Vale por 7 dias." e a linha atualiza (nova data de vencimento do link).
- Erro: `Toast` de erro com a mensagem traduzida. A linha não muda.
- Contrato aceito: a ação não aparece (RF-05).

**Ações da linha:** além de editar, um novo botão de ícone "Ver ficha" (olho), com área de toque de 44px, `aria-label="Ver ficha de Maria Souza"`.

Os demais estados (carregando, vazio, vazio da busca, erro, 403) não mudam. O skeleton ganha largura para a coluna nova.

#### Ficha do mensalista (`MensalistaFichaModal`)

Consulta rápida, só leitura. Usa `Modal size="lg"` e os dados da própria listagem, sem chamada extra.

```
┌ Maria Souza ─────────────────────────────── ✕ ┐
│ CPF 123.456.789-00 · Diurno · Carro · R$ 280  │
│                                               │
│ CONTRATO                                      │
│ ●──────●──────◐                               │
│ Cadastro  Contrato   Pagamento                │
│ Aceito em 20/10/26 às 14:32.                  │
│ Fica ativo após o primeiro pagamento.         │
│                                               │
│ VEÍCULOS (2)                                  │
│ ┌───────────────────────────────────────────┐ │
│ │ [ABC1D23]  Gol · Prata · Carro             │ │
│ │ Condutores: Ana Lima (123.***.***-00),     │ │
│ │             Bruno Reis (456.***.***-11)    │ │
│ └───────────────────────────────────────────┘ │
│                     [Reenviar contrato] [Editar]│
└───────────────────────────────────────────────┘
```

- Bloco "Contrato": `StageTrack` em tamanho padrão, com rótulos visíveis, e uma frase que explica o próximo passo (cumpre o segundo critério do RF-04).
- Bloco "Veículos": um item por veículo, com placa (`PlateDisplay size="sm"`), "modelo · cor · categoria" e, só para pessoa jurídica, a lista de condutores. O CPF dos condutores aparece mascarado parcialmente (só os 3 primeiros e os 2 últimos dígitos), porque a ficha é de consulta rápida. Sem veículos: "Nenhum veículo cadastrado." + link "Adicionar veículo" (abre a edição).
- Rodapé: "Reenviar contrato" (secundário, só se pendente ou vencido) e "Editar" (primário, abre o `MensalistaModal`).

### B. Modal de mensalista: seção "Veículos" (RF-01, RF-02)

O formulário atual passa a ter duas seções com título (`h3` estilizado com `fontSizes.xs`, `fontWeights.bold`, `textMuted` e caixa alta, como os títulos de seção do cadastro de preço): **Dados do mensalista** (campos de hoje) e **Veículos**. O modal continua `size="lg"`, com rolagem no corpo e o rodapé fixo.

```
VEÍCULOS (2)                                   [+ Adicionar veículo]
┌ ▾ ABC1D23 · Gol · Prata · Carro ───────────────────────── ✕ ┐
│  Placa  [▭ ABC1D23 ▭ 📷]        Categoria  Carro 🔒          │
│  Modelo [Gol            ]       Cor  ● ● ● ● ○ (Prata)       │
│                                                             │
│  CONDUTORES AUTORIZADOS                                     │
│  [Ana Lima           ] [123.456.789-00]   ✕                 │
│  [Bruno Reis         ] [456.789.123-11]   ✕                 │
│  [+ Adicionar condutor]   Copiar condutores de… ▾           │
└─────────────────────────────────────────────────────────────┘
┌ ▸ BRA2E19 · Fiorino · Branco · Utilitário ⚠ 1 erro ─────── ✕ ┐
└─────────────────────────────────────────────────────────────┘
```

**Lista de veículos:** cada veículo é um `AccordionItem`. O `summary` mostra "placa · modelo · cor · categoria" e o `hasError` destaca o veículo recolhido que tem erro. Um veículo novo entra aberto e com foco na placa; ao adicionar outro, os anteriores sem erro se recolhem.

| Campo | Componente | Regras visuais |
|---|---|---|
| Placa | `PlateField` com `CameraButton` (leitor de placa existente) | Mesmo campo da entrada de veículo. Placa repetida no mesmo mensalista: erro no campo "Placa já informada neste cadastro." |
| Modelo | `TextField` (até 80) | — |
| Cor | `ColorField` (amostras) | Mesmo campo da entrada; até 50 caracteres no valor livre. |
| Categoria | `SelectField` | **Tipo com categoria específica:** campo somente leitura com o valor do tipo e a dica "Definida pelo tipo de mensalidade." (o operador não tem como errar). **Tipo "Todas":** select com as categorias, sem a opção "Todas". |

**Troca de tipo de mensalidade com veículos já preenchidos:**
- Para um tipo de categoria específica: as categorias dos veículos são ajustadas sozinhas, e aparece um `Note role="status"` acima da lista: "Categorias dos veículos ajustadas para Carro."
- De categoria específica para "Todas": os veículos mantêm a categoria que já tinham.

**Condutores (só pessoa jurídica):**
- O bloco "Condutores autorizados" só aparece com pessoa jurídica (RF-02). Com pessoa física ele não é renderizado.
- Cada veículo novo de pessoa jurídica já vem com uma linha de condutor vazia. Cada linha tem Nome (`TextField`, até 100) e CPF (`TextField` com máscara), lado a lado a partir de `breakpoints.sm` e empilhados no celular, mais um botão de ícone "Remover condutor" (44px). Com um único condutor, o remover fica desabilitado e tem a dica "Pelo menos um condutor por veículo."
- CPF repetido no mesmo veículo: erro no campo "Este CPF já está neste veículo."
- **"Copiar condutores de…"**: com 2 ou mais veículos, um botão secundário pequeno abre um `Select` com os outros veículos e copia os condutores deles, somando aos que já estão, sem repetir CPF. É pensado para frotas, onde as mesmas pessoas dirigem vários carros. Como só economiza digitação, pode ficar para uma segunda entrega se o Tech Spec achar caro.

**Remover veículo:** botão de ícone "✕" no cabeçalho do item (`aria-label="Remover veículo ABC1D23"`). Veículo vazio sai na hora. Veículo preenchido pede `ConfirmDialog` "Remover o veículo ABC1D23?" / "Ele sai do cadastro quando você salvar." No modo edição, a remoção só vale ao salvar.

**Estado vazio da seção:** área tracejada (mesmo `EmptyState` compacto) com "Nenhum veículo. O mensalista pode ser salvo sem veículos." e o botão "Adicionar veículo". Aceitar zero veículos faz parte do RF-01, então isso não é erro.

**Erros do servidor no salvar:**
- Placa de outro mensalista: mensagem no campo de placa daquele veículo ("Esta placa já pertence a outro mensalista."), o item é aberto e recebe foco.
- Categoria diferente da do tipo, condutores ausentes ou enviados: mensagem no veículo correspondente quando o back identificar qual é; quando não identificar, `ErrorBanner` no topo, como hoje.
- Ao submeter com erros, o foco vai para o primeiro campo com erro, abrindo o item se estiver recolhido.

**Situação na edição (mudança de regra do back):** o cadastro nasce **inativo** e o `ativo: true` não ativa ninguém. Na edição:
- mensalista ativo: o `SwitchField` continua, mas como "Desativar mensalista" (só desliga);
- mensalista inativo: no lugar do switch entra o `StageTrack` com a frase da situação, só leitura.

**Sucesso:**
- Cadastro: `Toast` "Mensalista cadastrado. Enviamos o contrato para maria@exemplo.com."
- Edição: `Toast` "Mensalista atualizado."

### C. Página pública `/contrato?t=<token>` (RF-06, RF-07)

Rota fora do `(app)`, sem login nem menu, com o mesmo chassi de `/comprovante`: layout com `SignageThemeProvider` + fontes Barlow e `PageBackground`. Mobile first, coluna única.

```
        [Logo GIPE]
  ESTACIONAMENTO CENTRAL LTDA          ← eyebrow (razaoSocial)
  Contrato de Mensalidade              ← h1 (titulo)
  Versão 3 · Para Maria Souza          ← meta
┌─ status ───────────────────────────┐
│ ◷ Leia o contrato e confirme no    │
│   final. Link válido até 27/10/26. │
│   Pular para a confirmação ↓       │
└────────────────────────────────────┘
┌─ folha ────────────────────────────┐ ▁▁▁▁▁▁▂▂ progresso de leitura (topo, fixo)
│ CLÁUSULA 1ª – DO OBJETO            │
│ O presente contrato tem por …      │
│ …                                  │
│ (texto com quebras preservadas)    │
│                                    │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ CONFIRMAÇÃO                        │
│ ☐ Li e concordo com os termos      │
│   deste contrato.                  │
│ CPF ou CNPJ  [___.___.___-__]      │
│   O mesmo informado no cadastro.   │
│ [      Aceitar contrato      ]     │
│ Ao aceitar, registramos data, hora,│
│ endereço IP e navegador como       │
│ comprovação.                       │
│ Identificação do texto: 9F3A·…·C21B│
└────────────────────────────────────┘
```

**Estrutura:**
- **Cabeçalho:** `Logo`, razão social como eyebrow (`fontSizes.xs`, `textMuted`, caixa alta via `typography.displayTransform`), título em `Text variant="heading"` (`typography.display`/`displaySize`) e a linha meta "Versão N · Para {nomeMensalista}". O nome do próprio mensalista é o primeiro sinal de que o link é dele.
- **Faixa de status:** uma linha acima da folha que muda com o estado (tabela abaixo). Inclui o skip link "Pular para a confirmação", que leva à âncora do bloco de aceite (bypass de blocos, WCAG 2.4.1).
- **Folha:** `colors.background` sobre o `PageBackground`, `radii.md`, `shadows.md`, padding `space[4]` (celular) e `space[5]` (≥ `breakpoints.md`). Texto `fontSizes.md`, line-height 1.6, `white-space: pre-wrap` e `overflow-wrap: anywhere`, largura máxima de leitura de ~68 caracteres (valor de layout local, como o `max-width` do comprovante). O texto é selecionável e não tem rolagem interna: a página inteira rola.
- **Progresso de leitura:** barra fina de 3px no topo da viewport, em `colors.primary` sobre `colors.border`, proporcional ao quanto da folha já foi lida. É decorativa (`aria-hidden`), não bloqueia nada e não tem animação (só acompanha a rolagem).
- **Bloco de confirmação** (fecho da folha, separado por divisor tracejado como no recibo):
  - `Checkbox` "Li e concordo com os termos deste contrato." (desmarcado).
  - `TextField` "CPF ou CNPJ" com máscara automática pelo número de dígitos (a API do contrato não informa o tipo de pessoa), `inputMode` adequado, `autoComplete="off"` e dica "O mesmo informado no cadastro."
  - `Button` primário em largura total, "Aceitar contrato". **Fica habilitado**: ao enviar sem a caixa marcada ou com documento incompleto, as mensagens aparecem nos campos e o foco vai para o primeiro problema. Num formulário público, que a pessoa usa uma única vez, um botão desabilitado sem explicação trava quem não percebe o que falta.
  - Texto de transparência em `fontSizes.xs`/`textMuted`: o que fica registrado no aceite.
  - "Identificação do texto": o `hash`, abreviado em grupos de 4 (início…fim) com `font-variant-numeric: tabular-nums`, e um botão "Ver completo" que mostra o hash inteiro. Ele bate com o que chega no e-mail de confirmação.

| Estado | Comportamento visual |
|---|---|
| Carregando | Skeletons do eyebrow, do título e de ~10 linhas de texto dentro da folha, sem pulo de layout. `role="status"` "Carregando contrato". |
| Pendente, link válido | Como no wireframe. Faixa de status `info` (`primarySoft`/`link`): "Leia o contrato e confirme no final. Link válido até 27/10/26 às 18:00." |
| Enviando aceite | Checkbox, campo e botão desabilitados; rótulo "Registrando aceite…". |
| Documento não confere | Erro no campo, em `colors.danger` com ícone: "O documento não confere com o do cadastro. Confira e tente de novo." O valor continua no campo e recebe foco. |
| Muitas tentativas (429) | `ErrorBanner role="alert"`: "Muitas tentativas seguidas. Aguarde 1 minuto e tente de novo." Botão desabilitado com contagem regressiva no rótulo ("Tentar em 0:42"); o anúncio vai uma vez só pelo banner, não a cada segundo. |
| **Aceito (logo após aceitar)** | O bloco de confirmação vira o **selo de aceite** (abaixo). A faixa de status muda para `success`. Foco no título do selo (`tabIndex=-1`), com `role="status"`. O documento digitado some da tela (requisito de privacidade). |
| Já aceito (link aberto de novo) | Folha completa (o texto continua disponível). Faixa `success`: "Contrato aceito em 20/10/26 às 14:32." No fim, o selo sem o parágrafo de "próximos passos" repetido. Sem formulário. |
| Link vencido (400 de contrato pendente vencido) | Tela de mensagem, sem folha: ícone de relógio, h1 "Este link venceu", texto "Os links do contrato valem 7 dias. Peça um novo link ao estacionamento." |
| Link inválido (sem `t`, formato inválido, token inexistente) | Tela de mensagem: h1 "Link inválido", texto "Confira se abriu o link completo do e-mail ou peça um novo ao estacionamento." Sem detalhe técnico. Formato inválido nem chama a API (mesma ideia do `TOKEN_PATTERN` do comprovante, aqui com 10 caracteres alfanuméricos). |
| Erro de rede / servidor | `ErrorBanner` com mensagem genérica + `Button variant="secondary"` "Tentar novamente". Visualmente diferente de "link inválido". |

> **Parcialmente resolvido no Tech Spec:** 404 = inválido; o 400 serve aos dois casos e é classificado pela mensagem (`detail`). Falta confirmar o texto exato do link vencido e pedir ao back códigos de erro distintos.

**Selo de aceite:**

```
┌ - - - - - - - - - - - - - - - - - ┐
│        ✓  Contrato aceito         │
│   21/10/26 às 14:32 (horário de   │
│   Brasília)                       │
│   Enviamos uma cópia para o seu   │
│   e-mail.                         │
│   Seu cadastro será ativado após  │
│   o primeiro pagamento.           │
│   Identificação: 9F3A·…·C21B      │
│        [Imprimir ou salvar PDF]   │
└ - - - - - - - - - - - - - - - - - ┘
```

- Borda tracejada em `colors.success`, fundo `colors.surface`, ícone de check em `success` e título `fontSizes.lg`/`fontWeights.bold`. Usa a mesma linguagem do recibo para dizer "isto é um comprovante".
- "Imprimir ou salvar PDF": `window.print()` com estilos de impressão que deixam só cabeçalho, texto e selo, em preto sobre branco (mesmo mecanismo `PrintStyles` do recibo). Sem chamada à API.

---

## 2. Componentes

**Reaproveitados:** `Table`, `Pagination`, `Modal`, `ConfirmDialog`, `Button`, `Checkbox`, `Accordion`/`AccordionItem`, `PlateDisplay`, `CameraButton` + `LeitorPlacaModal`, `StatusBadge`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`, `Logo`, `PageBackground`, `Select`. Do formulário: `TextField`, `SelectField`, `SwitchField`, `PlateField`, `ColorField` (via `useAppForm`, com array fields do TanStack Form para veículos e condutores). Do recibo: `Divider` tracejado e `PrintStyles`. Da página pública: `Screen`/`Column`/`Message` de `ComprovantePublico.styles` (extrair para um módulo compartilhado de página pública se o Tech Spec preferir a duplicar).

**Novo no design system (`src/components/ui`):**
- `StageTrack` (`StageTrack.tsx`, `StageTrack.styles.ts`, `index.ts`): trilha horizontal de etapas com estado por etapa.
  - API proposta: `stages: { label: string; state: "done" | "current" | "attention" | "todo" }[]`, `size?: "sm" | "md"` (`sm` só com marcas e rótulos para leitor de tela; `md` com rótulos visíveis), `label` (nome acessível do conjunto).
  - Semântica: `ol` com `aria-label`; a etapa atual tem `aria-current="step"`; cada marca tem texto oculto com o estado ("concluída", "atual", "requer atenção", "pendente").
  - Fica no design system porque é diferente do `Stepper` (que conduz um wizard e numera passos): é um indicador de situação para listas e fichas, reaproveitável em adesão, cobranças etc.

**Novos da feature (`src/components/mensalistas` e página pública):**
- `SituacaoMensalista`: célula de situação (trilha + rótulo + linha secundária + "Reenviar"), usada também na ficha e na edição.
- `VeiculosResumo`: placas + "+N" como botão que abre a ficha.
- `MensalistaFichaModal`: ficha de consulta.
- `VeiculosSection`, `VeiculoItem`, `CondutoresList`: seção de veículos do `MensalistaModal`.
- `ContratoAceite` (ex.: `src/components/contrato/`): página pública com `ContratoFolha`, `ConfirmacaoAceite` e `SeloAceite`, mais as telas de mensagem `ContratoLinkVencido` e `ContratoLinkInvalido`.

Nomes finais e organização de pastas ficam a cargo do Tech Spec.

## 3. Tokens usados

**Nenhum token novo.**
- **Cores:**
  - `text`, `textMuted` (linhas secundárias, meta, transparência), `border`, `surface`, `background` (folha);
  - `primary` (foco, progresso de leitura, trilha concluída), `primarySoft`/`link` (faixa e badge `info`);
  - `warn`/`onWarn` (link vencido), `success` (ativo, aceito, selo), `danger` (erros de campo).
- **Trilha (`StageTrack`):**
  - `done`: marca preenchida em `primary`, conector em `primary`;
  - `current`: anel em `primary` com miolo `primarySoft`;
  - `attention`: marca em `warn` com ícone de alerta em `onWarn`;
  - `todo`: anel em `border`.
  - Em `size="sm"`, as marcas têm 10px e os conectores 16px. Na lista, com ativo, a trilha toda em `success`.
- **Espaçamento:** `space[1]`–`space[3]` dentro das células e itens de veículo, `space[3]` entre campos (como o `Form` atual), `space[4]`/`space[5]` no padding da folha, `space[6]` entre o cabeçalho e a folha.
- **Tipografia:** `fontSizes.xs` (eyebrow, transparência, hash), `sm` (células, summaries do accordion), `md` (texto do contrato), `lg` (título do selo), `typography.display`/`displaySize` (h1 da página pública), `fontWeights.bold` (títulos de seção e de cláusula, quando vierem em caixa alta no texto).
- **Raios e sombras:** `radii.md` (folha, itens, selo), `radii.full` (marcas da trilha, chip "+N"); `shadows.md` só na folha. Na impressão, sem sombra.
- **Foco:** anel padrão `outline: 3px solid colors.primary; outline-offset: 2px`.

## 4. Responsividade e acessibilidade

**Lista (A):**
- Desktop: colunas como no wireframe.
- Celular: a tabela vira cartões (padrão do `Table` com `data-label`).
  - No topo do cartão: Nome, Situação (trilha + rótulo) e Veículos.
  - Nas linhas secundárias: o restante.
  - "Reenviar" e "Ver ficha" com área de toque de 44px.

**Modal (B):**
- Celular: uma coluna; os campos de condutor (nome/CPF) empilham.
- O cabeçalho do `AccordionItem` quebra o `summary` em duas linhas: a placa na primeira, modelo · cor · categoria na segunda.
- O rodapé do modal continua fixo, então "Salvar" fica sempre ao alcance, mesmo com muitos veículos.

**Página pública (C):**
- Funciona a partir de 320px, sem rolagem horizontal (`overflow-wrap: anywhere` para trechos longos como URLs ou números no contrato).
- Texto em 16px no celular, sem precisar de zoom (requisito do PRD); respeita o zoom do navegador até 200% sem perder conteúdo.
- Botão de aceite em largura total.

**Teclado e leitor de tela:**
- Ordem de foco na página pública: skip link → texto → checkbox → documento → aceitar.
- Erros ligados aos campos por `aria-describedby`, com foco no primeiro erro ao enviar.
- O selo de aceite e as mensagens de status usam `role="status"`; erro bloqueante usa `role="alert"`.
- A trilha nunca depende só de cor: cada estado tem forma diferente (cheio, anel, alerta) e texto.
- No modal, adicionar veículo ou condutor leva o foco ao primeiro campo novo. Remover leva o foco ao item anterior ou ao botão "Adicionar".

**Privacidade e segurança (página pública):**
- Metadata com `robots: { index: false, follow: false }` e `referrer: "no-referrer"`, porque o token está na URL e não pode vazar para links externos do contrato.
- O documento digitado não aparece no selo nem depois do aceite.
- Fora o que a API devolve para aquele token, a página não mostra nenhum outro dado do mensalista ou da empresa.

**Pontos a validar na implementação:**
- **Contrato na listagem:** status, data do aceite e validade do link (seção A, [A CONFIRMAR]).
- **400 do GET do contrato:** como diferenciar "link vencido" de "token inválido" (seção C, [A CONFIRMAR]).
- **Reenvio:** confirmado no Swagger, o link anterior deixa de funcionar. A mensagem de sucesso do reenvio diz isso.
- **Fuso horário de `dataAceite`/`tokenExpiracao`:** exibir no horário de Brasília e dizer isso no selo.
- **Fora do escopo:** os novos campos de tipo de mensalidade que o back passou a aceitar (tolerância de atraso, quantidade de vagas, dias da semana) não estão no PRD; se entrarem, precisam de um design próprio no `TipoModal`.
