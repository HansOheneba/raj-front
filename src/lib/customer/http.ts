import { ApiError, api } from "@/lib/api";
import { parseGhanaPhone, toApiPhone } from "@/lib/phone";
import type {
  AddressInput,
  Customer,
  CustomerAddress,
  ProfileUpdate,
  RequestCodeInput,
  RequestCodeResponse,
  VerifyCodeResult,
  VerifyEmailResult,
} from "./types";

export function normalizeCustomerAddress(address: CustomerAddress): CustomerAddress {
  const phone = parseGhanaPhone(address.phone) ?? address.phone;

  return {
    ...address,
    label: address.label?.trim() || "Saved address",
    phone,
    city: address.city?.trim() ?? "",
    mapsUrl: address.mapsUrl?.trim() || undefined,
  };
}

function serializeAddressInput(input: AddressInput): AddressInput {
  const phone = toApiPhone(input.phone);
  if (!phone) {
    throw new ApiError("Enter a valid phone number.", 400);
  }

  const mapsUrl = input.mapsUrl?.trim();

  return {
    ...input,
    label: input.label.trim() || "Saved address",
    phone,
    mapsUrl: mapsUrl || undefined,
  };
}

export async function requestAuthCode(input: RequestCodeInput): Promise<RequestCodeResponse> {
  return api("/auth/request-code", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyAuthCode(phone: string, code: string): Promise<VerifyCodeResult> {
  return api<VerifyCodeResult>("/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
}

export async function completeProfile(name: string): Promise<{ customer: Customer }> {
  return api("/auth/complete-profile", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function logout(): Promise<void> {
  await api("/auth/logout", { method: "POST" });
}

export async function getCustomer(): Promise<Customer> {
  return api("/customer/me");
}

export async function updateCustomerProfile(input: ProfileUpdate): Promise<Customer> {
  return api("/customer/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function resendEmailVerification(): Promise<Customer> {
  return api("/customer/email/resend", { method: "POST" });
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  return api("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function listAddresses(): Promise<CustomerAddress[]> {
  const addresses = await api<CustomerAddress[]>("/customer/addresses");
  return Array.isArray(addresses) ? addresses.map(normalizeCustomerAddress) : [];
}

export async function createAddress(input: AddressInput): Promise<CustomerAddress> {
  const created = await api<CustomerAddress>("/customer/addresses", {
    method: "POST",
    body: JSON.stringify(serializeAddressInput(input)),
  });
  return normalizeCustomerAddress(created);
}

export async function updateAddress(
  id: string,
  input: Partial<AddressInput>,
): Promise<CustomerAddress> {
  const payload: Partial<AddressInput> = { ...input };
  if (input.phone !== undefined) {
    const phone = toApiPhone(input.phone);
    if (!phone) {
      throw new ApiError("Enter a valid phone number.", 400);
    }
    payload.phone = phone;
  }
  if (input.mapsUrl !== undefined) {
    const mapsUrl = input.mapsUrl.trim();
    payload.mapsUrl = mapsUrl || undefined;
  }
  if (input.label !== undefined) {
    payload.label = input.label.trim() || "Saved address";
  }

  const updated = await api<CustomerAddress>(`/customer/addresses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return normalizeCustomerAddress(updated);
}

export async function deleteAddress(id: string): Promise<void> {
  await api(`/customer/addresses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
