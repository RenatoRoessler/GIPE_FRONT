"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Toast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { useToast } from "@/hooks/useToast";
import { OnboardingTour, type ModoTour } from "./OnboardingTour";
import { montarPassos } from "./passos";
import { useMarcarVisualizado, useOnboarding } from "./useOnboarding";

const ERRO_AO_SALVAR = "Não foi possível salvar. O tour pode aparecer de novo no próximo acesso.";

type OnboardingContextValue = {
  // Abre o tour completo, mesmo já visto; não registra nada.
  abrirTour: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboardingTour(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboardingTour deve ser usado dentro de OnboardingProvider");
  }
  return context;
}

// "Sair" não registra nada no back, que continua dizendo "não visto". A marca guarda a dispensa durante a sessão do navegador
// para o tour não reabrir a cada troca de página; um novo acesso (outra sessão) o oferece de novo.
function chaveDispensa(userId: string) {
  return `onboarding:dispensado:${userId}`;
}

function lerDispensa(userId: string | undefined): boolean {
  if (!userId) return false;
  try {
    return window.sessionStorage.getItem(chaveDispensa(userId)) === "1";
  } catch {
    return false;
  }
}

function gravarDispensa(userId: string | undefined) {
  if (!userId) return;
  try {
    window.sessionStorage.setItem(chaveDispensa(userId), "1");
  } catch {
    // Sem armazenamento, vale só a memória desta sessão da página.
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  const onboarding = useOnboarding();
  const marcar = useMarcarVisualizado();
  const { toast, showToast, dismissToast } = useToast();
  // Tour pedido pelo botão "Repetir tour"; o do primeiro acesso é derivado do que o back respondeu.
  const [repetindo, setRepetindo] = useState(false);
  const [dispensado, setDispensado] = useState(false);

  const abrirTour = useCallback(() => setRepetindo(true), []);
  const value = useMemo(() => ({ abrirTour }), [abrirTour]);

  const primeiroAcesso = onboarding.data?.visualizado === false && !dispensado && !lerDispensa(user?.id);
  const modo: ModoTour | null = repetindo ? "repeticao" : primeiroAcesso ? "primeiro-acesso" : null;
  const passos = useMemo(() => montarPassos(user?.perfil), [user?.perfil]);

  function dispensar() {
    gravarDispensa(user?.id);
    setDispensado(true);
  }

  function handleSair() {
    if (modo === "repeticao") {
      setRepetindo(false);
      return;
    }
    dispensar();
  }

  // Conclui e "Não mostrar mais" registram a visualização; se falhar, fecha mesmo assim para não prender a pessoa.
  function registrar() {
    marcar.mutate(undefined, {
      onError: () => {
        dispensar();
        showToast(ERRO_AO_SALVAR, "error");
      },
    });
  }

  function handleConcluir() {
    if (modo === "repeticao") {
      setRepetindo(false);
      return;
    }
    registrar();
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {modo && user && (
        <OnboardingTour
          passos={passos}
          modo={modo}
          registrando={marcar.isPending}
          onSair={handleSair}
          onNaoMostrarMais={registrar}
          onConcluir={handleConcluir}
        />
      )}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </OnboardingContext.Provider>
  );
}
