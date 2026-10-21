// Chave estável só do cliente (itens de listas em formulários); não vai para a API.
export function newUid(): string {
  return crypto.randomUUID();
}
