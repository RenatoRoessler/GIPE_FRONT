# Task 03: Menus abrem o modal

**Status:** ✅ Concluída  
**Dependências:** Task 01, Task 02

## Objetivo

Fazer o pórtico, a barra inferior e o painel do Menu abrirem o modal direto ao tocar em Entrada ou Saída.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/components/layout/NavSign/NavSign.tsx` e `NavSign.styles.ts` — item de ação vira `<button type="button">` com o mesmo estilo e `aria-haspopup="dialog"`, chamando `abrirEntrada`/`abrirSaida`; item de link como hoje; sem estado "página atual" nas ações.
- `src/components/layout/Gantry/Gantry.tsx` — usa `isNavActive`.
- `src/components/layout/BottomNav/BottomBar.tsx` — abas de ação usam `TabButton` com a ação; sem `aria-current` nelas; Menu destacado por `isMenuTabActive`.
- `src/components/layout/BottomNav/MenuSheet.tsx` — linha de ação vira botão com o estilo de linha; ao tocar, fecha o painel (`onRequestClose`) e depois chama a ação.
- `src/components/layout/AppShell/AppShell.tsx` — envolve o conteúdo com `VeiculoModaisProvider`.
- Testes: `Gantry.test.tsx`, `BottomBar.test.tsx`, `BottomNav.test.tsx`, `AppShell.test.tsx`.

## Critérios de Aceite

- [ ] No pórtico, tocar em Entrada ou Saída abre o modal correspondente por cima da tela atual, sem trocar de página.
- [ ] Na barra inferior, as abas Entrada e Saída abrem o modal; Início continua link e Menu continua abrindo o painel.
- [ ] No painel do Menu, tocar em Entrada ou Saída fecha o painel e abre o modal; os dois nunca ficam à vista juntos.
- [ ] Entrada e Saída nunca ficam marcadas como página atual; as demais telas continuam marcadas.
- [ ] Os itens são botões acionáveis com Enter e Espaço.
- [ ] Ao fechar o modal aberto a partir do painel, o foco volta ao botão Menu da barra.

## Testes

- [ ] Componente: pórtico com botões de ação e links, sem `aria-current` nas ações.
- [ ] Componente: abas Entrada e Saída da barra chamam a ação; Início é link.
- [ ] Componente: linha de ação do painel fecha o painel e chama a ação.
- [ ] Componente: Menu destacado em `/caixa` e também em `/patio`, e não em `/dashboard`.
- [ ] Componente: `AppShell` renderiza os menus dentro do provider.

## Notas de Implementação

Tech Spec, "Componentes de menu" e "Riscos" (dois `<dialog>` em sequência: se o modal abrir com o painel ainda fechando, abrir no tick seguinte). Atualizar os mocks para fornecer o provider ou o hook.
