"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCustomer } from "./CustomerProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dateOfBirthBounds, formatDateOfBirth } from "@/lib/customer/profile";
import { formatGhanaPhone } from "@/lib/phone";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="label-xs text-ink-muted">{label}</p>
      <p className="text-[13px] text-ink">{value}</p>
    </div>
  );
}

function EmailStatusBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return <Badge variant="success">Verified</Badge>;
  }

  return (
    <Badge variant="outline" className="border-sale/20 bg-sale/5 text-sale">
      Not verified
    </Badge>
  );
}

function EmailAddressRow({ address, verified }: { address: string; verified: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <p className="text-[13px] text-ink">{address}</p>
      <EmailStatusBadge verified={verified} />
    </div>
  );
}

function EmailViewSection({
  verifiedEmail,
  pendingEmail,
  resending,
  onResend,
  demoVerifyUrl,
}: {
  verifiedEmail?: string;
  pendingEmail?: string;
  resending: boolean;
  onResend: () => void;
  demoVerifyUrl: string | null;
}) {
  if (!verifiedEmail && !pendingEmail) {
    return <DetailRow label="Email" value="Not added" />;
  }

  const showVerifiedRow = Boolean(
    verifiedEmail && (!pendingEmail || verifiedEmail !== pendingEmail),
  );

  return (
    <div className="flex flex-col gap-1.5">
      <p className="label-xs text-ink-muted">Email</p>
      <div className="flex flex-col gap-2">
        {pendingEmail && <EmailAddressRow address={pendingEmail} verified={false} />}
        {showVerifiedRow && verifiedEmail && (
          <EmailAddressRow address={verifiedEmail} verified />
        )}
      </div>

      {pendingEmail && (
        <div className="mt-1 flex flex-col gap-3">
          <p className="text-[12px] leading-relaxed text-ink-muted">
            Check your inbox for a confirmation link.
            {verifiedEmail ? ` ${verifiedEmail} stays confirmed until you finish.` : null}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResend}
            disabled={resending}
            className="self-start gap-2"
          >
            {resending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Sending
              </>
            ) : (
              "Resend verification email"
            )}
          </Button>
        </div>
      )}

      {demoVerifyUrl && (
        <p className="mt-1 rounded-md border border-line bg-sand px-3 py-3 text-[13px] leading-relaxed">
          <span className="label-xs text-ink-faint">Confirmation link</span>
          <Link
            href={demoVerifyUrl}
            className="mt-1.5 block text-clay underline decoration-clay/40 underline-offset-2"
          >
            Confirm this email
          </Link>
        </p>
      )}
    </div>
  );
}

function EmailEditSection({
  verifiedEmail,
  pendingEmail,
  resending,
  onResend,
  demoVerifyUrl,
  email,
  onEmailChange,
}: {
  verifiedEmail?: string;
  pendingEmail?: string;
  resending: boolean;
  onResend: () => void;
  demoVerifyUrl: string | null;
  email: string;
  onEmailChange: (value: string) => void;
}) {
  const displayEmail = pendingEmail ?? verifiedEmail;
  const isVerified = Boolean(verifiedEmail && !pendingEmail);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="account-email">Email</Label>
        {displayEmail ? <EmailStatusBadge verified={isVerified} /> : null}
      </div>
      <Input
        id="account-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="you@email.com"
      />
      <p className="text-[11px] text-ink-faint">
        Order updates go here. Same address works if you need to recover your account.
      </p>

      {pendingEmail && (
        <div className="mt-0.5 flex flex-col gap-3">
          <p className="text-[12px] leading-relaxed text-ink-muted">
            {pendingEmail} is waiting for confirmation.
            {verifiedEmail ? ` ${verifiedEmail} stays confirmed until you finish.` : null}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResend}
            disabled={resending}
            className="self-start gap-2"
          >
            {resending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Sending
              </>
            ) : (
              "Resend verification email"
            )}
          </Button>
        </div>
      )}

      {demoVerifyUrl && (
        <p className="rounded-md border border-line bg-sand px-3 py-3 text-[13px] leading-relaxed">
          <span className="label-xs text-ink-faint">Confirmation link</span>
          <Link
            href={demoVerifyUrl}
            className="mt-1.5 block text-clay underline decoration-clay/40 underline-offset-2"
          >
            Confirm this email
          </Link>
        </p>
      )}
    </div>
  );
}

