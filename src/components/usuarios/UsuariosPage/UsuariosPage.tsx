"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { useToast } from "@/hooks/useToast";
import { PERFIL_USUARIO, type Usuario } from "@/types/usuario";
import { EditarUsuarioModal } from "../EditarUsuarioModal";
import { NovoUsuarioModal } from "../NovoUsuarioModal";
import { useUsuarios } from "../useUsuarios";
import { UsuariosList } from "../UsuariosList";
import { Header, Page } from "../Usuarios.styles";

// `usuario` presente = edição; ausente = cadastro.
type ModalState = { kind: "novo" } | { kind: "editar"; usuario: Usuario } | null;

export function UsuariosPage() {
  const { user, isLoading } = useCurrentUser();
  const [modal, setModal] = useState<ModalState>(null);
  const { toast, showToast, dismissToast } = useToast();
  const isAdmin = user?.perfil === PERFIL_USUARIO.Administrador;
  // Mesma consulta da lista (cache compartilhado): serve para abrir a edição de quem já tem acesso.
  const { data: usuarios } = useUsuarios({ enabled: isAdmin });

  function editarExistente(usuarioId: number) {
    const usuario = usuarios?.find((item) => item.usuarioId === usuarioId);
    setModal(usuario ? { kind: "editar", usuario } : null);
  }

  if (isLoading) {
    return (
      <Page role="status" aria-label="Carregando">
        <Skeleton height="32px" width="240px" />
      </Page>
    );
  }

  // A API é a barreira real; aqui só se evita chamá-la e mostrar erro a quem não gerencia usuários.
  if (!isAdmin) {
    return (
      <Page>
        <Text variant="heading" as="h1">
          Gestão de Usuários
        </Text>
        <Text variant="muted" role="alert">
          Você não tem permissão para gerenciar usuários. Peça a um Administrador da empresa.
        </Text>
      </Page>
    );
  }

  return (
    <Page>
      <Header>
        <Text variant="heading" as="h1">
          Gestão de Usuários
        </Text>
        <Button type="button" onClick={() => setModal({ kind: "novo" })}>
          Novo usuário
        </Button>
      </Header>
      <UsuariosList
        onNovo={() => setModal({ kind: "novo" })}
        onEditar={(usuario) => setModal({ kind: "editar", usuario })}
      />
      {modal?.kind === "novo" && (
        <NovoUsuarioModal
          onClose={() => setModal(null)}
          onSuccess={showToast}
          onEditarExistente={editarExistente}
        />
      )}
      {modal?.kind === "editar" && (
        <EditarUsuarioModal usuario={modal.usuario} onClose={() => setModal(null)} onSuccess={showToast} />
      )}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Page>
  );
}
