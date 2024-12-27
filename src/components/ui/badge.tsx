import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        art: "border-transparent bg-red-500 text-white hover:bg-red-600",
        music: "border-transparent bg-green-500 text-white hover:bg-green-600",
        film: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        design: "border-transparent bg-purple-500 text-white hover:bg-purple-600",
        theater: "border-transparent bg-yellow-500 text-black hover:bg-yellow-600",
        dance: "border-transparent bg-cyan-500 text-white hover:bg-cyan-600",
        media: "border-transparent bg-orange-500 text-white hover:bg-orange-600",
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
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'art' | 'music' | 'film' | 'design' | 'theater' | 'dance' | 'media';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants } 