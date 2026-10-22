"use client";

import { useMutation } from "@tanstack/react-query";
import { consultarCpf } from "@/lib/api/services/usuario";

// Mutation (e não query): a consulta é uma ação do usuário e o resultado não deve ficar em cache.
export function useConsultaCpf() {
  return useMutation({ mutationFn: (cpf: string) => consultarCpf(cpf) });
}
