import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-600 text-white",
        secondary:
          "border-transparent bg-slate-800 text-slate-200",
        destructive:
          "border-transparent bg-red-600 text-white",
        outline: "border-slate-700 text-slate-300",
        safe: "border-transparent bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        suspicious: "border-transparent bg-amber-500/20 text-amber-400 border border-amber-500/30",
        fraud: "border-transparent bg-red-500/20 text-red-400 border border-red-500/30",
        review: "border-transparent bg-purple-500/20 text-purple-400 border border-purple-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
    pulsingDot?: boolean;
}

function Badge({ className, variant, pulsingDot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {pulsingDot && (
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
