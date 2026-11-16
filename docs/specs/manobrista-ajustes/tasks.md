# Tasks: Ajustes de agilidade no app do manobrista

Referências: ./prd.md, ./techspec.md, ./design.md

Regras para todas as tasks: seguir `code-best-practices` e `styled-components-best-practices`; usar só tokens do tema; criar/atualizar testes Vitest da própria task; ao concluir rodar `npm run lint` (e `npm run build` nas tasks marcadas com 🏗). Conferir `node_modules/next/dist/docs/` antes de usar qualquer API do Next.

## Primeira entrega (ajustes 1, 2, 3, 4, 8, 9)

### Base: funções puras e componentes de UI

- [x] T1 — Função `sugerirValoresRecebidos(valor)`
  - Arquivos: `src/components/veiculos/saida.ts`, `src/components/veiculos/saida.test.ts`
  - Pronto quando: R$ 220 → [250, 300]; R$ 250 → [300, 400]; R$ 20 → [50, 100]; valor 0 → []; nunca devolve valor ≤ cobrado; cálculo em centavos; testes passam.

- [x] T2 — Funções `caracteresFaltando` e `mensagemFaltam` da placa
  - Arquivos: `src/lib/placa.ts`, `src/lib/placa.test.ts`
  - Pronto quando: "ABC" → 4 e "Faltam 4 caracteres"; 6 caracteres → "Falta 1 caractere"; vazio → 7; testes passam.

- [x] T3 — Componente `ChangeDisplay` (troco / "Sem troco" / "Faltam R$")
  - Arquivos: `src/components/ui/ChangeDisplay/{ChangeDisplay.tsx,ChangeDisplay.styles.ts,index.ts,ChangeDisplay.test.tsx}`
  - Pronto quando: recebido 250 e valor 220 mostra "R$ 30,00" em `success`; recebido = valor mostra "Sem troco"; recebido menor mostra "Faltam R$ X" em `danger`; região `aria-live="polite"`; só tokens do tema; testes passam.

- [x] T4 — Componente `QuickAmountChips` (radiogroup de valores)
  - Arquivos: `src/components/ui/QuickAmountChips/{QuickAmountChips.tsx,QuickAmountChips.styles.ts,index.ts,QuickAmountChips.test.tsx}`
  - Pronto quando: recebe opções (`Exato`, valores, `Outro`) e o selecionado; um selecionado por vez; alvo ≥ `layout.touchTarget`; navegação por teclado; quebra em 2 linhas sem cortar rótulo; teste de seleção e `onChange`.

- [x] T5 — Componente `InlineNotice` (faixa com texto e ação)
  - Arquivos: `src/components/ui/InlineNotice/{InlineNotice.tsx,InlineNotice.styles.ts,index.ts,InlineNotice.test.tsx}`
  - Pronto quando: variantes `neutral` e `warning`; renderiza texto + botão de ação opcional; área expansível opcional (children) para os passos da câmera; testes passam.

### Ajuste 3 · "Placa inválida" só com a placa completa

- [x] T6 — `PlateField` só mostra erro vermelho com 7 caracteres ou após tentar enviar
  - Arquivos: `src/components/form/PlateField.tsx`, `src/components/form/PlateField.test.tsx`
  - Pronto quando: com "ABC" aparece "Faltam 4 caracteres" em cinza (`textMuted`), sem erro vermelho e `aria-invalid` falso; com 7 caracteres fora do padrão aparece o erro vermelho; ao submeter com placa incompleta aparece o erro; campo vazio sem dica; hint do cadastro tem prioridade com a placa completa; schema Zod inalterado; testes passam.

### Ajuste 2 · Atalhos de valor recebido na saída

