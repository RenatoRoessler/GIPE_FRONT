"use client";

import { DiscButton } from "@/components/ui/DiscButton";
import { useVeiculoModais } from "../VeiculoModais";

export function RegistrarSaidaButton() {
  const { abrirSaida } = useVeiculoModais();

  return (
    <DiscButton badge="S" aria-haspopup="dialog" onClick={abrirSaida}>
      Registrar saída
    </DiscButton>
  );
}
