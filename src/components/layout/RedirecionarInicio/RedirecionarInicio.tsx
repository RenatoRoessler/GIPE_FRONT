"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { telaInicial } from "@/lib/telaInicial";

// Raiz e rotas inexistentes (logado): leva à tela inicial do aparelho. O tamanho da tela só existe no navegador,
// então a escolha é feita aqui e não no servidor.
export function RedirecionarInicio() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading) router.replace(telaInicial(user?.perfil));
  }, [isLoading, user?.perfil, router]);

  return null;
}
