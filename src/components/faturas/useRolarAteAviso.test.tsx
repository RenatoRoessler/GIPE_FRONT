import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRolarAteAviso } from "./useRolarAteAviso";

const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
});

function Aviso({ ativo }: { ativo: boolean }) {
  const ref = useRolarAteAviso(ativo);
  return <div ref={ref}>aviso</div>;
}

describe("useRolarAteAviso", () => {
  it("não rola enquanto o aviso não está ativo", () => {
    render(<Aviso ativo={false} />);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("rola até o aviso quando ele passa a estar ativo", () => {
    const { rerender } = render(<Aviso ativo={false} />);
    rerender(<Aviso ativo />);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("não rola de novo enquanto continua ativo e volta a rolar numa nova ativação", () => {
    const { rerender } = render(<Aviso ativo />);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    rerender(<Aviso ativo />);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    rerender(<Aviso ativo={false} />);
    rerender(<Aviso ativo />);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });
});
