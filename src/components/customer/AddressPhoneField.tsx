"use client";

import { useState } from "react";
import { Field } from "@/components/ui/field";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { formatGhanaPhone, parseGhanaPhone } from "@/lib/phone";

function phonesMatch(left: string, right: string): boolean {
  const normalizedLeft = parseGhanaPhone(left);
  const normalizedRight = parseGhanaPhone(right);
  return normalizedLeft !== null && normalizedLeft === normalizedRight;
}

export function AddressPhoneField({
  idPrefix,
  accountPhone,
  defaultPhone,
}: {
  idPrefix: string;
  accountPhone: string;
  defaultPhone?: string;
}) {
  const initialUseAccount = !defaultPhone || phonesMatch(defaultPhone, accountPhone);
  const [useAccountPhone, setUseAccountPhone] = useState(initialUseAccount);
  const [customPhone, setCustomPhone] = useState(() => {
    if (!initialUseAccount && defaultPhone) return defaultPhone;
    return accountPhone;
  });

  const activePhone = useAccountPhone ? accountPhone : customPhone;
  const formattedActive = activePhone ? formatGhanaPhone(activePhone) : null;

  return (
    <Field
      label="Phone"
      htmlFor={useAccountPhone ? undefined : `${idPrefix}-phone`}
      required
      hint="This is the number the rider will call when they arrive at this location."
    >
      <label
        className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line bg-cream px-3 py-2.5 text-[13px]"
      >
        <input
          type="checkbox"
          checked={useAccountPhone}
          onChange={(event) => {
            const checked = event.target.checked;
            setUseAccountPhone(checked);
            if (!checked && !customPhone) {
              setCustomPhone(defaultPhone || accountPhone);
            }
          }}
          className="mt-0.5"
        />
        <span>
          <span className="font-medium text-ink">Same as the number used to setup my account</span>
          <span className="mt-0.5 block text-ink-muted">{formatGhanaPhone(accountPhone)}</span>
        </span>
      </label>

      {useAccountPhone ? (
        <input type="hidden" name="phone" value={accountPhone} />
      ) : (
        <PhoneInput
          key={`${idPrefix}-phone-custom`}
          id={`${idPrefix}-phone`}
          name="phone"
          required
          defaultValue={customPhone}
          onE164Change={(value) => setCustomPhone(value ?? "")}
        />
      )}

      {formattedActive && (
        <p className="text-[12px] text-ink-muted">
          Rider will call{" "}
          <span className="font-medium text-ink">{formattedActive}</span>
        </p>
      )}
    </Field>
  );
}
