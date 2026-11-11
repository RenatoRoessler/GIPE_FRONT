"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { EMPRESA_QUERY_KEY } from "@/components/empresa/MinhaEmpresa/queryKeys";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { getEmpresa } from "@/lib/api/services/empresa";
import type { EmpresaFormValues } from "@/types/empresa";
import { CartazTicket } from "./CartazTicket";
import { GerarButton } from "./CartazTicket.styles";

const MENSAGEM_FALHA = "Não foi possível gerar o cartaz agora. Tente novamente em instantes.";

// Limite de segurança: alguns navegadores de celular não disparam `afterprint`, e o cartaz não pode ficar montado para sempre.
const LIMITE_IMPRESSAO_MS = 60_000;

function PrinterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <rect x="7" y="14" width="10" height="7" rx="1" />
    </svg>
  );
}

// Gera o cartaz A4 do ticket digital da empresa e abre a impressão do navegador. Serve à Home e à tela da empresa.
export function GerarCartazButton() {
  const queryClient = useQueryClient();
  const { toast, showToast, dismissToast } = useToast();
  const [buscando, setBuscando] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  // Com o cartaz na tela (fora de vista), espera o QR ser desenhado e chama a impressão; ao terminar, desmonta.
  useEffect(() => {
    if (!link) return;
    const limpar = () => setLink(null);
    let segundoQuadro = 0;
    const primeiroQuadro = requestAnimationFrame(() => {
      segundoQuadro = requestAnimationFrame(() => window.print());
    });
    window.addEventListener("afterprint", limpar);
    const limite = setTimeout(limpar, LIMITE_IMPRESSAO_MS);
    return () => {
      cancelAnimationFrame(primeiroQuadro);
      cancelAnimationFrame(segundoQuadro);
      window.removeEventListener("afterprint", limpar);
      clearTimeout(limite);
    };
  }, [link]);

  // O guid vem da leitura da empresa. O cache pode estar sem ele (carregado por outra tela ou antes do campo existir):
  // nesse caso consulta de novo, sem confiar no tempo de validade do cache.
  async function obterEmpresaGuid(): Promise<string | null> {
    const emCache = queryClient.getQueryData<EmpresaFormValues>(EMPRESA_QUERY_KEY)?.empresaGuid;
    if (emCache) return emCache;
    const empresa = await queryClient.fetchQuery({ queryKey: EMPRESA_QUERY_KEY, queryFn: getEmpresa, staleTime: 0 });
    return empresa.empresaGuid ?? null;
  }

  async function handleClick() {
    setBuscando(true);
    try {
      const empresaGuid = await obterEmpresaGuid();
      if (!empresaGuid) {
        showToast(MENSAGEM_FALHA, "error");
        return;
      }
      setLink(`${window.location.origin}/ticket/${encodeURIComponent(empresaGuid)}`);
    } catch {
      showToast(MENSAGEM_FALHA, "error");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <>
      <GerarButton type="button" variant="secondary" onClick={() => void handleClick()} disabled={buscando || link !== null}>
        <PrinterIcon />
        Gerar Cartaz do Ticket
      </GerarButton>
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
      {link && createPortal(<CartazTicket link={link} />, document.body)}
    </>
  );
}
