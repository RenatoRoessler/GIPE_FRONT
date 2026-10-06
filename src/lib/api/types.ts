// Formato de erro tolerante: o contrato real do backend ainda será confirmado.
export type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

// Alias até o envelope de respostas do backend ser conhecido.
export type ApiResponse<T> = T;
