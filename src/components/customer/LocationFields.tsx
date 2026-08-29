"use client";

import { useMemo, useState } from "react";
import { Field } from "@/components/ui/field";
import { getCitiesForRegion } from "@/lib/customer/locations";
import { defaultGhanaRegion, ghanaRegions, isValidGhanaRegion } from "@/lib/customer/regions";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-cream px-3 text-[13px] outline-none";

type LocationFieldsProps = {
  idPrefix: string;
  defaultRegion?: string;
  defaultCity?: string;
  className?: string;
};

function resolveRegion(region?: string) {
  return region && isValidGhanaRegion(region) ? region : defaultGhanaRegion;
}

function resolveCity(region: string, city?: string) {
  const cities = getCitiesForRegion(region);
  if (city && cities.some((item) => item.toLowerCase() === city.toLowerCase())) {
    return cities.find((item) => item.toLowerCase() === city.toLowerCase()) ?? cities[0] ?? "";
  }
  return cities[0] ?? "";
}

export function LocationFields({
  idPrefix,
  defaultRegion,
  defaultCity,
  className,
}: LocationFieldsProps) {
  const initialRegion = resolveRegion(defaultRegion);
  const [region, setRegion] = useState(initialRegion);
  const [city, setCity] = useState(() => resolveCity(initialRegion, defaultCity));

  const cities = useMemo(() => getCitiesForRegion(region), [region]);

  const onRegionChange = (nextRegion: string) => {
    setRegion(nextRegion);
    setCity(resolveCity(nextRegion));
  };

  return (
    <div className={cn("flex flex-col gap-3.5", className)}>
      <Field label="Region" htmlFor={`${idPrefix}-region`} required>
        <select
          id={`${idPrefix}-region`}
          name="region"
          required
          value={region}
          onChange={(event) => onRegionChange(event.target.value)}
          className={selectClassName}
        >
          {ghanaRegions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>

      <Field label="City" htmlFor={`${idPrefix}-city`} required>
        <select
          id={`${idPrefix}-city`}
          name="city"
          required
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className={selectClassName}
        >
          {cities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
