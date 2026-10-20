"use client";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { IconButton, InstallBox } from "./InstallPwaButton.styles";

interface InstallPwaButtonProps {
  variant: "icon" | "full";
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function InstallPwaButton({ variant }: InstallPwaButtonProps) {
  const { canInstall, showIosHint, install } = usePwaInstall();

  if (variant === "icon") {
    if (!canInstall) return null;
    return (
      <IconButton
        type="button"
        onClick={() => void install()}
        aria-label="Instalar aplicativo"
        title="Instalar aplicativo"
      >
        <DownloadIcon />
      </IconButton>
    );
  }

  if (canInstall) {
    return (
      <InstallBox>
        <Button type="button" onClick={() => void install()}>
          Instalar aplicativo
        </Button>
        <Text variant="muted">Acesse o GIPE direto da tela inicial ou da área de trabalho.</Text>
      </InstallBox>
    );
  }

  if (showIosHint) {
    return (
      <Text variant="muted">
        Para instalar o GIPE: toque em Compartilhar e depois em &ldquo;Adicionar à Tela de Início&rdquo;.
      </Text>
    );
  }

  return null;
}
