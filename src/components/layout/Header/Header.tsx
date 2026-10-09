"use client";

import { MobileNav } from "@/components/layout/MobileNav";
import { Logo } from "@/components/ui/Logo";
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

  return (
    <Bar>
      <MobileNav />
      <BrandLink href="/dashboard" aria-label="GIPE — ir para o início">
        <Logo align="start" />
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
