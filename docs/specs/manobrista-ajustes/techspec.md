# Tech Spec: Ajustes de agilidade no app do manobrista

## Referências
- PRD: [./prd.md](./prd.md)
- Design: [./design.md](./design.md) (spec de UI/UX via skill `claude-design`; resumo na seção "Design" abaixo)
- Next.js: antes de implementar, conferir `node_modules/next/dist/docs/` (AGENTS.md avisa de mudanças de API). Nada aqui usa API nova de roteamento: tudo é Client Component dentro de modais já existentes.

## Design
- **Telas/estados:** conforme `design.md` (entrada, leitor de placa, saída com dinheiro, menu Mais). Sem telas novas: são alterações nos modais `EntradaVeiculoModal`, `LeitorPlacaModal`, `SaidaVeiculoModal` e no `MenuSheet`.
- **Reaproveitados (`src/components/ui`):** `Button`, `OptionGroup`, `Input`, `PlateDisplay`, `PlateKeyboard`, `NumericKeyboard`, `ErrorBanner`, `ConfirmDialog`, `Skeleton`, `Modal`, `StatusBadge`.
- **Novos em `src/components/ui`** (cada um com `Nome.tsx`, `Nome.styles.ts`, `index.ts`, `Nome.test.tsx`):
  - `QuickAmountChips` – grupo de chips de valor (radiogroup).
  - `ChangeDisplay` – troco / "Sem troco" / "Faltam R$".
  - `InlineNotice` – faixa de uma linha com texto e ação (`variant: "neutral" | "warning"`).
- **Tokens:** nenhum novo (ver `design.md`). Tudo via `theme.colors.{success,danger,dangerSoft,warn,onWarn,textMuted,border,surface,primarySoft,accent,link,focus}`, `theme.space`, `theme.fontSizes`, `theme.layout.touchTarget`. Se algum tamanho faltar (ex.: altura da pílula "Preparando leitura…"), adicionar em `src/styles/theme.ts` dentro de `shared.layout`, nunca hardcodar.

## Arquitetura da solução

Tudo é Client Component (`"use client"`), já que depende de estado, câmera, teclado e styled-components. Nenhuma rota, Server Component ou endpoint novo. **Sem mudança de API/back** (confirmado: a primeira entrega é só front).

### Funções puras novas (testáveis sem DOM)
`src/components/veiculos/saida.ts` (arquivo existente, adicionar):
- `sugerirValoresRecebidos(valor: number): number[]` – até 2 valores **estritamente maiores** que o cobrado, em centavos para evitar ponto flutuante. Regra: próximo múltiplo de 50 e depois o próximo múltiplo de 100 acima do primeiro (R$ 220 → 250, 300; R$ 250 → 300, 400; R$ 20 → 50, 100). Valor 0 (mensalista) → `[]`. Sem repetição, ordenado crescente.
- Reutilizar `calcularTroco`, `getPagamentoStatus`, `valoresIguais`, `valorACobrar` (já existem). `getPagamentoStatus` mantém a regra "recebido ≥ cobrado"; nenhuma regra de negócio muda.

`src/lib/placa.ts` (existente, adicionar):
- `caracteresFaltando(value: string): number` – `7 - normalizePlaca(value).length`.
- `mensagemFaltam(n: number): string` – "Falta 1 caractere" / "Faltam N caracteres".

### Ajuste 1 · Placa já no pátio → saída
Arquivos: `components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx` e `.styles.ts`; novo `components/veiculos/JaNoPatioCard/` (`JaNoPatioCard.tsx`, `.styles.ts`, `index.ts`, teste); `SaidaVeiculoModal` (sem mudança de contrato, já aceita `buscaInicial`).
- `jaNoPatio` (já calculado com `usePatio({ pausado: true })`, que vem de `PatioVeiculo`) fornece `patioId`, `placa`, `categoria`, `modelo`, `cor`, `dataHoraEntrada`, `minutosPermanencia`. **O valor a cobrar não vem da lista do pátio**: obtê-lo com `useQuery({ queryKey: [SAIDA_CONSULTA_KEY, { tipo: "placa", valor: placa }], queryFn: () => consultarSaida(busca), enabled: Boolean(jaNoPatio) })`, usando a **mesma chave** de `useSaidaFlow` (`SAIDA_CONSULTA_KEY` exportado de `useSaidaFlow.ts`). Resultado: a tela de saída abre com cache quente e sem nova espera.
  - Loading → `Skeleton` no valor; erro → valor omitido e botão "Dar saída" sem valor.
