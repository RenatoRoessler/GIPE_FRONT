export type PasswordRuleId = "length" | "uppercase" | "lowercase" | "number" | "symbol";

export interface PasswordRule {
  id: PasswordRuleId;
  // Texto do checklist exibido ao usuário.
  label: string;
  // Texto usado na mensagem "Falta: ...".
  missingLabel: string;
  test: (value: string) => boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "length",
    label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
    missingLabel: `${PASSWORD_MIN_LENGTH} caracteres`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "uppercase",
    label: "Uma letra maiúscula",
    missingLabel: "uma letra maiúscula",
    test: (value) => /\p{Lu}/u.test(value),
  },
  {
    id: "lowercase",
    label: "Uma letra minúscula",
    missingLabel: "uma letra minúscula",
    test: (value) => /\p{Ll}/u.test(value),
  },
  {
    id: "number",
    label: "Um número",
    missingLabel: "um número",
    test: (value) => /\p{N}/u.test(value),
  },
  {
    id: "symbol",
    label: "Um símbolo (ex.: @, #, !)",
    missingLabel: "um símbolo",
    // Espaço não conta como símbolo.
    test: (value) => /[^\p{L}\p{N}\s]/u.test(value),
  },
];

export interface PasswordRuleResult {
  id: PasswordRuleId;
  label: string;
  met: boolean;
}

export function getPasswordRuleResults(value: string): PasswordRuleResult[] {
  return PASSWORD_RULES.map((rule) => ({ id: rule.id, label: rule.label, met: rule.test(value) }));
}

export function getMissingPasswordRules(value: string): string[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.missingLabel);
}

export function isStrongPassword(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}
