import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ hasError = false, className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-input border bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${hasError ? "border-danger" : "border-card-border"} ${className}`}
      {...props}
    />
  );
}
