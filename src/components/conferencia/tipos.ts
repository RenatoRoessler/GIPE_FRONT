import type { Conferencia, ConferenciaEtapa } from "@/types/conferenciaPatio";
import type { useConferenciaAcoes } from "./useConferenciaAcoes";

export type ConferenciaAcoes = ReturnType<typeof useConferenciaAcoes>;

// O que a página entrega a cada etapa: a conferência aberta, as ações (uma só fila de leituras para todas) e a navegação.
export interface EtapaProps {
  conferencia: Conferencia;
  acoes: ConferenciaAcoes;
  onIr: (etapa: ConferenciaEtapa) => void;
  // Mensagem curta (Toast) de sucesso ou de erro.
  onMensagem: (mensagem: string, variante?: "success" | "error") => void;
}

export interface InicioProps extends Omit<EtapaProps, "conferencia"> {
  conferencia: Conferencia | null;
}
