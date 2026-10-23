# Task 06: Ações restritas nas telas

**Status:** ✅ Concluída  
**Dependências:** Task 02

## Objetivo

> Ocultar, dentro de telas permitidas, as ações que o perfil não pode executar (sangria, histórico de caixa) e evitar chamadas à API que o perfil não pode fazer (indicadores do pátio no dashboard) (RF4 do PRD, tela 3 do `design.md`).

## Contexto Técnico

**Arquivos a criar:**
- `src/hooks/useCan.ts` — `useCan(area: Area): boolean` com `useCurrentUser()` + `podeAcessar`; retorna `false` enquanto `isLoading`.
- `src/hooks/useCan.test.tsx`

**Arquivos a editar:**
- `src/components/caixa/CaixaHeader.tsx` (só ele precisou mudar; `TurnoAtual` e `CaixaPage` não têm esses gatilhos) — botão de sangria só com `AREA.CaixaSangria`; gatilho do `HistoricoTurnosModal` só com `AREA.CaixaHistorico`; não renderizar barra de ações vazia.
- `src/components/home/IndicadoresPatio/IndicadoresPatio.tsx` — não consultar a API do pátio sem `AREA.Patio` (ocultar o bloco ou mostrar o estado adequado).
- Testes correspondentes de caixa e home.

## Critérios de Aceite

- [x] Manobrista não vê o botão de sangria; Administrador, Gerente e Caixa veem.
- [x] Caixa e Manobrista não veem o histórico de caixa; Administrador e Gerente veem.
- [x] Remover uma ação não deixa espaço vazio nem desalinha as demais, em desktop e mobile.
- [x] Financeiro e perfil desconhecido no dashboard não disparam a chamada de indicadores do pátio.
- [x] Enquanto o perfil carrega, as ações restritas não aparecem (sem piscar).
- [x] Nenhum `if (perfil === ...)` novo fora de `permissoes.ts`.

## Testes

- [x] Hook: `useCan` por perfil, `null` e `isLoading`.
- [x] Componente: caixa por perfil (sangria e histórico).
- [x] Componente: `IndicadoresPatio` não chama a API sem permissão (mock verificando zero chamadas) e chama com permissão.
- [x] Componente: a barra de ações do caixa nunca fica vazia (Passar turno e Fechar caixa sempre aparecem), então não há container vazio a tratar.

## Notas de Implementação

> Tech Spec, seção 6 e riscos. Regra do design: ocultar quando o perfil nunca terá a ação; desabilitar só quando existir em outro momento, com motivo em texto associado (`aria-describedby`). Telas de empresa, mensalistas e usuários já são bloqueadas inteiras pelo proxy: nada a ocultar internamente.
