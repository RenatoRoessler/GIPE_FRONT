import { api } from "../client";
import { AdesaoInput, toAdesaoPayload } from "./adesao.mapper";

// Rejeita com ApiError; a resposta de sucesso não é usada pela tela.
export async function saveAdesao(input: AdesaoInput): Promise<void> {
  await api.post("/Adesao", toAdesaoPayload(input));
}
