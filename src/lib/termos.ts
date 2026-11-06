// Versão dos Termos de Uso e da Política de Privacidade publicados em `public/legal`.
// Subir junto sempre que o texto de um dos documentos mudar.
export const VERSAO_TERMOS = "v1.0";

export type DocumentoAceite = "termos" | "privacidade";

export const DOCUMENTOS_ACEITE: Record<DocumentoAceite, { titulo: string; url: string }> = {
  termos: { titulo: "Termos de Uso", url: "/legal/termos-de-uso.html" },
  privacidade: { titulo: "Política de Privacidade", url: "/legal/politica-de-privacidade.html" },
};
