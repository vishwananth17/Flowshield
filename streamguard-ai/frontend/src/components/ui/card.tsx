import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-[var(--radius-lg)] border text-white font-body transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]",
        gold: "border-[var(--border-gold)] bg-[var(--bg-surface)] shadow-[var(--shadow-gold)]",
        glass: "border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-md",
      },
      padding: {
        none: "p-0",
        sm:   "p-4",
        md:   "p-6",
        lg:   "p-8",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    }
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };

