"use client";

import { useEffect, useRef } from "react";
import { formaPagamentoLabel, formatDateTime } from "@/components/caixa/format";
import { StageTrack } from "@/components/ui/StageTrack";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatBRL } from "@/lib/money";
import type { Mensalista, PagamentoMensalistaResultado } from "@/types/mensalista";
import { formatCategoria } from "../format";
import { explicarVencimento, formatDiaCobranca } from "../pagamento";
import { NextCharge, Note, Seal, SealMeta, SealTitle, Section, SectionTitle, Wrapper } from "./ComprovantePagamento.styles";

export interface ComprovantePagamentoProps {
  mensalista: Mensalista;
  // null = o pagamento já estava gravado (confirmado pela listagem depois de uma falha de rede), sem os detalhes.
  resultado: PagamentoMensalistaResultado | null;
  // O mensalista estava inativo e o pagamento o ativou.
  ativado: boolean;
}

const ETAPAS = [
  { label: "Cadastro", state: "done" },
  { label: "Contrato", state: "done" },
  { label: "Pagamento", state: "done" },
] as const;

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12.5 2.8 2.8L16 9.5" />
    </svg>
  );
}

export function ComprovantePagamento({ mensalista, resultado, ativado }: ComprovantePagamentoProps) {
  const selo = useRef<HTMLDivElement>(null);
  const resumo = [mensalista.nome, mensalista.tipoMensal, formatCategoria(mensalista.categoria)].join(" · ");

  // O comprovante substitui o formulário: o foco vai para ele, que é anunciado como status.
  useEffect(() => {
    selo.current?.focus();
  }, []);

  const proxima = resultado?.proxima ?? null;
  const explicacao = proxima ? explicarVencimento(mensalista.diaVencimento, proxima.vencimento) : null;
  const valorAtualizado = Boolean(resultado && proxima && proxima.valor !== resultado.paga.valor);

  return (
    <Wrapper>
      <StageTrack
        stages={ETAPAS.map((etapa) => ({ ...etapa }))}
        size="md"
        tone="success"
        label={`Situação de ${mensalista.nome}`}
      />
      <Seal ref={selo} role="status" tabIndex={-1}>
        {resultado ? (
          <>
            <SealTitle>
              <CheckIcon />
              {`${formatBRL(resultado.paga.valor)} recebidos`}
            </SealTitle>
            <SealMeta>
              {[
                resultado.paga.formaPagamento !== null ? formaPagamentoLabel(resultado.paga.formaPagamento) : null,
                formatDateTime(resultado.paga.dataPagamento),
              ]
                .filter(Boolean)
                .join(" · ")}
            </SealMeta>
          </>
        ) : (
          <>
            <SealTitle>
              <CheckIcon />
              Pagamento já registrado
            </SealTitle>
            <SealMeta>A situação do mensalista já foi atualizada na lista.</SealMeta>
          </>
        )}
        <SealMeta>{resumo}</SealMeta>
        <SealMeta>{ativado ? "Mensalista ativado." : "Mensalista ativo."}</SealMeta>
      </Seal>

      {resultado && (
        <Section aria-label="Próxima cobrança">
          <SectionTitle>Próxima cobrança</SectionTitle>
          {proxima && proxima.valor > 0 ? (
            <NextCharge>
              <span>{`${formatBRL(proxima.valor)} · vence em ${formatDiaCobranca(proxima.vencimento)}`}</span>
              {valorAtualizado && <StatusBadge tone="info">Valor atualizado do tipo</StatusBadge>}
            </NextCharge>
          ) : (
            <NextCharge>Próxima cobrança gerada.</NextCharge>
          )}
          {explicacao && <Note>{explicacao}</Note>}
        </Section>
      )}
    </Wrapper>
  );
}
