import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] text-xs font-semibold uppercase tracking-wider transition-all duration-300 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 font-body cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--border-strong)] text-white hover:bg-[var(--bg-highlight)]",
        primary: "bg-[var(--color-primary)] text-[var(--text-inverse)] hover:bg-[var(--color-primary-hover)] font-bold",
        gold: "bg-[var(--color-primary)] text-[var(--text-inverse)] hover:bg-[var(--color-primary-hover)] font-bold shadow-[var(--shadow-gold)] border border-[var(--border-gold)]",
        destructive: "bg-[var(--color-danger-muted)] text-[var(--color-danger)] border border-[var(--color-danger-border)] hover:bg-[var(--color-danger)] hover:text-white",
        danger: "bg-[var(--color-danger-muted)] text-[var(--color-danger)] border border-[var(--color-danger-border)] hover:bg-[var(--color-danger)] hover:text-white",
        outline: "border border-[var(--border-default)] bg-transparent hover:bg-[var(--bg-inset)] text-white",
        secondary: "bg-[var(--bg-inset)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-surface)] hover:text-white",
        ghost: "hover:bg-[var(--bg-highlight)] text-white",
        link: "text-[var(--text-gold)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-[10px]",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-6",
        xl: "h-12 px-8 text-sm",
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
