"use client";

import { DiscButton } from "@/components/ui/DiscButton";
import { useCan } from "@/hooks/useCan";
import { AREA } from "@/lib/permissoes";
import { useVeiculoModais } from "../VeiculoModais";

export function RegistrarEntradaButton() {
  const { abrirEntrada } = useVeiculoModais();
  // Entrada e saída são do pátio: quem não tem a área não vê o botão.
  const podeOperarPatio = useCan(AREA.Patio);

  if (!podeOperarPatio) {
    return null;
  }

  return (
    <DiscButton badge="E" aria-haspopup="dialog" onClick={abrirEntrada}>
      Registrar entrada
    </DiscButton>
  );
}
