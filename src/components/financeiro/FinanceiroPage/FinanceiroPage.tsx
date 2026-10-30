"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { TIPO_LANCAMENTO, type FinanceiroCategoria, type Lancamento, type TipoLancamento } from "@/types/financeiro";
import { CancelarLancamentoDialog } from "../CancelarLancamentoDialog";
import { CategoriaModal } from "../CategoriaModal";
import { CategoriasLista } from "../CategoriasLista";
import { FluxoCaixa } from "../FluxoCaixa";
import { Header, Page } from "../Financeiro.styles";
import { LancamentoDetalhe } from "../LancamentoDetalhe";
import { LancamentoModal } from "../LancamentoModal";
import { LancamentosLista } from "../LancamentosLista";
import { ABAS, financeiroUrl, parseAba, type AbaId } from "../url";

// Janela aberta por cima da página. Sem `id`/`categoria`, é cadastro; com eles, edição ou detalhe.
export type ModalFinanceiro =
  | { kind: "lancamento"; id?: number; tipoInicial?: TipoLancamento }
  | { kind: "detalhe"; id: number }
  | { kind: "cancelar"; lancamento: Lancamento }
  | { kind: "categoria"; categoria?: FinanceiroCategoria }
  | null;

export function FinanceiroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const aba = parseAba(searchParams.get("aba"));
  const [modal, setModal] = useState<ModalFinanceiro>(null);
  const { toast, showToast, dismissToast } = useToast();

  function changeAba(proxima: string) {
    // Cada aba tem os próprios filtros e a própria paginação: ao trocar, eles voltam ao padrão.
    router.replace(financeiroUrl(proxima as AbaId), { scroll: false });
  }

  return (
    <Page>
      <Header>
        <Text variant="heading" as="h1">
          Financeiro
        </Text>
        {aba === "categorias" ? (
          <Button type="button" onClick={() => setModal({ kind: "categoria" })}>
            Nova categoria
          </Button>
        ) : (
          <Button type="button" onClick={() => setModal({ kind: "lancamento" })}>
            Novo lançamento
          </Button>
        )}
      </Header>
      <Tabs tabs={[...ABAS]} value={aba} onChange={changeAba} aria-label="Seções do financeiro">
        {aba === "categorias" ? (
          <CategoriasLista onNova={() => setModal({ kind: "categoria" })} onEditar={(categoria) => setModal({ kind: "categoria", categoria })} />
        ) : aba === "lancamentos" ? (
          <LancamentosLista
            onNovo={() => setModal({ kind: "lancamento" })}
            onVerDetalhe={(lancamento) => setModal({ kind: "detalhe", id: lancamento.financeiroLancamentoId })}
            onEditar={(lancamento) => setModal({ kind: "lancamento", id: lancamento.financeiroLancamentoId })}
            onCancelar={(lancamento) => setModal({ kind: "cancelar", lancamento })}
            onCriarCategoria={() => {
              changeAba("categorias");
              setModal({ kind: "categoria" });
            }}
          />
        ) : (
          <FluxoCaixa onLancarDespesa={() => setModal({ kind: "lancamento", tipoInicial: TIPO_LANCAMENTO.Saida })} />
        )}
      </Tabs>
      {modal?.kind === "detalhe" && (
        <LancamentoDetalhe
          id={modal.id}
          onClose={() => setModal(null)}
          onEditar={(lancamento) => setModal({ kind: "lancamento", id: lancamento.financeiroLancamentoId })}
          onCancelar={(lancamento) => setModal({ kind: "cancelar", lancamento })}
        />
      )}
      {modal?.kind === "lancamento" && (
        <LancamentoModal
          id={modal.id}
          tipoInicial={modal.tipoInicial}
          onClose={() => setModal(null)}
          onSuccess={showToast}
          onCancelar={(lancamento) => setModal({ kind: "cancelar", lancamento })}
          onCriarCategoria={() => {
            changeAba("categorias");
            setModal({ kind: "categoria" });
          }}
        />
      )}
      {modal?.kind === "cancelar" && <CancelarLancamentoDialog lancamento={modal.lancamento} onClose={() => setModal(null)} onSuccess={showToast} />}
      {modal?.kind === "categoria" && <CategoriaModal categoria={modal.categoria} onClose={() => setModal(null)} onSuccess={showToast} />}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Page>
  );
}
