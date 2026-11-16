// Iniciais do nome para o avatar: as duas primeiras palavras ("Maria Souza" → "MS"; "Maria" → "M").
export function iniciais(nome: string): string {
  const [primeiro, segundo] = nome.trim().split(/\s+/);
  return `${primeiro?.[0] ?? ""}${segundo?.[0] ?? ""}`.toUpperCase();
}
