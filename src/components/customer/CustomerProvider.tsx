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
import { ApiError, isApiEnabled } from "@/lib/api";
import { normalizeMapsUrl } from "@/lib/customer/maps";
import { isValidCity } from "@/lib/customer/locations";
import { isValidGhanaRegion } from "@/lib/customer/regions";
import { requestAuthCodeAction, verifyAuthCodeAction, completeProfileAction, logoutAction } from "@/lib/customer/auth-actions";
import {
  createAddress as createAddressApi,
  deleteAddress as deleteAddressApi,
  getCustomer as getCustomerApi,
  listAddresses as listAddressesApi,
  updateAddress as updateAddressApi,
} from "@/lib/customer/http";
import { parseGhanaPhone, toApiPhone } from "@/lib/phone";
import { hashOtp, OTP_MAX_ATTEMPTS, OTP_TTL_MS, normalizeOtp, randomOtp } from "@/lib/customer/otp";
import {
  hashesMatch,
  normalizePhone,
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
  phone: string;
  hash: string;
  expiresAt: number;
  attempts: number;
  profile?: { name: string };
};

type CustomerContextValue = {
  ready: boolean;
  customer: Customer | null;
  addresses: CustomerAddress[];
  requestCode: (input: RequestCodeInput) => Promise<RequestCodeResult>;
  verifyCode: (phone: string, code: string) => Promise<VerifyCodeResult>;
  completeProfile: (input: { name: string }) => Promise<AuthResult>;
  addAddress: (input: AddressInput) => Promise<AuthResult>;
  updateAddress: (id: string, input: AddressInput) => Promise<AuthResult>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
  authOpen: boolean;
  authReason: AuthReason;
  requestAuth: (reason: AuthReason) => boolean;
  closeAuth: () => void;
};

const CustomerContext = createContext<CustomerContextValue | null>(null);

function validateName(name: string): { ok: true; name: string } | { ok: false; message: string } {
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return { ok: false, message: "Enter the name we should use on your orders." };
  }
  return { ok: true, name: trimmedName };
}

function validateAddress(
  input: AddressInput,
): { ok: true; address: Omit<CustomerAddress, "id"> } | { ok: false; message: string } {
  const label = input.label.trim() || "Saved address";
  const name = input.name.trim();
  const phone = parseGhanaPhone(input.phone);
  const region = input.region.trim();
  const city = input.city.trim();
  const line = input.line.trim();
  const maps = normalizeMapsUrl(input.mapsUrl ?? "");

  if (name.length < 2) return { ok: false, message: "Enter the name for this address." };
  if (!phone) return { ok: false, message: "Enter a valid phone number." };
  if (!region || !isValidGhanaRegion(region)) return { ok: false, message: "Choose a region." };
  if (!city || !isValidCity(region, city)) return { ok: false, message: "Choose a city." };
  if (line.length < 4) return { ok: false, message: "Enter a delivery address." };
  if (!maps.ok) return { ok: false, message: "Paste a Google Maps link, or leave this blank." };

  return {
    ok: true,
    address: {
      label,
      name,
      phone,
      region,
      city,
      line,
      mapsUrl: maps.url,
      isDefault: Boolean(input.isDefault),
    },
  };
}

function findCustomerByPhone(phone: string) {
  return readCustomers().find((row) => row.phone === phone);
}

