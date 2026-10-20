# Tech Spec: Leitor de placa pela câmera

> **Atualização (2026-10-20):** o OCR genérico (`tesseract.js`) foi trocado por **dois modelos feitos para placas** rodando no aparelho com `onnxruntime-web`: um detector que acha a placa no quadro inteiro e um leitor de caracteres. Com fotos reais de carros, o Tesseract errou até com a placa recortada à mão (`QXV7G23` virava `QXV7623`, `IWT8659` virava `NT8859`) e quase não achava a placa no quadro inteiro; os modelos de placa acertaram as duas em todos os enquadramentos testados (retrato, paisagem 16:9 e placa pequena). As seções abaixo foram ajustadas; onde aparecer "moldura de enquadramento" ou "recorte", vale o novo comportamento: a placa é procurada no quadro todo.

## Referências
- PRD: ./prd.md
- Design: ./design.md (resumo na seção "Design" abaixo)

## Design
- **Telas/estados**: (A) botão de câmera dentro da placa do `PlateField` (entrada); (B) botão de câmera dentro do `Input` de placa da busca manual da saída; (C) `LeitorPlacaModal` com etapas leitura → conferência e estados de erro. Detalhes em `design.md`.
- **Componentes do design system reaproveitados**: `Modal`, `Button`, `Input`, `Text`, `PlateDisplay`, e o padrão visual do `ThemeToggleButton` (borda, hover, foco).
- **Reaproveitados do leitor de QR**: o padrão de `LeitorQrSaida` (visor, mira em cantos, `VisuallyHidden` com `aria-live`) e o ciclo de vida da câmera de `useLeitorQr` (sessões, parada de tracks, StrictMode).
- **Componentes novos**:
  - `src/components/ui/CameraButton/` (`CameraButton.tsx`, `CameraButton.styles.ts`, `index.ts`): botão circular com ícone de câmera.
  - `src/components/veiculos/LeitorPlacaModal/` (`LeitorPlacaModal.tsx`, `LeitorPlacaModal.styles.ts`, `useLeitorPlaca.ts`, `index.ts`): modal e hook de leitura.
  - `src/lib/ocrPlaca.ts`: extração da placa a partir do texto e consenso entre leituras.
  - `src/lib/reconhecedorPlaca.ts`: detector e leitor de placa (onnxruntime-web).
- **Tokens de tema**: nenhum novo (ver `design.md`, seção 3).

## Arquitetura da solução

### Arquivos afetados
| Arquivo | Mudança |
|---------|---------|
| `src/components/form/PlateField.tsx` (+ `.styles.ts`) | Nova prop opcional `action?: ReactNode`, renderizada à direita do número dentro do `PlateDisplay`. Sem a prop, nada muda. |
| `src/components/ui/Input/Input.tsx` (+ `.styles.ts`) | Nova prop opcional `endAction?: ReactNode`, no mesmo lugar do `ToggleButton` de senha (já existe `InputWrapper` com botão à direita e `$hasToggle` reservando espaço no texto). Generalizar `$hasToggle` para "tem ação à direita". |
| `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx` | Passa `action={<CameraButton />}` ao `PlateField`; guarda `leitorAberto`; ao confirmar, `field.handleChange(placa)` (mesmo caminho da digitação, para disparar a consulta de placa existente). Botão desabilitado enquanto envia. |
| `src/components/veiculos/BuscaManualSaida/BuscaManualSaida.tsx` | Passa `endAction` ao `Input` de placa; ao confirmar, chama `onChange("placa", placa)`. |
| `src/proxy.ts` | Adicionar `ocr` às exclusões do `matcher` (arquivos do OCR em `public/ocr/`, buscados sem cookie). |
| `package.json` | Nova dependência `onnxruntime-web`; script `postinstall` que copia o runtime WASM para `public/ocr/ort/` (ver abaixo). |

### Reconhecimento da placa (no aparelho)
- **Runtime**: `onnxruntime-web` 1.22 (entrada `onnxruntime-web/wasm`, só CPU/WASM), carregado com `import()` somente quando o modal abre. Uma thread (`numThreads = 1`), pois o app não tem isolamento entre origens.
- **Modelos** (versionados em `public/ocr/modelos/`, ≈ 13 MB, sem rede de terceiros em tempo de execução):
  - `placa-detector.onnx`: `yolo-v9-t-512-license-plates-end2end` (open-image-models, MIT). Entrada `float32 [1,3,512,512]` (RGB 0–1, quadro encaixado com bordas cinza 114); saída com linhas `[lote, x1, y1, x2, y2, classe, confiança]`.
  - `placa-leitor.onnx`: `cct_s_v2_global` (fast-plate-ocr, MIT). Entrada `uint8 [1,64,128,3]` (recorte da placa em RGB); saída `plate` com 10 posições × 37 símbolos (`0-9A-Z_`) em probabilidades.