- [x] T7 — Estado do atalho de valor recebido em `useSaidaFlow`
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.ts` (+ teste do hook existente)
  - Pronto quando: existe `atalhoRecebido` (`"exato" | number | "outro" | null`) e `selecionarAtalho`; "exato" preenche o recebido com o valor cobrado; um valor preenche o recebido; "outro" limpa o recebido; mudar a forma de pagamento, o valor cobrado mudar ou sair da fase de pagamento volta para `null` e recebido vazio; `canConfirm` segue de `getPagamentoStatus`; testes passam.

- [x] T8 — `PagamentoSaida` com chips, troco e campo "Outro"
  - Arquivos: `src/components/veiculos/PagamentoSaida/PagamentoSaida.tsx`, `.styles.ts`, `PagamentoSaida.test.tsx`, `src/components/veiculos/SaidaVeiculoModal/SaidaVeiculoModal.tsx`, `src/components/veiculos/Saida.styles.ts`
  - Pronto quando: com Dinheiro aparecem "Cliente pagou com" (`QuickAmountChips` com `sugerirValoresRecebidos`) e `ChangeDisplay`; "Exato" libera confirmar com "Sem troco"; R$ 250 sobre R$ 220 mostra troco R$ 30,00; "Outro" mostra o campo "Valor recebido" já focado (teclado numérico abre) com troco ao digitar e vermelho + "Faltam R$ X" quando menor; sem atalho escolhido o botão fica desabilitado com "Escolha quanto o cliente pagou."; Pix/crédito/débito sem chips nem campo; Enter em "Outro" confirma; mensalista (valor 0) sem chips; `TrocoLine` removido se ficar sem uso; testes passam. 🏗

- [x] T9 — `ResumoSaida` com entrada e permanência numa linha só
  - Arquivos: `src/components/veiculos/ResumoSaida/ResumoSaida.tsx`, `ResumoSaida.styles.ts`, `ResumoSaida.test.tsx`
  - Pronto quando: entrada e permanência aparecem lado a lado ("Entrada 14/11/2026, 12:20 · 35h 23min") mantendo `dl` semântico; em 360×640 a tela de pagamento em dinheiro cabe sem rolar (verificação visual manual); testes passam.

### Ajuste 1 · Placa já no pátio vira atalho para a saída

- [x] T10 — Componente `JaNoPatioCard`
  - Arquivos: `src/components/veiculos/JaNoPatioCard/{JaNoPatioCard.tsx,JaNoPatioCard.styles.ts,index.ts,JaNoPatioCard.test.tsx}`
  - Pronto quando: título "Este veículo já está no pátio", valor em destaque, linha "modelo · cor · categoria", Entrada e Permanência; `Skeleton` no valor enquanto carrega e valor omitido em erro; só tokens do tema; testes dos três estados.

- [x] T11 — Estado "já no pátio" no `EntradaVeiculoModal`
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx`, `.styles.ts`, `EntradaVeiculoModal.test.tsx`
  - Pronto quando: com placa no pátio, `useQuery` com a chave `[SAIDA_CONSULTA_KEY, { tipo: "placa", valor }]` (exportada de `useSaidaFlow.ts`) traz o valor; aparece `JaNoPatioCard`; modelo, categoria, cor e prisma somem; rodapé tem "Dar saída · R$ valor" e "Corrigir placa" (sem "Registrar entrada", "Cancelar" nem "Esta placa já está no pátio."); Enter na placa não faz nada nesse estado; "Corrigir placa" limpa placa, cadastro e preenchidos e devolve foco/teclado; testes passam.

- [x] T12 — "Dar saída" leva direto a "Confirmar saída"
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx` (prop `onDarSaida`) e o consumidor (localizar com `grep EntradaVeiculoModal`, ex.: `RegistrarEntradaButton`, `PatioView`, `BottomNav`), testes dos dois
  - Pronto quando: tocar em "Dar saída" fecha a entrada e abre `SaidaVeiculoModal` com `buscaInicial={{ tipo: "placa", valor }}` na fase de pagamento, sem passar pela pesquisa; se o consumidor não puder abrir a saída, navega para `/patio/${patioId}`; testes passam. 🏗

### Ajuste 9 · Mais espaço na entrada digitada

- [x] T13 — `TecladoProvider` expõe se há teclado aberto e hook `useTecladoAberto`
  - Arquivos: `src/components/teclado/TecladoProvider.tsx`, `src/hooks/useTecladoAberto.ts`, `src/hooks/useTecladoAberto.test.tsx`
  - Pronto quando: o contexto expõe `aberto`; `useTecladoAberto()` devolve true com o teclado Murel aberto ou quando `visualViewport.height` fica abaixo de 75% da janela (teste simulando o evento `resize`); sem `visualViewport` não quebra; testes do provider existentes seguem passando.

- [x] T14 — `PlateField` com rótulo oculto e `OptionField` com colunas
  - Arquivos: `src/components/form/PlateField.tsx`, `src/components/form/OptionField.tsx`, testes
  - Pronto quando: `PlateField` aceita `hideLabel` (rótulo só para leitor de tela, `htmlFor` mantido); `OptionField` repassa `columns` ao `OptionGroup`; testes passam.

- [x] T15 — Entrada digitada sem rolar e sem rodapé com teclado aberto
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx`, `.styles.ts`, `EntradaVeiculoModal.test.tsx` (e `src/components/ui/Modal/Modal.tsx` só se o rodapé condicional não reflowar sozinho)
  - Pronto quando: com teclado aberto (Murel ou do sistema) o rodapé não é renderizado, o rótulo "Placa" fica oculto, o gap do formulário reduz e as categorias aparecem em 3 colunas × 2 linhas; com 7 caracteres o teclado fecha e os botões voltam; fechar pelo cabeçalho com dados continua pedindo confirmação; em telas sem teclado de toque nada muda; verificação visual em 360×640 (placa, modelo e 6 categorias sem rolar); testes passam. 🏗

