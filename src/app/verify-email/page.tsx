import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailView } from "@/components/account/VerifyEmailView";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Confirm email",
  description: "Confirm the email on your Raj Kollections account.",
};

export default function VerifyEmailPage() {
  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Confirm email" }]} />
      <div className="mx-auto mt-6 max-w-md">
        <h1 className="text-2xl sm:text-[1.75rem]">Confirm your email</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          One click from the link we sent you.
        </p>
        <div className="mt-6">
          <Suspense
            fallback={<p className="text-[13px] text-ink-muted">Confirming your email</p>}
          >
            <VerifyEmailView />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
