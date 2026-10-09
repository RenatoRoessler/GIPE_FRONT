"use client";

import NextLink from "next/link";
import type { NavItem } from "@/lib/nav";
import { NavIcon } from "./NavIcons";
import { Sign } from "./NavSign.styles";

export interface NavSignProps {
  item: NavItem;
  active: boolean;
  variant: "gantry" | "panel";
  onNavigate?: () => void;
}

export function NavSign({ item, active, variant, onNavigate }: NavSignProps) {
  return (
    <Sign
      as={NextLink}
      href={item.href}
      $active={active}
      $variant={variant}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
    >
      <NavIcon id={item.icon} aria-hidden="true" />
      {item.label}
    </Sign>
  );
}
