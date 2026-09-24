"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { clearToken } from "@/lib/auth";
import {
  Avatar,
  Divider,
  Dropdown,
  DropdownItemLink,
  LogoutButton,
  Wrapper,
} from "./UserMenu.styles";

function getInitials(name: string) {
  const [first, second] = name.split(" ");
  return `${first?.[0] ?? ""}${second?.[0] ?? ""}`.toUpperCase();
}

export function UserMenu() {
  const { user } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleLogout() {
    setIsOpen(false);
    clearToken();
    router.push("/login");
  }

  return (
    <Wrapper ref={wrapperRef}>
      <Avatar
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Menu do usuário"
      >
        {user ? getInitials(user.name) : ""}
      </Avatar>
      {isOpen && (
        <Dropdown role="menu">
          <DropdownItemLink
            as={NextLink}
            href="/usuario/editar"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            Editar Usuário
          </DropdownItemLink>
          <Divider />
          <LogoutButton type="button" role="menuitem" onClick={handleLogout}>
            Sair
          </LogoutButton>
        </Dropdown>
      )}
    </Wrapper>
  );
}