export function ProfileForm() {
  const { customer, updateProfile, resendEmailVerification } = useCustomer();
  const [editing, setEditing] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(customer?.dateOfBirth ?? null);
  const [email, setEmail] = useState(customer?.pendingEmail ?? customer?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [demoVerifyUrl, setDemoVerifyUrl] = useState<string | null>(null);
  const bounds = dateOfBirthBounds();

  useEffect(() => {
    if (editing) return;
    setDateOfBirth(customer?.dateOfBirth ?? null);
    setEmail(customer?.pendingEmail ?? customer?.email ?? "");
  }, [customer?.dateOfBirth, customer?.email, customer?.pendingEmail, editing]);

  if (!customer) return null;

  const pendingEmail = customer.pendingEmail;
  const verifiedEmail = customer.email;
  const currentEmailValue = pendingEmail ?? verifiedEmail ?? "";

  const resetDraft = () => {
    setDateOfBirth(customer.dateOfBirth ?? null);
    setEmail(customer.pendingEmail ?? customer.email ?? "");
    setError(null);
    setDemoVerifyUrl(null);
  };

  const startEditing = () => {
    resetDraft();
    setEditing(true);
  };

  const cancelEditing = () => {
    resetDraft();
    setEditing(false);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const nextEmail = email.trim();
    const update: { dateOfBirth?: string | null; email?: string | null } = {};

    if ((dateOfBirth ?? null) !== (customer.dateOfBirth ?? null)) {
      update.dateOfBirth = dateOfBirth;
    }
    if (nextEmail !== currentEmailValue) {
      update.email = nextEmail === "" ? null : nextEmail;
    }

    if (update.dateOfBirth === undefined && update.email === undefined) {
      toast.success("You're already up to date.");
      setEditing(false);
      return;
    }

    setPending(true);
    setError(null);
    setDemoVerifyUrl(null);

    try {
      const result = await updateProfile(update);
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      if (result.demoVerifyUrl) {
        setDemoVerifyUrl(result.demoVerifyUrl);
        toast.success("Open the confirmation link to finish.");
      } else if (update.email && update.email !== null) {
        toast.success("Check your inbox for a confirmation link.");
      } else {
        toast.success("Details saved.");
      }
      setEditing(false);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not save your details. Try again.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  const resend = async () => {
    if (resending) return;
    setResending(true);
    setError(null);

    try {
      const result = await resendEmailVerification();
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      if (result.demoVerifyUrl) {
        setDemoVerifyUrl(result.demoVerifyUrl);
        toast.success("Open the confirmation link to finish.");
      } else {
        toast.success("We sent another confirmation link.");
      }
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not send that email. Try again.";
      setError(message);
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  const birthdayDisplay = customer.dateOfBirth
    ? formatDateOfBirth(customer.dateOfBirth)
    : "Not added";

  if (!editing) {
    return (
      <div className="mt-6 flex max-w-md flex-col gap-5">
        <div className="flex flex-col gap-1.5 border-b border-line pb-5">
          <p className="label-xs text-ink-muted">Signed in as</p>
          <p className="text-[13px] font-medium text-ink">{customer.name}</p>
          <p className="text-[12px] text-ink-muted">{formatGhanaPhone(customer.phone)}</p>
        </div>

        <div className="flex flex-col gap-4">
          <DetailRow label="Birthday" value={birthdayDisplay} />
          <EmailViewSection
            verifiedEmail={verifiedEmail}
            pendingEmail={pendingEmail}
            resending={resending}
            onResend={resend}
            demoVerifyUrl={demoVerifyUrl}
          />
        </div>

        {error && <p className="text-[13px] text-sale">{error}</p>}

        <Button type="button" variant="outline" onClick={startEditing} className="self-start">
          Edit your details
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="mt-6 flex max-w-md flex-col gap-5">
      <div className="flex flex-col gap-1.5 border-b border-line pb-5">
        <p className="label-xs text-ink-muted">Signed in as</p>
        <p className="text-[13px] font-medium text-ink">{customer.name}</p>
        <p className="text-[12px] text-ink-muted">{formatGhanaPhone(customer.phone)}</p>
      </div>

      <Field
        label="Birthday"
        htmlFor="account-birthday"
        hint="You may get something special on your birthday."
      >
        <DatePicker
          id="account-birthday"
          value={dateOfBirth}
          onChange={setDateOfBirth}
          min={bounds.min}
          max={bounds.max}
          placeholder="Add your birthday"
        />
      </Field>

      <EmailEditSection
        verifiedEmail={verifiedEmail}
        pendingEmail={pendingEmail}
        resending={resending}
        onResend={resend}
        demoVerifyUrl={demoVerifyUrl}
        email={email}
        onEmailChange={(value) => {
          setEmail(value);
          setDemoVerifyUrl(null);
        }}
      />

      {error && <p className="text-[13px] text-sale">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Saving
            </>
          ) : (
            "Save details"
          )}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={cancelEditing}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
