const TOKEN = /^[A-Za-z0-9]{4,32}$/;
const COMPROVANTE_SEGMENT = "comprovante";
// GIPE-SAIDA: é o prefixo dos tickets emitidos antes da troca de nome, que continuam valendo.
const PREFIXO_SAIDA = /^(?:MUREL|GIPE)-SAIDA:/i;
const TEM_ESQUEMA = /^[a-z][a-z0-9+.-]*:\/\//i;

function tokenValido(valor: string | null | undefined): string | null {
  if (!valor) {
    return null;
  }
  let decodificado = valor;
  try {
    decodificado = decodeURIComponent(valor);
  } catch {
    // Mantém o texto original quando a codificação está quebrada.
  }
  const limpo = decodificado.trim();
  return TOKEN.test(limpo) ? limpo : null;
}

// Link sem "https://" (ex.: "gipe.com.br/comprovante/7K3Q9X") também é aceito.
function comEsquema(texto: string): string | null {
  if (TEM_ESQUEMA.test(texto)) {
    return texto;
  }
  const barra = texto.indexOf("/");
  const host = barra === -1 ? "" : texto.slice(0, barra);
  const pareceHost = host.includes(".") && !/\s/.test(texto);
  return pareceHost ? `https://${texto}` : null;
}

function lerUrl(texto: string): URL | null {
  const candidato = comEsquema(texto);
  if (!candidato) {
    return null;
  }
  try {
    return new URL(candidato);
  } catch {
    return null;
  }
}

// O QR esperado traz o token. Quem apresenta o QR do comprovante do cliente (link `.../comprovante/<token>`)
// também é atendido: o token é extraído do link. Aceita ainda `?token=<token>` e os prefixos `MUREL-SAIDA:` e `GIPE-SAIDA:`.
export function extrairTokenComprovante(texto: string): string | null {
  const value = String(texto ?? "").trim();
  const solto = tokenValido(value.replace(PREFIXO_SAIDA, ""));
  if (solto) {
    return solto;
  }

  const url = lerUrl(value);
  if (!url) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const indice = segments.findIndex((segment) => segment.toLowerCase() === COMPROVANTE_SEGMENT);
  if (indice !== -1) {
    const doCaminho = tokenValido(segments[indice + 1]);
    if (doCaminho) {
      return doCaminho;
    }
  }
  return tokenValido(url.searchParams.get("token"));
}
