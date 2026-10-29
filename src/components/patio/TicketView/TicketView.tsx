"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListError } from "@/components/mensalistas/ListError";
import { GuardarChaveModal } from "@/components/quadros/GuardarChaveModal";
import { rotuloGancho } from "@/components/quadros/gancho";
import { useQuadros } from "@/components/quadros/useQuadros";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast } from "@/components/ui/Toast";
import { SaidaVeiculoModal } from "@/components/veiculos/SaidaVeiculoModal";
import { formatBRL } from "@/lib/money";
import type { PatioVeiculo } from "@/types/patio";
import { corDoVeiculo, rotuloCategoria, rotuloTipo } from "../patio";
import { DE_TICKET, hrefDaLista, hrefDoComprovante, lerFiltros, PARAM_DE, PARAM_SAIU, PATIO_PATH } from "../patioUrl";
import { useComprovanteTicket } from "../useComprovanteTicket";
import { usePatioVeiculo } from "../usePatioVeiculo";
import { TicketItens } from "./TicketItens";
import {
  Acoes,
  Aviso,
  Coluna,
  Colunas,
  Descricao,
  Destaque,
  Destaques,
  Estado,
  PlacaGrande,
  QrBotao,
  SaidaBotao,
  TentarValor,
  VeiculoBloco,
} from "./TicketView.styles";

export const QR_BOTAO_ID = "ticket-qr-botao";

export interface TicketViewProps {
  patioId: number;
}

function descricaoDoVeiculo(veiculo: PatioVeiculo): string {
  const cor = corDoVeiculo(veiculo.cor).texto;
  const categoria = veiculo.categoria > 0 ? rotuloCategoria(veiculo.categoria) : null;
  return [veiculo.modelo, cor !== "—" ? cor : null, categoria].filter(Boolean).join(" · ") || "—";
}

export function TicketView({ patioId }: TicketViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const filtros = lerFiltros(searchParams);
  const listaHref = hrefDaLista(filtros);

  // Com um modal aberto (a saída, a chave) a lista não se atualiza sozinha: o ticket não pode mudar debaixo do operador.
  const [saida, setSaida] = useState<PatioVeiculo | null>(null);
  const [chaveDe, setChaveDe] = useState<PatioVeiculo | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const { veiculo, carregando, ausente, erro, atualizando, recarregar } = usePatioVeiculo(patioId, { pausado: saida !== null || chaveDe !== null });
  const { data: quadros } = useQuadros();
  const comQuadros = (quadros?.length ?? 0) > 0;
  const comprovante = useComprovanteTicket(veiculo?.token ?? null);

  function voltar() {
    router.replace(listaHref);
  }

  function abrirComprovante(id: number) {
    const params = new URLSearchParams(query);
    params.set(PARAM_DE, DE_TICKET);
    router.push(hrefDoComprovante(id, params.toString()));
  }

  // O modal de saída e o de chave precisam continuar na tela mesmo quando o veículo some da lista (a saída foi registrada).
  const modais = (
    <>
      {saida && (
        <SaidaVeiculoModal
          buscaInicial={{ tipo: "placa", valor: saida.placa }}
          onClose={() => setSaida(null)}
          onSuccess={() => {
            // O veículo deixou o pátio: a lista é quem avisa e devolve o foco.
            const params = new URLSearchParams(query);
            params.set(PARAM_SAIU, saida.placa);
            router.replace(`${PATIO_PATH}?${params.toString()}`);
          }}
        />
      )}
      {chaveDe && (
        <GuardarChaveModal
          veiculo={chaveDe}
          onClose={() => setChaveDe(null)}
          onGuardado={(guardada) => {
            setChaveDe(null);
            setAviso(`Chave guardada no ${rotuloGancho(guardada.linha, guardada.coluna)}.`);
          }}
        />
      )}
      {aviso && <Toast message={aviso} variant="success" onDismiss={() => setAviso(null)} />}
    </>
  );

  // O ticket abre como popup sobre a lista do Pátio; fechar volta à lista, com a busca e os filtros.
  const janela = (conteudo: React.ReactNode, codigo?: string) => (
    <>
      <Modal open title={codigo ? `Ticket de entrada · ${codigo}` : "Ticket de entrada"} size="lg" onClose={voltar}>
        {conteudo}
      </Modal>
      {modais}
    </>
  );

  if (erro) {
    return janela(<ListError error={erro} what="o pátio" onRetry={() => void recarregar()} retrying={atualizando} />);
  }

  if (carregando) {
    return janela(
      <div role="status" aria-label="Carregando o ticket">
        <Coluna>
          <Skeleton height="120px" radius="18px" />
          <Skeleton height="76px" radius="14px" />
          <Skeleton height="220px" radius="14px" />
        </Coluna>
      </div>,
    );
  }

  if (ausente || !veiculo) {
    return janela(
      <Estado>
        <b role="status">Este carro não está mais no pátio</b>
        <p>Ele pode ter saído por outro terminal. Volte ao pátio para ver a lista atualizada.</p>
        <Button type="button" onClick={voltar}>
          Voltar ao pátio
        </Button>
      </Estado>,
    );
  }

  const mensalista = veiculo.mensalista;
  const semToken = veiculo.token === null;
  const valor = comprovante.data?.valorAtual ?? null;
  const cobrando = !mensalista && valor !== null && valor > 0;

  let valorTexto: React.ReactNode = "—";
  if (mensalista) valorTexto = "Mensal";
  else if (valor !== null) valorTexto = formatBRL(valor);
  else if (!semToken && comprovante.isPending) valorTexto = <Skeleton width="96px" height="28px" />;

  return janela(
    <Colunas>
      <Coluna>
        <VeiculoBloco aria-label="Veículo">
          <PlacaGrande>{veiculo.placa}</PlacaGrande>
          <Descricao>{descricaoDoVeiculo(veiculo)}</Descricao>
          <span>
            <StatusBadge tone={mensalista ? "mensal" : "avulso"}>{rotuloTipo(veiculo)}</StatusBadge>
          </span>
        </VeiculoBloco>

        <Destaques as="dl">
          <Destaque>
            <dt>Permanência</dt>
            <dd>{comprovante.data?.permanencia ?? veiculo.permanencia}</dd>
          </Destaque>
          <Destaque>
            <dt>Valor até agora</dt>
            <dd>{valorTexto}</dd>
            {!mensalista && comprovante.isError && (
              <TentarValor type="button" onClick={() => void comprovante.refetch()}>
                Tentar novamente
              </TentarValor>
            )}
          </Destaque>
        </Destaques>
        {semToken && <Aviso>Comprovante indisponível para este veículo.</Aviso>}
      </Coluna>

      <Coluna>
        <TicketItens veiculo={veiculo} comQuadros={comQuadros} onGuardarChave={() => setChaveDe(veiculo)} />

        <Acoes>
          {!semToken && (
            <QrBotao id={QR_BOTAO_ID} type="button" variant="secondary" onClick={() => abrirComprovante(veiculo.patioId)}>
              Mostrar QR do ticket ao cliente
            </QrBotao>
          )}
          <SaidaBotao type="button" onClick={() => setSaida(veiculo)}>
            {cobrando ? `Registrar saída · ${formatBRL(valor)}` : "Registrar saída"}
          </SaidaBotao>
        </Acoes>
      </Coluna>
    </Colunas>,
    veiculo.codigoTicket !== null ? String(veiculo.codigoTicket) : `Seq. ${veiculo.sequencial}`,
  );
}
