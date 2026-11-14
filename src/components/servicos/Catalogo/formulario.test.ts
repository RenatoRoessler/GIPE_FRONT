import { describe, expect, it } from "vitest";
import { SERVICO_FORM_VAZIO, type CategoriaFormValues, type ServicoFormValues } from "@/lib/schemas/servico";
import {
  categoriasLigadas,
  categoriasSemValor,
  detalheDaRevisao,
  mascararValor,
  problemaDoPasso2,
  progressoDasCategorias,
  repetirParaAsSemValor,
  resumoDaCategoria,
  soMinutos,
  temErros,
  validarServico,
} from "./formulario";

function com(parcial: Partial<ServicoFormValues>, categorias: Record<number, Partial<CategoriaFormValues>> = {}): ServicoFormValues {
  const base = Object.fromEntries(Object.entries(SERVICO_FORM_VAZIO.categorias).map(([id, linha]) => [id, { ...linha, ...categorias[Number(id)] }]));
  return { ...SERVICO_FORM_VAZIO, ...parcial, categorias: base };
}

const TODAS_COM_VALOR = Object.fromEntries([1, 2, 3, 4, 5, 6].map((id) => [id, { valor: "10,00" }]));

describe("mascararValor", () => {
  it("os dígitos entram como centavos", () => {
    expect(mascararValor("4")).toBe("0,04");
    expect(mascararValor("40")).toBe("0,40");
    expect(mascararValor("400")).toBe("4,00");
    expect(mascararValor("4000")).toBe("40,00");
  });

  it("o milhar leva ponto", () => {
    expect(mascararValor("123456")).toBe("1.234,56");
    expect(mascararValor("100000000")).toBe("1.000.000,00");
  });

  it("digitar sobre o valor já mascarado continua de onde parou", () => {
    expect(mascararValor("40,10" + "5")).toBe("401,05");
  });

  it("ignora o que não é dígito e os zeros à esquerda; sem dígito, vazio", () => {
    expect(mascararValor("R$ 1a2")).toBe("0,12");
    expect(mascararValor("000")).toBe("");
    expect(mascararValor("")).toBe("");
    expect(mascararValor("abc")).toBe("");
  });
});

describe("soMinutos", () => {
  it("só dígitos, até quatro", () => {
    expect(soMinutos("1a2,3")).toBe("123");
    expect(soMinutos("123456")).toBe("1234");
  });
});

describe("validarServico", () => {
  it("serviço completo não tem erro", () => {
    expect(temErros(validarServico(com({ nome: "Cera" }, TODAS_COM_VALOR), { nomeRepetido: false }))).toBe(false);
  });

  it("nome vazio ou repetido, com os textos do protótipo", () => {
    expect(validarServico(com({ nome: " " }, TODAS_COM_VALOR), { nomeRepetido: false }).nome).toBe("Dê um nome ao serviço");
    expect(validarServico(com({ nome: "Cera" }, TODAS_COM_VALOR), { nomeRepetido: true }).nome).toBe("Já existe um serviço ativo com esse nome. Use outro.");
  });

  it("categoria ligada sem valor: nomeia as categorias, na ordem da tela, e marca os campos", () => {
    const erros = validarServico(com({ nome: "Cera" }, { 1: { valor: "10,00" }, 2: { valor: "10,00" }, 3: { valor: "10,00" } }), { nomeRepetido: false });

    expect(erros.preco).toBe("Informe o valor de Carro grande, Caminhonete, Caminhão ou desligue a categoria");
    expect(Object.keys(erros.valor).map(Number).sort()).toEqual([4, 5, 6]);
  });

  it("categoria desligada não pede valor", () => {
    const erros = validarServico(com({ nome: "Cera" }, { 1: { valor: "10,00" }, 2: { recebe: false }, 3: { recebe: false }, 4: { recebe: false }, 5: { recebe: false }, 6: { recebe: false } }), { nomeRepetido: false });

    expect(temErros(erros)).toBe(false);
  });

  it("nenhuma categoria ligada", () => {
    const desligadas = Object.fromEntries([1, 2, 3, 4, 5, 6].map((id) => [id, { recebe: false }]));
    expect(validarServico(com({ nome: "Cera" }, desligadas), { nomeRepetido: false }).preco).toBe("Deixe pelo menos uma categoria recebendo o serviço");
  });

  it("duração zero: marca o campo e avisa; vazio é permitido", () => {
    const erros = validarServico(com({ nome: "Cera" }, { ...TODAS_COM_VALOR, 2: { valor: "10,00", duracao: "0" } }), { nomeRepetido: false });

    expect(erros.duracao).toBe("A duração precisa ser maior que zero, ou deixe em branco");
    expect(erros.tempo).toEqual({ 2: true });
    expect(temErros(validarServico(com({ nome: "Cera" }, { ...TODAS_COM_VALOR, 2: { valor: "10,00", duracao: "" } }), { nomeRepetido: false }))).toBe(false);
  });

  it("valor zero conta como sem valor", () => {
    expect(validarServico(com({ nome: "Cera" }, { ...TODAS_COM_VALOR, 1: { valor: "0,00" } }), { nomeRepetido: false }).valor).toEqual({ 1: true });
  });
});

