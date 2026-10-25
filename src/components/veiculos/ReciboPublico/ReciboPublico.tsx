"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { formatDateTime } from "@/components/caixa/format";
import { NotaFiscalModal } from "@/components/notas/NotaFiscalModal";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ApiError } from "@/lib/api/errors";
import { consultarRecibo } from "@/lib/api/services/patio";
import { formatCNPJ } from "@/lib/cnpj";
import { formatBRL } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import type { ReciboCliente } from "@/types/veiculo";
import {
  ActionButton,
  ActionError,
  Card,
  Company,
  Footnote,
  Message,
  Muted,
  SkeletonStack,
  Status,
  Top,
} from "../ComprovantePublico/ComprovantePublico.styles";
import { formatPermanencia } from "../ComprovantePublico/format";
import { valorDoRecibo } from "./format";
import { baixarReciboSaidaPdf } from "./reciboSaidaPdf";
import {
  Ledger,
  PlateLine,
  Picote,
  ReciboActions,
  ReciboColumn,
  ReciboEyebrow,
  ReciboScreen,
  ReciboTop,
  Slip,
  SlipHead,
  Total,
} from "./ReciboPublico.styles";

export interface ReciboPublicoProps {
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
    <ReciboScreen>
      <ReciboColumn>{children}</ReciboColumn>
    </ReciboScreen>
  );
}

// Também usado pela rota quando o código já é inválido no servidor (sem chamar a API).
export function ReciboNaoEncontrado() {
  return (
    <Page>
      <Message>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3M8.5 11h5" />
        </svg>
        <h1>Recibo não encontrado</h1>
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
      <Card role="status" aria-busy="true" aria-label="Carregando recibo">
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

function Recibo({ recibo, token }: { recibo: ReciboCliente; token: string }) {
  const veiculo = [recibo.modelo, recibo.cor].filter(Boolean).join(" · ");
  const telefoneDigits = recibo.telefone?.replace(/\D/g, "") ?? "";
  const valor = valorDoRecibo(recibo.valor);
  const mensalista = recibo.mensalista === true;
  // Mensalista (ou valor zero) não paga: nada de total nem de forma de pagamento.
  const semCobranca = mensalista || valor === 0;
  const queryClient = useQueryClient();
  const [notaAberta, setNotaAberta] = useState(false);
  // Uma nota por recibo: depois de solicitada (ou se já havia), o botão some.
  const podeSolicitarNota = !recibo.notaFiscalSolicitada && !semCobranca;
  const [baixando, setBaixando] = useState(false);
  const [erroPdf, setErroPdf] = useState(false);

  // O PDF é gerado no aparelho (sem chamada extra à API); o QR dele aponta para esta mesma página.
  async function baixarPdf() {
    setBaixando(true);
    setErroPdf(false);
    try {
      await baixarReciboSaidaPdf(recibo, window.location.href);
    } catch {
      setErroPdf(true);
    } finally {
      setBaixando(false);
    }
  }

  return (
    <Page>
      <ReciboTop>
        <Logo align="start" size={28} />
        <ReciboEyebrow>Recibo de saída</ReciboEyebrow>
        <Company>{recibo.razaoSocial}</Company>
        {recibo.cnpj && <p>CNPJ {formatCNPJ(recibo.cnpj)}</p>}
        {recibo.endereco && <p>{recibo.endereco}</p>}
        {telefoneDigits && <p>{formatPhone(telefoneDigits)}</p>}
      </ReciboTop>
      <Slip aria-label="Dados da saída">
        <SlipHead>
          <Status>Saída registrada</Status>
          {recibo.categoriaNome && <Muted>{recibo.categoriaNome}</Muted>}
        </SlipHead>
        <PlateLine>
          <PlateDisplay value={recibo.placa} size="md" />
          <span className="veiculo">{veiculo || "—"}</span>
        </PlateLine>
        <Ledger>
          <div>
            <dt>Entrada</dt>
            <dd>{formatDateTime(recibo.dataEntrada)}</dd>
          </div>
          <div>
            <dt>Saída</dt>
            <dd>{formatDateTime(recibo.dataSaida)}</dd>
          </div>
          <div>
            <dt>Permanência</dt>
            <dd>{formatPermanencia(recibo.minutosPermanencia)}</dd>
          </div>
        </Ledger>
        <Picote aria-hidden="true">
          <hr />
        </Picote>
        <Total>
          <div className="linha">
            <span className="label">{semCobranca ? "Valor" : "Total pago"}</span>
            <span className="amount">{semCobranca ? "Sem cobrança" : formatBRL(valor)}</span>
          </div>
          {!semCobranca && recibo.descricaoFormaPagamento && (
            <div className="method">
              <span>Forma de pagamento</span>
              <strong>{recibo.descricaoFormaPagamento}</strong>
            </div>
          )}
          {mensalista && <StatusBadge tone="info">Mensalista</StatusBadge>}
        </Total>
      </Slip>
      <ReciboActions>
        <ActionButton type="button" onClick={() => void baixarPdf()} disabled={baixando}>
          <ActionIcon>
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
          </ActionIcon>
          {baixando ? "Gerando..." : "Baixar PDF"}
        </ActionButton>
        <ActionButton type="button" onClick={() => window.print()}>
          <ActionIcon>
            <path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M6 14h12v7H6z" />
          </ActionIcon>
          Imprimir
        </ActionButton>
        {podeSolicitarNota && (
          <ActionButton type="button" aria-haspopup="dialog" onClick={() => setNotaAberta(true)}>
            <ActionIcon>
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6" />
            </ActionIcon>
            Solicitar nota
          </ActionButton>
        )}
        {erroPdf && <ActionError role="alert">Não foi possível gerar o PDF. Tente novamente.</ActionError>}
      </ReciboActions>
      {recibo.notaFiscalSolicitada && <Footnote>Nota fiscal solicitada.</Footnote>}
      {notaAberta && (
        <NotaFiscalModal
          token={recibo.token}
          valor={valor}
          placa={recibo.placa}
          onClose={() => setNotaAberta(false)}
          // Atualiza o recibo em memória: o botão some e o rodapé passa a dizer que a nota foi solicitada.
          onSolicitada={() => queryClient.setQueryData<ReciboCliente>(["recibo", token], { ...recibo, notaFiscalSolicitada: true })}
        />
      )}
    </Page>
  );
}

export function ReciboPublico({ token }: ReciboPublicoProps) {
  const { data, error, isPending, refetch, isFetching } = useQuery({
    queryKey: ["recibo", token],
    queryFn: () => consultarRecibo(token),
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  if (isPending) {
    return <Carregando />;
  }

  if (error) {
    if (error instanceof ApiError && error.kind === "not_found") {
      return <ReciboNaoEncontrado />;
    }
    return (
      <Page>
        <Message role="alert">
          <h1>Não foi possível carregar o recibo</h1>
          <p>Verifique sua conexão e tente novamente.</p>
          <Button type="button" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? "Carregando..." : "Tentar novamente"}
          </Button>
        </Message>
      </Page>
    );
  }

  return <Recibo recibo={data} token={token} />;
}