- **Runtime copiado de `node_modules`**: `scripts/copy-ocr-assets.mjs` (postinstall) copia `ort-wasm-simd-threaded.{mjs,wasm}` para `public/ocr/ort/` (≈ 11 MB, fora do git). O `proxy.ts` já exclui `ocr` do `matcher`.
- **Fluxo por leitura** (`src/lib/reconhecedorPlaca.ts`, `reconhecer(video)`): desenha o quadro inteiro do vídeo no detector, pega a caixa mais confiante (≥ 0.4), recorta a placa do vídeo com folga (4% na largura e 6% na altura) para 128×64, lê os caracteres e só devolve o texto se a menor probabilidade entre os caracteres for ≥ 0.8.
- **Funções puras testadas**: `calcularLetterbox`, `melhorDeteccao` e `decodificarPlaca`.
- **Validação e correção** (`src/lib/ocrPlaca.ts`): `extrairPlaca` só devolve placa que passa em `isValidPlaca`, com correção de confusões nas posições onde o tipo é conhecido; `criarConsenso` exige o mesmo valor em **2 leituras consecutivas**. Mantidos do desenho anterior.
- **Tempo esgotado**: sem placa válida em ≈ 15 s a leitura para e vai ao estado "Não consegui ler".
- **Cadência**: uma leitura por vez e intervalo mínimo ≈ 400 ms. Medido em Chrome: ≈ 200 ms por leitura e ≈ 0,5 s para carregar modelos e runtime (rede local).

### Câmera e ciclo de vida (`useLeitorPlaca`)
- Mesmo contrato do `useLeitorQr` (`videoRef`, `estado`, `iniciar`), com estados `ocioso | abrindo | lendo | negada | indisponivel | sem-leitura` e saída `onPlaca(placa)`.
- **Decisão**: não generalizar `useLeitorQr` agora. Os dois hooks diferem no que fazem por quadro (QR: `BarcodeDetector`/`jsqr` em recorte quadrado; placa: recorte retangular + OCR assíncrono + consenso). Extrair um `useCamera` comum é desejável, mas fica como refatoração posterior para não mexer no leitor de QR já testado.
- Câmera: `getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })`. `NotAllowedError` → `negada`; ausência de `navigator.mediaDevices` → `indisponivel` (cobre também contexto não seguro, onde o navegador remove a API; a mensagem diferencia pelo `window.isSecureContext`).
- Encerramento (RF-06): ao fechar o modal, confirmar, cancelar ou desmontar, parar todos os tracks, cancelar `requestAnimationFrame` e timers e dar `terminate()` no worker.
- Vibração curta (`navigator.vibrate`) ao reconhecer, como no QR.

### `LeitorPlacaModal`
- **Client Component** (câmera, estado e worker).
- Props: `open: boolean`, `onClose: () => void`, `onConfirm: (placa: string) => void`.
- Usa `Modal` com `closeOnBackdrop={false}` (câmera ativa) e `fullScreenOnMobile`.
- Etapas: `leitura` (visor com cantos de enquadramento; a placa é procurada no quadro inteiro) e `conferencia` (`PlateDisplay size="md"` + `Input` editável normalizado por `normalizePlaca`, `maxLength={7}`; **Usar placa** só habilita com `isValidPlaca`).
- Erros: mensagens e botões conforme a tabela de estados do `design.md`; "Digitar" = `onClose`, e o foco volta ao campo de placa.
- Na conferência a câmera já está desligada (o stream é parado ao reconhecer); **Ler de novo** reinicia o hook.

### `CameraButton`
- **Client Component** simples (`button type="button"`), props `onClick`, `disabled`, `aria-label` (padrão "Ler placa pela câmera"), `size?: "sm" | "md"`. Ícone SVG inline com `currentColor` e `aria-hidden`, como `ThemeIcons.tsx`.
- Mora em `src/components/ui` por ser reaproveitável e fazer parte do design system.

### Server vs Client
Todas as peças novas são **Client Components** (câmera, worker, estado). Nenhuma rota nova.

### Dados e tipos
Sem mudança de API nem de tipos de domínio. O resultado da leitura é uma `string` de placa normalizada. Tipos locais (`LeitorPlacaEstado`, props) ficam junto dos componentes.

