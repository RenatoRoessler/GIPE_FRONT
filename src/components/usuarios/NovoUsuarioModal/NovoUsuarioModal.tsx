"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { isValidCPF } from "@/lib/cpf";
import { onlyDigits } from "@/lib/digits";
import { useConsultaCpf } from "../useConsultaCpf";
import { useCriarUsuario } from "../useUsuarioMutations";
import { StepTitle } from "../Usuarios.styles";
import { mensagemSucesso, proximaEtapa, type CadastroEtapa } from "./cadastroEtapa";
import { EtapaCpf } from "./EtapaCpf";
import { EtapaDados } from "./EtapaDados";

export interface NovoUsuarioModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
  // CPF já vinculado à empresa: leva à edição desse usuário.
  onEditarExistente?: (usuarioId: number) => void;
}

type Dados = Extract<CadastroEtapa, { etapa: "dados" }>;

function tituloDaEtapa(dados: Dados | null): string {
  if (!dados) {
    return "Etapa 1 de 2 · Informe o CPF";
  }
  return dados.modo === "novo" ? "Etapa 2 de 2 · Dados da pessoa" : "Etapa 2 de 2 · Conferir e escolher o perfil";
}

function rotuloDoEnvio(dados: Dados | null, consultando: boolean, salvando: boolean): string {
  if (!dados) {
    return consultando ? "Consultando…" : "Continuar";
  }
  if (salvando) {
    return "Salvando…";
  }
  return dados.modo === "novo" ? "Cadastrar usuário" : "Dar acesso";
}

export function NovoUsuarioModal({ onClose, onSuccess, onEditarExistente }: NovoUsuarioModalProps) {
  const formId = useId();
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [cpf, setCpf] = useState("");
  const [cpfTouched, setCpfTouched] = useState(false);
  const [resultado, setResultado] = useState<CadastroEtapa | null>(null);
  const [dados, setDados] = useState<Dados | null>(null);

  const consulta = useConsultaCpf();
  const criar = useCriarUsuario({
    onSuccess: ({ novoCadastro }) => {
      onSuccess(mensagemSucesso(novoCadastro));
      onClose();
    },
  });
  const ocupado = consulta.isPending || criar.isPending;
  const bloqueado = resultado?.etapa === "bloqueado" ? resultado : null;

  // Ao trocar de etapa o foco vai para o título dela, para o leitor de tela acompanhar.
  useEffect(() => {
    if (dados) {
      tituloRef.current?.focus();
    }
  }, [dados]);

  function handleCpfChange(next: string) {
    setCpf(next);
    // Outro CPF: a consulta anterior não vale mais.
    setResultado(null);
    consulta.reset();
  }

  function handleConsultar() {
    setCpfTouched(true);
    if (!isValidCPF(cpf) || ocupado) {
      return;
    }
    consulta.mutate(onlyDigits(cpf), {
      onSuccess: (data) => {
        const proxima = proximaEtapa(data);
        setResultado(proxima);
        if (proxima.etapa === "dados") {
          setDados(proxima);
        }
      },
    });
  }

  function handleVoltar() {
    criar.reset();
    setDados(null);
    setResultado(null);
  }

  function handleClose() {
    if (!ocupado) {
      onClose();
    }
  }

  const editarExistente =
    bloqueado?.usuarioId != null && onEditarExistente
      ? () => onEditarExistente(bloqueado.usuarioId as number)
      : undefined;

  return (
    <Modal
      open
      title="Novo usuário"
      onClose={handleClose}
      closeOnBackdrop={false}
      footer={
        <>
          {dados ? (
            <Button type="button" variant="secondary" onClick={handleVoltar} disabled={ocupado}>
              Voltar
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={handleClose} disabled={ocupado}>
              Cancelar
            </Button>
          )}
          <Button type="submit" form={formId} disabled={ocupado || (!dados && !isValidCPF(cpf)) || bloqueado !== null}>
            {rotuloDoEnvio(dados, consulta.isPending, criar.isPending)}
          </Button>
        </>
      }
    >
      <StepTitle ref={tituloRef} tabIndex={-1}>
        {tituloDaEtapa(dados)}
      </StepTitle>
      {dados ? (
        <>
          {criar.isError && <ErrorBanner role="alert">{criar.error.message}</ErrorBanner>}
          <EtapaDados
            formId={formId}
            cpf={cpf}
            pessoa={dados.modo === "conferencia" ? dados.pessoa : undefined}
            disabled={criar.isPending}
            onSubmit={(values) => criar.mutate(values)}
          />
        </>
      ) : (
        <EtapaCpf
          formId={formId}
          cpf={cpf}
          onCpfChange={handleCpfChange}
          touched={cpfTouched}
          onBlur={() => setCpfTouched(true)}
          onSubmit={handleConsultar}
          disabled={consulta.isPending}
          erro={consulta.isError ? consulta.error.message : undefined}
          bloqueado={bloqueado !== null}
          onEditarExistente={editarExistente}
        />
      )}
    </Modal>
  );
}
