"use client";

import NextLink from "next/link";
import { formatDataBr, formatDiaMes } from "@/components/financeiro/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatBRL } from "@/lib/money";
import { SITUACAO_FATURA, type Fatura } from "@/types/fatura";
import { ApoioCartao, CartaoFatura, CartaoTopo, Identificacao, LinhaCartao, NomeConveniada, NumeroLinkEsticado, ValorCartao } from "../FaturasMobile.styles";
import { numeroFatura, quantidadeSaidas } from "../format";
import { rotuloSituacao, tomSituacao } from "../situacao";
import { faturaUrl } from "../url";
import { VencimentoAviso } from "../VencimentoAviso";
import { avisoVencimento } from "../vencimento";

export interface FaturaCardProps {
  fatura: Fatura;
  // Hoje como AAAA-MM-DD, calculado uma vez por quem renderiza a lista.
  hoje: string;
}

// Fatura na lista do celular: quem, quanto e quando de relance. O cartão inteiro leva ao detalhe pelo link do número.
export function FaturaCard({ fatura, hoje }: FaturaCardProps) {
  const aviso = avisoVencimento(fatura, hoje);
  const cancelada = fatura.situacao === SITUACAO_FATURA.Cancelada;
  const alerta = aviso?.tipo === "vencida" || aviso?.tipo === "hoje";
  const nomeAcessivel = [
    `Fatura ${fatura.convenioFaturaId}`,
    fatura.conveniada,
    formatBRL(fatura.valorTotal),
    rotuloSituacao(fatura.situacao).toLowerCase(),
    aviso ? aviso.texto.toLowerCase() : `vencimento ${formatDataBr(fatura.vencimento)}`,
  ].join(", ");

  return (
    <CartaoFatura $alerta={alerta}>
      <CartaoTopo>
        <Identificacao>
          <NumeroLinkEsticado as={NextLink} href={faturaUrl(fatura.convenioFaturaId)} aria-label={nomeAcessivel}>
            {numeroFatura(fatura)}
          </NumeroLinkEsticado>
          <NomeConveniada title={fatura.conveniada}>{fatura.conveniada}</NomeConveniada>
        </Identificacao>
        <StatusBadge tone={tomSituacao(fatura.situacao)}>{rotuloSituacao(fatura.situacao)}</StatusBadge>
      </CartaoTopo>
      <ValorCartao $cancelada={cancelada}>{formatBRL(fatura.valorTotal)}</ValorCartao>
      {aviso ? <VencimentoAviso aviso={aviso} /> : <LinhaCartao>Vencimento {formatDataBr(fatura.vencimento)}</LinhaCartao>}
      <ApoioCartao>
        {quantidadeSaidas(fatura.quantidadeSaidas)} · emitida {formatDiaMes(fatura.dataCriacao.slice(0, 10))}
      </ApoioCartao>
    </CartaoFatura>
  );
}
