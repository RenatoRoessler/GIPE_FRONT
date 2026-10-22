"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { formatCPF } from "@/lib/cpf";
import { PERFIL_USUARIO, type Usuario } from "@/types/usuario";
import { formatPerfil, isPerfilAtribuivel, PERFIL_OPTIONS } from "../perfil";
import { ehUltimoAdminAtivo } from "../ultimoAdmin";
import { useEditarUsuario, type EdicaoFalha } from "../useUsuarioMutations";
import { useUsuarios } from "../useUsuarios";
import { Form, Note, ReadOnlyBlock } from "../Usuarios.styles";

export interface EditarUsuarioModalProps {
  usuario: Usuario;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type Confirmacao = "inativar" | "rebaixar";

const ROTULO_FALHA: Record<EdicaoFalha["campo"], string> = {
  perfil: "Não foi possível alterar o perfil",
  acesso: "Não foi possível alterar o acesso",
};

export function EditarUsuarioModal({ usuario, onClose, onSuccess }: EditarUsuarioModalProps) {
  const ids = useId();
  const { user } = useCurrentUser();
  const { data: lista } = useUsuarios();
  const editar = useEditarUsuario();
  // O que a API já tem: muda quando uma das duas chamadas é aplicada (falha parcial).
  const [base, setBase] = useState({ perfil: usuario.perfil, ativo: usuario.ativo });
  const [perfil, setPerfil] = useState(String(usuario.perfil));
  const [ativo, setAtivo] = useState(usuario.ativo);
  const [falhas, setFalhas] = useState<EdicaoFalha[]>([]);
  const [fila, setFila] = useState<Confirmacao[]>([]);

  const atual: Usuario = { ...usuario, ...base };
  // Sem a lista não dá para saber: não trava nada e deixa a API decidir.
  const ultimoAdmin = lista !== undefined && ehUltimoAdminAtivo(atual, lista);
  const proprio = Boolean(user?.email) && usuario.email.trim().toLowerCase() === user?.email?.trim().toLowerCase();
  const perfilMudou = Number(perfil) !== base.perfil;
  const acessoMudou = ativo !== base.ativo;
  const enviando = editar.isPending;
  const perfilDesconhecido = !isPerfilAtribuivel(usuario.perfil);

  const dicaId = `${ids}-dica`;
  const ultimoAdminId = `${ids}-ultimo`;

  function confirmacoesNecessarias(): Confirmacao[] {
    const necessarias: Confirmacao[] = [];
    if (acessoMudou && !ativo) {
      necessarias.push("inativar");
    }
    if (perfilMudou && base.perfil === PERFIL_USUARIO.Administrador) {
      necessarias.push("rebaixar");
    }
    return necessarias;
  }

  function salvar() {
    setFalhas([]);
    editar.mutate(
      {
        usuarioId: usuario.usuarioId,
        perfil: perfilMudou ? Number(perfil) : undefined,
        ativo: acessoMudou ? ativo : undefined,
      },
      {
        onSuccess: (resultado) => {
          if (resultado.falhas.length === 0) {
            onSuccess("Usuário atualizado.");
            onClose();
            return;
          }
          // Só o que foi aplicado vira o novo ponto de partida; o que falhou continua pendente.
          setBase((anterior) => ({
            perfil: resultado.perfilAlterado ? Number(perfil) : anterior.perfil,
            ativo: resultado.acessoAlterado ? ativo : anterior.ativo,
          }));
          setFalhas(resultado.falhas);
        },
      },
    );
  }

  function handleSalvar() {
    const necessarias = confirmacoesNecessarias();
    if (necessarias.length > 0) {
      setFila(necessarias);
      return;
    }
    salvar();
  }

  function handleConfirmar() {
    const restantes = fila.slice(1);
    setFila(restantes);
    if (restantes.length === 0) {
      salvar();
    }
  }

  function handleClose() {
    if (!enviando) {
      onClose();
    }
  }

  const confirmando = fila[0];

  return (
    <Modal
      open
      title="Editar usuário"
      onClose={handleClose}
      closeOnBackdrop={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form={ids} disabled={enviando || ultimoAdmin || (!perfilMudou && !acessoMudou)}>
            {enviando ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      {falhas.map((falha) => (
        <ErrorBanner key={falha.campo} role="alert">
          {ROTULO_FALHA[falha.campo]}. {falha.mensagem}
        </ErrorBanner>
      ))}
      <Form
        id={ids}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleSalvar();
        }}
      >
        <ReadOnlyBlock aria-label="Dados do usuário">
          <dt>Nome</dt>
          <dd>{usuario.nome}</dd>
          <dt>CPF</dt>
          <dd>{formatCPF(usuario.cpf)}</dd>
          <dt>E-mail</dt>
          <dd>{usuario.email}</dd>
        </ReadOnlyBlock>
        {proprio && <Note role="status">Você está editando o seu próprio acesso.</Note>}
        {ultimoAdmin && (
          <Note id={ultimoAdminId} role="status">
            Esta é a única pessoa com perfil de Administrador ativo. Defina outro Administrador antes de alterar o
            perfil ou o acesso.
          </Note>
        )}
        <Select
          label="Perfil"
          value={perfil}
          onChange={(event) => setPerfil(event.target.value)}
          disabled={enviando || ultimoAdmin}
          aria-describedby={ultimoAdmin ? ultimoAdminId : dicaId}
        >
          {perfilDesconhecido && (
            <option value={usuario.perfil} disabled>
              {formatPerfil(usuario.perfil, usuario.perfilDescricao)}
            </option>
          )}
          {PERFIL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Switch
          label="Acesso ativo nesta empresa"
          checked={ativo}
          onCheckedChange={setAtivo}
          disabled={enviando || ultimoAdmin}
          aria-describedby={ultimoAdmin ? ultimoAdminId : dicaId}
        />
        <Note id={dicaId}>
          Desativar tira o acesso apenas a esta empresa; as outras empresas da pessoa não mudam. Mudanças de perfil e de
          acesso valem a partir do próximo login da pessoa.
        </Note>
      </Form>
      {confirmando === "inativar" && (
        <ConfirmDialog
          title={`Tirar o acesso de ${usuario.nome}?`}
          message="A pessoa perde o acesso apenas a esta empresa, a partir do próximo login."
          confirmLabel="Tirar acesso"
          cancelLabel="Cancelar"
          onConfirm={handleConfirmar}
          onCancel={() => setFila([])}
        />
      )}
      {confirmando === "rebaixar" && (
        <ConfirmDialog
          title="Remover perfil de Administrador?"
          message={`${usuario.nome} deixa de ser Administrador desta empresa a partir do próximo login e perde o acesso à gestão de usuários.`}
          confirmLabel="Alterar perfil"
          cancelLabel="Cancelar"
          onConfirm={handleConfirmar}
          onCancel={() => setFila([])}
        />
      )}
    </Modal>
  );
}
