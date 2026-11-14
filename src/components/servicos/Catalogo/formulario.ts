import { parseMoney } from "@/lib/money";
import type { CategoriaFormValues, ServicoFormValues } from "@/lib/schemas/servico";
import { CATEGORIA_ROTULO } from "@/types/servico";
import { formatCentavos } from "../format";
import { CATEGORIAS_NA_TELA, tempoCurto } from "./cartao";

const preenchido = (texto: string) => texto.trim() !== "";

// A máscara do valor, como no protótipo: os dígitos entram como centavos ("4" -> "0,04", "4000" -> "40,00") e o milhar
// leva ponto. Sem dígito, vazio. O resultado é um valor que `parseMoney` lê.
export function mascararValor(texto: string): string {
  const digitos = texto.replace(/\D/g, "").replace(/^0+/, "");
  if (digitos === "") return "";
  const centavos = digitos.padStart(3, "0");
  const inteiro = centavos.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${inteiro},${centavos.slice(-2)}`;
}

// Minutos: só dígitos, até quatro.
export function soMinutos(texto: string): string {
  return texto.replace(/\D/g, "").slice(0, 4);
}

export interface ErrosDoServico {
  nome?: string;
  // Aviso da seção de categorias ("Informe o valor de Moto, Caminhão ou desligue a categoria").
  preco?: string;
  // Aviso da duração ("precisa ser maior que zero").
  duracao?: string;
  // Categorias cujo campo de valor ou de duração fica marcado.
  valor: Record<number, true>;
  tempo: Record<number, true>;
}

export const SEM_ERROS: ErrosDoServico = { valor: {}, tempo: {} };

export function temErros(erros: ErrosDoServico): boolean {
  return Boolean(erros.nome || erros.preco || erros.duracao) || Object.keys(erros.valor).length > 0 || Object.keys(erros.tempo).length > 0;
}

// As validações do cadastro, com os textos do protótipo. O nome repetido é decidido por quem chama (que tem a lista).
export function validarServico(valores: ServicoFormValues, { nomeRepetido }: { nomeRepetido: boolean }): ErrosDoServico {
  const erros: ErrosDoServico = { valor: {}, tempo: {} };
  const nome = valores.nome.trim();
  if (!nome) erros.nome = "Dê um nome ao serviço";
  else if (nomeRepetido) erros.nome = "Já existe um serviço ativo com esse nome. Use outro.";

  const ligadas = CATEGORIAS_NA_TELA.filter((id) => valores.categorias[id]?.recebe);
  const comZero = ligadas.filter((id) => preenchido(valores.categorias[id].duracao) && Number(valores.categorias[id].duracao) === 0);
  for (const id of comZero) erros.tempo[id] = true;
  if (comZero.length > 0) erros.duracao = "A duração precisa ser maior que zero, ou deixe em branco";

  if (ligadas.length === 0) {
    erros.preco = "Deixe pelo menos uma categoria recebendo o serviço";
  } else {
    const faltam = ligadas.filter((id) => !valorValido(valores.categorias[id].valor));
    for (const id of faltam) erros.valor[id] = true;
    if (faltam.length > 0) erros.preco = `Informe o valor de ${faltam.map((id) => CATEGORIA_ROTULO[id]).join(", ")} ou desligue a categoria`;
  }
  return erros;
}

function valorValido(texto: string): boolean {
  if (!preenchido(texto)) return false;
  const reais = parseMoney(texto);
  return Number.isFinite(reais) && reais > 0;
}

export function categoriasLigadas(valores: ServicoFormValues): number[] {
  return CATEGORIAS_NA_TELA.filter((id) => valores.categorias[id]?.recebe);
}

// Ligadas e ainda sem valor.
export function categoriasSemValor(valores: ServicoFormValues): number[] {
  return categoriasLigadas(valores).filter((id) => !preenchido(valores.categorias[id].valor));
}

export interface ProgressoDasCategorias {
  ligadas: number;
  prontas: number;
  semValor: number;
}

export function progressoDasCategorias(valores: ServicoFormValues): ProgressoDasCategorias {
  const ligadas = categoriasLigadas(valores).length;
  const semValor = categoriasSemValor(valores).length;
  return { ligadas, prontas: ligadas - semValor, semValor };
}

// Por que o passo 2 do celular não avança, com o texto do protótipo; nulo quando pode.
export function problemaDoPasso2(valores: ServicoFormValues): string | null {
  if (categoriasLigadas(valores).length === 0) return "Deixe pelo menos uma categoria recebendo o serviço";
  const faltam = categoriasSemValor(valores);
  if (faltam.length > 0) return `Defina o valor de ${faltam.map((id) => CATEGORIA_ROTULO[id]).join(", ")} ou desligue a categoria`;
  return null;
}

// A linha de resumo do botão da categoria no celular: "R$ 70,00 · 1h · 2h grátis", "Toque para definir" ou "Não faz".
export function resumoDaCategoria(linha: CategoriaFormValues): string {
  if (!linha.recebe) return "Não faz";
  if (!preenchido(linha.valor)) return "Toque para definir";
  const reais = parseMoney(linha.valor);
  const partes = [Number.isFinite(reais) ? formatCentavos(Math.round(reais * 100)) : linha.valor];
  if (preenchido(linha.duracao)) partes.push(tempoCurto(Number(linha.duracao)));
  partes.push(Number(linha.gratis) > 0 ? `${tempoCurto(Number(linha.gratis))} grátis` : "cobra permanência");
  return partes.filter(Boolean).join(" · ");
}

// A pequena linha da revisão: "leva 1h · 2h grátis no pátio", "sem previsão · cobra permanência".
export function detalheDaRevisao(linha: CategoriaFormValues): string {
  const leva = preenchido(linha.duracao) && Number(linha.duracao) > 0 ? `leva ${tempoCurto(Number(linha.duracao))}` : "sem previsão";
  const gratis = Number(linha.gratis) > 0 ? `${tempoCurto(Number(linha.gratis))} grátis no pátio` : "cobra permanência";
  return `${leva} · ${gratis}`;
}

// "Usar também nas N sem valor": o valor e os tempos da categoria editada vão para as outras ligadas que estão sem valor.
export function repetirParaAsSemValor(valores: ServicoFormValues, origem: number): ServicoFormValues {
  const base = valores.categorias[origem];
  const categorias = { ...valores.categorias };
  for (const id of CATEGORIAS_NA_TELA) {
    const linha = valores.categorias[id];
    if (id === origem || !linha.recebe || preenchido(linha.valor)) continue;
    categorias[id] = { ...linha, valor: base.valor, duracao: base.duracao, gratis: base.gratis };
  }
  return { ...valores, categorias };
}
