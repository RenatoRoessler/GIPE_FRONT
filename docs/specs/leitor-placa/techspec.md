# Tech Spec: Leitor de placa pela câmera

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
  - `src/lib/ocrPlaca.ts`: carga do OCR e extração da placa a partir do texto.
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
| `package.json` | Nova dependência `tesseract.js`; script que copia os arquivos do OCR para `public/ocr/` (ver abaixo). |

### Reconhecimento da placa (OCR no aparelho)
- **Biblioteca**: `tesseract.js` (7.x, última versão estável no npm; fixar versão exata como as demais dependências do projeto). Roda em Web Worker, em WebAssembly, sem serviço externo.
- **Arquivos auto-hospedados**: por padrão a biblioteca baixa worker, núcleo WASM e dados de idioma de CDNs de terceiros. Isso contraria o PRD (sem terceiros) e depende de rede externa. Os três são copiados para `public/ocr/` (worker de `tesseract.js`, núcleo de `tesseract.js-core`, dados do idioma `eng` de `@tesseract.js-data/eng`) e passados via `workerPath`, `corePath` e `langPath`. `public/ocr/` é gerado por script e entra no `.gitignore` (não versionar binários de terceiros).
- **Carga sob demanda**: `src/lib/ocrPlaca.ts` faz `import("tesseract.js")` somente quando o modal abre, no mesmo espírito do `import("jsqr")` do `useLeitorQr`. Nada disso entra no bundle inicial. O worker é criado uma vez por abertura do modal e encerrado (`terminate`) ao fechar.
- **Configuração do OCR**: idioma `eng`; `tessedit_char_whitelist` = `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`; modo de página de linha única (`PSM.SINGLE_LINE`).
- **Pré-processamento** (canvas, por quadro): recortar a região da moldura de enquadramento (não o vídeo inteiro), converter para escala de cinza e aumentar o contraste; ampliar para altura fixa (≈ 96 px) antes de enviar ao OCR.
- **Extração e validação** (`ocrPlaca.ts`):
  - `extrairPlaca(texto: string): string | null`: normaliza com `normalizePlaca` e procura uma janela de 7 caracteres que seja válida por `isValidPlaca`.
  - Correção de confusões típicas só nas posições em que o tipo é conhecido (3 primeiras = letras: `0→O`, `1→I`, `5→S`, `8→B`; posições 4, 6 e 7 = dígitos: `O→0`, `I→1`, `S→5`, `B→8`; a 5ª aceita letra ou dígito e define o padrão, como em `getPlacaTipo`). Só devolve resultado se, depois da correção, `isValidPlaca` for verdadeiro.
  - Texto que não vira placa válida é descartado e a leitura continua (RF-03).
- **Confiança por consenso**: a placa só vai para a conferência quando o mesmo valor válido é lido em **2 quadros consecutivos**. A conferência humana (RF-04) continua obrigatória; o consenso só reduz ruído.
- **Tempo esgotado**: sem placa válida em ~15 s a leitura para e vai ao estado "Não consegui ler" (RF-03).
- **Cadência**: um quadro por vez (flag `ocupado`, como no `useLeitorQr`), com intervalo mínimo de ~400 ms para não saturar a CPU em aparelhos fracos.

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
- Etapas: `leitura` (visor + moldura) e `conferencia` (`PlateDisplay size="md"` + `Input` editável normalizado por `normalizePlaca`, `maxLength={7}`; **Usar placa** só habilita com `isValidPlaca`).
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
- **OCR no aparelho (`tesseract.js`) em vez de serviço externo**: atende "sem custo e sem enviar imagem a terceiros" (PRD). Trade-off: precisão menor que a de serviços especializados em placa, mitigada por moldura, pré-processamento, whitelist, validação de formato e confirmação humana.
- **Arquivos do OCR auto-hospedados**: evita CDN de terceiros; o custo é peso no deploy (dezenas de MB em `public/ocr`, baixados só quando o modal abre) e um script de cópia.
- **Carga sob demanda**: o OCR só é baixado na primeira abertura do modal; o navegador faz cache HTTP desses arquivos. O service worker do PWA não guarda cache de dados, então não interfere. Mostrar "Preparando leitura…" enquanto o worker carrega.
- **Consenso de 2 quadros**: pequena latência a mais em troca de menos leituras erradas apresentadas ao operador.
- **Não generalizar `useLeitorQr`**: evita risco de regressão no leitor de QR; a duplicação mínima de abertura/parada da câmera é aceitável por ora.
- **`Input.endAction` e `PlateField.action` como slots genéricos**, e não props específicas de câmera: mantém o design system desacoplado desta feature.
- **Preencher o campo, não disparar ação**: confirmar só preenche a placa (RF-04); a consulta de placa da entrada e a busca da saída continuam sendo disparadas pelo fluxo normal.

## Riscos / pontos de atenção
- **Precisão do OCR** em placas sujas, refletidas, à noite ou muito inclinadas pode cair bastante. Validar com fotos reais antes de dar por concluída (a métrica do PRD ainda está `[A DEFINIR]`).
- **Desempenho em celulares antigos**: WASM + OCR contínuo pode esquentar ou travar; cadência limitada e tempo esgotado mitigam. Testar em um aparelho modesto.
- **Contexto seguro**: `getUserMedia` só funciona em HTTPS ou `localhost`; ambientes internos em HTTP não vão funcionar (mensagem específica já prevista).
- **iOS Safari**: `video.play()` exige `playsInline` e `muted`, como já feito no `LeitorQrSaida`; testar a permissão também no PWA instalado.
- **Peso e licença**: confirmar a licença (Apache-2.0) e o tamanho final de `public/ocr/`; o dado de idioma `eng` na variante "fast" basta e é menor que o "best".
- **CSP**: se uma CSP for adotada no futuro, o worker e o WASM exigirão `worker-src` e `wasm-unsafe-eval`. Hoje não há CSP em `next.config.ts`.
- **`proxy.ts`**: sem excluir `ocr` do `matcher`, requisições sem cookie de sessão seriam redirecionadas para `/login`. Excluir como foi feito para `icons`.
- **Ao implementar**: conferir a doc desta versão do Next em `node_modules/next/dist/docs/` (arquivos em `public/` e `matcher` do proxy) antes de mexer em `proxy.ts`, conforme `AGENTS.md`.

## Testes
- `ocrPlaca.test.ts`: extração e correção de confusões (placa antiga e Mercosul, ruído, texto sem placa).
- `LeitorPlacaModal.test.tsx` (mockando `getUserMedia` e o módulo de OCR): leitura → conferência → confirmar; editar na conferência; câmera negada; indisponível; tempo esgotado; parada dos tracks ao fechar.
- `CameraButton.test.tsx`: rótulo acessível e `disabled`.
- Ajustar os testes de `EntradaVeiculoModal` e `BuscaManualSaida`: botão presente; confirmar preenche o campo; desabilitado enquanto envia.
- `PlateField` e `Input`: sem a nova prop, a renderização atual é preservada.

## Fora de escopo técnico
- Extrair um `useCamera` compartilhado entre `useLeitorQr` e `useLeitorPlaca`.
- Guardar foto ou enviar imagem a qualquer servidor.
- Leitura contínua/automática sem ação do operador e reconhecimento de modelo ou cor.
- Botão de câmera em outros campos de placa (ex.: mensalistas).
- Treinar ou ajustar um modelo próprio de OCR.
