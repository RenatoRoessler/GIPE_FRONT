"use client";

import styled from "styled-components";

// Aplica a fonte de corpo da área logada; a display vem do tema (`typography.display`).
const Scope = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100vh;
  font-family: var(--font-barlow), system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.text};
`;

export function FontScope({ className, children }: { className: string; children: React.ReactNode }) {
  return <Scope className={className}>{children}</Scope>;
}
