# Tasks: Leitor de placa pela câmera

Referências: ./prd.md, ./techspec.md, ./design.md

Antes de começar: conferir a doc do Next desta versão em `node_modules/next/dist/docs/` (arquivos em `public/` e `matcher` do proxy) antes da T4, conforme `AGENTS.md`.

- [x] T1 — Criar o `CameraButton` no design system
  - Arquivos: `src/components/ui/CameraButton/CameraButton.tsx`, `CameraButton.styles.ts`, `index.ts`, `CameraButton.test.tsx`
  - Pronto quando: botão circular com ícone SVG de câmera (`currentColor`, `aria-hidden`), `aria-label` padrão "Ler placa pela câmera", `title`, prop `size` (`sm` | `md`), `disabled`; visual de borda, hover (`colors.primary`) e foco (`colors.warn`) igual ao `ThemeToggleButton`, só com tokens do tema; testes de rótulo acessível, clique e `disabled`; `npm run lint` passa.

- [x] T2 — Abrir slots de ação à direita em `Input` e `PlateField`
  - Arquivos: `src/components/ui/Input/Input.tsx` e `Input.styles.ts` (prop `endAction`, generalizando `$hasToggle` para "tem ação à direita"), `src/components/form/PlateField.tsx` e `PlateField.styles.ts` (prop `action`), testes de ambos
  - Pronto quando: com a prop, o botão aparece à direita (dentro da placa, sem empurrar nem sobrepor o número; dentro do campo, com espaço reservado no texto); sem a prop, a renderização atual é idêntica; testes cobrem os dois casos; `npm run lint` passa.

- [x] T3 — Extrair a placa do texto reconhecido
  - Arquivos: `src/lib/ocrPlaca.ts`, `src/lib/ocrPlaca.test.ts`
  - Pronto quando: `extrairPlaca(texto)` normaliza com `normalizePlaca`, acha uma janela de 7 caracteres, corrige confusões por posição (letras nas 3 primeiras; dígitos nas posições 4, 6 e 7; 5ª aceita os dois) e só devolve placa que passa em `isValidPlaca`; helper de consenso de 2 quadros consecutivos; testes com placa antiga, Mercosul, ruído, texto sem placa e confusões (`0/O`, `1/I`, `5/S`, `8/B`).

- [x] T4 — Disponibilizar o OCR auto-hospedado
  - **Revisada (2026-10-20):** `tesseract.js` foi trocado por `onnxruntime-web` mais detector e leitor de placas (ver `techspec.md`). Modelos versionados em `public/ocr/modelos/`; runtime copiado para `public/ocr/ort/` por `scripts/copy-ocr-assets.mjs`; lógica em `src/lib/reconhecedorPlaca.ts`. O texto original abaixo descreve a versão anterior.
  - Arquivos: `package.json` / lockfile (`tesseract.js` com versão fixa; dados do idioma `eng`), script de cópia para `public/ocr/` (worker, núcleo WASM e dados), `.gitignore` (`public/ocr/`), `src/proxy.ts` (`ocr` no `matcher`), `src/lib/ocrPlaca.ts` (carga sob demanda do worker com `workerPath`, `corePath`, `langPath`, whitelist `A-Z0-9`, linha única, `terminate`)
  - Pronto quando: após `npm install`/script os arquivos existem em `public/ocr/`; o worker é criado só ao ser pedido (`import("tesseract.js")` dinâmico, nada no bundle inicial) e nenhum arquivo é buscado em CDN de terceiros; os arquivos são servidos sem cookie de sessão; licença e tamanho final de `public/ocr/` conferidos e anotados; `npm run lint` e `npm run build` passam; teste da função de carga com o módulo mockado.

