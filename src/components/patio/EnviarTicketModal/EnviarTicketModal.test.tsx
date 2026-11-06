import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { EnviarTicketModal } from "./EnviarTicketModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
    this.querySelector<HTMLElement>("button")?.focus();
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

function abrir(props: Partial<React.ComponentProps<typeof EnviarTicketModal>> = {}) {
  const onClose = vi.fn();
  const onEnviado = vi.fn();
  renderWithTheme(
    <EnviarTicketModal placa="FLP3C88" token="tok123" estacionamento="Estacionamento Central" onClose={onClose} onEnviado={onEnviado} {...props} />,
  );
  return { onClose, onEnviado };
}

const link = () => `${window.location.origin}/comprovante/tok123`;

describe("EnviarTicketModal", () => {
  it("abre com WhatsApp, campo focado, botão desabilitado e prévia com placa e link", () => {
    abrir();
    expect(screen.getByRole("radio", { name: "WhatsApp" })).toBeChecked();
    expect(screen.getByLabelText("WhatsApp do cliente")).toHaveFocus();
    expect(screen.getByRole("button", { name: "Abrir WhatsApp" })).toBeDisabled();
    const previa = screen.getByLabelText("Prévia da mensagem");
    expect(previa).toHaveTextContent("FLP3C88");
    expect(previa).toHaveTextContent(link());
  });

  it("aplica a máscara no WhatsApp e habilita o envio com número válido", async () => {
    const user = userEvent.setup();
    abrir();
    await user.type(screen.getByLabelText("WhatsApp do cliente"), "11912345678");
    expect(screen.getByLabelText("WhatsApp do cliente")).toHaveValue("(11) 91234-5678");
    expect(screen.getByRole("button", { name: "Abrir WhatsApp" })).toBeEnabled();
  });

  it("mostra o erro só depois de tocar no campo", async () => {
    const user = userEvent.setup();
    abrir();
    await user.type(screen.getByLabelText("WhatsApp do cliente"), "1191");
    expect(screen.queryByText("Informe o WhatsApp com DDD.")).not.toBeInTheDocument();
    await user.tab();
    expect(screen.getByText("Informe o WhatsApp com DDD.")).toBeInTheDocument();
  });

  it("trocar o canal limpa contato e erro e foca o novo campo", async () => {
    const user = userEvent.setup();
    abrir();
    await user.type(screen.getByLabelText("WhatsApp do cliente"), "1191");
    await user.tab();
    await user.click(screen.getByRole("radio", { name: "E-mail" }));
    const campo = screen.getByLabelText("E-mail do cliente");
    expect(campo).toHaveValue("");
    expect(campo).toHaveFocus();
    expect(screen.queryByText("Informe o WhatsApp com DDD.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir e-mail" })).toBeDisabled();
  });

  it("e-mail inválido bloqueia o envio e mostra o motivo", async () => {
    const user = userEvent.setup();
    abrir();
    await user.click(screen.getByRole("radio", { name: "E-mail" }));
    await user.type(screen.getByLabelText("E-mail do cliente"), "cliente@exemplo");
    await user.tab();
    expect(screen.getByText("Informe um e-mail válido, como nome@dominio.com.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir e-mail" })).toBeDisabled();
  });

  it("WhatsApp: abre o wa.me com a mensagem, avisa e fecha", async () => {
    const user = userEvent.setup();
    const abrirJanela = vi.spyOn(window, "open").mockReturnValue(null);
    const { onEnviado, onClose } = abrir();
    await user.type(screen.getByLabelText("WhatsApp do cliente"), "11912345678");
    await user.click(screen.getByRole("button", { name: "Abrir WhatsApp" }));
    expect(abrirJanela).toHaveBeenCalledTimes(1);
    const [href, alvo, recursos] = abrirJanela.mock.calls[0];
    expect(String(href).startsWith("https://wa.me/5511912345678?text=")).toBe(true);
    expect(decodeURIComponent(String(href))).toContain(link());
    expect(alvo).toBe("_blank");
    expect(recursos).toBe("noopener,noreferrer");
    expect(onEnviado).toHaveBeenCalledWith("whatsapp");
    expect(onClose).toHaveBeenCalled();
  });

  it("e-mail: aponta o navegador para o mailto com destinatário e link", async () => {
    const user = userEvent.setup();
    const atribuir = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: original.origin, set href(valor: string) { atribuir(valor); } },
    });
    try {
      const { onEnviado } = abrir();
      await user.click(screen.getByRole("radio", { name: "E-mail" }));
      await user.type(screen.getByLabelText("E-mail do cliente"), "cliente@exemplo.com");
      await user.click(screen.getByRole("button", { name: "Abrir e-mail" }));
      expect(atribuir).toHaveBeenCalledTimes(1);
      expect(atribuir.mock.calls[0][0]).toMatch(/^mailto:cliente@exemplo\.com\?subject=/);
      expect(decodeURIComponent(atribuir.mock.calls[0][0])).toContain(link());
      expect(onEnviado).toHaveBeenCalledWith("email");
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: original });
    }
  });

  it("Cancelar fecha sem enviar nada", async () => {
    const user = userEvent.setup();
    const abrirJanela = vi.spyOn(window, "open").mockReturnValue(null);
    const { onClose, onEnviado } = abrir();
    await user.type(screen.getByLabelText("WhatsApp do cliente"), "11912345678");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
    expect(onEnviado).not.toHaveBeenCalled();
    expect(abrirJanela).not.toHaveBeenCalled();
  });

  it("não guarda o contato digitado em nenhum storage", async () => {
    const user = userEvent.setup();
    abrir();
    await user.type(screen.getByLabelText("WhatsApp do cliente"), "11912345678");
    expect(JSON.stringify({ ...localStorage })).not.toContain("91234");
    expect(JSON.stringify({ ...sessionStorage })).not.toContain("91234");
  });

  it("sem token avisa que não há link e só oferece Fechar", async () => {
    const user = userEvent.setup();
    const { onClose } = abrir({ token: null });
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível gerar o link do ticket.");
    expect(screen.queryByLabelText("WhatsApp do cliente")).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Fechar" }).at(-1) as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });
});
