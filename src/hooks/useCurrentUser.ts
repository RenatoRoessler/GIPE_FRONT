"use client";

import { useEffect, useState } from "react";
import type { CurrentUser } from "@/types/user";

// Mock temporário: não existe sessão/autenticação real ainda (LoginForm hoje
// é só front-end). Quando a spec de autenticação real existir, só esta
// implementação muda — os componentes que consomem o hook não são afetados.
const MOCK_USER: CurrentUser = {
  id: "mock-user-1",
  name: "Renato Roessler",
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setUser(MOCK_USER);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, []);

  return { user, isLoading };
}
