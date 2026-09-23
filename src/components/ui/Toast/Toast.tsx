"use client";

import { useEffect } from "react";
import { ToastVariant, ToastWrapper } from "./Toast.styles";

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({
  message,
  variant = "success",
  onDismiss,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <ToastWrapper role="status" $variant={variant}>
      {message}
    </ToastWrapper>
  );
}
