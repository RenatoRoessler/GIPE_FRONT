"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import type { Mensalista, MensalistaTipo } from "@/types/mensalista";
import { ABAS, parseAba } from "../aba";
import { MensalistaFichaModal } from "../MensalistaFichaModal";
import { MensalistaModal } from "../MensalistaModal";
import { MensalistasList } from "../MensalistasList";
import { Header, Page } from "../Mensalistas.styles";
import { TipoModal } from "../TipoModal";
import { TiposList } from "../TiposList";

// `tipo`/`mensalista` ausentes = cadastro; presentes = edição.
type ModalState =
  | { kind: "tipo"; tipo?: MensalistaTipo }
  | { kind: "mensalista"; mensalista?: Mensalista }
  | { kind: "ficha"; mensalista: Mensalista }
  | null;

export function MensalistasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const aba = parseAba(searchParams.get("aba"));
  const [modal, setModal] = useState<ModalState>(null);
  const { toast, showToast, dismissToast } = useToast();

  function changeAba(next: string) {
    // Cada aba tem a própria paginação: ao trocar, a página volta ao início.
    router.replace(next === "mensalistas" ? "/mensalistas" : `/mensalistas?aba=${next}`, { scroll: false });
  }

  const closeModal = () => setModal(null);

  return (
    <Page>
      <Header>
        <Text variant="heading" as="h1">
          Mensalistas
        </Text>
      </Header>
      <Tabs tabs={[...ABAS]} value={aba} onChange={changeAba} aria-label="Seções de mensalistas">
        {aba === "tipos" ? (
          <TiposList
            onNovo={() => setModal({ kind: "tipo" })}
            onEditar={(tipo) => setModal({ kind: "tipo", tipo })}
          />
        ) : (
          <MensalistasList
            onNovo={() => setModal({ kind: "mensalista" })}
            onEditar={(mensalista) => setModal({ kind: "mensalista", mensalista })}
            onVerFicha={(mensalista) => setModal({ kind: "ficha", mensalista })}
            onToast={showToast}
            onCriarTipo={() => changeAba("tipos")}
          />
        )}
      </Tabs>

      {modal?.kind === "mensalista" && (
        <MensalistaModal
          mensalista={modal.mensalista}
          onClose={closeModal}
          onSuccess={showToast}
          onGoToTipos={() => {
            closeModal();
            changeAba("tipos");
          }}
        />
      )}
      {modal?.kind === "ficha" && (
        <MensalistaFichaModal
          mensalista={modal.mensalista}
          onClose={closeModal}
          onEditar={(mensalista) => setModal({ kind: "mensalista", mensalista })}
          onToast={showToast}
        />
      )}
      {modal?.kind === "tipo" &&<TipoModal tipo={modal.tipo} onClose={closeModal} onSuccess={showToast} />}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Page>
  );
}
