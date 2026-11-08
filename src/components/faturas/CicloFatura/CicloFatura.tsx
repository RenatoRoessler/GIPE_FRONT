"use client";

import { formaPagamentoLabel, formatDateTime } from "@/components/caixa/format";
import { formatDataBr } from "@/components/financeiro/format";
import { formatBRL } from "@/lib/money";
import { SITUACAO_FATURA, type Fatura } from "@/types/fatura";
import { Ciclo, Marca, Passo, PassoTitulo, SubText } from "../Faturas.styles";

export interface CicloFaturaProps {
  fatura: Fatura;
}

// "13/11/2026 09:00 · Ana": quando e quem, pulando o que não veio.
function quandoEQuem(data: string | null, usuario: string | null): string {
  return [data ? formatDateTime(data) : null, usuario].filter(Boolean).join(" · ");
}

// Pago a menos ou a mais que o total mostra os dois valores, sem mudar a situação da fatura.
function valorPagoPorExtenso(fatura: Fatura): string {
  const pago = fatura.valorPago ?? fatura.valorTotal;
  return pago === fatura.valorTotal ? `Pago ${formatBRL(pago)}` : `Pago ${formatBRL(pago)} de ${formatBRL(fatura.valorTotal)}`;
}

// Ciclo de vida: emitida e, depois, aguardando pagamento, paga ou cancelada. Cada passo é texto; a marca só reforça.
export function CicloFatura({ fatura }: CicloFaturaProps) {
  return (
    <Ciclo aria-label="Ciclo da fatura">
      <Passo>
        <Marca $estado="feito" aria-hidden="true" />
        <div>
          <PassoTitulo>Emitida</PassoTitulo>
          <SubText>{quandoEQuem(fatura.dataCriacao, fatura.usuario)}</SubText>
        </div>
      </Passo>
      {fatura.situacao === SITUACAO_FATURA.Paga && (
        <Passo>
          <Marca $estado="feito" aria-hidden="true" />
          <div>
            <PassoTitulo>Paga</PassoTitulo>
            <SubText>{quandoEQuem(fatura.dataPagamento, fatura.usuarioPagamento)}</SubText>
            <SubText>{[fatura.formaPagamento !== null ? formaPagamentoLabel(fatura.formaPagamento) : null, valorPagoPorExtenso(fatura)].filter(Boolean).join(" · ")}</SubText>
          </div>
        </Passo>
      )}
      {fatura.situacao === SITUACAO_FATURA.Cancelada && (
        <Passo>
          <Marca $estado="cancelado" aria-hidden="true" />
          <div>
            <PassoTitulo>Cancelada</PassoTitulo>
            <SubText>{quandoEQuem(fatura.dataCancelamento, fatura.usuarioCancelamento)}</SubText>
          </div>
        </Passo>
      )}
      {fatura.situacao === SITUACAO_FATURA.Aberta && (
        <Passo>
          <Marca $estado="pendente" aria-hidden="true" />
          <div>
            <PassoTitulo>Aguardando pagamento</PassoTitulo>
            <SubText>Vence em {formatDataBr(fatura.vencimento)}</SubText>
          </div>
        </Passo>
      )}
    </Ciclo>
  );
}
