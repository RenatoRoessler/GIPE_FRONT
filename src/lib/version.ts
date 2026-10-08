import versionJson from "@/generated/version.json";
import type { VersionInfo } from "@/types/changelog";

// Módulo separado de changelog.ts para o rodapé não levar a lista completa ao bundle do cliente.
export function getVersionInfo(): VersionInfo {
  return versionJson as VersionInfo;
}
