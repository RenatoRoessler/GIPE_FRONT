# Tech Spec: Saída de veículos em duas fases (localizar, depois pagar)

**Status:** Rascunho
**Data:** 2026-10-17
**PRD:** [./prd.md](./prd.md) · **Design:** [./design.md](./design.md)

Evolui o que foi entregue em `docs/specs/melhoria-fluxo-saida/` (tela única do modal **Registrar saída**). Não há contrato novo de API nem dependência nova: a mudança é de composição da tela e do estado do fluxo. Segue `AGENTS.md`/`CLAUDE.md`. Esta etapa só especifica; nada é implementado aqui.

## Referências
- PRD: ./prd.md
- Design: ./design.md e a seção "Design" abaixo
- Base técnica: `docs/specs/melhoria-fluxo-saida/techspec.md` (hook `useSaidaFlow`, `LeitorQrSaida`, `BuscaManualSaida`, `ResumoSaida`, `PagamentoSaida`)

## Design

- **Telas/estados:** três fases dentro do mesmo modal: *pesquisa* (QR + busca manual), *pagamento* (resumo + forma de pagamento) e *recibo*. Estados do visor, da busca e do envio como no design.
- **Reaproveitados:** `Modal` (`size="lg"`), `Button`, `ConfirmDialog`, `ErrorBanner`, `Skeleton`, `OptionGroup`, `PlateDisplay`, `ResumoSaida`, `PagamentoSaida`, `ReciboSaidaStep`, `Layout`/`Column` de `SaidaVeiculoModal.styles`.
- **Alterados:** `LeitorQrSaida` (perde "lido" e "Limpar", ganha `buscando`), `BuscaManualSaida` (perde o bloqueio por QR), `SaidaVeiculoModal` (renderiza por fase), `useSaidaFlow` (fase derivada, `voltar`).
- **Novos no design system:** nenhum.
- **Tokens:** nenhum novo. O fade da troca de fase usa só `animation` com duração fixa e `prefers-reduced-motion`.

## Arquitetura da solução

### Arquivos
```
src/
├── components/veiculos/
│   ├── LeitorQrSaida/
│   │   ├── LeitorQrSaida.tsx            # alterado: prop `buscando`, sem lido/Limpar
│   │   ├── LeitorQrSaida.styles.ts      # alterado: remove Lido, Check, LimparButton
│   │   └── LeitorQrSaida.test.tsx       # alterado
│   ├── BuscaManualSaida/
│   │   ├── BuscaManualSaida.tsx         # alterado: sem `bloqueadoPorQr`; dica do sequencial
│   │   └── BuscaManualSaida.test.tsx    # alterado
│   └── SaidaVeiculoModal/
│       ├── SaidaVeiculoModal.tsx        # alterado: uma tela por fase, rodapé por fase, foco
│       ├── SaidaVeiculoModal.styles.ts  # alterado: FaseConteudo (fade), FaseTitulo (foco/anúncio)
│       ├── useSaidaFlow.ts              # alterado: fase derivada, voltar(), tokens repetidos
│       ├── useSaidaFlow.test.tsx        # alterado
│       └── SaidaVeiculoModal.test.tsx   # alterado
└── types/saida.ts                       # remove SaidaOrigem (sem uso)
```
`ResumoSaida`, `PagamentoSaida`, `ReciboSaidaStep`, `useLeitorQr` e os serviços de API **não mudam**.

### Server vs Client
Tudo Client Component, como hoje (câmera, estado, TanStack Query). Rotas e atalhos (`RegistrarSaidaButton`, `app/(app)/veiculos/saida/page.tsx`) não mudam.

### Fase derivada, não armazenada
A fase deixa de ser estado independente e passa a decorrer dos dados, para não haver combinação inválida:

```ts
export type SaidaFase = "pesquisa" | "pagamento" | "recibo";

// recibo: registro concluído · pagamento: há veículo consultado · pesquisa: o resto
const fase: SaidaFase = resultado ? "recibo" : consulta ? "pagamento" : "pesquisa";
```

- A busca bem-sucedida preenche `consulta` e a tela vai para **pagamento** sozinha (RF3).
- `voltar()` zera a busca; `consulta` vira `null` e a tela vai para **pesquisa**.
- O `state` interno `fase: "identificar" | "recibo"` e `setFase` saem; o `enabled` do `useQuery` passa a ser `busca !== null && !resultado`.
- A reconsulta periódica (30 s) continua na fase de pagamento, que é onde faz sentido.

### `useSaidaFlow` — mudanças
Remove do estado e do retorno: `origem`, `token`, `lido`, `mensagemLido` (e o tipo `SaidaOrigem`). Mantém: `buscaValues`, `buscaErrors`, `aviso`, `consulta`, `valorAnterior`, `forma`, `recebido`, `resultado`, `consultaRecibo`, `pagamento`, `buscando`, `enviando`, `erroRegistro`, `isBusy`, handlers.

Adiciona/ajusta:

| Item | Comportamento |
| --- | --- |
| `fase` | Derivada, como acima. |
| `voltar()` | Ignora se `enviando`. Caso contrário executa o `limpar()` atual: cancela o debounce, `reset` das duas mutações, `busca = null`, campos e erros vazios, aviso limpo, `forma = FORMA_PADRAO`, `recebido = ""`, `valorAnterior = null`. O nome `limpar` deixa de ser exportado (um só caminho). |
| `handleToken(token)` | Não preenche campos nem guarda `token`/`origem`: só `novaBusca(null)` e `qrMutation.mutate(token)`. Ignora o mesmo token por 5 s depois de uma busca que falhou (ver "Tokens repetidos"). |
| `consultarManual` | Igual, sem `setOrigem`. |
| `hasProgress` | `consulta !== null` (fase pagamento) ou algum campo preenchido (fase pesquisa). Fechar na fase pagamento sempre pede confirmação (RF10). |
| `buscando` | Igual: `qrMutation.isPending` ou consulta inicial pendente. |

Retorno novo mínimo: `fase`, `voltar`, os campos acima; `valoresExibidos` some (os campos de busca nunca mostram o veículo lido).

### Tokens repetidos (câmera religa após falha)
Hoje a câmera desligava ao ler o QR. Agora ela fica desligada só **durante a busca** (`ativo = fase === "pesquisa" && !buscando`) e **religa se a busca falha**. Com o mesmo QR ainda diante da lente, isso reentraria em loop (ler → falhar → religar → ler). Contramedida em `useSaidaFlow`:

- `ultimoTokenFalhoRef = { token, em }`, gravado quando `qrMutation` falha.
- `handleToken` ignora o mesmo `token` se `Date.now() - em < 5000` (constante `REPETICAO_TOKEN_MS`).
- A guarda é limpa em: busca bem-sucedida, `voltar()` e digitação na busca manual.
- O hook `useLeitorQr` não muda; o `lastRead` por texto (1,5 s) continua como segunda barreira.

### `LeitorQrSaida` — contrato novo
```ts
export interface LeitorQrSaidaProps {
  onToken: (token: string) => void;
  onInvalido: () => void;
  // Busca em andamento: a câmera pausa, o visor mostra a mira de sucesso e o estado é anunciado.
  buscando?: boolean;
}
```
Sai: `lido`, `mensagemLido`, `onLimpar`, `disabled`, o botão **Limpar e ler novamente** e o overlay "Ticket encontrado". O `useLeitorQr` recebe `ativo: !buscando` (o componente só existe na fase de pesquisa; fora dela ele é desmontado e a câmera é liberada pelo cleanup que já existe).

- Visor `buscando`: tom `lido` (mira em `success`), `Mensagem` escondida, anúncio "Buscando veículo…" na região `role="status"`.
- Voltar para a pesquisa **remonta** o componente (a fase pagamento o desmonta), então a câmera sempre reabre do zero, sem estado herdado.

### `BuscaManualSaida` — contrato novo
Sai: `bloqueadoPorQr` e `BUSCA_QR_ATIVA_HINT`. `disabled` passa a significar `buscando || enviando`. O bloqueio mútuo entre campos, a normalização e o `onEnter` não mudam. O campo **Sequencial** ganha `enterKeyHint="search"` e a dica "Pressione Enter para buscar" (ver decisão do sequencial).

