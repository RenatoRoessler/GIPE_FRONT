import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { proximoCampo } from "./proximoCampo";

const campo = (nome: string) => screen.getByLabelText(nome) as HTMLInputElement;

describe("proximoCampo", () => {
  it("devolve o próximo campo na ordem do DOM", () => {
    render(
      <form>
        <input aria-label="a" />
        <input aria-label="b" />
      </form>,
    );

    expect(proximoCampo(campo("a"))).toBe(campo("b"));
  });

  it("pula desabilitado, somente leitura, hidden, radio e checkbox", () => {
    render(
      <form>
        <input aria-label="a" />
        <input aria-label="b" disabled />
        <input aria-label="c" readOnly />
        <input aria-label="d" type="hidden" />
        <input aria-label="e" type="radio" />
        <input aria-label="f" type="checkbox" />
        <div hidden>
          <input aria-label="g" />
        </div>
        <textarea aria-label="h" />
      </form>,
    );

    expect(proximoCampo(campo("a"))).toBe(screen.getByLabelText("h"));
  });

  it("devolve null no último campo", () => {
    render(
      <form>
        <input aria-label="a" />
        <input aria-label="b" />
      </form>,
    );

    expect(proximoCampo(campo("b"))).toBeNull();
  });

  it("não sai do <dialog> do campo", () => {
    render(
      <div>
        <dialog open>
          <input aria-label="a" />
        </dialog>
        <input aria-label="fora" />
      </div>,
    );

    expect(proximoCampo(campo("a"))).toBeNull();
  });

  it("devolve null fora de <form> e <dialog>", () => {
    render(
      <div>
        <input aria-label="a" />
        <input aria-label="b" />
      </div>,
    );

    expect(proximoCampo(campo("a"))).toBeNull();
  });
});
