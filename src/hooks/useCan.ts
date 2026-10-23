"use client";

import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { podeAcessar, type Area } from "@/lib/permissoes";

// Se o perfil do usuário atual permite a área. Falso enquanto o perfil não é conhecido: a ação some até lá em vez de aparecer e sumir.
export function useCan(area: Area): boolean {
  const { user, isLoading } = useCurrentUser();
  return !isLoading && podeAcessar(user?.perfil, area);
}
