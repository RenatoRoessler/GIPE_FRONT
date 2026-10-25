# Task 08: Nome Murel nos textos, metadados e QR

**Status:** ✅ Concluída  
**Dependências:** Task 02

## Objetivo

> Trocar o nome GIPE por Murel em tudo que o usuário vê, sem renomear identificadores persistidos (RF-01).

## Contexto Técnico

**Arquivos a editar:**
- Todos os `metadata.title` em `src/app/**/page.tsx` ("… — Murel"), incluindo `acesso-negado`, `atualizacoes`, `caixa/historico`, `mensalistas`, `minha-empresa/nova`, `notas-fiscais`, `usuarios`, `adesao`, `alterar-senha`, `comprovante/[token]`, `contrato`, `login`, `primeiro-acesso`, `recibo/[token]`, `recuperar-senha`.
- `src/app/layout.tsx` — `title`, `description`, `applicationName`, `appleWebApp.title` (design.md seção 7).
- `src/components/layout/InstallPwaButton/InstallPwaButton.tsx` — textos de instalação (design.md seção 10).
- `src/components/auth/ResetPasswordForm/ResetPasswordForm.tsx` e demais textos visíveis.
- `src/components/home/Hero/Hero.tsx` — texto de apresentação novo.
- Páginas de login e adesão — "Seu pátio sob controle."
- `src/lib/qr.ts` — aceitar `^(GIPE|MUREL)-SAIDA:`; `LeitorQrSaida` e hooks: mensagem "QR Code não é um ticket Murel."; comentários de exemplo com domínio.
- Comentários e testes que mencionam o nome (`SaidaVeiculoModal.test.tsx`, `qr.test.ts`, `recibo/[token]/page.test.tsx`, `LeitorQrSaida.test.tsx`, `useLeitorQr.test.tsx`, `QrRecibo.test.tsx`, `reciboPdf.test.ts`).

**Não alterar:** cookie `gipe_token`, IndexedDB `gipe`, chave `gipe_remembered_login`, `package.json` `name`, `src/generated/changelog.json`.

## Critérios de Aceite

- [x] Nenhuma ocorrência visível de "GIPE" ou "Gestão Inteligente para Estacionamentos" na interface. (travado por `src/styles/marca.test.ts`, criado na Task 09)
- [x] Títulos de aba terminam em "— Murel".
- [x] QR com prefixo `GIPE-SAIDA:` e `MUREL-SAIDA:` continuam sendo lidos.
- [x] Usuários logados continuam logados e login lembrado continua funcionando.
- [x] Textos novos seguem o tom de voz do guia (sem jargão, sem emoji em mensagem de sistema).

## Testes

- [x] `qr.test.ts`: ambos os prefixos aceitos; mensagem de QR inválido nova.
- [x] Testes de metadata/título atualizados (`Recibo de saída — Murel` etc.).
- [x] Teste de login lembrado e de leitura do cookie sem regressão.
- [x] Busca `grep -rniI "gipe" src public` sem `generated/` só retorna identificadores mantidos e comentários explicando a manutenção. (fechado na Task 09, junto com `manifest.ts`, `offline.html` e `sw.js`)

## Notas de Implementação

> Techspec seções 4 e 6. Arquivos de recibo e comprovante (Task 10) e manifest (Task 09) tratam seus próprios textos.

## Registro da execução

- Todos os `metadata.title` de `src/app` terminam em "— Murel". O layout raiz ficou com título "Murel — Seu pátio sob controle", descrição "Controle de entrada, saída e caixa de estacionamentos, valets e lava-rápidos.", `applicationName` e título do iOS "Murel". O manifest, o `viewport.themeColor`, `public/offline.html` e `public/sw.js` ficam para a Task 09.
- Textos de interface trocados: `ResetPasswordForm`, `InstallPwaButton` (os dois textos), `Hero` (que não é usado em nenhuma rota; recebeu o texto de apresentação do guia), a mensagem "QR Code não é um ticket Murel" (sem ponto final, como as demais mensagens) e os comentários que citavam o nome antigo.
- "Seu pátio sob controle." virou o componente `ui/Tagline`, usado no login (via `AuthCard tagline`) e no assistente de adesão. Isso tirou o `Tagline` que eu tinha posto dentro do `AuthCard.styles.ts` na Task 02.
- QR: `PREFIXO_SAIDA` aceita `MUREL-SAIDA:` e `GIPE-SAIDA:` (sem diferenciar maiúsculas). Tickets antigos continuam valendo. Novos casos em `qr.test.ts`.
- Mantidos de propósito: cookie `gipe_token`, IndexedDB `gipe`, chave `gipe_remembered_login`, chave antiga de tema (lida uma vez), `package.json` e `src/generated/changelog.json`. Os domínios `gipe.com.br` e `gipe.exemplo.com` usados nos testes e em exemplos de URL não foram trocados: são o endereço do backend, e não sei qual será o novo domínio.
- Busca por "gipe" em `src` e `public`, fora de testes, `generated` e dos identificadores acima, só retorna o prefixo de QR antigo (de propósito) e os arquivos da Task 09 (`manifest.ts`, `offline.html`, `sw.js`).
- Verificado: `tsc` e ESLint sem erros; 1110 testes de `lib`, `app`, `veiculos`, `ui`, `auth`, `adesao` e `layout` passam. Não rodei a suíte completa nem o build depois desta task.
- Não conferido em navegador: como o título da aba e a frase aparecem na tela.
