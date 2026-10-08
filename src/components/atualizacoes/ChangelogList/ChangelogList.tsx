"use client";

import { Text } from "@/components/ui/Text";
import { formatChangelogDate } from "@/lib/changelogDate";
import type { ChangelogEntry, ChangelogType } from "@/types/changelog";
import {
  Description,
  Entry,
  List,
  Meta,
  Scope,
  Title,
  TypeBadge,
  Version,
} from "./ChangelogList.styles";

const TYPE_LABEL: Record<ChangelogType, string> = {
  feat: "Novidade",
  fix: "Correção",
};

export interface ChangelogListProps {
  entries: ChangelogEntry[];
}

export function ChangelogList({ entries }: ChangelogListProps) {
  if (entries.length === 0) {
    return <Text variant="muted">Nenhuma atualização registrada até o momento.</Text>;
  }

  return (
    <List>
      {entries.map((entry) => (
        <Entry key={entry.version} id={`v${entry.version}`}>
          <Meta>
            <Version>v{entry.version}</Version>
            <TypeBadge $type={entry.type}>{TYPE_LABEL[entry.type]}</TypeBadge>
            {entry.scope && <Scope>{entry.scope}</Scope>}
            <time dateTime={entry.date}>{formatChangelogDate(entry.date)}</time>
          </Meta>
          <Title>{entry.title}</Title>
          {entry.description && <Description>{entry.description}</Description>}
        </Entry>
      ))}
    </List>
  );
}
