"use client";

import { Text } from "@/components/ui/Text";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useThemeMode } from "@/contexts/ThemeModeContext";
import { UserMenu } from "@/components/layout/UserMenu";
import { MoonIcon, SunIcon } from "./ThemeIcons";
import {
  Bar,
  EndGroup,
  MenuButton,
  Skeleton,
  StartGroup,
  ThemeToggleButton,
  Welcome,
} from "./Header.styles";

export interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, isLoading } = useCurrentUser();
  const { mode, toggleThemeMode } = useThemeMode();

  return (
    <Bar>
      <StartGroup>
        <MenuButton type="button" onClick={onMenuClick} aria-label="Abrir menu">
          ☰
        </MenuButton>
        <Welcome>
          {isLoading ? (
            <Skeleton />
          ) : (
            <Text variant="heading" as="span">
              Olá, {user?.name}
            </Text>
          )}
        </Welcome>
      </StartGroup>
      <EndGroup>
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
