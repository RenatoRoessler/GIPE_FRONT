# Tech Spec: Refactor do layout do Caixa

**Status:** Rascunho
**PRD:** ./prd.md
**Design:** ../caixa-layout/design.md (mockups em `docs/specs/1.jpeg` e `docs/specs/3.jpeg`)

> Convenções: segue o `CLAUDE.md` e os padrões atuais do Caixa (componentes e hooks em `src/components/caixa`, serviços em `src/lib/api/services/caixa.ts`, tipos em `src/types/caixa.ts`). Nenhum endpoint novo: a tela só reorganiza dados que o front já busca.

## Referências
- PRD: ./prd.md
- Design: ../caixa-layout/design.md (esta spec referencia, não redefine). Onde o PRD decidiu diferente das recomendações do design, vale o PRD: **Lançar despesa** fica no layout, desabilitado (RF6); a **quantidade de tickets** é exibida (RF2/RF4); as **ações dependem do perfil** (RF5/RF7).

## Design
- **Telas/estados:** uma tela, `/caixa`, com o caixa aberto como pilha de cartões (abertura, valor em caixa, fundo e dinheiro na gaveta, recebido por forma de pagamento, ações) e os estados de carregando, caixa fechado, erro, sem permissão e sem turno, como no `design.md`.
- **Componentes do design system reaproveitados:** `StatusBadge`, `Button`, `Skeleton`, `ErrorBanner`, `ErroSemPermissao`, `Text`, `Toast`.
- **Componentes de feature mantidos sem mudança:** `CaixaFechado`, `AbrirCaixaModal`, `SangriaModal`, `PassarTurnoModal`, `FecharCaixaModal` e os helpers `calcularGaveta`, `agregados`, `format`.
- **Componentes novos (feature, em `components/caixa`):** `AberturaCaixa`, `ValorEmCaixa`, `FundoEGaveta`, `RecebidoPorForma`, `AcoesCaixa`, `CaixaSkeleton`. Nenhum vai para `ui`.
- **Tokens de tema:** só os existentes (`surface`, `border`, `text`, `textMuted`, `accent`, `success`, `primary`/`onPrimary`, `pagamento.*`, `focus`, `space`, `radii`, `fontSizes`, `fontWeights`, `typography.display`). Nenhum token novo.
  - `colors.pagamento` (`dinheiro`, `pix`, `debito`, `credito`) já existe no tema e é igual nos dois temas, mas hoje **nenhum componente o usa** (o design supôs que `GraficosCaixa` usava). Esta tela é o primeiro consumidor.

## Arquitetura da solução

### Estrutura de pastas

```
src/
├── app/(app)/caixa/
│   └── page.tsx                      # Server Component; sem Suspense (a tela não usa mais ?aba=)
└── components/caixa/
    ├── CaixaPage/
    │   ├── CaixaPage.tsx             # Client: orquestra queries, estados e modais (reescrito)
    │   └── CaixaPage.test.tsx        # reescrito para o novo layout
    ├── AberturaCaixa.tsx             # cartão "Abertura do caixa" + selo "Aberto"
    ├── ValorEmCaixa.tsx              # valor em destaque + "Recebido ... em N tickets"
    ├── FundoEGaveta.tsx              # dois cartões lado a lado
    ├── RecebidoPorForma.tsx          # total, barra empilhada e lista por forma
    ├── AcoesCaixa.tsx                # barra de ações por perfil
    ├── CaixaSkeleton.tsx             # carregamento no formato dos cartões
    ├── CaixaResumo.styles.ts         # estilos dos cartões e da barra de ações
    ├── resumo.ts                     # funções puras: valor em caixa, formas do resumo
    ├── resumo.test.ts
    ├── agregados.ts                  # + quantidade de entradas por forma
    └── useCaixa.ts                   # sem a query de turnos (ver decisões)
```

Cada componente novo tem teste ao lado (`*.test.tsx`), como no restante do Caixa.

### Dados e regras (`resumo.ts`, funções puras)

Tudo vem de dados que o front já carrega: `GET /Caixa` (caixa), `GET /Caixa/turno` (turno) e `GET /Caixa/movimentos` (movimentos do caixa aberto, sem paginação).

