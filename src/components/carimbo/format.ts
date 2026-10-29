import { formatDateTime } from "@/components/caixa/format";
import { getCategoriaVeiculoLabel } from "@/components/veiculos/saida";
import { CORES_VEICULO } from "@/types/veiculo";

export { formatDateTime };

// Categoria do veículo pelo nome; sem categoria no retorno, "—".
export function categoriaDoCarimbo(categoria: number): string {
  return categoria > 0 ? getCategoriaVeiculoLabel(categoria) : "—";
}

// "PRATA" -> "Prata"; cor fora da lista aparece como veio, e sem cor, "—".
export function corDoCarimbo(cor: string): string {
  if (cor === "") {
    return "—";
  }
  return CORES_VEICULO.find((option) => option.value === cor)?.label ?? cor;
}

// Texto vazio (campo que o back não mandou) vira "—".
export function textoOuTraco(valor: string): string {
  return valor === "" ? "—" : valor;
}