- Remover do formulário (quando `jaNoPatio`): campos modelo/categoria/cor/prisma, a `Pendencia` "Esta placa já está no pátio." e o bloco `JaNoPatio` de alerta vermelho. Em seu lugar, `<JaNoPatioCard>` e, no `footer`, `Button` "Dar saída · R$ valor" + `Button variant="ghost"` "Corrigir placa" (substituindo "Registrar entrada"/"Cancelar").
- Novo estado/callback `onDarSaida(busca)` em `EntradaVeiculoModalProps`: o consumidor (hoje `RegistrarEntradaButton` / `PatioView` / `BottomNav`, localizar com `grep EntradaVeiculoModal`) fecha a entrada e abre `SaidaVeiculoModal buscaInicial={{ tipo: "placa", valor: placa }}`. Se o consumidor atual não tiver como abrir a saída, o modal navega para `/patio/${patioId}` (link já existente) como fallback.
- "Corrigir placa": `form.setFieldValue("placa", "")`, `resetLookup()`, `limparPreenchidos()` e foco/abertura do teclado (mesmo mecanismo de `handleDigitarPlaca`).
- Remover `handlePlacaKeyDown` do ramo `jaNoPatio` (Enter não faz nada nesse estado).

### Ajuste 2 · Atalhos de valor recebido
Arquivos: `components/veiculos/PagamentoSaida/PagamentoSaida.tsx` (+ `.styles.ts`), `components/veiculos/SaidaVeiculoModal/useSaidaFlow.ts` (estado), `components/veiculos/ResumoSaida/ResumoSaida.tsx` e `.styles.ts`, `components/veiculos/Saida.styles.ts` (remover `TrocoLine` quando sem uso), novos `ui/QuickAmountChips`, `ui/ChangeDisplay`.
- Estado novo em `useSaidaFlow`: `atalhoRecebido: "exato" | number | "outro" | null` além de `recebido` (string mascarada, já existe). `selecionarAtalho(a)` preenche `recebido` com `maskMoney`/`formatBRL`-equivalente do valor; `"outro"` limpa `recebido` e sinaliza foco. Reinicia (`null`, `recebido = ""`) quando `forma` muda, quando o valor cobrado muda (`valorAnterior` setado) ou ao sair da fase de pagamento.
- `PagamentoSaida` ganha props `atalho`, `onAtalhoChange` (ou recebe `onSelecionarAtalho`) e passa a renderizar `QuickAmountChips` + `ChangeDisplay` quando `isDinheiro`. O `Input` "Valor recebido" só aparece com `atalho === "outro"`, com `autoFocus` (o teclado de toque Murel `TECLADO_DECIMAL` abre via `useTecladoCampo` ao focar) e mantém o `onKeyDown` Enter → confirmar.
- Valores de chips vêm de `sugerirValoresRecebidos(valorACobrar(consulta))`. Chips nunca mostram valor ≤ cobrado (exceto "Exato" = cobrado).
- `canConfirm`/`motivo` continuam de `getPagamentoStatus`; quando `atalho === null` e forma = dinheiro, `recebido === ""` já resulta em "Informe o valor recebido." (texto trocado para "Escolha quanto o cliente pagou." só quando não há `Outro`).
- `ChangeDisplay`: props `{ recebido: number | null; valor: number }`, usa `calcularTroco`; renderiza `role="status"`/`aria-live="polite"`.
- `ResumoSaida`: `Rows` passa de duas linhas (Entrada / Permanência) para uma linha composta ("Entrada 14/11 12:20 · 35h 23min") via CSS; os dados e `dl` semântico permanecem.
- `ReciboSaidaStep` não muda: continua recebendo `recebido` e `troco` do `confirmMutation` (já calculados de `input.recebido`).