| Item da tela | Fonte | Regra |
|--------------|-------|-------|
| Abertura | `caixa.dataHoraAbertura` | `formatDateTime` (já existe), selo "Aberto". |
| Recebido | `caixa.valorTotalEntrada` | Total de entradas do caixa (sem o fundo). |
| Valor em caixa | `caixa` | `valorEmCaixa(caixa)` = `(saldoAtual ?? entradas − saídas) + valorFundoCaixa`. Com zero saídas é "recebido + fundo", como nos mockups. **[A CONFIRMAR]** se saídas (sangria) devem reduzir o valor; a regra fica isolada nesta função. |
| Tickets (total e por forma) | movimentos | Contagem dos movimentos do tipo `entrada`. **[A CONFIRMAR]** se cada ticket gera exatamente um movimento de entrada (pagamento misto ou de mensalista pode contar diferente). |
| Fundo de caixa | `caixa.valorFundoCaixa` | "Troco na abertura". |
| Dinheiro na gaveta | `calcularGaveta(turno).naGaveta` | Regra atual (fundo do turno + dinheiro esperado). Sem turno ou sem número válido, mostra "—". |
| Por forma de pagamento | movimentos | `totaisPorForma(movimentos)` já soma as entradas por forma no caixa inteiro (a soma bate com "Recebido"); ganha o campo `quantidade`. |

**Formas exibidas:** sempre as quatro do PRD (Dinheiro, Pix, Débito, Crédito), mesmo com R$ 0,00 (sem trecho na barra); formas fora dessas (boleto, transferência) só aparecem se tiverem entrada, com a cor `colors.steel`. Os rótulos vêm de `formaPagamentoLabel` (`format.ts`) para ficar igual ao resto do Caixa ("Cartão de débito"; os mockups abreviam).

**`agregados.ts`:** `TotalForma` ganha `quantidade: number` (número de entradas da forma). A mudança é aditiva: `GraficosCaixa` não lê o campo e os testes de `totaisPorForma` em `regras.test.ts` passam a conferir também a quantidade.

**`resumo.ts` expõe:**

```ts
valorEmCaixa(caixa: Caixa): number
totalDeTickets(totais: TotalForma[]): number
formasDoResumo(totais: TotalForma[]): { formaPagamento: number; rotulo: string; cor: string; valor: number; quantidade: number; percentual: number }[]
// Ordem fixa: Dinheiro, Pix, Débito, Crédito (e depois as extras). percentual via proporcao(), nunca NaN.
```

### Ações por perfil (`AcoesCaixa.tsx`)

Regra única, sem criar áreas novas: quem tem a permissão `AREA.CaixaSangria` (Administrador, Gerente e Caixa por padrão; segue a permissão por módulo) é o perfil de movimentação; os demais (Manobrista) são o perfil de operação.

| `useCan(AREA.CaixaSangria)` | Ações |
|-----------------------------|-------|
| verdadeiro | **Sangria** (secondary), **Lançar despesa** (secondary, `disabled`, `aria-disabled`, com `title`/texto "Em breve"), **Fechar caixa** (primary) |
| falso | **Trocar turno** (secondary), **Fechar caixa** (primary) |

- Sangria abre `SangriaModal`; Trocar turno abre `PassarTurnoModal`; Fechar caixa abre `FecharCaixaModal`. Os três modais, seus fluxos e regras não mudam (RF8).
- Todas as ações dependem do turno (`turnoQuery.data`): ficam desabilitadas até ele carregar, como hoje.
- Lançar despesa não recebe `onClick` e não abre nada (RF6).
- Fechar caixa muda de `danger` para `primary` (RF9); o modal continua com a conferência e a confirmação.
- "Retirada" passa a se chamar "Sangria" e "Passar turno" a "Trocar turno" nos rótulos da tela. Os títulos dos modais ficam como estão, salvo se o produto quiser alinhar (ver riscos).

### `CaixaPage` (reescrito)

```
useCaixa()  → caixaQuery, caixa, turnoQuery, movimentosQuery
carregando  → <CaixaSkeleton />
403         → <ErroSemPermissao />
erro        → ErrorBanner + "Tentar novamente"
caixa nulo  → <CaixaFechado onAbrir />          (mantido, com o link "Caixas anteriores")
aberto      → <AberturaCaixa /> <ValorEmCaixa /> <FundoEGaveta /> <RecebidoPorForma /> <AcoesCaixa />
```

