import changelogJson from "@/generated/changelog.json";
import type { ChangelogData } from "@/types/changelog";

// Importa a lista completa: usar apenas em Server Components (a página de atualizações).
export function getChangelog(): ChangelogData {
  return changelogJson as ChangelogData;
}
