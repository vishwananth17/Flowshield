import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-primary-border)] bg-[var(--color-primary-muted)] text-[var(--text-gold)]",
        outline: "border-[var(--border-default)] text-[var(--text-primary)] bg-transparent",
        gold: "border-[var(--border-gold)] bg-[var(--color-primary-muted)] text-[var(--text-gold)]",
        safe: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        suspicious: "border-amber-500/20 bg-amber-500/10 text-amber-400",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-400",
        review: "border-amber-500/20 bg-amber-500/10 text-amber-400",
        fraud: "border-red-500/20 bg-red-500/10 text-red-400",
        danger: "border-red-500/20 bg-red-500/10 text-red-400",
        destructive: "border-red-500/20 bg-red-500/10 text-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulsingDot?: boolean;
}

function Badge({ className, variant, pulsingDot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {pulsingDot && (
        <span className="relative flex h-2 w-2 mr-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
