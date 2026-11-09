"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { NavIcon } from "@/components/layout/NavIcons";
import { useVeiculoModais } from "@/components/veiculos/VeiculoModais";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { getVersionLabel } from "@/lib/version";
import { agruparItens, isNavAction, isNavItemActive, navItemKey, navItemsPermitidos } from "@/lib/nav";
import { Aside, Grupos, ItemButton, ItemLink, Lista, Rotulo, TituloGrupo, TituloTexto, Traco, Versao } from "./SideNav.styles";

// Menu lateral das telas grandes: os itens que o perfil pode abrir, em grupos (Financeiro, Configurações e Operação).
// Recolhido mostra só os ícones, com um traço entre os grupos; ao passar o mouse (ou focar um item pelo teclado) expande
// com o nome completo e o título de cada grupo. O texto está sempre no DOM, para o leitor de tela.
export function SideNav() {
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();
  const { abrirEntrada, abrirSaida } = useVeiculoModais();
  const idBase = useId();
  const versao = getVersionLabel();
  const grupos = agruparItens(isLoading ? [] : navItemsPermitidos(user?.perfil));

  return (
    <Aside aria-label="Menu lateral" aria-busy={isLoading}>
      <Grupos>
        {grupos.map((grupo) => {
          const tituloId = `${idBase}-${grupo.id}`;
          return (
            <li key={grupo.id ?? "sem-grupo"}>
              {grupo.titulo && (
                <TituloGrupo>
                  <Traco aria-hidden="true" />
                  <TituloTexto id={tituloId}>{grupo.titulo}</TituloTexto>
                </TituloGrupo>
              )}
              <Lista aria-labelledby={grupo.titulo ? tituloId : undefined}>
                {grupo.itens.map((item) => (
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
            </li>
          );
        })}
      </Grupos>
      <Versao>{versao}</Versao>
    </Aside>
  );
}
