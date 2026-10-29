import versionJson from "@/generated/version.json";
import type { VersionInfo } from "@/types/changelog";

// Módulo separado de changelog.ts para o menu não levar a lista completa ao bundle do cliente.
export function getVersionInfo(): VersionInfo {
  return versionJson as VersionInfo;
}

// Texto e destino do link de versão exibido no menu.
export function getVersionLink(): { label: string; href: string } {
  const { complete, version, highlight } = getVersionInfo();
  return {
    label: complete && version ? `v${version}` : "Versão indisponível",
    href: highlight ? `/atualizacoes#v${highlight}` : "/atualizacoes",
  };
}
