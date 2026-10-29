"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/layout/NavIcons";
import { useVeiculoModais } from "@/components/veiculos/VeiculoModais";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { isNavAction, isNavItemActive, navItemKey, navItemsPermitidos } from "@/lib/nav";
import { Aside, ItemButton, ItemLink, Lista, Rotulo } from "./SideNav.styles";

// Menu lateral das telas grandes: todos os itens que o perfil pode abrir, na ordem do menu. Recolhido mostra só os ícones;
// ao passar o mouse (ou focar um item pelo teclado) expande com o nome completo. O texto está sempre no DOM, para o leitor de tela.
export function SideNav() {
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();
  const { abrirEntrada, abrirSaida } = useVeiculoModais();
  const itens = isLoading ? [] : navItemsPermitidos(user?.perfil);

  return (
    <Aside aria-label="Menu lateral" aria-busy={isLoading}>
      <Lista>
        {itens.map((item) => (
          <li key={navItemKey(item)}>
            {isNavAction(item) ? (
              <ItemButton type="button" $active={false} aria-haspopup="dialog" onClick={item.acao === "entrada" ? abrirEntrada : abrirSaida}>
                <NavIcon id={item.icon} width={22} height={22} aria-hidden="true" />
                <Rotulo>{item.label}</Rotulo>
              </ItemButton>
            ) : (
              <ItemLink
                as={NextLink}
                href={item.href}
                $active={isNavItemActive(pathname, item.href)}
                aria-current={isNavItemActive(pathname, item.href) ? "page" : undefined}
              >
                <NavIcon id={item.icon} width={22} height={22} aria-hidden="true" />
                <Rotulo>{item.label}</Rotulo>
              </ItemLink>
            )}
          </li>
        ))}
      </Lista>
    </Aside>
  );
}
