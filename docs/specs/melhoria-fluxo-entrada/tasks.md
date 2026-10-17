# Tasks: Melhoria do fluxo de entrada de veículos

Referências: ./prd.md, ./techspec.md, ./design.md

Antes de começar: confirmar com o back o formato de `cor` no `POST /Patio/entrada` (T1 e T9 dependem), o código de erro do comprovante para token inexistente e se o endpoint é público com CORS liberado (T4 e T11). Ver §12 do techspec.

- [x] T1 — Criar o enum de cor, o tipo do comprovante e o `token` da entrada
  - Arquivos: `src/types/veiculo.ts`, `src/lib/schemas/veiculo.ts`, `src/lib/schemas/veiculo.test.ts` (ou o teste do schema existente)
  - Pronto quando: `CORES_VEICULO`, `CorVeiculo`, `COR_PADRAO`, `matchCor(texto)` (caixa/acento, retorna `null` se desconhecida), `ComprovanteCliente` e `EntradaRegistrada.token` existem; `EntradaPayload.cor` é `CorVeiculo`; o schema aceita só as 8 cores e rejeita vazio/desconhecida; testes cobrem schema e `matchCor`; fixtures de teste que montam `EntradaRegistrada` ganham `token`; `npm run lint` passa.

- [x] T2 — Criar `getPlacaTipo` e o componente `PlateDisplay`
  - Arquivos: `src/lib/placa.ts`, `src/lib/placa.test.ts` (ou o existente), `src/components/ui/PlateDisplay/{PlateDisplay.tsx,PlateDisplay.styles.ts,PlateDisplay.test.tsx,index.ts}`
  - Pronto quando: `getPlacaTipo` devolve `antiga` (5º caractere dígito), `mercosul` (letra) ou `null` (<5 caracteres); `PlateDisplay` renderiza tamanhos `sm|md|lg`, variante Mercosul (faixa `primary` "BRASIL") e antiga (cinza, hífen após a 3ª letra), aceita `children` (modo `lg` com input dentro) e `bandLabel`; só tokens do tema além das cores físicas da placa; testes de variante e hífen; lint passa.

- [x] T3 — Criar o componente `ColorSwatchGroup`
  - Arquivos: `src/components/ui/ColorSwatchGroup/{ColorSwatchGroup.tsx,ColorSwatchGroup.styles.ts,ColorSwatchGroup.test.tsx,index.ts}`
  - Pronto quando: `fieldset`/`legend` com radios nativos; amostra com alvo de toque de 44px; nome da opção selecionada visível em texto (`aria-live="polite"`); anel de seleção e foco visível; props `disabled` e `error` (`role="alert"`); navegação por setas funciona; testes de seleção, `disabled` e erro; lint passa.

- [x] T4 — Adicionar o serviço `consultarComprovante` e o formatador de data/permanência
  - Nota: `parseDataHora` não foi criado; `formatDateTime` de `components/caixa/format.ts` já corta as casas decimais (ganhou `formatDate`/`formatTime`).
  - Arquivos: `src/lib/api/services/patio.ts`, `src/lib/api/services/patio.test.ts` (ou o existente), `src/components/veiculos/ComprovantePublico/format.ts`, `format.test.ts`
  - Pronto quando: `consultarComprovante(token)` chama `GET /Patio/comprovante/cliente` com `params: { token }`, converte `not_found` e `validation` em `ApiError("not_found", "Comprovante não encontrado.", 404)` e propaga os demais erros; `formatPermanencia(min)` devolve "0h 00min", "1h 05min", "26h 03min" e trata negativo/NaN como "0h 00min"; `parseDataHora` aceita ISO sem fuso com 4 e 7 casas decimais (corta a fração a 3 dígitos); testes cobrem 200, 404, 400, 500 e os formatos; lint passa.

