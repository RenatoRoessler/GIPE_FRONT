import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { Key } from "./Key";

describe("Key", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dispara onPress no toque", () => {
    const onPress = vi.fn();
    renderWithTheme(<Key label="A" onPress={onPress} />);

    fireEvent.click(screen.getByRole("button", { name: "A" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("usa o ariaLabel como nome acessível", () => {
    renderWithTheme(<Key variant="fn" label="⌫" ariaLabel="Apagar" onPress={() => {}} />);

    expect(screen.getByRole("button", { name: "Apagar" })).toBeInTheDocument();
  });

  it("não dispara nada quando desabilitada", () => {
    const onPress = vi.fn();
    renderWithTheme(<Key label="A" disabled onPress={onPress} />);

    const tecla = screen.getByRole("button", { name: "A" });
    fireEvent.click(tecla);

    expect(tecla).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it("toque longo de 450 ms dispara onLongPress e descarta o click seguinte", () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    renderWithTheme(<Key label=".-" onPress={onPress} onLongPress={onLongPress} />);
    const tecla = screen.getByRole("button", { name: ".-" });

    fireEvent.pointerDown(tecla);
    act(() => {
      vi.advanceTimersByTime(450);
    });
    fireEvent.pointerUp(tecla);
    fireEvent.click(tecla);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("soltar antes de 450 ms cancela o toque longo e vale como toque curto", () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    renderWithTheme(<Key label=".-" onPress={onPress} onLongPress={onLongPress} />);
    const tecla = screen.getByRole("button", { name: ".-" });

    fireEvent.pointerDown(tecla);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.pointerUp(tecla);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.click(tecla);

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each(["pointerCancel", "pointerLeave"] as const)("%s cancela o toque longo", (evento) => {
    const onLongPress = vi.fn();
    renderWithTheme(<Key label=".-" onPress={() => {}} onLongPress={onLongPress} />);
    const tecla = screen.getByRole("button", { name: ".-" });

    fireEvent.pointerDown(tecla);
    fireEvent[evento](tecla);
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("vibra 10 ms quando o aparelho suporta", () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    renderWithTheme(<Key label="A" onPress={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "A" }));

    expect(vibrate).toHaveBeenCalledWith(10);
    Reflect.deleteProperty(navigator, "vibrate");
  });
});
