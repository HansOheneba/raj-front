export type Customer = {
  id: string;
  name: string;
  phone: string;
  /** Verified email only. Unconfirmed addresses live in `pendingEmail`. */
  email?: string;
  pendingEmail?: string;
  /** ISO date `YYYY-MM-DD`. Optional. */
  dateOfBirth?: string;
};

export type CustomerRecord = Customer & {
  createdAt: string;
};

export type CustomerAddress = {
  id: string;
  label: string;
  name: string;
  phone: string;
  region: string;
  city: string;
  line: string;
  mapsUrl?: string;
  isDefault: boolean;
};

export type AddressInput = {
  label: string;
  name: string;
  phone: string;
  region: string;
  city: string;
  line: string;
  mapsUrl?: string;
  isDefault?: boolean;
};

export type AuthReason = "checkout" | "saved" | "account" | "order";

export type RequestCodeInput = {
  phone: string;
  profile?: {
    name: string;
  };
};

export type AuthResult = { ok: true } | { ok: false; message: string };

export type RequestCodeResponse = { ok: boolean; code?: string; demoCode?: string };

export type RequestCodeResult = AuthResult & { code?: string };

export type VerifyCodeResult = AuthResult & {
  needsProfile?: boolean;
  customer?: Customer;
};

export type ProfileUpdate = {
  dateOfBirth?: string | null;
  email?: string | null;
};

export type ProfileUpdateResult = AuthResult & {
  demoVerifyUrl?: string;
};

export type VerifyEmailResult = AuthResult & {
  customer?: Customer;
};