### Ajuste 3 · "Placa inválida" só com 7 caracteres
Arquivos: `components/form/PlateField.tsx`, `lib/placa.ts`, `lib/schemas/veiculo.ts` (validação da placa), `components/ui/PlateDisplay`.
- Em `PlateField`: o `errorText` do campo só é exibido se `normalizePlaca(value).length === 7` **ou** se o formulário foi submetido (`field.form.state.isSubmitted` / `submissionAttempts > 0`). Antes disso, `hint` interno = `mensagemFaltam(caracteresFaltando(value))` com `hintTone="muted"` quando `value.length` entre 1 e 6; vazio → sem dica; o `hint` vindo de fora (consulta do cadastro) tem prioridade quando a placa está completa.
- Não alterar o schema Zod (a validação continua a mesma; muda só *quando mostrar*). `aria-invalid` acompanha a regra nova.
- `PlateDisplay`: aceitar slots vazios ("•") apenas visualmente; **opcional** na primeira versão (se arriscar regressão nos testes de `PlateDisplay`, entregar só a dica de texto).

### Ajuste 4 · Câmera negada → teclado direto
Arquivos: `components/veiculos/LeitorPlacaModal/LeitorPlacaModal.tsx`, `useLeitorPlaca.ts`, `EntradaVeiculoModal.tsx`, `components/camera/PermissaoCamera.tsx`, novo `ui/InlineNotice`.
- `LeitorPlacaModal` ganha `onFalha?: (motivo: "negada" | "indisponivel") => void`. Em um `useEffect` sobre `estado`, ao virar `negada` ou `indisponivel`, chama `onFalha` (uma vez por abertura) em vez de manter a tela de erro.
- `EntradaVeiculoModal`: ao receber `onFalha`, `setLeitorAberto(false)`, guarda `cameraFalhou = motivo`, e foca o campo da placa (mesmo `setTimeout` de `handleDigitarPlaca`) para o teclado Murel abrir. Renderiza `<InlineNotice>` "Câmera indisponível. Digite a placa. · Tentar câmera" acima da placa, com `PassosLiberarCamera` dentro de um bloco expansível ao tocar em "Tentar câmera" **se** a nova tentativa também falhar.
- O estado `sem-leitura` (timeout de 15 s) **não** dispara `onFalha` e mantém a UI atual.
- `LeitorQrSaida` (saída) não muda neste ajuste; segue com seu fluxo atual.

### Ajuste 8 · Câmera instantânea (somente a opção "b" do PDF)
Escopo reduzido por decisão do produto: entra **apenas** "Mostrar a imagem antes do leitor estar pronto". Ficam de fora a–a, c, d, e e f do PDF (câmera ligada entre entradas, pré-carga, `getUserMedia` no `pointerdown`, pedido direto com `deviceId` e esconder o teclado durante a leitura).
Arquivos: `components/veiculos/LeitorPlacaModal/useLeitorPlaca.ts`, `LeitorPlacaModal.tsx` e `.styles.ts` (+ testes).
- Em `iniciar`, separar o `getUserMedia` da criação do reconhecedor (`criarReconhecedorPlaca()`), que hoje rodam juntos em `Promise.all`. Os dois continuam disparados em paralelo, mas sem esperar um pelo outro:
  1. Quando o stream chega, atribuir `video.srcObject`, `await video.play()` e `setEstado("pre-leitura")` (novo valor em `LeitorPlacaEstado`: imagem visível, leitor ainda carregando).
  2. Quando o reconhecedor termina, `setEstado("lendo")` e `varrer(...)`.
- Cuidados na separação: a checagem `sessao !== sessaoRef.current` vale após cada `await`; se o reconhecedor falhar (`null`), parar as tracks e ir para `indisponivel` (comportamento atual); `streamRef`/`reconhecedorRef` são preenchidos assim que cada um existir, para `parar()` liberar os dois.
- UI: em `LeitorPlacaModal`, `MENSAGENS["pre-leitura"] = "Preparando leitura…"` aparece como **pílula pequena sobre a imagem** (dentro de `Visor`, posicionada na base, `aria-live="polite"`), e não como texto abaixo do visor. O estado `abrindo` (stream ainda não respondeu) mantém o visor vazio com a mira, sem texto grande.
- Não mexe no teclado: ele continua aparecendo no formulário como hoje (item "f" fora de escopo).
- Medição opcional: `performance.mark("camera:playing")` no evento `playing` do `<video>`, só para conferência em aparelho; sem meta numérica nesta entrega.

