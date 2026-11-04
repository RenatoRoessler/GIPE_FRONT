import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { conferenciaAberta } from "@/lib/api/services/conferenciaPatio.fixture";
import { fromConferenciaResponse } from "@/lib/api/services/conferenciaPatio.mapper";
import { renderWithProviders } from "@/test/render";
import { conferenciaAbertaKey } from "../conferenciaKeys";

vi.mock("@/lib/api/services/conferenciaPatio", () => ({
  obterAberta: vi.fn(),
  obterResumo: vi.fn(),
  iniciarConferencia: vi.fn(),
  lerPlaca: vi.fn(),
  marcarItem: vi.fn(),
  descartarSemEntrada: vi.fn(),
  finalizarConferencia: vi.fn(),
}));

const navegacao = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navegacao.push, replace: navegacao.replace }),
  usePathname: () => "/conferencia-patio",
  useSearchParams: () => navegacao.params,
}));

// As etapas têm os seus próprios testes: aqui só importa qual delas a página escolhe e o que entrega a ela.
vi.mock("../ConferenciaInicio", () => ({
  ConferenciaInicio: ({ conferencia, onIr }: { conferencia: unknown; onIr: (etapa: "conferindo") => void }) => (
    <div>
      <h1>Início {conferencia ? "com conferência" : "sem conferência"}</h1>
      <button type="button" onClick={() => onIr("conferindo")}>
        ir
      </button>
    </div>
  ),
}));
vi.mock("../ConferenciaConferindo", () => ({ ConferenciaConferindo: () => <h1>Etapa conferindo</h1> }));
vi.mock("../ConferenciaDivergencias", () => ({ ConferenciaDivergencias: () => <h1>Etapa divergências</h1> }));
vi.mock("../ConferenciaResumo", () => ({ ConferenciaResumo: () => <h1>Etapa resumo</h1> }));

import { obterAberta } from "@/lib/api/services/conferenciaPatio";
import { AVISO_ENCERRADA, ConferenciaPage, etapaDaUrl } from "./ConferenciaPage";

const conferencia = fromConferenciaResponse(conferenciaAberta);

function abrir(etapa?: string) {
  navegacao.params = new URLSearchParams(etapa ? { etapa } : {});
  return renderWithProviders(<ConferenciaPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(obterAberta).mockResolvedValue(conferencia);
});

describe("etapaDaUrl", () => {
  it.each([
    ["conferindo", "conferindo"],
    ["divergencias", "divergencias"],
    ["resumo", "resumo"],
    ["inicio", "inicio"],
    ["qualquer", "inicio"],
    [null, "inicio"],
  ])("%s → %s", (valor, esperado) => {
    expect(etapaDaUrl(valor)).toBe(esperado);
  });
});

describe("ConferenciaPage", () => {
  it("mostra o esqueleto enquanto carrega", () => {
    vi.mocked(obterAberta).mockReturnValue(new Promise(() => {}));
    abrir();
    expect(screen.getByRole("status", { name: "Carregando a conferência" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Conferência de pátio" })).toBeInTheDocument();
  });

  it("sem etapa na URL mostra o início, com a conferência em andamento", async () => {
    abrir();
    expect(await screen.findByRole("heading", { name: "Início com conferência" })).toBeInTheDocument();
  });

  it("sem conferência em andamento mostra o início", async () => {
    vi.mocked(obterAberta).mockResolvedValue(null);
    abrir();
    expect(await screen.findByRole("heading", { name: "Início sem conferência" })).toBeInTheDocument();
    expect(navegacao.replace).not.toHaveBeenCalled();
  });

  it.each([
    ["conferindo", "Etapa conferindo"],
    ["divergencias", "Etapa divergências"],
    ["resumo", "Etapa resumo"],
  ])("a etapa %s da URL abre a tela dela", async (etapa, titulo) => {
    abrir(etapa);
    expect(await screen.findByRole("heading", { name: titulo })).toBeInTheDocument();
    expect(navegacao.replace).not.toHaveBeenCalled();
  });

  it("etapa avançada sem conferência volta para o início, sem avisar", async () => {
    vi.mocked(obterAberta).mockResolvedValue(null);
    abrir("conferindo");
    await waitFor(() => expect(navegacao.replace).toHaveBeenCalledWith("/conferencia-patio"));
    expect(screen.queryByText(AVISO_ENCERRADA)).not.toBeInTheDocument();
  });

  it("navega entre as etapas pela URL", async () => {
    const { container } = abrir();
    await screen.findByRole("heading", { name: "Início com conferência" });
    container.querySelector("button")?.click();
    expect(navegacao.push).toHaveBeenCalledWith("/conferencia-patio?etapa=conferindo");
  });

  it("avisa quando a conferência some por ação de outra pessoa", async () => {
    const { queryClient } = abrir("conferindo");
    await screen.findByRole("heading", { name: "Etapa conferindo" });

    queryClient.setQueryData(conferenciaAbertaKey, null);

    expect(await screen.findByText(AVISO_ENCERRADA)).toBeInTheDocument();
    expect(navegacao.replace).toHaveBeenCalledWith("/conferencia-patio");
  });

  it("mostra o erro com a mensagem do back e permite tentar de novo", async () => {
    vi.mocked(obterAberta).mockRejectedValue(new ApiError("server", "Falha no servidor.", 500));
    abrir();

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha no servidor.");
    vi.mocked(obterAberta).mockResolvedValue(conferencia);
    screen.getByRole("button", { name: "Tentar novamente" }).click();
    expect(await screen.findByRole("heading", { name: "Início com conferência" })).toBeInTheDocument();
  });

  it("erro de permissão não oferece tentar de novo", async () => {
    vi.mocked(obterAberta).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    abrir();

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });
});
