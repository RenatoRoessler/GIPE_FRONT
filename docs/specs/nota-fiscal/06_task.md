# Task 06: Validação final

**Status:** 🔄 Em progresso  
**Dependências:** Task 01 a Task 05

## Objetivo

Confirmar que a feature cumpre o PRD e que os recibos e o menu não regrediram.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- Somente o necessário para corrigir o que a validação apontar; atualizar os status em `tasks.md`.

## Critérios de Aceite

- [x] `npm run lint` sem erros (0 erros; 94 avisos que já existiam em arquivos minificados).
- [x] Todos os testes passam (147 arquivos, 1634 testes, com 3 processos em paralelo).
- [x] `npm run build` conclui e lista `/notas-fiscais`.
- [ ] Conferidos, um a um, os critérios de aceite do `prd.md`.
- [ ] Os pontos do back (formato das listas, formato das datas de lançadas, mensagem de "já solicitada" e código do recibo na saída) confirmados, ou registrados como pendentes com a suposição usada.
- [ ] Verificado no navegador, em celular e computador, nos temas claro e escuro.

## Testes

- [x] Suíte completa de testes do projeto.
- [ ] Verificação manual: solicitar a nota pelo recibo da saída e pela página pública; segunda solicitação do mesmo recibo; e-mail inválido; limite de tentativas. **Feito no Chrome, contra uma API de mentira:** página pública (botão, modal vazio, e-mail inválido, preenchido, confirmação e o recibo depois de solicitar) e o corpo enviado (código do recibo, documento só com dígitos, valor em reais). Falta o recibo da tela de saída (modal de saída com a nota por cima) e a API real.
- [ ] Verificação manual: tela de notas com as duas abas, filtro de período, acesso negado e celular. **Feito no Chrome, contra uma API de mentira:** as duas abas, o filtro, cartões no celular e tabela no computador. Falta o acesso negado (403) com a API real.
- [ ] Verificação manual: foco ao fechar o modal aberto sobre o modal de saída.

## Notas de Implementação

Usar a skill `verification-before-completion`: só declarar concluído com a saída dos comandos em mãos. Não registrar o token real do `input.md` em nenhum arquivo.
