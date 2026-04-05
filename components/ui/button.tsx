import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
}

export function Button({
  children,
  loading = false,
  className = "",
  variant = "primary",
  disabled,
  ...props
}: ButtonProps) {
  let styles = "";
  
  if (variant === "primary") {
    styles = "bg-[var(--accent)] text-white border-none px-5 py-2.5 text-[14px] font-semibold rounded-[var(--radius-md)] inline-flex items-center gap-2 hover:bg-[var(--accent-hover)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-glow)] active:scale-[0.97] disabled:opacity-45 disabled:cursor-not-allowed";
  } else if (variant === "outline" || variant === "secondary") {
    styles = "bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] px-5 py-2.5 text-[14px] font-semibold rounded-[var(--radius-md)] inline-flex items-center gap-2 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] active:scale-[0.97] disabled:opacity-45 disabled:cursor-not-allowed";
  } else if (variant === "ghost") {
    styles = "bg-transparent border-none text-[var(--text-muted)] px-3 py-2 text-[14px] font-semibold rounded-[var(--radius-md)] inline-flex items-center gap-2 hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] active:scale-[0.97] disabled:opacity-45 disabled:cursor-not-allowed";
  } else if (variant === "danger") {
    styles = "bg-[var(--red-subtle)] border border-red-500/20 text-[var(--red)] px-5 py-2.5 text-[14px] font-semibold rounded-[var(--radius-md)] inline-flex items-center gap-2 hover:bg-red-500/20 active:scale-[0.97] disabled:opacity-45 disabled:cursor-not-allowed";
  }

  return (
    <button
      disabled={loading || disabled}
      className={`${styles} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span className="truncate">{typeof children === "string" ? children : "Loading..."}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
