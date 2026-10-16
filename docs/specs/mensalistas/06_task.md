# Task 06: Aba Tipos de mensalidade: listagem

**Status:** ✅ Concluída
**Dependências:** Task 03, Task 05

## Objetivo

Mostra os tipos de mensalidade cadastrados, com todos os estados de tela, na aba Tipos.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/mensalistas/useTiposMensalidade.ts`
- `src/components/mensalistas/TiposList/TiposList.tsx`
- `src/components/mensalistas/TiposList/index.ts`
- `src/components/mensalistas/format.ts`
- `src/components/mensalistas/format.test.ts`

**Arquivos a editar:**
- `src/components/mensalistas/MensalistasPage/MensalistasPage.tsx` — renderiza `TiposList` na aba Tipos

## Critérios de Aceite

- [x] Tabela com Nome, Categoria ("Todas" para 99), Mensalidade (R$), Horário ("07:00 – 19:00", "—" sem horário, saída menor que a entrada exibida como está) e Situação (`StatusBadge` Ativo/Inativo); ativos primeiro (ordem do back)
- [x] Estados: carregando (`Skeleton`), vazio ("Nenhum tipo de mensalidade cadastrado." + botão "Novo tipo"), erro com "Tentar novamente", 403 com mensagem de sem permissão
- [x] Em tela estreita a tabela vira cartões (`data-label`)
- [x] Botão "Novo tipo" e ação editar por linha presentes (abrem o modal na Task 07)

## Testes

- [x] `format`: categoria, horário e valor (incluindo `null`, `HH:mm:ss` e 99)
- [x] `TiposList` com `listTiposMensalidade` mockado: loading, lista, vazio, erro, 403

## Notas de Implementação

Chave de query `["mensalistas-tipos"]`. Padrão de estados da `PrecosList` (`TableArea`, `EmptyState`, `ErrorArea`). Rótulos de categoria via `getCategoriaLabel` de `components/precos/format.ts`.
