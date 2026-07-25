import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded text-xs font-semibold uppercase tracking-wider transition-all duration-300 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 font-body",
  {
    variants: {
      variant: {
        default: "bg-[#6366F1] text-white hover:bg-[#4F46E5]",
        destructive:
          "bg-red-950 text-red-200 border border-red-900 hover:bg-red-900",
        outline:
          "border border-[var(--border-primary)] bg-transparent hover:bg-zinc-900 text-white",
        secondary:
          "bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800",
        ghost: "hover:bg-zinc-900 text-white",
        link: "text-indigo-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-11 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
