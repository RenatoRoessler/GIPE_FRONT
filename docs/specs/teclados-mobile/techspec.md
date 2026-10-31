# Tech Spec: Teclados customizados no celular

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e fixa o que a implementação precisa decidir)
- Protótipos: `murel-site/docs/specs/Teclado_Placa_Murel.html`, `Teclado_Numerico_Murel.html`, `Teclado_Alfanumerico_Murel.html`. Servem de referência de comportamento; o código novo não os copia (o HTML usa `var`, `innerHTML` e DOM direto).

## Design
- **Telas/estados**: ver `design.md` ("Teclados" e "Estados"). Nenhuma tela nova: os teclados aparecem sobre as telas existentes, dentro ou fora de `Modal`.
- **Componentes do design system reaproveitados**: `PlateDisplay` (campo de placa), `Input` (campos de texto e número), `Combobox` (modelo), `Modal`.
- **Componentes novos** (em `src/components/ui`, um por pasta, com `index.ts`, `.styles.ts` e teste):
  - `Key`: tecla base (`char`, `fn`, `action`), com suporte a toque longo.
  - `KeyboardSheet`: folha fixa na base, animação, área segura e publicação da altura.
  - `PlateKeyboard`, `NumericKeyboard`, `AlphaKeyboard`: os três teclados, só de apresentação.
- **Tokens de tema**: nenhum de cor novo; o mapa de `design.md` usa tokens existentes. Três tokens novos em `layout` de `src/styles/theme.ts`: `keyboardKeyHeight: "52px"`, `keyboardZIndex: 50`, `keyboardMaxWidth: "560px"`.

## Arquitetura da solução

### Visão geral
```
 Input / PlateField / Combobox
   └─ useTecladoCampo(teclado)      ← prop nova `teclado`; só age em aparelho de toque
        └─ registra o <input> em ─→ TecladoProvider (Client Component, no layout (app))
                                      ├─ estado: alvo, configuração, valor atual
                                      ├─ regras (src/lib/teclado)
                                      └─ createPortal → <KeyboardSheet> → um dos 3 teclados
 toque numa tecla → provider calcula o novo texto → setNativeValue(input) → onChange do React
                  → format/validação do campo continuam valendo
```

Regra de ouro: o teclado **nunca grava no estado do formulário**. Ele escreve no `<input>` e dispara o evento `input`; o `onChange` do campo (e o `format`, o zod, a máscara) segue exatamente o mesmo caminho do teclado do sistema. Assim nenhuma tela precisa mudar a lógica de formulário.

### Lógica pura (testável, sem React) — `src/lib/teclado/`
- `tipos.ts`: 
  ```ts
  export type ModoNumerico = "inteiro" | "decimal" | "livre";
  export type TecladoConfig =
    | { tipo: "placa" }
    | { tipo: "numerico"; modo: ModoNumerico }
    | { tipo: "alfa" };
  ```
- `placa.ts`: `tipoPosicaoPlaca(pos)` devolve `"L" | "N" | "LN" | null` (1–3 letras, 4 número, 5 letra ou número, 6–7 números); `aceitaPlaca(ch, pos)`. Usa `normalizePlaca`, `isValidPlaca` e `getPlacaTipo` de `src/lib/placa.ts`; não duplica regex.
- `numerico.ts`: `aceitaNumerico(modo, valorAtual, ch, max)` e `limparNumerico(modo, texto, max)`. Decimal: uma vírgula, não pode ser o primeiro caractere, no máximo 2 casas. Livre: dígitos, vírgula, ponto e hífen.
- `alfa.ts`: `aceitaAlfa(valorAtual, ch, max)` e `limparAlfa(texto, max)`: caixa alta, sem acento (`normalize("NFD")`), `[A-Z0-9.,-]` e espaço; sem espaço inicial nem duplo. Remove espaço sobrando no fim ao avançar/fechar.
- Os mesmos `aceita*`/`limpar*` alimentam três pontos: a tecla de toque, o `beforeinput` (teclado físico, RF6) e a limpeza do texto colado.

