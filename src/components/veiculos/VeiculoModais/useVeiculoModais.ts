"use client";

import { useContext } from "react";
import { VeiculoModaisContext, type VeiculoModaisContextValue } from "./VeiculoModaisProvider";

export function useVeiculoModais(): VeiculoModaisContextValue {
  const context = useContext(VeiculoModaisContext);
  if (!context) {
    throw new Error("useVeiculoModais precisa estar dentro de <VeiculoModaisProvider>.");
  }
  return context;
}
