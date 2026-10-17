export const PLACA_INVALIDA_MESSAGE =
  "Placa inválida. Informe no padrão antigo (ABC1234) ou Mercosul (ABC1D23)";

const PLACA_ANTIGA = /^[A-Z]{3}[0-9]{4}$/;
const PLACA_MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

// Maiúsculas, só letras e números, no máximo 7 caracteres.
export function normalizePlaca(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

export function isValidPlaca(value: string): boolean {
  const placa = normalizePlaca(value);
  return PLACA_ANTIGA.test(placa) || PLACA_MERCOSUL.test(placa);
}

export type PlacaTipo = "mercosul" | "antiga";

// O 5º caractere define o padrão: dígito é o antigo (ABC1234), letra é o Mercosul (ABC1D23). Antes disso não dá para saber.
export function getPlacaTipo(value: string): PlacaTipo | null {
  const placa = normalizePlaca(value);
  if (placa.length < 5) {
    return null;
  }
  return /[0-9]/.test(placa[4]) ? "antiga" : "mercosul";
}
