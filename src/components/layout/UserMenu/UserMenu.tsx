"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { AlterarSenhaModal } from "@/components/usuarios/AlterarSenhaModal";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { useToast } from "@/hooks/useToast";
import { useLogout } from "@/hooks/useLogout";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import {
  Avatar,
  Divider,
  Dropdown,
  DropdownItemButton,
  InstallButton,
  InstallHint,
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
  const [alterandoSenha, setAlterandoSenha] = useState(false);
  const { toast, showToast, dismissToast } = useToast();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const logout = useLogout();
  const { canInstall, showIosHint, install } = usePwaInstall();

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
    logout();
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
          <DropdownItemButton
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              setAlterandoSenha(true);
            }}
          >
            Alterar senha
          </DropdownItemButton>
          {canInstall && (
            <InstallButton
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                void install();
              }}
            >
              Instalar aplicativo
            </InstallButton>
          )}
          {!canInstall && showIosHint && (
            <InstallHint>Para instalar: toque em Compartilhar e depois em &ldquo;Adicionar à Tela de Início&rdquo;.</InstallHint>
          )}
          <Divider />
          <LogoutButton type="button" role="menuitem" onClick={handleLogout}>
            Sair
          </LogoutButton>
        </Dropdown>
      )}
      {alterandoSenha && <AlterarSenhaModal onClose={() => setAlterandoSenha(false)} onSuccess={showToast} />}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Wrapper>
  );
}
