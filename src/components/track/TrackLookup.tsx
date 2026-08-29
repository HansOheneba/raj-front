"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { normalizeTrackingNumber } from "@/lib/orders";

export function TrackLookup({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={(event) => {
        event.preventDefault();
        const trackingNumber = normalizeTrackingNumber(value);
        if (!trackingNumber) return;
        router.push(`/track/${encodeURIComponent(trackingNumber)}`);
      }}
    >
      <Field label="Tracking number" htmlFor="tracking-number" hint="Try RK-73262.">
        <Input
          id="tracking-number"
          name="number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="RK-73262"
          required
        />
      </Field>
      <Button type="submit">Track order</Button>
    </form>
  );
}
