import type { Metadata } from "next";
import { AddressBook } from "@/components/customer/AddressBook";

export const metadata: Metadata = {
  title: "Your addresses",
  description: "Saved places for delivery.",
};

export default function AccountAddressesPage() {
  return (
    <div>
      <h1 className="text-2xl sm:text-[1.75rem]">Your addresses</h1>
      <p className="mt-1.5 text-[13px] text-ink-muted">
        Keep a few on file so checkout is quicker next time.
      </p>
      <AddressBook showHeading={false} />
    </div>
  );
}
