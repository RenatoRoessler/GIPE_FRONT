"use client";

import { ComponentProps } from "react";
import { StyledLink } from "./Link.styles";

export type LinkProps = ComponentProps<typeof StyledLink>;

export function Link(props: LinkProps) {
  return <StyledLink {...props} />;
}
