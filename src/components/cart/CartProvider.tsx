"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cartLineKey, type CartLine, type CartSnapshot } from "@/lib/cart/types";
import { siteConfig } from "@/lib/config";

const STORAGE_KEY = "raj-kollections.cart.v2";

export type ResolvedLine = CartLine & {
  key: string;
  lineTotal: number;
};

type AddInput = {
  productId: string;
  variantId?: string;
  quantity?: number;
  snapshot: CartSnapshot;
};

type CartContextValue = {
  ready: boolean;
  lines: ResolvedLine[];
  count: number;
  subtotal: number;
  savings: number;
  shipping: number;
  total: number;
  qualifiesForFreeShipping: boolean;
  amountToFreeShipping: number;
  addedSignal: number;
  add: (input: AddInput) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const isLine = (value: unknown): value is CartLine => {
  if (typeof value !== "object" || value === null) return false;
  const line = value as CartLine;
  return (
    typeof line.productId === "string" &&
    Number.isFinite(line.quantity) &&
    typeof line.snapshot?.name === "string" &&
    typeof line.snapshot?.price === "number"
  );
};

const readStored = (): CartLine[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLine);
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [rawLines, setRawLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [addedSignal, setAddedSignal] = useState(0);

  useEffect(() => {
    setRawLines(readStored());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rawLines));
    } catch {
      // Private browsing: cart will not persist.
    }
  }, [rawLines, ready]);

  const add: CartContextValue["add"] = useCallback((input) => {
    const quantity = Math.max(1, input.quantity ?? 1);
    setRawLines((current) => {
      const key = cartLineKey(input.productId, input.variantId);
      const index = current.findIndex(
        (line) => cartLineKey(line.productId, line.variantId) === key,
      );
      if (index === -1) {
        return [
          ...current,
          {
            productId: input.productId,
            variantId: input.variantId,
            quantity,
            snapshot: input.snapshot,
          },
        ];
      }
      const next = [...current];
      next[index] = {
        ...next[index],
        quantity: Math.min(99, next[index].quantity + quantity),
        snapshot: input.snapshot,
      };
      return next;
    });
    setAddedSignal((n) => n + 1);
  }, []);

  const setQuantity: CartContextValue["setQuantity"] = useCallback((key, quantity) => {
    setRawLines((current) =>
      quantity <= 0
        ? current.filter((line) => cartLineKey(line.productId, line.variantId) !== key)
        : current.map((line) =>
            cartLineKey(line.productId, line.variantId) === key
              ? { ...line, quantity: Math.min(99, quantity) }
              : line,
          ),
    );
  }, []);

  const remove: CartContextValue["remove"] = useCallback((key) => {
    setRawLines((current) =>
      current.filter((line) => cartLineKey(line.productId, line.variantId) !== key),
    );
  }, []);

  const clear = useCallback(() => setRawLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const lines: ResolvedLine[] = rawLines.map((line) => ({
      ...line,
      key: cartLineKey(line.productId, line.variantId),
      lineTotal: line.snapshot.price * line.quantity,
    }));

    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const savings = lines.reduce((sum, line) => {
      const compare = line.snapshot.compareAtPrice;
      if (compare && compare > line.snapshot.price) {
        return sum + (compare - line.snapshot.price) * line.quantity;
      }
      return sum;
    }, 0);
    const qualifiesForFreeShipping = subtotal >= siteConfig.freeShippingThreshold;

    return {
      ready,
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal,
      savings,
      shipping: 0,
      total: subtotal,
      qualifiesForFreeShipping,
      amountToFreeShipping: Math.max(0, siteConfig.freeShippingThreshold - subtotal),
      addedSignal,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [rawLines, ready, addedSignal, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
