"use client";

import { usePathname } from "next/navigation";
import { NavSign } from "@/components/layout/NavSign";
import { NAV_ITEMS, isNavItemActive } from "@/lib/nav";
import { Beam, Signs, Wrapper } from "./Gantry.styles";

export function Gantry() {
  const pathname = usePathname();

  return (
    <Wrapper aria-label="Menu principal">
      <Beam aria-hidden="true" />
      <Signs>
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <NavSign item={item} active={isNavItemActive(pathname, item.href)} variant="gantry" />
          </li>
        ))}
      </Signs>
    </Wrapper>
  );
}
