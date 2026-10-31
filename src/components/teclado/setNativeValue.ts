// Escreve no <input> pelo setter nativo e dispara `input`: é o único jeito de o `onChange` de um input
// controlado do React perceber a mudança (o setter do React ignora atribuições diretas a `value`).
export function setNativeValue(el: HTMLInputElement, valor: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (setter) {
    setter.call(el, valor);
  } else {
    el.value = valor;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  // O `format` do campo pode ter reescrito o texto: o cursor vai para o fim do valor final.
  try {
    el.setSelectionRange(el.value.length, el.value.length);
  } catch {
    // Tipos como `number` e `email` não aceitam seleção.
  }
}
