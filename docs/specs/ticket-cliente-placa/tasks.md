# Tasks: Ticket do Cliente por Placa e Cartaz do Ticket

Referências: ./prd.md, ./techspec.md, ./design.md

Cada task inclui os testes do que ela cria (Vitest + Testing Library, como no resto do projeto). Ordem por dependência: a consulta pública (T1 a T4) e o cartaz (T5 a T7) são independentes entre si.

## Consulta pública por placa

- [x] T1 — Contrato e serviço da consulta por placa
  - Arquivos: `src/types/patio.ts` (tipo `ComprovantePorPlaca`), `src/lib/api/services/patio.ts` (`consultarComprovantePorPlaca`), `src/lib/api/services/patio.test.ts`
  - Pronto quando: `consultarComprovantePorPlaca(empresaGuid, placa)` faz `GET /Patio/comprovante/cliente/placa` com `params { empresa, placa }`; 404 e 400 viram `ApiError("not_found", "Ticket não encontrado.", 404)`; outros erros sobem sem mudança; testes cobrem sucesso, 404, 400 e erro de rede.

- [x] T2 — Página de consulta (`ConsultaTicketPublica`)
  - Arquivos: `src/components/veiculos/ConsultaTicketPublica/ConsultaTicketPublica.tsx`, `ConsultaTicketPublica.styles.ts`, `LinkInvalido.tsx`, `index.ts`, `ConsultaTicketPublica.test.tsx`
  - Depende de: T1
  - Pronto quando: cabeçalho, `PlateDisplay` `lg` com `PlateInput` nativo (sem `PlateField` e sem teclado customizado), botão Buscar e rodapé conforme `design.md`; placa normalizada e validada com `isValidPlaca` ao tocar em Buscar (inválida: mensagem, `aria-invalid`, foco no campo, nenhuma chamada); buscando: botão "Buscando..." desabilitado e `role="status"`; sucesso: `router.push("/comprovante/{token}")` com o token codificado; 404: "Ticket não encontrado" no cartão (`role="alert"`) com a placa mantida; outro erro: "Não foi possível consultar" e botão "Tentar novamente"; `LinkInvalido` exportado. Testes cobrem cada um desses estados, a normalização (`qqq-5z8` vira `QQQ5Z8`) e resposta sem `token`.

- [x] T3 — Rota pública `/ticket/[empresaGuid]` e proxy
  - Arquivos: `src/app/ticket/[empresaGuid]/page.tsx`, `src/app/ticket/[empresaGuid]/page.test.tsx`, `src/proxy.ts`, `src/proxy.test.ts`
  - Depende de: T2
  - Pronto quando: `/ticket/<guid>` abre sem sessão (sem redirecionar ao login); `"/ticket"` em `PUBLIC_PATHS` com o comentário atualizado; `metadata` com título "Consultar ticket — Murel" e `robots: { index: false, follow: false }`; `empresaGuid` fora do formato de GUID renderiza `LinkInvalido` sem formulário; GUID válido renderiza `ConsultaTicketPublica` com o guid; as demais rotas continuam protegidas. Testes: proxy (`/ticket/<guid>` sem sessão passa; `/dashboard` sem sessão vai ao login) e página (guid válido, inválido e metadados).

## Cartaz do ticket

- [x] T4 — `empresaGuid` na leitura da empresa
  - Arquivos: `src/types/empresa.ts`, `src/lib/api/services/empresa.mapper.ts`, `src/lib/api/services/empresa.test.ts` (e o teste do mapper, se existir)
  - Pronto quando: `EmpresaDto` aceita `empresaGuid`; `fromEmpresaResponse` o devolve aparado em `EmpresaFormValues.empresaGuid`, com ausente/vazio como `null`; `toEmpresaPayload` **não** envia o campo; testes de leitura (presente, ausente, vazio) e de que o PUT não o inclui; o restante da tela da empresa continua passando.

