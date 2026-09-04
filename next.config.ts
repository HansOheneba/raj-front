import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "portal.rajkollections.com",
        pathname: "/**",
      },
      ...(isDevelopment
        ? [
            { protocol: "http" as const, hostname: "localhost", pathname: "/**" },
            { protocol: "http" as const, hostname: "127.0.0.1", pathname: "/**" },
          ]
        : []),
    ],
    // Next 16 rejects remote images on local IPs unless this is enabled.
    dangerouslyAllowLocalIP: isDevelopment,
  },
};

export default nextConfig;
