import { hashValue } from "./storage";

const OTP_LENGTH = 6;

export function randomOtp() {
  const bytes = crypto.getRandomValues(new Uint8Array(OTP_LENGTH));
  return Array.from(bytes, (byte) => String(byte % 10)).join("");
}

export async function hashOtp(phone: string, code: string) {
  return hashValue(`${phone}:${code}`);
}

export function normalizeOtp(value: string) {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LENGTH_DIGITS = OTP_LENGTH;
