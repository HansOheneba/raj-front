import { api } from "@/lib/api";
import type { SavedItem } from "./types";

export async function listSavedItems(): Promise<SavedItem[]> {
  return api("/customer/saved");
}

export async function replaceSavedItems(items: SavedItem[]): Promise<SavedItem[]> {
  return api("/customer/saved", {
    method: "PUT",
    body: JSON.stringify(items),
  });
}

export async function addSavedItem(item: SavedItem): Promise<SavedItem> {
  return api("/customer/saved", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function removeSavedItem(productId: string, variantId?: string): Promise<void> {
  const params = variantId ? `?variantId=${encodeURIComponent(variantId)}` : "";
  await api(`/customer/saved/${encodeURIComponent(productId)}${params}`, {
    method: "DELETE",
  });
}