### `SaidaVeiculoModal` — por fase
```tsx
const titulo = { pesquisa: "Localizar veículo", pagamento: "Confirmar saída", recibo: "Saída registrada" }[fase];
```
- **pesquisa**: `Layout` com duas `Column`: `LeitorQrSaida` + `BuscaManualSaida`. Rodapé: **Cancelar**.
- **pagamento**: `Layout` com `ResumoSaida` e (`ErrorBanner` + `PagamentoSaida`). Rodapé: **Voltar para a pesquisa** (ícone de seta, `variant="secondary"`, `disabled={enviando}`) e **Confirmar Saída · R$ x**. Sem **Cancelar**.
- **recibo**: sem rodapé do modal; `ReciboSaidaStep` com **Concluir**/**Imprimir**, como hoje.

Cada fase renderiza `FaseConteudo` com `key={fase}`; o remonte dispara o `fade` (CSS `@keyframes`, ~150 ms, desligado em `prefers-reduced-motion`). `FaseTitulo` é um `h3` visualmente oculto com `tabIndex={-1}` e `ref`; um `useEffect` com dependência `[fase]` leva o foco a ele a cada troca **exceto na montagem inicial**, onde vale o foco padrão do `<dialog>`. O texto do `FaseTitulo` é o anúncio ("Veículo encontrado. Confirme os dados e o pagamento." / "Pesquisa de veículo."), lido por ser o elemento focado; não há `aria-live` separado para isso.

O botão de confirmar perde o `useEffect` que o focava depois da leitura (a fase agora é a mudança de contexto).

## Decisões técnicas e trade-offs

| Decisão | Alternativas | Motivo |
| --- | --- | --- |
| Fase **derivada** de `consulta`/`resultado` | `useState` de fase mantido em sincronia | Impossível ficar em "pagamento" sem veículo; menos código no hook; `voltar` é só zerar a busca |
| `voltar()` reaproveita o antigo `limpar()` | Novo reset parcial | O PRD pede descartar tudo (busca, forma, recebido); um só caminho, já coberto por testes |
| Botão de voltar **no rodapé** | Dentro do corpo, no topo | O rodapé é fixo no celular: o caminho de volta não sai da tela com o corpo rolando |
| Câmera pausa **durante a busca** e religa na falha | Câmera ligada o tempo todo; desligada até o operador tocar | Evita ler o mesmo QR várias vezes enquanto busca, sem exigir toque para tentar de novo; a guarda de 5 s evita o loop |
| Remover `lido`/`Limpar` do leitor | Manter o estado "lido" por um instante antes de trocar de fase | A troca automática torna o estado parado desnecessário e o botão Limpar não tem mais o que limpar |
| Fade com CSS `animation` por `key` | Biblioteca de transição, `view-transition` | Sem dependência; funciona com `prefers-reduced-motion`; remonte por `key` já é o comportamento desejado |
| Foco em um `h3` oculto que também anuncia | `aria-live` + foco separado | Um elemento só faz as duas coisas, sem dupla leitura |
| **Sequencial** só consulta com Enter | Debounce como placa e token | Número parcial ("1" de "12") acerta **outro** veículo, e agora acertar leva para a fase de pagamento. Placa completa (7 caracteres) e token (código único) não têm esse risco; o debounce dos dois fica |
| `size="lg"` nas três fases | `md` quando houver menos conteúdo | A largura não pula na troca de fase |
| Nenhum teste de snapshot | Snapshots de cada fase | Frágeis com styled-components; testes por papel/texto cobrem o comportamento |

## Estratégia de testes

Ferramenta: **vitest + Testing Library**, com `useLeitorQr` mockado como já nos testes atuais.

| Camada | O que testar |
| --- | --- |
| Hook `useSaidaFlow` | `fase` = pesquisa sem veículo; = pagamento depois de QR/placa/token/sequencial encontrados; = recibo depois de registrar; `voltar()` zera busca, campos, forma, recebido, aviso e `valorAnterior`, e devolve a fase de pesquisa; `voltar()` não faz nada com `enviando`; reconsulta periódica continua na fase de pagamento e para no recibo; token repetido é ignorado por 5 s depois de uma falha e aceito depois (fake timers); a guarda é limpa por sucesso, por `voltar` e por digitação; sequencial não consulta sem Enter (e consulta com Enter); `hasProgress` na fase de pagamento; regressões já existentes (duplo envio, valor mudou, erro de registro) |
| `LeitorQrSaida` | `buscando` pausa a câmera (`ativo` falso), esconde a mensagem de apoio e anuncia "Buscando veículo…"; sem `lido`/Limpar; token válido e QR inválido como hoje |
| `BuscaManualSaida` | campos habilitados e desabilitados só por `disabled`; dica do sequencial; bloqueio mútuo e normalização (já existentes) |
| Modal (integração) | abre na pesquisa só com QR e busca (sem resumo, valor nem pagamento) e com título "Localizar veículo"; ler QR leva à fase de pagamento (título "Confirmar saída", sem QR nem busca); busca manual por placa e por token leva à fase de pagamento; sequencial exige Enter; mensagens de QR inválido/token inexistente/fora do pátio ficam na pesquisa e a câmera religa; **Voltar para a pesquisa** volta com busca vazia, câmera ativa (`ativo` verdadeiro) e pagamento descartado; o botão fica desabilitado durante o envio e não existe no recibo; foco vai ao `h3` da fase ao trocar; rodapé por fase; fechar na pesquisa sem nada fecha direto, e na fase de pagamento pede confirmação; câmera desligada na fase de pagamento |
| Manual | celular real: ler o QR, ver a troca de fase, voltar e ler outro; com a câmera negada, usar só a busca manual; QR do comprovante do cliente; leitor de tela (anúncio da fase e foco); `prefers-reduced-motion`; rodapé fixo com o corpo rolando |

Rodar `npm run lint`, `npm test` e `npm run build` ao final (convenção do projeto).

## Riscos / pontos de atenção

| Risco | Prob. | Mitigação |
| --- | --- | --- |
| Salto automático para pagamento com veículo errado (sequencial parcial) | Alta sem mitigação | Sequencial só com Enter; o botão **Voltar** custa um toque. Confirmar a regra com o negócio |
| Loop de leitura/falha com o mesmo QR diante da câmera | Média | Guarda de 5 s por token falho + barreira de 1,5 s do hook de câmera; testado com fake timers |
| Perder o que o operador digitou ao voltar (PRD assume busca vazia) | Baixa | Comportamento definido no PRD; reavaliar se houver reclamação de digitação errada |
| Foco indo para o elemento errado ao desmontar o campo focado | Média | O foco é movido para o `h3` da nova fase no mesmo efeito que muda a fase; coberto por teste |
| Remover `lido`/`Limpar` quebra testes antigos | Alta (esperado) | Atualizar `LeitorQrSaida.test`, `BuscaManualSaida.test`, `useSaidaFlow.test` e `SaidaVeiculoModal.test` na mesma task em que o código muda |
| `fase` derivada pisca para "pesquisa" se `consulta` ficar `null` por um instante (ex.: troca de `queryKey`) | Baixa | `busca` só muda por `novaBusca`/`voltar`, e na fase de pagamento nenhum campo de busca existe para mudá-la; a mudança de valor usa `setQueryData` na mesma chave |
| Pagamento deixa de ser visível antes do veículo: operador que prefere ver tudo | Baixa | Pedido explícito do produto; métrica de tempo no PRD acompanha |

## Fora de escopo técnico
- Mudanças em `useLeitorQr`, nos serviços de API, no cálculo de valor, nas formas de pagamento e no recibo.
- Aceitar que o operador "avance" manualmente da pesquisa (a troca é automática).
- Guardar o último veículo/pesquisa ao voltar, ou lembrar a forma de pagamento.
- Persistir a fase se o modal for fechado e reaberto.
- Animações além do fade de entrada (sem transição de saída entre fases).

## Pontos a confirmar antes de implementar
1. **Sequencial só com Enter**: aceito pelo negócio, ou prefere debounce longo (ex.: 1,2 s)?
2. **Tempo de 5 s** para ignorar token repetido após falha: suficiente para o operador afastar a câmera do QR?
3. **Voltar sem confirmação** quando já houver "valor recebido" digitado (PRD assume que sim).
