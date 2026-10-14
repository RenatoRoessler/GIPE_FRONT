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
