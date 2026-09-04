"use client";

import { useState } from "react";
import { Loader2, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCustomer } from "./CustomerProvider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AddressPhoneField } from "./AddressPhoneField";
import { Textarea } from "@/components/ui/textarea";
import { LocationFields } from "./LocationFields";
import { MapsLinkField } from "./MapsLinkField";
import { formatLocationLine } from "@/lib/customer/locations";
import { formatGhanaPhone } from "@/lib/phone";
import type { AddressInput, CustomerAddress } from "@/lib/customer/types";

function AddressFormFields({
  address,
  idPrefix,
  accountPhone,
}: {
  address?: CustomerAddress;
  idPrefix: string;
  accountPhone: string;
}) {
  return (
    <>
      <Field label="Label" htmlFor={`${idPrefix}-label`} hint="Home, work, family. Optional.">
        <Input
          id={`${idPrefix}-label`}
          name="label"
          defaultValue={address?.label}
          placeholder="Home"
        />
      </Field>
      <Field label="Full name" htmlFor={`${idPrefix}-name`} required>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          required
          autoComplete="name"
          defaultValue={address?.name}
        />
      </Field>
      <AddressPhoneField
        idPrefix={idPrefix}
        accountPhone={accountPhone}
        defaultPhone={address?.phone}
      />
      <LocationFields
        idPrefix={idPrefix}
        defaultRegion={address?.region}
        defaultCity={address?.city}
      />
      <Field label="Street address" htmlFor={`${idPrefix}-line`} required hint="House number, street, landmark.">
        <Textarea
          id={`${idPrefix}-line`}
          name="line"
          required
          rows={3}
          defaultValue={address?.line}
          placeholder="Street, landmark, directions"
        />
      </Field>
      <MapsLinkField id={`${idPrefix}-maps`} defaultValue={address?.mapsUrl} />
    </>
  );
}

function draftFromForm(form: FormData): AddressInput {
  return {
    label: String(form.get("label") ?? ""),
    name: String(form.get("name") ?? ""),
    phone: String(form.get("phone") ?? ""),
    region: String(form.get("region") ?? ""),
    city: String(form.get("city") ?? ""),
    line: String(form.get("line") ?? ""),
    mapsUrl: String(form.get("mapsUrl") ?? ""),
  };
}

export function AddressBook({ showHeading = true }: { showHeading?: boolean }) {
  const { customer, addresses, addAddress, updateAddress, removeAddress, setDefaultAddress } =
    useCustomer();
  const [mode, setMode] = useState<{ type: "idle" } | { type: "add" } | { type: "edit"; id: string }>({
    type: "idle",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!customer) return null;

  const editing = mode.type === "edit" ? addresses.find((item) => item.id === mode.id) : undefined;
  const isEditing = mode.type === "edit";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const draft = draftFromForm(new FormData(form));
    setPending(true);
    setError(null);

    try {
      const result = isEditing ? await updateAddress(mode.id, draft) : await addAddress(draft);
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(isEditing ? "Address updated." : "Address saved.");
      setMode({ type: "idle" });
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not save that address. Try again.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className={showHeading ? "mt-8" : "mt-6"}>
      <div className="flex items-center justify-between gap-3">
        {showHeading ? <h3 className="label-xs text-ink">Addresses</h3> : <span />}
        {mode.type === "idle" && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode({ type: "add" });
            }}
            className="inline-flex items-center gap-1 text-[12px] text-clay hover:text-clay-dark"
          >
            <Plus size={13} strokeWidth={1.5} />
            Add address
          </button>
        )}
      </div>

      {mode.type !== "idle" ? (
        <form
          noValidate
          onSubmit={submit}
          className="mt-3 flex flex-col gap-3.5 border-t border-line pt-4"
        >
          <AddressFormFields
            idPrefix={mode.type === "edit" ? "edit-address" : "new-address"}
            address={editing}
            accountPhone={customer.phone}
          />
          {error && <p className="text-[13px] text-sale">{error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {isEditing ? "Saving" : "Adding"}
                </>
              ) : (
                isEditing ? "Save address" : "Add address"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setError(null);
                setMode({ type: "idle" });
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : addresses.length === 0 ? (
        <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-muted">
          No saved addresses yet. Add one so checkout is quicker next time.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line border-t border-line">
          {addresses.map((address) => (
            <li key={address.id} className="py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-medium text-ink">{address.label}</p>
                    {address.isDefault && (
                      <span className="label-xs text-clay">Default</span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-ink">{address.name}</p>
                  <p className="text-[12px] text-ink-muted">{formatGhanaPhone(address.phone)}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                    {formatLocationLine({
                      line: address.line,
                      city: address.city,
                      region: address.region,
                    })}
                  </p>
                  {address.mapsUrl && (
                    <a
                      href={address.mapsUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 inline-flex items-center gap-1 text-[12px] text-clay underline decoration-clay/40 underline-offset-2"
                    >
                      <MapPin size={12} strokeWidth={1.5} />
                      Open in Google Maps
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-3 text-[11px]">
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefaultAddress(address.id)}
                    className="text-ink-muted underline decoration-line-strong underline-offset-2 hover:text-ink"
                  >
                    Make default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode({ type: "edit", id: address.id });
                  }}
                  className="text-ink-muted underline decoration-line-strong underline-offset-2 hover:text-ink"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeAddress(address.id)}
                  className="text-ink-faint underline decoration-line-strong underline-offset-2 hover:text-sale"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
