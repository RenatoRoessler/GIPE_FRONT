"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { filtrarServicos, precoParaCategoria } from "../catalogo";
import { formatCentavos } from "../format";
import { ServicoOpcao } from "../ServicoOpcao";
import { useServicos } from "../useServicos";
import { useAcrescentarServicos } from "../useServicosDoVeiculo";
import { Cabecalho, Lista, Mensagem, Placa, Resumo, Rodape, Total } from "./AcrescentarServicosModal.styles";

export interface AcrescentarServicosModalProps {
  idPatio: number;
  placa: string;
  // Categoria do veículo: define o preço de cada serviço e quais ele aceita.
  categoria: number;
  // Nome da categoria, para o cabeçalho ("Carro médio · preços desta categoria").
  categoriaRotulo: string;
  onClose: () => void;
  onAcrescentado: (quantidade: number) => void;
}

function contar(quantidade: number): string {
  return quantidade === 1 ? "1 serviço selecionado" : `${quantidade} serviços selecionados`;
}

// Escolhe, entre os serviços ativos do catálogo, os que entram no veículo. O que não atende a categoria dele fica
// desabilitado, com o motivo em texto. Sobe do rodapé no celular e vira painel lateral nas telas grandes.
export function AcrescentarServicosModal({ idPatio, placa, categoria, categoriaRotulo, onClose, onAcrescentado }: AcrescentarServicosModalProps) {
  const catalogo = useServicos(true);
  const acrescentar = useAcrescentarServicos(idPatio);
  const [escolhidos, setEscolhidos] = useState<number[]>([]);
  const [busca, setBusca] = useState("");
  const enviando = acrescentar.isPending;

  const ativos = (catalogo.data ?? []).filter((servico) => servico.ativo);
  const visiveis = filtrarServicos(ativos, { situacao: "todos", q: busca });
  // O total vem de tudo o que foi escolhido, mesmo o que a busca esconde agora.
  const total = ativos.reduce((soma, servico) => (escolhidos.includes(servico.id) ? soma + (precoParaCategoria(servico, categoria) ?? 0) : soma), 0);

  function alternar(id: number, marcado: boolean) {
    setEscolhidos((atuais) => (marcado ? [...atuais, id] : atuais.filter((outro) => outro !== id)));
  }

  function confirmar() {
    acrescentar.mutate(escolhidos, { onSuccess: () => onAcrescentado(escolhidos.length) });
  }

  function corpo() {
    if (catalogo.isPending) {
      return (
        <div role="status" aria-label="Carregando os serviços">
          <Skeleton height="64px" radius="14px" />
          <Skeleton height="64px" radius="14px" />
          <Skeleton height="64px" radius="14px" />
        </div>
      );
    }
    if (catalogo.isError) {
      return (
        <>
          <ErrorBanner role="alert">{catalogo.error.message}</ErrorBanner>
          <Button variant="secondary" onClick={() => void catalogo.refetch()}>
            Tentar novamente
          </Button>
        </>
      );
    }
    if (ativos.length === 0) {
      return <Mensagem>Nenhum serviço ativo no catálogo.</Mensagem>;
    }
    if (visiveis.length === 0) {
      return (
        <>
          <Mensagem role="status">Nenhum serviço encontrado.</Mensagem>
          <Button variant="secondary" size="sm" onClick={() => setBusca("")}>
            Limpar busca
          </Button>
        </>
      );
    }
    return (
      <Lista aria-label="Serviços do catálogo">
        {visiveis.map((servico) => (
          <li key={servico.id}>
            <ServicoOpcao
              servico={servico}
              precoCentavos={precoParaCategoria(servico, categoria)}
              marcado={escolhidos.includes(servico.id)}
              desabilitado={enviando}
              onAlternar={alternar}
            />
          </li>
        ))}
      </Lista>
    );
  }

  return (
    <BottomSheet
      open
      title="Adicionar serviços"
      onClose={enviando ? () => {} : onClose}
      footer={
        <Rodape>
          <Resumo aria-live="polite">
            <span>{contar(escolhidos.length)}</span>
            <Total>{escolhidos.length > 0 ? `+ ${formatCentavos(total)}` : ""}</Total>
          </Resumo>
          <Button type="button" onClick={confirmar} disabled={escolhidos.length === 0 || enviando}>
            {enviando ? "Adicionando..." : escolhidos.length > 0 ? `Adicionar ao ticket · + ${formatCentavos(total)}` : "Adicionar ao ticket"}
          </Button>
        </Rodape>
      }
    >
      <Cabecalho>
        <Placa>{placa}</Placa>
        <span>
          {categoriaRotulo} · preços desta categoria
        </span>
      </Cabecalho>
      <Input
        label="Buscar serviço"
        type="search"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        autoComplete="off"
        data-autofocus
      />
      {acrescentar.isError && <ErrorBanner role="alert">{acrescentar.error.message}</ErrorBanner>}
      {corpo()}
    </BottomSheet>
  );
}
