"use client";

import { formatDateTime } from "@/components/caixa/format";
import { formatarMinutos, rotuloCategoria } from "@/components/patio/patio";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { formatBRL } from "@/lib/money";
import { SITUACAO_FATURA, type Fatura, type FaturaItem } from "@/types/fatura";
import { AvisoCancelada, Mudo, Rodape, SubText, TableArea, ValorConveniada } from "../Faturas.styles";
import { ListaCartoes, ResumoSaidas, RodapeTotal } from "../FaturasMobile.styles";
import { quantidadeSaidas, regraConveniada } from "../format";
import { SaidaCard } from "../SaidaCard";

export interface ItensFaturaProps {
  fatura: Fatura;
  itens: FaturaItem[];
}

// Saídas da fatura, da mais antiga para a mais recente (ordem do back). O rodapé confere a soma com o valor da fatura.
export function ItensFatura({ fatura, itens }: ItensFaturaProps) {
  const celular = useIsMobile();

  // A resposta do cancelamento não traz as saídas: elas voltaram a ficar em aberto.
  if (fatura.situacao === SITUACAO_FATURA.Cancelada) {
    return <AvisoCancelada>As saídas desta fatura voltaram a ficar em aberto e entram na próxima fatura.</AvisoCancelada>;
  }

  if (itens.length === 0) {
    return <AvisoCancelada>Esta fatura não tem saídas listadas.</AvisoCancelada>;
  }

  // No celular, cada saída é um cartão compacto; o resumo no topo e o total no fim deixam conferir a soma.
  if (celular) {
    return (
      <>
        <ResumoSaidas>
          {quantidadeSaidas(fatura.quantidadeSaidas)} · {formatBRL(fatura.valorTotal)}
        </ResumoSaidas>
        <ListaCartoes>
          {itens.map((item) => (
            <SaidaCard key={item.patioConvenioId} item={item} />
          ))}
        </ListaCartoes>
        <RodapeTotal>
          <span>{quantidadeSaidas(fatura.quantidadeSaidas)}</span>
          <span>Total da fatura {formatBRL(fatura.valorTotal)}</span>
        </RodapeTotal>
      </>
    );
  }

  return (
    <TableArea $refreshing={false}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell head>Placa</TableCell>
            <TableCell head>Entrada → Saída</TableCell>
            <TableCell head align="right">
              Permanência
            </TableCell>
            <TableCell head>Regra</TableCell>
            <TableCell head align="right">
              Total
            </TableCell>
            <TableCell head align="right">
              Cliente
            </TableCell>
            <TableCell head align="right">
              Conveniada
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {itens.map((item) => (
            <TableRow key={item.patioConvenioId}>
              <TableCell data-label="Placa">
                <div>
                  <PlateDisplay value={item.placa} size="sm" />
                  <SubText>{[item.modelo, rotuloCategoria(item.categoria)].filter(Boolean).join(" · ")}</SubText>
                </div>
              </TableCell>
              <TableCell data-label="Entrada → Saída" numeric>
                <div>
                  <span>{formatDateTime(item.dataEntrada)}</span>
                  <SubText>até {formatDateTime(item.dataSaida)}</SubText>
                </div>
              </TableCell>
              <TableCell data-label="Permanência" align="right" numeric>
                {formatarMinutos(item.minutosPermanencia)}
              </TableCell>
              <TableCell data-label="Regra">
                <div>
                  <span>{regraConveniada(item)}</span>
                  {item.rotatividade && <SubText>{item.rotatividade}</SubText>}
                </div>
              </TableCell>
              <TableCell data-label="Total" align="right" numeric>
                <Mudo>{formatBRL(item.valorTotal)}</Mudo>
              </TableCell>
              <TableCell data-label="Cliente" align="right" numeric>
                <Mudo>{formatBRL(item.valorCliente)}</Mudo>
              </TableCell>
              <TableCell data-label="Conveniada" align="right" numeric>
                <ValorConveniada>{formatBRL(item.valorConveniada)}</ValorConveniada>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Rodape>
        <span>{quantidadeSaidas(fatura.quantidadeSaidas)}</span>
        <span>Total da fatura {formatBRL(fatura.valorTotal)}</span>
      </Rodape>
    </TableArea>
  );
}
