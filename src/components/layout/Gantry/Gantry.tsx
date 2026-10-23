"use client";

import { usePathname } from "next/navigation";
import { NavSign } from "@/components/layout/NavSign";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { useVeiculoModais } from "@/components/veiculos/VeiculoModais";
import { isNavActive, navItemKey, navItemsPermitidos, type NavAction } from "@/lib/nav";
import { Beam, Signs, Wrapper } from "./Gantry.styles";

const SKELETON_KEYS = ["a", "b", "c", "d", "e", "f"];

export function Gantry() {
  const pathname = usePathname();
  const { abrirEntrada, abrirSaida } = useVeiculoModais();
  const { user, isLoading } = useCurrentUser();

  function handleAction(acao: NavAction) {
    if (acao === "entrada") abrirEntrada();
    else abrirSaida();
  }

  return (
    <Wrapper aria-label="Menu principal">
      <Beam aria-hidden="true" />
      {/* Enquanto o perfil não é conhecido, esqueletos: o menu completo piscaria itens que o perfil não pode abrir. */}
      <Signs aria-busy={isLoading}>
        {isLoading
          ? SKELETON_KEYS.map((key) => (
              <li key={key}>
                <Skeleton height="88px" radius="8px" />
              </li>
            ))
          : navItemsPermitidos(user?.perfil).map((item) => (
              <li key={navItemKey(item)}>
                <NavSign item={item} active={isNavActive(pathname, item)} onAction={handleAction} />
              </li>
            ))}
      </Signs>
    </Wrapper>
  );
}
