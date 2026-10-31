# Tasks: Teclados customizados no celular

Referências: ./prd.md, ./techspec.md, ./design.md

Antes de começar: conferir em `node_modules/next/dist/docs` o que muda para Client Components e layouts nesta versão do Next (AGENTS.md), e usar `renderWithTheme` de `src/test/render.tsx` nos testes. O jsdom não tem `matchMedia`: os testes que dependem de "aparelho de toque" mockam `window.matchMedia` para `(hover: none) and (pointer: coarse)`.

## Base: tema e regras puras

- [x] T1 — Adicionar os tokens de layout dos teclados
  - Arquivos: `src/styles/theme.ts`
  - Pronto quando: `layout` ganha `keyboardKeyHeight: "52px"`, `keyboardZIndex: 50` e `keyboardMaxWidth: "560px"`, com comentário curto de uso, como os demais; `AppTheme` continua tipando; `npm run lint` passa.

- [x] T2 — Criar os tipos e as regras do teclado de placa
  - Arquivos: `src/lib/teclado/tipos.ts`, `src/lib/teclado/placa.ts`, `src/lib/teclado/placa.test.ts`
  - Pronto quando: `tipos.ts` exporta `ModoNumerico` e `TecladoConfig`; `tipoPosicaoPlaca(pos)` devolve `"L"` (0–2), `"N"` (3), `"LN"` (4), `"N"` (5–6) e `null` (7+); `aceitaPlaca(ch, pos)` obedece a essa tabela; reutiliza `normalizePlaca` e `isValidPlaca` de `src/lib/placa.ts`, sem regex nova; testes cobrem Mercosul, padrão antigo, placa cheia e caractere inválido; lint passa.

- [x] T3 — Criar as regras do teclado numérico
  - Arquivos: `src/lib/teclado/numerico.ts`, `src/lib/teclado/numerico.test.ts`
  - Pronto quando: `aceitaNumerico(modo, valorAtual, ch, max)` e `limparNumerico(modo, texto, max)` seguem o techspec: inteiro só dígitos; decimal com uma vírgula, nunca como primeiro caractere e no máximo 2 casas; livre com dígitos, vírgula, ponto e hífen; respeita `max`; `limparNumerico` descarta o que não cabe, na ordem; testes cobrem os três modos, limite de casas, vírgula repetida e texto colado; lint passa.

- [x] T4 — Criar as regras do teclado alfanumérico
  - Arquivos: `src/lib/teclado/alfa.ts`, `src/lib/teclado/alfa.test.ts`
  - Pronto quando: `aceitaAlfa(valorAtual, ch, max)` aceita `[A-Z0-9.,-]` e espaço (nunca no início nem duplo); `limparAlfa(texto, max)` passa para caixa alta, remove acento (`normalize("NFD")`) e aplica as mesmas regras; `aparar(texto)` remove espaço sobrando no fim; testes cobrem acento, minúscula, espaço duplo, limite e texto colado; lint passa.

## Componentes de apresentação

- [x] T5 — Criar o componente `Key`
  - Arquivos: `src/components/ui/Key/{Key.tsx,Key.styles.ts,Key.test.tsx,index.ts}`
  - Depende de: T1
  - Pronto quando: `<button type="button">` com variantes `char`, `fn` e `action` usando o mapa de tokens do `design.md`; altura `keyboardKeyHeight`; props `label`, `ariaLabel`, `disabled`, `onPress`, `onLongPress`; toque longo de 450 ms dispara `onLongPress` e descarta o `click` seguinte, e é cancelado em `pointerup`, `pointercancel` e `pointerleave`; `navigator.vibrate?.(10)` dentro de `try`; sem valor visual solto; testes cobrem toque, toque longo, `disabled` e rótulo acessível; lint passa.