- [x] T5 — Criar o hook `useLeitorPlaca`
  - Arquivos: `src/components/veiculos/LeitorPlacaModal/useLeitorPlaca.ts`, `useLeitorPlaca.test.tsx`
  - Pronto quando: abre a câmera traseira (`facingMode` ideal `environment`), recorta a região da moldura, pré-processa (cinza, contraste, altura ≈ 96 px) e lê um quadro por vez com intervalo mínimo ≈ 400 ms; entrega a placa em `onPlaca` após consenso; vibra ao reconhecer; estados `ocioso | abrindo | lendo | negada | indisponivel | sem-leitura` (tempo esgotado em ≈ 15 s); `indisponivel` diferencia contexto não seguro; ao parar, desmontar ou fechar libera tracks, cancela `requestAnimationFrame`/timers e encerra o worker; testes com `getUserMedia` e OCR mockados cobrem sucesso, negada, indisponível, tempo esgotado e liberação da câmera.

- [x] T6 — Criar o `LeitorPlacaModal`
  - Arquivos: `src/components/veiculos/LeitorPlacaModal/LeitorPlacaModal.tsx`, `LeitorPlacaModal.styles.ts`, `index.ts`, `LeitorPlacaModal.test.tsx`
  - Pronto quando: usa `Modal` (`closeOnBackdrop={false}`, tela cheia no celular) com as etapas leitura (visor, moldura em proporção de placa, cantos `warn`/`success`/`danger`, texto de apoio) e conferência (`PlateDisplay size="md"` + `Input` editável normalizado, "Usar placa" só habilita com placa válida, "Ler de novo"); estados de erro (sem leitura, câmera negada, indisponível, sem conexão segura) com mensagens e botões "Tentar de novo"/"Digitar" conforme `design.md`; região `role="status"` com `aria-live="polite"`; fechar ou "Digitar" devolve o foco ao campo; só tokens do tema; testes dos fluxos leitura → conferência → confirmar, edição na conferência, cada erro e câmera parada ao fechar.

- [x] T7 — Integrar o leitor na entrada de veículo
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx`, `EntradaVeiculoModal.test.tsx`
  - Pronto quando: a placa mostra o `CameraButton` (via `PlateField.action`) que abre o `LeitorPlacaModal`; confirmar chama `field.handleChange(placa)`, disparando a consulta de placa existente, e não registra nada sozinho; botão desabilitado enquanto o registro é enviado; testes ajustados e novos (botão presente, confirmar preenche o campo, desabilitado ao enviar); `npm run lint` passa.

- [x] T8 — Integrar o leitor na busca manual da saída
  - Arquivos: `src/components/veiculos/BuscaManualSaida/BuscaManualSaida.tsx`, `BuscaManualSaida.test.tsx`
  - Pronto quando: só o campo "Placa" ganha o `CameraButton` (via `Input.endAction`); confirmar chama `onChange("placa", placa)` sem acionar a busca; token e sequencial não mudam; testes ajustados e novos; `npm run lint` passa.

- [ ] T9 — Verificação final e validação em aparelho
  - Arquivos: nenhum código novo esperado; ajustes que a verificação exigir
  - Pronto quando: `npm run lint`, `npx tsc --noEmit`, `npm run build` e `npm test` passam; checklist manual feito no celular e no desktop (permissão negada, sem câmera, HTTP não seguro, iOS/PWA instalado, modo escuro, teclado e leitor de tela); leitura testada com fotos reais de placa antiga e Mercosul em boa e má iluminação, com taxa de acerto registrada para preencher as métricas `[A DEFINIR]` do PRD.
  - Feito (2026-10-20): `npm run lint` (0 erros), `npx tsc --noEmit`, `npm run build` e `npm test` (802 testes) passam; arquivos do OCR servidos sem login. Pendente: checklist manual em aparelhos e fotos reais de placas. Com o OCR genérico, fotos reais falharam (`QXV7G23` virou `QXV7623`, `IWT8659` virou `NT8859`); depois da troca pelos modelos de placa, 4 de 4 leituras certas em Chrome com 2 fotos reais (retrato e 16:9), ≈ 200 ms por leitura.
