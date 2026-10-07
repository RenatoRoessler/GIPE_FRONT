export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function isValidCEP(value: string): boolean {
  return value.replace(/\D/g, "").length === 8;
}
