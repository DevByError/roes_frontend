import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-xs transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-destructive/15";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} className={cn(field, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-24 resize-y py-2.5 leading-relaxed", className)} {...props} />;
}

export { field as fieldClass };
