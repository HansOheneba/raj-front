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
import { normalizeMapsUrl } from "@/lib/customer/maps";
import { parseGhanaPhone } from "@/lib/phone";
import { hashOtp, OTP_MAX_ATTEMPTS, OTP_TTL_MS, normalizeOtp, randomOtp } from "@/lib/customer/otp";
import {
  hashesMatch,
  normalizeEmail,
  readAddresses,
  readCustomers,
  readSessionId,
  toCustomer,
  writeAddresses,
  writeCustomers,
  writeSessionId,
} from "@/lib/customer/storage";
import type {
  AddressInput,
  AuthReason,
  AuthResult,
  Customer,
  CustomerAddress,
  RequestCodeInput,
  RequestCodeResult,
  VerifyCodeResult,
} from "@/lib/customer/types";

type OtpChallenge = {
  email: string;
  hash: string;
  expiresAt: number;
  attempts: number;
  profile?: { name: string; phone: string };
};

type CustomerContextValue = {
  ready: boolean;
  customer: Customer | null;
  addresses: CustomerAddress[];
  requestCode: (input: RequestCodeInput) => Promise<RequestCodeResult>;
  verifyCode: (email: string, code: string) => Promise<VerifyCodeResult>;
  completeProfile: (input: { name: string; phone: string }) => Promise<AuthResult>;
  addAddress: (input: AddressInput) => AuthResult;
  updateAddress: (id: string, input: AddressInput) => AuthResult;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  signOut: () => void;
  authOpen: boolean;
  authReason: AuthReason;
  requestAuth: (reason: AuthReason) => boolean;
  closeAuth: () => void;
};

const CustomerContext = createContext<CustomerContextValue | null>(null);

function validateProfile(
  name: string,
  phone: string,
): { ok: true; name: string; phone: string } | { ok: false; message: string } {
  const trimmedName = name.trim();
  const parsedPhone = parseGhanaPhone(phone);
  if (trimmedName.length < 2) {
    return { ok: false, message: "Enter the name we should use on your orders." };
  }
  if (!parsedPhone) {
    return { ok: false, message: "Enter a valid phone number." };
  }
  return { ok: true, name: trimmedName, phone: parsedPhone };
}

