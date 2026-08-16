/**
 * Brand marks aren't shipped by lucide, so the three we use are inlined here at
 * the same 14px / 1.5 stroke weight as the rest of the icon set.
 */
export function SocialIcon({ name, size = 14 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "Instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="3.75" />
          <circle cx="17.2" cy="6.8" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      );
    case "Facebook":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <path d="M15.2 8.2h-1.5c-1 0-1.7.7-1.7 1.8V12m0 0v5m0-5h-2.2m2.2 0h2.2" />
        </svg>
      );
    case "WhatsApp":
      return (
        <svg {...common}>
          <path d="M12 3a9 9 0 0 0-7.7 13.6L3.2 21l4.5-1.2A9 9 0 1 0 12 3Z" />
          <path d="M9 8.6c.3-.6 1-.6 1.3 0l.5 1c.2.4.1.7-.2 1-.3.3-.3.5-.1.8.4.7 1 1.3 1.8 1.7.3.1.5.1.8-.2.3-.3.6-.4 1-.2l1 .5c.6.3.6 1 0 1.3-1 .5-2 .4-3.1-.2a8.4 8.4 0 0 1-3.3-3.3c-.6-1.1-.7-2-.2-3Z" />
        </svg>
      );
    default:
      return null;
  }
}