### Componentes de apresentação — `src/components/ui/`
- `Key/Key.tsx` + `Key.styles.ts`: `<button type="button">`, props `variant`, `label`, `ariaLabel`, `disabled`, `onPress`, `onLongPress?`. Toque longo (450 ms) por `onPointerDown` + timer, cancelado em `pointerup/cancel/leave`; o `click` seguinte é descartado quando o toque longo disparou. Vibração `navigator.vibrate?.(10)` dentro de `try`.
- `KeyboardSheet/KeyboardSheet.tsx`: `role="group"` com `aria-label`, `position: fixed`, `z-index: layout.keyboardZIndex`, `padding-bottom` com `env(safe-area-inset-bottom)`, animação `transform` de ~180 ms (desligada com `prefers-reduced-motion`). `onPointerDown={(e) => e.preventDefault()}` mantém o foco no campo. Mede a própria altura com `ResizeObserver` e grava `--teclado-altura` em `document.documentElement` (e `data-teclado` no mesmo elemento); remove ao fechar.
- `PlateKeyboard/`, `NumericKeyboard/`, `AlphaKeyboard/`: recebem `valor`, `maxLength`, `rotuloAcao` e callbacks (`onChar`, `onApagar`, `onAcao`, `onEspaco`), e só decidem **quais teclas existem/estão desabilitadas**. Nenhum conhece o `<input>`.

### Integração — `src/components/teclado/`
- `TecladoProvider.tsx` (Client Component): guarda `alvo` (`HTMLInputElement | null`), a configuração e o `valor` espelhado. Expõe via contexto: `abrir(el, config)`, `fechar()`, `registrar(el)`.
  - Renderiza a folha com `createPortal` no **`<dialog>` aberto mais próximo do campo** (`alvo.closest("dialog")`), ou em `document.body` fora de modal. Motivo: `Modal` usa `showModal()` e o resto da página fica inerte.
  - Escuta o evento `input` do `alvo` para atualizar `valor` (também cobre `format` do campo reescrevendo o texto).
  - Fecha ao: tocar fora (`pointerdown` no `document`, exceto no campo e na folha), `Escape`, `visibilitychange` com a aba oculta, troca de rota (`usePathname`) e desmontagem do campo.
- `useTecladoCampo.ts`: recebe `teclado?: TecladoConfig` e o `inputMode` original; devolve as props para o `<input>`:
  - Em aparelho de toque (`useMediaQuery("(hover: none) and (pointer: coarse)")`): `inputMode="none"`, `onFocus`/`onClick` que chamam `abrir`, `aria-controls` da folha.
  - Nos demais: mantém o `inputMode` original (`numeric`/`decimal`) e só aplica o filtro de `onBeforeInput`.
  - Em ambos: `onBeforeInput` (bloqueia o que a regra não aceita) e `onPaste` (aplica `limpar*`). Compõe, sem sobrescrever, os handlers que a tela já passou.
- `setNativeValue.ts`: chama o setter nativo de `HTMLInputElement.prototype.value` e dispara `new Event("input", { bubbles: true })`. É o único jeito de o `onChange` de um input controlado do React perceber a mudança. Depois posiciona o cursor no fim (`setSelectionRange`).
- **Próximo campo**: ao abrir e a cada troca, o provider calcula o rótulo ("Próximo" ou "OK") procurando o próximo `input:not([disabled]):not([readonly])`/`textarea` focável **no mesmo `<dialog>` ou `<form>`**, na ordem do DOM. Se o próximo tem teclado do Murel, ele abre; se não tem, recebe foco e o teclado do sistema assume; se não houver, a ação fecha.

### Campos que ganham a prop `teclado`
- `Input` (`src/components/ui/Input/Input.tsx`): nova prop opcional `teclado?: TecladoConfig`; chama `useTecladoCampo`. `TextField` já repassa as props ao `Input`, então `<field.TextField teclado={{ tipo: "numerico", modo: "decimal" }} />` funciona sem mudar o `TextField`.
- `PlateField` (`src/components/form/PlateField.tsx`): sempre `teclado={{ tipo: "placa" }}`.
- `Combobox` (`src/components/ui/Combobox/Combobox.tsx`) e `ComboboxField`: repassam `teclado` ao `<input role="combobox">`. `ModeloField` passa `{ tipo: "alfa" }`.
- `maxLength` do próprio campo é o limite do teclado (`placa`: 7; numérico: padrão 20; alfa: padrão 40).

