"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { DockBar } from "@/components/ui/DockBar";
import type { PrecoView } from "@/types/preco";
import { formatBRL, formatMinutos } from "../format";
import { estimarCobranca, nomeDaCategoria, simulacaoInicial, SimuladorCobranca, type SimulacaoValor } from "../SimuladorCobranca";
import { Resumo, Rotulo, SemValor, Valor } from "./DockSimulador.styles";

export interface DockSimuladorProps {
  preco: PrecoView;
}

// Barra fixa do celular: o resultado da simulação sempre à vista; Ajustar abre a folha com o simulador completo.
// Deve ser remontada (key) ao trocar de tabela, para a categoria e a permanência voltarem ao padrão.
export function DockSimulador({ preco }: Readonly<DockSimuladorProps>) {
  const [valor, setValor] = useState<SimulacaoValor>(() => simulacaoInicial(preco));
  const [aberto, setAberto] = useState(false);

  const estimativa = estimarCobranca(preco, valor.categoria, valor.minutos);
  const categoria = nomeDaCategoria(valor.categoria);

  return (
    <>
      <DockBar aria-label="Simulador de cobrança" ocultarDe="md">
        <Resumo>
          <Rotulo>
            Simular · {categoria} · {formatMinutos(valor.minutos)} · estimativa
          </Rotulo>
          {estimativa.tipo === "valor" ? (
            <Valor>{formatBRL(estimativa.valor)}</Valor>
          ) : (
            <SemValor>{estimativa.tipo === "nao_aplica" ? `Não vale para ${categoria}` : "Sem valor para essa permanência"}</SemValor>
          )}
        </Resumo>
        <Button type="button" variant="secondary" size="sm" aria-haspopup="dialog" onClick={() => setAberto(true)}>
          Ajustar
        </Button>
      </DockBar>

      <BottomSheet open={aberto} title="Simular cobrança" onClose={() => setAberto(false)}>
        {aberto && <SimuladorCobranca preco={preco} valor={valor} onChange={setValor} />}
      </BottomSheet>
    </>
  );
}
