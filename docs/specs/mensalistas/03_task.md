# Task 03: Serviço de API e mapeadores

**Status:** ✅ Concluída
**Dependências:** Task 01, Task 02

## Objetivo

Entrega a camada de acesso aos endpoints de mensalistas e tipos e a conversão entre valores de formulário e payloads, tolerante a campos ausentes na resposta.

## Contexto Técnico

**Arquivos a criar:**
- `src/lib/api/services/mensalista.ts`
- `src/lib/api/services/mensalista.mapper.ts`
- `src/lib/api/services/mensalista.mapper.test.ts`

**Arquivos a editar:**
- —

## Critérios de Aceite

- [x] `listMensalistas({ pagina, tamanhoPagina, documento? })` chama `GET /Mensalista` e envia o documento sem máscara
- [x] `createMensalista` e `updateMensalista(id, values)` chamam `POST /Mensalista` e `PUT /Mensalista/{id}` com `MensalistaPayload` completo
- [x] `listTiposMensalidade`, `createTipoMensalidade` e `updateTipoMensalidade` chamam `GET/POST /Mensalista/tipo` e `PUT /Mensalista/tipo/{id}`
- [x] `toMensalistaPayload`/`fromMensalista` e `toTipoPayload`/`fromTipo` convertem valores (strings ⇄ números, máscara ⇄ só dígitos, horário `HH:mm`)
- [x] Leitura tolerante: campos ausentes viram `null`/padrões, sem quebrar a tela; campos incertos marcados `[A CONFIRMAR]` em comentário

## Testes

- [x] `toMensalistaPayload`: documento e celular só com dígitos/letras, números convertidos, `ativo: true` no cadastro
- [x] `fromMensalista`: documento e celular formatados para exibição
- [x] `toTipoPayload`: valor `"280,00"` → `280`; horários vazios → `null`
- [x] `fromTipo` com horários `HH:mm:ss` e `null`
- [x] Serviço com `api` mockado: query `documento` enviada sem máscara

## Notas de Implementação

Seguir o padrão de `preco.ts` / `preco.mapper.ts`. Erros ficam como `ApiError` (400/401/403) vindos do cliente `api`. Não há `GET /Mensalista/{id}`; a edição usa o item da lista. Seção 4 do Tech Spec.