- Cada cartão trata o próprio estado: `FundoEGaveta` espera o turno e `ValorEmCaixa`/`RecebidoPorForma` esperam os movimentos (esqueleto no cartão); erro numa dessas consultas aparece só no cartão correspondente, com "Tentar novamente", sem derrubar a tela. 403 do turno continua com `ErroSemPermissao`.
- Sem turno aberto (`turno === null`): "Dinheiro na gaveta" mostra "—" e o aviso "Não há turno em andamento"; as ações que dependem do turno ficam desabilitadas.
- O título "Caixa" some da vista, mas fica como `h1` visualmente oculto (`VisuallyHidden` de `Caixa.styles.ts`).
- `ModalId` perde `"historico"`. O `Toast` continua com `useToast`.
- Largura: coluna única com máximo de ~720px, centralizada. Layout de duas colunas em telas grandes é decisão futura (o PRD e os mockups só cobrem o celular).

### Server vs Client

| Peça | Tipo | Motivo |
|------|------|--------|
| `app/(app)/caixa/page.tsx` | Server | Só composição. O `Suspense` sai, porque `CaixaPage` deixa de usar `useSearchParams`. |
| `CaixaPage`, cartões e `AcoesCaixa` | Client | TanStack Query, `useCan`, estado dos modais. |
| `resumo.ts`, `agregados.ts` | Módulos puros | Testáveis sem React. |

## Decisões técnicas e trade-offs

1. **Tickets contados nos movimentos, sem endpoint novo.** O PRD exige a quantidade; `GET /Caixa` e `/Caixa/turno` só trazem valores. Os movimentos já são carregados e trazem tipo e forma, então a contagem sai de graça. O risco (um ticket virar mais de um movimento) fica registrado e a contagem é uma função isolada. Alternativa mais robusta: o back devolver a quantidade por forma; vira pedido de evolução.
2. **Valores por forma vindos dos movimentos, não de `turno.formasPagamento`.** O turno cobre só o turno atual, enquanto os mockups e o PRD falam do caixa inteiro (a soma bate com "Recebido").
3. **Regra de ações pela permissão `CaixaSangria`, não por perfis fixos.** Mantém a permissão por módulo valendo e não cria área nova. Efeito colateral do PRD: Administrador, Gerente e Caixa **deixam de ter "Trocar turno" nesta tela** (ver riscos).
4. **Não apagar o código das abas e do histórico nesta entrega.** `AbasCaixa`, `GraficosCaixa`, `LinhaDoTempo`, `eventosCaixa`, `aba.ts`, `HistoricoTurnosModal`, `CaixaHeader`, `GavetaResumo`, `TurnoAtual` e `FormasPagamentoTabela` deixam de ser usados pela tela, mas o PRD deixa em aberto onde o histórico passa a viver (RF11). Apagar agora tornaria a decisão irreversível sem ter dono. Ficam órfãos, com os testes verdes, e uma task final lista o que remover quando o produto decidir. `MovimentosLista` continua em uso pelo extrato (`ExtratoCaixaPage`).
5. **`useCaixa` deixa de buscar a lista de turnos.** Só as abas e o histórico a usavam; manter a query seria requisição à toa a cada abertura do Caixa. O hook devolve apenas caixa, turno e movimentos; os testes que mockam `turnosQuery` são ajustados.
6. **Fechar caixa em `primary`.** Alinha com os mockups e o RF9; a gravidade da ação fica no modal de conferência.
7. **Sem duplicar regra de negócio:** `calcularGaveta`, `proporcao`, `arredondar` e `format` são reaproveitados. As únicas funções novas são as de composição da tela.

## Riscos / pontos de atenção

