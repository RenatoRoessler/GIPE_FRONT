"use client";

import { Modal } from "@/components/ui/Modal";
import type { PatioVeiculo } from "@/types/patio";
import type { ChaveEscolhida } from "@/types/quadroChaves";
import { EscolherGancho } from "../EscolherGancho";

export interface GuardarChaveModalProps {
  veiculo: PatioVeiculo;
  onClose: () => void;
  // A chave foi guardada; quem abriu o modal decide o aviso e o fechamento.
  onGuardado: (chave: ChaveEscolhida) => void;
}

// Guarda a chave de um veículo que já está no pátio num gancho do quadro, ou a troca de gancho.
export function GuardarChaveModal({ veiculo, onClose, onGuardado }: GuardarChaveModalProps) {
  const atual = veiculo.posicaoChave ? { rotulo: veiculo.posicaoChave, ref: veiculo.chaveRef ?? null } : null;

  return (
    // O fundo não fecha: a escolha do gancho é um dado em andamento.
    <Modal open title="Guardar chave" size="md" onClose={onClose} closeOnBackdrop={false}>
      <EscolherGancho
        patioId={veiculo.patioId}
        placa={veiculo.placa}
        modelo={veiculo.modelo}
        cor={veiculo.cor}
        atual={atual}
        onGuardado={onGuardado}
        onPular={onClose}
        rotuloPular="Cancelar"
      />
    </Modal>
  );
}
