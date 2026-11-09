import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { PatioVeiculo } from "@/types/patio";

vi.mock("@/lib/api/services/patio", () => ({ atualizarPrisma: vi.fn() }));

import { atualizarPrisma } from "@/lib/api/services/patio";
import { PATIO_QUERY_KEY } from "../patioKeys";
import { EditarPrismaModal } from "./EditarPrismaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const veiculo: PatioVeiculo = {
  patioId: 54,
  placa: "MNB7880",
  categoria: 1,
  modelo: "Gol",
  cor: "PRATA",
  codigoTicket: null,
  sequencial: 2464,
  mensalista: false,
  dataHoraEntrada: "2026-10-20T16:41:52",
  minutosPermanencia: 10,
  permanencia: "10min",
  rotatividadeDescricao: null,
  usuarioEntrada: null,
  token: null,
  prisma: 45,
};

const onClose = vi.fn();
const onSalvo = vi.fn();

function montar(sobre: Partial<PatioVeiculo> = {}) {
  const utilitarios = renderWithProviders(<EditarPrismaModal veiculo={{ ...veiculo, ...sobre }} onClose={onClose} onSalvo={onSalvo} />);
  return { user: userEvent.setup(), ...utilitarios };
}

const campo = () => screen.getByLabelText("Prisma");
const salvar = () => screen.getByRole("button", { name: /Salvar|Salvando/ });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(atualizarPrisma).mockResolvedValue(undefined);
});

describe("EditarPrismaModal", () => {
  it("abre com o valor atual, o título com a placa e Salvar desabilitado", () => {
    montar();
    expect(screen.getByRole("dialog", { name: "Prisma · MNB7880" })).toBeInTheDocument();
    expect(campo()).toHaveValue("45");
    expect(screen.getByText("Número de 1 a 999.")).toBeInTheDocument();
    expect(salvar()).toBeDisabled();
  });

  it("sem prisma o campo abre vazio", () => {
    montar({ prisma: null });
    expect(campo()).toHaveValue("");
  });

  it("alterar e salvar grava o número, atualiza a lista, avisa e fecha", async () => {
    const { user, queryClient } = montar();
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");
    await user.clear(campo());
    await user.type(campo(), "123");
    expect(salvar()).toBeEnabled();
    await user.click(salvar());

    await waitFor(() => expect(atualizarPrisma).toHaveBeenCalledWith(54, 123));
    await waitFor(() => expect(onSalvo).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalled();
    expect(invalidar).toHaveBeenCalledWith({ queryKey: PATIO_QUERY_KEY });
  });

  it("Enter no campo salva", async () => {
    const { user } = montar({ prisma: null });
    await user.type(campo(), "7{Enter}");
    await waitFor(() => expect(atualizarPrisma).toHaveBeenCalledWith(54, 7));
  });

  it("valor inválido mostra a regra e mantém Salvar desabilitado", async () => {
    const { user } = montar();
    await user.clear(campo());
    await user.type(campo(), "0");
    await user.tab();
    expect(await screen.findByText("Use um número de 1 a 999")).toBeInTheDocument();
    expect(salvar()).toBeDisabled();
  });

  it("apagar o valor de quem não é mensalista pede o prisma", async () => {
    const { user } = montar();
    await user.clear(campo());
    await user.tab();
    expect(await screen.findByText("Informe o prisma (de 1 a 999)")).toBeInTheDocument();
    expect(salvar()).toBeDisabled();
  });

  it("mensalista pode apagar o prisma: grava null", async () => {
    const { user } = montar({ mensalista: true });
    await user.clear(campo());
    expect(salvar()).toBeEnabled();
    await user.click(salvar());
    await waitFor(() => expect(atualizarPrisma).toHaveBeenCalledWith(54, null));
  });

  it("durante o envio trava campo e botões e mostra Salvando…", async () => {
    vi.mocked(atualizarPrisma).mockReturnValue(new Promise(() => {}));
    const { user } = montar();
    await user.clear(campo());
    await user.type(campo(), "9");
    await user.click(salvar());

    expect(await screen.findByRole("button", { name: "Salvando…" })).toBeDisabled();
    expect(campo()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("erro ao salvar mostra o aviso, mantém o valor digitado e deixa tentar de novo", async () => {
    vi.mocked(atualizarPrisma).mockRejectedValueOnce(new ApiError("validation", "Prisma já está em uso.", 400));
    const { user } = montar();
    await user.clear(campo());
    await user.type(campo(), "9");
    await user.click(salvar());

    expect(await screen.findByRole("alert")).toHaveTextContent("Prisma já está em uso.");
    expect(campo()).toHaveValue("9");
    expect(salvar()).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("veículo que já saiu mostra o aviso e só oferece Fechar", async () => {
    vi.mocked(atualizarPrisma).mockRejectedValueOnce(new ApiError("not_found", "O veículo não está no pátio.", 404));
    const { user } = montar();
    await user.clear(campo());
    await user.type(campo(), "9");
    await user.click(salvar());

    expect(await screen.findByRole("alert")).toHaveTextContent("Este carro não está mais no pátio.");
    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
    // O cabeçalho do modal também tem o botão Fechar; o do rodapé é o último.
    await user.click(screen.getAllByRole("button", { name: "Fechar" }).at(-1)!);
    expect(onClose).toHaveBeenCalled();
  });

  it("Cancelar fecha sem gravar", async () => {
    const { user } = montar();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
    expect(atualizarPrisma).not.toHaveBeenCalled();
  });
});
