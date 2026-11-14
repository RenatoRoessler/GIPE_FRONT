import { CATEGORIA_FORM_VAZIA, SERVICO_FORM_VAZIO, type CategoriaFormValues, type ServicoFormValues } from "@/lib/schemas/servico";
import { CATEGORIA_TODAS, CATEGORIAS_SERVICO, type Servico } from "@/types/servico";

// 4010 -> "40,10": o valor volta ao campo como o operador o digitaria.
function centavosParaCampo(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

function minutosParaCampo(minutos: number | null | undefined): string {
  return minutos ? String(minutos) : "";
}

// Valores iniciais do formulário: vazios para um serviço novo; os do serviço, na edição. Na edição, a categoria que o
// serviço não atende (sem preço) começa desligada. Um preço antigo de "Todas" (99), que o back não aceita mais, vira o valor
// das categorias que não têm o seu, para o administrador rever e gravar por categoria.
export function valoresIniciais(servico?: Servico): ServicoFormValues {
  if (!servico) {
    return {
      ...SERVICO_FORM_VAZIO,
      categorias: Object.fromEntries(CATEGORIAS_SERVICO.map((categoria) => [categoria, { ...CATEGORIA_FORM_VAZIA }])),
    };
  }
  const todas = servico.precos.find((item) => item.categoria === CATEGORIA_TODAS);
  const categorias: Record<number, CategoriaFormValues> = {};
  for (const categoria of CATEGORIAS_SERVICO) {
    const proprio = servico.precos.find((item) => item.categoria === categoria);
    categorias[categoria] = {
      recebe: proprio !== undefined || todas !== undefined,
      valor: proprio ? centavosParaCampo(proprio.valorCentavos) : todas ? centavosParaCampo(todas.valorCentavos) : "",
      duracao: minutosParaCampo(proprio?.duracaoMinutos),
      gratis: minutosParaCampo(proprio?.tempoPermitidoMinutos),
    };
  }
  return {
    nome: servico.nome,
    descricao: servico.descricao ?? "",
    categorias,
  };
}
