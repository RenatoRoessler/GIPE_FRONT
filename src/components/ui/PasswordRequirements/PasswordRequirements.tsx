"use client";

import { getPasswordRuleResults } from "@/lib/password";
import { Item, List, Marker, Title, VisuallyHidden } from "./PasswordRequirements.styles";

export interface PasswordRequirementsRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export interface PasswordRequirementsProps {
  value: string;
  // Regras próprias da tela; sem elas valem as do cadastro e da recuperação de senha.
  rules?: readonly PasswordRequirementsRule[];
}

// O estado de cada requisito é dado por marcador e por texto (cumprida/pendente), nunca só por cor.
export function PasswordRequirements({ value, rules }: PasswordRequirementsProps) {
  const results = rules
    ? rules.map((rule) => ({ id: rule.id, label: rule.label, met: rule.test(value) }))
    : getPasswordRuleResults(value);

  return (
    <div>
      <Title>A senha precisa ter:</Title>
      <List>
        {results.map((rule) => (
          <Item key={rule.id} $met={rule.met}>
            <Marker aria-hidden="true">{rule.met ? "✓" : "•"}</Marker>
            <span>{rule.label}</span>
            <VisuallyHidden>{rule.met ? " (cumprida)" : " (pendente)"}</VisuallyHidden>
          </Item>
        ))}
      </List>
    </div>
  );
}
