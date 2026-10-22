# Tech Spec: Fluxo de Entrada e Saída de Veículos para Mensalista

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e registra onde o código real difere)

## Design
- Telas/estados: os de `design.md`. Duas diferenças entre o design e o código atual: a saída **não** é uma tela única; é o `SaidaVeiculoModal` em três fases (`pesquisa` → `pagamento` → `recibo`, derivadas em `useSaidaFlow`). O aviso de mensalista e o pagamento oculto valem na fase `pagamento` (onde `ResumoSaida` e `PagamentoSaida` já aparecem). O botão do rodapé hoje é "Confirmar Saída · R$ x"; para mensalista vira "Confirmar saída" (sem valor).
- Componentes do design system reaproveitados: `StatusBadge` (tom `info`, já em `ResumoSaida`), `Skeleton`, `ErrorBanner`, `Button`, `Modal`, `PlateDisplay`, `Hint`/`ValuePanel`/`ValueAmount` de `Saida.styles`.
- Componentes novos necessários:
  - `src/components/ui/InfoCard/InfoCard.tsx` (+ `InfoCard.styles.ts`, `InfoCard.test.tsx`, `index.ts`): aviso informativo com ícone, título e texto de apoio. Props: `title`, `icon?`, `children?`. `role="status"`.
  - `src/components/veiculos/CardMensalista/CardMensalista.tsx` (+ `index.ts`, teste): usa `InfoCard`; props `nome?: string | null`, `contexto: "entrada" | "saida"` e `variante?: "mensalista" | "rotativo"` (padrão `mensalista`); `rotativo` só existe na entrada e aceita `horario?: { de: string; ate: string }`.
- Tokens de tema usados/criados: nenhum novo (`primary`, `primarySoft`, `text`, `textMuted`, `radii.md`, `space`).

## Arquitetura da solução

### Tipos e dados (`src/types`)
- `veiculo.ts`, `PlacaConsulta`: **contrato confirmado** de `GET /Veiculo/{placa}`: `mensalista?: boolean` e `dadosMensalista?: DadosMensalistaPlaca | null` (nome, `descricaoTipoMensal`, `situacao`, `intervaloPermitido {de, ate}`, `diasSemana`, vencimento). Três situações: (1) `mensalista: true` → mensalista, entra sem cobrança; (2) `mensalista: false` com `dadosMensalista` → cliente é mensalista mas está **fora do plano contratado** (ex.: fora do horário) e entra como **rotativo**; (3) sem `dadosMensalista` → avulso. Campos opcionais, para não quebrar respostas sem eles.
- `veiculo.ts`, `EntradaPayload.mensalista`: continua boolean, mas passa a ser **derivado do cadastro consultado**, nunca do formulário.
- `saida.ts`, `SaidaConsulta`: já tem `mensalista: boolean`. Acrescentar `mensalistaNome?: string | null` (**[A CONFIRMAR]** se `GET /Patio/saida` devolve o nome; sem ele o card mostra só "Mensalista").
- `saida.ts`, `SaidaPayload.formaPagamento`: hoje `number`. Para mensalista ver "Riscos".

### Entrada
- `src/components/veiculos/usePlacaLookup.ts` (Client): além do `status`, guarda `cadastro: PlacaConsulta | null` (o último encontrado) e o limpa em `reset()`/nova consulta. A API de `lookup()` não muda, então os chamadores atuais continuam iguais.
- `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx` (Client):
  - Remover o `form.AppField name="mensalista"` (Switch) e a parte `|| values.mensalista` de `hasChanges`.
  - `defaultValues` sem `mensalista`; `mutationFn` envia `mensalista: cadastro?.mensalista === true` no payload.
  - Renderizar `CardMensalista` entre os campos Placa e Modelo quando `cadastro?.dadosMensalista` existir: `variante="mensalista"` se `cadastro.mensalista` for verdadeiro; `variante="rotativo"` (aviso: "É mensalista, mas está fora do horário contratado. A entrada será registrada como rotativo.", com o horário `intervaloPermitido` quando houver) se for falso. O payload leva `mensalista: cadastro.mensalista === true`, então o rotativo é cobrado normalmente na saída. O `onChange` da placa já chama `resetLookup()`, o que limpa o card.
  - Cadastro consultado só vale para a placa atual: o código atual já descarta respostas de placa antiga (`handlePlacaBlur`); o card herda essa garantia por vir do mesmo estado.
