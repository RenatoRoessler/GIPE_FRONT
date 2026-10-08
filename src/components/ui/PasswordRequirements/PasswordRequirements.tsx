"use client";

import { getPasswordRuleResults } from "@/lib/password";
import { Item, List, Marker, Title, VisuallyHidden } from "./PasswordRequirements.styles";

export interface PasswordRequirementsProps {
  value: string;
}

// O estado de cada requisito é dado por marcador e por texto (cumprida/pendente), nunca só por cor.
export function PasswordRequirements({ value }: PasswordRequirementsProps) {
  return (
    <div>
      <Title>A senha precisa ter:</Title>
      <List>
        {getPasswordRuleResults(value).map((rule) => (
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