### Ajuste 9 · Mais espaço com teclado aberto
Arquivos: `components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx` e `.styles.ts`, `components/ui/Modal/Modal.tsx` (prop nova), `components/form/PlateField.tsx` (`label` opcional / oculto visualmente), `components/teclado/TecladoProvider.tsx` (expor "teclado aberto"), novo hook `hooks/useTecladoAberto.ts`.
- `TecladoProvider` passa a expor `aberto: boolean` no contexto (`alvo !== null`). Novo hook `useTecladoAberto()` combina: `aberto` do provider **ou** `visualViewport.height < window.innerHeight * 0.75` (teclado do sistema, ex.: campo de modelo), com listener em `visualViewport.resize`.
- `Modal` ganha `hideFooterWhen?: boolean` (ou o consumidor omite `footer`): `EntradaVeiculoModal` passa `footer={entrada || tecladoAberto ? undefined : <>…</>}`. A folha do teclado é renderizada pelo provider dentro do `dialog`, então o espaço liberado vai para o conteúdo; ajustar `Form` para `flex: 1` e rolagem interna apenas se necessário.
- `PlateField`: aceitar `label` com `hideLabel` (rótulo vira `VisuallyHidden`, mantendo `htmlFor`), e usar `hideLabel` na entrada. Reduzir `gap` do `Form` para `theme.space[2]` enquanto `tecladoAberto`.
- Categorias em 3 colunas × 2 linhas: `OptionField` repassa `columns={3}` ao `OptionGroup` (`field.OptionField` precisa expor `columns`); em telas ≥ `md` o layout atual permanece.
- Fechamento automático ao completar 7 caracteres já existe (`FECHAR_PLACA_MS = 150` em `TecladoProvider.inserir`). Para o teclado do sistema (modelo), nada a fazer: ao fechar o rodapé volta.
- Cancelar durante o teclado: o `onClose` do `Modal` (X do cabeçalho) segue acionando `handleClose` com `ConfirmDialog` se `hasChanges`.

### Ajuste 5 · Menu "Mais" — só o cartão do operador (2ª entrega)
Arquivos: `components/layout/BottomNav/MenuSheet.tsx` e `BottomNav.styles.ts`, `MenuSheet.test.tsx`, novo `components/layout/BottomNav/MenuUsuario.tsx` (+ teste). **`lib/nav.ts` não muda**: ordem, grupos e filtro por perfil permanecem.
- `MenuUsuario`: lê `useCurrentUser()` (nome, `perfil`) e mostra avatar com iniciais (reaproveitar `getInitials` de `UserMenu`, extraindo-o para um util compartilhado se necessário), nome e perfil.
- Situação do caixa: `useCaixa()` dispara 3 queries; extrair `useCaixaAberto()` leve em `components/caixa/useCaixa.ts` (só `getCaixa` com a mesma `CAIXA_KEY`, devolvendo aberto/fechado via `isCaixaAberto`). Condicionar a `useCan(AREA.Caixa)`: perfis sem acesso não disparam a query e a linha mostra só o perfil.
- Rótulo do perfil: reutilizar o mapeamento de perfil já usado na UI de usuários (localizar com `grep perfil` em `components/usuarios`); não criar texto novo.
- Renderizado dentro do `MenuSheet`, entre `SheetHeader` e `nav`.

