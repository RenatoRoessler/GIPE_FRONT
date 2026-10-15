"use client";

import styled from "styled-components";

export const Frame = styled.div`
  display: inline-flex;
  padding: ${({ theme }) => theme.space[2]}px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: #ffffff;
  line-height: 0;
`;
