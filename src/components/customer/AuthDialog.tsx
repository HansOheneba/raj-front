"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { AuthForm } from "./AuthForm";
import { useCustomer } from "./CustomerProvider";

export function AuthDialog() {
  const { authOpen, authReason, closeAuth } = useCustomer();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!authOpen) return;
    const timer = window.setTimeout(() => closeRef.current?.focus(), 40);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAuth();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [authOpen, closeAuth]);

  if (!authOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] animate-fade-in">
      <button
        type="button"
        aria-label="Close"
        onClick={closeAuth}
        className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        className="relative mx-auto mt-[10vh] w-[calc(100%-2rem)] max-w-md origin-top animate-pop-in overflow-hidden rounded-lg border border-line bg-cream p-5 shadow-lift sm:p-6"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={closeAuth}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink"
        >
          <X size={15} strokeWidth={1.5} />
        </button>
        <div id="auth-dialog-title">
          <AuthForm reason={authReason} onSuccess={closeAuth} />
        </div>
      </div>
    </div>
  );
}
