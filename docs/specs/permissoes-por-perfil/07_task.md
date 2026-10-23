# Task 07: Padronização do 403

**Status:** ✅ Concluída  
**Dependências:** Task 06

## Objetivo

> Garantir que, se a API recusar uma chamada por permissão mesmo com a interface filtrada, o usuário veja uma mensagem clara e a tela não quebre (RF5 do PRD, tela 4 do `design.md`).

## Contexto Técnico

**Arquivos a criar:**
- Nenhum (criar um pequeno componente/helper compartilhado só se o mesmo trecho se repetir em mais de duas telas).

**Arquivos a editar:**
- Mutações e listagens de caixa, preços, usuários, empresa, mensalistas e notas fiscais — conferir o caminho de erro e ajustar onde faltar:
  - ação pontual com `kind === "forbidden"`: `Toast` com a mensagem de `DEFAULT_MESSAGES.forbidden` ("Você não tem permissão para realizar esta ação.");
  - falha ao carregar a tela: `ErrorBanner` com o mesmo texto e `Button secondary` "Ir para o início", sem "Tentar novamente".
- `src/components/mensalistas/ListError.tsx` e `src/components/home/IndicadoresPatio/IndicadoresPatio.tsx` — referência do padrão já existente; alinhar ao texto e ao botão.
- Testes das telas ajustadas.

## Critérios de Aceite

- [x] 403 numa ação pontual mostra a mensagem de permissão sem jargão, no `ErrorBanner` do modal ou no `Toast` que cada tela já usa (não troquei o componente de cada tela); o texto vem de `normalizeError`.
- [x] 403 na carga de uma listagem mostra `ErrorBanner` com saída para o início e sem nova tentativa.
- [x] A tela continua utilizável após o erro: o aviso aparece no lugar da lista, com o menu e o link de volta.
- [x] O texto é o mesmo em todo o sistema.
- [x] `queryClient` continua sem repetir chamadas `forbidden`.

## Testes

- [x] Componente: simular `ApiError("forbidden")` nas listagens ajustadas (usuários, empresa, caixa, preços; mensalistas já tinham) e conferir o aviso. As mutações só são cobertas pelo teste unitário de `normalizeError`.
- [x] Componente: o botão "Ir para o início" do banner leva a `/dashboard`.
- [x] Unitário: `queryClient` não repete `forbidden` (teste existente, só conferir que passa).

## Notas de Implementação

> Tech Spec, seção 7. `ApiError.kind === "forbidden"` e a mensagem padrão já existem em `src/lib/api/errors.ts`; não criar um segundo texto. Esta task é principalmente de verificação: ajustar só onde o comportamento atual divergir.

## Resultado

- `normalizeError` passou a usar sempre o texto padrão de permissão no 403 (ignora a mensagem do back); novo `isForbiddenError`.
- Novo `src/components/layout/ErroSemPermissao` (aviso + link "Ir para o início", sem nova tentativa), usado em `ListError` (mensalistas, notas, tipos, agenda), `UsuariosList`, `MinhaEmpresa`, `CaixaPage` (caixa e turno) e na lista de `PrecosMasterDetail`.
- Mutações e modais continuam mostrando `error.message` no `ErrorBanner`/`Toast` existentes, agora com o texto padrão no 403. `PatioView` não foi alterado: ele já usa `ListError`.
- `ErroSemPermissao` é um aviso inline e usa `Link`, não `Button secondary`, para não depender do router em testes; o design pedia um botão secundário.