- [x] T6 — Criar o `KeyboardSheet`
  - Arquivos: `src/components/ui/KeyboardSheet/{KeyboardSheet.tsx,KeyboardSheet.styles.ts,KeyboardSheet.test.tsx,index.ts}`
  - Depende de: T1
  - Pronto quando: `role="group"` com `aria-label` por props; `position: fixed` na base, `z-index` do token, conteúdo até `keyboardMaxWidth`, `padding-bottom` com `env(safe-area-inset-bottom)`; entrada por `transform` de ~180 ms, sem animação com `prefers-reduced-motion`; `pointerdown` com `preventDefault`; mede a própria altura com `ResizeObserver` e grava `--teclado-altura` e `data-teclado` em `document.documentElement`, removendo ao desmontar; testes cobrem o grupo acessível, o `preventDefault` e a limpeza da variável (mockando `ResizeObserver`); lint passa.

- [x] T7 — Criar o `PlateKeyboard`
  - Arquivos: `src/components/ui/PlateKeyboard/{PlateKeyboard.tsx,PlateKeyboard.styles.ts,PlateKeyboard.test.tsx,index.ts}`
  - Depende de: T2, T5, T6
  - Pronto quando: recebe `valor`, `onChar`, `onApagar`; mostra QWERTY nas posições 1–3, bloco numérico na 4, linha de números + QWERTY na 5 e bloco numérico nas 6–7, via `tipoPosicaoPlaca`; apagar sempre presente; placa completa deixa as teclas de caractere desabilitadas; não há tecla de ação; testes cobrem cada posição, Mercosul (`ABC1D`) e antiga (`ABC12`), e placa completa; lint passa.

- [x] T8 — Criar o `NumericKeyboard`
  - Arquivos: `src/components/ui/NumericKeyboard/{NumericKeyboard.tsx,NumericKeyboard.styles.ts,NumericKeyboard.test.tsx,index.ts}`
  - Depende de: T3, T5, T6
  - Pronto quando: grade de 4 colunas `1 2 3 ⌫ / 4 5 6 Próximo / 7 8 9 .- / · 0 · ,`; recebe `modo`, `valor`, `maxLength`, `rotuloAcao`, `onChar`, `onApagar`, `onAcao`; teclas fora do modo ficam `disabled` (vírgula em inteiro, ponto/hífen fora do livre, vírgula repetida); `.-` insere ponto no toque e hífen no toque longo, com rótulo acessível dizendo as duas coisas; dígitos desabilitados ao atingir o limite; testes cobrem os três modos, o toque longo e o rótulo "Próximo"/"OK"; lint passa.

- [x] T9 — Criar o `AlphaKeyboard`
  - Arquivos: `src/components/ui/AlphaKeyboard/{AlphaKeyboard.tsx,AlphaKeyboard.styles.ts,AlphaKeyboard.test.tsx,index.ts}`
  - Depende de: T4, T5, T6, T8
  - Pronto quando: modo letras (QWERTY, ⌫ na 3ª linha, última linha com `123`, `ESPAÇO` e Próximo/OK) e modo números (mesmo bloco do `NumericKeyboard`, com `ABC` e `ESPAÇO`); `123`/`ABC` alternam; o modo volta a letras quando o campo muda (prop `chave` do campo); `ESPAÇO` desabilitado com campo vazio ou terminado em espaço; teclas de caractere desabilitadas no limite; testes cobrem a troca de modo, `ESPAÇO`, limite e rótulos; lint passa.

## Integração

- [x] T10 — Criar `setNativeValue` e a busca do próximo campo
  - Arquivos: `src/components/teclado/setNativeValue.ts`, `src/components/teclado/proximoCampo.ts`, testes de cada um
  - Pronto quando: `setNativeValue(el, valor)` usa o setter nativo de `HTMLInputElement.prototype.value`, dispara `input` com `bubbles` e deixa o cursor no fim, e um `<input>` controlado do React recebe o `onChange`; `proximoCampo(el)` devolve o próximo `input`/`textarea` focável (sem `disabled`, `readonly`, `hidden`, radio ou checkbox) dentro do mesmo `<dialog>` ou `<form>`, na ordem do DOM, ou `null`; testes cobrem input controlado, `format` reescrevendo o valor, campo desabilitado no meio e último campo; lint passa.

