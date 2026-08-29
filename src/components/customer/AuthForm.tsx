"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCustomer } from "./CustomerProvider";
import { siteConfig } from "@/lib/config";
import { OTP_LENGTH_DIGITS } from "@/lib/customer/otp";
import { formatGhanaPhone } from "@/lib/phone";
import type { AuthReason } from "@/lib/customer/types";

const copy: Record<AuthReason, { signinTitle: string; signupTitle: string }> = {
  checkout: {
    signinTitle: "Sign in to check out",
    signupTitle: "Create an account to check out",
  },
  saved: {
    signinTitle: "Sign in to save items",
    signupTitle: "Create an account to save items",
  },
  account: {
    signinTitle: "Sign in",
    signupTitle: "Create an account",
  },
  order: {
    signinTitle: "Sign in to see this order",
    signupTitle: "Create an account to see this order",
  },
};

type Step = "form" | "otp" | "profile";

function AuthHelpLinks() {
  return (
    <p className="text-[13px] text-ink-muted">
      <Link href="/track" className="text-clay underline decoration-clay/40 underline-offset-2">
        Track an order
      </Link>
      {" · "}
      <a
        href={`https://wa.me/${siteConfig.contact.whatsapp}`}
        className="text-clay underline decoration-clay/40 underline-offset-2"
      >
        Need a hand?
      </a>
    </p>
  );
}

export function AuthForm({
  reason,
  onSuccess,
}: {
  reason: AuthReason;
  onSuccess?: () => void;
}) {
  const { requestCode, verifyCode, completeProfile } = useCustomer();
  const [mode, setMode] = useState<"signup" | "signin">("signin");
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const text = copy[reason];

  const sendCode = async (nextPhone: string, profile?: { name: string }) => {
    setError(null);
    setPending(true);
    const result = await requestCode({ phone: nextPhone, profile });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return false;
    }
    setPhone(nextPhone);
    setPreviewCode(result.code ?? null);
    setStep("otp");
    return true;
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextPhone = String(form.get("phone") ?? "");
    if (mode === "signup") {
      await sendCode(nextPhone, {
        name: String(form.get("name") ?? ""),
      });
      return;
    }
    await sendCode(nextPhone);
  };

  const submitOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await verifyCode(phone, String(form.get("code") ?? ""));
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (result.needsProfile) {
      setStep("profile");
      return;
    }
    onSuccess?.();
  };

  const submitProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await completeProfile({
      name: String(form.get("name") ?? ""),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSuccess?.();
  };

  const reset = (nextMode: "signup" | "signin") => {
    setMode(nextMode);
    setStep("form");
    setPreviewCode(null);
    setError(null);
  };

  const displayPhone = formatGhanaPhone(phone);

  if (step === "otp") {
    return (
      <form onSubmit={submitOtp} className="flex flex-col gap-3.5">
        <div>
          <h2 className="text-xl">Enter your code</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
            We sent a code to {displayPhone}.
          </p>
        </div>

        {previewCode && (
          <p className="rounded-md border border-line bg-sand px-3 py-3 text-center">
            <span className="label-xs text-ink-faint">Your code</span>
            <span className="mt-1.5 block text-lg font-medium tabular-nums tracking-[0.35em] text-ink">
              {previewCode}
            </span>
          </p>
        )}

        <Field label="Code" htmlFor="account-code" required>
          <Input
            id="account-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            minLength={OTP_LENGTH_DIGITS}
            maxLength={OTP_LENGTH_DIGITS}
            pattern="\d{6}"
            autoFocus
          />
        </Field>

        {error && <p className="text-[13px] text-sale">{error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Checking code" : "Continue"}
        </Button>

        <p className="text-[13px] text-ink-muted">
          Wrong number?{" "}
          <button
            type="button"
            onClick={() => reset(mode)}
            className="text-clay underline decoration-clay/40 underline-offset-2"
          >
            Use a different one
          </button>
        </p>
        <AuthHelpLinks />
      </form>
    );
  }

  if (step === "profile") {
    return (
      <form onSubmit={submitProfile} className="flex flex-col gap-3.5">
        <div>
          <h2 className="text-xl">Finish creating your account</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
            Add your name so we know what to call you.
          </p>
        </div>
        <Field label="Full name" htmlFor="account-name" required>
          <Input id="account-name" name="name" required autoComplete="name" />
        </Field>
        {error && <p className="text-[13px] text-sale">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving" : "Create account"}
        </Button>
        <AuthHelpLinks />
      </form>
    );
  }

  return (
    <form onSubmit={submitForm} className="flex flex-col gap-3.5">
      <div>
        <h2 className="text-xl">{mode === "signup" ? text.signupTitle : text.signinTitle}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          {mode === "signup"
            ? "Enter your details and we'll text you a code."
            : "Enter your phone number and we'll text you a code."}
        </p>
      </div>

      {mode === "signup" && (
        <Field label="Full name" htmlFor="account-name" required>
          <Input id="account-name" name="name" required autoComplete="name" />
        </Field>
      )}

      <Field label="Phone" htmlFor="account-phone" required>
        <PhoneInput
          id="account-phone"
          name="phone"
          required
          autoComplete="tel"
          defaultValue={phone}
        />
      </Field>

      {error && <p className="text-[13px] text-sale">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Sending code" : "Text me a code"}
      </Button>

      <p className="text-[13px] text-ink-muted">
        {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
        <button
          type="button"
          onClick={() => reset(mode === "signup" ? "signin" : "signup")}
          className="text-clay underline decoration-clay/40 underline-offset-2"
        >
          {mode === "signup" ? "Sign in" : "Create an account"}
        </button>
      </p>
      <AuthHelpLinks />
    </form>
  );
}
