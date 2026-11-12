"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { precoParaCategoria } from "../catalogo";
import { formatCentavos } from "../format";
import { useServicos } from "../useServicos";
import { useAcrescentarServicos } from "../useServicosDoVeiculo";
import { Linha, Lista, Mensagem, Total, Valor } from "./AcrescentarServicosModal.styles";

export interface AcrescentarServicosModalProps {
  idPatio: number;
  // Categoria do veículo: define o preço de cada serviço e quais ele aceita.
  categoria: number;
  onClose: () => void;
  onAcrescentado: (quantidade: number) => void;
}

// Escolhe, entre os serviços ativos do catálogo, os que entram no veículo. O que não atende a categoria dele fica
// desabilitado, com o motivo em texto.
export function AcrescentarServicosModal({ idPatio, categoria, onClose, onAcrescentado }: AcrescentarServicosModalProps) {
  const catalogo = useServicos(true);
  const acrescentar = useAcrescentarServicos(idPatio);
  const [escolhidos, setEscolhidos] = useState<number[]>([]);
  const enviando = acrescentar.isPending;

  const servicos = (catalogo.data ?? []).filter((servico) => servico.ativo);
  const total = servicos.reduce((soma, servico) => (escolhidos.includes(servico.id) ? soma + (precoParaCategoria(servico, categoria) ?? 0) : soma), 0);

  function alternar(id: number, marcado: boolean) {
    setEscolhidos((atuais) => (marcado ? [...atuais, id] : atuais.filter((outro) => outro !== id)));
  }

  function confirmar() {
    acrescentar.mutate(escolhidos, { onSuccess: () => onAcrescentado(escolhidos.length) });
  }

  function corpo() {
    if (catalogo.isPending) {
      return (
        <div role="status" aria-label="Carregando os serviços">
          <Skeleton height="44px" />
          <Skeleton height="44px" />
        </div>
      );
    }
    if (catalogo.isError) {
      return (
        <>
          <ErrorBanner role="alert">{catalogo.error.message}</ErrorBanner>
          <Button variant="secondary" onClick={() => void catalogo.refetch()}>
            Tentar novamente
          </Button>
        </>
      );
    }
    if (servicos.length === 0) {
      return <Mensagem>Nenhum serviço ativo no catálogo.</Mensagem>;
    }
    return (
      <Lista aria-label="Serviços do catálogo">
        {servicos.map((servico) => {
          const preco = precoParaCategoria(servico, categoria);
          return (
            <Linha key={servico.id}>
              <Checkbox
                label={servico.nome}
                checked={escolhidos.includes(servico.id)}
                disabled={preco === null || enviando}
                hint={preco === null ? "Não atende a categoria deste veículo." : undefined}
                onCheckedChange={(marcado) => alternar(servico.id, marcado)}
              />
              <Valor $apagado={preco === null}>{preco === null ? "—" : formatCentavos(preco)}</Valor>
            </Linha>
          );
        })}
      </Lista>
    );
  }

  return (
    <Modal
      open
      size="md"
      title="Acrescentar serviços"
      onClose={onClose}
      closeOnBackdrop={false}
      footer={
        <>
          <Total aria-live="polite">Total {formatCentavos(total)}</Total>
          <Button type="button" variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="button" onClick={confirmar} disabled={escolhidos.length === 0 || enviando}>
            {enviando ? "Acrescentando..." : "Acrescentar"}
          </Button>
        </>
      }
    >
      {acrescentar.isError && <ErrorBanner role="alert">{acrescentar.error.message}</ErrorBanner>}
      {corpo()}
    </Modal>
  );
}