- [x] T11 — Criar o `TecladoProvider`
  - Arquivos: `src/components/teclado/{TecladoProvider.tsx,TecladoProvider.test.tsx,index.ts}`
  - Depende de: T6, T7, T8, T9, T10
  - Pronto quando: Client Component que guarda `alvo`, configuração e `valor` (atualizado pelo evento `input` do campo) e expõe `abrir`, `fechar` e `registrar`; renderiza o teclado do tipo certo em `createPortal` no `closest("dialog")` do campo ou em `document.body`; as teclas gravam via `setNativeValue` usando as regras de `src/lib/teclado`, devolvem o foco ao campo (`focus({ preventScroll: true })`) e usam o rótulo "Próximo"/"OK" de `proximoCampo`; "Próximo" abre o teclado do próximo campo ou entrega o foco a um campo sem teclado próprio; placa válida e completa fecha em ~150 ms; fecha ao tocar fora, com `Escape`, aba oculta, troca de rota e desmontagem do campo; rola o campo para a área visível; testes cobrem digitar, apagar, Próximo/OK, fechar por cada causa e portal dentro de `<dialog>`; lint passa.

- [x] T12 — Criar o hook `useTecladoCampo`
  - Arquivos: `src/components/teclado/useTecladoCampo.ts`, `src/components/teclado/useTecladoCampo.test.tsx`
  - Depende de: T3, T4, T2, T11
  - Pronto quando: recebe `teclado?: TecladoConfig` e o `inputMode` original; em aparelho de toque (`useMediaQuery("(hover: none) and (pointer: coarse)")`) devolve `inputMode="none"`, `onFocus`/`onClick` que abrem o teclado e o cursor no fim; nos demais mantém o `inputMode` original; em ambos devolve `onBeforeInput` (bloqueia o que a regra não aceita, usando a posição do cursor) e `onPaste` (limpa pelo `limpar*`); compõe, sem sobrescrever, os handlers passados pela tela; sem `teclado`, não muda nada; testes cobrem toque x computador, filtro de teclado físico, colar e composição de handlers; lint passa.

- [x] T13 — Adicionar a prop `teclado` ao `Input`
  - Arquivos: `src/components/ui/Input/Input.tsx`, `src/components/ui/Input/Input.test.tsx`
  - Depende de: T12
  - Pronto quando: `InputProps.teclado?: TecladoConfig` aplica o hook ao `StyledInput`; `TextField` passa a funcionar com `teclado` sem alteração; sem a prop o `Input` se comporta como hoje (testes atuais passam); teste novo cobre `inputMode="none"` e abertura do teclado em aparelho de toque, e o filtro no computador; lint passa.

- [x] T14 — Aplicar o teclado de placa no `PlateField`
  - Arquivos: `src/components/form/PlateField.tsx`, `src/components/form/PlateField.test.tsx`
  - Depende de: T12
  - Pronto quando: o campo usa `teclado={{ tipo: "placa" }}` sempre; o foco mostra o anel já existente no `PlateFrame`; a placa continua passando por `normalizePlaca`; testes atuais passam e novos cobrem o teclado de placa em aparelho de toque e o filtro por posição no computador; lint passa.

- [x] T15 — Aplicar o teclado alfanumérico no `Combobox` e no `ModeloField`
  - Arquivos: `src/components/ui/Combobox/Combobox.tsx`, `src/components/form/ComboboxField.tsx`, `src/components/veiculos/ModeloField.tsx`, testes correspondentes
  - Depende de: T12
  - Pronto quando: `Combobox` e `ComboboxField` aceitam e repassam `teclado`; `ModeloField` passa `{ tipo: "alfa" }`; tocar numa tecla não fecha a lista de sugestões (o `onBlur` do `Combobox` não dispara pelo toque); a lista não fica escondida atrás da folha (rola para a área visível ou abre para cima quando falta espaço); testes atuais passam e novos cobrem digitar e escolher sugestão; lint passa.

