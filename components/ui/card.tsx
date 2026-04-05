import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`card-premium rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] p-6 transition-all duration-200 hover:border-gray-300 dark:hover:border-white/[0.1] ${className}`}>
      {children}
    </div>
  );
}