### Ajuste 6 · Confirmação ao ler (2ª entrega)
Arquivos: `components/veiculos/LeitorPlacaModal/useLeitorPlaca.ts`, `LeitorPlacaModal.tsx`, `lib/ocrPlaca.ts` (confiança), `components/veiculos/LeitorQrSaida/LeitorQrSaida.tsx`, novo `lib/feedbackLeitura.ts`.
- `feedbackLeitura.ts`: `confirmarLeitura()` → `navigator.vibrate?.(80)` + bip curto via `AudioContext` (oscilador 880 Hz, 80 ms, criado/retomado no primeiro gesto do operador; falha silenciosa); `leituraDuvidosa()` → `navigator.vibrate?.([80, 80, 80])`, sem som. `useLeitorPlaca` troca a chamada atual `navigator.vibrate(80)` por essas funções.
- `criarConsenso` (`lib/ocrPlaca.ts`) passa a expor também a confiança/discordância por posição; se existir consenso mas algum caractere variou entre quadros, devolver `{ placa, duvida: indice }` para destacar o caractere. **Verificar** se o reconhecedor atual (`lib/reconhecedorPlaca.ts`) devolve confiança; se não, o critério de "duvidosa" é a discordância entre quadros (ver riscos).
- UI: `Mira` (de `LeitorQrSaida.styles`) já tem `$tom` ("neutro"/"invalido"); adicionar `"ok"` (success) e `"duvida"` (warn). Etapa de conferência destaca o caractere em dúvida com `theme.colors.warn`.
- `prefers-reduced-motion`: sem transição de cor animada.
- QR da saída: `confirmarLeitura()` ao ler token válido (sem etapa "duvidosa").

### Ajuste 7 · Nomes acessíveis (2ª entrega)
Arquivos: `components/layout/BottomNav/BottomBar.tsx`, `EntradaButton.tsx`, `components/ui/OptionGroup/OptionGroup.tsx`, `components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx` (`CATEGORIA_OPTIONS`).
- **Verificar antes de mudar:** hoje `TabButton`/`EntradaButton` têm `TabLabel` com texto visível (nome acessível existe: "Entrada", "Saída", "Mais"). O PDF pede nomes completos: adicionar `aria-label` com `label` do `NavItem` ("Registrar entrada", "Registrar saída", "Pátio", "Caixa", "Mais"). Cuidado: `aria-label` diferente do texto visível — manter o texto visível contido no nome acessível (WCAG 2.5.3 "Label in Name"); por isso o `aria-label` deve **começar** com o texto visível quando possível (ex.: visível "Entrada" → label "Entrada de veículo"; confirmar com o time se "Registrar entrada" é obrigatório para os testes automáticos).
- Categorias: o `OptionGroup` usa `<label>` envolvendo radio + texto, então o nome acessível já é o `label` ("Carro médio"). O "1/2/6" do PDF pode vir do `value`/de outro componente (ex.: `OptionField`). Reproduzir primeiro com leitor de tela/`getByRole("radio", { name })` num teste; se falhar, passar `ariaLabel: option.label` em `CATEGORIA_OPTIONS`.
- Teste de regressão: `getByRole("button", { name: /registrar entrada/i })` e `getByRole("radio", { name: "Carro médio" })`.

## Decisões técnicas e trade-offs
- **Cache compartilhado da consulta de saída (ajuste 1):** reutilizar `[SAIDA_CONSULTA_KEY, busca]` evita nova rota e faz o valor aparecer no cartão e na tela de saída sem segunda chamada. Alternativa descartada: cálculo local do valor no cliente (duplicaria a regra de tarifa do back).
- **Chips calculados no front (ajuste 2):** é só apresentação; a regra de pagamento (`getPagamentoStatus`) não muda. Notas sugeridas fixas em múltiplos de 50/100 (Real); se a operação quiser outra regra, só `sugerirValoresRecebidos` muda.
- **Mostrar imagem antes do leitor (ajuste 8):** novo estado `pre-leitura` em vez de reordenar `Promise.all`, para não tocar na lógica de consenso/limite que já tem testes.
- **Ocultar rodapé via `footer` condicional (9):** reaproveita o `Modal` existente em vez de um layout customizado. Se o `Modal` não reflowar sozinho, adicionar prop dedicada.
- **Validação (3):** mudar *quando* exibir o erro, não o schema, para não alterar o contrato de `criarEntradaVeiculoSchema` e seus testes.
- **Sem telemetria nova:** a medição de tempo usa `performance.mark`; envio para backend fica para depois.

