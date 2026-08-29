export const siteConfig = {
  name: "RAJ KOLLECTIONS",
  shortName: "Raj",
  tagline: "Everyday essentials, and a little more.",
  description:
    "Everyday essentials, beauty, fashion and hard-to-find favourites. Shop from anywhere in Ghana.",
  url: "https://www.rajkollections.com",
  currency: "GHS",
  locale: "en-GH",
  freeShippingThreshold: 350,
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
