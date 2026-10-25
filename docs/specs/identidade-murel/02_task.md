# Task 02: Logotipo Murel

**Status:** ✅ Concluída  
**Dependências:** Task 01

## Objetivo

> Substituir o logotipo GIPE (imagens PNG por tema) pelo logotipo Murel em SVG inline, com símbolo isolado e variantes por fundo.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/ui/Logo/MurelSymbol.tsx` — três vagas em M e carro na vaga do meio, com vidros recortados por `<mask>` de id único (`useId`).
- `src/components/ui/Logo/Logo.styles.ts` (se não existir, senão editar) — palavra "murel" em Plus Jakarta Sans 800, tracking `-0.05em`; keyframes `estaciona` dentro de `prefers-reduced-motion: no-preference`.
- `src/components/ui/Logo/Logo.test.tsx`

**Arquivos a editar:**
- `src/components/ui/Logo/Logo.tsx` — props `variant: "full" | "symbol"`, `size`, `align`, `tone: "default" | "onYellow"`, `animated`; remover `next/image` e `useThemeMode`.
- `src/components/layout/Header/Header.tsx` — usar `symbol` abaixo de `sm`; `aria-label="Murel — ir para o início"`.
- `src/components/ui/AuthCard/*` — logotipo grande com `animated` e a frase "Seu pátio sob controle." (destaque em `accent`).

**Arquivos a apagar:**
- `public/assets/gipe-*` (após conferir que não há mais referência)

## Critérios de Aceite

- [x] Cabeçalho, login e telas de autenticação mostram o símbolo e a palavra "murel".
- [x] Vagas e palavra seguem `colors.text`; o carro é sempre amarelo; `tone="onYellow"` pinta tudo em asfalto com vidros vazados.
- [x] Tamanho mínimo respeitado (24px com palavra, 16px só símbolo).
- [x] Leitor de tela lê "Murel"; não há ids de máscara duplicados com dois logotipos na página.
- [x] A animação só existe no logotipo grande e some com movimento reduzido.

## Testes

- [x] Componente: variantes `full` e `symbol` renderizam; rótulo acessível "Murel".
- [x] Componente: dois logotipos na mesma página geram ids de máscara diferentes.
- [x] Testes existentes de Header/AuthCard continuam passando (ajustar textos).

## Notas de Implementação

> Design.md seção 3. O amarelo do carro é a única cor fixa permitida no componente; comentar o motivo no código.

## Registro da execução

- `Logo` ganhou a prop `compactOnMobile` (esconde só a palavra abaixo de `sm`, mantendo um único SVG); o cabeçalho usa `size={28}` com ela. `AuthCard` e o assistente de adesão usam `size={56}` e `animated`. O login passa `tagline` ao `AuthCard`, que mostra "Seu pátio **sob controle.**" (a Task 08 trata o restante dos textos).
- Cores: as vagas usam `colors.accent` (amarelo no escuro, asfalto no claro), como no guia de marca; o design.md dizia `colors.text`, o que daria vagas giz no escuro. A palavra segue `colors.text`. O carro é `#FFC20E` fixo, e `#0E1729` fixo em `tone="onYellow"`, como o guia manda.
- O logotipo sem props (contrato, `ContratoAceite`, `ContratoMensagem`) passa a ter 48px de altura de símbolo.
- Apagados `public/assets/gipe-*` (nenhuma referência restante em `src`; os mockups em `docs/design/layouts` ainda citam os arquivos e não foram alterados).
- Verificado: `npx tsc --noEmit` sem erros, `npm run lint` sem erros, `npm run build` compila, e os testes de `ui`, `layout`, `auth`, `adesao` e `contrato` passam (inclui os 6 testes novos de `Logo`).
- Não conferido: o aspecto visual no navegador (nenhuma captura de tela foi feita nesta task).