async function loadApiSession(
  setCustomer: (customer: Customer | null) => void,
  setAddresses: (addresses: CustomerAddress[]) => void,
) {
  try {
    const me = await getCustomerApi();
    setCustomer(me);
    const saved = await listAddressesApi();
    setAddresses(saved);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      setCustomer(null);
      setAddresses([]);
    }
  }
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<AuthReason>("account");
  const challengeRef = useRef<OtpChallenge | null>(null);
  const verifiedPhoneRef = useRef<string | null>(null);

  useEffect(() => {
    if (isApiEnabled) {
      void loadApiSession(setCustomer, setAddresses).finally(() => setReady(true));
      return;
    }

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
    writeCustomers([...customers.filter((row) => row.phone !== record.phone), nextRecord]);
    writeSessionId(record.id);
    setCustomer(toCustomer(nextRecord));
    setAddresses(readAddresses(record.id));
    setAuthOpen(false);
    challengeRef.current = null;
    verifiedPhoneRef.current = null;
  }, []);

  const requestCode = useCallback(async (input: RequestCodeInput): Promise<RequestCodeResult> => {
    if (isApiEnabled) {
      const phone = toApiPhone(input.phone);
      if (!phone) return { ok: false, message: "Enter a valid phone number." };

      let profile: { name: string } | undefined;
      if (input.profile) {
        const validated = validateName(input.profile.name);
        if (!validated.ok) return validated;
        profile = { name: validated.name };
      }

      try {
        const response = await requestAuthCodeAction({ phone, profile });
        verifiedPhoneRef.current = phone;
        return { ok: true, code: response.demoCode ?? response.code };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Could not send a code. Try again.",
        };
      }
    }

    const phone = normalizePhone(input.phone);
    if (!phone) return { ok: false, message: "Enter a valid phone number." };

    let challengeProfile: { name: string } | undefined;

    if (input.profile) {
      const profile = validateName(input.profile.name);
      if (!profile.ok) return profile;
      if (findCustomerByPhone(phone)) {
        return {
          ok: false,
          message: "An account with this number already exists. Sign in instead.",
        };
      }
      challengeProfile = { name: profile.name };
    }

    const code = randomOtp();
    challengeRef.current = {
      phone,
      hash: await hashOtp(phone, code),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
      profile: challengeProfile,
    };
    verifiedPhoneRef.current = null;
    return { ok: true, code };
  }, []);

  const verifyCode = useCallback(async (phone: string, code: string): Promise<VerifyCodeResult> => {
    if (isApiEnabled) {
      const apiPhone = toApiPhone(phone) ?? verifiedPhoneRef.current;
      if (!apiPhone) {
        return { ok: false, message: "Enter a valid phone number." };
      }

      const otp = normalizeOtp(code);
      if (otp.length !== 6) {
        return { ok: false, message: "Enter the 6-digit code." };
      }

      try {
        const result = await verifyAuthCodeAction(apiPhone, otp);
        if (!result.ok) return result;
        if (result.needsProfile) {
          verifiedPhoneRef.current = apiPhone;
          return { ok: true, needsProfile: true };
        }

        const nextCustomer = result.customer ?? (await getCustomerApi());
        setCustomer(nextCustomer);
        setAddresses(await listAddressesApi());
        setAuthOpen(false);
        verifiedPhoneRef.current = null;
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : "That code doesn't match. Try again.",
        };
      }
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return { ok: false, message: "Enter a valid phone number." };
    }

    const otp = normalizeOtp(code);
    const challenge = challengeRef.current;

    if (!challenge || challenge.phone !== normalizedPhone) {
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

    const incoming = await hashOtp(normalizedPhone, otp);
    if (!hashesMatch(challenge.hash, incoming)) {
      return { ok: false, message: "That code doesn't match. Try again." };
    }

    const existing = findCustomerByPhone(normalizedPhone);
    if (existing) {
      persistCustomer(existing);
      return { ok: true };
    }

    if (challenge.profile) {
      persistCustomer({
        id: crypto.randomUUID(),
        name: challenge.profile.name,
        phone: normalizedPhone,
      });
      return { ok: true };
    }

    verifiedPhoneRef.current = normalizedPhone;
    challengeRef.current = null;
    return { ok: true, needsProfile: true };
  }, [persistCustomer]);

  const completeProfile = useCallback(async (input: { name: string }): Promise<AuthResult> => {
    const profile = validateName(input.name);
    if (!profile.ok) return profile;

    if (isApiEnabled) {
      try {
        const { customer: nextCustomer } = await completeProfileAction(profile.name);
        setCustomer(nextCustomer);
        setAddresses(await listAddressesApi());
        setAuthOpen(false);
        verifiedPhoneRef.current = null;
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Could not save your name. Try again.",
        };
      }
    }

    const phone = verifiedPhoneRef.current;
    if (!phone) return { ok: false, message: "Request a new code and try again." };
    persistCustomer({
      id: crypto.randomUUID(),
      name: profile.name,
      phone,
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
    async (input: AddressInput): Promise<AuthResult> => {
      if (!customer) return { ok: false, message: "Sign in to save an address." };
      const result = validateAddress(input);
      if (!result.ok) return result;

      if (isApiEnabled) {
        try {
          await createAddressApi({
            ...result.address,
            isDefault: addresses.length === 0 || result.address.isDefault,
          });
          const saved = await listAddressesApi();
          setAddresses(saved);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Could not save that address.",
          };
        }
      }

      const isFirst = addresses.length === 0;
      const nextItem: CustomerAddress = {
        ...result.address,
        id: crypto.randomUUID(),
        isDefault: isFirst || result.address.isDefault,
      };
      const next = nextItem.isDefault
        ? [nextItem, ...addresses.map((item) => ({ ...item, isDefault: false }))]
        : [...addresses, nextItem];
      try {
        persistAddresses(next);
        return { ok: true };
      } catch {
        return { ok: false, message: "Could not save that address. Try again." };
      }
    },
    [addresses, customer, persistAddresses],
  );

  const updateAddress = useCallback(
    async (id: string, input: AddressInput): Promise<AuthResult> => {
      if (!customer) return { ok: false, message: "Sign in to save an address." };
      const result = validateAddress(input);
      if (!result.ok) return result;
      const current = addresses.find((item) => item.id === id);
      if (!current) return { ok: false, message: "That address is no longer saved." };

      if (isApiEnabled) {
        try {
          await updateAddressApi(id, {
            ...result.address,
            isDefault: result.address.isDefault || current.isDefault,
          });
          const saved = await listAddressesApi();
          setAddresses(saved);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Could not update that address.",
          };
        }
      }

      const nextItem: CustomerAddress = {
        ...result.address,
        id,
        isDefault: result.address.isDefault || current.isDefault,
      };
      try {
        persistAddresses(
          addresses.map((item) => {
            if (item.id === id) return nextItem;
            return nextItem.isDefault ? { ...item, isDefault: false } : item;
          }),
        );
        return { ok: true };
      } catch {
        return { ok: false, message: "Could not update that address. Try again." };
      }
    },
    [addresses, customer, persistAddresses],
  );

  const removeAddress = useCallback(
    async (id: string) => {
      if (!customer) return;

      if (isApiEnabled) {
        try {
          await deleteAddressApi(id);
        } catch {
          return;
        }
      }

      const remaining = addresses.filter((item) => item.id !== id);
      if (remaining.length > 0 && !remaining.some((item) => item.isDefault)) {
        remaining[0] = { ...remaining[0], isDefault: true };
      }

      if (isApiEnabled) {
        setAddresses(remaining);
        return;
      }

      persistAddresses(remaining);
    },
    [addresses, customer, persistAddresses],
  );

  const setDefaultAddress = useCallback(
    async (id: string) => {
      if (!customer) return;

      if (isApiEnabled) {
        try {
          const updated = await updateAddressApi(id, { isDefault: true });
          setAddresses(
            addresses.map((item) => ({
              ...item,
              isDefault: item.id === updated.id,
            })),
          );
        } catch {
          return;
        }
        return;
      }

      persistAddresses(addresses.map((item) => ({ ...item, isDefault: item.id === id })));
    },
    [addresses, customer, persistAddresses],
  );

  const signOut = useCallback(async () => {
    if (isApiEnabled) {
      try {
        await logoutAction();
      } catch {
        // Clear local state even if logout fails.
      }
    } else {
      writeSessionId(null);
    }

    setCustomer(null);
    setAddresses([]);
    challengeRef.current = null;
    verifiedPhoneRef.current = null;
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
