import type { PatioFiltros, PatioResumo, PatioVeiculo } from "@/types/patio";
import { CATEGORIA_VEICULO_OPTIONS, CORES_VEICULO, matchCor } from "@/types/veiculo";

function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// O que está há mais tempo no pátio vem primeiro; no empate, a placa. Não altera a lista recebida.
export function ordenarPatio(itens: PatioVeiculo[]): PatioVeiculo[] {
  return [...itens].sort(
    (a, b) => b.minutosPermanencia - a.minutosPermanencia || a.placa.localeCompare(b.placa, "pt-BR"),
  );
}

// `termo` já vem sem acento e em minúsculas. Placa: letras e números do termo aparecem na placa (a partir de 2).
// Modelo: todas as palavras aparecem, em qualquer ordem. Ticket e sequencial: termo só com dígitos, por prefixo.
function combinaBusca(veiculo: PatioVeiculo, termo: string): boolean {
  const placa = termo.replace(/[^a-z0-9]/g, "").toUpperCase();
  if (placa.length >= 2 && veiculo.placa.includes(placa)) {
    return true;
  }
  const modelo = semAcento(veiculo.modelo ?? "");
  if (modelo !== "" && termo.split(/\s+/).every((palavra) => modelo.includes(palavra))) {
    return true;
  }
  if (/^\d+$/.test(termo)) {
    return String(veiculo.sequencial).startsWith(termo) || String(veiculo.codigoTicket ?? "").startsWith(termo);
  }
  return false;
}

export function filtrarPatio(itens: PatioVeiculo[], filtros: PatioFiltros): PatioVeiculo[] {
  const termo = semAcento(filtros.busca);
  return itens.filter((veiculo) => {
    if (filtros.tipo === "mensalistas" && !veiculo.mensalista) return false;
    if (filtros.tipo === "avulsos" && veiculo.mensalista) return false;
    if (filtros.categoria !== "todas" && veiculo.categoria !== filtros.categoria) return false;
    return termo === "" || combinaBusca(veiculo, termo);
  });
}

export function resumirPatio(todos: PatioVeiculo[], visiveis: PatioVeiculo[]): PatioResumo {
  return { total: todos.length, mostrados: visiveis.length };
}

export function categoriaConhecida(categoria: number): boolean {
  return CATEGORIA_VEICULO_OPTIONS.some((opcao) => opcao.value === categoria);
}

// A categoria vem como número; um valor novo do back aparece como "Categoria N", sem quebrar a tela.
export function rotuloCategoria(categoria: number): string {
  return CATEGORIA_VEICULO_OPTIONS.find((opcao) => opcao.value === categoria)?.label ?? `Categoria ${categoria}`;
}

// Amostra só para as cores que o sistema conhece; o texto livre ("teste") aparece sem amostra.
export function corDoVeiculo(cor: string | null): { texto: string; amostra: string | null } {
  if (!cor || cor.trim() === "") {
    return { texto: "—", amostra: null };
  }
  const conhecida = matchCor(cor);
  const amostra = conhecida ? (CORES_VEICULO.find((item) => item.value === conhecida)?.color ?? null) : null;
  return { texto: cor.trim(), amostra };
}
