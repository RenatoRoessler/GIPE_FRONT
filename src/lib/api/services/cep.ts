import { z } from "zod";
import { ESTADOS } from "@/lib/estados";
import { onlyDigits } from "@/lib/digits";
import type { CepAddress } from "@/types/cep";
import { ApiError } from "../errors";

// Serviço público de terceiros: usa fetch próprio, e não a instância `api`,
// para não enviar o token do usuário nem usar a URL do backend.
const VIACEP_URL = "https://viacep.com.br/ws";
const TIMEOUT_MS = 8000;

const viaCepSchema = z.object({
  erro: z.unknown().optional(),
  logradouro: z.string().optional(),
  bairro: z.string().optional(),
  localidade: z.string().optional(),
  uf: z.string().optional(),
});

const SIGLAS = new Set(ESTADOS.map((estado) => estado.sigla));

// Retorna null quando o CEP não existe; lança ApiError em falhas de comunicação.
export async function fetchAddressByCep(
  cep: string,
  signal: AbortSignal,
): Promise<CepAddress | null> {
  let response: Response;
  try {
    response = await fetch(`${VIACEP_URL}/${onlyDigits(cep)}/json/`, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError("timeout");
    }
    throw new ApiError("network");
  }

  if (response.status === 400) return null;
  if (!response.ok) throw new ApiError("server", undefined, response.status);

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    if (signal.aborted) throw error;
    throw new ApiError("unknown");
  }

  const parsed = viaCepSchema.safeParse(body);
  if (!parsed.success) throw new ApiError("unknown");
  if (parsed.data.erro) return null;

  const { logradouro, bairro, localidade, uf } = parsed.data;
  const estado = uf?.toUpperCase() ?? "";
  return {
    logradouro: logradouro ?? "",
    bairro: bairro ?? "",
    cidade: localidade ?? "",
    estado: SIGLAS.has(estado) ? estado : "",
  };
}
