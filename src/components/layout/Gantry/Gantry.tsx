"use client";

import { usePathname } from "next/navigation";
import { NavSign } from "@/components/layout/NavSign";
import { useVeiculoModais } from "@/components/veiculos/VeiculoModais";
import { NAV_ITEMS, isNavActive, navItemKey, type NavAction } from "@/lib/nav";
import { Beam, Signs, Wrapper } from "./Gantry.styles";

export function Gantry() {
  const pathname = usePathname();
  const { abrirEntrada, abrirSaida } = useVeiculoModais();

  function handleAction(acao: NavAction) {
    if (acao === "entrada") abrirEntrada();
    else abrirSaida();
  }

  return (
    <Wrapper aria-label="Menu principal">
      <Beam aria-hidden="true" />
      <Signs>
        {NAV_ITEMS.map((item) => (
          <li key={navItemKey(item)}>
            <NavSign item={item} active={isNavActive(pathname, item)} onAction={handleAction} />
          </li>
        ))}
      </Signs>
    </Wrapper>
  );
}