## Riscos / pontos de atenção
- **StrictMode/dev e corridas (ajuste 8):** o efeito de `useLeitorPlaca` monta/desmonta duas vezes e agora há dois `await` independentes; toda continuação deve checar `sessaoRef` e liberar o que já abriu.
- **Teclado do sistema (9):** `visualViewport` varia entre Android/iOS; a heurística de 75% pode falsear em telas com barra de endereço dinâmica. Cobrir com teste de componente simulando o evento e validar em aparelho real.
- **Leitura duvidosa (6):** dependente de o OCR expor confiança; se não expuser, usar discordância entre quadros e ajustar o texto do critério de aceite na validação.
- **Nome acessível (7):** mudar `aria-label` pode quebrar testes existentes que buscam por texto ("Entrada"/"Saída"); atualizar os testes de `BottomNav`, `BottomBar` e `MenuSheet` e verificar a regra "Label in Name".
- **Menu (5):** o cartão não deve disparar queries para perfis sem acesso ao caixa; `nav.test.ts` e `MenuSheet.test.tsx` existentes devem continuar verdes sem alteração de ordem.
- **Valor "Exato" e mensalista:** valor 0 não deve mostrar chips (sem pagamento); manter o ramo `semCobranca` já existente.
- **Dados reais:** o PDF alerta que confirmações finais de entrada/saída não foram exercitadas em produção; os testes devem mockar a API (padrão do projeto com Vitest/MSW-style mocks já presentes).

## Plano de testes (Vitest + Testing Library; E2E fica para `executar-qa`)
- Unitários: `sugerirValoresRecebidos`, `caracteresFaltando`/`mensagemFaltam`, `useCaixaAberto`.
- Componentes: `QuickAmountChips`, `ChangeDisplay`, `InlineNotice`, `PagamentoSaida` (Exato → troco 0, R$ 250 → troco 30, Outro foca e valida), `PlateField` (sem erro vermelho antes de 7), `EntradaVeiculoModal` (placa no pátio mostra "Dar saída", sem "Registrar entrada"; rodapé oculto com teclado aberto; câmera negada abre teclado), `LeitorPlacaModal`/`useLeitorPlaca` (imagem aparece em `pre-leitura` antes de o reconhecedor resolver; pílula "Preparando leitura…"; reconhecedor com falha → `indisponivel`; `onFalha`), `MenuSheet`/`MenuUsuario` (cartão com nome, perfil e caixa aberto/fechado; sem query de caixa para perfil sem acesso; ordem dos itens inalterada), `BottomBar` (nomes).
- Atualizar testes existentes afetados: `EntradaVeiculoModal.test.tsx`, `PagamentoSaida.test.tsx`, `SaidaVeiculoModal.test.tsx`, `LeitorPlacaModal.test.tsx`, `BottomNav.test.tsx`, `MenuSheet.test.tsx`, `nav.test.ts`.
- Antes de concluir cada task: `npm run lint` e, nas mudanças relevantes, `npm run build` (CLAUDE.md).

## Fora de escopo técnico
- Mudanças de API/back-end e novos endpoints.
- Telemetria/relatório das métricas de tempo (só `performance.mark` local).
- Ajuste 8, opções a, c, d, e, f do PDF (câmera ligada entre entradas, pré-carga, `getUserMedia` no `pointerdown`, pedido direto/`deviceId`, esconder teclado na leitura) e as metas de tempo 0,4 s / 0,15 s.
- Leitor de QR da saída: câmera instantânea (o ajuste 8 vale só para a leitura de placa).
- Entrada de mensalista, saída com carimbo de convênio e serviços do lava-rápido.
- Mudança de permissões por perfil.
- Reordenar o menu ou mover itens entre grupos (ajuste 5 é só o cartão do operador).
- Redesenho de telas além do descrito em `design.md`.

## Ordem sugerida de implementação
1. Funções puras (`sugerirValoresRecebidos`, `mensagemFaltam`) + componentes `ui` novos.
2. Ajustes 3, 2, 1 (formulário e saída) – independentes da câmera.
3. Ajustes 9 e 4 (teclado/fechar leitor).
4. Ajuste 8 (opção b no `useLeitorPlaca`), por último da 1ª entrega.
5. 2ª entrega: ajustes 5, 7, 6.
