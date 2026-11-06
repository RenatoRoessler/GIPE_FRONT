// Endereço da página pública do ticket; só chamar no navegador (usa a origem atual).
export function linkDoTicket(token: string): string {
  return `${window.location.origin}/comprovante/${encodeURIComponent(token)}`;
}
