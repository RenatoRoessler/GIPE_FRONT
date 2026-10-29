// Aceita "15", "15,5", "15.50" e "1.234,56"; devolve NaN para texto inválido ou vazio.
export function parseMoney(value: string): number {
  const text = value.trim().replace(/^R\$\s*/, "");
  if (text === "") {
    return Number.NaN;
  }
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : Number.NaN;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number): string {
  return brl.format(value).replace(/ /g, " ");
}

// Máscara de digitação em reais: "1234,5" vira "R$ 1.234,5". Só dígitos e uma vírgula (até 2 casas) são aceitos;
// o resultado continua válido para `parseMoney`. Vazio permanece vazio.
export function maskMoney(value: string): string {
  const [inteiroBruto, ...resto] = value.replace(/[^\d,]/g, "").split(",");
  const temVirgula = resto.length > 0;
  const inteiro = inteiroBruto.replace(/^0+(?=\d)/, "");
  if (inteiro === "" && !temVirgula) {
    return "";
  }
  const agrupado = (inteiro || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${agrupado}${temVirgula ? `,${resto.join("").slice(0, 2)}` : ""}`;
}
