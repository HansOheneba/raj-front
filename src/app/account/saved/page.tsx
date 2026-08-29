import type { Metadata } from "next";
import { SavedView } from "@/components/saved/SavedView";

export const metadata: Metadata = {
  title: "Saved items",
  description: "The things you want to come back to.",
};

export default function AccountSavedPage() {
  return (
    <div>
      <h1 className="text-2xl sm:text-[1.75rem]">Saved items</h1>
      <p className="mt-1.5 text-[13px] text-ink-muted">The things you want to come back to.</p>
      <div className="mt-6">
        <SavedView />
      </div>
    </div>
  );
}
