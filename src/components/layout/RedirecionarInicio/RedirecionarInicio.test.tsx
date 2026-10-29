import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
const sessao = vi.hoisted(() => ({ atual: { user: { perfil: 1 } as { perfil: number | null } | null, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

import { RedirecionarInicio } from "./RedirecionarInicio";

function telaDe(grande: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: grande }) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  replace.mockReset();
  sessao.atual = { user: { perfil: 1 }, isLoading: false };
});

describe("RedirecionarInicio", () => {
  it("tela grande vai ao Dashboard", () => {
    telaDe(true);
    render(<RedirecionarInicio />);
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("tela pequena vai ao Pátio", () => {
    telaDe(false);
    render(<RedirecionarInicio />);
    expect(replace).toHaveBeenCalledWith("/patio");
  });

  it("tela pequena sem acesso ao Pátio vai ao Dashboard", () => {
    telaDe(false);
    sessao.atual = { user: { perfil: 8 }, isLoading: false };
    render(<RedirecionarInicio />);
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("espera a sessão carregar antes de decidir", () => {
    telaDe(false);
    sessao.atual = { user: null, isLoading: true };
    render(<RedirecionarInicio />);
    expect(replace).not.toHaveBeenCalled();
  });
});
