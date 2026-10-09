"use client";

import styled from "styled-components";

const BEAM_TOP = "18px";

export const Wrapper = styled.nav`
  display: none;
  position: relative;
  padding: ${BEAM_TOP} ${({ theme }) => theme.space[5]}px 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: block;
  }
`;

export const Beam = styled.div`
  position: absolute;
  top: ${BEAM_TOP};
  left: ${({ theme }) => theme.space[5]}px;
  right: ${({ theme }) => theme.space[5]}px;
  height: 10px;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.colors.steel};
`;

export const Signs = styled.ul`
  position: relative;
  display: flex;
  gap: 14px;
  /* Folga lateral: o contorno das placas não é cortado pelo overflow da lista. */
  margin: 0 -6px;
  padding: 22px 6px 10px;
  list-style: none;
  overflow-x: auto;
  scrollbar-width: thin;

  li {
    display: flex;
    flex: 1 0 150px;
  }

  li > a {
    flex: 1;
  }
`;
