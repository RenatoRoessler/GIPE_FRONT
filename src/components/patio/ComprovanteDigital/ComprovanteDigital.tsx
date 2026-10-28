"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeProvider } from "styled-components";
import { formatDateTime } from "@/components/caixa/format";
import { Button } from "@/components/ui/Button";
import { QrCode } from "@/components/ui/QrCode";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCNPJ } from "@/lib/cnpj";
import { formatPhone } from "@/lib/phone";
import { lightTheme } from "@/styles/theme";
import { corDoVeiculo } from "../patio";
import { DE_TICKET, hrefDoTicketComQuery, PARAM_DE } from "../patioUrl";
import { useComprovanteTicket } from "../useComprovanteTicket";
import { usePatioVeiculo } from "../usePatioVeiculo";
import {
  Coluna,
  DadosEstabelecimento,
  Entrada,
  Estado,
  Fechar,
  Identificacao,
  Instrucoes,
  Placa,
  Rodape,
  Tela,
  Titulo,
  Topo,
  Veiculo,
} from "./ComprovanteDigital.styles";
import { useWakeLock } from "./useWakeLock";

export interface ComprovanteDigitalProps {
  patioId: number;
}

const QR_TAMANHO = 260;

function FecharIcone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// Tela feita para o cliente: sempre clara (mesmo com o operador no tema escuro) e por cima do menu.
export function ComprovanteDigital({ patioId }: ComprovanteDigitalProps) {
  return (
    <ThemeProvider theme={lightTheme}>
      <Tela role="dialog" aria-modal="true" aria-labelledby="comprovante-titulo">
        <Conteudo patioId={patioId} />
      </Tela>
    </ThemeProvider>
  );
}

function Conteudo({ patioId }: ComprovanteDigitalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const titulo = useRef<HTMLHeadingElement>(null);
  const { veiculo, carregando, ausente } = usePatioVeiculo(patioId);
  const token = veiculo?.token ?? null;
  const { data: estabelecimento } = useComprovanteTicket(token);
  useWakeLock();

  // Aberto a partir do ticket, fechar volta no histórico; aberto por link direto, vai ao ticket sem sair do app.
  function fechar() {
    const params = new URLSearchParams(searchParams.toString());
    const doTicket = params.get(PARAM_DE) === DE_TICKET;
    params.delete(PARAM_DE);
    if (doTicket) router.back();
    else router.replace(hrefDoTicketComQuery(patioId, params.toString()));
  }

  // O foco vai ao título quando a tela abre (se ele já existe) e Esc fecha.
  useEffect(() => {
    titulo.current?.focus();
  }, [veiculo]);

  const fecharAtual = useRef(fechar);
  useEffect(() => {
    fecharAtual.current = fechar;
  });
  useEffect(() => {
    function aoTeclar(event: KeyboardEvent) {
      if (event.key === "Escape") fecharAtual.current();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, []);

  const cabecalho = (
    <Topo>
      <b>{estabelecimento?.razaoSocial ?? ""}</b>
      <Fechar type="button" onClick={fechar} aria-label="Fechar e voltar ao ticket">
        <FecharIcone />
      </Fechar>
    </Topo>
  );

  if (carregando) {
    return (
      <Coluna>
        {cabecalho}
        <div role="status" aria-label="Carregando o comprovante">
          <Skeleton width="260px" height="260px" radius="18px" />
        </div>
        <Titulo id="comprovante-titulo" ref={titulo} tabIndex={-1}>
          Comprovante Digital
        </Titulo>
      </Coluna>
    );
  }

  if (ausente || !veiculo || !token) {
    return (
      <Coluna>
        {cabecalho}
        <Titulo id="comprovante-titulo" ref={titulo} tabIndex={-1}>
          Comprovante Digital
        </Titulo>
        <Estado>
          <p role="status">{ausente || !veiculo ? "Este carro não está mais no pátio." : "Comprovante indisponível para este veículo."}</p>
          <Button type="button" onClick={fechar}>
            Voltar ao ticket
          </Button>
        </Estado>
      </Coluna>
    );
  }

  const link = `${window.location.origin}/comprovante/${encodeURIComponent(token)}`;
  const ticket = veiculo.codigoTicket !== null ? `Ticket ${veiculo.codigoTicket}` : `Seq. ${veiculo.sequencial}`;
  const cor = corDoVeiculo(veiculo.cor).texto;

  return (
    <Coluna>
      {cabecalho}
      {estabelecimento && (
        <DadosEstabelecimento>
          {estabelecimento.cnpj && (
            <span>
              CNPJ <b>{formatCNPJ(estabelecimento.cnpj)}</b>
            </span>
          )}
          {estabelecimento.endereco && <span>{estabelecimento.endereco}</span>}
          {estabelecimento.telefone && (
            <span>
              Telefone <b>{formatPhone(estabelecimento.telefone)}</b>
            </span>
          )}
        </DadosEstabelecimento>
      )}

      <Titulo id="comprovante-titulo" ref={titulo} tabIndex={-1}>
        Comprovante Digital
      </Titulo>
      <QrCode value={link} label={`QR Code do ${ticket.toLowerCase()}`} size={QR_TAMANHO} />

      <Identificacao>
        <Placa>{veiculo.placa}</Placa>
        <Veiculo>{`${veiculo.modelo ?? "—"} · ${cor}`}</Veiculo>
        <Entrada>{`Entrada ${formatDateTime(veiculo.dataHoraEntrada)} · ${ticket}`}</Entrada>
      </Identificacao>

      <Instrucoes>
        <span>
          <b>Aponte a câmera do celular</b> para o QR Code e acompanhe tempo e valor pelo link.
        </span>
        <span>Ou tire uma foto desta tela. Não precisa de cadastro.</span>
      </Instrucoes>

      <Rodape>
        <Button type="button" onClick={fechar}>
          Pronto
        </Button>
      </Rodape>
    </Coluna>
  );
}
