"use client";

import type { ButtonHTMLAttributes } from "react";
import { type CameraButtonSize, StyledCameraButton } from "./CameraButton.styles";

export interface CameraButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  size?: CameraButtonSize;
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function CameraButton({
  size = "md",
  "aria-label": ariaLabel = "Ler placa pela câmera",
  title = ariaLabel,
  ...props
}: CameraButtonProps) {
  return (
    <StyledCameraButton type="button" $size={size} aria-label={ariaLabel} title={title} {...props}>
      <CameraIcon />
    </StyledCameraButton>
  );
}