### Ajuste 4 · Câmera negada abre o teclado sozinha

- [x] T16 — `LeitorPlacaModal` avisa falha de câmera com `onFalha`
  - Arquivos: `src/components/veiculos/LeitorPlacaModal/LeitorPlacaModal.tsx`, `LeitorPlacaModal.test.tsx`
  - Pronto quando: ao virar `negada` ou `indisponivel` chama `onFalha(motivo)` uma vez por abertura e não mostra a tela de erro; `sem-leitura` (timeout) mantém a UI atual com "Tentar de novo"/"Digitar"; testes passam.

- [x] T17 — `EntradaVeiculoModal` abre o teclado e mostra a faixa "Tentar câmera"
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx`, `EntradaVeiculoModal.test.tsx`, `src/components/camera/PermissaoCamera.tsx` (se precisar reaproveitar `PassosLiberarCamera`)
  - Pronto quando: com câmera negada, o modal de leitura fecha, o campo da placa recebe foco e o teclado abre sem toque extra; `InlineNotice` mostra "Câmera indisponível. Digite a placa." com ação "Tentar câmera"; "Tentar câmera" reabre o leitor e, se falhar de novo, mostra os passos do cadeado dentro da faixa; a faixa some quando uma placa é lida; testes passam. 🏗

### Ajuste 8 · Imagem da câmera antes do leitor (só a opção "b")

- [x] T18 — `useLeitorPlaca` mostra a imagem antes de o reconhecedor carregar
  - Arquivos: `src/components/veiculos/LeitorPlacaModal/useLeitorPlaca.ts` e teste do hook (criar `useLeitorPlaca.test.tsx` se não existir)
  - Pronto quando: novo estado `pre-leitura`; `getUserMedia` e `criarReconhecedorPlaca()` continuam em paralelo mas independentes: ao chegar o stream, `srcObject` + `play()` + `pre-leitura`; quando o reconhecedor resolve, `lendo` e começa a varredura; reconhecedor com falha para as tracks e vai a `indisponivel`; toda continuação checa `sessaoRef` e libera o que já abriu (sem vazamento em StrictMode); testes cobrem imagem antes do reconhecedor, falha do reconhecedor e parada no meio.

- [x] T19 — Visor com aviso pequeno "Preparando leitura…"
  - Arquivos: `src/components/veiculos/LeitorPlacaModal/LeitorPlacaModal.tsx`, `LeitorPlacaModal.styles.ts`, `LeitorPlacaModal.test.tsx`
  - Pronto quando: em `pre-leitura` o vídeo aparece e "Preparando leitura…" é uma pílula pequena sobre a imagem (`aria-live="polite"`), sem texto grande abaixo; em `abrindo` o visor fica vazio só com a mira; em `lendo` a pílula some e vale "Aponte a câmera para a placa"; teclado e botões inalterados; só tokens do tema; testes passam. 🏗

## Segunda entrega (ajustes 5, 6, 7)

### Ajuste 5 · Cartão do operador no menu "Mais" (sem mexer na ordem)

- [x] T20 — Hook `useCaixaAberto`
  - Arquivos: `src/components/caixa/useCaixa.ts`, `src/components/caixa/hooksCaixa.test.tsx`
  - Pronto quando: usa só `getCaixa` com `CAIXA_KEY` e devolve aberto/fechado via `isCaixaAberto`, sem disparar turno nem movimentos; aceita `enabled`; testes passam.

- [x] T21 — Componente `MenuUsuario` dentro do `MenuSheet`
  - Arquivos: `src/components/layout/BottomNav/MenuUsuario.tsx`, `BottomNav.styles.ts`, `MenuSheet.tsx`, `MenuUsuario.test.tsx`, `MenuSheet.test.tsx`
  - Pronto quando: abaixo do cabeçalho "Mais" aparece avatar com iniciais, nome, perfil e "Caixa aberto/fechado" (`StatusBadge`); `Skeleton` curto enquanto carrega e situação omitida em erro ou perfil sem acesso ao caixa (sem disparar a query via `useCan(AREA.Caixa)`); perfil usa o mapeamento já existente na UI de usuários; ordem e grupos do menu idênticos aos de hoje (`lib/nav.ts` intocado e `nav.test.ts` verde); testes passam. 🏗

### Ajuste 7 · Nomes acessíveis

- [x] T22 — Reproduzir o problema de nomes acessíveis (teste primeiro)
  - Arquivos: `src/components/layout/BottomNav/BottomBar.test.tsx`, `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.test.tsx`
  - Pronto quando: testes buscam `getByRole("button", { name })` para Pátio, Caixa, Entrada/Saída e Mais e `getByRole("radio", { name: "Carro médio" })`; o resultado (o que já passa e o que falha) é anotado nesta task antes de T23. Decidir com o time o texto do nome da Entrada/Saída (ver "Label in Name" no Tech Spec).
  - **Resultado (executado):** nada falha. Os itens da barra já têm nome pelo texto visível (links "Pátio" e "Caixa"; botões "Entrada", "Saída" e "Mais"), e as 6 categorias já são achadas pelo nome ("Carro médio" etc.), nenhuma pelo código. O problema descrito no PDF não reproduz neste código. Falta só decidir se a barra passa a usar "Registrar entrada"/"Registrar saída" como nome (WCAG 2.5.3 aceita, pois o nome contém o texto visível), com o risco de duplicar o nome do botão "Registrar entrada" já existente na tela do Pátio e de quebrar testes que buscam "Entrada"/"Saída".

- [x] T23 — Corrigir só o que o teste da T22 mostrar faltando
  - Arquivos: `src/components/layout/BottomNav/BottomBar.tsx`, `EntradaButton.tsx`, `src/components/ui/OptionGroup/OptionGroup.tsx`, `EntradaVeiculoModal.tsx` (`CATEGORIA_OPTIONS`), testes de `BottomNav`/`BottomBar`/`MenuSheet`
  - Pronto quando: cada botão da barra e cada categoria tem nome acessível correto; `aria-label` contém o texto visível; testes existentes que buscam por texto atualizados; testes passam. 🏗
  - **Resultado (executado):** decisão do usuário: não renomear. Nenhum arquivo de produção foi alterado; os testes da T22 já cobrem os nomes.

### Ajuste 6 · Confirmação ao ler pela câmera

- [x] T24 — Módulo `feedbackLeitura`
  - Arquivos: `src/lib/feedbackLeitura.ts`, `src/lib/feedbackLeitura.test.ts`
  - Pronto quando: `confirmarLeitura()` vibra 1x (80 ms) e toca um bip curto via `AudioContext`; `leituraDuvidosa()` vibra 2x sem som; sem `navigator.vibrate` ou sem áudio falha em silêncio; testes com mocks passam.

- [x] T25 — Verificar se o OCR expõe confiança e expor a dúvida
  - Arquivos: `src/lib/ocrPlaca.ts`, `src/lib/reconhecedorPlaca.ts`, `src/lib/ocrPlaca.test.ts`
  - Pronto quando: está registrado nesta task se o reconhecedor devolve confiança; `criarConsenso` devolve `{ placa, duvida?: indice }` (por confiança, ou por discordância entre quadros se não houver confiança); testes passam.
  - **Resultado (executado):** o reconhecedor (`reconhecedorPlaca.ts`) devolve só texto, vazio quando a confiança dele fica abaixo de 0,8; a confiança não é exposta. A dúvida vem da divergência entre quadros: `criarConsenso().duvida()` devolve a posição do único caractere em que outra leitura válida diferia da placa confirmada.

- [x] T26 — Feedback e destaque no leitor de placa e no QR da saída
  - Arquivos: `src/components/veiculos/LeitorPlacaModal/useLeitorPlaca.ts`, `LeitorPlacaModal.tsx`, `src/components/veiculos/LeitorQrSaida/LeitorQrSaida.tsx` e `.styles.ts`, testes
  - Pronto quando: `Mira` ganha tons `ok` (`success`) e `duvida` (`warn`); leitura certa vibra uma vez, toca o bip e segue em ~0,5 s; leitura duvidosa vibra duas vezes, sem bip, e a conferência destaca o caractere em dúvida com `warn` e "Confira o último caractere"; QR válido chama `confirmarLeitura()`; `prefers-reduced-motion` sem transição animada; a chamada antiga `navigator.vibrate(80)` é substituída; testes passam. 🏗

## Fechamento

- [x] T27 — Verificação final da feature
  - Arquivos: todos os alterados; `docs/specs/manobrista-ajustes/prd.md` (critérios de aceite)
  - Pronto quando: `npm run lint`, testes e `npm run build` passam; critérios de aceite do PRD marcados um a um, ficando como "verificar em aparelho real" os que dependem de câmera, vibração e teclado do sistema; sem valores visuais hardcoded fora do tema.
  - **Resultado (executado):** lint sem erros (1 aviso antigo em `OnboardingWizard.test.tsx`), `tsc` limpo, build ok e 4913 testes passando. 3 testes falham e não são desta feature: os de "403 ... leva ao início" de `CaixaPage`, `MinhaEmpresa` e `UsuariosList` esperam o link `/dashboard`, mas `ErroSemPermissao` (não alterado) aponta para `/`. Os critérios do PRD que dependem de aparelho real (câmera, vibração, som, teclado do sistema, 360×640) estão anotados no `prd.md` como pendentes de conferência manual.
