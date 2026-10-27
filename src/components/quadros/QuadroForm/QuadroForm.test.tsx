import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { QuadroChaves } from "@/types/quadroChaves";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api/services/quadroChaves", () => ({
  listQuadros: vi.fn(),
  criarQuadro: vi.fn(),
  acrescentarPosicoes: vi.fn(),
}));

import { acrescentarPosicoes, criarQuadro, listQuadros } from "@/lib/api/services/quadroChaves";
import { QuadroForm } from "./QuadroForm";

const criar = vi.mocked(criarQuadro);
const acrescentar = vi.mocked(acrescentarPosicoes);
const listar = vi.mocked(listQuadros);

const pos = (id: number, coluna: number) => ({ patioQuadroChaveId: id, coluna, disponivel: true });

// Quadro com B2 fora de uso desde o cadastro: A1 A2 / B1 _ / (2 linhas, 2 colunas).
const existente: QuadroChaves = {
  patioQuadroId: 7,
  nome: "Recepção",
  linhas: [
    { linha: "A", colunas: [pos(1, 1), pos(2, 2)] },
    { linha: "B", colunas: [pos(3, 1)] },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
  listar.mockResolvedValue([existente]);
});

describe("QuadroForm (criar)", () => {
  it("começa em 3 × 4 e mostra a prévia com a contagem", () => {
    renderWithProviders(<QuadroForm />);
    expect(screen.getByRole("heading", { name: "Configurar quadro" })).toBeInTheDocument();
    expect(screen.getByText("Prévia · 12 ganchos")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Linhas" })).toHaveAttribute("aria-valuenow", "3");
    expect(screen.getByText("A–C")).toBeInTheDocument();
    expect(screen.getByText("1–4")).toBeInTheDocument();
  });

  it("atualiza a prévia ao mudar linhas e ao marcar fora de uso", async () => {
    renderWithProviders(<QuadroForm />);
    await userEvent.click(screen.getByRole("button", { name: "Aumentar linhas" }));
    expect(screen.getByText("Prévia · 16 ganchos")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "D4, em uso" }));
    expect(screen.getByText("Prévia · 15 ganchos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "D4, fora de uso" })).toBeInTheDocument();
  });

  it("envia o payload sem os ganchos fora de uso e volta à lista", async () => {
    criar.mockResolvedValue(null);
    renderWithProviders(<QuadroForm />);
    await userEvent.type(screen.getByLabelText("Nome do quadro"), "  Recepção ");
    await userEvent.click(screen.getByRole("button", { name: "A2, em uso" }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar quadro" }));
    expect(criar).toHaveBeenCalledTimes(1);
    expect(criar.mock.calls[0][0]).toEqual({
      nome: "Recepção",
      linhas: [
        { linha: "A", colunas: [1, 3, 4] },
        { linha: "B", colunas: [1, 2, 3, 4] },
        { linha: "C", colunas: [1, 2, 3, 4] },
      ],
    });
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/quadros-chaves"));
  });

  it("sem nome não salva e mostra o erro", async () => {
    renderWithProviders(<QuadroForm />);
    await userEvent.click(screen.getByRole("button", { name: "Salvar quadro" }));
    expect(await screen.findByText("Informe o nome do quadro")).toBeInTheDocument();
    expect(criar).not.toHaveBeenCalled();
  });

  it("nome já usado volta do servidor como erro do campo e os dados ficam", async () => {
    criar.mockRejectedValue(new ApiError("validation", "O nome do quadro já está em uso.", 400));
    renderWithProviders(<QuadroForm />);
    await userEvent.type(screen.getByLabelText("Nome do quadro"), "Recepção");
    await userEvent.click(screen.getByRole("button", { name: "Salvar quadro" }));
    expect(await screen.findByText("O nome do quadro já está em uso.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome do quadro")).toHaveValue("Recepção");
    expect(push).not.toHaveBeenCalled();
  });

  it("outro erro do servidor aparece no banner", async () => {
    criar.mockRejectedValue(new ApiError("server", undefined, 500));
    renderWithProviders(<QuadroForm />);
    await userEvent.type(screen.getByLabelText("Nome do quadro"), "Garagem");
    await userEvent.click(screen.getByRole("button", { name: "Salvar quadro" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Erro no servidor");
  });

  it("com todos os ganchos fora de uso o Salvar fica desabilitado", async () => {
    renderWithProviders(<QuadroForm />);
    await userEvent.click(screen.getByRole("button", { name: "Diminuir linhas" }));
    await userEvent.click(screen.getByRole("button", { name: "Diminuir linhas" }));
    await userEvent.click(screen.getByRole("button", { name: "Diminuir colunas" }));
    await userEvent.click(screen.getByRole("button", { name: "Diminuir colunas" }));
    await userEvent.click(screen.getByRole("button", { name: "Diminuir colunas" }));
    await userEvent.click(screen.getByRole("button", { name: "A1, em uso" }));
    expect(screen.getByRole("button", { name: "Salvar quadro" })).toBeDisabled();
    expect(screen.getByText(/Mantenha ao menos um gancho em uso/)).toBeInTheDocument();
  });

  it("Adicionar outro quadro salva e limpa o formulário", async () => {
    criar.mockResolvedValue(null);
    renderWithProviders(<QuadroForm />);
    await userEvent.type(screen.getByLabelText("Nome do quadro"), "Recepção");
    await userEvent.click(screen.getByRole("button", { name: "+ Adicionar outro quadro" }));
    expect(await screen.findByText("Quadro Recepção salvo.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome do quadro")).toHaveValue("");
    expect(push).not.toHaveBeenCalled();
  });
});

describe("QuadroForm (acrescentar posições)", () => {
  it("abre no tamanho atual, com o nome somente leitura e as posições existentes bloqueadas", async () => {
    renderWithProviders(<QuadroForm patioQuadroId={7} />);
    expect(await screen.findByRole("heading", { name: "Adicionar posições" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome do quadro")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Nome do quadro")).toHaveValue("Recepção");
    expect(screen.getByRole("img", { name: "A1, já cadastrado" })).toBeInTheDocument();
    // B2 ficou fora de uso no cadastro e continua assim: não é recriada ao salvar sem mexer.
    expect(screen.getByRole("button", { name: "B2, fora de uso" })).toBeInTheDocument();
    expect(screen.getByText("Prévia · 0 novos ganchos")).toBeInTheDocument();
    expect(screen.getByText(/Aumente linhas ou colunas/)).toBeInTheDocument();
  });

  it("envia só as posições novas", async () => {
    acrescentar.mockResolvedValue(null);
    renderWithProviders(<QuadroForm patioQuadroId={7} />);
    await userEvent.click(await screen.findByRole("button", { name: "Aumentar linhas" }));
    // A linha C é nova: C1 vira fora de uso e só C2 é enviada.
    await userEvent.click(screen.getByRole("button", { name: "C1, em uso" }));
    await userEvent.click(screen.getByRole("button", { name: "B2, fora de uso" }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar posições" }));
    expect(acrescentar).toHaveBeenCalledWith(7, [
      { linha: "B", colunas: [2] },
      { linha: "C", colunas: [2] },
    ]);
  });

  it("quadro que não existe mostra o aviso", async () => {
    renderWithProviders(<QuadroForm patioQuadroId={99} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Quadro não encontrado ou inativo.");
  });
});
