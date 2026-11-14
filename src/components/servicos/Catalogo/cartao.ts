import { CATEGORIA_ROTULO, CATEGORIA_TODAS, type Servico } from "@/types/servico";
import { formatCentavos } from "../format";

// A ordem das categorias na tela (a do protótipo): moto, os carros por tamanho, caminhonete e caminhão. O back as numera
// de outro jeito (o carro grande é a 6).
export const CATEGORIAS_NA_TELA = [1, 2, 3, 6, 4, 5] as const;

// 45 -> "45 min"; 120 -> "2h"; 90 -> "1h30"; 75 -> "1h15". Sem valor (ou 0), vazio.
export function tempoCurto(minutos: number | null | undefined): string {
  if (!minutos) return "";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas}h${String(resto).padStart(2, "0")}` : `${horas}h`;
}

type CampoDeTempo = "duracaoMinutos" | "tempoPermitidoMinutos";

// O valor de um tempo em cada categoria que o serviço atende (a categoria sem preço fica de fora, e com o preço de "Todas"
// todas entram). Sem o valor da categoria, vale o do serviço.
function porCategoria(servico: Servico, campo: CampoDeTempo): (number | null)[] {
  const todas = servico.precos.some((preco) => preco.categoria === CATEGORIA_TODAS);
  return CATEGORIAS_NA_TELA.flatMap((id) => {
    const preco = servico.precos.find((item) => item.categoria === id);
    if (!preco && !todas) return [];
    return [preco?.[campo] ?? servico[campo] ?? null];
  });
}

// "30 min a 2h", ou um valor só quando todas as categorias levam o mesmo tempo. Vazio sem previsão.
export function faixaDeDuracao(servico: Servico): string {
  const duracoes = porCategoria(servico, "duracaoMinutos").filter((minutos): minutos is number => Boolean(minutos));
  if (duracoes.length === 0) return "";
  const menor = Math.min(...duracoes);
  const maior = Math.max(...duracoes);
  return menor === maior ? tempoCurto(menor) : `${tempoCurto(menor)} a ${tempoCurto(maior)}`;
}

// "1h a 3h grátis no pátio" ou "até 5h grátis no pátio"; vazio quando nenhuma categoria tem tempo grátis.
export function faixaDeGratis(servico: Servico): string {
  const tempos = porCategoria(servico, "tempoPermitidoMinutos").map((minutos) => minutos || 0);
  if (tempos.length === 0) return "";
  const menor = Math.min(...tempos);
  const maior = Math.max(...tempos);
  if (!maior) return "";
  const faixa = menor === maior ? tempoCurto(maior) : `${menor ? `${tempoCurto(menor)} a ` : "até "}${tempoCurto(maior)}`;
  return `${faixa} grátis no pátio`;
}

// Os nomes das categorias que o serviço não atende, na ordem da tela. Com o preço de "Todas", nenhuma.
export function categoriasQueNaoFaz(servico: Servico): string[] {
  if (servico.precos.some((preco) => preco.categoria === CATEGORIA_TODAS)) return [];
  return CATEGORIAS_NA_TELA.filter((id) => !servico.precos.some((preco) => preco.categoria === id)).map((id) => CATEGORIA_ROTULO[id]);
}

export interface FaixaDePreco {
  minimoCentavos: number;
  maximoCentavos: number;
  unico: boolean;
}

export function faixaDePreco(servico: Servico): FaixaDePreco | null {
  const valores = servico.precos.map((preco) => preco.valorCentavos);
  if (valores.length === 0) return null;
  const minimoCentavos = Math.min(...valores);
  const maximoCentavos = Math.max(...valores);
  return { minimoCentavos, maximoCentavos, unico: minimoCentavos === maximoCentavos };
}

// "R$ 35,00 – 140,00" (por categoria) ou "R$ 70,00" (preço único): o valor do rodapé do cartão do computador.
export function textoDaFaixaDePreco(faixa: FaixaDePreco): string {
  if (faixa.unico) return formatCentavos(faixa.minimoCentavos);
  return `${formatCentavos(faixa.minimoCentavos)} – ${formatCentavos(faixa.maximoCentavos).replace(/^R\$\s?/, "")}`;
}

// A linha de meta do cartão do celular: "30 min a 2h · até 3h grátis" ou "10 min a 30 min · cobra permanência".
export function metaDoCartaoMobile(servico: Servico): string {
  const duracao = faixaDeDuracao(servico);
  const maiorGratis = Math.max(0, ...servico.precos.map((preco) => preco.tempoPermitidoMinutos ?? 0));
  return [duracao || null, maiorGratis ? `até ${tempoCurto(maiorGratis)} grátis` : "cobra permanência"].filter(Boolean).join(" · ");
}

export interface PilulaDaCategoria {
  categoria: number;
  // "Moto", "pequeno", "médio", "grande", "Caminhonete", "Caminhão".
  rotulo: string;
  atende: boolean;
}

// As seis pílulas do cartão do celular, as categorias que o serviço não atende riscadas.
export function pilulasDasCategorias(servico: Servico): PilulaDaCategoria[] {
  const todas = servico.precos.some((preco) => preco.categoria === CATEGORIA_TODAS);
  return CATEGORIAS_NA_TELA.map((id) => ({
    categoria: id,
    rotulo: CATEGORIA_ROTULO[id].replace("Carro ", ""),
    atende: todas || servico.precos.some((preco) => preco.categoria === id),
  }));
}

// Quantos serviços têm tempo grátis no pátio (o chip do resumo).
export function quantosTemGratis(servicos: Servico[]): number {
  return servicos.filter((servico) => faixaDeGratis(servico) !== "").length;
}
