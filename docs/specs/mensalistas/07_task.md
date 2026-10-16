# Task 07: Aba Tipos de mensalidade: cadastro e edição

**Status:** ✅ Concluída
**Dependências:** Task 02, Task 03, Task 06

## Objetivo

Permite criar, editar e ativar/desativar tipos de mensalidade, atendendo RF-07 e RF-08.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/mensalistas/TipoModal/TipoModal.tsx`
- `src/components/mensalistas/TipoModal/index.ts`
- `src/components/mensalistas/TipoModal/TipoModal.test.tsx`

**Arquivos a editar:**
- `src/components/mensalistas/MensalistasPage/MensalistasPage.tsx` — abre/fecha `TipoModal`, exibe `Toast`
- `src/components/mensalistas/TiposList/TiposList.tsx` — liga "Novo tipo" e editar

## Critérios de Aceite

- [x] Cadastro: nome (até 100), categoria (inclui "Todas as categorias"), valor > 0, horários opcionais em par; tipo nasce ativo
- [x] Edição: formulário preenchido; `SwitchField` "ativo" só na edição, com dica sobre o efeito ao desativar
- [x] Validação com `tipoSchema` e mensagens por campo
- [x] Erro do servidor no `ErrorBanner` (duplicidade nome + categoria ativos; mensagem no campo nome quando o texto citar duplicidade)
- [x] Sucesso: fecha o modal, mostra `Toast` ("Tipo criado." / "Tipo atualizado.") e invalida `["mensalistas-tipos"]` e `["mensalistas"]`
- [x] Fechar com dados alterados pede confirmação ("Descartar alterações?")
- [x] Campos desabilitados e botão "Salvando…" durante o envio

## Testes

- [x] Valida e bloqueia envio com valor 0 e com só um horário preenchido
- [x] Cadastro envia o payload esperado (mock do serviço)
- [x] Edição preenche os valores e envia `ativo: false` ao desativar
- [x] Erro 400 do back aparece no banner
- [x] Descartar com alterações abre a confirmação

## Notas de Implementação

Padrão do `EntradaVeiculoModal` (`useAppForm`, `zodFieldErrors`, `useMutation`, `ConfirmDialog`). `Modal size="sm"`. Campo monetário com `parseMoney`/`formatBRL`. Horário: dois `TextField` do tipo `time` lado a lado.
