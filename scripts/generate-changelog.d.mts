import type { ChangelogEntry } from "../src/types/changelog";

export function parseGitLog(raw: string): { total: number; entries: ChangelogEntry[] };
export function generateChangelog(): void;
