import { SERVICO_FORM_VAZIO, type ServicoFormValues } from "@/lib/schemas/servico";
import { CATEGORIA_TODAS, CATEGORIAS_SERVICO, type Servico } from "@/types/servico";

// 4010 -> "40,10": o valor volta ao campo como o operador o digitaria.
function centavosParaCampo(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

// Valores iniciais do formulário: vazios para um serviço novo; os do serviço, na edição.
export function valoresIniciais(servico?: Servico): ServicoFormValues {
  if (!servico) {
    return { ...SERVICO_FORM_VAZIO, precos: { ...SERVICO_FORM_VAZIO.precos } };
  }
  const precos: Record<number, string> = { ...SERVICO_FORM_VAZIO.precos };
  for (const categoria of CATEGORIAS_SERVICO) {
    const preco = servico.precos.find((item) => item.categoria === categoria);
    precos[categoria] = preco ? centavosParaCampo(preco.valorCentavos) : "";
  }
  const todas = servico.precos.find((item) => item.categoria === CATEGORIA_TODAS);
  return {
    nome: servico.nome,
    descricao: servico.descricao ?? "",
    duracaoMinutos: servico.duracaoMinutos === null ? "" : String(servico.duracaoMinutos),
    tempoPermitidoMinutos: servico.tempoPermitidoMinutos === null ? "" : String(servico.tempoPermitidoMinutos),
    precoTodas: todas ? centavosParaCampo(todas.valorCentavos) : "",
    precos,
  };
}
