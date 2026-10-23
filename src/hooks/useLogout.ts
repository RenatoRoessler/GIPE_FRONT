"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { clearToken } from "@/lib/auth";
import { clearRememberedLogin } from "@/lib/rememberedLogin";

// Encerra a sessão neste dispositivo (token e login lembrado) e leva ao login.
export function useLogout() {
  const router = useRouter();

  return useCallback(() => {
    clearToken();
    void clearRememberedLogin();
    router.push("/login");
  }, [router]);
}
