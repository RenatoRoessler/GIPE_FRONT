# Tasks: QR Code do comprovante de entrada

Referências: ./prd.md, ./techspec.md, ./design.md

Antes de começar: alinhar com o back o endpoint público (T3 depende disso) e qual campo é o "número do ticket" exibido (`sequencial` ou `codigoTicket`).

- [x] T1 — Extrair os estilos do recibo de saída para um módulo compartilhado
  - Arquivos: `src/components/veiculos/Recibo.styles.ts` (novo), `src/components/veiculos/ReciboSaidaStep/ReciboSaidaStep.styles.ts`, `ReciboSaidaStep.tsx`, `ReciboConteudo.tsx`
  - Pronto quando: `Receipt`, `ReceiptHeader`, `Divider`, `Rows`, `ReceiptPlaca`, `Actions`, `Success` e `PrintStyles` vivem em `Recibo.styles.ts` e a saída os importa de lá; o recibo de saída fica visualmente idêntico e `npm run lint` passa.

- [x] T2 — Criar o componente `QrCode` no design system
  - Arquivos: `package.json` / lockfile (instalar `qrcode.react` com versão fixa), `src/components/ui/QrCode/QrCode.tsx`, `src/components/ui/QrCode/index.ts`
  - Pronto quando: `<QrCode value label size? />` renderiza SVG com `role="img"` e `aria-label`, nível de correção M, margem de silêncio de 4 módulos, módulos em `colors.text` e fundo branco fixo; sem valores visuais soltos além do branco do QR; `npm run lint` passa.

- [x] T3 — Adicionar tipo e serviço da consulta pública da entrada
  - Arquivos: `src/types/veiculo.ts` (tipo `EntradaPublica`), `src/lib/api/services/patio.ts` (`consultarEntradaPublica`)
  - Pronto quando: a função chama o endpoint público confirmado com o back, converte 404 em `ApiError("not_found", ...)` e retorna `EntradaPublica`; tipo sem IDs internos nem operador; `npm run lint` passa.

- [x] T4 — Criar o comprovante de entrada (conteúdo)
  - Arquivos: `src/components/veiculos/ReciboEntradaStep/ReciboEntradaConteudo.tsx`, `index.ts`
  - Pronto quando: renderiza empresa (opcional), placa, veículo (modelo · cor, omitindo se vazio), categoria, sequencial, data/hora de entrada, tabela (opcional), `QrCode` com o link `${origin}/comprovante/${patioId}/${placa}` e a legenda "Escaneie para ver os dados da entrada", usando os estilos de T1.

- [x] T5 — Criar a etapa de comprovante (empresa, impressão, ações)
  - Arquivos: `src/components/veiculos/ReciboEntradaStep/ReciboEntradaStep.tsx`
  - Pronto quando: recebe `EntradaRegistrada`, busca a empresa com `EMPRESA_QUERY_KEY`/`getEmpresa` (falha não bloqueia), mostra a faixa "Entrada registrada", o comprovante e os botões Concluir e Imprimir; Imprimir usa `window.print()` com o portal `#recibo-print-root` e só o comprovante sai impresso.

- [x] T6 — Integrar a etapa de comprovante ao `EntradaVeiculoModal`
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx`, `src/components/veiculos/RegistrarEntradaButton/RegistrarEntradaButton.tsx` (se necessário)
  - Pronto quando: ao registrar com sucesso o modal troca o formulário pelo comprovante e não fecha sozinho; Concluir, X e Esc fecham direto (sem "Descartar entrada?") e disparam o toast "Entrada registrada."; erro de registro continua no `ErrorBanner` do formulário; a confirmação de descarte só vale na etapa do formulário.

- [x] T7 — Liberar a rota pública no proxy
  - Arquivos: `src/proxy.ts`
  - Pronto quando: `/comprovante` está em `PUBLIC_PATHS` e abrir `/comprovante/1/ABC1234` sem sessão não redireciona para `/login`.

- [x] T8 — Criar o conteúdo da página pública (`EntradaPublica`)
  - Arquivos: `src/components/veiculos/EntradaPublica/EntradaPublica.tsx`, `index.ts`
  - Pronto quando: usa `useQuery` com `consultarEntradaPublica`, sem retry em `not_found`, e cobre os estados: loading (`Skeleton`), sucesso (RF4, sem dados do RF5), "Entrada não encontrada", erro com "Tentar novamente"; linhas opcionais ausentes são omitidas.

- [x] T9 — Criar a rota pública `/comprovante/[patioId]/[placa]`
  - Arquivos: `src/app/comprovante/[patioId]/[placa]/page.tsx` (e layout/provider se faltar `QueryClientProvider`)
  - Pronto quando: consultada a doc de `page.md` do Next 16 sobre `params` assíncrono; `patioId` inválido (não inteiro positivo) ou placa inválida mostram "não encontrada" sem chamar o back; metadata com título "Comprovante de entrada — GIPE" e `robots: noindex`; layout mobile (320px) sem rolagem horizontal, com `PageBackground`/`Card`/`Logo`.

- [ ] T10 — Validação final
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam; fluxo testado no navegador: registrar entrada → comprovante com QR → imprimir → abrir o link do QR sem sessão e ver os dados; link inválido mostra "não encontrada"; recibo de saída continua igual.
