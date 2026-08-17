import type { SavedItem } from "./types";

const STORAGE_KEY = "raj-kollections.saved.v1";

type SavedStore = Record<string, SavedItem[]>;

const isItem = (value: unknown): value is SavedItem => {
  if (typeof value !== "object" || value === null) return false;
  const item = value as SavedItem;
  return (
    typeof item.productId === "string" &&
    typeof item.snapshot?.name === "string" &&
    typeof item.snapshot?.price === "number" &&
    typeof item.snapshot?.slug === "string"
  );
};

const readStore = (): SavedStore => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const store: SavedStore = {};
    for (const [customerId, items] of Object.entries(parsed)) {
      if (!Array.isArray(items)) continue;
      store[customerId] = items.filter(isItem);
    }
    return store;
  } catch {
    return {};
  }
};

const writeStore = (store: SavedStore) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const readSaved = (customerId: string): SavedItem[] => readStore()[customerId] ?? [];

export const writeSaved = (customerId: string, items: SavedItem[]) => {
  const store = readStore();
  store[customerId] = items;
  writeStore(store);
};
