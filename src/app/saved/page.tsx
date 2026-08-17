import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SavedView } from "@/components/saved/SavedView";

export const metadata: Metadata = {
  title: "Your list",
  description: "Save items for later, then add them to your cart when you're ready.",
};

export default function SavedPage() {
  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Your list" }]} />
      <h1 className="mt-4 text-2xl sm:text-[1.75rem]">Your list</h1>
      <p className="mt-1.5 text-[13px] text-ink-muted">The things you want to come back to.</p>
      <div className="mt-8">
        <SavedView />
      </div>
    </div>
  );
}
