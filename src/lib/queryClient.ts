import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
  }
}

const NON_RETRYABLE_KINDS = new Set(["unauthorized", "forbidden", "not_found", "validation"]);
const MAX_RETRIES = 3;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          !(error instanceof ApiError && NON_RETRYABLE_KINDS.has(error.kind)) &&
          failureCount < MAX_RETRIES,
      },
    },
  });
}
