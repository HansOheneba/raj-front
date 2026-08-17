import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { AccountView } from "@/components/account/AccountView";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to check out and save items for later.",
};

export default function AccountPage() {
  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Account" }]} />
      <h1 className="mt-4 text-2xl sm:text-[1.75rem]">Account</h1>
      <div className="mt-8">
        <AccountView />
      </div>
    </div>
  );
}
