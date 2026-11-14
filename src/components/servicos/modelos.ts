import { CATEGORIAS_SERVICO } from "@/types/servico";

// Atalhos de digitação do cadastro: o valor, a duração e o tempo grátis são sugestões para o administrador ajustar,
// não uma tabela de preços do negócio. Moto custa a metade e o caminhão o dobro; o resto varia entre esses extremos.
const FATOR_DE_VALOR: Record<number, number> = { 1: 0.5, 2: 1, 3: 1, 4: 1.3, 5: 2, 6: 1.2 };
// A duração não encolhe abaixo de 60% do serviço-base (uma moto não lava em metade do tempo de um carro).
const FATOR_MINIMO_DE_DURACAO = 0.6;
const PASSO = 5;

export interface ModeloDeServico {
  nome: string;
  descricao: string;
  // Do carro pequeno: as outras categorias derivam dele pelo fator.
  valorBase: number;
  duracaoBase: number;
  gratisBase: number;
  // Categorias que o serviço não atende (ex.: higienização interna não se faz em moto).
  naoAtende?: number[];
}

export const MODELOS_DE_SERVICO: ModeloDeServico[] = [
  { nome: "Lavagem simples", descricao: "Externa com shampoo neutro e secagem.", valorBase: 40, duracaoBase: 30, gratisBase: 60 },
  {
    nome: "Lavagem completa",
    descricao: "Externa, aspiração interna, painel e pretinho nos pneus.",
    valorBase: 70,
    duracaoBase: 60,
    gratisBase: 120,
  },
  {
    nome: "Higienização interna",
    descricao: "Bancos, carpete e teto com extratora.",
    valorBase: 250,
    duracaoBase: 180,
    gratisBase: 240,
    naoAtende: [1],
  },
  { nome: "Polimento", descricao: "Polimento técnico da pintura com cera.", valorBase: 350, duracaoBase: 240, gratisBase: 300 },
  { nome: "Cera rápida", descricao: "", valorBase: 25, duracaoBase: 15, gratisBase: 0 },
];

// Campos do formulário, em texto como nos inputs ("40,00" e "30").
export interface CategoriaDoModelo {
  recebe: boolean;
  valor: string;
  duracao: string;
  gratis: string;
}

export interface ValoresDoModelo {
  nome: string;
  descricao: string;
  categorias: Record<number, CategoriaDoModelo>;
}

function arredondar(valor: number): number {
  return Math.round(valor / PASSO) * PASSO;
}

function emReais(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

// Tempo grátis 0 quer dizer "cobra a permanência": vai vazio, como o operador deixaria o campo.
export function aplicarModelo(modelo: ModeloDeServico): ValoresDoModelo {
  const categorias: Record<number, CategoriaDoModelo> = {};
  for (const categoria of CATEGORIAS_SERVICO) {
    if (modelo.naoAtende?.includes(categoria)) {
      categorias[categoria] = { recebe: false, valor: "", duracao: "", gratis: "" };
      continue;
    }
    const fator = FATOR_DE_VALOR[categoria];
    categorias[categoria] = {
      recebe: true,
      valor: emReais(arredondar(modelo.valorBase * fator)),
      duracao: String(arredondar(modelo.duracaoBase * Math.max(fator, FATOR_MINIMO_DE_DURACAO))),
      gratis: modelo.gratisBase > 0 ? String(modelo.gratisBase) : "",
    };
  }
  return { nome: modelo.nome, descricao: modelo.descricao, categorias };
}
