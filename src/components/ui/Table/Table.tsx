"use client";

import { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  StyledTable,
  StyledTableBody,
  StyledTableCell,
  StyledTableHead,
  StyledTableRow,
} from "./Table.styles";

export function Table(props: ComponentPropsWithoutRef<"table">) {
  return <StyledTable {...props} />;
}

export function TableHead(props: ComponentPropsWithoutRef<"thead">) {
  return <StyledTableHead {...props} />;
}

export function TableBody(props: ComponentPropsWithoutRef<"tbody">) {
  return <StyledTableBody {...props} />;
}

export interface TableRowProps extends ComponentPropsWithoutRef<"tr"> {
  clickable?: boolean;
}

export function TableRow({ clickable = false, ...props }: TableRowProps) {
  return <StyledTableRow $clickable={clickable} {...props} />;
}

export interface TableCellProps {
  children?: ReactNode;
  // Cabeçalho de coluna (<th scope="col">).
  head?: boolean;
  align?: "left" | "right";
  // Ativa algarismos tabulares (valores e contagens).
  numeric?: boolean;
  // Rótulo exibido no layout de cartão (mobile).
  "data-label"?: string;
  colSpan?: number;
}

export function TableCell({ head = false, align = "left", numeric = false, ...props }: TableCellProps) {
  return (
    <StyledTableCell
      as={head ? "th" : "td"}
      scope={head ? "col" : undefined}
      data-head={head}
      $align={align}
      $numeric={numeric}
      {...props}
    />
  );
}