- [x] T5 — Integrar cor (enum), placa e categoria no `EntradaVeiculoModal`
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx` (e `.styles.ts`), `src/components/form/` (`field.ColorField`, e `PlateField` só se o `TextField` não servir), `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.test.tsx`
  - Depende de: T1, T2, T3
  - Pronto quando: modal em `size="md"` no formulário; placa dentro do `PlateDisplay lg` mantendo `autoFocus`, normalização, `maxLength` e consulta ao sair do campo; cor via `ColorSwatchGroup` com Prata pré-selecionada e payload com o valor do enum; cadastro com cor desconhecida não altera a seleção (usa `matchCor`); categoria via `OptionGroup` com as 7 opções; `hasChanges` ignora a cor padrão; botão "Registrar entrada" desabilitado sem placa válida ou categoria; testes de integração conforme o techspec §8; lint passa.

- [x] T6 — Redesenhar o cupom e apontar o QR para o token
  - Arquivos: `src/components/veiculos/ReciboEntradaStep/ReciboEntradaStep.tsx`, `ReciboEntradaConteudo.tsx`, `ReciboEntradaStep.styles.ts`, testes do cupom
  - Depende de: T1, T2
  - Pronto quando: o link do QR é `${window.location.origin}/comprovante/${entrada.token}`; sem token o cupom sai sem QR e sem quebrar; layout do design (`PlateDisplay md`, sequencial em destaque, grade 2×2, picote, QR 180px, link curto, tarifa e operador no rodapé, telefone da empresa só se existir); impressão mostra só o cupom, preto sobre branco, com o picote simplificado; testes do link e do caso sem token; lint passa.

- [x] T7 — Criar a rota pública, o layout e liberar no proxy
  - Arquivos: `src/proxy.ts`, `src/app/comprovante/layout.tsx`, `src/app/comprovante/[token]/page.tsx`
  - Depende de: T8 (para renderizar o conteúdo; pode começar com um placeholder)
  - Pronto quando: `"/comprovante"` está em `PUBLIC_PATHS` e abrir `/comprovante/<token>` sem sessão não redireciona para `/login`; o layout usa `SignageThemeProvider` e as fontes Barlow, sem `AppShell`; `page.tsx` é Server Component, lê `params` assíncrono (conferido em `node_modules/next/dist/docs`), valida o token (`/^[A-Za-z0-9]{4,32}$/`) e, se inválido, mostra "não encontrado" sem chamar a API; metadata com título "Comprovante de entrada — GIPE" e `robots: { index: false, follow: false }`; lint passa.

- [x] T8 — Criar o componente `ComprovantePublico` com os estados
  - Arquivos: `src/components/veiculos/ComprovantePublico/{ComprovantePublico.tsx,ComprovantePublico.styles.ts,ComprovantePublico.test.tsx,index.ts}`
  - Depende de: T2, T4
  - Pronto quando: `useQuery(["comprovante", token])` com `refetchOnWindowFocus: false`; estado de carregando (`Skeleton`, `role="status"`, `aria-busy`); sucesso com cabeçalho (razão social, endereço, telefone), "Veículo no pátio", ticket, tempo de permanência em destaque, "Valor até agora" em BRL, grade (placa, entrada, veículo, categoria) e rodapé com o horário da consulta; botão "Ligar" (`tel:`) oculto sem telefone; campos nulos nunca aparecem como `null`; "não encontrado" sem dados; erro com "Tentar novamente" que refaz a chamada (`role="alert"`); sem CNPJ na tela; mobile primeiro, sem scroll horizontal; testes de cada estado; lint passa.

- [x] T9 — Revisar a ligação entre as peças e corrigir fixtures e specs antigas
  - Arquivos: testes/mocks que usam `EntradaRegistrada` ou `cor` livre, `docs/specs/qrcode-entrada/techspec.md` (nota de obsoleto no link por patioId+placa)
  - Depende de: T5, T6, T8
  - Pronto quando: nenhum teste ou mock usa `cor` como texto livre no payload de entrada; a spec `qrcode-entrada` indica que o link passou a ser por token (sem reescrever o histórico); `npm test` passa.

- [x] T10 — Verificação final (lint, build, testes e roteiro manual)
  - Arquivos: nenhum (execução)
  - Depende de: T1 a T9
  - Pronto quando: `npm run lint`, `npm test` e `npm run build` passam; roteiro manual do techspec §8 executado: registrar entrada, ler o QR em um celular (ou abrir o link em janela anônima) e ver o comprovante sem login; token inexistente mostra "não encontrado"; impressão do cupom em tema escuro sai preta sobre branca.

## Notas da execução
- `Modal` ganhou o tamanho `md` (600px); `FontScope` foi movido de `src/app/(app)` para `src/components/layout` para ser reaproveitado pela rota pública.
- Criados também `PlateField`, `ColorField` e `OptionField` em `src/components/form` (ligam os componentes de UI ao TanStack Form).
- Pendências de verificação com o back-end (não bloqueiam o código): formato de `cor` no `POST /Patio/entrada`, código de erro para token inexistente, e CORS/autenticação do `GET /Patio/comprovante/cliente`.
- Verificado com `next start` sem cookie: `/comprovante/<token>` responde 200 (sem redirecionar) e `/dashboard` redireciona para `/login`.
