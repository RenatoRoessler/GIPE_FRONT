import versionJson from "@/generated/version.json";
import type { VersionInfo } from "@/types/changelog";

export function getVersionInfo(): VersionInfo {
  return versionJson as VersionInfo;
}

// Texto da versão exibido no menu.
export function getVersionLabel(): string {
  const { complete, version } = getVersionInfo();
  return complete && version ? `v${version}` : "Versão indisponível";
}
