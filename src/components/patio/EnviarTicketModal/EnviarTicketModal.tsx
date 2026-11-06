"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { formatPhone } from "@/lib/phone";
import { type CanalEnvio, hrefDoEnvio, mensagemDoTicket, validarContato } from "../envioTicket";
import { linkDoTicket } from "../ticketLink";
import { Corpo, Identificacao, Previa } from "./EnviarTicketModal.styles";

export interface EnviarTicketModalProps {
  placa: string;
  // Sem token não há link do ticket (RF8): o popup só avisa.
  token: string | null;
  estacionamento?: string;
  onClose: () => void;
  onEnviado: (canal: CanalEnvio) => void;
}

const TITULO = "Enviar ticket ao cliente";

const ICONE = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const CANAIS = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: (
      <svg {...ICONE}>
        <path d="M4 20l1.2-4A8 8 0 1 1 8 18.8L4 20Z" />
      </svg>
    ),
  },
  {
    value: "email",
    label: "E-mail",
    icon: (
      <svg {...ICONE}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
];

const CAMPO: Record<CanalEnvio, { label: string; placeholder: string; hint: string; botao: string }> = {
  whatsapp: { label: "WhatsApp do cliente", placeholder: "(11) 91234-5678", hint: "Informe o DDD e o número.", botao: "Abrir WhatsApp" },
  email: { label: "E-mail do cliente", placeholder: "cliente@exemplo.com", hint: "Ex.: nome@dominio.com", botao: "Abrir e-mail" },
};

export function EnviarTicketModal({ placa, token, estacionamento, onClose, onEnviado }: EnviarTicketModalProps) {
  const [canal, setCanal] = useState<CanalEnvio>("whatsapp");
  const [contato, setContato] = useState("");
  const [tocado, setTocado] = useState(false);
  const corpoRef = useRef<HTMLDivElement>(null);
  const primeiraRenderizacao = useRef(true);

  // Ao trocar de canal o campo é outro: o foco volta a ele (na abertura, quem foca é o data-autofocus do Modal).
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    corpoRef.current?.querySelector<HTMLInputElement>("input[data-autofocus]")?.focus();
  }, [canal]);

  if (token === null) {
    return (
      <Modal open title={TITULO} size="sm" fullScreenOnMobile={false} onClose={onClose} footer={<Button type="button" onClick={onClose}>Fechar</Button>}>
        <ErrorBanner role="alert">Não foi possível gerar o link do ticket.</ErrorBanner>
      </Modal>
    );
  }

  const dados = { placa, estacionamento, link: linkDoTicket(token) };
  const erro = validarContato(canal, contato);
  const campo = CAMPO[canal];

  function trocarCanal(valor: string) {
    setCanal(valor as CanalEnvio);
    setContato("");
    setTocado(false);
  }

  function enviar() {
    setTocado(true);
    if (erro) {
      return;
    }
    // O aplicativo precisa abrir no mesmo gesto do clique, senão o navegador bloqueia.
    const href = hrefDoEnvio(canal, contato, dados);
    if (canal === "whatsapp") {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = href;
    }
    onEnviado(canal);
    onClose();
  }

  return (
    <Modal
      open
      title={TITULO}
      size="sm"
      fullScreenOnMobile={false}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={erro !== null} onClick={enviar}>
            {campo.botao}
          </Button>
        </>
      }
    >
      <Corpo ref={corpoRef}>
        <Identificacao>
          Ticket de <strong>{placa}</strong>
        </Identificacao>
        <OptionGroup legend="Enviar por" options={CANAIS} value={canal} onChange={trocarCanal} columns={2} />
        <Input
          // A chave refaz o campo ao trocar de canal e devolve o foco a ele.
          key={canal}
          data-autofocus
          label={campo.label}
          type={canal === "whatsapp" ? "tel" : "email"}
          inputMode={canal === "whatsapp" ? "tel" : "email"}
          autoComplete="off"
          autoCapitalize="none"
          placeholder={campo.placeholder}
          hint={campo.hint}
          value={contato}
          error={tocado && erro ? erro : undefined}
          onChange={(event) => setContato(canal === "whatsapp" ? formatPhone(event.target.value) : event.target.value)}
          onBlur={() => setTocado(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              enviar();
            }
          }}
        />
        <Previa aria-label="Prévia da mensagem">
          <figcaption>Mensagem que será aberta no aplicativo</figcaption>
          <p>{mensagemDoTicket(dados)}</p>
        </Previa>
      </Corpo>
    </Modal>
  );
}