- `src/lib/schemas/` (schema da entrada, `entradaVeiculoSchema`) e o tipo `EntradaVeiculoValues`: remover `mensalista`. Ajustar `EntradaVeiculoModal.test.tsx` (linha do `mensalista: false`).
- Recibo de entrada (`ReciboEntradaConteudo`): mostrar `StatusBadge` "Mensalista" quando `entrada.mensalista` (a resposta de `/Patio/entrada` já traz o campo).

### Saída
- `src/components/veiculos/saida.ts`: novas funções puras (testáveis):
  - `valorACobrar(consulta)`: `consulta.mensalista ? 0 : consulta.valor`. Única fonte do valor exibido, comparado e enviado.
  - `getPagamentoStatus` continua para avulsos; o hook decide por `consulta.mensalista` antes de chamar.
- `useSaidaFlow.ts` (Client):
  - `pagamento`: se `consulta.mensalista`, `{ canConfirm: true }` sem depender de `meios` nem de `forma` (mensalista não deve ficar travado por "Carregando meios de pagamento" nem por empresa sem meios configurados).
  - `confirmMutation`: usa `valorACobrar` na comparação de mudança de valor e no payload; para mensalista, `formaPagamento` conforme "Riscos"; não calcula `recebido`/`troco`.
  - Retornar `semCobranca: consulta?.mensalista === true` para a tela.
  - A reconsulta já existente (30 s) cobre a mudança de condição; se `mensalista` mudar entre consultas, tratar como "valor mudou" (mesmo `Notice`) e exigir nova confirmação.
- `SaidaVeiculoModal.tsx`: com `semCobranca`, rótulo do botão "Confirmar saída"; não renderizar `PagamentoSaida`, e sim a linha de apoio "Sem pagamento nesta saída." (`Hint`). O rodapé "Carregando meios de pagamento…" não aparece para mensalista.
- `ResumoSaida.tsx`: com `consulta.mensalista`, renderizar `CardMensalista contexto="saida"` abaixo do cabeçalho do veículo, manter o `StatusBadge` e usar `valorACobrar` no `ValuePanel` ("Nada a cobrar").
- `PagamentoSaida.tsx`: sem mudança funcional (deixa de ser montado para mensalista). Evita um modo condicional dentro dele.
- Recibo (`ReciboSaidaStep.tsx` / `ReciboConteudo.tsx`): `ReciboData` ganha `mensalista?: boolean`; quando verdadeiro, `formaPagamento`, `recebido` e `troco` não aparecem e o valor mostra "Sem cobrança". Mantém o recibo de avulso intacto.

### Server vs Client
Todos os componentes e hooks citados já são Client Components (`"use client"`); `InfoCard` e `CardMensalista` são puramente de apresentação e podem ficar sem diretiva (herdam do pai), seguindo o padrão de `StatusBadge`.

## Decisões técnicas e trade-offs
- **Identificação na entrada pela consulta da placa já existente** (`GET /Veiculo/{placa}`), em vez de buscar mensalistas no cliente. Alternativa rejeitada: baixar a lista de mensalistas (`listAllMensalistas`, até 10 páginas de 100) e procurar a placa no cliente; é pesado a cada digitação, expõe dados pessoais sem necessidade e duplica regra do back.
- **O cliente não decide a condição de mensalista.** Vem do back (cadastro na entrada, consulta na saída). Isso elimina a divergência que o checkbox causava e é coerente com o fora de escopo "não permitir forçar manualmente".
- **`valorACobrar` central** em vez de espalhar `consulta.mensalista ? 0 : …` em hook, resumo e recibo; um ponto só reduz o risco de a tela mostrar zero e o payload enviar o valor antigo.
- **Não adicionar modo "mensalista" a `PagamentoSaida`**; o modal decide não montá-lo. Menos props e testes mais simples.
- **`InfoCard` em `ui`** (e não dentro de `Saida.styles`): é usado em dois fluxos. Promover o `Notice` foi considerado, mas ele é `role="alert"` e de tom de aviso; o novo é informativo (`role="status"`), então não são intercambiáveis.
- Falha na consulta de placa na entrada mantém o comportamento atual: sem card, operador segue como avulso (alinhado ao PRD, ponto a confirmar).

