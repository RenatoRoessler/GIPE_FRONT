import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Configuracao } from "@/types/configuracao";

const servico = vi.hoisted(() => ({ getConfiguracao: vi.fn(), updateConfiguracao: vi.fn() }));
vi.mock("@/lib/api/services/configuracao", () => servico);

import { ConfiguracaoEntradaForm } from "./ConfiguracaoEntradaForm";

const PADRAO: Configuracao = { modelo: true, cor: true, prisma: false, servicos: false, entradaDiretoCamera: true, alteradoPorId: null, alteradoEm: null };

function renderizar(initial: Configuracao = PADRAO, podeEditar = true) {
  return renderWithProviders(<ConfiguracaoEntradaForm initial={initial} podeEditar={podeEditar} />);
}

const chave = (nome: string) => screen.getByRole("switch", { name: nome });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ConfiguracaoEntradaForm", () => {
  it("mostra o padrão da empresa sem configuração gravada, sem auditoria e com Salvar desabilitado", () => {
    renderizar();
    expect(chave("Modelo obrigatório")).toHaveAttribute("aria-checked", "true");
    expect(chave("Cor obrigatória")).toHaveAttribute("aria-checked", "true");
    expect(chave("Prisma obrigatório")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(screen.queryByText(/Última alteração/)).not.toBeInTheDocument();
  });

  it("liga a frase do efeito a cada chave", () => {
    renderizar();
    expect(chave("Prisma obrigatório")).toHaveAccessibleDescription("Pede o número do prisma (de 1 a 999). Mensalista pode entrar sem ele.");
  });

  it("mostra a data da última alteração quando existe", () => {
    renderizar({ ...PADRAO, alteradoPorId: 48, alteradoEm: "2026-11-08T16:36:03" });
    expect(screen.getByText(/^Última alteração em 08\/11\/2026.*16:36\.$/)).toBeInTheDocument();
  });

  it("alterar uma chave habilita Salvar e avisa que há alterações", async () => {
    renderizar();
    await userEvent.click(chave("Prisma obrigatório"));
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
    expect(screen.getByText("Alterações não salvas")).toBeInTheDocument();
  });

  it("voltar ao valor gravado desabilita Salvar de novo", async () => {
    renderizar();
    await userEvent.click(chave("Prisma obrigatório"));
    await userEvent.click(chave("Prisma obrigatório"));
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("salva preservando as opções que a tela não edita (serviços e câmera direta)", async () => {
    servico.updateConfiguracao.mockResolvedValue(undefined);
    renderizar({ ...PADRAO, servicos: true, entradaDiretoCamera: false });
    await userEvent.click(chave("Cor obrigatória"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(servico.updateConfiguracao).toHaveBeenCalledWith({ modelo: true, cor: false, prisma: false, servicos: true, entradaDiretoCamera: false }),
    );
  });

  it("ligar Serviços habilita Salvar e envia servicos: true", async () => {
    servico.updateConfiguracao.mockResolvedValue(undefined);
    renderizar({ ...PADRAO, entradaDiretoCamera: false });
    expect(chave("Serviços (lava-rápido)")).toHaveAttribute("aria-checked", "false");
    await userEvent.click(chave("Serviços (lava-rápido)"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(servico.updateConfiguracao).toHaveBeenCalledWith({ modelo: true, cor: true, prisma: false, servicos: true, entradaDiretoCamera: false }),
    );
  });

  it("mostra Serviços ligado quando a empresa já o usa e desliga ao salvar", async () => {
    servico.updateConfiguracao.mockResolvedValue(undefined);
    renderizar({ ...PADRAO, servicos: true });
    expect(chave("Serviços (lava-rápido)")).toHaveAttribute("aria-checked", "true");
    await userEvent.click(chave("Serviços (lava-rápido)"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(servico.updateConfiguracao).toHaveBeenCalledWith(expect.objectContaining({ servicos: false })));
  });

  it("salva os três campos, confirma e deixa de ter alterações", async () => {
    servico.updateConfiguracao.mockResolvedValue(undefined);
    renderizar();
    await userEvent.click(chave("Prisma obrigatório"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(servico.updateConfiguracao).toHaveBeenCalledWith({ modelo: true, cor: true, prisma: true, servicos: false, entradaDiretoCamera: true }));
    expect(await screen.findByText("Configuração salva.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(chave("Prisma obrigatório")).toHaveAttribute("aria-checked", "true");
  });

  it("durante o envio trava as chaves e mostra Salvando…", async () => {
    servico.updateConfiguracao.mockReturnValue(new Promise(() => {}));
    renderizar();
    await userEvent.click(chave("Cor obrigatória"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("button", { name: "Salvando…" })).toBeDisabled();
    expect(chave("Cor obrigatória")).toBeDisabled();
  });

  it("erro ao salvar mostra o aviso e mantém o que foi marcado", async () => {
    servico.updateConfiguracao.mockRejectedValue(new ApiError("network"));
    renderizar();
    await userEvent.click(chave("Prisma obrigatório"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(chave("Prisma obrigatório")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("somente leitura: chaves desabilitadas, selo e sem botão Salvar", () => {
    renderizar(PADRAO, false);
    expect(screen.getByText("Somente leitura")).toBeInTheDocument();
    expect(chave("Modelo obrigatório")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
  });
});
