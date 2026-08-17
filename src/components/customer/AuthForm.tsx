"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCustomer } from "./CustomerProvider";
import { OTP_LENGTH_DIGITS } from "@/lib/customer/otp";
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
};

type Step = "form" | "otp" | "profile";

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
  const [email, setEmail] = useState("");
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const text = copy[reason];

  const sendCode = async (nextEmail: string, profile?: { name: string; phone: string }) => {
    setError(null);
    setPending(true);
    const result = await requestCode({ email: nextEmail, profile });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return false;
    }
    setEmail(nextEmail);
    setPreviewCode(result.code ?? null);
    setStep("otp");
    return true;
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextEmail = String(form.get("email") ?? "");
    if (mode === "signup") {
      await sendCode(nextEmail, {
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
      });
      return;
    }
    await sendCode(nextEmail);
  };

  const submitOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await verifyCode(email, String(form.get("code") ?? ""));
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
      phone: String(form.get("phone") ?? ""),
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

  if (step === "otp") {
    return (
      <form onSubmit={submitOtp} className="flex flex-col gap-3.5">
        <div>
          <h2 className="text-xl">Enter your code</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
            We sent a code to {email}.
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
          Wrong email?{" "}
          <button
            type="button"
            onClick={() => reset(mode)}
            className="text-clay underline decoration-clay/40 underline-offset-2"
          >
            Use a different one
          </button>
        </p>
      </form>
    );
  }

  if (step === "profile") {
    return (
      <form onSubmit={submitProfile} className="flex flex-col gap-3.5">
        <div>
          <h2 className="text-xl">Finish creating your account</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
            Add your name and phone.
          </p>
        </div>
        <Field label="Full name" htmlFor="account-name" required>
          <Input id="account-name" name="name" required autoComplete="name" />
        </Field>
        <Field label="Phone" htmlFor="account-phone" required>
          <PhoneInput id="account-phone" name="phone" required />
        </Field>
        {error && <p className="text-[13px] text-sale">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving" : "Create account"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={submitForm} className="flex flex-col gap-3.5">
      <div>
        <h2 className="text-xl">{mode === "signup" ? text.signupTitle : text.signinTitle}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          {mode === "signup"
            ? "Enter your details and we'll send you a code."
            : "Enter your email and we'll send you a code."}
        </p>
      </div>

      {mode === "signup" && (
        <>
          <Field label="Full name" htmlFor="account-name" required>
            <Input id="account-name" name="name" required autoComplete="name" />
          </Field>
          <Field label="Phone" htmlFor="account-phone" required>
            <PhoneInput id="account-phone" name="phone" required />
          </Field>
        </>
      )}

      <Field label="Email" htmlFor="account-email" required>
        <Input
          id="account-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={email}
        />
      </Field>

      {error && <p className="text-[13px] text-sale">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Sending code" : "Email me a code"}
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
    </form>
  );
}
