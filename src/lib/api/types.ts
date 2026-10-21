// O back responde erros em mais de um formato: `message` (antigo), `detail` + `errors[]` (regras de negócio,
// validação) e `erros[].mensagem` (401). Tudo opcional: a leitura é tolerante.
export type ApiErrorItem = { code?: string; message?: string };

export type ApiErrorBody = {
  message?: string;
  detail?: string;
  errors?: Record<string, string[]> | ApiErrorItem[];
  erros?: { mensagem?: string }[];
};

// Alias até o envelope de respostas do backend ser conhecido.
export type ApiResponse<T> = T;

export interface Paginado<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}
