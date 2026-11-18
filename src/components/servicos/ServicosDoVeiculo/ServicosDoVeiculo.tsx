"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { rotuloCategoria } from "@/components/patio/patio";
import { useCan } from "@/hooks/useCan";
import { AREA } from "@/lib/permissoes";
import { AcrescentarServicosModal } from "../AcrescentarServicosModal";
import { formatCentavos } from "../format";
import { resumirServicos } from "../resumo";
import { ServicoDetalheSheet } from "../ServicoDetalheSheet";
import { ServicoLinha } from "../ServicoLinha";
import { useServicosDoVeiculo, useServicosHabilitados } from "../useServicosDoVeiculo";
import { Adicionar, BotaoVazio, Cabecalho, Lista, Secao, Subtotal, Titulo } from "./ServicosDoVeiculo.styles";

export interface ServicosDoVeiculoProps {
  idPatio: number;
  placa: string;
  // Categoria do veículo, para o preço e para o que ele aceita ao acrescentar.
  categoria: number;
  // Recebe o aviso de sucesso (o ticket o mostra no seu Toast).
  onAviso: (mensagem: string) => void;
  // Diz ao ticket quando uma folha de serviços está aberta, para ele não se atualizar debaixo dela.
  onFolhaAberta?: (aberta: boolean) => void;
}

// Serviços do veículo dentro do ticket do Pátio: o que foi pedido, em que pé está e quanto vale. Só existe quando a
// empresa liga os serviços na configuração. Cancelados não aparecem: o ticket mostra o que vai ser cobrado.
export function ServicosDoVeiculo({ idPatio, placa, categoria, onAviso, onFolhaAberta }: ServicosDoVeiculoProps) {
  const habilitado = useServicosHabilitados();
  const podeGerir = useCan(AREA.ServicosPatio);
  const podeAgir = useCan(AREA.Servicos);
  const [acrescentando, setAcrescentando] = useState(false);
  const [detalheId, setDetalheId] = useState<number | null>(null);
  const servicos = useServicosDoVeiculo(idPatio, false, habilitado);
  const { ativos, subtotalCentavos } = resumirServicos(servicos.data);
  const detalhe = ativos.find((servico) => servico.id === detalheId) ?? null;
  const folhaAberta = acrescentando || detalhe !== null;

  useEffect(() => {
    onFolhaAberta?.(folhaAberta);
    return () => onFolhaAberta?.(false);
  }, [folhaAberta, onFolhaAberta]);

  if (!habilitado) return null;

  function corpo() {
    if (servicos.isPending) {
      return (
        <div role="status" aria-label="Carregando os serviços do veículo">
          <Skeleton height="44px" />
        </div>
      );
    }
    if (servicos.isError) {
      return (
        <>
          <ErrorBanner role="alert">{servicos.error.message}</ErrorBanner>
          <Button variant="secondary" size="sm" onClick={() => void servicos.refetch()}>
            Tentar novamente
          </Button>
        </>
      );
    }
    if (ativos.length === 0) {
      return podeGerir ? (
        <BotaoVazio type="button" onClick={() => setAcrescentando(true)}>
          <span aria-hidden="true">+</span> Adicionar serviço
        </BotaoVazio>
      ) : null;
    }
    return (
      <>
        <Lista aria-label={`Serviços de ${placa}`}>
          {ativos.map((servico) => (
            <ServicoLinha key={servico.id} servico={servico} onAcoes={podeAgir ? (item) => setDetalheId(item.id) : undefined} />
          ))}
        </Lista>
        <Subtotal>
          Subtotal serviços <b>{formatCentavos(subtotalCentavos)}</b>
        </Subtotal>
      </>
    );
  }

  const comServicos = ativos.length > 0;

  return (
    <Secao aria-label="Serviços do veículo">
      <Cabecalho>
        <Titulo>
          {comServicos ? `Serviços · ${ativos.length}` : "Serviços adicionais"}
        </Titulo>
        {podeGerir && comServicos && (
          <Adicionar type="button" onClick={() => setAcrescentando(true)}>
            + Adicionar
          </Adicionar>
        )}
      </Cabecalho>
      {corpo()}
      {acrescentando && (
        <AcrescentarServicosModal
          idPatio={idPatio}
          placa={placa}
          categoria={categoria}
          categoriaRotulo={rotuloCategoria(categoria)}
          onClose={() => setAcrescentando(false)}
          onAcrescentado={(quantidade) => {
            setAcrescentando(false);
            onAviso(quantidade === 1 ? "Serviço adicionado." : "Serviços adicionados.");
          }}
        />
      )}
      {detalhe && <ServicoDetalheSheet idPatio={idPatio} placa={placa} servico={detalhe} onClose={() => setDetalheId(null)} onAviso={onAviso} />}
    </Secao>
  );
}
