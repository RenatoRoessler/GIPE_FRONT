"use client";

import { useRef } from "react";
import { InstallPwaButton } from "@/components/layout/InstallPwaButton";
import { Logo, type LogoHandle } from "@/components/ui/Logo";
import { Text } from "@/components/ui/Text";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { useThemeMode } from "@/contexts/ThemeModeContext";
import { UserMenu } from "@/components/layout/UserMenu";
import { MoonIcon, SunIcon } from "./ThemeIcons";
import {
  Bar,
  BrandLink,
  EndGroup,
  Skeleton,
  ThemeToggleButton,
  Welcome,
} from "./Header.styles";

export function Header() {
  const { user, isLoading } = useCurrentUser();
  const { mode, toggleThemeMode } = useThemeMode();
  const logoRef = useRef<LogoHandle>(null);

  return (
    <Bar>
      {/* O logo anima ao abrir o sistema. Hover e foco param a animação; durante ela, o clique (ou toque) só para,
          sem navegar. Parado, o link leva ao início como sempre. */}
      <BrandLink
        href="/"
        aria-label="Murel — ir para o início"
        onPointerEnter={(evento) => {
          if (evento.pointerType === "mouse") logoRef.current?.parar();
        }}
        onFocus={() => logoRef.current?.parar()}
        onClick={(evento) => {
          if (logoRef.current?.parar()) evento.preventDefault();
        }}
      >
        <Logo ref={logoRef} animated pararAoInteragir={false} align="start" size={28} />
      </BrandLink>
      <EndGroup>
        <Welcome>
          {isLoading ? (
            <Skeleton />
          ) : (
            <Text variant="muted" as="span">
              Olá, {user?.name}
            </Text>
          )}
        </Welcome>
        <InstallPwaButton variant="icon" />
        <ThemeToggleButton
          type="button"
          onClick={toggleThemeMode}
          aria-label={mode === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          title={mode === "dark" ? "Tema claro" : "Tema escuro"}
        >
          {mode === "dark" ? <SunIcon /> : <MoonIcon />}
        </ThemeToggleButton>
        <UserMenu />
      </EndGroup>
    </Bar>
  );
}
