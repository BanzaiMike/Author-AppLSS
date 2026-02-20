type CardWeight = "primary" | "secondary" | "default";

interface CardProps {
  weight?: CardWeight;
  children: React.ReactNode;
  className?: string;
}

const weights: Record<CardWeight, string> = {
  primary: "border-[5px]",
  secondary: "border-2",
  default: "border",
};

export function Card({ weight = "default", children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-card border-card-border bg-background text-foreground shadow-card ${weights[weight]} ${className}`}
    >
      {children}
    </div>
  );
}
