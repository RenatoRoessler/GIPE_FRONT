# Task 04: Botões e Pátio

**Status:** ✅ Concluída  
**Dependências:** Task 01

## Objetivo

Fazer os botões do Início e o link do Pátio usarem o host dos modais.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/components/veiculos/RegistrarEntradaButton/RegistrarEntradaButton.tsx` e `RegistrarSaidaButton/RegistrarSaidaButton.tsx` — só chamam `abrirEntrada`/`abrirSaida` (somem o estado, o modal e o toast locais).
- `src/components/patio/PatioView/PatioView.tsx` (e seus estilos) — o link "Registrar entrada" (`EntradaLink`, hoje para `/veiculos/entrada`) vira um botão com a mesma aparência que chama `abrirEntrada`. O modal de saída aberto pela lista continua como está.
- Testes: `PatioView.test.tsx` e os testes dos botões, se existirem.

## Critérios de Aceite

- [ ] Os botões do Início abrem o modal de entrada e o de saída pelo host.
- [ ] O botão "Registrar entrada" do Pátio abre o modal de entrada, sem navegar.
- [ ] A saída aberta pela lista do Pátio continua funcionando, com o veículo já escolhido.
- [ ] Registrar uma entrada ou uma saída com o Pátio aberto atualiza a lista, como hoje.
- [ ] Nenhum aviso de sucesso aparece duas vezes.

## Testes

- [ ] Componente: cada botão do Início chama a ação do host.
- [ ] Componente: o botão de entrada do Pátio chama `abrirEntrada` e não é mais um link.
- [ ] Componente: a saída pela lista do Pátio segue abrindo o modal com `buscaInicial`.

## Notas de Implementação

Tech Spec, "Telas e botões que abriam as páginas". Conferir se `ActionRow` ainda é usado pelas páginas antigas (a remoção é da Task 05).
