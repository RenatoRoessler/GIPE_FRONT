import type { Carimbo } from "@/types/carimbo";
import { api } from "../client";
import { fromCarimboResponse } from "./carimbo.mapper";

// A conveniada logada carimba o ticket lido no QR do comprovante de entrada (token de 8 caracteres).
// Rejeita com ApiError; a mensagem de regra de negócio (400) vem do back.
export async function carimbarTicket(token: string): Promise<Carimbo> {
  const { data } = await api.put<unknown>("/Convenio/carimbar", { token });
  return fromCarimboResponse(data);
}
