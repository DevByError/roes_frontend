"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function Overlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-(--scrim) backdrop-blur-[3px] data-[state=open]:animate-fade-in",
        className,
      )}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  title,
  description,
  hideClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  description?: string;
  hideClose?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex max-h-[92dvh] w-full flex-col overflow-hidden border bg-popover shadow-[var(--shadow-pop)] outline-none",
          "inset-x-0 bottom-0 rounded-t-2xl data-[state=open]:animate-fade-up",
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            <DialogPrimitive.Title className="text-base font-semibold tracking-tight">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-0.5 text-[13px] text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          {!hideClose && (
            <DialogPrimitive.Close
              aria-label="Close"
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          )}
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("scrollbar-thin flex-1 overflow-y-auto px-5 py-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t bg-muted/40 px-5 py-3.5 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export function SheetContent({
  className,
  children,
  title,
  description,
  side = "right",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  description?: string;
  side?: "right" | "left";
}) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-full max-w-md flex-col bg-popover shadow-[var(--shadow-pop)] outline-none",
          side === "right" ? "right-0 border-l data-[state=open]:animate-[slide-in-right_.28s_cubic-bezier(.22,1,.36,1)]" : "left-0 border-r data-[state=open]:animate-[slide-in-left_.28s_cubic-bezier(.22,1,.36,1)]",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">{description ?? title}</DialogPrimitive.Description>
        {children}
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
