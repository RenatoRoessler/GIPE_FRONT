import type { z } from "zod";

export function zodFieldErrors(result: z.ZodSafeParseError<unknown>) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }

  return Object.keys(fieldErrors).length > 0 ? { fields: fieldErrors } : undefined;
}
