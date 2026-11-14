import { describe, expect, it } from "vitest";
import { SERVICO_FORM_VAZIO, type CategoriaFormValues, type ServicoFormValues } from "@/lib/schemas/servico";
import { repetirPrimeiraLinha, SEM_ORIGEM } from "./repetir";

function com(parciais: Record<number, Partial<CategoriaFormValues>>): ServicoFormValues {
  const categorias = Object.fromEntries(
    Object.entries(SERVICO_FORM_VAZIO.categorias).map(([id, linha]) => [id, { ...linha, ...parciais[Number(id)] }]),
  );
  return { ...SERVICO_FORM_VAZIO, categorias };
}

describe("repetirPrimeiraLinha", () => {
  it("copia valor, duração e tempo grátis da primeira categoria com valor para as vazias", () => {
    const resultado = repetirPrimeiraLinha(com({ 1: { valor: "40,00", duracao: "30", gratis: "60" } }));

    expect(resultado).toMatchObject({ ok: true, origem: 1, copiadas: 5 });
    if (!resultado.ok) return;
    for (const id of [2, 3, 4, 5, 6]) {
      expect(resultado.valores.categorias[id]).toMatchObject({ valor: "40,00", duracao: "30", gratis: "60" });
    }
  });

  it("a origem é a primeira ligada com valor, não necessariamente a Moto", () => {
    const resultado = repetirPrimeiraLinha(com({ 1: { recebe: false }, 2: { valor: "" }, 3: { valor: "70,00" } }));
    expect(resultado).toMatchObject({ ok: true, origem: 3, copiadas: 4 });
  });

  it("não sobrescreve categoria já preenchida", () => {
    const resultado = repetirPrimeiraLinha(com({ 1: { valor: "40,00" }, 3: { valor: "99,00", duracao: "10" } }));
    expect(resultado).toMatchObject({ ok: true, copiadas: 4 });
    if (!resultado.ok) return;
    expect(resultado.valores.categorias[3]).toMatchObject({ valor: "99,00", duracao: "10" });
  });

  it("a origem sem duração não apaga a que a categoria vazia já tinha", () => {
    const resultado = repetirPrimeiraLinha(com({ 1: { valor: "40,00" }, 2: { duracao: "45" } }));
    if (!resultado.ok) throw new Error("esperava ok");
    expect(resultado.valores.categorias[2]).toMatchObject({ valor: "40,00", duracao: "45" });
  });

  it("a duração da origem vale para as vazias, mesmo que já tenham uma", () => {
    const resultado = repetirPrimeiraLinha(com({ 1: { valor: "40,00", duracao: "30" }, 2: { duracao: "45" } }));
    if (!resultado.ok) throw new Error("esperava ok");
    expect(resultado.valores.categorias[2]).toMatchObject({ valor: "40,00", duracao: "30" });
  });

  it("não liga categoria desligada", () => {
    const resultado = repetirPrimeiraLinha(com({ 1: { valor: "40,00" }, 4: { recebe: false } }));
    expect(resultado).toMatchObject({ ok: true, copiadas: 4 });
    if (!resultado.ok) return;
    expect(resultado.valores.categorias[4]).toMatchObject({ recebe: false, valor: "" });
  });

  it("sem vazia para preencher, copia zero e devolve os mesmos valores", () => {
    const todas = com(Object.fromEntries([1, 2, 3, 4, 5, 6].map((id) => [id, { valor: "10,00" }])));
    expect(repetirPrimeiraLinha(todas)).toMatchObject({ ok: true, copiadas: 0 });
  });

  it("sem nenhuma categoria com valor, devolve o erro", () => {
    expect(repetirPrimeiraLinha(com({}))).toEqual({ ok: false, erro: SEM_ORIGEM });
    expect(repetirPrimeiraLinha(com({ 1: { recebe: false, valor: "40,00" } }))).toEqual({ ok: false, erro: SEM_ORIGEM });
  });

  it("não altera o objeto recebido", () => {
    const entrada = com({ 1: { valor: "40,00" } });
    repetirPrimeiraLinha(entrada);
    expect(entrada.categorias[2].valor).toBe("");
  });
});
