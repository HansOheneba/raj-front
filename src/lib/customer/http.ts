import type {
  AddressInput,
  Customer,
  CustomerAddress,
  RequestCodeInput,
  VerifyCodeResult,
} from "./types";

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
    throw new Error(`Customer request failed: ${response.status} ${path}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function requestAuthCode(input: RequestCodeInput): Promise<{ ok: boolean }> {
  return requestJson("/auth/request-code", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyAuthCode(
  phone: string,
  code: string,
): Promise<VerifyCodeResult & { token?: string }> {
  return requestJson("/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
}

export async function completeProfile(name: string): Promise<{ customer: Customer }> {
  return requestJson("/auth/complete-profile", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function logout(): Promise<void> {
  await requestJson("/auth/logout", { method: "POST" });
}

export async function getCustomer(): Promise<Customer> {
  return requestJson("/customer/me");
}

export async function listAddresses(): Promise<CustomerAddress[]> {
  return requestJson("/customer/addresses");
}

export async function createAddress(input: AddressInput): Promise<CustomerAddress> {
  return requestJson("/customer/addresses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAddress(
  id: string,
  input: Partial<AddressInput>,
): Promise<CustomerAddress> {
  return requestJson(`/customer/addresses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteAddress(id: string): Promise<void> {
  await requestJson(`/customer/addresses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
