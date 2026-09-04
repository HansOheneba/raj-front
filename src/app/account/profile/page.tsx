import type { Metadata } from "next";
import { ProfileForm } from "@/components/customer/ProfileForm";

export const metadata: Metadata = {
  title: "Your details",
  description: "Birthday and email for your Raj Kollections account.",
};

export default function AccountProfilePage() {
  return (
    <div>
      <h1 className="text-2xl sm:text-[1.75rem]">Your details</h1>

      <ProfileForm />
    </div>
  );
}
