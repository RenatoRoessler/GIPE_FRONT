# Tasks: Carimbo de Convênio

Referências: ./prd.md, ./techspec.md, ./design.md

- [x] T1 — Criar o tipo da resposta do carimbo
  - Arquivos: `src/types/carimbo.ts`
  - Pronto quando: `Carimbo` exportado com os campos da resposta de `PUT /Convenio/carimbar` (estacionamento, placa, modelo, cor, categoria, dataHoraEntrada, rotatividadeId, rotatividade, dataHoraConveniada); `tsc` sem erros

- [x] T2 — Criar o mapper da resposta
  - Arquivos: `src/lib/api/services/carimbo.mapper.ts`, `src/lib/api/services/carimbo.mapper.test.ts`
  - Pronto quando: `fromCarimboResponse` converte a resposta completa e tolera campos ausentes ou resposta que não é objeto (textos `""`, números `0`); testes passando

- [x] T3 — Criar o serviço da API
  - Arquivos: `src/lib/api/services/carimbo.ts`, `src/lib/api/services/carimbo.test.ts`
  - Pronto quando: `carimbarTicket(token)` faz `PUT /Convenio/carimbar` com `{ token }` e devolve o `Carimbo` mapeado; `ApiError` do client é propagado sem alteração; testes com o client mockado passando

- [x] T4 — Registrar a área, a permissão e a rota do carimbo
  - Arquivos: `src/lib/permissoes.ts`, `src/lib/permissoes.test.ts`
  - Pronto quando: `AREA.Carimbo = "carimbo"` com padrão `[AdministradorConveniada, GerenteConveniada, UsuarioConveniada]` e rota `/carimbo` (e `/carimbo/...`); os 8 perfis conferidos no teste (Administrador, Gerente, Caixa, Manobrista e Financeiro não acessam); `tsc` sem erros de `Record<Area, ...>`

- [x] T5 — Adicionar o ícone e o item de menu "Carimbar ticket"
  - Arquivos: `src/components/layout/NavIcons/NavIcons.tsx`, `src/lib/nav.ts`, `src/lib/nav.test.ts`, `src/components/layout/SideNav/SideNav.test.tsx`, `src/components/layout/BottomNav/BottomNav.test.tsx`, `src/components/layout/BottomNav/BottomBar.test.tsx`
  - Pronto quando: `NavIconId` ganha `"stamp"` com ícone próprio em traço de 2,4; item `{ label: "Carimbar ticket", shortLabel: "Carimbo", href: "/carimbo", icon: "stamp", area: AREA.Carimbo }` presente; só os perfis de conveniada veem o item; ícone único por item e rótulo curto de até 11 caracteres; testes de nav e layout ajustados e passando

- [x] T6 — Abrir `/carimbo` como tela inicial dos perfis de conveniada
  - Arquivos: `src/lib/telaInicial.ts`, `src/lib/telaInicial.test.ts`
  - Pronto quando: os perfis 5, 6 e 7 recebem `/carimbo` em qualquer largura; as regras atuais (Pátio no celular, Dashboard nas telas grandes e para quem não acessa o Pátio) seguem iguais para os demais; o tipo de retorno inclui `"/carimbo"`; testes passando e `LoginForm`/`RedirecionarInicio` sem erro de tipo

- [x] T7 — Criar os formatadores do resultado
  - Arquivos: `src/components/carimbo/format.ts`, `src/components/carimbo/format.test.ts`
  - Pronto quando: categoria vira o nome ("Carro pequeno") via `getCategoriaVeiculoLabel`; cor vira o rótulo de `CORES_VEICULO` com o texto original como fallback; entrada e carimbo saem em data e hora locais; valores ausentes viram "—"; testes passando

- [x] T8 — Criar o hook do carimbo
  - Arquivos: `src/components/carimbo/useCarimbar.ts`, `src/components/carimbo/useCarimbar.test.tsx`
  - Pronto quando: `useCarimbar` usa `useMutation` sem retry com `carimbarTicket`; o mesmo token que falhou é ignorado por 5 s e um token diferente é aceito na hora; `reset` volta ao estado inicial; nova tentativa reenvia o token guardado sem nova leitura; testes passando

- [x] T9 — Criar o ticket carimbado (resultado)
  - Arquivos: `src/components/carimbo/TicketCarimbado/TicketCarimbado.tsx`, `TicketCarimbado.styles.ts`, `index.ts`, `TicketCarimbado.test.tsx`
  - Pronto quando: mostra o título "Ticket carimbado" com ícone e foco, a placa com `PlateDisplay`, modelo e cor, estacionamento, categoria, entrada, tabela aplicada e hora do carimbo, o selo `StatusBadge tone="conveniado"` e o botão "Carimbar outro ticket"; `role="status"`; entrada animada desligada em `prefers-reduced-motion`; só tokens do tema; testes passando

- [x] T10 — Criar a página do carimbo e a rota
  - Arquivos: `src/components/carimbo/CarimboPage/CarimboPage.tsx`, `index.ts`, `src/components/carimbo/Carimbo.styles.ts`, `src/app/(app)/carimbo/page.tsx`, `src/components/carimbo/CarimboPage/CarimboPage.test.tsx`
  - Pronto quando: usa `LeitorQrSaida` com `onToken`, `onInvalido` e `buscando` ligado à mutation; sucesso troca o leitor pelo `TicketCarimbado` e "Carimbar outro ticket" volta ao leitor devolvendo o foco ao visor; erro de negócio mostra `ErrorBanner role="alert"` com a mensagem do back e mantém o leitor ativo; 403 mostra `ErroSemPermissao` ("Você não tem permissão para carimbar tickets.") sem tentar de novo; falha de conexão oferece "Tentar novamente" reenviando o mesmo token; leitura repetida durante o envio gera uma só chamada; rota com `metadata`; testes com o leitor mockado passando

- [x] T11 — Validação final da feature
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` sem erros; testes da feature, de `lib` e de `layout` passando; critérios de aceite do `prd.md` conferidos, registrando RF3 (carimbo direto, sem confirmação) como decisão assumida e os erros de RF10 como dependentes da mensagem do back (sem código estável)
