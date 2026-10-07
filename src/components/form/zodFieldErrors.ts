import type { z } from "zod";

// Converte o path do issue na chave de campo do TanStack Form: ["horarios", 2, "horarioAbertura"] -> "horarios[2].horarioAbertura".
function toFieldName(path: readonly PropertyKey[]): string {
  return path.reduce<string>((name, segment) => {
    if (typeof segment === "number") {
      return `${name}[${segment}]`;
    }
    const key = String(segment);
    return name === "" ? key : `${name}.${key}`;
  }, "");
}

export function zodFieldErrors(result: z.ZodSafeParseError<unknown>) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of result.error.issues) {
    if (issue.path.length === 0) {
      continue;
    }
    const key = toFieldName(issue.path);
    if (!(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }

  return Object.keys(fieldErrors).length > 0 ? { fields: fieldErrors } : undefined;
}
