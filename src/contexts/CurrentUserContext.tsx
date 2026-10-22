"use client";

import { usePathname } from "next/navigation";
import { createContext, ReactNode, useContext, useMemo, useSyncExternalStore } from "react";
import { getToken } from "@/lib/auth";
import { parseSession } from "@/lib/session";
import type { CurrentUser } from "@/types/user";

type CurrentUserContextValue = {
  user: CurrentUser | null;
  isLoading: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

// O cookie não avisa quando muda: o token é relido a cada renderização, e o provider renderiza a cada troca de rota
// (usePathname), o que cobre login e logout feitos sem recarregar a página.
const subscribeNada = () => () => {};

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  usePathname();
  // No servidor e na hidratação não há token: o usuário só aparece depois, no navegador.
  const token = useSyncExternalStore(subscribeNada, getToken, () => null);
  const hydrated = useSyncExternalStore(
    subscribeNada,
    () => true,
    () => false,
  );

  const value = useMemo<CurrentUserContextValue>(() => {
    const session = parseSession(token);
    const user: CurrentUser | null = session
      ? { id: session.email || session.name, name: session.name, email: session.email, perfil: session.perfil }
      : null;
    return { user, isLoading: !hydrated };
  }, [token, hydrated]);

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser deve ser usado dentro de CurrentUserProvider");
  }
  return context;
}
