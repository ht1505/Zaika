import { ReactNode } from "react";
import { motion } from "motion/react";

interface ZaikaCardProps {
  children: ReactNode;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function ZaikaCard({
  children,
  hover = false,
  className = "",
  onClick,
}: ZaikaCardProps) {
  const baseClasses =
    "bg-white border border-cream-dark rounded-[var(--radius-xl)] p-6 [box-shadow:var(--shadow-card)]";

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4, boxShadow: "var(--shadow-warm)" }}
        transition={{ duration: 0.2 }}
        className={`${baseClasses} cursor-pointer ${className}`}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
