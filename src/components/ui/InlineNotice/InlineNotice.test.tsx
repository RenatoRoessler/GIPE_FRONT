import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { InlineNotice } from "./InlineNotice";

describe("InlineNotice", () => {
  it("mostra o texto como status", () => {
    renderWithTheme(<InlineNotice>Câmera indisponível. Digite a placa.</InlineNotice>);
    expect(screen.getByRole("status")).toHaveTextContent("Câmera indisponível. Digite a placa.");
  });

  it("chama a ação ao tocar no botão", async () => {
    const onAction = vi.fn();
    renderWithTheme(
      <InlineNotice actionLabel="Tentar câmera" onAction={onAction}>
        Câmera indisponível.
      </InlineNotice>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Tentar câmera" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("não mostra botão sem ação e mostra o detalhe quando existe", () => {
    renderWithTheme(
      <InlineNotice variant="warning" details={<p>Toque no cadeado</p>}>
        Aviso
      </InlineNotice>,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Toque no cadeado")).toBeInTheDocument();
  });
});
