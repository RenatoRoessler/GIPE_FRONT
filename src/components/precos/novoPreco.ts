import { EMPTY_PRECO_FORM_VALUES, type PrecoFormValues } from "@/types/preco";

const doisDigitos = (valor: number) => String(valor).padStart(2, "0");

// Formato de <input type="datetime-local">: "YYYY-MM-DDTHH:mm", no fuso do navegador, à meia-noite do dia.
export function inicioVigenciaDeHoje(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}T00:00`;
}

// Valores iniciais do cadastro: tudo vazio, exceto o início da vigência, que parte da data de hoje.
export function novoPrecoFormValues(agora: Date = new Date()): PrecoFormValues {
  return {
    ...EMPTY_PRECO_FORM_VALUES,
    info: { ...EMPTY_PRECO_FORM_VALUES.info, inicioVigencia: inicioVigenciaDeHoje(agora) },
  };
}
