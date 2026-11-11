import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

const abrirTour = vi.hoisted(() => vi.fn());
vi.mock("../OnboardingProvider", () => ({ useOnboardingTour: () => ({ abrirTour }) }));

import { RepetirTourButton } from "./RepetirTourButton";

describe("RepetirTourButton", () => {
  it("mostra Repetir tour e abre o tour ao clicar", async () => {
    renderWithTheme(<RepetirTourButton />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Repetir tour" }));

    expect(abrirTour).toHaveBeenCalledTimes(1);
  });
});
