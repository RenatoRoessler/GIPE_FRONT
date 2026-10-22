# Task 06: Validação final

**Status:** 🔄 Em progresso  
**Dependências:** Task 01 a Task 05

## Objetivo

Confirmar que a feature cumpre o PRD e que o comprovante da entrada e o recibo da tela não regrediram.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- Somente o necessário para corrigir o que a validação apontar; atualizar os status em `tasks.md`.

## Critérios de Aceite

- [x] `npm run lint` sem erros (0 erros; 94 avisos que já existiam em arquivos minificados).
- [x] Todos os testes passam (139 arquivos, 1526 testes, com 3 processos em paralelo).
- [x] `npm run build` conclui e lista `/recibo/[token]`.
- [ ] Conferidos, um a um, os critérios de aceite do `prd.md`.
- [ ] Os pontos do back que faltam (nome do código do recibo na saída e campo de mensalista) confirmados, ou registrados como pendentes com a suposição usada. A unidade do `valor` já foi confirmada (reais).
- [ ] Verificado no navegador, em celular e computador, nos temas claro e escuro.

## Testes

- [x] Suíte completa de testes do projeto.
- [ ] Verificação manual: registrar uma saída, ler o QR do recibo com o celular e abrir a página; baixar o PDF e imprimir.
- [ ] Verificação manual: link inexistente mostra "Recibo não encontrado"; sem rede mostra o erro com nova tentativa.
- [ ] Verificação manual: recibo de saída de mensalista (com e sem cobrança) e conferência do valor exibido contra o recibo da tela.

## Notas de Implementação

Usar a skill `verification-before-completion`: só declarar concluído com a saída dos comandos em mãos. Não registrar o token real do `input.md` em nenhum arquivo.
