"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Titulo, Wrapper } from "./AcessoNegado.styles";

// Mostrada quando o perfil do usuário não permite a área que ele tentou abrir (ex.: por endereço direto).
export function AcessoNegado() {
  const router = useRouter();
  const tituloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  return (
    <Wrapper>
      <Titulo ref={tituloRef} tabIndex={-1}>
        Você não tem acesso a esta área
      </Titulo>
      <Text variant="muted">Seu perfil não permite abrir esta tela. Se precisar dela, fale com o administrador da empresa.</Text>
      <Button type="button" onClick={() => router.push("/dashboard")}>
        Ir para o início
      </Button>
    </Wrapper>
  );
}
