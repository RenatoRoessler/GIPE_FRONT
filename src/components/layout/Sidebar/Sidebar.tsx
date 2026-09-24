"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/nav";
import { NavIcon } from "./NavIcons";
import {
  Brand,
  BrandDot,
  BrandName,
  Nav,
  NavItemLink,
  NavLabel,
  NavList,
  Overlay,
} from "./Sidebar.styles";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered || isOpen;

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={onClose} />
      <Nav
        $isOpen={isOpen}
        $expanded={isExpanded}
        aria-label="Menu principal"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Brand>
          <BrandDot />
          <BrandName $expanded={isExpanded}>GIPE</BrandName>
        </Brand>
        <NavList>
          {NAV_ITEMS.map((item) => (
            <NavItemLink
              key={item.href}
              as={NextLink}
              href={item.href}
              $active={pathname === item.href}
              onClick={onClose}
            >
              <NavIcon id={item.icon} />
              <NavLabel $expanded={isExpanded}>{item.label}</NavLabel>
            </NavItemLink>
          ))}
        </NavList>
      </Nav>
    </>
  );
}
