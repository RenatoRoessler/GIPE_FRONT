export type Periodo = { de: string; ate: string };

export type ErrosPeriodo = { de?: string; ate?: string };

export type OpcoesPeriodo = {
  // Padrão true: as duas datas são exigidas. Com false, campos vazios são aceitos (filtro opcional).
  obrigatorio?: boolean;
  // Máximo de dias do período, os dois extremos inclusos.
  maxDias?: number;
};

const doisDigitos = (valor: number) => String(valor).padStart(2, "0");

// "AAAA-MM-DD" no fuso local (o formato do campo de data), sem passar por UTC.
export function formatDataInput(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

// Do primeiro ao último dia do mês de `hoje`.
export function mesCorrente(hoje: Date): Periodo {
  return {
    de: formatDataInput(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
    ate: formatDataInput(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)),
  };
}

// Do primeiro ao último dia do mês anterior ao de `hoje` (em janeiro, dezembro do ano anterior).
export function mesAnterior(hoje: Date): Periodo {
  return {
    de: formatDataInput(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)),
    ate: formatDataInput(new Date(hoje.getFullYear(), hoje.getMonth(), 0)),
  };
}

// De 1º de janeiro a 31 de dezembro do ano de `hoje`.
export function anoCorrente(hoje: Date): Periodo {
  return { de: `${hoje.getFullYear()}-01-01`, ate: `${hoje.getFullYear()}-12-31` };
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;

function diaUtc(data: string): number {
  const [ano, mes, dia] = data.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

// Quantidade de dias do período, os dois extremos inclusos. Em UTC, para o horário de verão não mexer na conta.
export function diasDoPeriodo(periodo: Periodo): number {
  return Math.round((diaUtc(periodo.ate) - diaUtc(periodo.de)) / 86_400_000) + 1;
}

// Mensagens por campo; objeto vazio = período válido.
export function validarPeriodo(periodo: Periodo, { obrigatorio = true, maxDias }: OpcoesPeriodo = {}): ErrosPeriodo {
  const erros: ErrosPeriodo = {};
  if (!DATA.test(periodo.de) && (obrigatorio || periodo.de !== "")) {
    erros.de = "Informe a data inicial";
  }
  if (!DATA.test(periodo.ate) && (obrigatorio || periodo.ate !== "")) {
    erros.ate = "Informe a data final";
  }
  if (DATA.test(periodo.de) && DATA.test(periodo.ate)) {
    // Datas no formato AAAA-MM-DD se comparam como texto.
    if (periodo.ate < periodo.de) {
      erros.ate = "A data final deve ser igual ou posterior à inicial";
    } else if (maxDias !== undefined && diasDoPeriodo(periodo) > maxDias) {
      erros.ate = `Escolha um período de até ${maxDias} dias`;
    }
  }
  return erros;
}