### Alterações nas telas existentes
- `src/app/(app)/layout.tsx`: envolver `AppShell` com `TecladoProvider`.
- `src/components/ui/Modal/Modal.styles.ts`: reservar espaço para a folha.
  - Tela cheia no celular: `height: calc(100dvh - var(--teclado-altura, 0px))`, para o rodapé com o botão principal ficar acima do teclado.
  - Modal centralizado (tablet): `max-height` menos `var(--teclado-altura, 0px)` e `margin-bottom: var(--teclado-altura, 0px)`.
- `AppShell` (área rolável das telas fora de modal): `padding-bottom: var(--teclado-altura, 0px)`.
- `src/styles/theme.ts`: os três tokens de `layout`.

### Levantamento dos campos (RF20/RF21)
| Teclado | Campos |
|---|---|
| Placa | `PlateField` (`EntradaVeiculoModal`, `VeiculoItem` do mensalista); `Input` de placa em `BuscaManualSaida`; `LeitorPlacaModal` ("Placa lida") |
| Numérico, decimal (R$) | `AbrirCaixaModal`, `FecharCaixaModal`, `PassarTurnoModal`, `SangriaModal`, `ConferenciaFields`, `PagamentoSaida`, `PagamentoMensalistaModal`, `TipoModal`, `PrecoCobrancaFields` (valores), `PrecoFaixasStepFields` (valores), `LancamentoForm` (valor) |
| Numérico, inteiro | `BuscaManualSaida` (sequencial), `SimuladorCobranca`, `PrecoCobrancaFields` (tempos), `DuracaoFaixa` |
| Alfanumérico | `ModeloField` (entrada e mensalista), "Observação" em `FecharCaixaModal`, `PassarTurnoModal` e `LancamentoForm`; `token` em `BuscaManualSaida`; busca do pátio (`PatioFiltros`, "Placa, modelo ou ticket") |
| Mantém o do sistema | e-mail (`RecoverPasswordForm`), login por CPF (`LoginForm`), telefone, CPF/CNPJ, CEP, senha, nome/razão social, endereço e demais campos de adesão, empresas e usuários |

A lista é o ponto de partida: cada task confirma o campo ao migrá-lo, e os que tiverem máscara própria (CPF, CNPJ, CEP, telefone) ficam de fora conforme o PRD.

### Lista final (T22)
Migrados, além dos da tabela: `diaVencimento` em `MensalistaModal` (inteiro) e o campo de minutos do `SimuladorCobranca` (passou de `type="number"` a `type="text"`, inteiro). `Combobox`, `ComboboxField` e `TextField` ganharam a prop `teclado`; telas com campo cru (`PatioFiltros`, `SimuladorCobranca`) usam `useTecladoCampo` direto.

Mantidos no teclado do sistema, por tipo de motivo:
- **Máscara própria**: CPF (`LoginForm`, `EtapaCpf`, `ConveniadaResponsavelFields`, `CondutoresList`, adesão), CNPJ e CEP (`ConveniadaEmpresaFields`, adesão), telefone.
- **Endereço e número do endereço** (`Número` em `ConveniadaEmpresaFields` e na adesão), nome, razão social e demais campos de adesão, empresas, conveniadas e usuários.
- **Exigem acento ou minúsculas**: busca de `MensalistasList` e `AgendaView` (nomes, CPF/CNPJ parcial), `PrecosMasterDetail` (nome da tabela), "Nome do tipo" em `TipoModal`, "Descrição", "Recebido de/Pago a" e "Documento" em `LancamentoForm`, "Motivo" em `SangriaModal`.
- **E-mail, senha, data e hora**: `type` próprio do navegador.

## Decisões técnicas e trade-offs

