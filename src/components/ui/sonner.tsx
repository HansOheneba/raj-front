"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-cream group-[.toaster]:text-ink group-[.toaster]:border-line group-[.toaster]:shadow-soft",
          description: "group-[.toast]:text-ink-muted",
          actionButton: "group-[.toast]:bg-clay group-[.toast]:text-cream",
          cancelButton: "group-[.toast]:bg-sand group-[.toast]:text-ink-muted",
        },
      }}
      {...props}
    />
  );
}
