"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PlateFrame, PlateInput, PlateRow } from "@/components/form/PlateField.styles";
import { useTecladoCampo } from "@/components/teclado";
import { ErrorText, Field, HintText, Label } from "@/components/ui/Input/Input.styles";
import { Logo } from "@/components/ui/Logo";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { ApiError } from "@/lib/api/errors";
import { consultarComprovantePorPlaca } from "@/lib/api/services/patio";
import { isValidPlaca, normalizePlaca } from "@/lib/placa";
import { TECLADO_PLACA } from "@/lib/teclado/tipos";
import { Card, Column, Company, Eyebrow, Footnote, Message, Screen, Top } from "../ComprovantePublico/ComprovantePublico.styles";
import { Aviso, SubmitButton, VisuallyHidden } from "./ConsultaTicketPublica.styles";

export interface ConsultaTicketPublicaProps {
  empresaGuid: string;
}

const PLACA_INCOMPLETA = "Informe a placa completa, com 7 caracteres.";

function Page({ children }: { children: React.ReactNode }) {
  return (
    <Screen>
      <Column>{children}</Column>
    </Screen>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
  );
}

// Também usado pela rota quando o identificador da empresa já é inválido (sem formulário).
export function LinkInvalido() {
  return (
    <Page>
      <Message>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3M8.5 11h5" />
        </svg>
        <h1>Link inválido</h1>
        <p>Leia novamente o QR code do estacionamento ou fale com o operador.</p>
      </Message>
    </Page>
  );
}

export function ConsultaTicketPublica({ empresaGuid }: ConsultaTicketPublicaProps) {
  const router = useRouter();
  // Mesmo teclado de placa da entrada: em aparelho de toque substitui o do sistema; no computador, só filtra o que é digitado.
  const tecladoProps = useTecladoCampo(TECLADO_PLACA);
  const [placa, setPlaca] = useState("");
  const [erroPlaca, setErroPlaca] = useState<string | null>(null);
  // A mutation termina antes de a navegação acabar: o botão segue ocupado até a página trocar.
  const [navegando, setNavegando] = useState(false);

  const consulta = useMutation({
    mutationFn: async (placaBusca: string) => {
      const comprovante = await consultarComprovantePorPlaca(empresaGuid, placaBusca);
      if (!comprovante?.token) {
        throw new ApiError("unknown");
      }
      return comprovante;
    },
    onSuccess: (comprovante) => {
      setNavegando(true);
      router.push(`/comprovante/${encodeURIComponent(comprovante.token)}`);
    },
  });

  const ocupado = consulta.isPending || navegando;
  const naoEncontrado = consulta.error instanceof ApiError && consulta.error.kind === "not_found";
  const falhou = consulta.isError && !naoEncontrado;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ocupado) return;
    if (!isValidPlaca(placa)) {
      setErroPlaca(PLACA_INCOMPLETA);
      (event.currentTarget.elements.namedItem("placa") as HTMLInputElement | null)?.focus();
      return;
    }
    setErroPlaca(null);
    consulta.mutate(normalizePlaca(placa));
  }

  function handleChange(value: string) {
    setPlaca(normalizePlaca(value));
    setErroPlaca(null);
    if (consulta.isError) consulta.reset();
  }

  return (
    <Page>
      <Top>
        <Logo align="start" size={28} />
        <Eyebrow>Ticket digital</Eyebrow>
        <Company>Consulte seu ticket</Company>
        <p>Digite a placa do seu veículo.</p>
      </Top>
      <Card as="form" noValidate onSubmit={handleSubmit} aria-label="Consultar ticket">
        <Field>
          <Label htmlFor="ticket-placa">Placa do veículo</Label>
          <PlateFrame>
            <PlateDisplay value={placa} size="lg">
              <PlateRow>
                <PlateInput
                  id="ticket-placa"
                  name="placa"
                  value={placa}
                  onChange={(event) => handleChange(event.target.value)}
                  placeholder="ABC1D23"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={ocupado}
                  aria-invalid={Boolean(erroPlaca)}
                  aria-describedby={erroPlaca ? "ticket-placa-erro" : "ticket-placa-dica"}
                  {...tecladoProps}
                />
              </PlateRow>
            </PlateDisplay>
          </PlateFrame>
          {erroPlaca ? (
            <ErrorText id="ticket-placa-erro" role="alert">
              {erroPlaca}
            </ErrorText>
          ) : (
            <HintText id="ticket-placa-dica" $tone="muted">
              Informe do jeito que está na placa. Hífen e espaço não importam.
            </HintText>
          )}
        </Field>

        {naoEncontrado && (
          <Aviso role="alert">
            <strong>
              <AlertIcon />
              Ticket não encontrado
            </strong>
            <p>Confira a placa digitada. Se estiver certa, fale com o operador do estacionamento.</p>
          </Aviso>
        )}
        {falhou && (
          <Aviso role="alert">
            <strong>
              <AlertIcon />
              Não foi possível consultar
            </strong>
            <p>Verifique sua conexão e tente novamente.</p>
          </Aviso>
        )}

        <SubmitButton type="submit" disabled={ocupado}>
          {ocupado ? "Buscando..." : falhou ? "Tentar novamente" : "Buscar"}
        </SubmitButton>
        <VisuallyHidden role="status">{ocupado ? "Buscando ticket" : ""}</VisuallyHidden>
      </Card>
      <Footnote>Dúvidas? Fale com o operador do estacionamento.</Footnote>
    </Page>
  );
}
