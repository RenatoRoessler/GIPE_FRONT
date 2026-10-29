"use client";

import { useRef } from "react";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Text } from "@/components/ui/Text";
import { LeitorQrSaida } from "@/components/veiculos/LeitorQrSaida";
import { ApiError, isForbiddenError } from "@/lib/api/errors";
import { ErroArea, LeitorArea, Page, TitleGroup } from "../Carimbo.styles";
import { TicketCarimbado } from "../TicketCarimbado";
import { useCarimbar } from "../useCarimbar";

export function CarimboPage() {
  const leitorRef = useRef<HTMLDivElement>(null);
  const { carimbar, tentarNovamente, reiniciar, data, error, isPending, isError, isSuccess } = useCarimbar();

  function handleOutro() {
    reiniciar();
    // O leitor volta a ser montado: o foco segue para o visor, onde a próxima leitura começa.
    requestAnimationFrame(() => leitorRef.current?.querySelector<HTMLElement>("button")?.focus());
  }

  // Falha de rede ou de tempo pode ser passageira: oferece reenviar o mesmo ticket, sem nova leitura.
  const falhaDeConexao = isError && error instanceof ApiError && (error.kind === "network" || error.kind === "timeout");

  return (
    <Page>
      <TitleGroup>
        <Text variant="heading" as="h1">
          Carimbar ticket
        </Text>
        <Text variant="muted">Aponte a câmera para o QR Code do ticket de entrada do cliente.</Text>
      </TitleGroup>

      {isError && isForbiddenError(error) ? (
        <ErroSemPermissao message="Você não tem permissão para carimbar tickets." />
      ) : isSuccess ? (
        <TicketCarimbado carimbo={data} onOutro={handleOutro} />
      ) : (
        <>
          {isError && (
            <ErroArea>
              <ErrorBanner role="alert">{error.message}</ErrorBanner>
              {falhaDeConexao && (
                <Button type="button" variant="secondary" onClick={tentarNovamente}>
                  Tentar novamente
                </Button>
              )}
            </ErroArea>
          )}
          <LeitorArea ref={leitorRef}>
            <LeitorQrSaida buscando={isPending} onToken={carimbar} onInvalido={() => undefined} />
          </LeitorArea>
        </>
      )}
    </Page>
  );
}
