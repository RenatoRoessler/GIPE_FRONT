# Task 03: Entrada com identificação automática

**Status:** ✅ Concluída  
**Dependências:** Task 01, Task 02

## Objetivo

Remover a marcação manual de mensalista da entrada e identificar o mensalista pela consulta da placa, mostrando o card (RF1 a RF4).

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/components/veiculos/usePlacaLookup.ts` — guarda e expõe `cadastro: PlacaConsulta | null` (último encontrado); `reset()` e nova consulta o limpam. A assinatura de `lookup()` não muda.
- `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx` — remove o campo Switch `mensalista` e `|| values.mensalista` de `hasChanges`; remove `mensalista` dos `defaultValues`; envia `mensalista: cadastro?.mensalista === true` no payload; renderiza `CardMensalista contexto="entrada"` entre Placa e Modelo.
- Schema da entrada em `src/lib/schemas/` (`entradaVeiculoSchema`) e o tipo `EntradaVeiculoValues` — remove `mensalista`.
- `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.test.tsx` — ajusta o valor padrão e acrescenta os casos abaixo.

## Critérios de Aceite

- [ ] O modal de entrada não exibe mais "Mensalista: Sim/Não".
- [ ] Placa de mensalista consultada (`mensalista: true`): o card aparece com o nome e o payload sai com `mensalista: true`.
- [ ] Placa de mensalista fora do plano (`mensalista: false` com `dadosMensalista`): aparece o card `rotativo` com o horário contratado e o payload sai com `mensalista: false`.
- [ ] Placa de avulso, não encontrada ou com falha na consulta: nenhum card, sem espaço reservado, payload com `mensalista: false`.
- [ ] Alterar a placa remove o card na hora; nunca fica o card de uma placa antiga.
- [ ] Ler a placa pela câmera segue o mesmo caminho e mostra o card.
- [ ] O descarte ("Descartar entrada?") não considera mais o campo removido.

## Testes

- [ ] Hook: `cadastro` é preenchido quando encontrado e limpo no `reset()` e em nova consulta.
- [ ] Componente: card aparece para mensalista e some ao trocar a placa.
- [ ] Componente: card `rotativo` para `mensalista: false` com `dadosMensalista`, sem etiqueta de mensalista no payload.
- [ ] Componente: sem card para avulso e para falha de consulta.
- [ ] Componente: o payload enviado a `registrarEntrada` leva `mensalista` conforme o cadastro.
- [ ] Componente: o campo Switch não existe.

## Notas de Implementação

Tech Spec, "Entrada". Contrato de `GET /Veiculo/{placa}` confirmado com o back (`mensalista` + `dadosMensalista`); a task não está mais bloqueada. O card é decidido por `dadosMensalista` (existe) e a variante, por `mensalista` (true → normal, false → rotativo). Reaproveita a proteção existente contra resposta de placa antiga em `handlePlacaBlur`. Não deixar o card depender de dados do formulário.
