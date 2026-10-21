"use client";

import { formatDateTime } from "@/components/caixa/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableCell } from "@/components/ui/Table";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { PatioVeiculo } from "@/types/patio";
import type { CategoriaVeiculo } from "@/types/veiculo";
import { CategoriaIcon } from "@/components/veiculos/categoriaIcons";
import { categoriaConhecida, corDoVeiculo, rotuloCategoria } from "../patio";
import {
  AcoesCelula,
  Amostra,
  CategoriaLinha,
  ComprovanteLink,
  ComprovanteVazio,
  CorLinha,
  Linha,
  Modelo,
  Permanencia,
  PlacaCelula,
  PrecoCelula,
  SaidaBotao,
  Sub,
  Truncar,
  VeiculoCelula,
} from "./PatioView.styles";

export interface PatioLinhaProps {
  veiculo: PatioVeiculo;
  onRegistrarSaida: (veiculo: PatioVeiculo) => void;
}

const TRACO = "—";

function DocumentoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 12h5M10 16h5" />
    </svg>
  );
}

export function PatioLinha({ veiculo, onRegistrarSaida }: PatioLinhaProps) {
  const celular = useIsMobile();
  const cor = corDoVeiculo(veiculo.cor);
  const tabela = veiculo.rotatividadeDescricao ?? TRACO;
  const operador = veiculo.usuarioEntrada ?? TRACO;
  const ticket = veiculo.codigoTicket !== null ? ` · Ticket ${veiculo.codigoTicket}` : "";

  return (
    <Linha data-patio-linha={veiculo.patioId}>
      <TableCell data-label="Placa">
        <PlacaCelula>
          <PlateDisplay value={veiculo.placa} size={celular ? "sm" : "md"} />
          {veiculo.mensalista && <StatusBadge tone="info">Mensalista</StatusBadge>}
        </PlacaCelula>
      </TableCell>
      <TableCell data-label="Veículo">
        <VeiculoCelula>
          <Modelo>{veiculo.modelo ?? TRACO}</Modelo>
          <CorLinha>
            {cor.amostra && <Amostra $cor={cor.amostra} aria-hidden="true" />}
            {cor.texto}
          </CorLinha>
          <CategoriaLinha>
            {categoriaConhecida(veiculo.categoria) && <CategoriaIcon categoria={veiculo.categoria as CategoriaVeiculo} />}
            {rotuloCategoria(veiculo.categoria)}
          </CategoriaLinha>
        </VeiculoCelula>
      </TableCell>
      <TableCell data-label="Entrada">
        <span>{formatDateTime(veiculo.dataHoraEntrada)}</span>
        <Sub>{`Seq. ${veiculo.sequencial}${ticket}`}</Sub>
      </TableCell>
      <TableCell data-label="Permanência">
        <Permanencia>{veiculo.permanencia || TRACO}</Permanencia>
      </TableCell>
      <TableCell data-label="Tabela e operador">
        <PrecoCelula>
          <Truncar title={tabela}>{tabela}</Truncar>
          <Truncar title={operador}>{operador}</Truncar>
        </PrecoCelula>
      </TableCell>
      <TableCell data-label="Ações" align="right">
        <AcoesCelula>
          <SaidaBotao
            type="button"
            size="sm"
            aria-label={`Registrar saída de ${veiculo.placa}`}
            onClick={() => onRegistrarSaida(veiculo)}
          >
            Registrar saída
          </SaidaBotao>
          {!veiculo.token && <ComprovanteVazio aria-hidden="true" />}
          {veiculo.token && (
            <ComprovanteLink
              href={`/comprovante/${veiculo.token}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver comprovante de ${veiculo.placa} (abre em nova aba)`}
              title="Ver comprovante"
            >
              <DocumentoIcon />
            </ComprovanteLink>
          )}
        </AcoesCelula>
      </TableCell>
    </Linha>
  );
}
