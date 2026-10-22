"use client";

import { DiscButton } from "@/components/ui/DiscButton";
import { useVeiculoModais } from "../VeiculoModais";

export function RegistrarEntradaButton() {
  const { abrirEntrada } = useVeiculoModais();

  return (
    <DiscButton badge="E" aria-haspopup="dialog" onClick={abrirEntrada}>
      Registrar entrada
    </DiscButton>
  );
}
