export const siteConfig = {
  name: "RAJ KOLLECTIONS",
  shortName: "Raj",
  tagline: "Hard-to-find goods, made easy.",
  description:
    "Raj Kollections. UK and US goods you won't easily find on Accra shelves, delivered across the city.",
  url: "https://rajkollections.example",
  currency: "GHS",
  locale: "en-GH",
  freeShippingThreshold: 350,
  shippingFee: 25,
  deliveryNote: "Delivery takes about 72 working hours.",
  contact: {
    email: "hello@rajkollections.com",
    phone: "+233 24 521 2060",
    whatsapp: "233245212060",
    address: ["Accra", "Ghana"],
    hours: [
      { days: "Monday-Friday", time: "9:00-19:00" },
      { days: "Saturday", time: "10:00-18:00" },
      { days: "Sunday", time: "Closed" },
    ],
  },
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/raj_kollections/" },
    { label: "WhatsApp", href: "https://wa.me/233245212060" },
  ],
} as const;
