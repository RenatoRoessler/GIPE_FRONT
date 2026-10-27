import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { PatioVeiculo } from "@/types/patio";
import { ChaveBotao } from "./ChaveBotao";

function veiculo(extra: Partial<PatioVeiculo> = {}): PatioVeiculo {
  return {
    patioId: 5,
    placa: "ABC1D23",
    categoria: 2,
    modelo: "Gol",
    cor: "PRATA",
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

describe("ChaveBotao", () => {
  it("com gancho mostra a posição e se oferece para trocar", async () => {
    const onGuardar = vi.fn();
    const v = veiculo({ posicaoChave: "A2" });
    renderWithTheme(<ChaveBotao veiculo={v} onGuardar={onGuardar} />);
    const botao = screen.getByRole("button", { name: "Trocar a chave de ABC1D23, hoje no gancho A2" });
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("Chave")).toBeInTheDocument();
    expect(screen.queryByText("Fora do quadro")).not.toBeInTheDocument();
    await userEvent.click(botao);
    expect(onGuardar).toHaveBeenCalledWith(v);
  });

  it("com o nome do quadro, mostra o quadro em cima e a posição em destaque", () => {
    renderWithTheme(<ChaveBotao veiculo={veiculo({ posicaoChave: "Quadro 1 · B2", chaveRef: { quadro: "Quadro 1", linha: "B", coluna: 2 } })} onGuardar={vi.fn()} />);
    expect(screen.getByText("Quadro 1")).toBeInTheDocument();
    expect(screen.getByText("B2")).toBeInTheDocument();
  });

  it("sem a posição em partes, separa o quadro da posição pelo texto", () => {
    renderWithTheme(<ChaveBotao veiculo={veiculo({ posicaoChave: "Recepção · A2" })} onGuardar={vi.fn()} />);
    expect(screen.getByText("Recepção")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
  });

  it("sem gancho convida a guardar e diz que está fora do quadro, em texto", async () => {
    const onGuardar = vi.fn();
    const v = veiculo({ posicaoChave: null });
    renderWithTheme(<ChaveBotao veiculo={v} onGuardar={onGuardar} />);
    const botao = screen.getByRole("button", { name: "Guardar a chave de ABC1D23 no quadro" });
    expect(screen.getByText("Guardar chave")).toBeInTheDocument();
    expect(screen.getByText("Fora do quadro")).toBeInTheDocument();
    await userEvent.click(botao);
    expect(onGuardar).toHaveBeenCalledWith(v);
  });
});
