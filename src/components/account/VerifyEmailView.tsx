"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCustomer } from "@/components/customer/CustomerProvider";
import { Button } from "@/components/ui/button";

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { ready, customer, verifyEmail } = useCustomer();
  const verifyEmailRef = useRef(verifyEmail);
  verifyEmailRef.current = verifyEmail;
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    const trimmed = token.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("That confirmation link is missing its code.");
      return;
    }

    let cancelled = false;
    setStatus("working");

    void verifyEmailRef.current(trimmed).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setStatus("error");
        setMessage(result.message);
        return;
      }
      setStatus("ok");
    });

    return () => {
      cancelled = true;
    };
  }, [ready, token]);

  if (!ready || status === "idle" || status === "working") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-ink-muted">
        <Loader2 size={15} className="animate-spin" />
        Confirming your email
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[13px] leading-relaxed text-ink-muted">
          {message ?? "That confirmation link is no longer valid."}
        </p>
        <Button asChild className="self-start">
          <Link href="/account/profile">Go to your details</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] leading-relaxed text-ink-muted">
        {customer
          ? "Your email is confirmed. Make an order to get updates via email."
          : "Your email is confirmed. Sign in to see it on your account."}
      </p>
      <Button asChild className="self-start">
        <Link href={customer ? "/account/profile" : "/account"}>
          {customer ? "Back to your details" : "Sign in"}
        </Link>
      </Button>
    </div>
  );
}