- **Um provider e uma folha única, em vez de um teclado por campo.** Evita várias folhas montadas, garante que só uma aparece, deixa trocar de campo sem fechar/reabrir (RF7) e centraliza altura e fechamento. O custo é um contexto global; é pequeno e fica só no layout `(app)`.
- **Prop `teclado` nos campos, não um wrapper em cada tela.** Cada tela migra com uma linha e mantém suas validações e máscaras. Wrappers por tela duplicariam a lógica de foco e de filtro.
- **Escrever no `<input>` com o setter nativo + evento `input`**, em vez de ter um estado paralelo. Mantém o `format`, o zod e o tanstack form como estão; o custo é depender do truque do setter nativo (padrão conhecido com React; coberto por teste).
- **Portal no `<dialog>` aberto, não no `body`.** Necessário por causa do `showModal()` do `Modal`. O custo é calcular o destino a cada abertura; o `Modal` não muda de API.
- **Detecção por `(hover: none) and (pointer: coarse)`**, via o `useMediaQuery` existente, e não por largura de tela nem por user-agent. É o critério do protótipo e funciona com o SSR atual do hook (começa em `false`).
- **`inputMode="none"` só depois da hidratação.** O servidor renderiza o `inputMode` original; o cliente troca. Evita erro de hidratação e mantém o teclado do sistema como fallback se o JavaScript falhar.
- **Inserir e apagar sempre no fim.** Elimina o código de seleção/cursor (a parte mais frágil de um teclado próprio). O cursor é forçado para o fim ao focar e a cada toque. Consequência: não dá para corrigir o meio do texto no celular; aceito no PRD.
- **Próximo = próximo campo focável do mesmo `<form>`/`<dialog>`** (não só o próximo campo com teclado do Murel). Mais previsível para o operador, ao custo de passar para o teclado do sistema quando o campo seguinte não tem teclado próprio.
- **Sem biblioteca nova.** React, styled-components e o que já existe bastam. Nada de `es-toolkit` em lógica de uma linha.
- **Não reaproveitar `KeyBoardGrid`.** Ele é o quadro de chaves (ganchos), não teclado de digitação.

## Riscos / pontos de atenção

- **`position: fixed` dentro do `<dialog>`**: se algum ancestral tiver `transform`, `filter` ou `contain`, a folha deixa de ficar presa à tela. Validar no `Modal` real e, se necessário, usar `position: fixed` com o portal no `<dialog>` em vez de dentro do `Body`.
- **`inputMode="none"` e autofill**: o gerenciador de senhas e o preenchimento automático não aparecem. Nenhum dos campos migrados pede isso.
- **Foco programático**: `Modal` usa `autoFocus`/`data-autofocus` e devolve o foco ao abridor ao fechar. O foco automático deve abrir o teclado, e o foco devolvido a um botão não deve. O teste de `Modal` + campo cobre os dois.
- **Leitor de tela**: o toque no botão do teclado pode mover o foco (VoiceOver/TalkBack ignoram o `preventDefault` do ponteiro). O provider guarda o `alvo` em estado e chama `alvo.focus({ preventScroll: true })` depois de cada tecla, em vez de depender de `document.activeElement`.
- **`Combobox` do modelo**: a lista de sugestões abre embaixo do campo e pode ficar atrás da folha. Garantir que a lista role para dentro da área visível (ou abra para cima quando faltar espaço). `onBlur` do `Combobox` não pode fechar a lista por causa do toque nas teclas.
- **Campos `type="number"`** não aceitam `setSelectionRange`. Os campos migrados devem ser `type="text"`; se algum for `number`, trocar na task.
- **Aparelhos híbridos** (tablet com teclado e mouse): `pointer: coarse` pode vir como primário em alguns e não em outros. O fallback é seguro: sem a media query, vale o teclado do sistema.
- **Paisagem baixa**: a folha ocupa muito da altura. Mitigada com tecla de 44 px (design); validar em aparelho real.
- **iOS**: `inputmode="none"` e o comportamento de foco do Safari precisam de teste em aparelho. O modal em tela cheia com `100dvh` muda de altura com a barra do Safari.
- **Acessibilidade sem teclado do sistema**: quem usa ditado por voz ou comutador perde esse caminho. Decisão de produto pendente (ver `design.md`); a arquitetura permite um botão "teclado do sistema" que força `inputMode` original naquele campo.

## Fora de escopo técnico
- Mover o cursor, selecionar texto e apagar no meio do campo.
- Acentos, minúsculas e emojis no teclado alfanumérico.
- Teclado instalável no sistema (IME/Keyboard Extension) e `VirtualKeyboard API`.
- Campos com máscara própria (CPF, CNPJ, CEP, telefone) e e-mail/senha.
- Alterar contratos de API, schemas de validação ou regras de negócio.
- Seletor para ligar/desligar os teclados nas configurações do usuário.
- Mudanças em telas públicas (login, recuperar senha, adesão, comprovante).
