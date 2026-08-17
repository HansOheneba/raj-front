export const ghanaRegions = [
  "Greater Accra",
  "Ashanti",
  "Central",
  "Eastern",
  "Northern",
  "Volta",
  "Western",
] as const;

export type GhanaRegion = (typeof ghanaRegions)[number];
