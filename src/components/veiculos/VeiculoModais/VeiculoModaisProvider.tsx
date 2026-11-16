"use client";

import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { Toast } from "@/components/ui/Toast";
import type { SaidaBusca } from "@/types/saida";
import { useToast } from "@/hooks/useToast";
import { EntradaVeiculoModal } from "../EntradaVeiculoModal";
import { SaidaVeiculoModal } from "../SaidaVeiculoModal";

export interface VeiculoModaisContextValue {
  abrirEntrada: () => void;
  abrirSaida: () => void;
}

type ModalAberto = "entrada" | "saida" | null;

export const VeiculoModaisContext = createContext<VeiculoModaisContextValue | null>(null);

// Host único dos modais de entrada e de saída: qualquer item de menu, botão ou link os abre daqui, por cima da tela atual.
// O aviso de sucesso também mora aqui, para não depender da tela de onde o modal foi aberto.
export function VeiculoModaisProvider({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState<ModalAberto>(null);
  // Veículo já escolhido para a saída (vindo da entrada, quando a placa já está no pátio).
  const [buscaSaida, setBuscaSaida] = useState<SaidaBusca | undefined>();
  const { toast, showToast, dismissToast } = useToast();

  const abrirEntrada = useCallback(() => setAberto("entrada"), []);
  const abrirSaida = useCallback(() => {
    setBuscaSaida(undefined);
    setAberto("saida");
  }, []);
  const darSaidaDaEntrada = useCallback((busca: SaidaBusca) => {
    setBuscaSaida(busca);
    setAberto("saida");
  }, []);
  const fechar = useCallback(() => setAberto(null), []);

  const value = useMemo(() => ({ abrirEntrada, abrirSaida }), [abrirEntrada, abrirSaida]);

  return (
    <VeiculoModaisContext.Provider value={value}>
      {children}
      {aberto === "entrada" && <EntradaVeiculoModal onClose={fechar} onSuccess={showToast} onDarSaida={darSaidaDaEntrada} />}
      {aberto === "saida" && <SaidaVeiculoModal onClose={fechar} onSuccess={showToast} buscaInicial={buscaSaida} />}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </VeiculoModaisContext.Provider>
  );
}
