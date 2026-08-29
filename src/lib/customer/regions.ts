import { getRegions, isValidRegion } from "ghana-locations";

export const defaultGhanaRegion = "Greater Accra";

export const ghanaRegions = getRegions()
  .map((region) => region.name)
  .sort((left, right) => left.localeCompare(right));

export type GhanaRegion = (typeof ghanaRegions)[number];

export const isValidGhanaRegion = isValidRegion;
