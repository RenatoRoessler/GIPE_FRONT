import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { PatioVeiculo } from "@/types/patio";
import type { QuadroChaves } from "@/types/quadroChaves";

vi.mock("@/lib/api/services/quadroChaves", () => ({ listQuadros: vi.fn(), escolherQuadroChave: vi.fn() }));

import { escolherQuadroChave, listQuadros } from "@/lib/api/services/quadroChaves";
import { GuardarChaveModal } from "./GuardarChaveModal";

const listar = vi.mocked(listQuadros);
const escolher = vi.mocked(escolherQuadroChave);

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const pos = (id: number, coluna: number, disponivel = true) => ({ patioQuadroChaveId: id, coluna, disponivel });

const quadro: QuadroChaves = {
  patioQuadroId: 1,
  nome: "Recepção",
  linhas: [{ linha: "A", colunas: [pos(1, 1, false), pos(2, 2), pos(3, 3)] }],
};

function veiculo(extra: Partial<PatioVeiculo> = {}): PatioVeiculo {
  return {
    patioId: 9,
    placa: "FLP3C88",
    categoria: 2,
    modelo: "Corolla",
    cor: "BRANCO",
    codigoTicket: null,
    sequencial: 1,
    mensalista: false,
    dataHoraEntrada: "2026-10-20T16:41:52",
    minutosPermanencia: 60,
    permanencia: "1h 0min",
    rotatividadeDescricao: null,
    usuarioEntrada: null,
    token: null,
    ...extra,
  };
}

const chave = { patioId: 9, placa: "FLP3C88", patioQuadroId: 1, quadro: "Recepção", patioQuadroChaveId: 2, linha: "A", coluna: 2 };

function setup(v: PatioVeiculo) {
  const onClose = vi.fn();
  const onGuardado = vi.fn();
  renderWithProviders(<GuardarChaveModal veiculo={v} onClose={onClose} onGuardado={onGuardado} />);
  return { onClose, onGuardado };
}

beforeEach(() => {
  vi.resetAllMocks();
  listar.mockResolvedValue([quadro]);
});

describe("GuardarChaveModal", () => {
  it("veículo sem gancho: abre com o título, o veículo e a sugestão, e guarda", async () => {
    escolher.mockResolvedValue(chave);
    const { onGuardado } = setup(veiculo());
    expect(screen.getByRole("heading", { name: "Guardar chave" })).toBeInTheDocument();
    expect(await screen.findByText("Gancho sugerido")).toBeInTheDocument();
    expect(screen.getByText("Corolla · Branco")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Guardar no gancho A2" }));
    expect(escolher).toHaveBeenCalledWith(9, 2);
    await waitFor(() => expect(onGuardado).toHaveBeenCalledWith(chave));
  });

  it("veículo com gancho: troca de gancho sem sugestão", async () => {
    escolher.mockResolvedValue({ ...chave, patioQuadroChaveId: 3, coluna: 3 });
    const { onGuardado } = setup(veiculo({ posicaoChave: "A1", chaveRef: { quadro: null, linha: "A", coluna: 1 } }));
    expect(await screen.findByText("Chave hoje no A1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Escolha um gancho" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "A3, livre" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar no gancho A3" }));
    expect(escolher).toHaveBeenCalledWith(9, 3);
    await waitFor(() => expect(onGuardado).toHaveBeenCalledTimes(1));
  });

  it("Cancelar fecha sem guardar", async () => {
    const { onClose } = setup(veiculo());
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(escolher).not.toHaveBeenCalled();
  });

  it("conflito mostra a placa que ocupa e o modal continua aberto", async () => {
    escolher.mockRejectedValue(new ApiError("validation", "A2 já está com a chave do veículo ABC1D23.", 400));
    const { onGuardado, onClose } = setup(veiculo());
    await userEvent.click(await screen.findByRole("button", { name: "Guardar no gancho A2" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ABC1D23");
    expect(onGuardado).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
