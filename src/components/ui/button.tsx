import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:brightness-90 hover:shadow-md dark:bg-[image:var(--metal)] dark:shadow-[0_1px_0_rgb(255_255_255/0.18)_inset,0_6px_18px_-8px_rgb(91_154_224/0.45)]",
        gold: "bg-accent text-accent-foreground shadow-sm hover:brightness-95",
        secondary: "bg-muted text-foreground hover:bg-[color-mix(in_oklab,var(--muted)_80%,var(--foreground))]",
        outline: "border border-input bg-card text-foreground hover:bg-muted dark:hover:border-primary/60 dark:hover:text-primary",
        ghost: "text-foreground hover:bg-muted dark:hover:text-primary",
        destructive: "bg-destructive text-white shadow-sm hover:brightness-90 dark:text-[#121923]",
        "destructive-soft": "bg-destructive-soft text-destructive hover:brightness-95",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 gap-1.5 rounded-md px-3 text-[13px]",
        lg: "h-11 px-6 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-8 rounded-md",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({ className, variant, size, asChild, loading, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" />}
          {children}
        </>
      )}
    </Comp>
  );
}
