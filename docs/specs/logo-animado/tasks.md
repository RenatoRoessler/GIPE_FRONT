# Tasks: Logo animado do Murel

Referências: ./prd.md, ./design.md, ./techspec.md, ./prototipo.html

- [x] T1 — Trajeto do carro como função pura: geometria (vaga 120/95, rua 190, raio 60), fases e durações de `design.md` §2, easings do protótipo, `poseNoTempo(t, trilho)`, `terminou(t)`, `DURACAO_TOTAL` e `POSE_REPOUSO`.
  - Arquivos: `src/components/ui/Logo/carroTrajeto.ts`, `src/components/ui/Logo/carroTrajeto.test.ts`
  - Pronto quando: os casos de `techspec.md` §7 (`carroTrajeto.test.ts`) passam: repouso no início e no fim, carro invisível no "vazio", na rua deitado durante a saída, freio e ré nas fases certas, total ≈ 24,1 s, trilho mais largo desloca a entrada para a direita.

- [x] T2 — Luzes no símbolo: remover os keyframes `estaciona`; nova prop interna `carro?: CarroRefs` que liga o ref do grupo do carro e desenha facho, freio e ré (ids por `useId`, opacidade 0 no início, `aria-hidden`), com a versão simplificada abaixo de 40 px. Constantes `LUZ_FAROL`, `LUZ_FREIO`, `LUZ_RE`. Sem `carro`, o SVG fica idêntico ao de hoje.
  - Arquivos: `src/components/ui/Logo/MurelSymbol.tsx`
  - Pronto quando: sem `carro` não há elementos de luz e os testes atuais de `Logo.test.tsx` passam; com `carro` os refs apontam para os elementos e as luzes começam apagadas.

- [x] T3 — Hook `useAnimacaoDoCarro`: inicia só com `ativo`, `matchMedia` disponível e sem movimento reduzido; laço com `requestAnimationFrame` escrevendo atributos por ref (sem `setState` por quadro); tempo acumulado com delta limitado a 50 ms; trilho medido com `ResizeObserver`; `parar()` com o fade de 150 + 150 ms, devolvendo `true` só se estava animando; para se o movimento reduzido for ligado no meio; limpeza completa ao desmontar.
  - Arquivos: `src/components/ui/Logo/useAnimacaoDoCarro.ts`
  - Pronto quando: tipa sem erros e é coberto pelos testes da T4 (agenda quadros, não agenda com `reduce`, `parar()` devolve `true`/`false`, não recomeça).

- [x] T4 — `Logo` com a animação: props `ref` (`LogoHandle` com `parar()`) e `pararAoInteragir` (padrão `true`, com `pointerenter` de mouse e `pointerdown`); liga o hook com `animated` e `tone !== "onYellow"`; `LogoWrapper` com `$animado` (overflow hidden, padding e margem negativa de 70/160 da altura, símbolo por cima da palavra) e regra de impressão (`transform: none`, luzes ocultas). Atualizar o comentário da prop `animated`.
  - Arquivos: `src/components/ui/Logo/Logo.tsx`, `src/components/ui/Logo/Logo.styles.ts`, `src/components/ui/Logo/index.ts`, `src/components/ui/Logo/Logo.test.tsx`
  - Pronto quando: os testes de `techspec.md` §7 (`Logo.test.tsx`) passam; a caixa do logo tem o mesmo tamanho com e sem `animated`; `onYellow` e logos sem `animated` não animam.

- [x] T5 — Cabeçalho: `Logo` com `animated`, `ref` e `pararAoInteragir={false}`; no `BrandLink`, hover de mouse e foco param, e o clique durante a animação só para (cancela a navegação), em repouso navega.
  - Arquivos: `src/components/layout/Header/Header.tsx`, `src/components/layout/Header/Header.test.tsx` (novo)
  - Pronto quando: os testes do Header passam: clique durante a animação não navega e para, o seguinte navega, foco para a animação; o link continua nomeado "Murel — ir para o início".

- [x] T6 — Ligar a animação nos demais pontos: `animated` na adesão, no comprovante, na consulta do ticket, no recibo e nas duas páginas do contrato. `AuthCard` já anima; `CartazTicket` continua sem.
  - Arquivos: `src/components/adesao/AdesaoShell/AdesaoShell.tsx`, `src/components/veiculos/ComprovantePublico/ComprovantePublico.tsx`, `src/components/veiculos/ConsultaTicketPublica/ConsultaTicketPublica.tsx`, `src/components/veiculos/ReciboPublico/ReciboPublico.tsx`, `src/components/contrato/ContratoAceite/ContratoAceite.tsx`, `src/components/contrato/ContratoMensagem.tsx`
  - Pronto quando: os sete pontos da tabela de `design.md` §6 animam e o cartaz não; os testes dessas telas continuam passando.

- [ ] T7 — Verificação final: `npm run lint`, testes de `ui/Logo`, `layout/Header`, `adesao`, `veiculos`, `contrato` e `ui/AuthCard`, e `npm run build`. Conferir no navegador, nos temas claro e escuro: o ciclo igual ao protótipo (entrada, freio, ré, saída, vazio) e o fim estacionado depois de 2 ciclos; parar por hover, foco e toque; cabeçalho (primeiro toque só para, depois navega); só símbolo na adesão abaixo de 480px; transbordamento sem cobrir controles; anel de foco do link inteiro; impressão do comprovante e do contrato com o carro estacionado; "menos movimento" sem animação.
  - Arquivos: —
  - Pronto quando: lint, testes e build passam e cada item da conferência foi checado, com o resultado registrado aqui (inclusive o que não passou ou não pôde ser conferido).

  - Resultado (2026-11-18):
    - `npm run lint`: 0 erros (95 avisos já existentes em outros arquivos; nenhum nos arquivos alterados).
    - Testes: `ui/Logo` (29), `layout/Header` (5) e as telas que usam o logo passam. Na suíte inteira, 5 falhas que **já existiam sem esta mudança** (conferido com as mudanças guardadas): `tokens.test.ts` (foco em `PlateField.styles.ts`), três testes de 403 (Minha empresa, Usuários, Caixa) e `useLeitorPlaca` (instável: falha ou passa entre execuções, com ou sem a mudança).
    - `npm run build`: passa. Às vezes para com `SecurityFatalError` (a versão do Next.js tem uma vulnerabilidade conhecida) depois de compilar; repetir passa. Não é desta mudança.
    - Navegador (login, 390×844, tema claro): o ciclo roda (ré até a rua, logo vazio, curva de entrada) e termina com o carro na vaga (`translate(0 0) rotate(0)`); hover no meio da animação põe o carro na vaga e ela não recomeça.
    - **Correção feita na verificação:** a rua ficava 25 px abaixo do logo do login e o carro passava por cima de "Seu pátio sob controle." (RF11). A rua subiu para logo abaixo das vagas e a faixa dela passou a ser reservada no layout (10 px no login, 5 px no cabeçalho). Conferido de novo: o carro fica acima da frase. `design.md` §2/§4 e `techspec.md` atualizados.
    - **Não conferido no navegador** (precisa de login ou de link de ticket/contrato): cabeçalho (primeiro toque só para, depois navega; anel de foco), adesão só com o símbolo abaixo de 480px, páginas públicas e do contrato, tema escuro, impressão com o carro estacionado e "menos movimento". Esses casos estão cobertos por testes unitários, exceto a aparência e a impressão.
