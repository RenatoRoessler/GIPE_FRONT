"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPerfil } from "./perfil";

export interface PerfilBadgeProps {
  perfil: number;
  descricao?: string;
}

export function PerfilBadge({ perfil, descricao }: PerfilBadgeProps) {
  return <StatusBadge tone="info">{formatPerfil(perfil, descricao)}</StatusBadge>;
}
