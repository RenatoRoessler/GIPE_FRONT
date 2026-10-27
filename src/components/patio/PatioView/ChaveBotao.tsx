"use client";

import { NavIcon } from "@/components/layout/NavIcons/NavIcons";
import type { PatioVeiculo } from "@/types/patio";
import { ChaveBotaoEstilo, ChaveIcone, ChavePosicao, ChaveTexto, ChaveTopo, ForaDoQuadro, PontoAtencao } from "./PatioView.styles";

export interface ChaveBotaoProps {
  veiculo: PatioVeiculo;
  onGuardar: (veiculo: PatioVeiculo) => void;
}

// Quadro e posição da chave, separados para a etiqueta: pelo `chaveRef` ou, sem ele, pelo texto "Quadro · A2".
function quadroEPosicao(veiculo: PatioVeiculo): { quadro: string | null; posicao: string } | null {
  const { chaveRef, posicaoChave } = veiculo;
  if (chaveRef) {
    return { quadro: chaveRef.quadro, posicao: `${chaveRef.linha}${chaveRef.coluna}` };
  }
  if (!posicaoChave) {
    return null;
  }
  const corte = posicaoChave.lastIndexOf(" · ");
  return corte === -1
    ? { quadro: null, posicao: posicaoChave }
    : { quadro: posicaoChave.slice(0, corte), posicao: posicaoChave.slice(corte + 3) };
}

// Com gancho, mostra o quadro e a posição e troca de gancho ao tocar; sem gancho, convida a guardar a chave no quadro.
export function ChaveBotao({ veiculo, onGuardar }: ChaveBotaoProps) {
  const chave = quadroEPosicao(veiculo);

  return (
    <ChaveBotaoEstilo
      type="button"
      $semGancho={!chave}
      data-chave-botao
      aria-label={
        veiculo.posicaoChave
          ? `Trocar a chave de ${veiculo.placa}, hoje no gancho ${veiculo.posicaoChave}`
          : `Guardar a chave de ${veiculo.placa} no quadro`
      }
      onClick={() => onGuardar(veiculo)}
    >
      <ChaveIcone aria-hidden="true">
        <NavIcon id="keys" />
      </ChaveIcone>
      {chave ? (
        <ChaveTexto>
          <ChaveTopo $destaque={false}>{chave.quadro ?? "Chave"}</ChaveTopo>
          <ChavePosicao>{chave.posicao}</ChavePosicao>
        </ChaveTexto>
      ) : (
        <ChaveTexto>
          <ChaveTopo $destaque>Guardar chave</ChaveTopo>
          <ForaDoQuadro>
            <PontoAtencao aria-hidden="true" />
            Fora do quadro
          </ForaDoQuadro>
        </ChaveTexto>
      )}
    </ChaveBotaoEstilo>
  );
}