## Decisões técnicas e trade-offs
- **Modelos de placa no aparelho em vez de OCR genérico ou serviço externo**: atende "sem custo e sem enviar imagem a terceiros" (PRD). O OCR genérico (`tesseract.js`) foi testado primeiro e reprovado com fotos reais; o detector mais o leitor de placas resolveu os mesmos casos. Trade-off: ≈ 24 MB de arquivos estáticos (modelos e runtime), baixados só quando o modal abre.
- **Arquivos hospedados no projeto**: evita CDN de terceiros; os modelos são versionados (não há pacote npm deles) e o runtime vem de `node_modules` pelo script de cópia.
- **Carga sob demanda**: o OCR só é baixado na primeira abertura do modal; o navegador faz cache HTTP desses arquivos. O service worker do PWA não guarda cache de dados, então não interfere. Mostrar "Preparando leitura…" enquanto o worker carrega.
- **Consenso de 2 quadros**: pequena latência a mais em troca de menos leituras erradas apresentadas ao operador.
- **Não generalizar `useLeitorQr`**: evita risco de regressão no leitor de QR; a duplicação mínima de abertura/parada da câmera é aceitável por ora.
- **`Input.endAction` e `PlateField.action` como slots genéricos**, e não props específicas de câmera: mantém o design system desacoplado desta feature.
- **Preencher o campo, não disparar ação**: confirmar só preenche a placa (RF-04); a consulta de placa da entrada e a busca da saída continuam sendo disparadas pelo fluxo normal.

## Riscos / pontos de atenção
- **Precisão**: validada com 2 fotos reais (placa Mercosul e antiga, em garagem com pouca luz): 100% de acerto em retrato, paisagem 16:9 e placa pequena. É uma amostra pequena; validar com mais fotos antes de dar por concluída (a métrica do PRD segue `[A DEFINIR]`).
- **Licença dos modelos**: os repositórios `open-image-models` e `fast-plate-ocr` são MIT, mas o detector é um YOLOv9 treinado por eles; confirmar se os pesos derivados da arquitetura YOLOv9 (originalmente GPL-3.0) podem ser redistribuídos neste produto.
- **Desempenho em celulares antigos**: WASM + OCR contínuo pode esquentar ou travar; cadência limitada e tempo esgotado mitigam. Testar em um aparelho modesto.
- **Contexto seguro**: `getUserMedia` só funciona em HTTPS ou `localhost`; ambientes internos em HTTP não vão funcionar (mensagem específica já prevista).
- **iOS Safari**: `video.play()` exige `playsInline` e `muted`, como já feito no `LeitorQrSaida`; testar a permissão também no PWA instalado.
- **Peso**: `public/ocr/` soma ≈ 24 MB (13 MB de modelos versionados e 11 MB de runtime gerado).
- **CSP**: se uma CSP for adotada no futuro, o WASM exigirá `wasm-unsafe-eval`. Hoje não há CSP em `next.config.ts`.
- **`proxy.ts`**: sem excluir `ocr` do `matcher`, requisições sem cookie de sessão seriam redirecionadas para `/login`. Excluir como foi feito para `icons`.
- **Ao implementar**: conferir a doc desta versão do Next em `node_modules/next/dist/docs/` (arquivos em `public/` e `matcher` do proxy) antes de mexer em `proxy.ts`, conforme `AGENTS.md`.

## Testes
- `ocrPlaca.test.ts`: extração e correção de confusões (placa antiga e Mercosul, ruído, texto sem placa) e consenso.
- `reconhecedorPlaca.test.ts`: `calcularLetterbox`, `melhorDeteccao`, `decodificarPlaca` e a montagem do runtime com `onnxruntime-web` simulado.
- `LeitorPlacaModal.test.tsx` (mockando `getUserMedia` e o módulo de OCR): leitura → conferência → confirmar; editar na conferência; câmera negada; indisponível; tempo esgotado; parada dos tracks ao fechar.
- `CameraButton.test.tsx`: rótulo acessível e `disabled`.
- Ajustar os testes de `EntradaVeiculoModal` e `BuscaManualSaida`: botão presente; confirmar preenche o campo; desabilitado enquanto envia.
- `PlateField` e `Input`: sem a nova prop, a renderização atual é preservada.

## Fora de escopo técnico
- Extrair um `useCamera` compartilhado entre `useLeitorQr` e `useLeitorPlaca`.
- Guardar foto ou enviar imagem a qualquer servidor.
- Leitura contínua/automática sem ação do operador e reconhecimento de modelo ou cor.
- Botão de câmera em outros campos de placa (ex.: mensalistas).
- Treinar ou ajustar um modelo próprio.
