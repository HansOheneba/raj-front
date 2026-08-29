import type { SavedItem } from "./types";

const baseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return url.replace(/\/$/, "");
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Saved items request failed: ${response.status} ${path}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function listSavedItems(): Promise<SavedItem[]> {
  return requestJson("/customer/saved");
}

export async function replaceSavedItems(items: SavedItem[]): Promise<SavedItem[]> {
  return requestJson("/customer/saved", {
    method: "PUT",
    body: JSON.stringify(items),
  });
}

export async function addSavedItem(item: SavedItem): Promise<SavedItem> {
  return requestJson("/customer/saved", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function removeSavedItem(productId: string): Promise<void> {
  await requestJson(`/customer/saved/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}
