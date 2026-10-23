import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
// O roteador do Next é estável entre renderizações; o mock também.
const router = { push };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/auth", () => ({ clearToken: vi.fn() }));
vi.mock("@/lib/rememberedLogin", () => ({ clearRememberedLogin: vi.fn().mockResolvedValue(undefined) }));

import { clearToken } from "@/lib/auth";
import { clearRememberedLogin } from "@/lib/rememberedLogin";
import { useLogout } from "./useLogout";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useLogout", () => {
  it("limpa a sessão, esquece o login lembrado e leva ao login", () => {
    const { result } = renderHook(() => useLogout());

    result.current();

    expect(clearToken).toHaveBeenCalledTimes(1);
    expect(clearRememberedLogin).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/login");
  });

  it("a função devolvida é a mesma entre renderizações", () => {
    const { result, rerender } = renderHook(() => useLogout());
    const primeira = result.current;

    rerender();

    expect(result.current).toBe(primeira);
  });
});
