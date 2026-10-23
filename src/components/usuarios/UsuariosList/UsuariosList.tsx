"use client";

import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { isForbiddenError } from "@/lib/api/errors";
import { formatCPF } from "@/lib/cpf";
import { parseApiDate } from "@/lib/date";
import { formatPhone } from "@/lib/phone";
import type { Usuario } from "@/types/usuario";
import { PerfilBadge } from "../PerfilBadge";
import { useUsuarios } from "../useUsuarios";
import { EmptyState, ErrorArea, Primary, SkeletonRows, SubText, TableArea, UsuarioRow } from "../Usuarios.styles";

const SKELETON_ROWS = 5;

export interface UsuariosListProps {
  onNovo: () => void;
  onEditar: (usuario: Usuario) => void;
}

function formatData(iso: string): string {
  return parseApiDate(iso)?.toLocaleDateString("pt-BR") ?? "—";
}

function ehOProprio(usuario: Usuario, email: string | undefined): boolean {
  return Boolean(email) && usuario.email.trim().toLowerCase() === email?.trim().toLowerCase();
}

export function UsuariosList({ onNovo, onEditar }: UsuariosListProps) {
  const { user } = useCurrentUser();
  const { data, isPending, isError, error, refetch, isFetching } = useUsuarios();

  if (isError && isForbiddenError(error)) {
    return <ErroSemPermissao />;
  }

  if (isError) {
    return (
      <ErrorArea>
        <ErrorBanner role="alert">Não foi possível carregar os usuários. {error.message}</ErrorBanner>
        <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
          Tentar novamente
        </Button>
      </ErrorArea>
    );
  }

  if (isPending) {
    return (
      <TableArea role="status" aria-label="Carregando usuários">
        <SkeletonRows>
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} height="20px" />
          ))}
        </SkeletonRows>
      </TableArea>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState>
        <Text variant="muted">Nenhum usuário encontrado.</Text>
        <Button type="button" onClick={onNovo}>
          Novo usuário
        </Button>
      </EmptyState>
    );
  }

  return (
    <TableArea>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell head>Nome</TableCell>
            <TableCell head>CPF</TableCell>
            <TableCell head>Celular</TableCell>
            <TableCell head>Perfil</TableCell>
            <TableCell head>Status</TableCell>
            <TableCell head>Criado em</TableCell>
            <TableCell head align="right">
              Ações
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((usuario) => (
            <UsuarioRow key={usuario.usuarioId} data-inativo={!usuario.ativo}>
              <TableCell data-label="Nome">
                <Primary>
                  {usuario.nome}
                  {ehOProprio(usuario, user?.email) && " (você)"}
                </Primary>
                <SubText>{usuario.email}</SubText>
              </TableCell>
              <TableCell data-label="CPF" numeric>
                {formatCPF(usuario.cpf)}
              </TableCell>
              <TableCell data-label="Celular" numeric>
                {formatPhone(usuario.celular)}
              </TableCell>
              <TableCell data-label="Perfil">
                <PerfilBadge perfil={usuario.perfil} descricao={usuario.perfilDescricao} />
              </TableCell>
              <TableCell data-label="Status">
                <StatusBadge tone={usuario.ativo ? "success" : "neutral"}>
                  {usuario.ativo ? "Ativo" : "Inativo"}
                </StatusBadge>
              </TableCell>
              <TableCell data-label="Criado em" numeric>
                {formatData(usuario.dataCriacao)}
              </TableCell>
              <TableCell data-label="Ações" align="right">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-label={`Editar ${usuario.nome}`}
                  onClick={() => onEditar(usuario)}
                >
                  Editar
                </Button>
              </TableCell>
            </UsuarioRow>
          ))}
        </TableBody>
      </Table>
    </TableArea>
  );
}
