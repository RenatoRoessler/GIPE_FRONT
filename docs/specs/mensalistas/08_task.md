# Task 08: Aba Mensalistas: listagem, busca e paginação

**Status:** ✅ Concluída
**Dependências:** Task 03, Task 05

## Objetivo

Mostra os mensalistas com busca por documento e paginação, atendendo RF-02 e RF-03.

## Contexto Técnico

**Arquivos a criar:**
- `src/hooks/useDebouncedValue.ts`
- `src/components/mensalistas/useMensalistas.ts`
- `src/components/mensalistas/MensalistasList/MensalistasList.tsx`
- `src/components/mensalistas/MensalistasList/index.ts`
- `src/components/mensalistas/MensalistasList/MensalistasList.test.tsx`

**Arquivos a editar:**
- `src/components/veiculos/useModelos.ts` — passa a importar `useDebouncedValue` do novo hook (mudança mecânica)
- `src/components/mensalistas/format.ts` — documento mascarado, vencimento ("dia 5")
- `src/components/mensalistas/MensalistasPage/MensalistasPage.tsx` — renderiza `MensalistasList`

## Critérios de Aceite

- [x] Tabela: Nome (com e-mail/celular em linha secundária), Documento mascarado, Tipo (com categoria), Mensalidade, Vencimento, Situação, Ações (editar); ativos primeiro
- [x] 20 por página com `Pagination`; página na URL (`?pagina=`); página fora do intervalo volta à última existente; foco na tabela ao trocar de página
- [x] Busca por início de CPF/CNPJ, com ou sem máscara, com debounce de 250 ms; volta à página 1; termo só em estado local (não na URL)
- [x] Estados: carregando, atualizando (opacidade + `aria-busy`), vazio (com orientação se não houver tipo ativo), vazio da busca com "Limpar busca", erro com "Tentar novamente", 403
- [x] Em tela estreita a tabela vira cartões
- [x] `useModelos` continua funcionando como antes

## Testes

- [x] `useDebouncedValue` só propaga após o atraso
- [x] Busca envia o documento sem máscara e reinicia a página
- [x] Estados vazio, vazio da busca, erro e 403 (serviço mockado)
- [x] Troca de página chama o serviço com a página certa

## Notas de Implementação

Chave de query `["mensalistas", { pagina, documento }]` com `placeholderData: keepPreviousData`. Padrão da `PrecosList` para paginação e estados. Não registrar nem logar o documento buscado.
