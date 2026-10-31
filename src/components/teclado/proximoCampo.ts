export type CampoTexto = HTMLInputElement | HTMLTextAreaElement;

const TIPOS_SEM_TECLADO = new Set(["hidden", "radio", "checkbox", "button", "submit", "reset", "file", "image", "range", "color"]);

function focavel(campo: CampoTexto): boolean {
  if (campo.disabled || campo.readOnly || campo.hidden || campo.closest("[hidden]")) {
    return false;
  }
  return !(campo instanceof HTMLInputElement && TIPOS_SEM_TECLADO.has(campo.type));
}

// Próximo campo de texto focável, na ordem do DOM, dentro do mesmo <dialog> ou <form>; `null` no último.
export function proximoCampo(atual: CampoTexto): CampoTexto | null {
  const raiz = atual.closest("dialog, form");
  if (!raiz) {
    return null;
  }
  const campos = Array.from(raiz.querySelectorAll<CampoTexto>("input, textarea"));
  const indice = campos.indexOf(atual);
  return campos.slice(indice + 1).find(focavel) ?? null;
}
