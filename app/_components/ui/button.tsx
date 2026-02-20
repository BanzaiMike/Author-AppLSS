import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:opacity-90 focus-visible:ring-accent",
  secondary:
    "bg-foreground text-background hover:opacity-90 focus-visible:ring-foreground",
  ghost:
    "border border-card-border bg-transparent text-foreground hover:bg-foreground/5 focus-visible:ring-foreground",
  destructive:
    "bg-danger text-white hover:opacity-90 focus-visible:ring-danger",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-btn px-[15px] py-[13px] text-sm font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
