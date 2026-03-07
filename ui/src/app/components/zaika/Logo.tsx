import { Flame } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function Logo({ size = "md", showIcon = true }: LogoProps) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 32,
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`${sizes[size]} font-heading font-semibold text-charcoal`}>
        Zaika
      </span>
      {showIcon && <Flame className="text-saffron" size={iconSizes[size]} />}
    </div>
  );
}
