# Tasks: Enviar link do ticket ao cliente

Referências: ./prd.md, ./techspec.md

- [x] T1 — Extrair o helper `linkDoTicket(token)` e usá-lo nos dois lugares que montam o link hoje
  - Arquivos: `src/components/patio/ticketLink.ts` (novo), `src/components/patio/ticketLink.test.ts` (novo), `src/components/patio/ComprovanteDigital/ComprovanteDigital.tsx`, `src/components/veiculos/ReciboEntradaStep/ReciboEntradaStep.tsx`
  - Pronto quando: o helper devolve `${origin}/comprovante/<token codificado>` com teste (token com caracteres especiais); os dois componentes usam o helper sem mudar o link gerado; testes existentes dos dois continuam passando.

- [x] T2 — Criar as funções puras de envio (mensagem, assunto, href, validação de contato)
  - Arquivos: `src/components/patio/envioTicket.ts` (novo), `src/components/patio/envioTicket.test.ts` (novo)
  - Pronto quando: `mensagemDoTicket`, `assuntoDoEmail`, `hrefDoEnvio` e `validarContato` existem e têm teste cobrindo: `wa.me/55<dígitos>` sem máscara e com texto codificado; `mailto:` com assunto e corpo codificados; mensagem sem nome do estacionamento; WhatsApp com 9/10/11/12 dígitos; e-mail válido e inválido, com espaços nas pontas.

- [x] T3 — Criar o `EnviarTicketModal` (canal, campo com máscara, validação, prévia, rodapé)
  - Arquivos: `src/components/patio/EnviarTicketModal/EnviarTicketModal.tsx`, `EnviarTicketModal.styles.ts`, `index.ts` (novos)
  - Pronto quando: popup abre com WhatsApp selecionado e foco no campo; trocar o canal limpa contato e erro e devolve o foco; WhatsApp aplica `formatPhone`; erro só aparece após tocar/tentar enviar; botão principal ("Abrir WhatsApp"/"Abrir e-mail") desabilitado com contato inválido; prévia mostra a mensagem com a placa e o link; Cancelar/×/Esc fecham sem enviar; visual só com tokens do tema, rodapé empilhado abaixo de `sm`.

- [x] T4 — Ligar o envio no popup: abrir o aplicativo e avisar o pai
  - Arquivos: `src/components/patio/EnviarTicketModal/EnviarTicketModal.tsx`
  - Pronto quando: confirmar chama `window.open(href, "_blank", "noopener,noreferrer")` (WhatsApp) ou define `window.location.href` (e-mail) de forma síncrona no clique, depois `onEnviado(canal)` e `onClose()`; sem `token`, o popup não abre e mostra `ErrorBanner` "Não foi possível gerar o link do ticket." com só "Fechar"; contato não é salvo em nenhum storage nem cache.

- [x] T5 — Testar o `EnviarTicketModal`
  - Arquivos: `src/components/patio/EnviarTicketModal/EnviarTicketModal.test.tsx` (novo)
  - Pronto quando: testes cobrem estado inicial, máscara, validação (WhatsApp e e-mail), troca de canal, href aberto para cada canal (mock de `window.open` / `location`), `onEnviado`/`onClose`, cancelar sem efeito e caso sem token; `npm test` do arquivo passa.

- [x] T6 — Adicionar "Enviar ao cliente" ao comprovante de entrada
  - Arquivos: `src/components/veiculos/ReciboEntradaStep/ReciboEntradaStep.tsx`, `src/components/veiculos/ReciboEntradaStep/ReciboEntradaStep.test.tsx` (ou o teste existente do conteúdo/entrada)
  - Pronto quando: botão secundário aparece entre "Concluir" e "Imprimir" só quando há link, fora de `#recibo-print-root` (não sai na impressão); abre o popup com a placa e o nome fantasia da empresa (quando houver); após enviar, mostra `Toast` "Mensagem aberta no WhatsApp/aplicativo de e-mail. Confirme o envio por lá."; teste cobre botão presente com token e ausente sem token.

- [x] T7 — Adicionar "Enviar ao cliente" ao detalhe do ticket do Pátio
  - Arquivos: `src/components/patio/TicketView/TicketView.tsx`, `TicketView.styles.ts`, `TicketView.test.tsx`
  - Pronto quando: botão secundário (48px) ao lado de "Mostrar QR do ticket ao cliente"; sem token fica desabilitado com `aria-describedby` apontando para o texto "Link do ticket indisponível."; abre o popup e o sucesso usa o `Toast` de `aviso` existente; saída continua sendo o único botão primário; teste cobre abrir o popup, enviar e o caso sem token.

- [x] T8 — Verificação final
  - Arquivos: —
  - Pronto quando: `npm run lint` e a suíte de testes passam; `npm run build` passa; conferência manual em 320px de que os três botões do comprovante cabem e "Concluir" continua por último; checados os critérios de aceite do PRD.
