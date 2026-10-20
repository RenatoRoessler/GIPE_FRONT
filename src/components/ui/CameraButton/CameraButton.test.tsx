import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { CameraButton } from "./CameraButton";

describe("CameraButton", () => {
  it("tem o rótulo acessível padrão", () => {
    renderWithTheme(<CameraButton />);
    expect(screen.getByRole("button", { name: "Ler placa pela câmera" })).toBeInTheDocument();
  });

  it("aceita outro rótulo", () => {
    renderWithTheme(<CameraButton aria-label="Fotografar" />);
    expect(screen.getByRole("button", { name: "Fotografar" })).toBeInTheDocument();
  });

  it("chama onClick ao clicar", async () => {
    const onClick = vi.fn();
    renderWithTheme(<CameraButton onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("não responde quando desabilitado", async () => {
    const onClick = vi.fn();
    renderWithTheme(<CameraButton disabled onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