- [x] T5 — Cartaz A4 (`CartazTicket`)
  - Arquivos: `src/components/empresa/CartazTicket/CartazTicket.tsx`, `CartazTicket.styles.ts`, `index.ts`, `CartazTicket.test.tsx`
  - Pronto quando: o layout da referência (cabeçalho com `Logo` e selo "TICKET DIGITAL", título com marcador amarelo, três passos com miniplaca `MUR3L26`, cartão do QR, faixa "Sem baixar app · Sem cadastro · Sem papel", rodapé e faixa amarela) renderiza dentro de `ThemeProvider` com `lightTheme`; o `QrCode` recebe o `link` com `aria-label` "QR code para consultar o ticket" e no mínimo 5 cm de lado; não existe o texto "Cole aqui o QR Code"; estilos só por tokens do tema; o CSS global de impressão (`#cartaz-print-root` oculto na tela, único visível ao imprimir, `@page { size: A4 portrait; margin: 0 }`, `print-color-adjust: exact`) **não** usa o `PrintStyles` do recibo. Testes: renderiza o QR com o link, passos e textos principais, e sem o texto do espaço reservado.

- [x] T6 — Botão "Gerar Cartaz do Ticket" e impressão
  - Arquivos: `src/components/empresa/CartazTicket/GerarCartazButton.tsx`, `GerarCartazButton.test.tsx`, `src/components/empresa/MinhaEmpresa/queryKeys.ts` (mover `EMPRESA_QUERY_KEY`, reexportado em `EmpresaForm`), `index.ts`
  - Depende de: T4, T5
  - Pronto quando: ao clicar, busca o `empresaGuid` com `queryClient.fetchQuery` (`staleTime` de 5 min, só no clique); sem guid ou com erro mostra `Toast` de erro "Não foi possível gerar o cartaz agora. Tente novamente em instantes." e não imprime; com guid monta `${window.location.origin}/ticket/${encodeURIComponent(guid)}`, mostra o cartaz em portal `#cartaz-print-root` e chama `window.print()` depois do QR desenhado; remove o portal em `afterprint` (com limite de tempo de segurança); botão desabilitado durante o processo (sem duplo clique); variante secundária com ícone de impressora e rótulo exato. Testes com `window.print` simulado: sucesso (link correto no QR, impressão chamada, portal removido), guid ausente, erro da API e duplo clique.

- [x] T7 — Botão na Home e na tela da empresa
  - Arquivos: `src/app/(app)/dashboard/page.tsx`, `src/components/empresa/MinhaEmpresa/EmpresaForm.tsx`, e os testes dessas telas
  - Depende de: T6
  - Pronto quando: o botão aparece na `ActionRow` do dashboard, depois de Entrada e Saída, e no `HeaderRow` da tela da empresa, junto de "Adicionar empresa" (agrupados se o cabeçalho precisar); sem permissão própria nesta entrega; os layouts existentes não quebram em celular nem em desktop; testes de que o botão está presente nas duas telas.

## Fechamento

- [ ] T8 — Validação final
  - Andamento: lint (0 erros), `tsc`, build (lista `/ticket/[empresaGuid]`) e testes das áreas tocadas passam; consulta conferida no navegador (celular). **Falta:** impressão do cartaz em A4 num navegador real, conferir a consulta com o back de verdade (200 e 404) e as pendências com o back.
  - Arquivos: este `tasks.md` e `techspec.md` (registrar desvios)
  - Depende de: T1 a T7
  - Pronto quando: `npm run lint` sem erros e `npm run build` passam e listam `/ticket/[empresaGuid]`; testes das áreas tocadas passam; todos os critérios de aceite do `prd.md` conferidos; conferência manual no navegador: consulta no celular (placa encontrada leva ao comprovante, 404, erro de rede, link inválido) e impressão do cartaz em A4 com cores preservadas e QR que abre a consulta da empresa certa; pendências com o back registradas (nome e presença de `empresaGuid` em `GET /Empresa`, caminho da consulta por placa, regra dos 8 minutos do 404, limite de tentativas).

## Cobertura dos requisitos do PRD

| Requisito | Tasks |
|-----------|-------|
| RF-01 Tela pública de consulta | 2, 3 |
| RF-02 Digitar a placa e buscar | 1, 2 |
| RF-03 Abrir o comprovante | 1, 2 |
| RF-04 Veículo não encontrado | 1, 2 |
| RF-05 Botão "Gerar Cartaz do Ticket" | 4, 6, 7 |
| RF-06 Conteúdo do cartaz | 5, 6 |