## Desvios na implementação
- `ResumoSaida` deixou de mostrar o `StatusBadge` "Mensalista": o `CardMensalista` já diz o mesmo e os dois juntos repetiriam o texto para leitores de tela.
- O botão da saída mantém o texto atual "Confirmar Saída" (com S maiúsculo); para mensalista só perde o valor.
- Os recibos (entrada e saída) mostram "Tipo: Mensalista" como linha de texto, e não como `StatusBadge`, para sair também na impressão.
- Na saída, a reconsulta só pede nova confirmação se o valor a cobrar mudar (`valorACobrar`); trocar de mensalista para avulso com valor igual a zero não interrompe.

## Riscos / pontos de atenção
- **Contrato do back não confirmado (bloqueante para a entrada):** não há hoje, no cliente, campo de mensalista em `GET /Veiculo/{placa}`. Se o back não o fornece, a identificação na entrada precisa de um endpoint novo (ex.: consulta de mensalista por placa). Confirmar antes de implementar as tasks de entrada.
- **Registro da saída de mensalista:** `POST /Patio/{id}/saida` exige `formaPagamento`. Não sabemos se o back aceita saída de mensalista com `valor: 0` e sem forma, ou se exige uma forma (ex.: Dinheiro). Enquanto não confirmado, o plano é enviar `valor: 0` e a forma padrão (`FORMA_DINHEIRO`) e verificar se isso gera lançamento indevido no caixa (critério de aceite do PRD: "não gera cobrança no caixa").
- **Valor divergente:** se o back devolver `valor > 0` para um mensalista, a tela mostra zero e o `registrarSaida` envia zero; o back pode recusar ("valor divergente do calculado", comentário `[A CONFIRMAR]` já existente em `useSaidaFlow`).
- **Mensalista inativo / contrato pendente / fora do plano:** quem decide é o booleano `mensalista` do back; `dadosMensalista` com `mensalista: false` vira aviso de rotativo. O motivo exato do `false` (horário, dia da semana, situação) não é interpretado no cliente; o texto do aviso fala em "fora do horário contratado" e mostra o horário quando existir. No exemplo do back, `diasSemana` vem todo `false`; confirmar com o back o que isso significa.
- **Saída:** o contrato de `GET /Patio/saida` para mensalista segue **[A CONFIRMAR]** (nome e regra de `mensalista` na saída; ver Task 05).
- **Dados pessoais:** o nome do mensalista passa a aparecer na entrada e na saída; não registrar em logs nem em recibos impressos além do necessário (o recibo mostra só "Mensalista", sem nome).
- **Regressão:** `ResumoSaida.test.tsx`, `PagamentoSaida.test.tsx`, `SaidaVeiculoModal*.test.tsx`, `useSaidaFlow.test.tsx` e `EntradaVeiculoModal.test.tsx` precisam de novos casos (mensalista e não mensalista) e de ajuste do campo removido.

## Fora de escopo técnico
- Novo endpoint ou alteração no back (apenas confirmar o contrato).
- Vincular veículos/placas ao mensalista (já existe em "Mensalistas").
- Tratamento diferenciado de mensalista inativo, inadimplente ou com contrato pendente.
- Mudanças em caixa, relatórios, tabela de preços e na lista do pátio.
- Remover o componente `Switch` de `ui` (continua usado por outras telas).
