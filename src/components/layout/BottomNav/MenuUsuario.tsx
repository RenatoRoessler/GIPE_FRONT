"use client";

import { useCaixaAberto } from "@/components/caixa/useCaixa";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPerfil } from "@/components/usuarios/perfil";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { useCan } from "@/hooks/useCan";
import { iniciais } from "@/lib/iniciais";
import { AREA } from "@/lib/permissoes";
import { UsuarioAvatar, UsuarioCartao, UsuarioDados, UsuarioDetalhe, UsuarioNome } from "./BottomNav.styles";

// Topo do menu "Mais": quem está logado, o perfil e, para quem tem acesso ao caixa, se ele está aberto.
// Sem acesso ao caixa a consulta nem sai; se ela falhar, só a situação do caixa some.
export function MenuUsuario() {
  const { user } = useCurrentUser();
  const podeVerCaixa = useCan(AREA.Caixa);
  const { aberto, carregando, erro } = useCaixaAberto({ enabled: podeVerCaixa });

  if (!user) {
    return null;
  }

  const perfil = user.perfil != null ? formatPerfil(user.perfil) : null;

  return (
    <UsuarioCartao aria-label="Usuário logado">
      <UsuarioAvatar aria-hidden="true">{iniciais(user.name)}</UsuarioAvatar>
      <UsuarioDados>
        <UsuarioNome>{user.name}</UsuarioNome>
        <UsuarioDetalhe>
          {perfil && <span>{perfil}</span>}
          {podeVerCaixa && carregando && <Skeleton width="88px" height="20px" radius="9999px" />}
          {podeVerCaixa && !carregando && !erro && (
            <StatusBadge tone={aberto ? "success" : "neutral"}>{aberto ? "Caixa aberto" : "Caixa fechado"}</StatusBadge>
          )}
        </UsuarioDetalhe>
      </UsuarioDados>
    </UsuarioCartao>
  );
}