function validateAddress(
  input: AddressInput,
): { ok: true; address: Omit<CustomerAddress, "id"> } | { ok: false; message: string } {
  const label = input.label.trim() || "Saved address";
  const name = input.name.trim();
  const phone = parseGhanaPhone(input.phone);
  const region = input.region.trim();
  const line = input.line.trim();
  const maps = normalizeMapsUrl(input.mapsUrl ?? "");

  if (name.length < 2) return { ok: false, message: "Enter the name for this address." };
  if (!phone) return { ok: false, message: "Enter a valid phone number." };
  if (!region) return { ok: false, message: "Choose a region." };
  if (line.length < 4) return { ok: false, message: "Enter a delivery address." };
  if (!maps.ok) return { ok: false, message: "Paste a Google Maps link, or leave this blank." };

  return {
    ok: true,
    address: {
      label,
      name,
      phone,
      region,
      line,
      mapsUrl: maps.url,
      isDefault: Boolean(input.isDefault),
    },
  };
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<AuthReason>("account");
  const challengeRef = useRef<OtpChallenge | null>(null);
  const verifiedEmailRef = useRef<string | null>(null);

  useEffect(() => {
    const sessionId = readSessionId();
    if (sessionId) {
      const match = readCustomers().find((row) => row.id === sessionId);
      if (match) {
        setCustomer(toCustomer(match));
        setAddresses(readAddresses(match.id));
      } else {
        writeSessionId(null);
      }
    }
    setReady(true);
  }, []);

  const persistCustomer = useCallback((record: Customer & { createdAt?: string }) => {
    const customers = readCustomers();
    const nextRecord = {
      ...record,
      createdAt: record.createdAt ?? new Date().toISOString(),
    };
    writeCustomers([...customers.filter((row) => row.email !== record.email), nextRecord]);
    writeSessionId(record.id);
    setCustomer(toCustomer(nextRecord));
    setAddresses(readAddresses(record.id));
    setAuthOpen(false);
    challengeRef.current = null;
    verifiedEmailRef.current = null;
  }, []);

  const requestCode = useCallback(async (input: RequestCodeInput): Promise<RequestCodeResult> => {
    const email = normalizeEmail(input.email);
    if (!email.includes("@")) return { ok: false, message: "Enter a valid email." };

    let challengeProfile: { name: string; phone: string } | undefined;

    if (input.profile) {
      const profile = validateProfile(input.profile.name, input.profile.phone);
      if (!profile.ok) return profile;
      if (readCustomers().some((row) => row.email === email)) {
        return { ok: false, message: "An account with this email already exists. Sign in instead." };
      }
      challengeProfile = { name: profile.name, phone: profile.phone };
    }

    const code = randomOtp();
    challengeRef.current = {
      email,
      hash: await hashOtp(email, code),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
      profile: challengeProfile,
    };
    verifiedEmailRef.current = null;
    return { ok: true, code };
  }, []);

  const verifyCode = useCallback(async (email: string, code: string): Promise<VerifyCodeResult> => {
    const normalizedEmail = normalizeEmail(email);
    const otp = normalizeOtp(code);
    const challenge = challengeRef.current;

    if (!challenge || challenge.email !== normalizedEmail) {
      return { ok: false, message: "Request a new code and try again." };
    }
    if (Date.now() > challenge.expiresAt) {
      challengeRef.current = null;
      return { ok: false, message: "That code has expired. Request a new one." };
    }
    if (otp.length !== 6) {
      return { ok: false, message: "Enter the 6-digit code." };
    }

    challenge.attempts += 1;
    if (challenge.attempts > OTP_MAX_ATTEMPTS) {
      challengeRef.current = null;
      return { ok: false, message: "Too many tries. Request a new code." };
    }

    const incoming = await hashOtp(normalizedEmail, otp);
    if (!hashesMatch(challenge.hash, incoming)) {
      return { ok: false, message: "That code doesn't match. Try again." };
    }

    const existing = readCustomers().find((row) => row.email === normalizedEmail);
    if (existing) {
      persistCustomer(existing);
      return { ok: true };
    }

    if (challenge.profile) {
      persistCustomer({
        id: crypto.randomUUID(),
        name: challenge.profile.name,
        email: normalizedEmail,
        phone: challenge.profile.phone,
      });
      return { ok: true };
    }

    verifiedEmailRef.current = normalizedEmail;
    challengeRef.current = null;
    return { ok: true, needsProfile: true };
  }, [persistCustomer]);

  const completeProfile = useCallback(async (input: { name: string; phone: string }): Promise<AuthResult> => {
    const email = verifiedEmailRef.current;
    if (!email) return { ok: false, message: "Request a new code and try again." };
    const profile = validateProfile(input.name, input.phone);
    if (!profile.ok) return profile;
    persistCustomer({
      id: crypto.randomUUID(),
      name: profile.name,
      email,
      phone: profile.phone,
    });
    return { ok: true };
  }, [persistCustomer]);

  const persistAddresses = useCallback(
    (next: CustomerAddress[]) => {
      if (!customer) return;
      writeAddresses(customer.id, next);
      setAddresses(next);
    },
    [customer],
  );

  const addAddress = useCallback(
    (input: AddressInput): AuthResult => {
      if (!customer) return { ok: false, message: "Sign in to save an address." };
      const result = validateAddress(input);
      if (!result.ok) return result;
      const isFirst = addresses.length === 0;
      const nextItem: CustomerAddress = {
        ...result.address,
        id: crypto.randomUUID(),
        isDefault: isFirst || result.address.isDefault,
      };
      const next = nextItem.isDefault
        ? [nextItem, ...addresses.map((item) => ({ ...item, isDefault: false }))]
        : [...addresses, nextItem];
      persistAddresses(next);
      return { ok: true };
    },
    [addresses, customer, persistAddresses],
  );

  const updateAddress = useCallback(
    (id: string, input: AddressInput): AuthResult => {
      if (!customer) return { ok: false, message: "Sign in to save an address." };
      const result = validateAddress(input);
      if (!result.ok) return result;
      const current = addresses.find((item) => item.id === id);
      if (!current) return { ok: false, message: "That address is no longer saved." };
      const nextItem: CustomerAddress = {
        ...result.address,
        id,
        isDefault: result.address.isDefault || current.isDefault,
      };
      persistAddresses(
        addresses.map((item) => {
          if (item.id === id) return nextItem;
          return nextItem.isDefault ? { ...item, isDefault: false } : item;
        }),
      );
      return { ok: true };
    },
    [addresses, customer, persistAddresses],
  );

  const removeAddress = useCallback(
    (id: string) => {
      const remaining = addresses.filter((item) => item.id !== id);
      if (remaining.length > 0 && !remaining.some((item) => item.isDefault)) {
        remaining[0] = { ...remaining[0], isDefault: true };
      }
      persistAddresses(remaining);
    },
    [addresses, persistAddresses],
  );

  const setDefaultAddress = useCallback(
    (id: string) => {
      persistAddresses(addresses.map((item) => ({ ...item, isDefault: item.id === id })));
    },
    [addresses, persistAddresses],
  );

  const signOut = useCallback(() => {
    writeSessionId(null);
    setCustomer(null);
    setAddresses([]);
    challengeRef.current = null;
    verifiedEmailRef.current = null;
  }, []);

  const requestAuth = useCallback((reason: AuthReason) => {
    if (customer) return true;
    setAuthReason(reason);
    setAuthOpen(true);
    return false;
  }, [customer]);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const value = useMemo<CustomerContextValue>(
    () => ({
      ready,
      customer,
      addresses,
      requestCode,
      verifyCode,
      completeProfile,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      signOut,
      authOpen,
      authReason,
      requestAuth,
      closeAuth,
    }),
    [
      ready,
      customer,
      addresses,
      requestCode,
      verifyCode,
      completeProfile,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      signOut,
      authOpen,
      authReason,
      requestAuth,
      closeAuth,
    ],
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomer must be used inside CustomerProvider");
  return context;
}
