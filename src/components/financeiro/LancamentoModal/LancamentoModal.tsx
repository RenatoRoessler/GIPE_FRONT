"use client";

import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Lancamento, TipoLancamento } from "@/types/financeiro";
import { useCategorias } from "../useCategorias";
import { useLancamento } from "../useLancamento";
import { LancamentoForm } from "./LancamentoForm";

export interface LancamentoModalProps {
  // Presente => edição.
  id?: number;
  // Tipo com que o cadastro abre (por exemplo, "Lançar despesa").
  tipoInicial?: TipoLancamento;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onCancelar: (lancamento: Lancamento) => void;
  onCriarCategoria: () => void;
}

// A edição parte do lançamento como está no back: enquanto ele carrega, a janela mostra só o carregamento.
export function LancamentoModal({ id, ...props }: LancamentoModalProps) {
  if (id === undefined) {
    return <LancamentoForm {...props} />;
  }
  return <EdicaoDeLancamento id={id} {...props} />;
}

function EdicaoDeLancamento({ id, ...props }: LancamentoModalProps & { id: number }) {
  const { data, isPending, isError, error, refetch, isFetching } = useLancamento(id);
  const categorias = useCategorias();

  // Se a resposta não trouxer o tipo, ele vem da categoria: espera a lista para o formulário abrir já no tipo certo.
  if (data && !data.cancelado && (data.tipo !== null || !categorias.isPending)) {
    // Outra pessoa pode ter cancelado o lançamento desde que a lista carregou.
    return <LancamentoForm key={data.financeiroLancamentoId} lancamento={data} {...props} />;
  }

  return (
    <Modal
      open
      size="lg"
      title="Editar lançamento"
      onClose={props.onClose}
      footer={
        <Button type="button" variant="secondary" onClick={props.onClose}>
          Fechar
        </Button>
      }
    >
      {(isPending || (data && !data.cancelado)) && (
        <div role="status" aria-label="Carregando lançamento">
          <Skeleton height="20px" />
        </div>
      )}
      {data?.cancelado && <ErrorBanner role="alert">Este lançamento foi cancelado e não pode ser editado.</ErrorBanner>}
      {isError && (
        <>
          <ErrorBanner role="alert">Não foi possível carregar o lançamento. {error.message}</ErrorBanner>
          <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </>
      )}
    </Modal>
  );
}
