"use client";

import { useQuery } from "@tanstack/react-query";
import { getFatura } from "@/lib/api/services/fatura";
import { faturaKey } from "./queryKeys";

export function useFatura(id: number) {
  return useQuery({
    queryKey: faturaKey(id),
    queryFn: () => getFatura(id),
    refetchOnWindowFocus: false,
  });
}