describe("categorias do passo 2", () => {
  it("ligadas e sem valor, na ordem da tela", () => {
    const valores = com({}, { 1: { valor: "20" }, 3: { recebe: false } });
    expect(categoriasLigadas(valores)).toEqual([1, 2, 6, 4, 5]);
    expect(categoriasSemValor(valores)).toEqual([2, 6, 4, 5]);
  });

  it("progresso", () => {
    expect(progressoDasCategorias(com({}, { 1: { valor: "20" }, 2: { valor: "40" }, 3: { recebe: false } }))).toEqual({ ligadas: 5, prontas: 2, semValor: 3 });
  });

  it("o problema do passo, com os textos do protótipo", () => {
    const desligadas = Object.fromEntries([1, 2, 3, 4, 5, 6].map((id) => [id, { recebe: false }]));
    expect(problemaDoPasso2(com({}, desligadas))).toBe("Deixe pelo menos uma categoria recebendo o serviço");
    expect(problemaDoPasso2(com({}, { 1: { valor: "20" }, 2: { valor: "20" }, 3: { valor: "20" }, 6: { valor: "20" }, 4: { valor: "20" } }))).toBe("Defina o valor de Caminhão ou desligue a categoria");
    expect(problemaDoPasso2(com({}, TODAS_COM_VALOR))).toBeNull();
  });
});

describe("resumos", () => {
  it("resumo do botão da categoria", () => {
    expect(resumoDaCategoria({ recebe: false, valor: "", duracao: "", gratis: "" })).toBe("Não faz");
    expect(resumoDaCategoria({ recebe: true, valor: "", duracao: "", gratis: "" })).toBe("Toque para definir");
    expect(resumoDaCategoria({ recebe: true, valor: "70,00", duracao: "75", gratis: "120" })).toBe("R$ 70,00 · 1h15 · 2h grátis");
    expect(resumoDaCategoria({ recebe: true, valor: "70,00", duracao: "", gratis: "" })).toBe("R$ 70,00 · cobra permanência");
  });

  it("detalhe da revisão", () => {
    expect(detalheDaRevisao({ recebe: true, valor: "1", duracao: "60", gratis: "120" })).toBe("leva 1h · 2h grátis no pátio");
    expect(detalheDaRevisao({ recebe: true, valor: "1", duracao: "", gratis: "" })).toBe("sem previsão · cobra permanência");
  });
});

describe("repetirParaAsSemValor", () => {
  it("copia valor e tempos da categoria editada para as ligadas sem valor, sem tocar nas outras", () => {
    const resultado = repetirParaAsSemValor(com({}, { 3: { valor: "70", duracao: "60", gratis: "120" }, 4: { valor: "90" }, 5: { recebe: false } }), 3);

    expect(resultado.categorias[1]).toMatchObject({ valor: "70", duracao: "60", gratis: "120" });
    expect(resultado.categorias[4].valor).toBe("90");
    expect(resultado.categorias[5]).toMatchObject({ recebe: false, valor: "" });
  });
});
