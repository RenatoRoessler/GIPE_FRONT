import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { QuadroChaves } from "@/types/quadroChaves";

vi.mock("@/lib/api/services/quadroChaves", () => ({ listQuadros: vi.fn(), escolherQuadroChave: vi.fn() }));

import { escolherQuadroChave, listQuadros } from "@/lib/api/services/quadroChaves";
import { EscolherGancho } from "./EscolherGancho";

const listar = vi.mocked(listQuadros);
const escolher = vi.mocked(escolherQuadroChave);

const pos = (id: number, coluna: number, disponivel = true) => ({ patioQuadroChaveId: id, coluna, disponivel });

const recepcao: QuadroChaves = {
  patioQuadroId: 1,
  nome: "Recepção",
  linhas: [
    { linha: "A", colunas: [pos(1, 1, false), pos(2, 2), pos(3, 3)] },
    { linha: "B", colunas: [pos(4, 1), pos(5, 3)] },
  ],
};

const garagem: QuadroChaves = {
  patioQuadroId: 2,
  nome: "Garagem",
  linhas: [{ linha: "A", colunas: [pos(10, 1), pos(11, 2), pos(12, 3), pos(13, 4), pos(14, 5)] }],
};

const chave = { patioId: 9, placa: "FLP3C88", patioQuadroId: 1, quadro: "Recepção", patioQuadroChaveId: 2, linha: "A", coluna: 2 };

function setup(over: Partial<React.ComponentProps<typeof EscolherGancho>> = {}) {
  const onGuardado = vi.fn();
  const onPular = vi.fn();
  renderWithProviders(
    <EscolherGancho patioId={9} placa="FLP3C88" modelo="Corolla" cor="BRANCO" onGuardado={onGuardado} onPular={onPular} {...over} />,
  );
  return { onGuardado, onPular };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("EscolherGancho", () => {
  it("mostra o veículo e já sugere o primeiro gancho livre", async () => {
    listar.mockResolvedValue([recepcao]);
    setup();
    expect(await screen.findByText("Gancho sugerido")).toBeInTheDocument();
    expect(screen.getByText("Corolla · Branco")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A2, selecionado" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar no gancho A2" })).toBeEnabled();
    expect(screen.getByText(/Pendure a chave no A2/)).toBeInTheDocument();
  });

  it("troca por outro gancho livre com um toque e guarda o escolhido", async () => {
    listar.mockResolvedValue([recepcao]);
    escolher.mockResolvedValue({ ...chave, patioQuadroChaveId: 4, linha: "B", coluna: 1 });
    const { onGuardado } = setup();
    await userEvent.click(await screen.findByRole("button", { name: "B1, livre" }));
    expect(screen.getByText("Gancho escolhido")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Guardar no gancho B1" }));
    expect(escolher).toHaveBeenCalledWith(9, 4);
    await waitFor(() => expect(onGuardado).toHaveBeenCalledTimes(1));
  });

  it("não deixa escolher gancho ocupado", async () => {
    listar.mockResolvedValue([recepcao]);
    setup();
    await screen.findByText("Gancho sugerido");
    expect(screen.queryByRole("button", { name: /A1/ })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "A1, ocupado" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "B2, fora de uso" })).toBeInTheDocument();
  });

  it("com vários quadros começa pelo de mais livres e permite trocar de quadro", async () => {
    listar.mockResolvedValue([recepcao, garagem]);
    setup();
    expect(await screen.findByRole("tab", { name: "Garagem", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar no gancho A1" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Recepção" }));
    expect(screen.getByRole("button", { name: "Guardar no gancho A2" })).toBeInTheDocument();
  });

  it("quadro lotado avisa e não deixa guardar", async () => {
    const lotado: QuadroChaves = { ...recepcao, linhas: [{ linha: "A", colunas: [pos(1, 1, false)] }] };
    listar.mockResolvedValue([lotado]);
    setup();
    expect(await screen.findByText("Todos os ganchos deste quadro estão ocupados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar no gancho" })).toBeDisabled();
  });

  it("conflito mostra a placa que ocupa, recarrega a grade e volta à sugestão", async () => {
    // Outro terminal pegou o A2: a segunda consulta já o traz ocupado.
    const apos: QuadroChaves = {
      ...recepcao,
      linhas: [{ linha: "A", colunas: [pos(1, 1, false), pos(2, 2, false), pos(3, 3)] }, recepcao.linhas[1]],
    };
    listar.mockResolvedValueOnce([recepcao]).mockResolvedValue([apos]);
    escolher.mockRejectedValue(new ApiError("validation", "A2 já está com a chave do veículo ABC1D23.", 400));
    const { onGuardado } = setup();
    await userEvent.click(await screen.findByRole("button", { name: "Guardar no gancho A2" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ABC1D23");
    expect(await screen.findByRole("button", { name: "Guardar no gancho A3" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "A2, ocupado" })).toBeInTheDocument();
    expect(onGuardado).not.toHaveBeenCalled();
  });

  it("sem quadros pula a etapa", async () => {
    listar.mockResolvedValue([]);
    const { onPular } = setup();
    await waitFor(() => expect(onPular).toHaveBeenCalled());
  });

  it("Escolher depois pula sem guardar", async () => {
    listar.mockResolvedValue([recepcao]);
    const { onPular } = setup();
    await userEvent.click(await screen.findByRole("button", { name: "Escolher depois" }));
    expect(onPular).toHaveBeenCalledTimes(1);
    expect(escolher).not.toHaveBeenCalled();
  });

  it("falha ao carregar oferece tentar novamente e escolher depois", async () => {
    listar.mockRejectedValueOnce(new ApiError("network")).mockResolvedValue([recepcao]);
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o quadro de chaves.");
    expect(screen.getByRole("button", { name: "Escolher depois" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Gancho sugerido")).toBeInTheDocument();
  });
});
