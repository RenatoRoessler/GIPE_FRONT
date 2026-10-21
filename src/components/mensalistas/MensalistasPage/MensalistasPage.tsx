"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import type { Mensalista, MensalistaTipo, SituacaoMensalista } from "@/types/mensalista";
import { ABAS, abaUrl, parseAba, type AbaId } from "../aba";
import { AgendaView } from "../AgendaView";
import { MensalistaFichaModal } from "../MensalistaFichaModal";
import { MensalistaModal } from "../MensalistaModal";
import { MensalistasList } from "../MensalistasList";
import { PagamentoMensalistaModal } from "../PagamentoMensalistaModal";
import { Header, NovoFlutuante, NovoNoCabecalho, Page } from "../Mensalistas.styles";
import { TipoModal } from "../TipoModal";
import { TiposList } from "../TiposList";

// `tipo`/`mensalista` ausentes = cadastro; presentes = edição.
type ModalState =
  | { kind: "tipo"; tipo?: MensalistaTipo }
  | { kind: "mensalista"; mensalista?: Mensalista }
  | { kind: "ficha"; mensalista: Mensalista }
  | { kind: "pagamento"; mensalista: Mensalista; situacao: SituacaoMensalista }
  | null;

export function MensalistasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const aba = parseAba(searchParams.get("aba"), { temPagina: searchParams.get("pagina") !== null });
  const [modal, setModal] = useState<ModalState>(null);
  const { toast, showToast, dismissToast } = useToast();

  function changeAba(next: string) {
    // Cada aba tem a própria paginação: ao trocar, a página volta ao início.
    router.replace(abaUrl(next as AbaId), { scroll: false });
  }

  const closeModal = () => setModal(null);

  return (
    <Page $reservaFab={aba === "agenda"}>
      <Header>
        <Text variant="heading" as="h1">
          Mensalistas
        </Text>
        {aba === "agenda" && (
          <NovoNoCabecalho type="button" onClick={() => setModal({ kind: "mensalista" })}>
            Novo mensalista
          </NovoNoCabecalho>
        )}
      </Header>
      <Tabs tabs={[...ABAS]} value={aba} onChange={changeAba} aria-label="Seções de mensalistas">
        {aba === "tipos" ? (
          <TiposList
            onNovo={() => setModal({ kind: "tipo" })}
            onEditar={(tipo) => setModal({ kind: "tipo", tipo })}
          />
        ) : aba === "agenda" ? (
          <AgendaView
            onNovo={() => setModal({ kind: "mensalista" })}
            onVerFicha={(mensalista) => setModal({ kind: "ficha", mensalista })}
            onReceberPagamento={(mensalista, situacao) => setModal({ kind: "pagamento", mensalista, situacao })}
            onVerLista={() => changeAba("lista")}
            onToast={showToast}
            bloqueado={modal !== null}
          />
        ) : (
          <MensalistasList
            onNovo={() => setModal({ kind: "mensalista" })}
            onEditar={(mensalista) => setModal({ kind: "mensalista", mensalista })}
            onVerFicha={(mensalista) => setModal({ kind: "ficha", mensalista })}
            onReceberPagamento={(mensalista, situacao) => setModal({ kind: "pagamento", mensalista, situacao })}
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
          onReceberPagamento={(mensalista, situacao) => setModal({ kind: "pagamento", mensalista, situacao })}
          onToast={showToast}
        />
      )}
      {modal?.kind === "pagamento" && (
        <PagamentoMensalistaModal
          mensalista={modal.mensalista}
          situacao={modal.situacao}
          onClose={closeModal}
          onToast={showToast}
        />
      )}
      {modal?.kind === "tipo" &&<TipoModal tipo={modal.tipo} onClose={closeModal} onSuccess={showToast} />}
      {aba === "agenda" && (
        <NovoFlutuante type="button" aria-label="Novo mensalista" onClick={() => setModal({ kind: "mensalista" })}>
          + Novo
        </NovoFlutuante>
      )}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Page>
  );
}