- **Acesso ao histórico (RF11, [A DEFINIR]):** com os atalhos "Histórico de turnos" e "Caixas anteriores" fora do caixa aberto, `/caixa/historico` e o extrato só se alcançam por endereço (o link "Caixas anteriores" continua em `CaixaFechado`, que o PRD manda manter). O histórico de turnos, em modal, perde o único ponto de entrada. Decisão de produto pendente; o código fica preservado (decisão 4).
- **Caixa sem "Trocar turno":** o perfil Caixa (que opera o turno) perde a passagem de turno nesta tela, porque o PRD a dá só ao Manobrista (RF5/RF7). Confirmar com o produto; se for engano, basta mostrar "Trocar turno" também no perfil de movimentação.
- **Contagem de tickets:** depende de um movimento de entrada por ticket. Pagamento misto ou cobrança de mensalista no mesmo extrato pode distorcer o número. Validar com dados reais antes de liberar.
- **Valor em caixa:** a fórmula (com ou sem saídas) é uma suposição baseada nos mockups; trocar é mexer em uma função.
- **Rótulos dos modais:** a tela passa a dizer "Sangria" e "Trocar turno", mas os modais ainda usam "Retirada" e "Passar turno" (ver o texto de cada um). Pode confundir; alinhar os títulos é um ajuste pequeno, fora do PRD.
- **Testes:** `CaixaPage.test.tsx` cobre as abas e o histórico e será reescrito; `hooksCaixa.test.tsx` mocka `turnosQuery`. Os demais testes dos componentes órfãos continuam passando.
- **Tema claro:** o número em destaque usa `accent` (não `primary`) para ter contraste nos dois temas; conferir visualmente os dois.
- **Fim da barra de navegação:** os mockups incluem a barra inferior com "Mais"; é o comportamento atual do menu e não muda.

## Código órfão para remover (após a decisão do RF11)

Depois desta entrega, a tela `/caixa` não usa mais os arquivos abaixo (todos em `src/components/caixa`). Seguem no repositório, com os testes passando, até o produto decidir onde o histórico passa a viver. Quando decidir, remover junto com os testes ao lado:

- `AbasCaixa.tsx`, `aba.ts`
- `GraficosCaixa.tsx` (+ `.styles.ts`) e `LinhaDoTempo.tsx` (+ `.styles.ts`), `eventosCaixa.ts`
- `HistoricoTurnosModal.tsx`
- `CaixaHeader.tsx`, `GavetaResumo.tsx` (+ `.styles.ts`), `TurnoAtual.tsx`, `FormasPagamentoTabela.tsx` (+ `.styles.ts`)

Continuam em uso e **não** entram na remoção: `MovimentosLista` (extrato), `calcularGaveta`, `agregados`, `format`, `CaixaFechado` e os modais de abrir, sangria, passar turno e fechar.

## Fora de escopo técnico
- Funcionalidade de **lançar despesa** (formulário, endpoint, efeito no saldo).
- Mudanças nas regras de caixa, turno, sangria e fechamento, e nos endpoints.
- Novo local de acesso ao histórico, ao extrato, às abas, aos gráficos e à linha do tempo.
- Remoção do código órfão (fica para depois da decisão do RF11).
- Layout de telas grandes além da coluna centralizada; novos componentes de `ui` e novos tokens.
- Pedido ao back de quantidade de tickets por forma (evolução futura).

## Testes previstos
- **Unitários (Vitest):** `resumo` (valor em caixa com e sem saídas, ordem e percentuais das formas, formas extras, tudo zerado sem NaN, total de tickets) e `agregados` (`quantidade` por forma, sangria sem forma não conta como ticket).
- **Componentes (Testing Library):**
  - `AcoesCaixa`: perfil de movimentação (Sangria, Lançar despesa desabilitado, Fechar caixa; sem Trocar turno), perfil de operação (Trocar turno e Fechar caixa; sem Sangria nem Lançar despesa), ações desabilitadas sem turno, Fechar caixa em destaque.
  - `RecebidoPorForma`, `ValorEmCaixa`, `FundoEGaveta`: valores, tickets, estado de carregamento, erro e "—" sem turno.
  - `CaixaPage` (reescrito): caixa aberto completo, caixa fechado (com o link "Caixas anteriores"), carregando, erro com nova tentativa, 403, e cada ação abrindo o modal certo; as abas e o histórico não aparecem.
- Os testes dos modais, `CaixaFechado`, extrato e histórico seguem como estão.
- Antes de concluir: `npm run lint` e `npm run build`; conferir a tela nos dois temas em 360px, sem rolagem horizontal.
