"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function NewsletterForm({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "done">("idle");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("done");
    setEmail("");
    window.setTimeout(() => setStatus("idle"), 3200);
  };

  return (
    <form onSubmit={submit} className={cn("w-full", className)}>
      <div className="flex items-center gap-2 border-b border-line-strong pb-1.5 transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] focus-within:border-clay">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className={cn(
            "w-full bg-transparent text-ink placeholder:text-ink-faint focus:outline-none",
            compact ? "text-xs" : "text-[13px]",
          )}
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className="shrink-0 text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-clay"
        >
          {status === "done" ? (
            <Check size={15} strokeWidth={1.5} className="text-clay" />
          ) : (
            <ArrowRight size={15} strokeWidth={1.5} />
          )}
        </button>
      </div>
      <p
        className={cn(
          "mt-2 text-[11px] transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)]",
          status === "done" ? "text-clay" : "text-ink-faint",
        )}
      >
        {status === "done" ? "Thanks. Check your inbox to confirm." : "New arrivals only. No noise."}
      </p>
    </form>
  );
}
