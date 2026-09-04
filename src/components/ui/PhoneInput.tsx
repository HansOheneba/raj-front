"use client";

import { useState } from "react";
import { ghanaNationalNumber, parseGhanaPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

export function PhoneInput({
  id,
  name = "phone",
  required,
  defaultValue,
  autoComplete = "tel-national",
  className,
  onE164Change,
}: {
  id?: string;
  name?: string;
  required?: boolean;
  defaultValue?: string;
  autoComplete?: string;
  className?: string;
  onE164Change?: (value: string | null) => void;
}) {
  const [national, setNational] = useState(() => ghanaNationalNumber(defaultValue ?? ""));
  const e164 = parseGhanaPhone(national);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextNational = ghanaNationalNumber(event.target.value);
    setNational(nextNational);
    onE164Change?.(parseGhanaPhone(nextNational));
  };

  return (
    <div
      className={cn(
        "flex h-9 w-full items-center rounded-md border border-input bg-cream text-[13px] text-foreground transition-[border-color] duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:border-line-strong focus-within:border-clay",
        className,
      )}
    >
      <span className="shrink-0 pl-3 text-ink-muted">+233</span>
      <input
        id={id}
        value={national}
        onChange={handleChange}
        required={required}
        minLength={9}
        maxLength={9}
        pattern="[0-9]{9}"
        inputMode="numeric"
        autoComplete={autoComplete}
        placeholder="24 123 4567"
        aria-label="Phone number"
        className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[13px] text-foreground placeholder:text-ink-faint outline-none"
      />
      <input type="hidden" name={name} value={e164 ?? ""} />
    </div>
  );
}
