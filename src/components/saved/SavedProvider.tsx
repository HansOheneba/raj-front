"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCustomer } from "@/components/customer/CustomerProvider";
import { isApiEnabled } from "@/lib/api";
import {
  addSavedItem,
  listSavedItems,
  removeSavedItem,
} from "@/lib/saved/http";
import { readSaved, writeSaved } from "@/lib/saved/storage";
import { savedItemKey, type SavedItem } from "@/lib/saved/types";

type SavedContextValue = {
  ready: boolean;
  items: SavedItem[];
  count: number;
  isSaved: (productId: string, variantId?: string) => boolean;
  save: (item: SavedItem) => boolean;
  remove: (productId: string, variantId?: string) => void;
  toggle: (item: SavedItem) => boolean;
};

const SavedContext = createContext<SavedContextValue | null>(null);

const stamp = (item: SavedItem): SavedItem => ({
  ...item,
  savedAt: new Date().toISOString(),
});

const upsert = (items: SavedItem[], item: SavedItem) => {
  const next = stamp(item);
  const key = savedItemKey(next.productId, next.variantId);
  return [next, ...items.filter((entry) => savedItemKey(entry.productId, entry.variantId) !== key)];
};

export function SavedProvider({ children }: { children: ReactNode }) {
  const { ready: customerReady, customer, requestAuth, authOpen } = useCustomer();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [ready, setReady] = useState(false);
  const pendingSave = useRef<SavedItem | null>(null);
  const customerId = customer?.id;

  useEffect(() => {
    if (!customerReady) return;

    if (!customerId) {
      if (!authOpen) pendingSave.current = null;
      setItems([]);
      setReady(true);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const pending = pendingSave.current;
      pendingSave.current = null;

      if (isApiEnabled) {
        try {
          let stored = await listSavedItems();
          if (pending) {
            const saved = await addSavedItem(stamp(pending));
            stored = upsert(stored, saved);
          }
          if (!cancelled) {
            setItems(stored);
            setReady(true);
          }
          return;
        } catch {
          if (!cancelled) {
            setItems([]);
            setReady(true);
          }
          return;
        }
      }

      const stored = readSaved(customerId);
      if (!pending) {
        if (!cancelled) {
          setItems(stored);
          setReady(true);
        }
        return;
      }

      const next = upsert(stored, pending);
      writeSaved(customerId, next);
      if (!cancelled) {
        setItems(next);
        setReady(true);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [authOpen, customerId, customerReady]);

  const isSaved = useCallback(
    (productId: string, variantId?: string) => {
      const key = savedItemKey(productId, variantId);
      return items.some((item) => savedItemKey(item.productId, item.variantId) === key);
    },
    [items],
  );

  const save = useCallback(
    (item: SavedItem) => {
      if (!customerId) {
        pendingSave.current = item;
        requestAuth("saved");
        return false;
      }

      if (isApiEnabled) {
        void addSavedItem(stamp(item)).then((saved) => {
          setItems((current) => upsert(current, saved));
        });
        return true;
      }

      setItems((current) => {
        const next = upsert(current, item);
        writeSaved(customerId, next);
        return next;
      });
      return true;
    },
    [customerId, requestAuth],
  );

  const remove = useCallback(
    (productId: string, variantId?: string) => {
      if (!customerId) return;
      const key = savedItemKey(productId, variantId);

      if (isApiEnabled) {
        void removeSavedItem(productId, variantId).then(() => {
          setItems((current) =>
            current.filter((item) => savedItemKey(item.productId, item.variantId) !== key),
          );
        });
        return;
      }

      setItems((current) => {
        const next = current.filter((item) => savedItemKey(item.productId, item.variantId) !== key);
        writeSaved(customerId, next);
        return next;
      });
    },
    [customerId],
  );

  const toggle = useCallback(
    (item: SavedItem) => {
      if (!customerId) {
        pendingSave.current = item;
        requestAuth("saved");
        return false;
      }

      const key = savedItemKey(item.productId, item.variantId);

      if (isApiEnabled) {
        setItems((current) => {
          const exists = current.some(
            (entry) => savedItemKey(entry.productId, entry.variantId) === key,
          );
          if (exists) {
            void removeSavedItem(item.productId, item.variantId);
            return current.filter(
              (entry) => savedItemKey(entry.productId, entry.variantId) !== key,
            );
          }
          void addSavedItem(stamp(item));
          return upsert(current, item);
        });
        return true;
      }

      setItems((current) => {
        const exists = current.some((entry) => savedItemKey(entry.productId, entry.variantId) === key);
        const next = exists
          ? current.filter((entry) => savedItemKey(entry.productId, entry.variantId) !== key)
          : upsert(current, item);
        writeSaved(customerId, next);
        return next;
      });
      return true;
    },
    [customerId, requestAuth],
  );

  const value = useMemo<SavedContextValue>(
    () => ({
      ready,
      items,
      count: items.length,
      isSaved,
      save,
      remove,
      toggle,
    }),
    [ready, items, isSaved, save, remove, toggle],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) throw new Error("useSaved must be used inside SavedProvider");
  return context;
}
