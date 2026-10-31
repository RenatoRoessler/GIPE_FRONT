"use client";

import { ReactNode, Ref, useState } from "react";
import { ActionBar } from "@/components/ui/ActionBar";
import { CredencialDados, CredencialEmpresa } from "@/components/ui/CredencialEmpresa";
import { Logo } from "@/components/ui/Logo";
import { Modal } from "@/components/ui/Modal";
import { Stepper } from "@/components/ui/Stepper";
import { Text } from "@/components/ui/Text";
import {
  Andamento,
  CompactaFixa,
  Corpo,
  CredencialArea,
  Etapa,
  Pagina,
  Principal,
  StepperArea,
  Titulos,
  Topo,
} from "./AdesaoShell.styles";

export interface AdesaoShellProps {
  etapas: string[];
  etapaAtual: number;
  // Voltar a uma etapa já concluída.
  onEtapaClick: (etapa: number) => void;
  titulo: string;
  descricao: string;
  // Recebe o foco ao trocar de etapa (leitores de tela e teclado).
  tituloRef: Ref<HTMLHeadingElement>;
  credencial: CredencialDados;
  secundaria?: ReactNode;
  principal: ReactNode;
  children: ReactNode;
}

export function AdesaoShell({
  etapas,
  etapaAtual,
  onEtapaClick,
  titulo,
  descricao,
  tituloRef,
  credencial,
  secundaria,
  principal,
  children,
}: AdesaoShellProps) {
  const [credencialAberta, setCredencialAberta] = useState(false);

  return (
    <Pagina>
      <Topo>
        <Logo align="start" size={32} compactOnMobile />
        <StepperArea>
          <Stepper steps={etapas} currentStep={etapaAtual} onStepClick={onEtapaClick} compact />
        </StepperArea>
      </Topo>

      <CompactaFixa>
        <CredencialEmpresa dados={credencial} variant="compacta" onAbrir={() => setCredencialAberta(true)} />
      </CompactaFixa>
      <Andamento>
        Etapa {etapaAtual} de {etapas.length} · {etapas[etapaAtual - 1]}
      </Andamento>

      <Corpo>
        <Principal>
          <Etapa key={etapaAtual}>
            <Titulos>
              <Text variant="heading" as="h1" ref={tituloRef} tabIndex={-1}>
                {titulo}
              </Text>
              <Text variant="muted">{descricao}</Text>
            </Titulos>
            {children}
          </Etapa>
          <ActionBar secundaria={secundaria} principal={principal} />
        </Principal>
        <CredencialArea>
          <CredencialEmpresa dados={credencial} />
        </CredencialArea>
      </Corpo>

      <Modal open={credencialAberta} title="Sua credencial" onClose={() => setCredencialAberta(false)} fullScreenOnMobile={false}>
        {credencialAberta && <CredencialEmpresa dados={credencial} />}
      </Modal>
    </Pagina>
  );
}
