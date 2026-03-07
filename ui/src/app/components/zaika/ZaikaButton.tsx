import { ReactNode } from "react";
import { motion } from "motion/react";

interface ZaikaButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

export function ZaikaButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: ZaikaButtonProps) {
  const baseClasses = "font-medium transition-all duration-200 rounded-lg";

  const variantClasses = {
    primary:
      "bg-saffron text-white hover:bg-saffron-light active:bg-saffron-dark disabled:opacity-50",
    secondary:
      "bg-white text-saffron border-2 border-saffron hover:bg-cream active:border-saffron-dark disabled:opacity-50",
    ghost:
      "bg-transparent text-saffron hover:bg-cream active:bg-cream-dark disabled:opacity-50",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const shadowClass = variant === "primary" ? "[box-shadow:var(--shadow-warm)]" : "";

  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${shadowClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}
