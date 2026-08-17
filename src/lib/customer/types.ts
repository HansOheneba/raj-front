export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
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
  line: string;
  mapsUrl?: string;
  isDefault: boolean;
};

export type AddressInput = {
  label: string;
  name: string;
  phone: string;
  region: string;
  line: string;
  mapsUrl?: string;
  isDefault?: boolean;
};

export type AuthReason = "checkout" | "saved" | "account";

export type RequestCodeInput = {
  email: string;
  profile?: {
    name: string;
    phone: string;
  };
};

export type AuthResult = { ok: true } | { ok: false; message: string };

export type RequestCodeResult = AuthResult & { code?: string };

export type VerifyCodeResult = AuthResult & { needsProfile?: boolean };
