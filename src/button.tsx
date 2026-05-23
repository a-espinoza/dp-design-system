import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "./utils"

// v2 button variants — Spec-sheet Editorial. See docs/DESIGN.md.
//
// - default   : outline-on-paper (the standard quiet button)
// - primary   : dp-navy solid (emphasis — one per surface, max)
// - secondary : paper-soft surface (dense, low-emphasis)
// - tertiary  : dp-cyan text-only (links-as-buttons; no bg/border)
// - ghost     : transparent until hover; same family as nav items
// - destructive: deep red for irreversible actions
// - link      : underline-only text
//
// All sizes use radius-sm (4px). Press feedback (scale 0.98 for 80ms) is on
// default + primary ONLY — the single approved "scale" use in the system.
// Hover transitions are color-only at 120ms.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-sm border border-transparent bg-clip-padding text-sm font-medium outline-none transition-[background-color,border-color,color,transform] duration-[120ms] ease-out active:duration-[80ms] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-border bg-paper text-foreground hover:bg-paper-soft active:scale-[0.98] dark:bg-input/30 dark:hover:bg-input/50",
        primary:
          "bg-dp-navy text-primary-foreground hover:bg-dp-navy-hover active:scale-[0.98]",
        secondary:
          "bg-paper-soft text-foreground hover:bg-paper-deep aria-expanded:bg-paper-deep",
        tertiary:
          "text-dp-cyan hover:text-dp-cyan-hover",
        ghost:
          "text-foreground hover:bg-paper-soft aria-expanded:bg-paper-soft dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-dp-cyan underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-sm px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-sm",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
