import { parseApiDate } from "@/lib/date";
import type { Conveniada } from "@/types/conveniada";

// Nome fantasia ou, sem ele, a razão social.
export function nomeExibido(conveniada: Pick<Conveniada, "nomeFantasia" | "razaoSocial">): string {
  return conveniada.nomeFantasia || conveniada.razaoSocial;
}

// Razão social só como linha secundária, quando há nome fantasia.
export function razaoSecundaria(conveniada: Pick<Conveniada, "nomeFantasia" | "razaoSocial">): string | null {
  return conveniada.nomeFantasia && conveniada.razaoSocial ? conveniada.razaoSocial : null;
}

// "Rua X, 10 – Centro, São Paulo/SP", pulando o que não veio.
export function enderecoResumido(endereco: Conveniada["endereco"]): string {
  const rua = [endereco.logradouro, endereco.numero].filter(Boolean).join(", ");
  const cidade = [endereco.cidade, endereco.estado].filter(Boolean).join("/");
  return [rua, [endereco.bairro, cidade].filter(Boolean).join(", ")].filter(Boolean).join(" – ");
}

export function formatDesde(iso: string): string {
  const date = parseApiDate(iso);
  return date ? date.toLocaleDateString("pt-BR") : "—";
}
