"use client";

import { useId } from "react";
import { Botao } from "./Catalogo.styles";
import { Folha } from "./Folha";
import { AcoesDaFolha, TextoDaFolha, TituloDaFolha } from "./Folha.styles";
import { BotaoCelular } from "./ServicoFormCelular.styles";

export interface InativarFolhaProps {
  nome: string;
  // No celular, a folha sobe da borda de baixo; no computador, fica no centro.
  celular: boolean;
  inativando: boolean;
  onConfirmar: () => void;
  onManter: () => void;
}

// A confirmação de inativar, do protótipo: o serviço some da lista, e o que já foi lançado no pátio continua valendo.
export function InativarFolha({ nome, celular, inativando, onConfirmar, onManter }: InativarFolhaProps) {
  const tituloId = useId();
  const Cancelar = celular ? BotaoCelular : Botao;

  return (
    <Folha tituloId={tituloId} centro={!celular} onFechar={onManter}>
      <TituloDaFolha id={tituloId}>Inativar “{nome}”?</TituloDaFolha>
      <TextoDaFolha>
        {celular
          ? "Ele some da lista e não pode mais ser lançado em carros novos. O que já foi lançado no pátio continua valendo."
          : "Ele some da lista e não pode mais ser lançado em carros novos. Os serviços já lançados no pátio continuam valendo."}
      </TextoDaFolha>
      <AcoesDaFolha>
        <Cancelar type="button" data-foco-inicial disabled={inativando} onClick={onManter}>
          Manter
        </Cancelar>
        <Cancelar type="button" $tipo="perigo" disabled={inativando} onClick={onConfirmar}>
          {inativando ? "Inativando..." : "Inativar"}
        </Cancelar>
      </AcoesDaFolha>
    </Folha>
  );
}
