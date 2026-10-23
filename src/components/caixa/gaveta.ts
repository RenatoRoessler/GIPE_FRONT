import { FORMA_PAGAMENTO, type Turno } from "@/types/caixa";
import { arredondar } from "./agregados";

export type Gaveta = {
  // Dinheiro esperado na gaveta (fundo do turno mais o dinheiro esperado). null quando o turno não traz o dinheiro.
  naGaveta: number | null;
  // O que fica na gaveta depois de uma retirada.
  fica: number;
  // Quanto pode ser retirado agora, como a API informa (disponivelSangria). null quando não vier.
  retiravel: number | null;
};

// Só combina números que a API entrega; a regra de quanto pode ser retirado é dela e não é recalculada aqui.
export function calcularGaveta(turno: Turno): Gaveta {
  const dinheiro = turno.formasPagamento.find((forma) => forma.formaPagamento === FORMA_PAGAMENTO.Dinheiro);
  const total = dinheiro ? arredondar(turno.valorFundoCaixa + dinheiro.valorEsperado) : null;
  // Dado que a API não mandou nunca vira NaN na tela: sem número válido, o bloco mostra traço.
  const naGaveta = total !== null && Number.isFinite(total) ? total : null;
  const retiravel = turno.disponivelSangria !== null && Number.isFinite(turno.disponivelSangria) ? turno.disponivelSangria : null;
  const fica = naGaveta !== null && retiravel !== null ? arredondar(naGaveta - retiravel) : turno.valorFundoCaixa;
  return { naGaveta, fica, retiravel };
}