- [x] T16 — Ligar o provider e reservar espaço no `Modal` e no `AppShell`
  - Arquivos: `src/app/(app)/layout.tsx`, `src/components/ui/Modal/Modal.styles.ts`, `src/components/layout/AppShell/` (estilos da área rolável), `src/components/ui/Modal/Modal.test.tsx`
  - Depende de: T11
  - Pronto quando: `(app)/layout.tsx` envolve o `AppShell` com `TecladoProvider`; no modal em tela cheia a altura vira `calc(100dvh - var(--teclado-altura, 0px))`, e no modal centralizado `max-height` e `margin-bottom` descontam a altura; a área rolável do `AppShell` ganha `padding-bottom: var(--teclado-altura, 0px)`; sem teclado aberto nada muda; o foco devolvido a um botão ao fechar o modal não abre o teclado, e o `autoFocus` de um campo com teclado abre; verificado que nenhum ancestral do `Body` do modal tem `transform` que quebre o `position: fixed`; lint passa.

## Migração dos campos

- [x] T17 — Migrar placa, ticket e token da entrada e da saída de veículos
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx`, `src/components/mensalistas/MensalistaModal/VeiculoItem.tsx`, `src/components/veiculos/BuscaManualSaida/BuscaManualSaida.tsx`, `src/components/veiculos/LeitorPlacaModal/LeitorPlacaModal.tsx`, testes de cada um
  - Depende de: T13, T14, T15, T16
  - Pronto quando: placa de entrada e de mensalista pelo `PlateField` (já com o teclado); `Input` de placa em `BuscaManualSaida` e "Placa lida" em `LeitorPlacaModal` com `teclado={{ tipo: "placa" }}`; sequencial com `{ tipo: "numerico", modo: "inteiro" }`; `token` com `{ tipo: "alfa" }`; modelo da entrada e do mensalista usam o `ModeloField` com o teclado alfa; testes existentes passam; lint passa.

- [x] T18 — Migrar os campos do caixa
  - Arquivos: `src/components/caixa/AbrirCaixaModal.tsx`, `FecharCaixaModal.tsx`, `PassarTurnoModal.tsx`, `SangriaModal.tsx`, `ConferenciaFields.tsx`, testes de cada um
  - Depende de: T13, T16
  - Pronto quando: valores em R$ com `{ tipo: "numerico", modo: "decimal" }` (sem remover o `inputMode="decimal"` que serve de fallback no computador); "Observação" com `{ tipo: "alfa" }`; campos continuam `type="text"`; testes atuais passam; lint passa.

- [x] T19 — Migrar saída, pagamento de mensalista, tipos e lançamentos
  - Arquivos: `src/components/veiculos/PagamentoSaida/PagamentoSaida.tsx`, `src/components/mensalistas/PagamentoMensalistaModal/PagamentoMensalistaModal.tsx`, `src/components/mensalistas/TipoModal/TipoModal.tsx`, `src/components/financeiro/LancamentoModal/LancamentoForm.tsx`, testes de cada um
  - Depende de: T13, T16
  - Pronto quando: valores com `{ tipo: "numerico", modo: "decimal" }` e a "Observação" do lançamento com `{ tipo: "alfa" }`; testes atuais passam; lint passa.

- [x] T20 — Migrar os campos de preços
  - Arquivos: `src/components/precos/PrecoCobrancaFields/PrecoCobrancaFields.tsx`, `src/components/precos/PrecoFaixasStepFields/PrecoFaixasStepFields.tsx`, `src/components/precos/PrecoFaixasStepFields/DuracaoFaixa.tsx`, `src/components/precos/SimuladorCobranca/SimuladorCobranca.tsx`, testes de cada um
  - Depende de: T13, T16
  - Pronto quando: valores em R$ com modo `decimal` e tempos, durações e quantidades com modo `inteiro`; campos que forem `type="number"` passam a `type="text"` (o `setSelectionRange` não existe em `number`) sem mudar a validação; testes atuais passam; lint passa.

- [x] T21 — Migrar a busca do pátio
  - Arquivos: `src/components/patio/PatioView/PatioFiltros.tsx`, `src/components/patio/PatioView/PatioView.test.tsx`
  - Depende de: T13, T16
  - Pronto quando: o campo "Placa, modelo ou ticket" usa `{ tipo: "alfa" }`; o `enterKeyHint`/ação "OK" fecha o teclado e mantém o filtro aplicado; testes atuais passam; lint passa.

- [x] T22 — Conferir os campos restantes do levantamento
  - Arquivos: `src/components/mensalistas/MensalistaModal/MensalistaModal.tsx`, `CondutoresList.tsx`, `src/components/mensalistas/MensalistasList/MensalistasList.tsx` e qualquer campo `inputMode="numeric"`/`"decimal"` que a busca encontrar fora das tasks T17–T21
  - Depende de: T17, T18, T19, T20, T21
  - Pronto quando: cada campo restante foi classificado: migrado para o teclado certo, ou mantido no teclado do sistema por ter máscara (CPF, CNPJ, CEP, telefone) ou exigir acento/minúsculas, com a lista final registrada na seção "Levantamento dos campos" do `techspec.md`; lint passa.

## Fechamento

- [ ] T23 — Verificação final
  - Arquivos: nenhum novo (ajustes pontuais onde a verificação achar problema)
  - Depende de: T22
  - Pronto quando: `npm run lint`, os testes (`npm run test`, ou o script equivalente do `package.json`) e `npm run build` passam; no navegador com emulação de celular (e, se possível, em Android e iOS reais) os critérios de aceite do `prd.md` foram conferidos: placa por posição e fechamento automático, modos numéricos, troca `123`/`ABC`, Próximo/OK, tocar fora, modal em tela cheia com o botão principal acima do teclado, tema claro e escuro, paisagem; no computador os campos usam o teclado físico com o mesmo filtro; resultado registrado no final deste arquivo.

## Resultado da verificação (T23, parcial)

Automatizado, em 2026-10-31:
- `npm run lint`: 0 erros (94 avisos antigos, de arquivos gerados). `tsc --noEmit`: limpo.
- `npm run test` (vitest): 3201 de 3202 passam. O que falhou na suíte inteira foi `MensalistaModal.veiculos > CPF repetido no mesmo veículo impede salvar`, por estourar 5 s sob carga; isolado, o arquivo passa (17/17, 3 s no teste). Não toca em campo com teclado.
- `npm run build`: passa.

Ajustes em testes antigos, por consequência esperada do filtro (o campo decimal/inteiro não deixa mais digitar "-", "." nem 3ª casa): `CaixaModais` e `PagamentoMensalistaModal` passaram a injetar o valor inválido com `fireEvent.change` (a validação continua coberta) e ganharam teste do filtro; `SimuladorCobranca`/`PrecoDetalhe` esperam string (`type="text"`); `FluxoCaixa` e `LancamentosLista` ganharam `useMediaQuery` no mock do hook.

Pendente (precisa de navegador com emulação de celular ou aparelho Android/iOS, com sessão logada):
- [ ] placa por posição e fechamento automático; modos numéricos; `123`/`ABC`; Próximo/OK; tocar fora
- [ ] modal em tela cheia com o botão principal acima do teclado; lista do modelo visível acima da folha
- [ ] tema claro e escuro; paisagem; iOS (`100dvh`, foco do Safari)
- [ ] computador: teclado físico com o mesmo filtro
