export type ChangelogType = "feat" | "fix";

export interface ChangelogEntry {
  // Sem o "v": "1.0.38".
  version: string;
  type: ChangelogType;
  // "empresa" em "feat(empresa): ...".
  scope: string | null;
  // Resumo sem o prefixo "feat(escopo): ".
  title: string;
  // Corpo do commit sem rodapés (Co-Authored-By etc.); "" se não houver.
  description: string;
  // ISO 8601 do commit.
  date: string;
}

export interface ChangelogData {
  // false quando o histórico do git estava incompleto no build.
  complete: boolean;
  // Da mais recente para a mais antiga.
  entries: ChangelogEntry[];
}

export interface VersionInfo {
  complete: boolean;
  // "1.0.39"; null quando o histórico está incompleto.
  version: string | null;
  // N: total de commits contados.
  total: number;
  // Versão da entrada mais recente listada; âncora do link do rodapé.
  highlight: string | null;
}
