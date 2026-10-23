import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: vi.fn() }));
vi.mock("./EmpresaForm", () => ({ EMPRESA_QUERY_KEY: ["empresa"], EmpresaForm: () => <div>formulário</div> }));

import { getEmpresa } from "@/lib/api/services/empresa";
import { MinhaEmpresa } from "./MinhaEmpresa";

beforeEach(() => {
  vi.mocked(getEmpresa).mockReset();
});

describe("MinhaEmpresa", () => {
  it("no 403 avisa da permissão, leva ao início e não oferece nova tentativa", async () => {
    vi.mocked(getEmpresa).mockRejectedValue(new ApiError("forbidden"));
    renderWithProviders(<MinhaEmpresa />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.getByRole("link", { name: "Ir para o início" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("em outros erros mostra a mensagem e oferece nova tentativa", async () => {
    vi.mocked(getEmpresa).mockRejectedValue(new ApiError("server"));
    renderWithProviders(<MinhaEmpresa />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro no servidor. Tente novamente em instantes.");
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
