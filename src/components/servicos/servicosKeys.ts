import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";

// Chaves do módulo de Serviços. Acrescentar, cancelar e trocar o status de um serviço do veículo mudam o valor da saída;
// por isso a chave dos serviços do veículo começa pela do pátio e é invalidada junto com ela.
export const SERVICOS_KEY = ["servicos"] as const;

// Qualquer lista do catálogo, ativa ou não: serve para invalidar todas de uma vez.
export const SERVICOS_LISTA_KEY = [...SERVICOS_KEY, "lista"] as const;
export const servicosListaKey = (ativo?: boolean) => [...SERVICOS_KEY, "lista", ativo ?? "todos"] as const;
export const filaServicosKey = (status?: number) => [...SERVICOS_KEY, "fila", status ?? "todos"] as const;
// Qualquer fila, de qualquer status: serve para invalidar todas de uma vez.
export const FILA_SERVICOS_KEY = [...SERVICOS_KEY, "fila"] as const;

export const SERVICOS_DO_VEICULO_KEY = [...PATIO_QUERY_KEY, "servicos"] as const;
export const servicosDoVeiculoKey = (idPatio: number, incluirCancelados: boolean) =>
  [...SERVICOS_DO_VEICULO_KEY, idPatio, incluirCancelados] as const;
