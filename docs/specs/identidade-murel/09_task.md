# Task 09: App instalável e offline

**Status:** ✅ Concluída  
**Dependências:** Tasks 01, 02

## Objetivo

> Fazer o app instalado, a aba do navegador e a página offline mostrarem a marca Murel (RF-04).

## Contexto Técnico

**Arquivos a criar:**
- `scripts/gerar-icones.mjs` — usa `sharp` (já instalado) para gerar os ícones a partir do SVG do símbolo: fundo `#0E1729`, símbolo amarelo; maskable com símbolo nos 60% centrais.
- `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png` (sobrescrever).
- `src/app/icon.svg` — favicon com o símbolo.

**Arquivos a editar:**
- `src/app/manifest.ts` — `name` e `short_name` "Murel", descrição nova, `background_color` e `theme_color` `#0E1729`.
- `src/app/layout.tsx` — `viewport.themeColor` com duas entradas por `prefers-color-scheme` (`#0E1729` escuro, `#F4F1E8` claro).
- `public/offline.html` — cores e nome da marca, sem fonte externa.
- `public/sw.js` — `CACHE_NAME` para `murel-offline-v1`; conferir se o ativador apaga caches antigos.

## Critérios de Aceite

- [x] Ícones nos quatro tamanhos gerados e versionados; o script não roda no build.
- [ ] O manifest valida e o Chrome DevTools mostra nome, cores e ícones corretos (incluindo maskable). (configurado e coberto por teste; falta ver no navegador, na Task 11)
- [ ] O app instalado abre com fundo asfalto. (configurado e coberto por teste; falta ver no navegador, na Task 11)
- [ ] A página offline mostra "Murel" com a nova paleta nos dois esquemas de cor. (configurado e coberto por teste; falta ver no navegador, na Task 11)
- [x] Cache antigo `gipe-offline-v1` não é mais servido após o novo service worker ativar.

## Testes

- [x] Teste do `manifest()` (nome, `short_name`, cores, três ícones).
- [x] Script `gerar-icones.mjs` roda e produz arquivos com as dimensões esperadas.
- [ ] Verificação manual: instalação no Chrome/Android e "Adicionar à Tela de Início" no iOS. (pendente: ver registro da execução)
- [ ] Verificação manual: modo offline mostra a página nova. (pendente: ver registro da execução)

## Notas de Implementação

> Techspec seção 4. Ler o guia de `manifest`/`viewport` em `node_modules/next/dist/docs/` antes de editar.

## Registro da execução

- `scripts/gerar-icones.mjs` (novo, `npm run generate:icons`) gera com `sharp` os PNG a partir do SVG do símbolo: `icon-192`, `icon-512` (fundo asfalto com cantos arredondados), `maskable-512` (sem cantos, símbolo em 60% da largura, dentro da zona segura), `apple-touch-icon` (180px, sem cantos) e `src/app/icon.png` (64px), além de `src/app/icon.svg`. Os arquivos gerados estão versionados; o script não roda no build. Conferi `icon-512` e `maskable-512` abrindo as imagens: M amarelo com o carro na vaga do meio sobre asfalto, centralizado.
- Removido `src/app/favicon.ico` (era do GIPE; o formato `.ico` não é gerado por `sharp`). O navegador passa a usar `icon.svg` e `icon.png`, que o Next.js liga sozinho no `<head>`; quem pedir `/favicon.ico` direto recebe 404.
- `manifest.ts`: nome e nome curto "Murel", descrição nova, `background_color` e `theme_color` `#0E1729`, mesmos três ícones. `layout.tsx`: `viewport.themeColor` com duas entradas por `prefers-color-scheme` (`#F4F1E8` no claro, `#0E1729` no escuro).
- `public/offline.html`: nome Murel, fundo giz no claro e asfalto no escuro, botão amarelo com texto asfalto e foco visível; sem fonte externa. `public/sw.js`: cache `murel-offline-v1`; o ativador que já existia apaga os caches com outro nome, então `gipe-offline-v1` sai quando o novo worker ativar.
- Testes novos: `src/app/manifest.test.ts` (nome, cores e os três ícones existentes com as dimensões declaradas, lendo o cabeçalho do PNG) e `src/styles/marca.test.ts` (nenhum "GIPE" em maiúsculas em `src` e `public`, exceto o prefixo de QR em `lib/qr.ts`; cache novo no service worker). 12 testes passam em `src/app/manifest.test.ts` e `src/styles`; `tsc` e ESLint sem erros; `npm run build` compila e publica `/manifest.webmanifest`, `/icon.png` e `/icon.svg`.
- `package.json` continua com o nome `gipe-front` (identificador interno mantido).
- Não conferido: instalação real no Chrome/Android, "Adicionar à Tela de Início" no iOS, a aparência do ícone no sistema e a página offline com o app desconectado. Fica para a Task 11.
