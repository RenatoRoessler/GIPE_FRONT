"use client";

import { Link } from "@/components/ui/Link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCan } from "@/hooks/useCan";
import { AREA } from "@/lib/permissoes";

// Só quem gerencia quadros vê o atalho: para os demais perfis, a empresa sem quadro simplesmente não tem esse assunto.
function ConfigurarQuadroLink() {
  const podeGerenciar = useCan(AREA.QuadroChaves);
  return podeGerenciar ? <Link href="/quadros-chaves">Configurar quadro de chaves</Link> : null;
}

export interface IndicadorChavesProps {
  // Veículos do pátio inteiro cuja chave não está no quadro.
  foraDoQuadro: number;
  // A empresa tem ao menos um quadro de chaves.
  comQuadros: boolean;
  // A lista de quadros já chegou e está vazia (diferente de ainda carregando ou de falha).
  semQuadros: boolean;
}

// Item do resumo do Pátio. A região de status anuncia a mudança do número quando o operador guarda uma chave ou um carro sai.
export function IndicadorChaves({ foraDoQuadro, comQuadros, semQuadros }: IndicadorChavesProps) {
  if (semQuadros) {
    return <ConfigurarQuadroLink />;
  }
  if (!comQuadros) {
    return null;
  }

  return (
    <span role="status">
      {foraDoQuadro > 0 ? (
        <StatusBadge tone="warn">{`${foraDoQuadro} fora do quadro`}</StatusBadge>
      ) : (
        "Todas as chaves no quadro"
      )}
    </span>
  );
}
