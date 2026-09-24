"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import type { CurrentUser } from "@/types/user";

// Mock temporário: não existe sessão/autenticação real ainda (ver src/lib/auth.ts).
// Quando o usuário logado vier de dado real, só esta implementação muda — os
// componentes que consomem useCurrentUser() não são afetados.
const MOCK_USER: CurrentUser = {
  id: "mock-user-1",
  name: "Renato Roessler",
};

type CurrentUserContextValue = {
  user: CurrentUser | null;
  isLoading: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setUser(MOCK_USER);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <CurrentUserContext.Provider value={{ user, isLoading }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser deve ser usado dentro de CurrentUserProvider");
  }
  return context;
}
