"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { formatDateTime } from "@/components/caixa/format";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { QrCode } from "@/components/ui/QrCode";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError } from "@/lib/api/errors";
import { consultarComprovante } from "@/lib/api/services/patio";
import { formatBRL } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import type { ComprovanteCliente } from "@/types/veiculo";
import { formatPermanencia } from "./format";
import { baixarReciboPdf } from "./reciboPdf";
import {
  ActionButton,
  ActionError,
  ActionLink,
  Actions,
  Card,
  Column,
  Company,
  Elapsed,
  ExitCard,
  Eyebrow,
  Facts,
  Footnote,
  Message,
  Muted,
  Screen,
  SkeletonStack,
  Status,
  StatusRow,
  Top,
} from "./ComprovantePublico.styles";

export interface ComprovantePublicoProps {
  token: string;
}

// Ícone decorativo de traço (o texto do botão é o nome acessível).
function ActionIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function Page({ children }: { children: ReactNode }) {
  return (
    <Screen>
      <Column>{children}</Column>
    </Screen>
  );
}

// Também usado pela rota quando o token já é inválido no servidor (sem chamar a API).
export function ComprovanteNaoEncontrado() {
  return (
    <Page>
      <Message>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3M8.5 11h5" />
        </svg>
        <h1>Comprovante não encontrado</h1>
        <p>Confira o QR code ou procure o operador do estacionamento.</p>
      </Message>
    </Page>
  );
}

function Carregando() {
  return (
    <Page>
      <Top aria-hidden="true">
        <Skeleton width="40%" height="12px" />
        <Skeleton width="70%" height="24px" />
        <Skeleton width="55%" height="14px" />
      </Top>
      <Card role="status" aria-busy="true" aria-label="Carregando comprovante">
        <SkeletonStack>
          <Skeleton width="45%" height="12px" />
          <Skeleton width="60%" height="56px" />
          <Skeleton width="50%" height="14px" />
        </SkeletonStack>
        <Skeleton height="96px" />
      </Card>
    </Page>
  );
}

// Abre o Google Maps pesquisando pelo endereço do estacionamento.
function mapsUrl(endereco: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

function Comprovante({ comprovante }: { comprovante: ComprovanteCliente }) {
  const veiculo = [comprovante.modelo, comprovante.cor].filter(Boolean).join(" · ");
  const telefoneDigits = comprovante.telefone?.replace(/\D/g, "") ?? "";
  const [baixando, setBaixando] = useState(false);
  const [erroPdf, setErroPdf] = useState(false);

  // O PDF é gerado no aparelho (sem chamada extra à API); o QR dele aponta para esta mesma página.
  async function baixarPdf() {
    setBaixando(true);
    setErroPdf(false);
    try {
      await baixarReciboPdf(comprovante, window.location.href);
    } catch {
      setErroPdf(true);
    } finally {
      setBaixando(false);
    }
  }

  return (
    <Page>
      <Top>
        <Logo align="start" size={28} />
        <Eyebrow>Comprovante de entrada</Eyebrow>
        <Company>{comprovante.razaoSocial}</Company>
        {comprovante.endereco && <p>{comprovante.endereco}</p>}
        {telefoneDigits && <p>{formatPhone(telefoneDigits)}</p>}
      </Top>
      <Card aria-label="Dados da entrada">
        <StatusRow>
          <Status>Veículo no pátio</Status>
          <Muted>Ticket Nº {comprovante.sequencial}</Muted>
        </StatusRow>
        <Elapsed>
          <span className="label">Tempo de permanência</span>
          <span className="time">{formatPermanencia(comprovante.minutosPermanencia)}</span>
          <span className="value">
            Valor até agora: <strong>{formatBRL(comprovante.valorAtual)}</strong>
          </span>
        </Elapsed>
        <Facts>
          <div>
            <dt>Placa</dt>
            <dd>
              <PlateDisplay value={comprovante.placa} size="sm" />
            </dd>
          </div>
          <div>
            <dt>Entrada</dt>
            <dd>{formatDateTime(comprovante.dataHoraEntrada)}</dd>
          </div>
          <div>
            <dt>Veículo</dt>
            <dd>{veiculo || "—"}</dd>
          </div>
          <div>
            <dt>Categoria</dt>
            <dd>{comprovante.categoriaDescricao || "—"}</dd>
          </div>
        </Facts>
      </Card>
      <Actions>
        <ActionButton type="button" onClick={() => void baixarPdf()} disabled={baixando}>
          <ActionIcon>
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
          </ActionIcon>
          {baixando ? "Gerando..." : "Baixar PDF"}
        </ActionButton>
        {comprovante.endereco && (
          <ActionLink href={mapsUrl(comprovante.endereco)} target="_blank" rel="noopener noreferrer">
            <ActionIcon>
              <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </ActionIcon>
            Como chegar
          </ActionLink>
        )}
        {telefoneDigits && (
          <ActionLink href={`tel:${telefoneDigits}`} aria-label="Ligar para o estacionamento">
            <ActionIcon>
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
            </ActionIcon>
            Ligar
          </ActionLink>
        )}
        {erroPdf && <ActionError role="alert">Não foi possível gerar o PDF. Tente novamente.</ActionError>}
      </Actions>
      <ExitCard aria-label="QR code de saída">
        <h2>Saída do veículo</h2>
        <p>Apresente este QR code ao operador na saída.</p>
        <QrCode value={comprovante.token} label="QR code de saída do veículo" size={180} />
        <span className="code">{comprovante.token}</span>
      </ExitCard>
      <Footnote>Valor calculado em {formatDateTime(comprovante.dataHoraConsulta)}</Footnote>
    </Page>
  );
}

export function ComprovantePublico({ token }: ComprovantePublicoProps) {
  const { data, error, isPending, refetch, isFetching } = useQuery({
    queryKey: ["comprovante", token],
    queryFn: () => consultarComprovante(token),
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  if (isPending) {
    return <Carregando />;
  }

  if (error) {
    if (error instanceof ApiError && error.kind === "not_found") {
      return <ComprovanteNaoEncontrado />;
    }
    return (
      <Page>
        <Message role="alert">
          <h1>Não foi possível carregar o comprovante</h1>
          <p>Verifique sua conexão e tente novamente.</p>
          <Button type="button" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? "Carregando..." : "Tentar novamente"}
          </Button>
        </Message>
      </Page>
    );
  }

  return <Comprovante comprovante={data} />;
}
