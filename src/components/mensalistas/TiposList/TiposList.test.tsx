import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { MensalistaTipo } from "@/types/mensalista";

vi.mock("@/lib/api/services/mensalista", () => ({ listTiposMensalidade: vi.fn() }));

import { listTiposMensalidade } from "@/lib/api/services/mensalista";
import { TiposList } from "./TiposList";

const diurno: MensalistaTipo = {
  mensalistaTipoId: 1,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  horarioEntrada: "07:00:00",
  horarioSaida: "19:00:00",
  ativo: true,
};
const noturno: MensalistaTipo = {
  mensalistaTipoId: 2,
  tipoMensal: "Noturno",
  categoria: 2,
  valorMensalidade: 199.9,
  horarioEntrada: "19:00",
  horarioSaida: "07:00",
  ativo: false,
};

const handlers = { onNovo: vi.fn(), onEditar: vi.fn() };

describe("TiposList", () => {
  beforeEach(() => {
    vi.mocked(listTiposMensalidade).mockReset();
    handlers.onNovo.mockReset();
    handlers.onEditar.mockReset();
  });

  it("mostra o carregamento enquanto busca", () => {
    vi.mocked(listTiposMensalidade).mockReturnValue(new Promise(() => undefined));
    renderWithProviders(<TiposList {...handlers} />);
    expect(screen.getByRole("status", { name: "Carregando tipos de mensalidade" })).toBeInTheDocument();
  });

  it("lista os tipos com categoria, horário e situação", async () => {
    vi.mocked(listTiposMensalidade).mockResolvedValue([diurno, noturno]);
    renderWithProviders(<TiposList {...handlers} />);

    expect(await screen.findByText("Diurno")).toBeInTheDocument();
    expect(screen.getByText("Todas")).toBeInTheDocument();
    expect(screen.getByText("07:00 – 19:00")).toBeInTheDocument();
    expect(screen.getByText("19:00 – 07:00")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Inativo")).toBeInTheDocument();
  });

  it("abre o cadastro e a edição", async () => {
    vi.mocked(listTiposMensalidade).mockResolvedValue([diurno]);
    renderWithProviders(<TiposList {...handlers} />);

    await userEvent.click(await screen.findByRole("button", { name: "Novo tipo" }));
    expect(handlers.onNovo).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Editar Diurno" }));
    expect(handlers.onEditar).toHaveBeenCalledWith(diurno);
  });

  it("mostra o estado vazio com a ação de criar o primeiro tipo", async () => {
    vi.mocked(listTiposMensalidade).mockResolvedValue([]);
    renderWithProviders(<TiposList {...handlers} />);

    expect(await screen.findByText("Nenhum tipo de mensalidade cadastrado.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Novo tipo" }));
    expect(handlers.onNovo).toHaveBeenCalled();
  });

  it("mostra o erro e permite tentar novamente", async () => {
    vi.mocked(listTiposMensalidade).mockRejectedValueOnce(new ApiError("server"));
    renderWithProviders(<TiposList {...handlers} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os tipos de mensalidade");

    vi.mocked(listTiposMensalidade).mockResolvedValue([diurno]);
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Diurno")).toBeInTheDocument();
  });

  it("no 403 mostra o aviso de permissão e não oferece nova tentativa", async () => {
    vi.mocked(listTiposMensalidade).mockRejectedValue(new ApiError("forbidden"));
    renderWithProviders(<TiposList {...handlers} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });
});
