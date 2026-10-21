import { CATEGORIA_VEICULO_OPTIONS, COR_PADRAO, CORES_VEICULO } from "@/types/veiculo";
import { TIPO_CATEGORIA, type TipoCategoria } from "@/types/preco";
import {
  TIPO_PESSOA,
  type CondutorFormValues,
  type MensalistaFormValues,
  type VeiculoFormValues,
} from "@/types/mensalista";
import { newUid } from "@/lib/uid";
import { normalizePlaca } from "@/lib/placa";

export const EMPTY_MENSALISTA_VALUES: MensalistaFormValues = {
  mensalistaTipoId: "",
  tipoPessoa: String(TIPO_PESSOA.Fisica),
  documento: "",
  nome: "",
  email: "",
  celular: "",
  diaVencimento: "",
  ativo: true,
  veiculos: [],
};

export function novoCondutor(): CondutorFormValues {
  return { uid: newUid(), nome: "", cpf: "" };
}

// Categoria do tipo específica (≠ 99) já vale para o veículo; "todas" (ou nenhum tipo ainda) deixa escolher.
export function categoriaDoTipo(categoriaTipo: TipoCategoria | null): string {
  return categoriaTipo !== null && categoriaTipo !== TIPO_CATEGORIA.Todas ? String(categoriaTipo) : "";
}

export function novoVeiculo({
  juridica,
  categoriaTipo,
}: {
  juridica: boolean;
  categoriaTipo: TipoCategoria | null;
}): VeiculoFormValues {
  return {
    uid: newUid(),
    placa: "",
    modelo: "",
    cor: COR_PADRAO,
    categoria: categoriaDoTipo(categoriaTipo),
    // Pessoa jurídica exige ao menos um condutor por veículo.
    condutores: juridica ? [novoCondutor()] : [],
  };
}

// Sem nada digitado além dos padrões: sai sem pedir confirmação.
export function veiculoVazio(veiculo: VeiculoFormValues): boolean {
  return (
    veiculo.placa.trim() === "" &&
    veiculo.modelo.trim() === "" &&
    veiculo.condutores.every((condutor) => condutor.nome.trim() === "" && condutor.cpf.trim() === "")
  );
}

// Ao trocar o tipo por um de categoria específica, todos os veículos passam a ter essa categoria.
export function ajustarCategorias(
  veiculos: VeiculoFormValues[],
  categoriaTipo: TipoCategoria | null,
): { veiculos: VeiculoFormValues[]; alterou: boolean } {
  const categoria = categoriaDoTipo(categoriaTipo);
  if (categoria === "") {
    return { veiculos, alterou: false };
  }
  const alterou = veiculos.some((veiculo) => veiculo.categoria !== categoria);
  return {
    veiculos: alterou ? veiculos.map((veiculo) => ({ ...veiculo, categoria })) : veiculos,
    alterou,
  };
}

const onlyDigits = (value: string) => value.replace(/\D/g, "");
const linhaVazia = (condutor: CondutorFormValues) => condutor.nome.trim() === "" && condutor.cpf.trim() === "";

// Soma os condutores de outro veículo, sem repetir CPF e descartando a linha em branco que só estava ali de espaço.
export function mesclarCondutores(destino: CondutorFormValues[], origem: CondutorFormValues[]): CondutorFormValues[] {
  const preenchidos = destino.filter((condutor) => !linhaVazia(condutor));
  const cpfs = new Set(preenchidos.map((condutor) => onlyDigits(condutor.cpf)).filter(Boolean));
  const novos = origem
    .filter((condutor) => !linhaVazia(condutor) && !cpfs.has(onlyDigits(condutor.cpf)))
    .map((condutor) => ({ ...condutor, uid: newUid() }));
  const resultado = [...preenchidos, ...novos];
  return resultado.length > 0 ? resultado : destino;
}

export function categoriaLabel(categoria: string): string {
  return CATEGORIA_VEICULO_OPTIONS.find((option) => String(option.value) === categoria)?.label ?? "";
}

function corLabel(cor: string): string {
  return CORES_VEICULO.find((option) => option.value === cor)?.label ?? cor;
}

// "Gol · Prata · Carro pequeno": linha de resumo do veículo recolhido.
export function resumoVeiculo(veiculo: VeiculoFormValues): string {
  return [veiculo.modelo.trim(), corLabel(veiculo.cor.trim()), categoriaLabel(veiculo.categoria)]
    .filter(Boolean)
    .join(" · ");
}

export function tituloVeiculo(veiculo: VeiculoFormValues): string {
  const placa = normalizePlaca(veiculo.placa);
  return placa === "" ? "Novo veículo" : placa;
}
