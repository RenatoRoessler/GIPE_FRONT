import type { ReactNode } from "react";
import { TecladoProvider } from "@/components/teclado";

// A consulta pública fica fora da área logada (que é quem provê o teclado): o campo de placa usa o mesmo teclado da entrada.
export default function TicketLayout({ children }: { children: ReactNode }) {
  return <TecladoProvider>{children}</TecladoProvider>;
}
