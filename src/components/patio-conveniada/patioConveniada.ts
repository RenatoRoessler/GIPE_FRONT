import { PERMANENCIA_LONGA_MINUTOS, corDoVeiculo, rotuloCategoria } from "@/components/patio/patio";
import { normalizePlaca } from "@/lib/placa";
import type { ResumoPatioConveniada, VeiculoConveniada } from "@/types/patioConveniada";

export const SEM_ESTACIONAMENTO = "Sem nome";

// Total e contagem por estacionamento, na ordem em que cada estacionamento aparece na lista.
export function resumirPorEstacionamento(veiculos: VeiculoConveniada[]): ResumoPatioConveniada {
  const porEmpresa = new Map<number, { empresaId: number; nome: string; total: number }>();
  for (const veiculo of veiculos) {
    const atual = porEmpresa.get(veiculo.empresaId);
    if (atual) {
      atual.total += 1;
    } else {
      porEmpresa.set(veiculo.empresaId, { empresaId: veiculo.empresaId, nome: veiculo.estacionamento || SEM_ESTACIONAMENTO, total: 1 });
    }
  }
  return { total: veiculos.length, porEstacionamento: [...porEmpresa.values()] };
}

// Trecho da placa, com ou sem hífen e em qualquer caixa. Busca vazia (ou só de símbolos) não filtra.
export function filtrarPorPlaca(veiculos: VeiculoConveniada[], busca: string): VeiculoConveniada[] {
  const trecho = normalizePlaca(busca);
  if (trecho === "") {
    return veiculos;
  }
  return veiculos.filter((veiculo) => normalizePlaca(veiculo.placa).includes(trecho));
}

// `null` vale "todos".
export function filtrarPorEstacionamento(veiculos: VeiculoConveniada[], empresaId: number | null): VeiculoConveniada[] {
  return empresaId === null ? veiculos : veiculos.filter((veiculo) => veiculo.empresaId === empresaId);
}

export function permanenciaLonga(veiculo: Pick<VeiculoConveniada, "minutosPermanencia">): boolean {
  return veiculo.minutosPermanencia >= PERMANENCIA_LONGA_MINUTOS;
}

// A frase que o leitor de tela lê no cartão: uma só, em vez de cada campo solto.
export function frasePermanencia(veiculo: VeiculoConveniada): string {
  const cor = corDoVeiculo(veiculo.cor).texto;
  const descricao = [veiculo.modelo, cor !== "—" ? cor.toLowerCase() : ""].filter((parte) => parte !== "").join(" ");
  const onde = veiculo.estacionamento ? `, em ${veiculo.estacionamento}` : "";
  const tempo = veiculo.permanencia ? `, ${veiculo.permanencia} no pátio` : "";
  const longa = permanenciaLonga(veiculo) ? ", mais de 3 dias" : "";
  return `${veiculo.placa}${descricao ? `, ${descricao}` : ""}, ${rotuloCategoria(veiculo.categoria)}${onde}${tempo}${longa}`;
}
